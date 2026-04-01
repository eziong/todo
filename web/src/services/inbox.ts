import { apiGet, apiPost, apiDelete } from '@/lib/api-client'
import { InboxItemId, UserId } from '@/types/branded'
import type { InboxItem, CreateInboxItemInput, ProcessInboxItemInput } from '@/types/domain'

// --- Server Response Branding ---

interface ServerInboxItem {
  id: string
  userId: string
  content: string
  createdAt: string
  processed: boolean
  processedTo: string | null
  processedId: string | null
}

function brandInboxItem(raw: ServerInboxItem): InboxItem {
  return {
    ...raw,
    id: InboxItemId(raw.id),
    userId: UserId(raw.userId),
    processedTo: raw.processedTo as InboxItem['processedTo'],
  }
}

// --- Queries ---

export async function fetchInboxItems(processed?: boolean): Promise<InboxItem[]> {
  const params = new URLSearchParams()
  if (processed !== undefined) params.set('processed', String(processed))

  const query = params.toString()
  const path = query ? `/api/inbox?${query}` : '/api/inbox'
  const data = await apiGet<ServerInboxItem[]>(path)
  return data.map(brandInboxItem)
}

// --- Mutations ---

export async function createInboxItem(input: CreateInboxItemInput): Promise<InboxItem> {
  const data = await apiPost<ServerInboxItem>('/api/inbox', input)
  return brandInboxItem(data)
}

export async function processInboxItem(
  id: InboxItemId,
  input: ProcessInboxItemInput,
): Promise<{ inboxItem: InboxItem; todoId?: string }> {
  const data = await apiPost<{ inboxItem: ServerInboxItem; todoId?: string }>(
    `/api/inbox/${id}/process`,
    input,
  )
  return {
    inboxItem: brandInboxItem(data.inboxItem),
    todoId: data.todoId,
  }
}

export async function deleteInboxItem(id: InboxItemId): Promise<void> {
  await apiDelete(`/api/inbox/${id}`)
}
