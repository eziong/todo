'use client'

import { useParams } from 'next/navigation'
import { ProjectId } from '@/types/branded'
import { useProject } from '@/hooks/useProject'
import { useTodos } from '@/hooks/useTodos'
import { ProjectDetailContent } from '@/components/features/projects/project-detail-content'

export default function ProjectOverviewPage() {
  const params = useParams<{ id: string }>()
  const projectId = ProjectId(params.id)

  const { data: project } = useProject(projectId)
  const {
    data: todos,
    isLoading: todosLoading,
  } = useTodos({ projectId: projectId as string })

  if (!project) return null

  return (
    <ProjectDetailContent
      project={project}
      todos={todos ?? []}
      todosLoading={todosLoading}
    />
  )
}
