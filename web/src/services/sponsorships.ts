import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import { SponsorshipId, ContentId, UserId } from '@/types/branded'
import type { SponsorshipStatus } from '@/types/database'
import type {
  SponsorshipWithContent,
  CreateSponsorshipInput,
  UpdateSponsorshipInput,
  SponsorshipFilters,
} from '@/types/domain'

// --- Server Response Branding ---

interface ServerSponsorship {
  id: string
  userId: string
  contentId: string | null
  brand: string
  amount: number
  currency: string
  status: string
  contactInfo: string | null
  notes: string | null
  dueDate: string | null
  paidAt: string | null
  contentTitle: string | null
  createdAt: string
  updatedAt: string
}

function brandSponsorship(raw: ServerSponsorship): SponsorshipWithContent {
  return {
    ...raw,
    id: SponsorshipId(raw.id),
    userId: UserId(raw.userId),
    contentId: raw.contentId ? ContentId(raw.contentId) : null,
    status: raw.status as SponsorshipStatus,
    contentTitle: raw.contentTitle ?? null,
  }
}

// --- Queries ---

export async function fetchSponsorships(filters?: SponsorshipFilters): Promise<SponsorshipWithContent[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.contentId) params.set('contentId', filters.contentId)
  if (filters?.search) params.set('search', filters.search)

  const query = params.toString()
  const path = query ? `/api/sponsorships?${query}` : '/api/sponsorships'
  const data = await apiGet<ServerSponsorship[]>(path)
  return data.map(brandSponsorship)
}

// --- Mutations ---

export async function createSponsorship(input: CreateSponsorshipInput): Promise<SponsorshipWithContent> {
  const data = await apiPost<ServerSponsorship>('/api/sponsorships', input)
  return brandSponsorship(data)
}

export async function updateSponsorship(
  id: SponsorshipId,
  input: UpdateSponsorshipInput
): Promise<SponsorshipWithContent> {
  const data = await apiPatch<ServerSponsorship>(`/api/sponsorships/${id}`, input)
  return brandSponsorship(data)
}

export async function deleteSponsorship(id: SponsorshipId): Promise<void> {
  await apiDelete(`/api/sponsorships/${id}`)
}
