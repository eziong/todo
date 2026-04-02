import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import { BuildCommandId, ProjectId } from '@/types/branded'
import type { BuildCommand, CreateBuildCommandInput, UpdateBuildCommandInput, WebhookMethod } from '@/types/domain'

// --- Server Response Branding ---

interface ServerBuildCommand {
  id: string
  projectId: string
  label: string
  url: string
  method: string
  headers: Record<string, string>
  bodyTemplate: string | null
  position: string | null
}

function brandBuildCommand(raw: ServerBuildCommand): BuildCommand {
  return {
    ...raw,
    id: BuildCommandId(raw.id),
    projectId: ProjectId(raw.projectId),
    method: raw.method as WebhookMethod,
  }
}

// --- Queries ---

export async function fetchBuildCommands(projectId: string): Promise<BuildCommand[]> {
  const data = await apiGet<ServerBuildCommand[]>(`/api/projects/${projectId}/build-commands`)
  return data.map(brandBuildCommand)
}

// --- Mutations ---

export async function createBuildCommand(
  projectId: string,
  input: CreateBuildCommandInput,
): Promise<BuildCommand> {
  const data = await apiPost<ServerBuildCommand>(
    `/api/projects/${projectId}/build-commands`,
    input,
  )
  return brandBuildCommand(data)
}

export async function updateBuildCommand(
  id: string,
  input: UpdateBuildCommandInput,
): Promise<BuildCommand> {
  const data = await apiPatch<ServerBuildCommand>(
    `/api/build-commands/${id}`,
    input,
  )
  return brandBuildCommand(data)
}

export async function deleteBuildCommand(id: string): Promise<void> {
  await apiDelete(`/api/build-commands/${id}`)
}
