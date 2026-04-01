import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import {
  fetchContentChecklists,
  createContentChecklist,
  updateContentChecklist,
  deleteContentChecklist,
} from '@/services/contents'
import type { ContentId, ContentChecklistId } from '@/types/branded'
import type {
  ContentChecklist,
  CreateContentChecklistInput,
  UpdateContentChecklistInput,
} from '@/types/domain'

export function useContentChecklists(contentId: ContentId) {
  return useQuery({
    queryKey: queryKeys.contentChecklists.list(contentId),
    queryFn: () => fetchContentChecklists(contentId as string),
    enabled: Boolean(contentId),
  })
}

export function useCreateContentChecklist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateContentChecklistInput) => createContentChecklist(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentChecklists.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateContentChecklist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: ContentChecklistId; input: UpdateContentChecklistInput }) =>
      updateContentChecklist(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.contentChecklists.all })

      const previousLists = queryClient.getQueriesData<ContentChecklist[]>({
        queryKey: queryKeys.contentChecklists.lists(),
      })

      queryClient.setQueriesData<ContentChecklist[]>(
        { queryKey: queryKeys.contentChecklists.lists() },
        (old) =>
          old?.map((item) =>
            item.id === id ? ({ ...item, ...input } as ContentChecklist) : item,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.contentChecklists.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all })
    },
  })
}

export function useDeleteContentChecklist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: ContentChecklistId) => deleteContentChecklist(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.contentChecklists.lists() })

      const previousLists = queryClient.getQueriesData<ContentChecklist[]>({
        queryKey: queryKeys.contentChecklists.lists(),
      })

      queryClient.setQueriesData<ContentChecklist[]>(
        { queryKey: queryKeys.contentChecklists.lists() },
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
      queryClient.invalidateQueries({ queryKey: queryKeys.contentChecklists.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all })
    },
  })
}
