/**
 * Generates an .ics calendar file string for an appointment.
 */
export function generateICS(params: {
  title: string
  date: string        // YYYY-MM-DD
  startTime: string   // HH:mm
  endTime: string     // HH:mm
  description?: string
  location?: string
  uid: string
}): string {
  const { title, date, startTime, endTime, description, location, uid } = params

  const toICSDate = (dateStr: string, timeStr: string) => {
    const [y, mo, d] = dateStr.split('-')
    const [h, m] = timeStr.split(':')
    return `${y}${mo.padStart(2, '0')}${d.padStart(2, '0')}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`
  }

  const dtStart = toICSDate(date, startTime)
  const dtEnd = toICSDate(date, endTime)
  const now = toICSDate(
    new Date().toISOString().split('T')[0],
    new Date().toTimeString().split(' ')[0].substring(0, 5)
  )

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rani Queen Psychology//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@raniqueen.com`,
    `DTSTAMP:${now}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
    location ? `LOCATION:${location}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

export function downloadICS(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
