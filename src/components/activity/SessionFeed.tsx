import { type FC, useMemo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { X } from 'lucide-react'
import { SessionCard } from './SessionCard'
import { EmptyState } from '@/components/ui/empty-state'
import type { Session } from '@/lib/types'

interface SessionFeedProps {
  sessions: Session[]
  filterDate: string | null
  filterProject: string | null
  onClearDate: () => void
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d')
}

export const SessionFeed: FC<SessionFeedProps> = ({ sessions, filterDate, filterProject, onClearDate }) => {
  const filtered = useMemo(() => {
    let result = sessions
    if (filterDate) {
      result = result.filter((s) => s.startTime.slice(0, 10) === filterDate)
    }
    if (filterProject) {
      result = result.filter((s) => s.projectId === filterProject)
    }
    return [...result].sort((a, b) => b.startTime.localeCompare(a.startTime))
  }, [sessions, filterDate, filterProject])

  const grouped = useMemo(() => {
    const groups: { date: string; label: string; sessions: Session[] }[] = []
    let currentDate = ''
    for (const session of filtered) {
      const date = session.startTime.slice(0, 10)
      if (date !== currentDate) {
        currentDate = date
        groups.push({ date, label: formatDateHeader(date), sessions: [] })
      }
      groups[groups.length - 1].sessions.push(session)
    }
    return groups
  }, [filtered])

  return (
    <div className="space-y-4">
      {filterDate && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            Showing {format(new Date(filterDate), 'MMMM d, yyyy')}
          </span>
          <button
            onClick={onClearDate}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="No sessions match the current filters." />
      ) : (
        grouped.map((group) => (
          <div key={group.date}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{group.label}</h3>
            <div className="space-y-2">
              {group.sessions.map((session) => (
                <SessionCard key={session.sessionId} session={session} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
