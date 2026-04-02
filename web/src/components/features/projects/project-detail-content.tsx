"use client"

import Link from "next/link"
import {
  CheckCircle2,
  Circle,
  Calendar,
  ArrowRight,
  CheckSquare,
  Hammer,
  Film,

  Image,
  Youtube,
  DollarSign,
  FileText,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project, TodoWithProject, ProjectFeature } from "@/types/domain"
import type { TodoId } from "@/types/branded"
import type { UpdateTodoInput } from "@/types/domain"
import { useUpdateTodo } from "@/hooks/useTodos"

// --- Helpers ---

function getTomorrowStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split("T")[0]
}

function getEndOfWeekStr(): string {
  const d = new Date()
  const dayOfWeek = d.getDay()
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  d.setDate(d.getDate() + daysUntilSunday)
  return d.toISOString().split("T")[0]
}

const FEATURE_CONFIG: Record<ProjectFeature, { label: string; icon: React.ElementType; path: string }> = {
  tasks: { label: "Tasks", icon: CheckSquare, path: "/tasks" },
  builds: { label: "Builds", icon: Hammer, path: "/builds" },
  content: { label: "Content", icon: Film, path: "/content" },

  assets: { label: "Assets", icon: Image, path: "/assets" },
  youtube: { label: "YouTube", icon: Youtube, path: "/youtube" },
  revenue: { label: "Revenue", icon: DollarSign, path: "/revenue" },
  notes: { label: "Notes", icon: FileText, path: "/notes" },
  links: { label: "Links", icon: Link2, path: "/links" },
}

// --- Props ---

interface ProjectDetailContentProps {
  project: Project
  todos: TodoWithProject[]
  todosLoading: boolean
}

export function ProjectDetailContent({
  project,
  todos,
  todosLoading,
}: ProjectDetailContentProps) {
  const updateTodo = useUpdateTodo()
  const basePath = `/projects/${project.id}`

  const activeTodos = todos.filter((t) => t.status !== "completed")
  const completedTodos = todos.filter((t) => t.status === "completed")
  const totalCount = todos.length
  const completedCount = completedTodos.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Recent active tasks (up to 5)
  const recentTasks = activeTodos.slice(0, 5)

  // Upcoming: tomorrow + this week
  const tomorrow = getTomorrowStr()
  const endOfWeek = getEndOfWeekStr()
  const incompletWithDue = todos.filter((t) => t.status !== "completed" && t.dueDate)
  const tomorrowTasks = incompletWithDue.filter((t) => t.dueDate!.startsWith(tomorrow))
  const thisWeekTasks = incompletWithDue.filter(
    (t) => t.dueDate! > tomorrow && t.dueDate! <= endOfWeek,
  )

  const handleToggleTask = (id: TodoId, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "todo" : "completed"
    updateTodo.mutate({ id, input: { status: newStatus } as UpdateTodoInput })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress Bar */}
      <section className="rounded-lg border border-border bg-background-secondary p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">Progress</h2>
          <span className="text-sm text-foreground-secondary">
            {completedCount}/{totalCount} tasks completed
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-background-tertiary">
          <div
            className="h-full rounded-full bg-accent-blue transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-foreground-secondary">{progressPercent}%</p>
      </section>

      {/* Two-column grid: Recent Tasks + Upcoming */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <section className="rounded-lg border border-border bg-background-secondary p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">Recent Tasks</h2>
            {activeTodos.length > 5 && (
              <span className="text-xs text-foreground-secondary">
                {activeTodos.length} open
              </span>
            )}
          </div>

          {todosLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-background-tertiary" />
              ))}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckSquare className="h-6 w-6 text-foreground-secondary/40" />
              <p className="mt-2 text-xs text-foreground-secondary">No open tasks</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {recentTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className="group flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-background-tertiary"
                >
                  <Circle className="h-4 w-4 shrink-0 text-foreground-secondary group-hover:text-foreground" />
                  <span className="flex-1 truncate text-sm text-foreground">
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          )}

          <Link
            href={`${basePath}/tasks`}
            className="mt-3 flex items-center gap-1 px-2 text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            View all tasks
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        {/* Upcoming */}
        <section className="rounded-lg border border-border bg-background-secondary p-4">
          <h2 className="mb-3 text-base font-medium text-foreground">Upcoming</h2>

          {tomorrowTasks.length === 0 && thisWeekTasks.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <Calendar className="h-6 w-6 text-foreground-secondary/40" />
              <p className="mt-2 text-xs text-foreground-secondary">No upcoming tasks</p>
            </div>
          ) : (
            <>
              {tomorrowTasks.length > 0 && (
                <div className="mb-3">
                  <h3 className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    Tomorrow
                  </h3>
                  <div className="flex flex-col gap-1">
                    {tomorrowTasks.map((task) => (
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

              {thisWeekTasks.length > 0 && (
                <div>
                  <h3 className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    This Week
                  </h3>
                  <div className="flex flex-col gap-1">
                    {thisWeekTasks.map((task) => (
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
            href={`${basePath}/tasks`}
            className="mt-3 flex items-center gap-1 px-2 text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            View all tasks
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </div>

      {/* Feature Snapshot */}
      {project.features.length > 0 && (
        <section className="rounded-lg border border-border bg-background-secondary p-4">
          <h2 className="mb-3 text-base font-medium text-foreground">Features</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {project.features.map((feature) => {
              const config = FEATURE_CONFIG[feature]
              if (!config) return null
              const Icon = config.icon
              return (
                <Link
                  key={feature}
                  href={`${basePath}${config.path}`}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{config.label}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
