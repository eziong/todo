"use client"

import { useState, useEffect } from "react"
import {
  X,
  Check,
  Calendar as CalendarIcon,
  ChevronDown,
  Circle,
  Loader2,
  CheckCircle2,
  Plus,
  Hash,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTodo, useSubtasks, useTodoTags } from "@/hooks/useTodo"
import { useUpdateTodo, useCreateTodo } from "@/hooks/useTodos"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { getProjectDotColor } from "./task-utils"
import type { TodoId } from "@/types/branded"
import type { TodoStatus, TodoPriority } from "@/types/domain"

interface TaskDetailPanelProps {
  taskId: TodoId | null
  onClose: () => void
}

const priorityOptions: { value: TodoPriority; label: string; dot: string }[] = [
  { value: "urgent", label: "Urgent", dot: "bg-accent-red" },
  { value: "high", label: "High", dot: "bg-accent-orange" },
  { value: "medium", label: "Medium", dot: "bg-accent-yellow" },
  { value: "low", label: "Low", dot: "bg-accent-gray" },
  { value: "none", label: "None", dot: "" },
]

const statusOptions: { value: TodoStatus; label: string; icon: typeof Circle }[] = [
  { value: "todo", label: "Todo", icon: Circle },
  { value: "in_progress", label: "In Progress", icon: Loader2 },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
]

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  if (!taskId) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <TaskDetailContent key={taskId} taskId={taskId} onClose={onClose} />
    </>
  )
}

