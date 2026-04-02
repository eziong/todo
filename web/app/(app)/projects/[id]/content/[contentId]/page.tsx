'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useContent, useUpdateContent, useDeleteContent } from '@/hooks/useContents'
import { useContentTodos, useCreateTodo, useUpdateTodo, useMoveTodo, useUnlinkTodoFromContent, useLinkTodoToContent } from '@/hooks/useTodos'
import { useTodos } from '@/hooks/useTodos'
import { useUpsertContentStageData } from '@/hooks/useContentStageData'
import { useProjects } from '@/hooks/useProjects'
import { useNotes } from '@/hooks/useNotes'
import { useDescriptionTemplates } from '@/hooks/useDescriptionTemplates'
import { ContentDetail } from '@/components/features/content/content-detail'
import { ContentSkeleton } from '@/components/features/content/content-skeleton'
import { classifyError } from '@/lib/errors'
import { ContentId } from '@/types/branded'
import type { TodoId } from '@/types/branded'
import type { UpdateContentInput, ContentStage, UpsertStageDataInput, CreateTodoInput, UpdateTodoInput, MoveTodoInput } from '@/types/domain'

export default function ProjectContentDetailPage({
  params,
}: {
  params: Promise<{ id: string; contentId: string }>
}) {
  const { id: projectId, contentId: rawContentId } = use(params)
  const router = useRouter()
  const contentId = ContentId(rawContentId)

  const { data: content, isLoading, error, refetch } = useContent(rawContentId)
  const { data: contentTodos } = useContentTodos(contentId)
  const { data: projects } = useProjects(false)
  const { data: notes } = useNotes()
  const { data: templates } = useDescriptionTemplates()
  const updateContent = useUpdateContent()
  const deleteContent = useDeleteContent()
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const moveTodoMutation = useMoveTodo()
  const unlinkTodo = useUnlinkTodoFromContent()
  const linkTodo = useLinkTodoToContent()
  const upsertStageData = useUpsertContentStageData()

  if (isLoading) return <ContentSkeleton />

  if (error && !content) {
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

  if (!content) return null

  return (
    <ContentDetail
      key={contentId as string}
      content={content}
      todos={contentTodos ?? []}
      projects={projects ?? []}
      notes={notes ?? []}
      templates={templates ?? []}
      onUpdate={(id: ContentId, input: UpdateContentInput) =>
        updateContent.mutate({ id, input })
      }
      onDelete={(id: ContentId) => deleteContent.mutate(id)}
      onUpsertStageData={(id: ContentId, stage: ContentStage, input: UpsertStageDataInput) =>
        upsertStageData.mutate({ contentId: id, stage, input })
      }
      onCreateTodo={(input: CreateTodoInput) =>
        createTodo.mutate(input)
      }
      onUpdateTodo={(id: TodoId, input: UpdateTodoInput) =>
        updateTodo.mutate({ id, input })
      }
      onMoveTodo={(input: MoveTodoInput) =>
        moveTodoMutation.mutate(input)
      }
      onUnlinkTodo={(id: TodoId) =>
        unlinkTodo.mutate(id)
      }
      onLinkTodo={(id: TodoId, stage: ContentStage) =>
        linkTodo.mutate({ id, contentId: rawContentId, contentStage: stage })
      }
      onBack={() => router.push(`/projects/${projectId}/content`)}
    />
  )
}
