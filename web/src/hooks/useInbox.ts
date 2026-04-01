import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import { fetchInboxItems, createInboxItem, processInboxItem, deleteInboxItem } from '@/services/inbox'
import type { InboxItemId } from '@/types/branded'
import type { InboxItem, CreateInboxItemInput, ProcessInboxItemInput } from '@/types/domain'

export function useInbox(processed?: boolean) {
  return useQuery({
    queryKey: queryKeys.inbox.list(processed),
    queryFn: () => fetchInboxItems(processed),
  })
}

export function useCreateInboxItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateInboxItemInput) => createInboxItem(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.all })
    },
    onError: handleMutationError,
  })
}

export function useProcessInboxItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: InboxItemId; input: ProcessInboxItemInput }) =>
      processInboxItem(id, input),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.inbox.all })

      const previousLists = queryClient.getQueriesData<InboxItem[]>({
        queryKey: queryKeys.inbox.lists(),
      })

      // Optimistic: mark as processed in unprocessed list
      queryClient.setQueriesData<InboxItem[]>(
        { queryKey: queryKeys.inbox.lists() },
        (old) =>
          old?.map((item) =>
            item.id === id ? { ...item, processed: true } : item,
          ),
      )

      return { previousLists }
    },
    onError: (error, _vars, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data)
        }
      }
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.all })
      // Also refresh todos since we may have created one
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all })
    },
  })
}

export function useDeleteInboxItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: InboxItemId) => deleteInboxItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.inbox.lists() })

      const previousLists = queryClient.getQueriesData<InboxItem[]>({
        queryKey: queryKeys.inbox.lists(),
      })

      queryClient.setQueriesData<InboxItem[]>(
        { queryKey: queryKeys.inbox.lists() },
        (old) => old?.filter((item) => item.id !== id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.all })
    },
  })
}