// Self-contained Container — uses hooks for independent data needs
function TaskDetailContent({ taskId, onClose }: { taskId: TodoId; onClose: () => void }) {
  const { data: todo, isLoading } = useTodo(taskId)
  const { data: subtasks } = useSubtasks(taskId)
  const { data: tags } = useTodoTags(taskId)
  const updateTodo = useUpdateTodo()
  const createTodo = useCreateTodo()

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState("")
  const [descriptionValue, setDescriptionValue] = useState("")
  const [newSubtask, setNewSubtask] = useState("")

  const [statusOpen, setStatusOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [dueDateOpen, setDueDateOpen] = useState(false)

  // Sync local state when todo data first loads (key={taskId} handles task switch)
  useEffect(() => {
    if (todo) {
      setTitleValue(todo.title)
      setDescriptionValue(todo.description || "")
    }
  }, [todo?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentPriority = priorityOptions.find((p) => p.value === todo?.priority)
  const currentStatus = statusOptions.find((s) => s.value === todo?.status)
  const StatusIcon = currentStatus?.icon || Circle

  const handleTitleBlur = () => {
    setEditingTitle(false)
    if (todo && titleValue.trim() && titleValue !== todo.title) {
      updateTodo.mutate({ id: todo.id, input: { title: titleValue.trim() } })
    }
  }

  const handleDescriptionBlur = () => {
    if (todo && descriptionValue !== (todo.description || "")) {
      updateTodo.mutate({
        id: todo.id,
        input: { description: descriptionValue || null },
      })
    }
  }

  const handleStatusChange = (status: TodoStatus) => {
    if (todo) {
      updateTodo.mutate({ id: todo.id, input: { status } })
    }
    setStatusOpen(false)
  }

  const handlePriorityChange = (priority: TodoPriority) => {
    if (todo) {
      updateTodo.mutate({ id: todo.id, input: { priority } })
    }
    setPriorityOpen(false)
  }

  const handleToggleComplete = () => {
    if (todo) {
      updateTodo.mutate({
        id: todo.id,
        input: { status: todo.status === "completed" ? "todo" : "completed" },
      })
    }
  }

  const handleDueDateChange = (date: Date | undefined) => {
    if (todo) {
      updateTodo.mutate({
        id: todo.id,
        input: { dueDate: date ? date.toISOString() : null },
      })
    }
    setDueDateOpen(false)
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !todo) return
    createTodo.mutate({
      title: newSubtask.trim(),
      parentId: todo.id as string,
      status: "todo",
    })
    setNewSubtask("")
  }

  const handleToggleSubtask = (subtaskId: TodoId, currentStatus: TodoStatus) => {
    updateTodo.mutate({
      id: subtaskId,
      input: { status: currentStatus === "completed" ? "todo" : "completed" },
    })
  }

  if (isLoading || !todo) {
    return <TaskDetailSkeleton />
  }

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col border-l border-border bg-background-secondary shadow-2xl">
      {/* Header */}
      <TaskDetailHeader
        todo={todo}
        editingTitle={editingTitle}
        titleValue={titleValue}
        onEditingTitleChange={setEditingTitle}
        onTitleChange={setTitleValue}
        onTitleBlur={handleTitleBlur}
        onToggleComplete={handleToggleComplete}
        onClose={onClose}
      />

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Properties */}
        <div className="border-b border-border p-4">
          <div className="space-y-3">
            {/* Status */}
            <PropertyRow label="Status">
              <div className="relative">
                <button
                  onClick={() => setStatusOpen(!statusOpen)}
                  className="flex items-center gap-2 rounded-full px-2 py-1 text-sm text-foreground transition-colors hover:bg-background-tertiary"
                >
                  <StatusIcon
                    className={cn("h-4 w-4", todo.status === "in_progress" && "animate-spin")}
                  />
                  <span>{currentStatus?.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-foreground-secondary" />
                </button>
                {statusOpen && (
                  <DropdownMenu onClose={() => setStatusOpen(false)}>
                    {statusOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <DropdownItem
                          key={option.value}
                          selected={todo.status === option.value}
                          onClick={() => handleStatusChange(option.value)}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              option.value === "in_progress" &&
                                todo.status === option.value &&
                                "animate-spin"
                            )}
                          />
                          <span>{option.label}</span>
                        </DropdownItem>
                      )
                    })}
                  </DropdownMenu>
                )}
              </div>
            </PropertyRow>

            {/* Priority */}
            <PropertyRow label="Priority">
              <div className="relative">
                <button
                  onClick={() => setPriorityOpen(!priorityOpen)}
                  className="flex items-center gap-2 rounded-full px-2 py-1 text-sm text-foreground transition-colors hover:bg-background-tertiary"
                >
                  {currentPriority?.dot && (
                    <div className={cn("h-2.5 w-2.5 rounded-full", currentPriority.dot)} />
                  )}
                  <span>{currentPriority?.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-foreground-secondary" />
                </button>
                {priorityOpen && (
                  <DropdownMenu onClose={() => setPriorityOpen(false)}>
                    {priorityOptions.map((option) => (
                      <DropdownItem
                        key={option.value}
                        selected={todo.priority === option.value}
                        onClick={() => handlePriorityChange(option.value)}
                      >
                        {option.dot ? (
                          <div className={cn("h-2.5 w-2.5 rounded-full", option.dot)} />
                        ) : (
                          <div className="h-2.5 w-2.5" />
                        )}
                        <span>{option.label}</span>
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                )}
              </div>
            </PropertyRow>

            {/* Due Date */}
            <PropertyRow label="Due Date">
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full px-2 py-1 text-sm text-foreground transition-colors hover:bg-background-tertiary">
                    <CalendarIcon className={cn("h-4 w-4", todo.dueDate && new Date(todo.dueDate) < new Date() ? "text-accent-red" : "text-foreground-secondary")} />
                    <span>{todo.dueDate ? formatDate(todo.dueDate) : "No date"}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-foreground-secondary" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={todo.dueDate ? new Date(todo.dueDate) : undefined}
                    onSelect={handleDueDateChange}
                    defaultMonth={todo.dueDate ? new Date(todo.dueDate) : undefined}
                  />
                  {todo.dueDate && (
                    <div className="border-t border-border p-2">
                      <button
                        onClick={() => handleDueDateChange(undefined)}
                        className="w-full rounded-full px-3 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                      >
                        Remove date
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </PropertyRow>

            {/* Project */}
            {todo.project && (
              <PropertyRow label="Project">
                <button className="flex items-center gap-2 rounded-full px-2 py-1 text-sm text-foreground transition-colors hover:bg-background-tertiary">
                  <div
                    className={cn("h-2.5 w-2.5 rounded-full", getProjectDotColor(todo.project.color))}
                  />
                  <span>{todo.project.name}</span>
                </button>
              </PropertyRow>
            )}

            {/* Tags */}
            {tags && tags.length > 0 && (
              <PropertyRow label="Tags">
                <div className="flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1 rounded-full bg-background-tertiary px-2 py-0.5 text-xs text-foreground-secondary"
                    >
                      <Hash className="h-3 w-3" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              </PropertyRow>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="border-b border-border p-4">
          <h3 className="mb-2 text-xs uppercase tracking-wider text-foreground-secondary">
            Description
          </h3>
          <textarea
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add a description..."
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-accent-blue focus:outline-none"
          />
        </div>

        {/* Subtasks */}
        <div className="p-4">
          <h3 className="mb-2 text-xs uppercase tracking-wider text-foreground-secondary">
            Subtasks
          </h3>
          <div className="space-y-1">
            {subtasks?.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 rounded-full px-1 py-1.5 transition-colors hover:bg-background-tertiary"
              >
                <button
                  onClick={() => handleToggleSubtask(subtask.id, subtask.status)}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                    subtask.status === "completed"
                      ? "border-accent-blue/50 bg-accent-blue/20 text-accent-blue"
                      : "border-border hover:border-foreground-secondary"
                  )}
                >
                  {subtask.status === "completed" && (
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  )}
                </button>
                <span
                  className={cn(
                    "text-sm",
                    subtask.status === "completed"
                      ? "text-foreground-secondary line-through"
                      : "text-foreground"
                  )}
                >
                  {subtask.title}
                </span>
              </div>
            ))}

            {/* Add subtask */}
            <div className="flex items-center gap-2 pt-1">
              <button className="flex h-4 w-4 items-center justify-center text-foreground-secondary">
                <Plus className="h-3.5 w-3.5" />
              </button>
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleAddSubtask()
                }}
                placeholder="Add subtask"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-secondary/50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity footer */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-xs text-foreground-secondary/60">
          Created {formatDate(todo.createdAt)} · Modified {formatRelativeTime(todo.updatedAt)}
        </p>
      </div>
    </div>
  )
}

