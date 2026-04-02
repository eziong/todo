"use client"

import {
  Youtube,
  Hammer,
  Bell,
  ExternalLink,
  Check,
  Trash2,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { NotificationId } from "@/types/branded"
import type { Notification, NotificationSource } from "@/types/domain"

// --- Time formatting ---

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

// --- Source config ---

const SOURCE_CONFIG: Record<
  NotificationSource,
  { icon: React.ElementType; label: string; badgeClass: string }
> = {
  youtube: {
    icon: Youtube,
    label: "YouTube",
    badgeClass: "bg-red-500/10 text-red-400",
  },
  build: {
    icon: Hammer,
    label: "Build",
    badgeClass: "bg-orange-500/10 text-orange-400",
  },
  system: {
    icon: Bell,
    label: "System",
    badgeClass: "bg-blue-500/10 text-blue-400",
  },
}

const ALL_SOURCES: NotificationSource[] = ["youtube", "build", "system"]

// --- Filter Chips ---

interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-background-secondary text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}

// --- Empty State ---

function NotificationEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-secondary">
        <Bell className="h-6 w-6 text-foreground-secondary" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">No notifications yet</p>
        <p className="mt-1 text-xs text-foreground-secondary">
          Notifications from YouTube, builds, and system events will appear here.
        </p>
      </div>
    </div>
  )
}

// --- Notification Item ---

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: NotificationId) => void
  onDelete: (id: NotificationId) => void
}

function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const config = SOURCE_CONFIG[notification.source]
  const Icon = config.icon

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id)
    }
    if (notification.url) {
      window.open(notification.url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-xl p-3 transition-colors",
        !notification.read
          ? "bg-accent-blue/5 hover:bg-accent-blue/10"
          : "hover:bg-background-secondary"
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent-blue" />
      )}

      {/* Source icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          config.badgeClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <button
        onClick={handleClick}
        className="flex flex-1 flex-col items-start gap-0.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm",
              !notification.read ? "font-medium text-foreground" : "text-foreground-secondary"
            )}
          >
            {notification.title}
          </span>
          {notification.url && (
            <ExternalLink className="h-3 w-3 shrink-0 text-foreground-secondary" />
          )}
        </div>
        {notification.body && (
          <p className="line-clamp-1 text-xs text-foreground-secondary">
            {notification.body}
          </p>
        )}
        <span className="text-xs text-foreground-secondary">
          {formatTimeAgo(notification.createdAt)}
        </span>
      </button>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.read && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
            aria-label="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-red-400"
          aria-label="Delete notification"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// --- Notification List ---

interface NotificationListProps {
  notifications: Notification[]
  sourceFilter: NotificationSource | null
  onSourceFilterChange: (source: NotificationSource | null) => void
  onMarkRead: (id: NotificationId) => void
  onMarkAllRead: () => void
  onDelete: (id: NotificationId) => void
  hasUnread: boolean
}

export function NotificationList({
  notifications,
  sourceFilter,
  onSourceFilterChange,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  hasUnread,
}: NotificationListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        {hasUnread && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-foreground-secondary transition-colors hover:bg-background-secondary hover:text-foreground"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-6 py-3">
        <FilterChip
          label="All"
          active={sourceFilter === null}
          onClick={() => onSourceFilterChange(null)}
        />
        {ALL_SOURCES.map((source) => (
          <FilterChip
            key={source}
            label={SOURCE_CONFIG[source].label}
            active={sourceFilter === source}
            onClick={() => onSourceFilterChange(source)}
          />
        ))}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="space-y-0.5">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
