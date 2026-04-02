import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import { ProjectId, UserId } from '@/types/branded'
import type { Project, ProjectFeature, ProjectWithStats, CreateProjectInput, UpdateProjectInput } from '@/types/domain'

// --- Server Response Branding ---

interface ServerProject {
  id: string
  userId: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  archived: boolean
  position: string | null
  githubRepo: string | null
  features: string[]
  createdAt: string
  updatedAt: string
}

interface ServerProjectWithStats extends ServerProject {
  todoCount: number
  completedCount: number
}

function brandProject(raw: ServerProject): Project {
  return {
    ...raw,
    id: ProjectId(raw.id),
    userId: UserId(raw.userId),
    features: raw.features as ProjectFeature[],
  }
}

function brandProjectWithStats(raw: ServerProjectWithStats): ProjectWithStats {
  return {
    ...brandProject(raw),
    todoCount: raw.todoCount,
    completedCount: raw.completedCount,
  }
}

// --- Queries ---

export async function fetchProjects(archived?: boolean): Promise<ProjectWithStats[]> {
  const params = new URLSearchParams()
  if (archived !== undefined) params.set('archived', String(archived))

  const query = params.toString()
  const path = query ? `/api/projects?${query}` : '/api/projects'
  const data = await apiGet<ServerProjectWithStats[]>(path)
  return data.map(brandProjectWithStats)
}

export async function fetchProject(id: ProjectId): Promise<Project> {
  const data = await apiGet<ServerProject>(`/api/projects/${id}`)
  return brandProject(data)
}

// --- Mutations ---

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const data = await apiPost<ServerProject>('/api/projects', input)
  return brandProject(data)
}

export async function updateProject(id: ProjectId, input: UpdateProjectInput): Promise<Project> {
  const data = await apiPatch<ServerProject>(`/api/projects/${id}`, input)
  return brandProject(data)
}

export async function deleteProject(id: ProjectId): Promise<void> {
  await apiDelete(`/api/projects/${id}`)
}
