import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { fetchTodo, fetchSubtasks } from '@/services/todos'
import { fetchTodoTags } from '@/services/tags'
import type { TodoId } from '@/types/branded'
import type { TodoWithProject } from '@/types/domain'

export function useTodo(id: TodoId | null) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.todos.detail(id as TodoId),
    queryFn: () => fetchTodo(id as TodoId),
    enabled: id !== null,
    // Use cached list data as placeholder for instant display
    placeholderData: () => {
      if (!id) return undefined
      const lists = queryClient.getQueriesData<TodoWithProject[]>({
        queryKey: queryKeys.todos.lists(),
      })
      for (const [, data] of lists) {
        const todo = data?.find((t) => t.id === id)
        if (todo) return todo
      }
      return undefined
    },
  })
}

export function useSubtasks(parentId: TodoId | null) {
  return useQuery({
    queryKey: [...queryKeys.todos.detail(parentId as TodoId), 'subtasks'] as const,
    queryFn: () => fetchSubtasks(parentId as TodoId),
    enabled: parentId !== null,
  })
}

export function useTodoTags(todoId: TodoId | null) {
  return useQuery({
    queryKey: [...queryKeys.todos.detail(todoId as TodoId), 'tags'] as const,
    queryFn: () => fetchTodoTags(todoId as TodoId),
    enabled: todoId !== null,
  })
}
