import Link from 'next/link'
import { Brain, Mail, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-white">Dr. Rani Queen</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Licensed Psychologist dedicated to supporting your mental health journey with evidence-based care.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-medium mb-3 text-sm uppercase tracking-wide">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: '/#about', label: 'About' },
                { href: '/#testimonials', label: 'Testimonials' },
                { href: '/book', label: 'Book a Session' },
                { href: '/auth/login', label: 'Client Login' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-stone-400 hover:text-teal-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-medium mb-3 text-sm uppercase tracking-wide">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-stone-400">
                <Mail className="w-4 h-4 text-teal-500 shrink-0" />
                hello@raniqueen.com
              </li>
              <li className="flex items-center gap-2 text-sm text-stone-400">
                <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                +1 (555) 234-5678
              </li>
            </ul>
            <p className="mt-4 text-xs text-stone-500">
              Mon–Fri: 9am – 6pm<br />
              Sat: 10am – 2pm
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} Dr. Rani Queen Psychology. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
