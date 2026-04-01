import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import { ContentId, ContentChecklistId, ProjectId, NoteId, DescriptionTemplateId, UserId } from '@/types/branded'
import type {
  Content,
  ContentChecklist,
  ContentWithDetails,
  ContentFilters,
  CreateContentInput,
  UpdateContentInput,
  CreateContentChecklistInput,
  UpdateContentChecklistInput,
  ReorderContentItem,
} from '@/types/domain'

// --- Server Response Branding ---

interface ServerContent {
  id: string
  userId: string
  projectId: string | null
  title: string
  description: string | null
  type: string
  stage: string
  platform: string
  noteId: string | null
  youtubeVideoId: string | null
  scheduledAt: string | null
  publishedAt: string | null
  templateId: string | null
  tags: string[]
  position: number | null
  createdAt: string
  updatedAt: string
}

interface ServerContentChecklist {
  id: string
  contentId: string
  label: string
  checked: boolean
  position: number | null
}

interface ServerContentWithDetails extends ServerContent {
  projectName: string | null
  projectColor: string | null
  noteTitle: string | null
  checklists: ServerContentChecklist[]
}

function brandContent(raw: ServerContent): Content {
  return {
    ...raw,
    id: ContentId(raw.id),
    userId: UserId(raw.userId),
    projectId: raw.projectId ? ProjectId(raw.projectId) : null,
    noteId: raw.noteId ? NoteId(raw.noteId) : null,
    templateId: raw.templateId ? DescriptionTemplateId(raw.templateId) : null,
    type: raw.type as Content['type'],
    stage: raw.stage as Content['stage'],
    platform: raw.platform as Content['platform'],
  }
}

function brandChecklist(raw: ServerContentChecklist): ContentChecklist {
  return {
    ...raw,
    id: ContentChecklistId(raw.id),
    contentId: ContentId(raw.contentId),
  }
}

function brandContentWithDetails(raw: ServerContentWithDetails): ContentWithDetails {
  return {
    ...brandContent(raw),
    projectName: raw.projectName,
    projectColor: raw.projectColor,
    noteTitle: raw.noteTitle,
    checklists: (raw.checklists ?? []).map(brandChecklist),
  }
}

// --- Content Queries ---

export async function fetchContents(filters?: ContentFilters): Promise<ContentWithDetails[]> {
  const params = new URLSearchParams()
  if (filters?.stage) params.set('stage', filters.stage)
  if (filters?.type) params.set('type', filters.type)
  if (filters?.platform) params.set('platform', filters.platform)
  if (filters?.projectId) params.set('projectId', filters.projectId)
  if (filters?.search) params.set('search', filters.search)

  const query = params.toString()
  const path = query ? `/api/contents?${query}` : '/api/contents'
  const data = await apiGet<ServerContentWithDetails[]>(path)
  return data.map(brandContentWithDetails)
}

export async function fetchContent(id: string): Promise<ContentWithDetails> {
  const data = await apiGet<ServerContentWithDetails>(`/api/contents/${id}`)
  return brandContentWithDetails(data)
}

// --- Content Mutations ---

export async function createContent(input: CreateContentInput): Promise<Content> {
  const data = await apiPost<ServerContent>('/api/contents', input)
  return brandContent(data)
}

export async function updateContent(id: ContentId, input: UpdateContentInput): Promise<Content> {
  const data = await apiPatch<ServerContent>(`/api/contents/${id}`, input)
  return brandContent(data)
}

export async function deleteContent(id: ContentId): Promise<void> {
  await apiDelete(`/api/contents/${id}`)
}

export async function reorderContents(items: ReorderContentItem[]): Promise<{ updated: number }> {
  return apiPatch<{ updated: number }>('/api/contents/reorder', { items })
}

// --- Content Checklist Queries ---

export async function fetchContentChecklists(contentId: string): Promise<ContentChecklist[]> {
  const data = await apiGet<ServerContentChecklist[]>(`/api/contents/${contentId}/checklists`)
  return data.map(brandChecklist)
}

// --- Content Checklist Mutations ---

export async function createContentChecklist(input: CreateContentChecklistInput): Promise<ContentChecklist> {
  const data = await apiPost<ServerContentChecklist>(
    `/api/contents/${input.contentId}/checklists`,
    { label: input.label, position: input.position },
  )
  return brandChecklist(data)
}

export async function updateContentChecklist(
  id: ContentChecklistId,
  input: UpdateContentChecklistInput,
): Promise<ContentChecklist> {
  const data = await apiPatch<ServerContentChecklist>(`/api/content-checklists/${id}`, input)
  return brandChecklist(data)
}

export async function deleteContentChecklist(id: ContentChecklistId): Promise<void> {
  await apiDelete(`/api/content-checklists/${id}`)
}
