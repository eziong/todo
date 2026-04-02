import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import { fetchTodos, createTodo, updateTodo, deleteTodo, moveTodo } from '@/services/todos'
import type { TodoId } from '@/types/branded'
import type { TodoFilters, CreateTodoInput, UpdateTodoInput, MoveTodoInput, TodoWithProject, ContentStage } from '@/types/domain'
import type { ContentId } from '@/types/branded'

export function useTodos(filters?: TodoFilters) {
  return useQuery({
    queryKey: queryKeys.todos.list(filters),
    queryFn: () => fetchTodos(filters),
  })
}

export function useContentTodos(contentId: ContentId, contentStage?: ContentStage) {
  const filters: TodoFilters = { contentId: contentId as string, ...(contentStage ? { contentStage } : {}) }
  return useQuery({
    queryKey: queryKeys.todos.list(filters),
    queryFn: () => fetchTodos(filters),
  })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTodoInput) => createTodo(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: TodoId; input: UpdateTodoInput }) =>
      updateTodo(id, input),
    onMutate: async ({ id, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.all })

      // Snapshot previous data for rollback
      const previousLists = queryClient.getQueriesData<TodoWithProject[]>({
        queryKey: queryKeys.todos.lists(),
      })
      const previousDetail = queryClient.getQueryData<TodoWithProject>(
        queryKeys.todos.detail(id),
      )

      // Optimistic update: all cached todo lists
      queryClient.setQueriesData<TodoWithProject[]>(
        { queryKey: queryKeys.todos.lists() },
        (old) =>
          old?.map((todo) =>
            todo.id === id
              ? ({
                  ...todo,
                  ...input,
                  ...(input.status === 'completed'
                    ? { completedAt: new Date().toISOString() }
                    : input.status
                      ? { completedAt: null }
                      : {}),
                } as TodoWithProject)
              : todo,
          ),
      )

      // Optimistic update: detail cache
      if (previousDetail) {
        queryClient.setQueryData<TodoWithProject>(
          queryKeys.todos.detail(id),
          (old) => (old ? { ...old, ...input } as TodoWithProject : old),
        )
      }

      return { previousLists, previousDetail, id }
    },
    onError: (error, _vars, context) => {
      // Rollback lists
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data)
        }
      }
      // Rollback detail
      if (context?.previousDetail && context.id) {
        queryClient.setQueryData(
          queryKeys.todos.detail(context.id),
          context.previousDetail,
        )
      }
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all })
    },
  })
}

export function useUnlinkTodoFromContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: TodoId) =>
      updateTodo(id, { contentId: null, contentStage: null }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all })
    },
    onError: handleMutationError,
  })
}

export function useLinkTodoToContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, contentId, contentStage }: { id: TodoId; contentId: string; contentStage: ContentStage }) =>
      updateTodo(id, { contentId, contentStage }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all })
    },
    onError: handleMutationError,
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: TodoId) => deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.lists() })

      const previousLists = queryClient.getQueriesData<TodoWithProject[]>({
        queryKey: queryKeys.todos.lists(),
      })

      // Optimistic removal from all lists
      queryClient.setQueriesData<TodoWithProject[]>(
        { queryKey: queryKeys.todos.lists() },
        (old) => old?.filter((todo) => todo.id !== id),
      )

      return { previousLists }
    },
    onError: (error, _id, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data)
        }
      }
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() })
    },
  })
}

export function useMoveTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MoveTodoInput) => moveTodo(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all })
    },
    onError: handleMutationError,
  })
}
