'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Search, Filter, Video, Phone, Mail,
  FileText, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'
import type { Appointment, AppointmentStatus } from '@/types/database'

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', color: 'bg-teal-100 text-teal-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  completed: { label: 'Completed', color: 'bg-stone-100 text-stone-600' },
}

export default function AdminAppointmentsPage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filtered, setFiltered] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [meetLink, setMeetLink] = useState('')
  const [newStatus, setNewStatus] = useState<AppointmentStatus>('pending')
  const [saving, setSaving] = useState(false)
  const [sortAsc, setSortAsc] = useState(true)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('slot_date', { ascending: sortAsc })
      .order('start_time', { ascending: true })
    setAppointments(data ?? [])
    setLoading(false)
  }, [supabase, sortAsc])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  useEffect(() => {
    let list = [...appointments]
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.client_name.toLowerCase().includes(q) ||
        a.client_email.toLowerCase().includes(q) ||
        a.receipt_number.toLowerCase().includes(q)
      )
    }
    setFiltered(list)
  }, [appointments, search, statusFilter])

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
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to update')
      }

      // If cancelling, also re-open the slot
      if (newStatus === 'cancelled' && selected.slot_id) {
        await supabase
          .from('availability_slots')
          .update({ is_available: true })
          .eq('id', selected.slot_id)
      }

      toast.success(
        newStatus === 'confirmed' && meetLink && selected.status !== 'confirmed'
          ? 'Appointment confirmed & meet link emailed to client!'
          : 'Appointment updated'
      )
      setSelected(null)
      fetchAppointments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update appointment')
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Appointments</h1>
        <p className="text-stone-500 mt-1">Manage your client appointments pipeline</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search by name, email, or receipt..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => setSortAsc(v => !v)} className="text-stone-500">
            Date {sortAsc ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Pipeline */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt => {
            const status = statusConfig[appt.status]
            return (
              <Card
                key={appt.id}
                className="border border-stone-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openModal(appt)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Date block */}
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-stone-400 uppercase">{format(parseISO(appt.slot_date), 'MMM')}</span>
                      <span className="text-lg font-bold text-teal-700">{format(parseISO(appt.slot_date), 'd')}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-stone-900">{appt.client_name}</p>
                        <Badge className={`text-xs border-0 ${status.color}`}>{status.label}</Badge>
                        {appt.meet_link && (
                          <Badge className="text-xs bg-blue-100 text-blue-700 border-0">
                            <Video className="w-3 h-3 mr-1" />Meet Link
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <p className="text-sm text-stone-500">
                          {format(parseISO(appt.slot_date), 'EEE, MMM d')} · {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                        </p>
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                          <Mail className="w-3 h-3" />{appt.client_email}
                        </span>
                        {appt.client_phone && (
                          <span className="flex items-center gap-1 text-xs text-stone-400">
                            <Phone className="w-3 h-3" />{appt.client_phone}
                          </span>
                        )}
                      </div>
                      {appt.notes && (
                        <p className="text-xs text-stone-400 mt-1.5 line-clamp-1 italic">
                          &ldquo;{appt.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-stone-400 font-mono shrink-0 hidden sm:block">
                      {appt.receipt_number}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Appointment</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 py-2">
              {/* Client info */}
              <div className="p-4 bg-stone-50 rounded-xl space-y-2">
                <p className="font-semibold text-stone-900">{selected.client_name}</p>
                <p className="text-sm text-stone-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />{selected.client_email}
                </p>
                {selected.client_phone && (
                  <p className="text-sm text-stone-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />{selected.client_phone}
                  </p>
                )}
                <p className="text-sm text-stone-600 font-medium">
                  {format(parseISO(selected.slot_date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-stone-500">
                  {(() => {
                    const [h, m] = selected.start_time.split(':').map(Number)
                    const ampm = h >= 12 ? 'PM' : 'AM'
                    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
                  })()} – {(() => {
                    const [h, m] = selected.end_time.split(':').map(Number)
                    const ampm = h >= 12 ? 'PM' : 'AM'
                    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
                  })()}
                </p>
                {selected.notes && (
                  <div className="pt-2 border-t border-stone-200">
                    <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Client Notes</p>
                    <p className="text-sm text-stone-600 italic">&ldquo;{selected.notes}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={v => setNewStatus(v as AppointmentStatus)}>
                  <SelectTrigger className="mt-1">
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
                <Label htmlFor="meet-link">
                  <Video className="w-3.5 h-3.5 inline mr-1.5" />
                  Video Session Link
                </Label>
                <Input
                  id="meet-link"
                  value={meetLink}
                  onChange={e => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="mt-1"
                />
                <p className="text-xs text-stone-400 mt-1">
                  This link will be shared with the client in their dashboard.
                </p>
              </div>

              {/* Receipt */}
              <div className="text-xs text-stone-400 font-mono">
                Receipt: {selected.receipt_number}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
