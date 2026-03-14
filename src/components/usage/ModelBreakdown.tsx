import type { FC } from 'react'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Session } from '@/lib/types'

interface ModelBreakdownProps {
  sessions: Session[]
}

function normalizeModelName(model: string): string {
  if (model.startsWith('claude-opus')) return 'Opus'
  if (model.startsWith('claude-sonnet')) return 'Sonnet'
  if (model.startsWith('claude-haiku')) return 'Haiku'
  return model
}

export const ModelBreakdown: FC<ModelBreakdownProps> = ({ sessions }) => {
  const breakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of sessions) {
      const name = normalizeModelName(s.model)
      counts.set(name, (counts.get(name) || 0) + 1)
    }
    const total = sessions.length || 1
    return Array.from(counts.entries())
      .map(([model, count]) => ({
        model,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [sessions])

  return (
    <div className="flex flex-wrap gap-2">
      {breakdown.map(({ model, pct }) => (
        <Badge key={model} variant="secondary">
          {model} {pct}%
        </Badge>
      ))}
    </div>
  )
}
