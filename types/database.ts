export type UserRole = 'user' | 'admin'
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface SiteSettings {
  id: number
  about_title: string
  about_subtitle: string
  about_text: string
  about_photo_url: string | null
  hero_tagline: string
  session_duration_minutes: number
  session_price: number
  currency: string
  updated_at: string
}

export interface AvailabilitySlot {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
}

export interface Appointment {
  id: string
  slot_id: string | null
  user_id: string | null
  client_name: string
  client_email: string
  client_phone: string | null
  notes: string | null
  status: AppointmentStatus
  meet_link: string | null
  slot_date: string
  start_time: string
  end_time: string
  receipt_number: string
  created_at: string
  updated_at: string
}

export interface Testimonial {
  id: string
  author_name: string
  author_initials: string
  content: string
  rating: number
  is_featured: boolean
  created_at: string
}
