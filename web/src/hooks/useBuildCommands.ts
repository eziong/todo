import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import {
  fetchBuildCommands,
  createBuildCommand,
  updateBuildCommand,
  deleteBuildCommand,
} from '@/services/build-commands'
import type { ProjectId } from '@/types/branded'
import type { CreateBuildCommandInput, UpdateBuildCommandInput } from '@/types/domain'

export function useBuildCommands(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.buildCommands.list(projectId as ProjectId | undefined),
    queryFn: () => fetchBuildCommands(projectId!),
    enabled: Boolean(projectId),
  })
}

export function useCreateBuildCommand(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBuildCommandInput) =>
      createBuildCommand(projectId, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildCommands.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateBuildCommand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBuildCommandInput }) =>
      updateBuildCommand(id, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildCommands.all })
    },
    onError: handleMutationError,
  })
}

export function useDeleteBuildCommand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBuildCommand(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildCommands.all })
    },
    onError: handleMutationError,
  })
}
