'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar'
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
} from 'date-fns'
import { enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

// ---------------------------------------------------------------------------
// Custom toolbar — replaces react-big-calendar's default
// ---------------------------------------------------------------------------
interface ToolbarProps {
  date: Date
  view: View
  onNavigate: (date: Date) => void
  onView: (view: View) => void
}

function CalendarToolbar({ date, view, onNavigate, onView }: ToolbarProps) {
  const weekStart = startOfWeek(date, { locale: enUS })
  const weekEnd = addDays(weekStart, 6)

  const label =
    view === 'month'
      ? format(date, 'MMMM yyyy')
      : format(weekStart, 'MMM') === format(weekEnd, 'MMM')
        ? `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd, yyyy')}`
        : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`

  function goBack() {
    onNavigate(view === 'month' ? subMonths(date, 1) : subWeeks(date, 1))
  }
  function goForward() {
    onNavigate(view === 'month' ? addMonths(date, 1) : addWeeks(date, 1))
  }

  return (
    <div className="flex items-center justify-between mb-3 px-1 shrink-0">
      {/* Back / Today / Forward */}
      <div className="flex items-center gap-1">
        <button
          onClick={goBack}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onNavigate(new Date())}
          className="h-8 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Today
        </button>
        <button
          onClick={goForward}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Month / date label */}
      <span className="text-sm font-semibold">{label}</span>

      {/* Month / Week toggle */}
      <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
        <button
          onClick={() => onView('month')}
          className={`h-7 rounded-md px-3 text-xs font-medium transition-colors ${
            view === 'month'
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => onView('week')}
          className={`h-7 rounded-md px-3 text-xs font-medium transition-colors ${
            view === 'week'
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          Week
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function CalendarClient({ jobs }: CalendarClientProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>('month')

  const events: CalendarEvent[] = jobs
    .filter((job) => !!job.estimated_completion_date)
    .map((job) => {
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

  function eventPropGetter(event: CalendarEvent) {
    if (event.resource.is_overdue) {
      return { style: { backgroundColor: '#dc2626', borderColor: '#b91c1c', color: '#fff' } }
    }
    if (event.resource.is_rush) {
      return { style: { backgroundColor: '#d97706', borderColor: '#b45309', color: '#fff' } }
    }
    return { style: { backgroundColor: '#7c3aed', borderColor: '#6d28d9', color: '#fff' } }
  }

  return (
    <div className="h-full flex flex-col">
      <CalendarToolbar
        date={currentDate}
        view={currentView}
        onNavigate={setCurrentDate}
        onView={setCurrentView}
      />
      {/* min-h-0 is required — flex children won't shrink below content size otherwise */}
      <div className="flex-1 min-h-0">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={currentView}
          onNavigate={setCurrentDate}
          onView={setCurrentView}
          views={['month', 'week']}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          style={{ height: '100%', fontFamily: 'inherit' }}
          components={{ toolbar: () => null }}
        />
      </div>
    </div>
  )
}
