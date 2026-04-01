'use client'

import { useParams } from 'next/navigation'
import { useBuilds, useCreateBuild, useDeleteBuild } from '@/hooks/useBuilds'
import { useBuildCommands } from '@/hooks/useBuildCommands'
import { useProjects } from '@/hooks/useProjects'
import { BuildsContent } from '@/components/features/builds/builds-content'
import { BuildsSkeleton } from '@/components/features/builds/builds-skeleton'
import { classifyError } from '@/lib/errors'
import type { BuildId } from '@/types/branded'
import type { CreateBuildInput } from '@/types/domain'

export default function ProjectBuildsPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const { data: builds, isLoading: buildsLoading, error: buildsError, refetch } = useBuilds(projectId)
  const { data: buildCommands, isLoading: buildCommandsLoading } = useBuildCommands(projectId)
  const { data: projects, isLoading: projectsLoading } = useProjects(false)
  const createBuild = useCreateBuild()
  const deleteBuild = useDeleteBuild()

  const isLoading = buildsLoading || buildCommandsLoading || projectsLoading

  if (isLoading) return <BuildsSkeleton />

  if (buildsError && !builds) {
    const classified = classifyError(buildsError)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-foreground">{classified.title}</p>
        <p className="text-sm text-foreground-secondary">{classified.message}</p>
        {classified.retryable && (
          <button
            onClick={() => refetch()}
            className="rounded-[6px] bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  return (
    <BuildsContent
      builds={builds ?? []}
      projects={projects ?? []}
      buildCommands={buildCommands ?? []}
      projectId={projectId}
      onCreateBuild={(input: CreateBuildInput) => createBuild.mutate(input)}
      onDeleteBuild={(id: BuildId) => deleteBuild.mutate(id)}
      isCreatingBuild={createBuild.isPending}
    />
  )
}
