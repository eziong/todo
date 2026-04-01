import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import {
  checkGoogleConnection,
  getGoogleAuthUrl,
  disconnectGoogleService,
} from '@/services/google-auth'

export function useGoogleConnection(projectId: string) {
  return useQuery({
    queryKey: queryKeys.googleAuth.connection(projectId),
    queryFn: () => checkGoogleConnection(projectId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: Boolean(projectId),
  })
}

export function useConnectYouTube(projectId: string) {
  return useMutation({
    mutationFn: async () => {
      const url = await getGoogleAuthUrl('youtube', projectId)
      window.location.href = url
    },
    onError: handleMutationError,
  })
}

export function useConnectDrive(projectId: string) {
  return useMutation({
    mutationFn: async () => {
      const url = await getGoogleAuthUrl('drive', projectId)
      window.location.href = url
    },
    onError: handleMutationError,
  })
}

export function useDisconnectYouTube(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => disconnectGoogleService('youtube', projectId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.googleAuth.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.youtube.all })
    },
    onError: handleMutationError,
  })
}

export function useDisconnectDrive(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => disconnectGoogleService('drive', projectId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.googleAuth.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.drive.all })
    },
    onError: handleMutationError,
  })
}
