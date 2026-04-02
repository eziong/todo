"use client"

import { Calendar, Check, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { priorityColors, getProjectColorClasses, formatDueDate } from "./task-utils"
import type { TodoWithProject } from "@/types/domain"

interface TaskRowProps {
  todo: TodoWithProject
  completed?: boolean
  onToggleStatus: () => void
  onTaskClick?: () => void
  onDelete?: () => void
}

export function TaskRow({ todo, completed, onToggleStatus, onTaskClick, onDelete }: TaskRowProps) {
  const isCompleted = completed || todo.status === "completed"
  const hasPriorityDot = todo.priority !== "none" && todo.priority !== "low"

  return (
    <div
      onClick={onTaskClick}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors",
        !isCompleted && "hover:bg-background-tertiary"
      )}
    >
      {/* Priority dot */}
      <div className="flex w-2.5 items-center justify-center">
        {hasPriorityDot && (
          <div className={cn("h-[7px] w-[7px] rounded-full", priorityColors[todo.priority])} />
        )}
      </div>

      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleStatus()
        }}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          isCompleted
            ? "border-accent-blue/50 bg-accent-blue/20 text-accent-blue"
            : "border-border bg-transparent hover:border-foreground-secondary"
        )}
      >
        {isCompleted && <Check className="h-3 w-3" strokeWidth={2.5} />}
      </button>

      {/* Title */}
      <span
        className={cn(
          "flex-1 text-sm truncate",
          isCompleted ? "text-foreground-secondary/50 line-through opacity-50" : "text-foreground"
        )}
      >
        {todo.title}
      </span>

      {/* Project tag */}
      {todo.project && (
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
            getProjectColorClasses(todo.project.color)
          )}
        >
          {todo.project.name}
        </span>
      )}

      {/* Due date */}
      {todo.dueDate && !isCompleted && (
        <span
          className={cn(
            "flex items-center gap-1 text-xs",
            new Date(todo.dueDate) < new Date() ? "text-accent-red" : "text-foreground-secondary"
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          {formatDueDate(todo.dueDate)}
        </span>
      )}

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-secondary/0 transition-colors group-hover:text-foreground-secondary hover:!text-accent-red"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
