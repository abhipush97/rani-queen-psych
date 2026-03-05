'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, CalendarClock, Settings, ChevronRight } from 'lucide-react'

const navItems = [
  { href: '/admin',              label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/availability', label: 'Availability', icon: CalendarClock },
  { href: '/admin/settings',     label: 'Site Settings', icon: Settings },
]

export function AdminNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-stone-100 py-6 px-3 shrink-0">
        <div className="px-3 mb-6">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Admin Panel</p>
        </div>
        <nav className="space-y-0.5 flex-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                  active
                    ? 'bg-teal-50 text-teal-700 font-medium'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-teal-600' : 'text-stone-400 group-hover:text-stone-600'}`} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 text-teal-400" />}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 pt-4 border-t border-stone-100">
          <Link href="/" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 flex z-40">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 transition-colors ${
                active ? 'text-teal-600' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
