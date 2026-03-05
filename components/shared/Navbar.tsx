'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Brain, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(profile?.role ?? null)
      }
    }
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setRole(null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    router.push('/')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  const navLinks = [
    { href: '/#about', label: 'About' },
    { href: '/#testimonials', label: 'Testimonials' },
    { href: '/book', label: 'Book Session' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center group-hover:bg-teal-700 transition-colors">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-stone-800 text-lg">Rani Queen</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-stone-600 hover:text-teal-700 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-teal-100 hover:ring-teal-300 transition-all">
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-stone-500 hover:text-stone-700">
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-stone-600">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-stone-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-stone-600 hover:text-teal-700 text-sm font-medium py-1"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
            {user ? (
              <>
                {role === 'admin' && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Admin Panel</Button>
                  </Link>
                )}
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">My Appointments</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full">Sign out</Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Sign in</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
