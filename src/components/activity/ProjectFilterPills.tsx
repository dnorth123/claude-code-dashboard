import { type FC, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getProjectColor } from '@/lib/colors'
import type { Session } from '@/lib/types'

interface ProjectFilterPillsProps {
  sessions: Session[]
  selectedProject: string | null
  onProjectClick: (projectId: string | null) => void
}

export const ProjectFilterPills: FC<ProjectFilterPillsProps> = ({ sessions, selectedProject, onProjectClick }) => {
  const projects = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of sessions) {
      counts.set(s.projectId, (counts.get(s.projectId) || 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, count }))
  }, [sessions])

  return (
    <div className="flex flex-wrap gap-2">
      {projects.map(({ id, count }) => {
        const color = getProjectColor(id)
        const isActive = selectedProject === id
        return (
          <button
            key={id}
            onClick={() => onProjectClick(isActive ? null : id)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            style={isActive ? { backgroundColor: color } : undefined}
          >
            {id} ({count})
          </button>
        )
      })}
    </div>
  )
}
