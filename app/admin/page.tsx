export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock, CalendarDays, Users, CheckCircle,
  AlertCircle, Video, ArrowRight
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const today = new Date().toISOString().split('T')[0]

  const [appointmentsRes, pendingRes, todayRes] = await Promise.all([
    supabase.from('appointments').select('*').gte('slot_date', today).order('slot_date').order('start_time').limit(5),
    supabase.from('appointments').select('id').eq('status', 'pending'),
    supabase.from('appointments').select('*').eq('slot_date', today).neq('status', 'cancelled').order('start_time'),
  ])

  const upcoming = appointmentsRes.data ?? []
  const pendingCount = pendingRes.data?.length ?? 0
  const todayAppts = todayRes.data ?? []

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          {profile?.full_name?.split(' ')[0] ?? 'Dr. Queen'} 👋
        </h1>
        <p className="text-stone-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's Sessions", value: todayAppts.length, icon: CalendarDays, color: 'text-teal-700', bg: 'bg-teal-50' },
          { label: 'Pending Review', value: pendingCount, icon: AlertCircle, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'This Week', value: upcoming.length, icon: Users, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Confirmed', value: upcoming.filter(a => a.status === 'confirmed').length, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's schedule */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-900">Today&apos;s Schedule</h2>
              <Badge className="bg-teal-100 text-teal-700 border-0 text-xs">
                {format(new Date(), 'MMM d')}
              </Badge>
            </div>
            {todayAppts.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No sessions today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppts.map(appt => (
                  <div key={appt.id} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100">
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs text-stone-400">{formatTime(appt.start_time).split(' ')[1]}</p>
                      <p className="text-sm font-bold text-stone-800">{formatTime(appt.start_time).split(' ')[0]}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm truncate">{appt.client_name}</p>
                      <p className="text-xs text-stone-500 truncate">{appt.client_email}</p>
                      {appt.meet_link ? (
                        <a href={appt.meet_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 mt-1">
                          <Video className="w-3 h-3" /> Join Session
                        </a>
                      ) : (
                        <span className="text-xs text-stone-400 mt-1 block">No meet link yet</span>
                      )}
                    </div>
                    <Badge className={`text-xs border-0 shrink-0 ${appt.status === 'confirmed' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                      {appt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming appointments */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-900">Upcoming Appointments</h2>
              <Link href="/admin/appointments">
                <Button variant="ghost" size="sm" className="text-teal-600 h-7 text-xs">
                  View all <ArrowRight className="ml-1 w-3 h-3" />
                </Button>
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 5).map(appt => (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-stone-400 uppercase">{format(parseISO(appt.slot_date), 'MMM')}</span>
                      <span className="text-sm font-bold text-teal-700">{format(parseISO(appt.slot_date), 'd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{appt.client_name}</p>
                      <p className="text-xs text-stone-400">{formatTime(appt.start_time)}</p>
                    </div>
                    <Badge className={`text-xs border-0 shrink-0 ${
                      appt.status === 'confirmed' ? 'bg-teal-100 text-teal-700' :
                      appt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {appt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/admin/appointments', label: 'Manage Appointments', icon: CalendarDays },
          { href: '/admin/availability', label: 'Set Availability', icon: Clock },
          { href: '/admin/settings', label: 'Site Settings', icon: CheckCircle },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="border border-stone-100 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-medium text-stone-700 group-hover:text-teal-700 transition-colors">{label}</span>
                <ArrowRight className="w-4 h-4 text-stone-300 ml-auto group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
