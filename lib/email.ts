import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')

const FROM = 'Dr. Rani Queen <appointments@raniqueen.com>'

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export async function sendBookingConfirmation(params: {
  clientName: string
  clientEmail: string
  date: string
  startTime: string
  endTime: string
  receiptNumber: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const { clientName, clientEmail, date, startTime, endTime, receiptNumber } = params

  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Session Booked – ${date} at ${formatTime(startTime)}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
        <div style="background:#0f766e;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:22px">Booking Confirmed ✓</h1>
        </div>
        <div style="background:#f5f5f4;padding:32px;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px">Hi <strong>${clientName}</strong>,</p>
          <p style="margin:0 0 24px;color:#57534e">
            Your session with Dr. Rani Queen has been received. She will confirm and send a video link shortly.
          </p>
          <div style="background:#fff;border-radius:10px;padding:20px;border:1px solid #e7e5e4;margin-bottom:24px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="color:#78716c;font-size:13px;padding:6px 0">Receipt</td>
                  <td style="font-family:monospace;font-weight:600;color:#0f766e;font-size:13px">${receiptNumber}</td></tr>
              <tr><td style="color:#78716c;font-size:13px;padding:6px 0">Date</td>
                  <td style="font-weight:600;font-size:13px">${date}</td></tr>
              <tr><td style="color:#78716c;font-size:13px;padding:6px 0">Time</td>
                  <td style="font-weight:600;font-size:13px">${formatTime(startTime)} – ${formatTime(endTime)}</td></tr>
              <tr><td style="color:#78716c;font-size:13px;padding:6px 0">Status</td>
                  <td style="font-size:13px"><span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:20px;font-size:12px">Pending Confirmation</span></td></tr>
            </table>
          </div>
          <p style="margin:0;font-size:13px;color:#78716c">
            Questions? Reply to this email or visit your dashboard to manage your appointment.
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendAdminNewBooking(params: {
  adminEmail: string
  clientName: string
  clientEmail: string
  date: string
  startTime: string
  endTime: string
  receiptNumber: string
  notes?: string | null
}) {
  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) return

  const { adminEmail, clientName, clientEmail, date, startTime, endTime, receiptNumber, notes } = params

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New Booking: ${clientName} on ${date}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
        <div style="background:#1c1917;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:20px">New Appointment Request</h1>
        </div>
        <div style="background:#f5f5f4;padding:32px;border-radius:0 0 12px 12px">
          <div style="background:#fff;border-radius:10px;padding:20px;border:1px solid #e7e5e4;margin-bottom:24px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="color:#78716c;font-size:13px;padding:6px 0">Client</td>
                  <td style="font-weight:600;font-size:13px">${clientName}</td></tr>
              <tr><td style="color:#78716c;font-size:13px;padding:6px 0">Email</td>
                  <td style="font-size:13px">${clientEmail}</td></tr>
              <tr><td style="color:#78716c;font-size:13px;padding:6px 0">Date</td>
                  <td style="font-weight:600;font-size:13px">${date}</td></tr>
              <tr><td style="color:#78716c;font-size:13px;padding:6px 0">Time</td>
                  <td style="font-weight:600;font-size:13px">${formatTime(startTime)} – ${formatTime(endTime)}</td></tr>
              <tr><td style="color:#78716c;font-size:13px;padding:6px 0">Receipt</td>
                  <td style="font-family:monospace;font-size:13px;color:#0f766e">${receiptNumber}</td></tr>
              ${notes ? `<tr><td style="color:#78716c;font-size:13px;padding:6px 0;vertical-align:top">Notes</td>
                  <td style="font-size:13px;font-style:italic">"${notes}"</td></tr>` : ''}
            </table>
          </div>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/admin/appointments"
             style="display:inline-block;background:#0f766e;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
            View in Admin Panel →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendCancellationEmail(params: {
  clientName: string
  clientEmail: string
  date: string
  startTime: string
  receiptNumber: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const { clientName, clientEmail, date, startTime, receiptNumber } = params

  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Session Cancelled – ${date}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
        <div style="background:#7f1d1d;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:22px">Session Cancelled</h1>
        </div>
        <div style="background:#f5f5f4;padding:32px;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px">Hi <strong>${clientName}</strong>,</p>
          <p style="margin:0 0 24px;color:#57534e">
            Your session on <strong>${date} at ${formatTime(startTime)}</strong> (receipt: <code>${receiptNumber}</code>) has been cancelled.
          </p>
          <p style="margin:0 0 24px;color:#57534e">If this was a mistake or you'd like to rebook, please visit our website.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/book"
             style="display:inline-block;background:#0f766e;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
            Book a New Session →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendMeetLinkEmail(params: {
  clientName: string
  clientEmail: string
  date: string
  startTime: string
  endTime: string
  meetLink: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const { clientName, clientEmail, date, startTime, endTime, meetLink } = params

  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Your session is confirmed – Join link inside`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
        <div style="background:#0f766e;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:22px">Session Confirmed ✓</h1>
        </div>
        <div style="background:#f5f5f4;padding:32px;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px">Hi <strong>${clientName}</strong>,</p>
          <p style="margin:0 0 24px;color:#57534e">
            Your session on <strong>${date} at ${formatTime(startTime)} – ${formatTime(endTime)}</strong> is confirmed. Here's your video link:
          </p>
          <a href="${meetLink}"
             style="display:inline-block;background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;margin-bottom:24px">
            🎥 Join Video Session
          </a>
          <p style="margin:0;font-size:13px;color:#78716c">
            Link: <a href="${meetLink}" style="color:#0f766e">${meetLink}</a>
          </p>
        </div>
      </div>
    `,
  })
}
