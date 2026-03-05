import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendCancellationEmail } from '@/lib/email'
import { format, parseISO } from 'date-fns'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the appointment and verify ownership
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()

    if (!appointment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Only allow cancellation by the booking owner or an admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = appointment.user_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
    }

    // Cancel appointment and re-open the slot
    const [, slotResult] = await Promise.all([
      supabase
        .from('appointments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id),
      appointment.slot_id
        ? supabase
            .from('availability_slots')
            .update({ is_available: true })
            .eq('id', appointment.slot_id)
        : Promise.resolve({ error: null }),
    ])

    if (slotResult.error) {
      console.warn('Could not re-open slot:', slotResult.error)
    }

    // Send cancellation email
    await sendCancellationEmail({
      clientName: appointment.client_name,
      clientEmail: appointment.client_email,
      date: format(parseISO(appointment.slot_date), 'EEEE, MMMM d, yyyy'),
      startTime: appointment.start_time,
      receiptNumber: appointment.receipt_number,
    }).catch(console.warn)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/appointments/[id]/cancel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
