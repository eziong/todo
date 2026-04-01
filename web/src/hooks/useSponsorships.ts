import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import {
  fetchSponsorships,
  createSponsorship,
  updateSponsorship,
  deleteSponsorship,
} from '@/services/sponsorships'
import type { SponsorshipId } from '@/types/branded'
import type {
  SponsorshipWithContent,
  SponsorshipFilters,
  CreateSponsorshipInput,
  UpdateSponsorshipInput,
} from '@/types/domain'

export function useSponsorships(filters?: SponsorshipFilters) {
  return useQuery({
    queryKey: queryKeys.sponsorships.list(filters),
    queryFn: () => fetchSponsorships(filters),
  })
}

export function useCreateSponsorship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSponsorshipInput) => createSponsorship(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sponsorships.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateSponsorship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: SponsorshipId; input: UpdateSponsorshipInput }) =>
      updateSponsorship(id, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sponsorships.all })
    },
    onError: handleMutationError,
  })
}

export function useDeleteSponsorship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: SponsorshipId) => deleteSponsorship(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sponsorships.lists() })

      const previousLists = queryClient.getQueriesData<SponsorshipWithContent[]>({
        queryKey: queryKeys.sponsorships.lists(),
      })

      queryClient.setQueriesData<SponsorshipWithContent[]>(
        { queryKey: queryKeys.sponsorships.lists() },
        (old) => old?.filter((s) => s.id !== id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.sponsorships.all })
    },
  })
}
