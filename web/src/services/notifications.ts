import { apiGet, apiPatch, apiDelete } from '@/lib/api-client'
import { NotificationId, UserId } from '@/types/branded'
import type { NotificationSource } from '@/types/database'
import type { Notification, NotificationFilters } from '@/types/domain'

// --- Server Response Branding ---

interface ServerNotification {
  id: string
  userId: string
  source: string
  type: string
  title: string
  body: string | null
  url: string | null
  entityId: string | null
  read: boolean
  createdAt: string
}

function brandNotification(raw: ServerNotification): Notification {
  return {
    ...raw,
    id: NotificationId(raw.id),
    userId: UserId(raw.userId),
    source: raw.source as NotificationSource,
  }
}

// --- Queries ---

export async function fetchNotifications(filters?: NotificationFilters): Promise<Notification[]> {
  const params = new URLSearchParams()
  if (filters?.source) params.set('source', filters.source)

  const query = params.toString()
  const path = query ? `/api/notifications?${query}` : '/api/notifications'
  const data = await apiGet<ServerNotification[]>(path)
  return data.map(brandNotification)
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await apiGet<{ count: number }>('/api/notifications/unread-count')
  return data.count
}

// --- Mutations ---

export async function markNotificationRead(id: NotificationId): Promise<Notification> {
  const data = await apiPatch<ServerNotification>(`/api/notifications/${id}/read`, {})
  return brandNotification(data)
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiPatch('/api/notifications/read-all', {})
}

export async function deleteNotification(id: NotificationId): Promise<void> {
  await apiDelete(`/api/notifications/${id}`)
}
