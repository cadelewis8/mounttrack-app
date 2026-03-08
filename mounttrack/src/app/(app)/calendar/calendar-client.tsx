'use client'
import { useRouter } from 'next/navigation'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Job } from '@/types/database'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

interface CalendarEvent {
  title: string
  start: Date
  end: Date
  resource: { id: string; is_rush: boolean; is_overdue: boolean }
}

interface CalendarClientProps {
  jobs: (Job & { is_overdue: boolean })[]
}

export function CalendarClient({ jobs }: CalendarClientProps) {
  const router = useRouter()

  const events: CalendarEvent[] = jobs.map((job) => {
    // Append T00:00:00 to avoid UTC timezone shift (dates stored as YYYY-MM-DD)
    const d = new Date(job.estimated_completion_date + 'T00:00:00')
    return {
      title: `#${String(job.job_number).padStart(4, '0')} ${job.customer_name}`,
      start: d,
      end: d,
      resource: { id: job.id, is_rush: job.is_rush, is_overdue: job.is_overdue },
    }
  })

  function handleSelectEvent(event: CalendarEvent) {
    router.push(`/jobs/${event.resource.id}`)
  }

  // Event prop getter: color rush events amber, overdue events red
  function eventPropGetter(event: CalendarEvent) {
    if (event.resource.is_overdue) {
      return { style: { backgroundColor: '#dc2626', borderColor: '#b91c1c' } }
    }
    if (event.resource.is_rush) {
      return { style: { backgroundColor: '#d97706', borderColor: '#b45309' } }
    }
    return {}
  }

  return (
    // Explicit height required — react-big-calendar collapses to 0 without it
    <div style={{ height: 'calc(100vh - 120px)' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={['month', 'week']}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        style={{ fontFamily: 'inherit' }}
      />
    </div>
  )
}
