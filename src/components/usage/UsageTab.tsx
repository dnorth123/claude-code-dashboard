import type { FC } from 'react'
import { UsageSummary } from './UsageSummary'
import { ProjectUsageBars } from './ProjectUsageBars'
import { DailyTrend } from './DailyTrend'
import { ModelBreakdown } from './ModelBreakdown'
import type { Session, DayActivity } from '@/lib/types'

interface UsageTabProps {
  sessions: Session[]
  activity: DayActivity[]
}

export const UsageTab: FC<UsageTabProps> = ({ sessions, activity }) => {
  return (
    <div className="space-y-6">
      <UsageSummary sessions={sessions} />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Model Distribution:</span>
        <ModelBreakdown sessions={sessions} />
      </div>
      <DailyTrend sessions={sessions} activity={activity} />
      <ProjectUsageBars sessions={sessions} />
    </div>
  )
}
