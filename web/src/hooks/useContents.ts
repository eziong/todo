import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import {
  fetchContents,
  fetchContent,
  createContent,
  updateContent,
  deleteContent,
} from '@/services/contents'
import type { ContentId } from '@/types/branded'
import type {
  ContentWithDetails,
  ContentFilters,
  CreateContentInput,
  UpdateContentInput,
} from '@/types/domain'

export function useContents(filters?: ContentFilters) {
  return useQuery({
    queryKey: queryKeys.contents.list(filters),
    queryFn: () => fetchContents(filters),
  })
}

export function useContent(id: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.contents.detail(id as ContentId),
    queryFn: () => fetchContent(id),
    placeholderData: () => {
      const lists = queryClient.getQueriesData<ContentWithDetails[]>({
        queryKey: queryKeys.contents.lists(),
      })
      for (const [, data] of lists) {
        const content = data?.find((c) => (c.id as string) === id)
        if (content) return content
      }
      return undefined
    },
  })
}

export function useCreateContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateContentInput) => createContent(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: ContentId; input: UpdateContentInput }) =>
      updateContent(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.contents.all })

      const previousLists = queryClient.getQueriesData<ContentWithDetails[]>({
        queryKey: queryKeys.contents.lists(),
      })

      queryClient.setQueriesData<ContentWithDetails[]>(
        { queryKey: queryKeys.contents.lists() },
        (old) =>
          old?.map((content) =>
            content.id === id ? ({ ...content, ...input } as ContentWithDetails) : content,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all })
    },
  })
}

export function useDeleteContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: ContentId) => deleteContent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.contents.lists() })

      const previousLists = queryClient.getQueriesData<ContentWithDetails[]>({
        queryKey: queryKeys.contents.lists(),
      })

      queryClient.setQueriesData<ContentWithDetails[]>(
        { queryKey: queryKeys.contents.lists() },
        (old) => old?.filter((content) => content.id !== id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.contentChecklists.all })
    },
  })
}
