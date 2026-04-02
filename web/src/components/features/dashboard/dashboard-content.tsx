"use client"

import Link from "next/link"
import {
  CheckCircle2,
  Circle,
  Rocket,
  ArrowRight,
  Inbox,
  FolderOpen,
  ListChecks,
  Trash2,
  MoveRight,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TodoWithProject, InboxItem, ProjectWithStats, ActivityLog } from "@/types/domain"
import type { TodoId, InboxItemId } from "@/types/branded"
import type { UpdateTodoInput } from "@/types/domain"
import { useUpdateTodo } from "@/hooks/useTodos"

// --- Helpers ---

function getProjectDotColor(color: string | null): string {
  switch (color) {
    case 'blue': return 'bg-accent-blue'
    case 'purple': return 'bg-accent-purple'
    case 'green': return 'bg-accent-green'
    case 'orange': return 'bg-accent-orange'
    case 'red': return 'bg-accent-red'
    case 'pink': return 'bg-accent-pink'
    default: return 'bg-foreground-secondary'
  }
}

function getProjectBadgeClasses(color: string | null): string {
  switch (color) {
    case 'blue': return 'bg-accent-blue/15 text-accent-blue'
    case 'purple': return 'bg-accent-purple/15 text-accent-purple'
    case 'green': return 'bg-accent-green/15 text-accent-green'
    case 'orange': return 'bg-accent-orange/15 text-accent-orange'
    case 'red': return 'bg-accent-red/15 text-accent-red'
    case 'pink': return 'bg-accent-pink/15 text-accent-pink'
    default: return 'bg-foreground-secondary/15 text-foreground-secondary'
  }
}

function formatActivityTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getActivityIcon(action: string, entityType: string) {
  if (action === 'completed') return { icon: CheckCircle2, color: 'text-accent-green' }
  if (action === 'created' && entityType === 'todo') return { icon: ListChecks, color: 'text-accent-blue' }
  if (action === 'created' && entityType === 'project') return { icon: FolderOpen, color: 'text-accent-purple' }
  if (action === 'built') return { icon: Rocket, color: 'text-accent-purple' }
  if (action === 'moved') return { icon: MoveRight, color: 'text-accent-orange' }
  if (action === 'deleted') return { icon: Trash2, color: 'text-accent-red' }
  return { icon: Circle, color: 'text-foreground-secondary' }
}

function getActivityDescription(activity: ActivityLog): string {
  const meta = activity.metadata as Record<string, string>
  const entityName = meta?.title || meta?.name || activity.entityType
  switch (activity.action) {
    case 'completed': return `Completed "${entityName}"`
    case 'created': return `Created ${activity.entityType} "${entityName}"`
    case 'moved': return `Moved "${entityName}"`
    case 'built': return `Built "${entityName}"`
    case 'deleted': return `Deleted ${activity.entityType} "${entityName}"`
    default: return `${activity.action} ${activity.entityType}`
  }
}

// --- Props ---

interface DashboardContentProps {
  greeting: string
  dateStr: string
  todaysTasks: TodoWithProject[]
  inboxItems: InboxItem[]
  inboxUnprocessedCount: number
  upcoming: {
    tomorrow: TodoWithProject[]
    thisWeek: TodoWithProject[]
  }
  projects: ProjectWithStats[]
  recentActivity: ActivityLog[]
}

