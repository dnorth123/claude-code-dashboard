import { type FC, useMemo } from 'react'
import { HorizontalBar } from '@/components/ui/horizontal-bar'
import { formatCurrency } from '@/lib/utils'
import { getProjectColor } from '@/lib/colors'
import type { Session } from '@/lib/types'

interface ProjectUsageBarsProps {
  sessions: Session[]
}

export const ProjectUsageBars: FC<ProjectUsageBarsProps> = ({ sessions }) => {
  const projects = useMemo(() => {
    const map = new Map<string, { input: number; output: number; costCents: number }>()
    for (const s of sessions) {
      const prev = map.get(s.projectId) || { input: 0, output: 0, costCents: 0 }
      prev.input += s.tokens.input + s.tokens.cacheCreation + s.tokens.cacheRead
      prev.output += s.tokens.output
      prev.costCents += s.estimatedCostCents
      map.set(s.projectId, prev)
    }
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (b.input + b.output) - (a.input + a.output))
  }, [sessions])

  const maxTotal = projects.length > 0 ? projects[0].input + projects[0].output : 1

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium text-card-foreground">Token Usage by Project</h3>
      <div className="space-y-3">
        {projects.map(({ id, input, output, costCents }) => (
          <div key={id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-card-foreground">{id}</span>
              <span className="text-muted-foreground">{formatCurrency(costCents)}</span>
            </div>
            <HorizontalBar
              segments={[
                { value: input, color: getProjectColor(id), label: 'Input' },
                { value: output, color: `${getProjectColor(id)}80`, label: 'Output' },
              ]}
              total={maxTotal}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
