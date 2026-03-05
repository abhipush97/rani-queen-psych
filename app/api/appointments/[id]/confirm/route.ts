import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendMeetLinkEmail } from '@/lib/email'
import { format, parseISO } from 'date-fns'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { meetLink, status } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: prev } = await supabase.from('appointments').select('*').eq('id', id).single()
    if (!prev) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (meetLink !== undefined) updates.meet_link = meetLink || null

    const { error } = await supabase.from('appointments').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If status changed to confirmed and meet link provided, email the client
    if (status === 'confirmed' && meetLink && prev.status !== 'confirmed') {
      await sendMeetLinkEmail({
        clientName: prev.client_name,
        clientEmail: prev.client_email,
        date: format(parseISO(prev.slot_date), 'EEEE, MMMM d, yyyy'),
        startTime: prev.start_time,
        endTime: prev.end_time,
        meetLink,
      }).catch(console.warn)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/appointments/[id]/confirm error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
