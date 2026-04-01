import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from '@/lib/api-client'
import { AssetId, ContentId, ProjectId, UserId } from '@/types/branded'
import type { AssetStorageType } from '@/types/database'
import type {
  Asset,
  AssetFilters,
  CreateAssetInput,
  UpdateAssetInput,
} from '@/types/domain'

// --- Server Response Branding ---

interface ServerAsset {
  id: string
  userId: string
  contentId: string | null
  projectId: string | null
  filename: string
  mimeType: string
  sizeBytes: number
  storageType: string
  storagePath: string | null
  thumbnailUrl: string | null
  tags: string[]
  createdAt: string
}

function brandAsset(raw: ServerAsset): Asset {
  return {
    ...raw,
    id: AssetId(raw.id),
    userId: UserId(raw.userId),
    contentId: raw.contentId ? ContentId(raw.contentId) : null,
    projectId: raw.projectId ? ProjectId(raw.projectId) : null,
    storageType: raw.storageType as AssetStorageType,
    storagePath: raw.storagePath ?? '',
  }
}

// --- Queries ---

export async function fetchAssets(filters?: AssetFilters): Promise<Asset[]> {
  const params = new URLSearchParams()
  if (filters?.contentId) params.set('contentId', filters.contentId)
  if (filters?.projectId) params.set('projectId', filters.projectId)
  if (filters?.storageType) params.set('storageType', filters.storageType)
  if (filters?.mimeType) params.set('mimeType', filters.mimeType)
  if (filters?.search) params.set('search', filters.search)

  const query = params.toString()
  const path = query ? `/api/assets?${query}` : '/api/assets'
  const data = await apiGet<ServerAsset[]>(path)
  return data.map(brandAsset)
}

export async function fetchAsset(id: string): Promise<Asset> {
  const data = await apiGet<ServerAsset>(`/api/assets/${id}`)
  return brandAsset(data)
}

// --- Mutations ---

export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const data = await apiPost<ServerAsset>('/api/assets', input)
  return brandAsset(data)
}

export async function updateAsset(id: AssetId, input: UpdateAssetInput): Promise<Asset> {
  const data = await apiPatch<ServerAsset>(`/api/assets/${id}`, input)
  return brandAsset(data)
}

export async function deleteAsset(id: AssetId): Promise<void> {
  await apiDelete(`/api/assets/${id}`)
}

// --- File Upload ---

export async function uploadAssetFile(
  file: File,
  contentId?: string,
  projectId?: string,
  tags?: string[],
): Promise<Asset> {
  const formData = new FormData()
  formData.append('file', file)
  if (contentId) formData.append('contentId', contentId)
  if (projectId) formData.append('projectId', projectId)
  if (tags) formData.append('tags', JSON.stringify(tags))

  const data = await apiUpload<ServerAsset>('/api/assets/upload', formData)
  return brandAsset(data)
}

// --- Local Asset URL Utility ---
// Constructs public URLs for locally-stored assets served by the NestJS API.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export function getAssetPublicUrl(storagePath: string): string {
  if (!storagePath) return ''
  return `${API_BASE}/api/assets/files/${storagePath}`
}
