'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useContents, useCreateContent, useUpdateContent, useDeleteContent, useReorderContent } from '@/hooks/useContents'
import { useProjects } from '@/hooks/useProjects'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PipelineBoard } from '@/components/features/content/pipeline-board'
import { CreateContentDialog } from '@/components/features/content/create-content-dialog'
import { ContentSkeleton } from '@/components/features/content/content-skeleton'
import { classifyError } from '@/lib/errors'
import { ContentId } from '@/types/branded'
import type { ContentFilters, ContentStage, CreateContentInput, ReorderContentItem } from '@/types/domain'

export default function ProjectContentPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const projectId = params.id
  const [filters, setFilters] = useState<ContentFilters>({ projectId })
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deletingContentId, setDeletingContentId] = useState<string | null>(null)

  const { data: contents, isLoading, error, refetch } = useContents(filters)
  const { data: projects } = useProjects(false)
  const createContent = useCreateContent()
  const updateContent = useUpdateContent()
  const deleteContent = useDeleteContent()
  const reorderContent = useReorderContent()

  if (isLoading) return <ContentSkeleton />

  if (error && !contents) {
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

  const handleStageChange = (id: string, stage: ContentStage) => {
    updateContent.mutate({ id: ContentId(id), input: { stage } })
  }

  const handleReorder = (items: ReorderContentItem[]) => {
    reorderContent.mutate(items)
  }

  const handleCreateContent = (input: CreateContentInput) => {
    createContent.mutate({ ...input, projectId })
  }

  const handleDeleteContent = (id: string) => {
    setDeletingContentId(id)
  }

  const handleConfirmDeleteContent = () => {
    if (!deletingContentId) return
    deleteContent.mutate(ContentId(deletingContentId), {
      onSettled: () => setDeletingContentId(null),
    })
  }

  const deletingContent = deletingContentId
    ? (contents ?? []).find((c) => c.id === deletingContentId)
    : null

  const handleSelectContent = (id: string) => {
    router.push(`/projects/${projectId}/content/${id}`)
  }

  return (
    <div className="-my-6 h-[calc(100%+48px)]">
      <PipelineBoard
        contents={contents ?? []}
        projects={projects ?? []}
        filters={filters}
        onFiltersChange={setFilters}
        onStageChange={handleStageChange}
        onReorder={handleReorder}
        onCreateContent={() => setCreateDialogOpen(true)}
        onDeleteContent={handleDeleteContent}
        onSelectContent={handleSelectContent}
        isCreating={createContent.isPending}
      />
      <CreateContentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projects={projects ?? []}
        onCreateContent={handleCreateContent}
        isCreating={createContent.isPending}
        defaultProjectId={projectId}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={Boolean(deletingContentId)}
        onOpenChange={(open) => { if (!open) setDeletingContentId(null) }}
      >
        <AlertDialogContent className="border-border bg-background-secondary">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Content</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground-secondary">
              Are you sure you want to delete{deletingContent ? ` "${deletingContent.title}"` : " this content"}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteContent}
              className="bg-accent-red text-white hover:bg-accent-red/90"
            >
              {deleteContent.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
