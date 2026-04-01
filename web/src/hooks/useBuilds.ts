import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import { fetchBuilds, createBuild, deleteBuild } from '@/services/builds'
import type { BuildId, ProjectId } from '@/types/branded'
import type { BuildWithProject, CreateBuildInput } from '@/types/domain'

export function useBuilds(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.builds.list(projectId as ProjectId | undefined),
    queryFn: () => fetchBuilds(projectId),
  })
}

export function useCreateBuild() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBuildInput) => createBuild(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.builds.all })
    },
    onError: handleMutationError,
  })
}

export function useDeleteBuild() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: BuildId) => deleteBuild(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.builds.lists() })

      const previousLists = queryClient.getQueriesData<BuildWithProject[]>({
        queryKey: queryKeys.builds.lists(),
      })

      queryClient.setQueriesData<BuildWithProject[]>(
        { queryKey: queryKeys.builds.lists() },
        (old) => old?.filter((build) => build.id !== id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.builds.all })
    },
  })
}
