import { type FC, useMemo } from 'react'
import { format } from 'date-fns'
import type { DayActivity } from '@/lib/types'
import type { Session } from '@/lib/types'

interface DailyTrendProps {
  sessions: Session[]
  activity: DayActivity[]
}

export const DailyTrend: FC<DailyTrendProps> = ({ sessions }) => {
  const dailyCosts = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of sessions) {
      const date = s.startTime.slice(0, 10)
      map.set(date, (map.get(date) || 0) + s.estimatedCostCents)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, cents]) => ({ date, dollars: cents / 100 }))
  }, [sessions])

  if (dailyCosts.length === 0) return null

  const maxDollars = Math.max(...dailyCosts.map((d) => d.dollars), 1)
  const chartWidth = 800
  const chartHeight = 200
  const padding = { top: 20, right: 20, bottom: 30, left: 50 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const points = dailyCosts.map((d, i) => {
    const x = padding.left + (i / Math.max(dailyCosts.length - 1, 1)) * innerWidth
    const y = padding.top + innerHeight - (d.dollars / maxDollars) * innerHeight
    return { x, y, ...d }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  const yTicks = [0, maxDollars / 2, maxDollars].map((v) => ({
    value: v,
    y: padding.top + innerHeight - (v / maxDollars) * innerHeight,
    label: `$${v.toFixed(0)}`,
  }))

  const xLabelInterval = Math.max(1, Math.floor(dailyCosts.length / 6))

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium text-card-foreground">Daily Cost Trend</h3>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
        {yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={chartWidth - padding.right}
              y2={tick.y}
              stroke="hsl(var(--border))"
              strokeDasharray="4,4"
            />
            <text
              x={padding.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[11px]"
            >
              {tick.label}
            </text>
          </g>
        ))}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <g key={p.date}>
            <circle
              cx={p.x}
              cy={p.y}
              r="3"
              fill="hsl(var(--primary))"
              className="opacity-0 hover:opacity-100"
            >
              <title>{`${format(new Date(p.date), 'MMM d')}: $${p.dollars.toFixed(2)}`}</title>
            </circle>
            {i % xLabelInterval === 0 && (
              <text
                x={p.x}
                y={chartHeight - 5}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {format(new Date(p.date), 'M/d')}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
