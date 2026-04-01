import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import { LinkId, ProjectId, DescriptionTemplateId, UserId } from '@/types/branded'
import type { LinkCategory } from '@/types/database'
import type {
  Link,
  LinkFilters,
  DescriptionTemplate,
  CreateLinkInput,
  UpdateLinkInput,
  CreateDescriptionTemplateInput,
  UpdateDescriptionTemplateInput,
} from '@/types/domain'

// --- Server Response Branding ---

interface ServerLink {
  id: string
  userId: string
  projectId: string | null
  label: string
  url: string
  category: string | null
  clickCount: number
  position: number | null
  createdAt: string
}

interface ServerDescriptionTemplate {
  id: string
  userId: string
  name: string
  content: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

function brandLink(raw: ServerLink): Link {
  return {
    ...raw,
    id: LinkId(raw.id),
    userId: UserId(raw.userId),
    projectId: raw.projectId ? ProjectId(raw.projectId) : null,
    category: raw.category as LinkCategory | null,
  }
}

function brandDescriptionTemplate(raw: ServerDescriptionTemplate): DescriptionTemplate {
  return {
    ...raw,
    id: DescriptionTemplateId(raw.id),
    userId: UserId(raw.userId),
  }
}

// --- Link Queries ---

export async function fetchLinks(filters?: LinkFilters): Promise<Link[]> {
  const params = new URLSearchParams()
  if (filters?.category) params.set('category', filters.category)
  if (filters?.projectId) params.set('projectId', filters.projectId)

  const query = params.toString()
  const path = query ? `/api/links?${query}` : '/api/links'
  const data = await apiGet<ServerLink[]>(path)
  return data.map(brandLink)
}

// --- Link Mutations ---

export async function createLink(input: CreateLinkInput): Promise<Link> {
  const data = await apiPost<ServerLink>('/api/links', input)
  return brandLink(data)
}

export async function updateLink(id: LinkId, input: UpdateLinkInput): Promise<Link> {
  const data = await apiPatch<ServerLink>(`/api/links/${id}`, input)
  return brandLink(data)
}

export async function deleteLink(id: LinkId): Promise<void> {
  await apiDelete(`/api/links/${id}`)
}

export async function incrementLinkClick(id: LinkId): Promise<Link> {
  const data = await apiPatch<ServerLink>(`/api/links/${id}/click`)
  return brandLink(data)
}

// --- Description Template Queries ---

export async function fetchDescriptionTemplates(): Promise<DescriptionTemplate[]> {
  const data = await apiGet<ServerDescriptionTemplate[]>('/api/description-templates')
  return data.map(brandDescriptionTemplate)
}

// --- Description Template Mutations ---

export async function createDescriptionTemplate(input: CreateDescriptionTemplateInput): Promise<DescriptionTemplate> {
  const data = await apiPost<ServerDescriptionTemplate>('/api/description-templates', input)
  return brandDescriptionTemplate(data)
}

export async function updateDescriptionTemplate(
  id: DescriptionTemplateId,
  input: UpdateDescriptionTemplateInput,
): Promise<DescriptionTemplate> {
  const data = await apiPatch<ServerDescriptionTemplate>(`/api/description-templates/${id}`, input)
  return brandDescriptionTemplate(data)
}

export async function deleteDescriptionTemplate(id: DescriptionTemplateId): Promise<void> {
  await apiDelete(`/api/description-templates/${id}`)
}
