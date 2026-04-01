import { apiGet } from '@/lib/api-client'
import { TagId, UserId } from '@/types/branded'
import type { TodoId } from '@/types/branded'
import type { Tag } from '@/types/domain'

// --- Server Response Branding ---

interface ServerTag {
  id: string
  userId: string
  name: string
  color: string | null
  createdAt: string
}

function brandTag(raw: ServerTag): Tag {
  return {
    ...raw,
    id: TagId(raw.id),
    userId: UserId(raw.userId),
  }
}

// --- Queries ---

export async function fetchTags(): Promise<Tag[]> {
  const data = await apiGet<ServerTag[]>('/api/tags')
  return data.map(brandTag)
}

export async function fetchTodoTags(todoId: TodoId): Promise<Tag[]> {
  const data = await apiGet<ServerTag[]>(`/api/tags/todo/${todoId}`)
  return data.map(brandTag)
}
