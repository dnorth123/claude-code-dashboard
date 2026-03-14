import type { FC } from 'react'
import { cn } from '@/lib/utils'

interface Segment {
  value: number
  color: string
  label?: string
}

interface HorizontalBarProps {
  segments: Segment[]
  total: number
  className?: string
}

export const HorizontalBar: FC<HorizontalBarProps> = ({ segments, total, className }) => {
  return (
    <div className={cn('flex h-3 w-full overflow-hidden rounded-full bg-muted', className)}>
      {segments.map((seg, i) => {
        const pct = total > 0 ? (seg.value / total) * 100 : 0
        if (pct === 0) return null
        return (
          <div
            key={i}
            className="h-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: seg.color }}
            title={seg.label ? `${seg.label}: ${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}
          />
        )
      })}
    </div>
  )
}
