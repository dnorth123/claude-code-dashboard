import type { FC } from 'react'
import { ProjectCard } from './ProjectCard'
import { EmptyState } from '@/components/ui/empty-state'
import type { Project } from '@/lib/types'

interface ProjectGridProps {
  projects: Project[]
}

export const ProjectGrid: FC<ProjectGridProps> = ({ projects }) => {
  if (projects.length === 0) {
    return <EmptyState title="No projects found." />
  }

  return (
    <div className="grid grid-cols-2 gap-4 2xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
