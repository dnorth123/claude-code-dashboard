import type { FC } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { formatDuration, formatTokens } from '@/lib/utils'
import { getProjectColor } from '@/lib/colors'
import type { Session } from '@/lib/types'

interface SessionCardProps {
  session: Session
}

export const SessionCard: FC<SessionCardProps> = ({ session }) => {
  const color = getProjectColor(session.projectId)
  const totalTokens = session.tokens.input + session.tokens.output + session.tokens.cacheCreation + session.tokens.cacheRead

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50">
      <Badge
        className="mt-0.5 shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {session.projectId}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{format(new Date(session.startTime), 'h:mm a')}</span>
          <span>·</span>
          <span>{formatDuration(session.durationMinutes)}</span>
          {session.gitBranch && (
            <>
              <span>·</span>
              <span className="truncate font-mono text-xs">{session.gitBranch}</span>
            </>
          )}
        </div>
        <p className={session.firstPrompt ? 'mt-1 text-sm text-foreground line-clamp-2' : 'mt-1 text-sm text-muted-foreground italic'}>
          {session.firstPrompt || 'No prompt recorded'}
        </p>
      </div>
      <Badge variant="muted" className="shrink-0">
        {formatTokens(totalTokens)}
      </Badge>
    </div>
  )
}
