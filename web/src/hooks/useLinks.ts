import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import { fetchLinks, createLink, updateLink, deleteLink, incrementLinkClick } from '@/services/links'
import type { LinkId } from '@/types/branded'
import type { Link, LinkFilters, CreateLinkInput, UpdateLinkInput } from '@/types/domain'

export function useLinks(filters?: LinkFilters) {
  return useQuery({
    queryKey: queryKeys.links.list(filters),
    queryFn: () => fetchLinks(filters),
  })
}

export function useCreateLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateLinkInput) => createLink(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: LinkId; input: UpdateLinkInput }) =>
      updateLink(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all })

      const previousLists = queryClient.getQueriesData<Link[]>({
        queryKey: queryKeys.links.lists(),
      })

      queryClient.setQueriesData<Link[]>(
        { queryKey: queryKeys.links.lists() },
        (old) =>
          old?.map((link) =>
            link.id === id ? ({ ...link, ...input } as Link) : link,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
    },
  })
}

export function useDeleteLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: LinkId) => deleteLink(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.lists() })

      const previousLists = queryClient.getQueriesData<Link[]>({
        queryKey: queryKeys.links.lists(),
      })

      queryClient.setQueriesData<Link[]>(
        { queryKey: queryKeys.links.lists() },
        (old) => old?.filter((link) => link.id !== id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
    },
  })
}

export function useIncrementLinkClick() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: LinkId) => incrementLinkClick(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.lists() })

      queryClient.setQueriesData<Link[]>(
        { queryKey: queryKeys.links.lists() },
        (old) =>
          old?.map((link) =>
            link.id === id ? { ...link, clickCount: link.clickCount + 1 } : link,
          ),
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
    },
  })
}
