import { type FC, useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, timeAgo } from '@/lib/utils'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'muted' | 'secondary'> = {
  Active: 'success',
  Maintenance: 'warning',
  Parked: 'muted',
  Unknown: 'secondary',
}

export const ProjectCard: FC<ProjectCardProps> = ({ project }) => {
  const [expanded, setExpanded] = useState(false)
  const hasMetadata = project.currentStateSummary || project.openQuestions || project.whereILeftOff

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-card-foreground truncate">{project.name}</h3>
            <Badge variant={STATUS_VARIANT[project.status] || 'secondary'}>
              {project.status}
            </Badge>
          </div>
          {project.stack && project.stack !== '—' && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {project.stack.split('/').map((s) => s.trim()).filter(Boolean).map((tech) => (
                <span key={tech} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
        {project.productionUrl && (
          <a
            href={project.productionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
        <span>{project.sessionCount} session{project.sessionCount !== 1 ? 's' : ''}</span>
        <span>
          {project.lastSessionDate
            ? timeAgo(project.lastSessionDate)
            : 'No sessions'}
        </span>
      </div>

      {hasMetadata && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
            {expanded ? 'Less' : 'More'}
          </button>
          {expanded && (
            <div className="mt-3 space-y-3 text-sm">
              {project.whereILeftOff && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Where I Left Off</p>
                  <p className="mt-0.5 text-card-foreground">{project.whereILeftOff}</p>
                </div>
              )}
              {project.currentStateSummary && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Current State</p>
                  <p className="mt-0.5 whitespace-pre-line text-card-foreground">{project.currentStateSummary}</p>
                </div>
              )}
              {project.openQuestions && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Open Questions</p>
                  <p className="mt-0.5 whitespace-pre-line text-card-foreground">{project.openQuestions}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
