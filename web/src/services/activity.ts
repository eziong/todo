import { apiGet } from '@/lib/api-client'
import { ActivityLogId, UserId } from '@/types/branded'
import type { ActivityLog } from '@/types/domain'

// --- Server Response Branding ---

interface ServerActivityLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

function brandActivityLog(raw: ServerActivityLog): ActivityLog {
  return {
    ...raw,
    id: ActivityLogId(raw.id),
    userId: UserId(raw.userId),
    action: raw.action as ActivityLog['action'],
    entityType: raw.entityType as ActivityLog['entityType'],
  }
}

// --- Queries ---

export async function fetchRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
  const data = await apiGet<ServerActivityLog[]>(`/api/activity?limit=${limit}`)
  return data.map(brandActivityLog)
}
