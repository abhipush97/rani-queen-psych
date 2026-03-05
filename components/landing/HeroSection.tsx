import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle } from 'lucide-react'

interface HeroSectionProps {
  tagline: string
}

export function HeroSection({ tagline }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-teal-50 via-white to-stone-50 overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-50/60 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Accepting New Clients
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-stone-900 leading-tight mb-6">
            {tagline}
          </h1>

          <p className="text-lg text-stone-600 mb-8 leading-relaxed">
            Evidence-based therapy tailored to your unique needs. Take the first step toward a healthier, more fulfilling life.
          </p>

          {/* Trust signals */}
          <ul className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-10 text-sm text-stone-600">
            {[
              'Confidential & secure',
              'Flexible scheduling',
              'Virtual & in-person',
            ].map(item => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/book">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white px-8 group">
                Book a Session
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/#about">
              <Button size="lg" variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-50">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Wavy bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-white" style={{
        clipPath: 'ellipse(55% 100% at 50% 100%)'
      }} />
    </section>
  )
}
