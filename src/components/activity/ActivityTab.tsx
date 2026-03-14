import { type FC, useState } from 'react'
import { ActivityHeatmap } from './ActivityHeatmap'
import { SessionFeed } from './SessionFeed'
import { ProjectFilterPills } from './ProjectFilterPills'
import type { Session, DayActivity } from '@/lib/types'

interface ActivityTabProps {
  sessions: Session[]
  activity: DayActivity[]
}

export const ActivityTab: FC<ActivityTabProps> = ({ sessions, activity }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const handleDateClick = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date))
  }

  return (
    <div className="space-y-6">
      <ActivityHeatmap
        activity={activity}
        selectedDate={selectedDate}
        onDateClick={handleDateClick}
      />
      <ProjectFilterPills
        sessions={sessions}
        selectedProject={selectedProject}
        onProjectClick={setSelectedProject}
      />
      <SessionFeed
        sessions={sessions}
        filterDate={selectedDate}
        filterProject={selectedProject}
        onClearDate={() => setSelectedDate(null)}
      />
    </div>
  )
}
