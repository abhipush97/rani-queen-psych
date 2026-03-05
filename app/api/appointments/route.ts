import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendBookingConfirmation, sendAdminNewBooking } from '@/lib/email'
import { format, parseISO } from 'date-fns'

function generateReceiptNumber() {
  const prefix = 'RQ'
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${ts}-${rand}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slotId, clientName, clientEmail, clientPhone, notes } = body

    if (!slotId || !clientName || !clientEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Mark slot unavailable (optimistic lock — only if still available)
    const { error: slotError, count } = await supabase
      .from('availability_slots')
      .update({ is_available: false })
      .eq('id', slotId)
      .eq('is_available', true)

    if (slotError || count === 0) {
      return NextResponse.json({ error: 'slot_taken' }, { status: 409 })
    }

    // Fetch slot details
    const { data: slot } = await supabase
      .from('availability_slots')
      .select('slot_date, start_time, end_time')
      .eq('id', slotId)
      .single()

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    const receiptNumber = generateReceiptNumber()
    const dateFormatted = format(parseISO(slot.slot_date), 'EEEE, MMMM d, yyyy')

    // Create appointment
    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .insert({
        slot_id: slotId,
        user_id: user?.id ?? null,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone || null,
        notes: notes || null,
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        receipt_number: receiptNumber,
        status: 'pending',
      })
      .select()
      .single()

    if (apptError) {
      // Rollback slot
      await supabase.from('availability_slots').update({ is_available: true }).eq('id', slotId)
      return NextResponse.json({ error: apptError.message }, { status: 500 })
    }

    // Send emails (non-blocking — don't fail the request if email fails)
    const emailParams = {
      clientName,
      clientEmail,
      date: dateFormatted,
      startTime: slot.start_time,
      endTime: slot.end_time,
      receiptNumber,
    }

    await Promise.allSettled([
      sendBookingConfirmation(emailParams),
      sendAdminNewBooking({
        ...emailParams,
        adminEmail: process.env.ADMIN_EMAIL ?? '',
        notes,
      }),
    ])

    return NextResponse.json({ appointment, receiptNumber }, { status: 201 })
  } catch (error) {
    console.error('POST /api/appointments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
