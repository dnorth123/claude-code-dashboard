import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EmptyState } from '@/components/ui/empty-state'
import { ActivityTab } from '@/components/activity/ActivityTab'
import { ProjectGrid } from '@/components/projects/ProjectGrid'
import { BacklogView } from '@/components/backlogs/BacklogView'
import { UsageTab } from '@/components/usage/UsageTab'
import { Terminal } from 'lucide-react'
import type { TabId, Project, Session, DayActivity, BacklogSection } from '@/lib/types'
import projectsData from '@/data/projects.json'
import sessionsData from '@/data/sessions.json'
import activityData from '@/data/activity.json'
import backlogsData from '@/data/backlogs.json'

const projects = projectsData as Project[]
const sessions = sessionsData as Session[]
const activity = activityData as DayActivity[]
const backlogs = backlogsData as BacklogSection[]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('activity')

  const hasData = sessions.length > 0 || projects.length > 0

  if (!hasData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EmptyState
          icon={<Terminal className="h-12 w-12" />}
          title="Run npm run refresh to load your project data."
          description="This dashboard aggregates your Claude Code session data, project metadata, and backlogs into a single view."
        />
      </div>
    )
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'activity' && (
        <ActivityTab sessions={sessions} activity={activity} />
      )}
      {activeTab === 'projects' && (
        <ProjectGrid projects={projects} />
      )}
      {activeTab === 'backlogs' && (
        <BacklogView backlogs={backlogs} />
      )}
      {activeTab === 'usage' && (
        <UsageTab sessions={sessions} activity={activity} />
      )}
    </DashboardLayout>
  )
}

export default App
