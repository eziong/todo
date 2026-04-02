"use client"

import { useState } from "react"
import { useNotifications, useMarkRead, useMarkAllRead, useDeleteNotification } from "@/hooks/useNotifications"
import { NotificationList } from "@/components/features/notifications/notification-list"
import { NotificationSkeleton } from "@/components/features/notifications/notification-skeleton"
import { classifyError } from "@/lib/errors"
import { AlertCircle, WifiOff, RefreshCw } from "lucide-react"
import type { NotificationSource } from "@/types/domain"

export default function NotificationsPage() {
  const [sourceFilter, setSourceFilter] = useState<NotificationSource | null>(null)

  const filters = sourceFilter ? { source: sourceFilter } : undefined
  const { data: notifications, isLoading, error, refetch } = useNotifications(filters)
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const deleteNotification = useDeleteNotification()

  // Loading state
  if (isLoading) {
    return <NotificationSkeleton />
  }

  // Error state
  if (error && !notifications) {
    const classified = classifyError(error)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-secondary">
          {classified.type === "network" || classified.type === "timeout" ? (
            <WifiOff className="h-6 w-6 text-foreground-secondary" />
          ) : (
            <AlertCircle className="h-6 w-6 text-foreground-secondary" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{classified.title}</p>
          <p className="mt-1 text-xs text-foreground-secondary">{classified.message}</p>
        </div>
        {classified.retryable && (
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
      </div>
    )
  }

  const hasUnread = (notifications ?? []).some((n) => !n.read)

  return (
    <NotificationList
      notifications={notifications ?? []}
      sourceFilter={sourceFilter}
      onSourceFilterChange={setSourceFilter}
      onMarkRead={(id) => markRead.mutate(id)}
      onMarkAllRead={() => markAllRead.mutate()}
      onDelete={(id) => deleteNotification.mutate(id)}
      hasUnread={hasUnread}
    />
  )
}
