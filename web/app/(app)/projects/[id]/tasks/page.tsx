'use client'

import { useParams } from 'next/navigation'
import { useTodos, useCreateTodo, useUpdateTodo } from '@/hooks/useTodos'
import { TasksContent } from '@/components/features/tasks/tasks-content'
import { TasksSkeleton } from '@/components/features/tasks/tasks-skeleton'
import { TaskEmptyState } from '@/components/features/tasks/task-empty-state'
import { classifyError } from '@/lib/errors'
import type { TodoId } from '@/types/branded'
import type { UpdateTodoInput } from '@/types/domain'

export default function ProjectTasksPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const { data: todos, isLoading, error, refetch } = useTodos({ projectId })
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()

  if (isLoading) return <TasksSkeleton />

  if (error && !todos) {
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

  if (!todos || todos.length === 0) {
    return (
      <TaskEmptyState
        onCreateTask={() => createTodo.mutate({ title: 'New Task', projectId })}
      />
    )
  }

  return (
    <TasksContent
      todos={todos}
      onCreateTodo={(input) =>
        createTodo.mutate({ ...input, projectId })
      }
      onUpdateTodo={(id: TodoId, input: UpdateTodoInput) =>
        updateTodo.mutate({ id, input })
      }
      isCreating={createTodo.isPending}
    />
  )
}
