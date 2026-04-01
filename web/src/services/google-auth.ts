import { apiGet, apiPost } from '@/lib/api-client'
import type { GoogleConnectionStatus } from '@/types/domain'

export async function getGoogleAuthUrl(service: 'youtube' | 'drive', projectId: string): Promise<string> {
  const data = await apiGet<{ url: string }>(`/api/google/auth-url?service=${service}&projectId=${projectId}`)
  return data.url
}

export async function checkGoogleConnection(projectId: string): Promise<GoogleConnectionStatus> {
  try {
    return await apiGet<GoogleConnectionStatus>(`/api/google/status?projectId=${projectId}`)
  } catch {
    return { youtubeConnected: false, driveConnected: false, channelTitle: null, channelId: null, thumbnailUrl: null, subscriberCount: null, videoCount: null }
  }
}

export async function disconnectGoogleService(service: 'youtube' | 'drive', projectId: string): Promise<void> {
  await apiPost('/api/google/disconnect', { service, projectId })
}
