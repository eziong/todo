import { apiGet, apiUpload } from '@/lib/api-client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

// --- Types ---

export interface BackupInfo {
  dbSizeBytes: number
  assetCount: number
  totalAssetBytes: number
}

export interface ImportResult {
  success: boolean
  stats: Record<string, number>
  warnings: string[]
}

// --- Queries ---

export async function fetchBackupInfo(): Promise<BackupInfo> {
  return apiGet<BackupInfo>('/api/backup/info')
}

// --- Mutations ---

export async function exportBackup(includeAssets: boolean): Promise<Blob> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null

  const res = await fetch(`${API_BASE}/api/backup/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ includeAssets }),
  })

  if (!res.ok) {
    throw new Error(`Export failed: ${res.status}`)
  }

  return res.blob()
}

export async function importBackup(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  return apiUpload<ImportResult>('/api/backup/import', formData)
}
