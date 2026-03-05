-- ============================================
-- Rani Queen Psychology - Database Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin can view all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SITE SETTINGS
-- ============================================
create table if not exists public.site_settings (
  id integer primary key default 1,
  about_title text not null default 'Dr. Rani Queen',
  about_subtitle text not null default 'Licensed Psychologist & Therapist',
  about_text text not null default 'Dedicated to helping individuals navigate life''s challenges with compassion and evidence-based care. With over a decade of experience, I specialize in anxiety, depression, trauma, and relationship counseling.',
  about_photo_url text,
  hero_tagline text not null default 'Your journey to mental wellness starts here.',
  session_duration_minutes integer not null default 50,
  session_price numeric(10,2) not null default 120.00,
  currency text not null default 'USD',
  updated_at timestamptz not null default now()
);

-- Insert default settings
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "Anyone can view site settings"
  on public.site_settings for select
  using (true);

create policy "Admin can update site settings"
  on public.site_settings for update
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================
-- AVAILABILITY SLOTS
-- ============================================
create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique (slot_date, start_time)
);

alter table public.availability_slots enable row level security;

create policy "Anyone can view available slots"
  on public.availability_slots for select
  using (true);

create policy "Admin can manage slots"
  on public.availability_slots for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================
-- APPOINTMENTS
-- ============================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references public.availability_slots(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  meet_link text,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  receipt_number text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments enable row level security;

create policy "Users can view their own appointments"
  on public.appointments for select
  using (auth.uid() = user_id);

create policy "Users can create appointments"
  on public.appointments for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Admin can view all appointments"
  on public.appointments for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Admin can update appointments"
  on public.appointments for update
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================
-- TESTIMONIALS
-- ============================================
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_initials text not null,
  content text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

create policy "Anyone can view testimonials"
  on public.testimonials for select
  using (true);

create policy "Admin can manage testimonials"
  on public.testimonials for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Insert mock testimonials
insert into public.testimonials (author_name, author_initials, content, rating, is_featured) values
  ('Sarah M.', 'SM', 'Dr. Rani has been instrumental in my journey toward healing. Her compassionate approach and evidence-based techniques helped me overcome anxiety I had struggled with for years. I finally feel like myself again.', 5, true),
  ('James K.', 'JK', 'I was skeptical about therapy at first, but Dr. Queen created such a safe and non-judgmental space. After just a few sessions, I had tools to manage my stress and a completely new perspective on my relationships.', 5, true),
  ('Priya L.', 'PL', 'Working with Dr. Rani through my depression was life-changing. She truly listens and tailors her approach to what works best for you. I''ve recommended her to everyone I know who is struggling.', 5, true),
  ('Michael T.', 'MT', 'The telehealth sessions were incredibly convenient and just as effective as in-person therapy. Dr. Queen is professional, warm, and genuinely cares about her clients'' wellbeing.', 5, false),
  ('Anika R.', 'AR', 'I sought help for relationship issues and Dr. Rani helped me understand patterns I wasn''t even aware of. Her gentle guidance has transformed not only my relationship but my self-understanding.', 5, true);
