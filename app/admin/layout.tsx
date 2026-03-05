import Link from 'next/link'
import { LayoutDashboard, Calendar, CalendarClock, Settings, ChevronRight } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/availability', label: 'Availability', icon: CalendarClock },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-stone-100 py-6 px-3 shrink-0">
        <div className="px-3 mb-6">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Admin Panel</p>
        </div>
        <nav className="space-y-0.5 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-stone-600 hover:bg-teal-50 hover:text-teal-700 transition-colors group"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </nav>
        <div className="px-3 pt-4 border-t border-stone-100">
          <Link href="/" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 flex z-40">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center py-3 text-stone-500 hover:text-teal-600 transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{label.split(' ')[0]}</span>
          </Link>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 pb-16 md:pb-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
