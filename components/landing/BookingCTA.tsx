import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock, Video, Shield } from 'lucide-react'

interface BookingCTAProps {
  sessionPrice: number
  sessionDuration: number
  currency: string
}

export function BookingCTA({ sessionPrice, sessionDuration, currency }: BookingCTAProps) {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency })

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-8 py-12 md:px-12 md:py-16">
            <div className="max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-teal-100 mb-8 leading-relaxed">
                Take the first step toward lasting change. Book a session today and experience compassionate, personalized care.
              </p>

              {/* Session info */}
              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { icon: Clock, text: `${sessionDuration} min session` },
                  { icon: Video, text: 'Virtual or in-person' },
                  { icon: Shield, text: '100% confidential' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-teal-100 text-sm">
                    <Icon className="w-4 h-4 text-teal-300" />
                    {text}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/book">
                  <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 px-8 group">
                    Book Now
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="text-teal-200 text-sm">
                  Starting at{' '}
                  <span className="font-semibold text-white">{formatter.format(sessionPrice)}</span>
                  {' '}per session
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
