'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock, ChevronLeft, ChevronRight, Loader2, CheckCircle, Wifi } from 'lucide-react'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { toast } from 'sonner'
import type { AvailabilitySlot } from '@/types/database'

type Step = 'date' | 'slot' | 'details' | 'confirmation'

interface BookingForm {
  clientName: string
  clientEmail: string
  clientPhone: string
  notes: string
}

export default function BookPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [liveConnected, setLiveConnected] = useState(false)
  const [bookedAppointment, setBookedAppointment] = useState<{
    receiptNumber: string; date: string; time: string; email: string
  } | null>(null)
  const [form, setForm] = useState<BookingForm>({ clientName: '', clientEmail: '', clientPhone: '', notes: '' })

  const today = startOfDay(new Date())
  const weekStart = addDays(today, weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  const fetchSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true)
    const dateStr = format(date, 'yyyy-MM-dd')
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('slot_date', dateStr)
      .eq('is_available', true)
      .order('start_time')
    setSlots(data ?? [])
    setLoadingSlots(false)
  }, [supabase])

  // Fetch slots when date selected
  useEffect(() => {
    if (!selectedDate) return
    fetchSlots(selectedDate)
  }, [selectedDate, fetchSlots])

  // Real-time slot updates
  useEffect(() => {
    if (!selectedDate) return
    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    const channel = supabase
      .channel(`slots-${dateStr}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability_slots',
          filter: `slot_date=eq.${dateStr}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as AvailabilitySlot
            setSlots(prev => {
              if (!updated.is_available) {
                // Slot was just booked — remove it
                if (selectedSlot?.id === updated.id) {
                  setSelectedSlot(null)
                  if (step === 'details') {
                    toast.error('That slot was just booked. Please choose another.')
                    setStep('slot')
                  }
                }
                return prev.filter(s => s.id !== updated.id)
              }
              // Slot was re-opened — add it back if not already present
              if (!prev.find(s => s.id === updated.id)) {
                return [...prev, updated].sort((a, b) => a.start_time.localeCompare(b.start_time))
              }
              return prev
            })
          } else if (payload.eventType === 'INSERT') {
            const inserted = payload.new as AvailabilitySlot
            if (inserted.is_available) {
              setSlots(prev => {
                if (prev.find(s => s.id === inserted.id)) return prev
                return [...prev, inserted].sort((a, b) => a.start_time.localeCompare(b.start_time))
              })
            }
          } else if (payload.eventType === 'DELETE') {
            setSlots(prev => prev.filter(s => s.id !== (payload.old as AvailabilitySlot).id))
          }
        }
      )
      .subscribe((status) => {
        setLiveConnected(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [selectedDate, supabase, selectedSlot, step])

  // Pre-fill from auth user
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
        if (profile) {
          setForm(prev => ({
            ...prev,
            clientName: profile.full_name ?? prev.clientName,
            clientEmail: profile.email ?? prev.clientEmail,
          }))
        }
      }
    }
    loadUser()
  }, [supabase])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep('slot')
  }

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot)
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || !selectedDate) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone,
          notes: form.notes,
        }),
      })

      const data = await res.json()

      if (res.status === 409) {
        toast.error('That slot was just booked. Please choose another time.')
        setStep('slot')
        setSelectedSlot(null)
        fetchSlots(selectedDate)
        return
      }

      if (!res.ok) {
        throw new Error(data.error ?? 'Booking failed')
      }

      setBookedAppointment({
        receiptNumber: data.receiptNumber,
        date: format(selectedDate, 'EEEE, MMMM d, yyyy'),
        time: `${formatTime(selectedSlot.start_time)} – ${formatTime(selectedSlot.end_time)}`,
        email: form.clientEmail,
      })
      setStep('confirmation')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // --- CONFIRMATION ---
  if (step === 'confirmation' && bookedAppointment) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-16">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">Booking Confirmed!</h1>
            <p className="text-stone-500 mb-6 text-sm">
              A confirmation email has been sent to <strong>{bookedAppointment.email}</strong>.
            </p>
            <div className="bg-stone-50 rounded-xl p-5 text-left space-y-3 mb-6 border border-stone-100">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Receipt</p>
                <p className="font-mono font-semibold text-teal-700">{bookedAppointment.receiptNumber}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Date</p>
                <p className="text-stone-800">{bookedAppointment.date}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Time</p>
                <p className="text-stone-800">{bookedAppointment.time}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Status</p>
                <Badge className="bg-amber-100 text-amber-700 border-0 mt-1">Pending Confirmation</Badge>
              </div>
            </div>
            <p className="text-xs text-stone-400 mb-6">
              Dr. Rani will confirm your appointment and send a meet link shortly.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/dashboard')} className="bg-teal-600 hover:bg-teal-700">
                View My Appointments
              </Button>
              <Button variant="ghost" onClick={() => router.push('/')}>Back to Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Book a Session</h1>
          <p className="text-stone-500">Choose a date, pick a time, and share your details.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['date', 'slot', 'details'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step === s ? 'bg-teal-600 text-white' :
                ['date', 'slot', 'details'].indexOf(step) > i ? 'bg-teal-200 text-teal-700' :
                'bg-stone-200 text-stone-500'
              }`}>
                {['date', 'slot', 'details'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${step === s ? 'text-teal-700 font-medium' : 'text-stone-400'}`}>
                {s === 'date' ? 'Choose Date' : s === 'slot' ? 'Pick Time' : 'Your Details'}
              </span>
              {i < 2 && <div className="w-8 h-px bg-stone-200" />}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">

            {/* STEP: Date */}
            {step === 'date' && (
              <div>
                <CardTitle className="flex items-center gap-2 mb-5 text-stone-800">
                  <CalendarDays className="w-5 h-5 text-teal-600" />
                  Select a Date
                </CardTitle>
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w - 1)} disabled={weekOffset === 0}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium text-stone-600">
                    {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {weekDays.map(day => {
                    const isPast = isBefore(day, today)
                    const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    return (
                      <button
                        key={day.toISOString()}
                        disabled={isPast}
                        onClick={() => handleDateSelect(day)}
                        className={`flex flex-col items-center py-3 rounded-xl text-xs font-medium transition-all ${
                          isSelected ? 'bg-teal-600 text-white shadow-md' :
                          isPast ? 'text-stone-300 cursor-not-allowed' :
                          'hover:bg-teal-50 text-stone-700 hover:text-teal-700'
                        }`}
                      >
                        <span className="text-[10px] uppercase opacity-70">{format(day, 'EEE')}</span>
                        <span className="text-base mt-0.5">{format(day, 'd')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP: Slot */}
            {step === 'slot' && selectedDate && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setStep('date')} className="text-stone-400 hover:text-stone-600">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <CardTitle className="flex items-center gap-2 text-stone-800">
                      <Clock className="w-5 h-5 text-teal-600" />
                      Available Times
                    </CardTitle>
                  </div>
                  {/* Live indicator */}
                  <div className={`flex items-center gap-1.5 text-xs ${liveConnected ? 'text-teal-600' : 'text-stone-400'}`}>
                    <Wifi className="w-3.5 h-3.5" />
                    <span className="hidden sm:block">{liveConnected ? 'Live' : 'Connecting…'}</span>
                  </div>
                </div>
                <p className="text-sm text-stone-500 mb-5 ml-6">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No slots available for this date.</p>
                    <Button variant="ghost" size="sm" className="mt-3" onClick={() => setStep('date')}>
                      Choose another date
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelect(slot)}
                        className="px-4 py-3 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all text-center"
                      >
                        {formatTime(slot.start_time)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP: Details */}
            {step === 'details' && selectedSlot && (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-2 mb-5">
                  <button type="button" onClick={() => setStep('slot')} className="text-stone-400 hover:text-stone-600">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <CardTitle className="text-stone-800">Your Details</CardTitle>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {format(selectedDate!, 'MMM d')} at {formatTime(selectedSlot.start_time)}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" required value={form.clientName}
                      onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                      placeholder="Your full name" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" required value={form.clientEmail}
                      onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                      placeholder="your@email.com" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number (optional)</Label>
                    <Input id="phone" type="tel" value={form.clientPhone}
                      onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                      placeholder="+1 (555) 000-0000" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="notes">What brings you in? (optional)</Label>
                    <Textarea id="notes" value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Briefly describe what you'd like to work on..."
                      rows={3} className="mt-1 resize-none" />
                  </div>
                </div>
                <div className="mt-5 p-4 bg-teal-50 rounded-xl border border-teal-100">
                  <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Booking Summary</p>
                  <p className="text-sm text-stone-700">
                    <strong>{format(selectedDate!, 'EEEE, MMMM d, yyyy')}</strong>
                    {' at '}
                    <strong>{formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}</strong>
                  </p>
                </div>
                <Button type="submit" disabled={submitting} className="w-full mt-5 bg-teal-600 hover:bg-teal-700" size="lg">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Booking...</> : 'Confirm Booking'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
