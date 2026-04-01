import { apiGet, apiPost, apiDelete } from '@/lib/api-client'
import { BuildId, BuildCommandId, ProjectId } from '@/types/branded'
import type { Build, BuildWithProject, CreateBuildInput } from '@/types/domain'

// --- Server Response Branding ---

interface ServerBuild {
  id: string
  projectId: string
  buildCommandId: string | null
  buildNumber: number
  status: string
  command: string | null
  log: string | null
  startedAt: string | null
  finishedAt: string | null
  notes: string | null
  createdAt: string
  projectName: string
  projectColor: string | null
}

function brandBuild(raw: ServerBuild): BuildWithProject {
  return {
    ...raw,
    id: BuildId(raw.id),
    projectId: ProjectId(raw.projectId),
    buildCommandId: raw.buildCommandId ? BuildCommandId(raw.buildCommandId) : null,
    status: raw.status as Build['status'],
    projectName: raw.projectName,
    projectColor: raw.projectColor,
  }
}

// --- Queries ---

export async function fetchBuilds(projectId?: string): Promise<BuildWithProject[]> {
  const params = new URLSearchParams()
  if (projectId) params.set('projectId', projectId)

  const query = params.toString()
  const path = query ? `/api/builds?${query}` : '/api/builds'
  const data = await apiGet<ServerBuild[]>(path)
  return data.map(brandBuild)
}

export async function fetchBuild(id: BuildId): Promise<BuildWithProject> {
  const data = await apiGet<ServerBuild>(`/api/builds/${id}`)
  return brandBuild(data)
}

// --- Mutations ---

export async function createBuild(input: CreateBuildInput): Promise<BuildWithProject> {
  const data = await apiPost<ServerBuild>('/api/builds', input)
  return brandBuild(data)
}

export async function deleteBuild(id: BuildId): Promise<void> {
  await apiDelete(`/api/builds/${id}`)
}