// --- Header sub-component ---

interface TaskDetailHeaderProps {
  todo: { id: TodoId; title: string; status: TodoStatus }
  editingTitle: boolean
  titleValue: string
  onEditingTitleChange: (editing: boolean) => void
  onTitleChange: (value: string) => void
  onTitleBlur: () => void
  onToggleComplete: () => void
  onClose: () => void
}

function TaskDetailHeader({
  todo,
  editingTitle,
  titleValue,
  onEditingTitleChange,
  onTitleChange,
  onTitleBlur,
  onToggleComplete,
  onClose,
}: TaskDetailHeaderProps) {
  return (
    <div className="flex items-start gap-3 border-b border-border p-4">
      <button
        onClick={onToggleComplete}
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          todo.status === "completed"
            ? "border-accent-blue bg-accent-blue text-white"
            : "border-border hover:border-foreground-secondary"
        )}
      >
        {todo.status === "completed" && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>

      {editingTitle ? (
        <input
          type="text"
          value={titleValue}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) onTitleBlur()
          }}
          autoFocus
          className="flex-1 bg-transparent text-lg font-semibold text-foreground outline-none"
        />
      ) : (
        <h2
          onClick={() => onEditingTitleChange(true)}
          className={cn(
            "flex-1 cursor-text text-lg font-semibold",
            todo.status === "completed"
              ? "text-foreground-secondary line-through"
              : "text-foreground"
          )}
        >
          {todo.title}
        </h2>
      )}

      <button
        onClick={onClose}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// --- Skeleton ---

function TaskDetailSkeleton() {
  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col border-l border-border bg-background-secondary shadow-2xl">
      <div className="flex items-start gap-3 border-b border-border p-4">
        <Skeleton className="mt-0.5 h-6 w-6 rounded-full" />
        <Skeleton className="h-7 flex-1" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Shared sub-components ---

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[100px] shrink-0 text-sm text-foreground-secondary">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function DropdownMenu({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-border bg-background-secondary p-1 shadow-lg">
        {children}
      </div>
    </>
  )
}

function DropdownItem({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode
  selected?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-full px-2 py-1.5 text-sm transition-colors",
        selected
          ? "bg-background-tertiary text-foreground"
          : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
      )}
    >
      {children}
      {selected && <Check className="ml-auto h-3.5 w-3.5 text-accent-blue" />}
    </button>
  )
}

// --- Utility functions ---

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}
