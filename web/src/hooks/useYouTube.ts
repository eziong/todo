import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import {
  fetchYouTubeChannel,
  fetchYouTubeVideos,
  fetchYouTubeVideo,
  updateYouTubeVideo,
  fetchYouTubeComments,
  replyToYouTubeComment,
  createUploadSession,
  fetchAvailableChannels,
  searchYouTubeChannels,
  selectYouTubeChannel,
} from '@/services/youtube'
import type { UpdateVideoMetadataInput, UploadVideoInput } from '@/types/domain'

export function useYouTubeChannel(projectId: string) {
  return useQuery({
    queryKey: queryKeys.youtube.channel(projectId),
    queryFn: () => fetchYouTubeChannel(projectId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: Boolean(projectId),
  })
}

export function useYouTubeVideos(projectId: string, options?: {
  pageToken?: string
  maxResults?: number
  search?: string
}) {
  return useQuery({
    queryKey: queryKeys.youtube.videoList(projectId, options?.pageToken, options?.search),
    queryFn: () => fetchYouTubeVideos(projectId, options),
    enabled: Boolean(projectId),
  })
}

export function useYouTubeVideo(projectId: string, videoId: string | null) {
  return useQuery({
    queryKey: queryKeys.youtube.videoDetail(projectId, videoId ?? ''),
    queryFn: () => fetchYouTubeVideo(projectId, videoId!),
    enabled: Boolean(projectId) && Boolean(videoId),
  })
}

export function useUpdateVideoMetadata(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ videoId, input }: { videoId: string; input: UpdateVideoMetadataInput }) =>
      updateYouTubeVideo(projectId, videoId, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.youtube.videos(projectId) })
    },
    onError: handleMutationError,
  })
}

export function useYouTubeComments(projectId: string, videoId: string | null, filter?: 'all' | 'unanswered') {
  return useQuery({
    queryKey: [...queryKeys.youtube.comments(projectId, videoId ?? ''), filter],
    queryFn: () => fetchYouTubeComments(projectId, videoId!, { filter }),
    enabled: Boolean(projectId) && Boolean(videoId),
  })
}

export function useReplyToComment(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      replyToYouTubeComment(projectId, commentId, text),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.youtube.all })
    },
    onError: handleMutationError,
  })
}

export function useCreateUploadSession(projectId: string) {
  return useMutation({
    mutationFn: (input: UploadVideoInput) => createUploadSession(projectId, input),
    onError: handleMutationError,
  })
}

export function useAvailableChannels(projectId: string) {
  return useQuery({
    queryKey: queryKeys.youtube.availableChannels(projectId),
    queryFn: () => fetchAvailableChannels(projectId),
    enabled: Boolean(projectId),
  })
}

export function useSearchChannels(projectId: string, query: string) {
  return useQuery({
    queryKey: [...queryKeys.youtube.all, 'channelSearch', projectId, query],
    queryFn: () => searchYouTubeChannels(projectId, query),
    enabled: Boolean(projectId) && query.trim().length > 0,
  })
}

export function useSelectChannel(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: string) => selectYouTubeChannel(projectId, channelId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.youtube.channel(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.youtube.availableChannels(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.googleAuth.connection(projectId) })
    },
    onError: handleMutationError,
  })
}
