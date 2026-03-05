'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Upload, User, DollarSign, Globe } from 'lucide-react'
import Image from 'next/image'
import type { SiteSettings } from '@/types/database'

const defaultSettings: Partial<SiteSettings> = {
  about_title: 'Dr. Rani Queen',
  about_subtitle: 'Licensed Psychologist & Therapist',
  about_text: '',
  about_photo_url: null,
  hero_tagline: 'Your journey to mental wellness starts here.',
  session_duration_minutes: 50,
  session_price: 120,
  currency: 'USD',
}

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<Partial<SiteSettings>>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single()
      if (data) {
        setSettings(data)
        setPhotoPreview(data.about_photo_url)
      }
      setLoading(false)
    }
    fetch()
  }, [supabase])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `about/photo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('site-assets')
      .getPublicUrl(path)

    setSettings(s => ({ ...s, about_photo_url: publicUrl }))
    setPhotoPreview(publicUrl)
    toast.success('Photo uploaded!')
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        id: 1,
        ...settings,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success('Settings saved successfully!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Site Settings</h1>
        <p className="text-stone-500 mt-1">Customize your public-facing profile and site content</p>
      </div>

      <div className="space-y-6">
        {/* Profile Photo */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-start gap-6">
              {/* Preview */}
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-stone-300 hover:border-teal-400 hover:bg-teal-50 transition-colors w-fit">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-stone-400" />
                    )}
                    <span className="text-sm text-stone-600">
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </span>
                  </div>
                </Label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-stone-400 mt-2">JPG, PNG or WebP · Max 5MB</p>
                {settings.about_photo_url && (
                  <button
                    onClick={() => { setSettings(s => ({ ...s, about_photo_url: null })); setPhotoPreview(null) }}
                    className="text-xs text-red-400 hover:text-red-500 mt-1 block"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-600" />
              About Section
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div>
              <Label htmlFor="about-title">Display Name</Label>
              <Input
                id="about-title"
                value={settings.about_title ?? ''}
                onChange={e => setSettings(s => ({ ...s, about_title: e.target.value }))}
                placeholder="Dr. Rani Queen"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="about-subtitle">Subtitle / Title</Label>
              <Input
                id="about-subtitle"
                value={settings.about_subtitle ?? ''}
                onChange={e => setSettings(s => ({ ...s, about_subtitle: e.target.value }))}
                placeholder="Licensed Psychologist & Therapist"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="about-text">Bio</Label>
              <Textarea
                id="about-text"
                rows={5}
                value={settings.about_text ?? ''}
                onChange={e => setSettings(s => ({ ...s, about_text: e.target.value }))}
                placeholder="Write your professional bio..."
                className="mt-1 resize-none"
              />
            </div>
            <div>
              <Label htmlFor="hero-tagline">Hero Tagline</Label>
              <Input
                id="hero-tagline"
                value={settings.hero_tagline ?? ''}
                onChange={e => setSettings(s => ({ ...s, hero_tagline: e.target.value }))}
                placeholder="Your journey to mental wellness starts here."
                className="mt-1"
              />
              <p className="text-xs text-stone-400 mt-1">Shown as the main headline on your homepage</p>
            </div>
          </CardContent>
        </Card>

        {/* Session Pricing */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session-price">Session Price</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                  <Input
                    id="session-price"
                    type="number"
                    min={0}
                    value={settings.session_price ?? 120}
                    onChange={e => setSettings(s => ({ ...s, session_price: parseFloat(e.target.value) }))}
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="session-duration">Duration (minutes)</Label>
                <Input
                  id="session-duration"
                  type="number"
                  min={15}
                  max={180}
                  value={settings.session_duration_minutes ?? 50}
                  onChange={e => setSettings(s => ({ ...s, session_duration_minutes: parseInt(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-teal-600 hover:bg-teal-700"
          size="lg"
        >
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save All Settings'}
        </Button>
      </div>
    </div>
  )
}
