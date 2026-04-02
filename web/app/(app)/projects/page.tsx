'use client'

import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects'
import { ProjectsContent } from '@/components/features/projects/projects-content'
import { ProjectsSkeleton } from '@/components/features/projects/projects-skeleton'
import { classifyError } from '@/lib/errors'
import type { ProjectId } from '@/types/branded'
import type { CreateProjectInput, UpdateProjectInput } from '@/types/domain'

export default function ProjectsPage() {
  const { data: projects, isLoading, error, refetch } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  if (isLoading) return <ProjectsSkeleton />

  if (error && !projects) {
    const classified = classifyError(error)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-foreground">{classified.title}</p>
        <p className="text-sm text-foreground-secondary">{classified.message}</p>
        {classified.retryable && (
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  return (
    <ProjectsContent
      projects={projects ?? []}
      onCreateProject={(input: CreateProjectInput) => createProject.mutate(input)}
      onUpdateProject={(id: ProjectId, input: UpdateProjectInput) =>
        updateProject.mutate({ id, input })
      }
      onDeleteProject={(id: ProjectId) => deleteProject.mutate(id)}
      isCreating={createProject.isPending}
      isUpdating={updateProject.isPending}
      isDeleting={deleteProject.isPending}
    />
  )
}
