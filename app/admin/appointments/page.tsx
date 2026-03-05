'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  format, addDays, startOfWeek, isSameDay, parseISO, isToday
} from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Video, Mail, Phone, Loader2, ChevronLeft, ChevronRight,
  CalendarDays, List, FileText
} from 'lucide-react'
import type { Appointment, AppointmentStatus } from '@/types/database'

const STATUS = {
  pending:   { label: 'Pending',   bg: 'bg-amber-100 border-amber-300',  text: 'text-amber-800' },
  confirmed: { label: 'Confirmed', bg: 'bg-teal-100  border-teal-300',   text: 'text-teal-800'  },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50    border-red-200',    text: 'text-red-600 opacity-60' },
  completed: { label: 'Completed', bg: 'bg-stone-100 border-stone-200',  text: 'text-stone-600' },
} satisfies Record<AppointmentStatus, { label: string; bg: string; text: string }>

const HOUR_HEIGHT = 64            // px per hour
const DAY_START   = 8             // 8 am
const DAY_END     = 20            // 8 pm
const HOURS       = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function toFraction(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h + m / 60
}

export default function AdminAppointmentsPage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [meetLink, setMeetLink] = useState('')
  const [newStatus, setNewStatus] = useState<AppointmentStatus>('pending')
  const [saving, setSaving] = useState(false)

  const today = new Date()
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 })
  const weekEnd   = addDays(weekStart, 6)
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('slot_date')
      .order('start_time')
    setAppointments(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const openModal = (appt: Appointment) => {
    setSelected(appt)
    setMeetLink(appt.meet_link ?? '')
    setNewStatus(appt.status)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/appointments/${selected.id}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetLink, status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to update')
      }
      if (newStatus === 'cancelled' && selected.slot_id) {
        await supabase
          .from('availability_slots')
          .update({ is_available: true })
          .eq('id', selected.slot_id)
      }
      toast.success(
        newStatus === 'confirmed' && meetLink && selected.status !== 'confirmed'
          ? 'Confirmed & meet link sent to client!'
          : 'Appointment updated'
      )
      setSelected(null)
      fetchAppointments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const thisWeekAppts = appointments.filter(a => {
    try {
      const d = parseISO(a.slot_date)
      return d >= weekStart && d <= weekEnd
    } catch { return false }
  })

  const apptsByDay = (day: Date) =>
    thisWeekAppts.filter(a => {
      try { return isSameDay(parseISO(a.slot_date), day) } catch { return false }
    })

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Appointments</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            {' · '}{thisWeekAppts.length} appointment{thisWeekAppts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-stone-200 rounded-lg">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex border border-stone-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'calendar' ? 'bg-teal-600 text-white' : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'list' ? 'bg-teal-600 text-white' : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
        </div>
      ) : view === 'calendar' ? (
        /* ──────────── CALENDAR VIEW ──────────── */
        <Card className="border-0 shadow-sm overflow-hidden">
          {/* Day header row */}
          <div className="grid border-b border-stone-100 bg-white" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
            <div className="py-3 border-r border-stone-100" />
            {weekDays.map(day => (
              <div
                key={day.toISOString()}
                className={`py-3 text-center border-r border-stone-100 last:border-r-0 ${
                  isToday(day) ? 'bg-teal-50' : ''
                }`}
              >
                <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                  {format(day, 'EEE')}
                </p>
                <p className={`text-xl font-bold mt-0.5 ${
                  isToday(day)
                    ? 'w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center mx-auto text-base'
                    : 'text-stone-800'
                }`}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Scrollable time grid */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: '65vh' }}
          >
            <div className="grid" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
              {/* Time labels column */}
              <div className="border-r border-stone-100">
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="border-b border-stone-50 flex items-start justify-end pr-2 pt-1"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className="text-[11px] text-stone-300">
                      {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map(day => {
                const dayAppts = apptsByDay(day)
                return (
                  <div
                    key={day.toISOString()}
                    className={`relative border-r border-stone-100 last:border-r-0 ${
                      isToday(day) ? 'bg-teal-50/20' : ''
                    }`}
                    style={{ height: HOUR_HEIGHT * HOURS.length }}
                  >
                    {/* Hour lines */}
                    {HOURS.map(h => (
                      <div
                        key={h}
                        className="absolute w-full border-b border-stone-100"
                        style={{ top: (h - DAY_START) * HOUR_HEIGHT }}
                      />
                    ))}

                    {/* Appointment blocks */}
                    {dayAppts.map(appt => {
                      const startF = toFraction(appt.start_time)
                      const endF   = toFraction(appt.end_time)
                      const top    = (startF - DAY_START) * HOUR_HEIGHT
                      const height = Math.max((endF - startF) * HOUR_HEIGHT - 3, 22)
                      const s = STATUS[appt.status]

                      return (
                        <button
                          key={appt.id}
                          onClick={() => openModal(appt)}
                          className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 text-left
                            hover:brightness-95 transition-all shadow-sm overflow-hidden ${s.bg}`}
                          style={{ top, height }}
                          title={`${appt.client_name} — ${formatTime(appt.start_time)}`}
                        >
                          <p className={`text-[11px] font-semibold leading-tight truncate ${s.text}`}>
                            {appt.client_name}
                          </p>
                          {height > 34 && (
                            <p className={`text-[10px] leading-tight ${s.text} opacity-75`}>
                              {formatTime(appt.start_time)}
                            </p>
                          )}
                          {appt.meet_link && height > 50 && (
                            <Video className={`w-2.5 h-2.5 mt-0.5 inline ${s.text} opacity-60`} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      ) : (
        /* ──────────── LIST VIEW ──────────── */
        <div className="space-y-3">
          {thisWeekAppts.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No appointments this week</p>
            </div>
          ) : (
            thisWeekAppts.map(appt => {
              const s = STATUS[appt.status]
              return (
                <Card
                  key={appt.id}
                  className="border border-stone-100 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                  onClick={() => openModal(appt)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                      isToday(parseISO(appt.slot_date)) ? 'bg-teal-600' : 'bg-teal-50'
                    }`}>
                      <span className={`text-[10px] uppercase ${isToday(parseISO(appt.slot_date)) ? 'text-teal-200' : 'text-stone-400'}`}>
                        {format(parseISO(appt.slot_date), 'MMM')}
                      </span>
                      <span className={`text-lg font-bold ${isToday(parseISO(appt.slot_date)) ? 'text-white' : 'text-teal-700'}`}>
                        {format(parseISO(appt.slot_date), 'd')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-stone-900">{appt.client_name}</p>
                        <Badge className={`text-xs border-0 ${s.bg} ${s.text}`}>{s.label}</Badge>
                        {appt.meet_link && (
                          <Badge className="text-xs bg-blue-100 text-blue-700 border-0">
                            <Video className="w-3 h-3 mr-1" />Link added
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-stone-500 mt-0.5">
                        {format(parseISO(appt.slot_date), 'EEE, MMM d')} · {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                      </p>
                      <p className="text-xs text-stone-400">{appt.client_email}</p>
                    </div>
                    <span className="text-xs text-stone-300 font-mono shrink-0 hidden sm:block">
                      {appt.receipt_number}
                    </span>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* ──────────── EDIT MODAL ──────────── */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Appointment</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-1">
              {/* Client summary */}
              <div className="p-4 bg-stone-50 rounded-xl space-y-2 border border-stone-100">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-stone-900 text-lg leading-tight">{selected.client_name}</p>
                  <Badge className={`text-xs border-0 shrink-0 ${STATUS[selected.status].bg} ${STATUS[selected.status].text}`}>
                    {STATUS[selected.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-stone-600 font-medium">
                  {format(parseISO(selected.slot_date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-stone-500">
                  {formatTime(selected.start_time)} – {formatTime(selected.end_time)}
                </p>
                <div className="pt-2 border-t border-stone-200 space-y-1.5">
                  <p className="text-sm text-stone-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />{selected.client_email}
                  </p>
                  {selected.client_phone && (
                    <p className="text-sm text-stone-500 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />{selected.client_phone}
                    </p>
                  )}
                  {selected.notes && (
                    <p className="text-sm text-stone-500 italic mt-2 pt-2 border-t border-stone-200">
                      &ldquo;{selected.notes}&rdquo;
                    </p>
                  )}
                </div>
                <p className="text-xs text-stone-300 font-mono">#{selected.receipt_number}</p>
              </div>

              {/* Status */}
              <div>
                <Label className="text-sm">Status</Label>
                <Select value={newStatus} onValueChange={v => setNewStatus(v as AppointmentStatus)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Meet link */}
              <div>
                <Label htmlFor="meet-link" className="text-sm flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />Video Session Link
                </Label>
                <Input
                  id="meet-link"
                  value={meetLink}
                  onChange={e => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="mt-1.5"
                />
                <p className="text-xs text-stone-400 mt-1">
                  Setting status to &ldquo;Confirmed&rdquo; with a link will email it to the client.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                : 'Save Changes'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
