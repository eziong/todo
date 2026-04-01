import { apiGet, apiDelete, apiUpload } from '@/lib/api-client'
import type { DriveFile } from '@/types/domain'

interface FetchDriveFilesOptions {
  pageToken?: string
  maxResults?: number
  mimeType?: string
}

export async function fetchDriveFiles(
  projectId: string,
  options?: FetchDriveFilesOptions
): Promise<{ files: DriveFile[]; nextPageToken: string | null }> {
  const params = new URLSearchParams()
  if (options?.pageToken) params.set('pageToken', options.pageToken)
  if (options?.maxResults) params.set('maxResults', String(options.maxResults))
  if (options?.mimeType) params.set('mimeType', options.mimeType)

  const query = params.toString()
  const path = query
    ? `/api/projects/${projectId}/drive/files?${query}`
    : `/api/projects/${projectId}/drive/files`

  try {
    return await apiGet<{ files: DriveFile[]; nextPageToken: string | null }>(path)
  } catch {
    return { files: [], nextPageToken: null }
  }
}

export async function uploadToDrive(projectId: string, file: File): Promise<DriveFile> {
  const formData = new FormData()
  formData.append('file', file)

  return apiUpload<DriveFile>(`/api/projects/${projectId}/drive/files`, formData)
}

export async function getDriveFileUrl(
  projectId: string,
  fileId: string
): Promise<{ webViewLink: string; webContentLink: string | null }> {
  return apiGet<{ webViewLink: string; webContentLink: string | null }>(`/api/projects/${projectId}/drive/files/${fileId}`)
}

export async function deleteDriveFile(projectId: string, fileId: string): Promise<void> {
  await apiDelete(`/api/projects/${projectId}/drive/files/${fileId}`)
}
