'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { CalendarDays, X, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { generateICS, downloadICS } from '@/lib/ics'
import type { Appointment } from '@/types/database'

interface Props {
  appointment: Appointment
  canCancel: boolean
}

export function AppointmentActions({ appointment, canCancel }: Props) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()

  const handleDownloadICS = () => {
    const icsContent = generateICS({
      title: 'Session with Dr. Rani Queen',
      date: appointment.slot_date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      description: `Receipt: ${appointment.receipt_number}${appointment.meet_link ? `\nJoin: ${appointment.meet_link}` : ''}`,
      location: appointment.meet_link ?? 'To be confirmed',
      uid: appointment.id,
    })
    const dateLabel = format(parseISO(appointment.slot_date), 'yyyy-MM-dd')
    downloadICS(icsContent, `session-${dateLabel}.ics`)
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/cancel`, { method: 'PATCH' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Cancellation failed')
      }
      toast.success('Appointment cancelled')
      setShowCancelDialog(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel appointment')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5 shrink-0">
        {/* Download .ics */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadICS}
          className="h-8 px-2 text-stone-400 hover:text-teal-600 hover:bg-teal-50"
          title="Add to calendar"
        >
          <Download className="w-4 h-4" />
          <span className="sr-only">Add to calendar</span>
        </Button>

        {/* Cancel */}
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCancelDialog(true)}
            className="h-8 px-2 text-stone-400 hover:text-red-500 hover:bg-red-50"
            title="Cancel appointment"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Cancel</span>
          </Button>
        )}
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Appointment?</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg mb-3">
              <CalendarDays className="w-5 h-5 text-stone-500 shrink-0" />
              <div>
                <p className="font-medium text-stone-800 text-sm">
                  {format(parseISO(appointment.slot_date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-xs text-stone-500">
                  {(() => {
                    const [h, m] = appointment.start_time.split(':').map(Number)
                    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
                  })()}
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-500">
              This will free up the slot for other clients. You&apos;ll receive a confirmation email.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={cancelling}>
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelling…</> : 'Yes, Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