export function DashboardContent({
  greeting,
  dateStr,
  todaysTasks,
  inboxItems,
  inboxUnprocessedCount,
  upcoming,
  projects,
  recentActivity,
}: DashboardContentProps) {
  const updateTodo = useUpdateTodo()

  const handleToggleTask = (id: TodoId, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed'
    updateTodo.mutate({ id, input: { status: newStatus } as UpdateTodoInput })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{greeting}</h1>
        <span className="text-sm text-foreground-secondary">{dateStr}</span>
      </header>

      {/* Today's Focus Card */}
      <section className="rounded-lg border border-border bg-background-secondary p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">{"Today's Focus"}</h2>
          {todaysTasks.length > 0 && (
            <span className="text-xs text-foreground-secondary">
              {todaysTasks.filter((t) => t.status === 'completed').length}/{todaysTasks.length} done
            </span>
          )}
        </div>

        {todaysTasks.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Calendar className="h-8 w-8 text-foreground-secondary/40" />
            <p className="mt-2 text-sm text-foreground-secondary">
              No tasks for today. Enjoy your day!
            </p>
            <Link
              href="/tasks"
              className="mt-2 text-sm text-accent-blue transition-colors hover:text-accent-blue/80"
            >
              View all tasks
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {todaysTasks.slice(0, 5).map((task) => (
              <button
                key={task.id}
                onClick={() => handleToggleTask(task.id, task.status)}
                className="group flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-background-tertiary"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-green" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-foreground-secondary group-hover:text-foreground" />
                )}
                <span
                  className={cn(
                    "flex-1 text-sm truncate",
                    task.status === 'completed'
                      ? "text-foreground-secondary line-through"
                      : "text-foreground"
                  )}
                >
                  {task.title}
                </span>
                {task.project && (
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                      getProjectBadgeClasses(task.project.color)
                    )}
                  >
                    {task.project.name}
                  </span>
                )}
              </button>
            ))}
            {todaysTasks.length > 5 && (
              <Link
                href="/tasks"
                className="mt-1 flex items-center gap-1 px-2 text-sm text-foreground-secondary transition-colors hover:text-foreground"
              >
                +{todaysTasks.length - 5} more
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Two-column grid: Inbox and Upcoming */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Inbox Widget */}
        <section className="rounded-lg border border-border bg-background-secondary p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">Inbox</h2>
            {inboxUnprocessedCount > 0 && (
              <span className="rounded-full bg-accent-blue/15 px-2 py-0.5 text-xs font-medium text-accent-blue">
                {inboxUnprocessedCount} items to sort
              </span>
            )}
          </div>

          {inboxItems.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <Inbox className="h-6 w-6 text-foreground-secondary/40" />
              <p className="mt-2 text-xs text-foreground-secondary">Inbox is empty</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {inboxItems.slice(0, 3).map((item) => (
                <p
                  key={item.id}
                  className="truncate rounded-lg px-2 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                >
                  {item.content}
                </p>
              ))}
            </div>
          )}
          <Link
            href="/inbox"
            className="mt-3 flex items-center gap-1 px-2 text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        {/* Upcoming Widget */}
        <section className="rounded-lg border border-border bg-background-secondary p-4">
          <h2 className="mb-3 text-base font-medium text-foreground">Upcoming</h2>

          {upcoming.tomorrow.length === 0 && upcoming.thisWeek.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <Calendar className="h-6 w-6 text-foreground-secondary/40" />
              <p className="mt-2 text-xs text-foreground-secondary">No upcoming tasks</p>
            </div>
          ) : (
            <>
              {upcoming.tomorrow.length > 0 && (
                <div className="mb-3">
                  <h3 className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    Tomorrow
                  </h3>
                  <div className="flex flex-col gap-1">
                    {upcoming.tomorrow.map((task) => (
                      <p
                        key={task.id}
                        className="truncate rounded-lg px-2 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                      >
                        {task.title}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {upcoming.thisWeek.length > 0 && (
                <div>
                  <h3 className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    This Week
                  </h3>
                  <div className="flex flex-col gap-1">
                    {upcoming.thisWeek.map((task) => (
                      <p
                        key={task.id}
                        className="truncate rounded-lg px-2 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                      >
                        {task.title}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <Link
            href="/tasks"
            className="mt-3 flex items-center gap-1 px-2 text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </div>

      {/* Projects Section */}
      {projects.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">Projects</h2>
            <Link
              href="/projects"
              className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-background-secondary p-4 text-left transition-colors hover:bg-background-tertiary"
              >
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", getProjectDotColor(project.color))} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {project.name}
                  </p>
                  <p className="truncate text-xs text-foreground-secondary">
                    {project.todoCount} active{project.completedCount > 0 ? ` · ${project.completedCount} done` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity Section */}
      {recentActivity.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-medium text-foreground">Recent Activity</h2>
          <div className="rounded-lg border border-border bg-background-secondary p-2">
            {recentActivity.map((activity) => {
              const { icon: ActivityIcon, color } = getActivityIcon(activity.action, activity.entityType)
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-background-tertiary"
                >
                  <span className="w-16 shrink-0 text-xs text-foreground-secondary/60">
                    {formatActivityTime(activity.createdAt)}
                  </span>
                  <span className="flex-1 truncate text-sm text-foreground-secondary">
                    {getActivityDescription(activity)}
                  </span>
                  <ActivityIcon className={cn("h-4 w-4 shrink-0", color)} />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
