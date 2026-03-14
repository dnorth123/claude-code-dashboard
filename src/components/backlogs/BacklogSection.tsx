import type { FC } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { HorizontalBar } from '@/components/ui/horizontal-bar'
import type { BacklogSection as BacklogSectionType } from '@/lib/types'

interface BacklogSectionProps {
  section: BacklogSectionType
}

export const BacklogSectionComponent: FC<BacklogSectionProps> = ({ section }) => {
  const done = section.items.filter((i) => i.done).length
  const total = section.items.length

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-card-foreground">{section.section}</h4>
        <div className="flex items-center gap-2">
          {section.sectionStatus && (
            <Badge variant={section.sectionStatus === 'COMPLETE' ? 'success' : 'muted'}>
              {section.sectionStatus}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{done}/{total}</span>
        </div>
      </div>
      <HorizontalBar
        className="mt-2"
        segments={[{ value: done, color: '#10b981', label: 'Done' }]}
        total={total}
      />
      <ul className="mt-3 space-y-1">
        {section.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            {item.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className={item.done ? 'line-through text-muted-foreground' : 'text-card-foreground'}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
