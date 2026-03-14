import type { FC, ReactNode } from 'react'
import { TabNav } from './TabNav'
import type { TabId } from '@/lib/types'

interface DashboardLayoutProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Claude Code Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Best viewed on desktop
              </p>
            </div>
          </div>
          <TabNav activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  )
}
