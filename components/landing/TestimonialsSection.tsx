import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import type { Testimonial } from '@/types/database'

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`}
        />
      ))}
    </div>
  )
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section id="testimonials" className="py-20 bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
            Stories of Transformation
          </h2>
          <p className="text-stone-500 max-w-xl mx-auto">
            Hear from those who have taken the courageous step toward healing and growth.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <Card
              key={t.id}
              className={`border-0 shadow-sm hover:shadow-md transition-shadow ${
                idx === 0 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <CardContent className="p-6">
                <StarRating rating={t.rating} />
                <blockquote className="mt-4 text-stone-600 text-sm leading-relaxed italic">
                  &ldquo;{t.content}&rdquo;
                </blockquote>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                      {t.author_initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{t.author_name}</p>
                    <p className="text-xs text-stone-400">Verified Client</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { value: '500+', label: 'Clients Served' },
            { value: '4.9', label: 'Average Rating' },
            { value: '12+', label: 'Years Experience' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-teal-700">{stat.value}</p>
              <p className="text-xs text-stone-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
