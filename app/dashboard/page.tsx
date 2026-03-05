export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO, isToday } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, Clock, Video, FileText, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react'
import type { Appointment } from '@/types/database'
import { AppointmentActions } from '@/components/dashboard/AppointmentActions'

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: 'bg-teal-100 text-teal-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-stone-100 text-stone-600', icon: CheckCircle },
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const status = statusConfig[appointment.status]
  const StatusIcon = status.icon
  const sessionDate = parseISO(appointment.slot_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isPastSession = sessionDate < today

  const canCancel = !isPastSession && appointment.status !== 'cancelled' && appointment.status !== 'completed'

  return (
    <Card className={`border shadow-sm transition-all hover:shadow-md ${isPastSession ? 'opacity-70' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${isPastSession ? 'bg-stone-100' : 'bg-teal-50'}`}>
            <span className="text-xs font-semibold text-stone-500">{format(sessionDate, 'MMM').toUpperCase()}</span>
            <span className={`text-lg font-bold ${isPastSession ? 'text-stone-500' : 'text-teal-700'}`}>{format(sessionDate, 'd')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={`text-xs border-0 ${status.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              {isToday(sessionDate) && (
                <Badge className="text-xs bg-blue-100 text-blue-700 border-0">Today</Badge>
              )}
            </div>
            <p className="font-semibold text-stone-900">{format(sessionDate, 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
            </p>
            {appointment.meet_link && appointment.status === 'confirmed' && (
              <a href={appointment.meet_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800 mt-3">
                <Video className="w-4 h-4" /> Join Video Session
              </a>
            )}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-400">
              <FileText className="w-3.5 h-3.5" />
              Receipt: <span className="font-mono text-stone-600">{appointment.receipt_number}</span>
            </div>
          </div>
          <AppointmentActions appointment={appointment} canCancel={canCancel} />
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/dashboard')

  const { data: profile } = await supabase.from('profiles').select('full_name, email, role').eq('id', user.id).single()
  if (profile?.role === 'admin') redirect('/admin')

  const today = new Date().toISOString().split('T')[0]
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true })

  const upcoming = appointments?.filter(a => a.slot_date >= today && a.status !== 'cancelled') ?? []
  const past = appointments?.filter(a => a.slot_date < today || a.status === 'cancelled') ?? []
  const nextAppt = upcoming[0] ?? null

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">
            Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-stone-500 mt-1">Manage your therapy appointments</p>
        </div>

        {nextAppt ? (
          <Card className="mb-8 border-0 shadow-md bg-gradient-to-r from-teal-600 to-teal-700 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-teal-200 text-sm font-medium mb-1">Your Next Session</p>
                  <p className="text-xl font-bold">{format(parseISO(nextAppt.slot_date), 'EEEE, MMMM d')}</p>
                  <p className="text-teal-100 flex items-center gap-1.5 mt-1">
                    <Clock className="w-4 h-4" />{formatTime(nextAppt.start_time)}
                  </p>
                  <Badge className={`mt-2 border-0 text-xs ${nextAppt.status === 'confirmed' ? 'bg-teal-500 text-white' : 'bg-amber-400 text-amber-900'}`}>
                    {nextAppt.status === 'confirmed' ? 'Confirmed' : 'Pending Confirmation'}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Calendar className="w-10 h-10 text-teal-300 opacity-50" />
                  {nextAppt.meet_link && nextAppt.status === 'confirmed' && (
                    <a href={nextAppt.meet_link} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="bg-white text-teal-700 hover:bg-teal-50">
                        <Video className="w-4 h-4 mr-1" /> Join
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border border-dashed border-stone-300 shadow-none bg-transparent">
            <CardContent className="p-8 text-center">
              <CalendarDays className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 mb-4">You have no upcoming appointments.</p>
              <Link href="/book">
                <Button className="bg-teal-600 hover:bg-teal-700">Book a Session</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Upcoming', value: upcoming.length, color: 'text-teal-700' },
            { label: 'Completed', value: appointments?.filter(a => a.status === 'completed').length ?? 0, color: 'text-stone-700' },
            { label: 'Total Sessions', value: appointments?.length ?? 0, color: 'text-stone-700' },
          ].map(stat => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-stone-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900">Upcoming Appointments</h2>
            <Link href="/book">
              <Button size="sm" variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                + New Booking
              </Button>
            </Link>
          </div>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map(a => <AppointmentCard key={a.id} appointment={a} />)}
            </div>
          ) : (
            <p className="text-stone-400 text-sm">No upcoming appointments.</p>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="font-semibold text-stone-900 mb-4">Past Appointments</h2>
            <div className="space-y-3">
              {past.map(a => <AppointmentCard key={a.id} appointment={a} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
