import { type FC, useMemo } from 'react'
import { format, subWeeks, addDays, startOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DayActivity } from '@/lib/types'

interface ActivityHeatmapProps {
  activity: DayActivity[]
  selectedDate: string | null
  onDateClick: (date: string) => void
}

const WEEKS = 53
const DAYS = 7
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function getIntensity(count: number): string {
  if (count === 0) return 'bg-muted'
  if (count <= 2) return 'bg-emerald-200'
  if (count <= 5) return 'bg-emerald-400'
  if (count <= 10) return 'bg-emerald-500'
  return 'bg-emerald-700'
}

export const ActivityHeatmap: FC<ActivityHeatmapProps> = ({ activity, selectedDate, onDateClick }) => {
  const { grid, monthLabels } = useMemo(() => {
    const activityMap = new Map<string, DayActivity>()
    for (const day of activity) {
      activityMap.set(day.date, day)
    }

    const today = new Date()
    const start = startOfWeek(subWeeks(today, WEEKS - 1), { weekStartsOn: 0 })
    const cells: { date: string; count: number; dayOfWeek: number; weekIndex: number }[] = []
    const months: { label: string; weekIndex: number }[] = []
    let lastMonth = -1

    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < DAYS; d++) {
        const date = addDays(start, w * 7 + d)
        if (date > today) continue
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayData = activityMap.get(dateStr)
        cells.push({
          date: dateStr,
          count: dayData?.sessionCount || 0,
          dayOfWeek: d,
          weekIndex: w,
        })

        const month = date.getMonth()
        if (month !== lastMonth && d === 0) {
          months.push({ label: format(date, 'MMM'), weekIndex: w })
          lastMonth = month
        }
      }
    }

    return { grid: cells, monthLabels: months }
  }, [activity])

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex gap-2">
        <div className="flex flex-col gap-[3px] pt-6 text-xs text-muted-foreground">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-[13px] leading-[13px]">{label}</div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="mb-1 flex gap-[3px]">
            {monthLabels.map((m, i) => {
              const nextWeek = monthLabels[i + 1]?.weekIndex ?? WEEKS
              const span = nextWeek - m.weekIndex
              return (
                <div
                  key={i}
                  className="text-xs text-muted-foreground"
                  style={{ width: `${span * 16}px`, minWidth: `${span * 16}px` }}
                >
                  {span >= 2 ? m.label : ''}
                </div>
              )
            })}
          </div>
          <div
            className="grid gap-[3px]"
            style={{
              gridTemplateColumns: `repeat(${WEEKS}, 13px)`,
              gridTemplateRows: `repeat(${DAYS}, 13px)`,
              gridAutoFlow: 'column',
            }}
          >
            {grid.map((cell) => (
              <div
                key={cell.date}
                className={cn(
                  'h-[13px] w-[13px] rounded-sm cursor-pointer transition-all',
                  getIntensity(cell.count),
                  selectedDate === cell.date && 'ring-2 ring-foreground ring-offset-1 ring-offset-background',
                  cell.count > 0 && 'hover:brightness-110'
                )}
                title={`${format(new Date(cell.date), 'MMM d, yyyy')}: ${cell.count} session${cell.count !== 1 ? 's' : ''}`}
                onClick={() => onDateClick(cell.date)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <span>Less</span>
        {['bg-muted', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-700'].map((c) => (
          <div key={c} className={cn('h-[10px] w-[10px] rounded-sm', c)} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
