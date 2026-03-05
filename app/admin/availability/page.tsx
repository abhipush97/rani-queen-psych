'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, startOfDay, isBefore, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AvailabilitySlot } from '@/types/database'

// Pre-built time options (8am–8pm, 30 min intervals)
const timeOptions = Array.from({ length: 25 }, (_, i) => {
  const totalMins = 8 * 60 + i * 30
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const display = `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
  const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  return { display, value }
})

const durationOptions = [
  { label: '30 min', value: 30 },
  { label: '50 min', value: 50 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
]

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  const nh = Math.floor(total / 60)
  const nm = total % 60
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export default function AvailabilityPage() {
  const supabase = createClient()
  const today = startOfDay(new Date())
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(50)

  const weekStart = addDays(today, weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('slot_date', dateStr)
      .order('start_time')
    setSlots(data ?? [])
    setLoading(false)
  }, [selectedDate, supabase])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  const handleAddSlot = async () => {
    const endTime = addMinutes(startTime, duration)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    // Check overlap
    const overlap = slots.some(s => {
      return !(endTime <= s.start_time || startTime >= s.end_time)
    })

    if (overlap) {
      toast.error('This slot overlaps with an existing one.')
      return
    }

    setAdding(true)
    const { error } = await supabase.from('availability_slots').insert({
      slot_date: dateStr,
      start_time: startTime,
      end_time: endTime,
      is_available: true,
    })

    if (error) {
      toast.error(error.message.includes('unique') ? 'This time slot already exists.' : 'Failed to add slot.')
    } else {
      toast.success('Slot added')
      fetchSlots()
    }
    setAdding(false)
  }

  const handleDeleteSlot = async (slotId: string, isBooked: boolean) => {
    if (isBooked) {
      toast.error('Cannot delete a booked slot. Cancel the appointment first.')
      return
    }
    const { error } = await supabase.from('availability_slots').delete().eq('id', slotId)
    if (error) {
      toast.error('Failed to delete slot')
    } else {
      toast.success('Slot removed')
      fetchSlots()
    }
  }

  // Quick add preset (morning, afternoon, etc.)
  const addPreset = async (preset: 'morning' | 'afternoon' | 'full') => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const presets: Record<string, { start: string; end: string }[]> = {
      morning: [
        { start: '09:00', end: '09:50' },
        { start: '10:00', end: '10:50' },
        { start: '11:00', end: '11:50' },
      ],
      afternoon: [
        { start: '13:00', end: '13:50' },
        { start: '14:00', end: '14:50' },
        { start: '15:00', end: '15:50' },
        { start: '16:00', end: '16:50' },
      ],
      full: [
        { start: '09:00', end: '09:50' },
        { start: '10:00', end: '10:50' },
        { start: '11:00', end: '11:50' },
        { start: '13:00', end: '13:50' },
        { start: '14:00', end: '14:50' },
        { start: '15:00', end: '15:50' },
        { start: '16:00', end: '16:50' },
      ],
    }
    const slotsToAdd = presets[preset]
    const { error } = await supabase.from('availability_slots').insert(
      slotsToAdd.map(s => ({ slot_date: dateStr, ...s, is_available: true }))
    )
    if (error) {
      toast.error('Some slots may already exist.')
    } else {
      toast.success(`${preset.charAt(0).toUpperCase() + preset.slice(1)} slots added!`)
      fetchSlots()
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Availability</h1>
        <p className="text-stone-500 mt-1">Configure your available time slots for clients to book</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar column */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm mb-4">
            <CardContent className="p-5">
              {/* Week navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w - 1)} disabled={weekOffset === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-stone-700">
                  {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map(day => {
                  const isPast = isBefore(day, today)
                  const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  return (
                    <button
                      key={day.toISOString()}
                      disabled={isPast}
                      onClick={() => setSelectedDate(day)}
                      className={`flex flex-col items-center py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected ? 'bg-teal-600 text-white shadow-md' :
                        isPast ? 'text-stone-300 cursor-not-allowed' :
                        'hover:bg-teal-50 text-stone-700'
                      }`}
                    >
                      <span className="text-[10px] uppercase opacity-60">{format(day, 'EEE')}</span>
                      <span className="text-base mt-0.5">{format(day, 'd')}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Slots for selected day */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-stone-900">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">{slots.length} slot{slots.length !== 1 ? 's' : ''} configured</p>
                </div>
                <div className="flex gap-1.5">
                  {(['morning', 'afternoon', 'full'] as const).map(p => (
                    <Button
                      key={p}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 border-teal-200 text-teal-700 hover:bg-teal-50"
                      onClick={() => addPreset(p)}
                    >
                      {p === 'full' ? 'Full Day' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No slots for this day. Add one below.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {slots.map(slot => {
                    const isBooked = !slot.is_available
                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm ${
                          isBooked
                            ? 'bg-stone-50 border-stone-200 text-stone-400'
                            : 'bg-white border-teal-100 text-stone-700'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{formatTime(slot.start_time)}</p>
                          <p className="text-xs opacity-60">{formatTime(slot.end_time)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isBooked ? (
                            <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0">Booked</Badge>
                          ) : (
                            <button
                              onClick={() => handleDeleteSlot(slot.id, isBooked)}
                              className="text-stone-300 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add slot panel */}
        <div>
          <Card className="border-0 shadow-sm sticky top-6">
            <CardContent className="p-5">
              <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                Add Slot
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.display}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Duration</Label>
                  <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map(d => (
                        <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                  <p className="text-xs text-teal-600 font-medium">Preview</p>
                  <p className="text-sm font-semibold text-teal-800 mt-0.5">
                    {formatTime(startTime)} – {formatTime(addMinutes(startTime, duration))}
                  </p>
                  <p className="text-xs text-teal-500">{format(selectedDate, 'MMM d, yyyy')}</p>
                </div>

                <Button
                  onClick={handleAddSlot}
                  disabled={adding}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1.5" /> Add Slot</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
