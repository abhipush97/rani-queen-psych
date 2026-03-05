import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, Heart, Award } from 'lucide-react'

interface AboutSectionProps {
  title: string
  subtitle: string
  text: string
  photoUrl: string | null
}

const credentials = [
  { icon: GraduationCap, label: 'PhD in Clinical Psychology, Stanford' },
  { icon: Award, label: 'Licensed Psychologist (PSY #45821)' },
  { icon: Heart, label: '12+ Years Clinical Experience' },
]

const specialties = [
  'Anxiety & Stress', 'Depression', 'Trauma & PTSD',
  'Relationship Issues', 'Life Transitions', 'Grief & Loss',
  'Self-Esteem', 'Burnout'
]

export function AboutSection({ title, subtitle, text, photoUrl }: AboutSectionProps) {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Photo */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100 shadow-xl max-w-md mx-auto lg:mx-0">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-200">
                  <div className="text-center text-teal-600">
                    <div className="w-20 h-20 rounded-full bg-teal-300/50 mx-auto mb-3 flex items-center justify-center">
                      <span className="text-3xl font-bold text-teal-700">RQ</span>
                    </div>
                    <p className="text-sm text-teal-500">Photo coming soon</p>
                  </div>
                </div>
              )}
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -right-4 lg:right-0 bg-white rounded-xl shadow-lg p-4 border border-stone-100 max-w-[180px]">
              <p className="text-2xl font-bold text-teal-700">500+</p>
              <p className="text-xs text-stone-500 leading-tight">Clients helped on their wellness journey</p>
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">About</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-1">{title}</h2>
            <p className="text-lg text-teal-700 mb-6">{subtitle}</p>

            <p className="text-stone-600 leading-relaxed mb-8">{text}</p>

            {/* Credentials */}
            <ul className="space-y-3 mb-8">
              {credentials.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-stone-700">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-teal-600" />
                  </div>
                  <span className="text-sm">{label}</span>
                </li>
              ))}
            </ul>

            {/* Specialties */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {specialties.map(s => (
                  <Badge key={s} variant="secondary" className="bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
