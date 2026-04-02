'use client'

import { Suspense } from 'react'
import { useTodos, useCreateTodo, useUpdateTodo } from '@/hooks/useTodos'
import { TasksContent } from '@/components/features/tasks/tasks-content'
import { TasksSkeleton } from '@/components/features/tasks/tasks-skeleton'
import { classifyError } from '@/lib/errors'
import type { TodoId } from '@/types/branded'
import type { UpdateTodoInput } from '@/types/domain'

function TasksPageContent() {
  const { data: todos, isLoading, error, refetch } = useTodos()
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

  return (
    <TasksContent
      todos={todos ?? []}
      onCreateTodo={(input) => createTodo.mutate(input)}
      onUpdateTodo={(id: TodoId, input: UpdateTodoInput) =>
        updateTodo.mutate({ id, input })
      }
      isCreating={createTodo.isPending}
    />
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksSkeleton />}>
      <TasksPageContent />
    </Suspense>
  )
}
