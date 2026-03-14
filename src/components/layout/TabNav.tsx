import type { FC } from 'react'
import { Activity, FolderOpen, ListTodo, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabId } from '@/lib/types'

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'backlogs', label: 'Backlogs', icon: ListTodo },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
]

interface TabNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export const TabNav: FC<TabNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="flex gap-1 border-b border-border">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
            'border-b-2 -mb-px',
            activeTab === id
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </nav>
  )
}
