import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api-client'
import { ContentId, ContentStageDataId, ProjectId, NoteId, DescriptionTemplateId, UserId } from '@/types/branded'
import type {
  Content,
  ContentStageData,
  ContentWithDetails,
  ContentFilters,
  ContentStage,
  CreateContentInput,
  UpdateContentInput,
  UpsertStageDataInput,
  MoveContentInput,
} from '@/types/domain'

// --- Server Response Branding ---

interface ServerContent {
  id: string
  userId: string
  projectId: string | null
  title: string
  type: string
  stage: string
  platform: string
  noteId: string | null
  youtubeVideoId: string | null
  scheduledAt: string | null
  publishedAt: string | null
  templateId: string | null
  tags: string[]
  position: string | null
  createdAt: string
  updatedAt: string
}

interface ServerContentStageData {
  id: string
  contentId: string
  stage: string
  description: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ServerContentWithDetails extends ServerContent {
  projectName: string | null
  projectColor: string | null
  noteTitle: string | null
  stageData: ServerContentStageData[]
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

function brandStageData(raw: ServerContentStageData): ContentStageData {
  return {
    ...raw,
    id: ContentStageDataId(raw.id),
    contentId: ContentId(raw.contentId),
    stage: raw.stage as ContentStage,
  }
}

function brandContentWithDetails(raw: ServerContentWithDetails): ContentWithDetails {
  return {
    ...brandContent(raw),
    projectName: raw.projectName,
    projectColor: raw.projectColor,
    noteTitle: raw.noteTitle,
    stageData: (raw.stageData ?? []).map(brandStageData),
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

export async function moveContent(input: MoveContentInput): Promise<ContentWithDetails> {
  const data = await apiPatch<ServerContentWithDetails>('/api/contents/move', input)
  return brandContentWithDetails(data)
}

// --- Stage Data Queries ---

export async function fetchContentStageData(contentId: string): Promise<ContentStageData[]> {
  const data = await apiGet<ServerContentStageData[]>(`/api/contents/${contentId}/stage-data`)
  return data.map(brandStageData)
}

// --- Stage Data Mutations ---

export async function upsertContentStageData(
  contentId: string,
  stage: ContentStage,
  input: UpsertStageDataInput,
): Promise<ContentStageData> {
  const data = await apiPut<ServerContentStageData>(
    `/api/contents/${contentId}/stage-data/${stage}`,
    input,
  )
  return brandStageData(data)
}
