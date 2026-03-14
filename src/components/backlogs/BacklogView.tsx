import { type FC, useMemo, useState } from 'react'
import { BacklogSectionComponent } from './BacklogSection'
import { EmptyState } from '@/components/ui/empty-state'
import { ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BacklogSection } from '@/lib/types'

interface BacklogViewProps {
  backlogs: BacklogSection[]
}

type Filter = 'all' | 'incomplete' | 'complete'

export const BacklogView: FC<BacklogViewProps> = ({ backlogs }) => {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return backlogs
    return backlogs
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          filter === 'complete' ? item.done : !item.done
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [backlogs, filter])

  const grouped = useMemo(() => {
    const groups = new Map<string, BacklogSection[]>()
    for (const section of filtered) {
      if (!groups.has(section.projectId)) groups.set(section.projectId, [])
      groups.get(section.projectId)!.push(section)
    }
    return Array.from(groups.entries())
  }, [filtered])

  if (backlogs.length === 0) {
    return (
      <EmptyState
        icon={<ListTodo className="h-12 w-12" />}
        title="No backlogs found."
        description="Add .claude/backlog.md to a project to track work items."
      />
    )
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'incomplete', label: 'Incomplete' },
    { id: 'complete', label: 'Complete' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              filter === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <EmptyState title="No items match the current filter." />
      ) : (
        grouped.map(([projectId, sections]) => (
          <div key={projectId}>
            <h3 className="mb-3 text-lg font-medium text-foreground capitalize">
              {projectId.replace(/-/g, ' ')}
            </h3>
            <div className="space-y-3">
              {sections.map((section, i) => (
                <BacklogSectionComponent key={i} section={section} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
