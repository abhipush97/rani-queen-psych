export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { HeroSection } from '@/components/landing/HeroSection'
import { AboutSection } from '@/components/landing/AboutSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { BookingCTA } from '@/components/landing/BookingCTA'
import type { SiteSettings, Testimonial } from '@/types/database'

const defaultSettings: SiteSettings = {
  id: 1,
  about_title: 'Dr. Rani Queen',
  about_subtitle: 'Licensed Psychologist & Therapist',
  about_text: "Dedicated to helping individuals navigate life's challenges with compassion and evidence-based care. With over a decade of experience, I specialize in anxiety, depression, trauma, and relationship counseling.",
  about_photo_url: null,
  hero_tagline: 'Your journey to mental wellness starts here.',
  session_duration_minutes: 50,
  session_price: 120,
  currency: 'USD',
  updated_at: new Date().toISOString(),
}

const mockTestimonials: Testimonial[] = [
  { id: '1', author_name: 'Sarah M.', author_initials: 'SM', rating: 5, is_featured: true, created_at: new Date().toISOString(), content: "Dr. Rani has been instrumental in my journey toward healing. Her compassionate approach and evidence-based techniques helped me overcome anxiety I had struggled with for years." },
  { id: '2', author_name: 'James K.', author_initials: 'JK', rating: 5, is_featured: true, created_at: new Date().toISOString(), content: "I was skeptical about therapy at first, but Dr. Queen created such a safe and non-judgmental space. After just a few sessions, I had tools to manage my stress effectively." },
  { id: '3', author_name: 'Priya L.', author_initials: 'PL', rating: 5, is_featured: true, created_at: new Date().toISOString(), content: "Working with Dr. Rani through my depression was life-changing. She truly listens and tailors her approach to what works best for you." },
  { id: '4', author_name: 'Michael T.', author_initials: 'MT', rating: 5, is_featured: false, created_at: new Date().toISOString(), content: "The telehealth sessions were incredibly convenient and just as effective as in-person therapy. Dr. Queen is professional, warm, and genuinely cares." },
  { id: '5', author_name: 'Anika R.', author_initials: 'AR', rating: 5, is_featured: true, created_at: new Date().toISOString(), content: "Dr. Rani helped me understand patterns I wasn't even aware of. Her gentle guidance has transformed my relationships and self-understanding." },
]

export default async function HomePage() {
  let settings = defaultSettings
  let testimonials = mockTestimonials

  try {
    const supabase = await createClient()
    const [settingsRes, testimonialsRes] = await Promise.all([
      supabase.from('site_settings').select('*').eq('id', 1).single(),
      supabase.from('testimonials').select('*').eq('is_featured', true).order('created_at'),
    ])
    if (settingsRes.data) settings = settingsRes.data
    if (testimonialsRes.data?.length) testimonials = testimonialsRes.data
  } catch {
    // Use defaults if DB not connected yet
  }

  return (
    <main>
      <HeroSection tagline={settings.hero_tagline} />
      <AboutSection
        title={settings.about_title}
        subtitle={settings.about_subtitle}
        text={settings.about_text}
        photoUrl={settings.about_photo_url}
      />
      <TestimonialsSection testimonials={testimonials} />
      <BookingCTA
        sessionPrice={settings.session_price}
        sessionDuration={settings.session_duration_minutes}
        currency={settings.currency}
      />
    </main>
  )
}
