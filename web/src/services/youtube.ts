import { apiGet, apiPatch, apiPost } from '@/lib/api-client'
import type {
  YouTubeVideo,
  YouTubeVideoListResponse,
  YouTubeCommentListResponse,
  YouTubeCommentReply,
  UpdateVideoMetadataInput,
  UploadVideoInput,
  AvailableChannel,
} from '@/types/domain'

interface FetchYouTubeVideosOptions {
  pageToken?: string
  maxResults?: number
  search?: string
}

interface FetchYouTubeCommentsOptions {
  pageToken?: string
  filter?: 'all' | 'unanswered'
}

interface ChannelStats {
  channelId: string
  channelTitle: string | null
  subscriberCount: number
  videoCount: number
  viewCount: number
  thumbnailUrl: string | null
  syncedAt: string
}

export async function fetchYouTubeChannel(projectId: string): Promise<ChannelStats | null> {
  try {
    return await apiGet<ChannelStats>(`/api/projects/${projectId}/youtube/channel`)
  } catch {
    return null
  }
}

export async function fetchYouTubeVideos(
  projectId: string,
  options?: FetchYouTubeVideosOptions
): Promise<YouTubeVideoListResponse> {
  const params = new URLSearchParams()
  if (options?.pageToken) params.set('pageToken', options.pageToken)
  if (options?.maxResults) params.set('maxResults', String(options.maxResults))
  if (options?.search) params.set('search', options.search)

  const query = params.toString()
  const path = query
    ? `/api/projects/${projectId}/youtube/videos?${query}`
    : `/api/projects/${projectId}/youtube/videos`
  return apiGet<YouTubeVideoListResponse>(path)
}

export async function fetchYouTubeVideo(projectId: string, videoId: string): Promise<YouTubeVideo> {
  return apiGet<YouTubeVideo>(`/api/projects/${projectId}/youtube/videos/${videoId}`)
}

export async function updateYouTubeVideo(
  projectId: string,
  videoId: string,
  input: UpdateVideoMetadataInput
): Promise<YouTubeVideo> {
  return apiPatch<YouTubeVideo>(`/api/projects/${projectId}/youtube/videos/${videoId}`, input)
}

export async function fetchYouTubeComments(
  projectId: string,
  videoId: string,
  options?: FetchYouTubeCommentsOptions
): Promise<YouTubeCommentListResponse> {
  const params = new URLSearchParams({ videoId })
  if (options?.pageToken) params.set('pageToken', options.pageToken)
  if (options?.filter) params.set('filter', options.filter)

  return apiGet<YouTubeCommentListResponse>(`/api/projects/${projectId}/youtube/comments?${params}`)
}

export async function replyToYouTubeComment(
  projectId: string,
  commentId: string,
  text: string
): Promise<YouTubeCommentReply> {
  return apiPost<YouTubeCommentReply>(`/api/projects/${projectId}/youtube/comments/reply`, { commentId, text })
}

export async function createUploadSession(
  projectId: string,
  input: UploadVideoInput
): Promise<{ uploadUrl: string; contentId: string | null }> {
  return apiPost<{ uploadUrl: string; contentId: string | null }>(`/api/projects/${projectId}/youtube/upload`, input)
}

export async function fetchAvailableChannels(projectId: string): Promise<AvailableChannel[]> {
  return apiGet<AvailableChannel[]>(`/api/projects/${projectId}/youtube/channels/available`)
}

export async function searchYouTubeChannels(projectId: string, query: string): Promise<AvailableChannel[]> {
  return apiGet<AvailableChannel[]>(`/api/projects/${projectId}/youtube/channels/search?q=${encodeURIComponent(query)}`)
}

export async function selectYouTubeChannel(projectId: string, channelId: string): Promise<void> {
  await apiPost(`/api/projects/${projectId}/youtube/channel/select`, { channelId })
}
