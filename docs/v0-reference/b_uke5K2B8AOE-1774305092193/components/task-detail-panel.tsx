"use client"

import { useState } from "react"
import {
  X,
  Check,
  Calendar,
  ChevronDown,
  Circle,
  Loader2,
  CheckCircle2,
  Repeat,
  Plus,
  Hash,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Priority = "urgent" | "high" | "medium" | "low" | "none"
type Status = "todo" | "in-progress" | "completed"

interface SubTask {
  id: string
  title: string
  completed: boolean
}

interface TaskDetail {
  id: string
  title: string
  status: Status
  priority: Priority
  dueDate: string
  project: { name: string; color: string }
  tags: string[]
  repeat: string
  description: string
  subtasks: SubTask[]
  createdAt: string
  modifiedAt: string
}

interface TaskDetailPanelProps {
  open: boolean
  onClose: () => void
  task?: TaskDetail
}

const defaultTask: TaskDetail = {
  id: "t1",
  title: "Fix production auth bug",
  status: "todo",
  priority: "urgent",
  dueDate: "March 23, 2026",
  project: { name: "Server API", color: "bg-accent-green" },
  tags: ["urgent", "backend"],
  repeat: "none",
  description: "Auth token refresh failing for users with expired sessions. See error logs from March 22.",
  subtasks: [
    { id: "s1", title: "Identify root cause", completed: true },
    { id: "s2", title: "Write fix", completed: false },
    { id: "s3", title: "Test & deploy", completed: false },
  ],
  createdAt: "Mar 22",
  modifiedAt: "2h ago",
}

const priorityOptions = [
  { value: "urgent", label: "Urgent", dot: "bg-accent-red" },
  { value: "high", label: "High", dot: "bg-accent-orange" },
  { value: "medium", label: "Medium", dot: "bg-accent-yellow" },
  { value: "low", label: "Low", dot: "bg-accent-gray" },
  { value: "none", label: "None", dot: "" },
]

const statusOptions = [
  { value: "todo", label: "Todo", icon: Circle },
  { value: "in-progress", label: "In Progress", icon: Loader2 },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
]

const projectOptions = [
  { name: "Server API", color: "bg-accent-green" },
  { name: "Command Center", color: "bg-accent-blue" },
  { name: "YouTube Channel", color: "bg-accent-purple" },
]

const repeatOptions = ["None", "Daily", "Weekly", "Monthly", "Custom"]

export function TaskDetailPanel({ open, onClose, task = defaultTask }: TaskDetailPanelProps) {
  const [taskData, setTaskData] = useState(task)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(task.title)
  const [descriptionValue, setDescriptionValue] = useState(task.description)
  const [newSubtask, setNewSubtask] = useState("")
  
  // Dropdown states
  const [statusOpen, setStatusOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const [repeatOpen, setRepeatOpen] = useState(false)

  const currentPriority = priorityOptions.find(p => p.value === taskData.priority)
  const currentStatus = statusOptions.find(s => s.value === taskData.status)
  const StatusIcon = currentStatus?.icon || Circle

  const toggleSubtask = (id: string) => {
    setTaskData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st =>
        st.id === id ? { ...st, completed: !st.completed } : st
      ),
    }))
  }

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    setTaskData(prev => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        { id: `s${Date.now()}`, title: newSubtask.trim(), completed: false },
      ],
    }))
    setNewSubtask("")
  }

  const removeTag = (tag: string) => {
    setTaskData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col border-l border-border bg-background-secondary shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border p-4">
          {/* Large checkbox */}
          <button
            onClick={() => setTaskData(prev => ({
              ...prev,
              status: prev.status === "completed" ? "todo" : "completed"
            }))}
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors",
              taskData.status === "completed"
                ? "border-accent-blue bg-accent-blue text-white"
                : "border-border hover:border-foreground-secondary"
            )}
          >
            {taskData.status === "completed" && <Check className="h-4 w-4" strokeWidth={3} />}
          </button>

          {/* Editable title */}
          {editingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => {
                setEditingTitle(false)
                setTaskData(prev => ({ ...prev, title: titleValue }))
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingTitle(false)
                  setTaskData(prev => ({ ...prev, title: titleValue }))
                }
              }}
              autoFocus
              className="flex-1 bg-transparent text-lg font-semibold text-foreground outline-none"
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              className={cn(
                "flex-1 cursor-text text-lg font-semibold",
                taskData.status === "completed"
                  ? "text-foreground-secondary line-through"
                  : "text-foreground"
              )}
            >
              {taskData.title}
            </h2>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* Properties section */}
          <div className="border-b border-border p-4">
            <div className="space-y-3">
              {/* Status */}
              <PropertyRow label="Status">
                <div className="relative">
                  <button
                    onClick={() => setStatusOpen(!statusOpen)}
                    className="flex items-center gap-2 rounded-[4px] px-2 py-1 text-sm text-foreground transition-colors hover:bg-background-tertiary"
                  >
                    <StatusIcon className={cn(
                      "h-4 w-4",
                      taskData.status === "in-progress" && "animate-spin"
                    )} />
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
                            selected={taskData.status === option.value}
                            onClick={() => {
                              setTaskData(prev => ({ ...prev, status: option.value as Status }))
                              setStatusOpen(false)
                            }}
                          >
                            <Icon className={cn(
                              "h-4 w-4",
                              option.value === "in-progress" && taskData.status === option.value && "animate-spin"
                            )} />
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
                    className="flex items-center gap-2 rounded-[4px] px-2 py-1 text-sm text-foreground transition-colors hover:bg-background-tertiary"
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
                          selected={taskData.priority === option.value}
                          onClick={() => {
                            setTaskData(prev => ({ ...prev, priority: option.value as Priority }))
                            setPriorityOpen(false)
                          }}
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
                <button className="flex items-center gap-2 rounded-[4px] px-2 py-1 text-sm text-foreground transition-colors hover:bg-background-tertiary">
                  <Calendar className="h-4 w-4 text-foreground-secondary" />
                  <span>{taskData.dueDate}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-foreground-secondary" />
                </button>
              </PropertyRow>

              {/* Project */}
              <PropertyRow label="Project">
                <div className="relative">
                  <button
                    onClick={() => setProjectOpen(!projectOpen)}
                    className="flex items-center gap-2 rounded-[4px] px-2 py-1 text-sm text-foreground transition-colors hover:bg-background-tertiary"
                  >
                    <div className={cn("h-2.5 w-2.5 rounded-full", taskData.project.color)} />
                    <span>{taskData.project.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-foreground-secondary" />
                  </button>
                  {projectOpen && (
                    <DropdownMenu onClose={() => setProjectOpen(false)}>
                      {projectOptions.map((option) => (
                        <DropdownItem
                          key={option.name}
                          selected={taskData.project.name === option.name}
                          onClick={() => {
                            setTaskData(prev => ({ ...prev, project: option }))
                            setProjectOpen(false)
                          }}
                        >
                          <div className={cn("h-2.5 w-2.5 rounded-full", option.color)} />
                          <span>{option.name}</span>
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  )}
                </div>
              </PropertyRow>

              {/* Tags */}
              <PropertyRow label="Tags">
                <div className="flex flex-wrap items-center gap-1.5">
                  {taskData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-[4px] bg-background-tertiary px-2 py-0.5 text-xs text-foreground-secondary"
                    >
                      <Hash className="h-3 w-3" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 text-foreground-secondary/50 hover:text-foreground-secondary"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button className="flex h-6 w-6 items-center justify-center rounded-[4px] text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </PropertyRow>

              {/* Repeat */}
              <PropertyRow label="Repeat">
                <div className="relative">
                  <button
                    onClick={() => setRepeatOpen(!repeatOpen)}
                    className="flex items-center gap-2 rounded-[4px] px-2 py-1 text-sm text-foreground transition-colors hover:bg-background-tertiary"
                  >
                    <Repeat className="h-4 w-4 text-foreground-secondary" />
                    <span>{taskData.repeat === "none" ? "None" : taskData.repeat}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-foreground-secondary" />
                  </button>
                  {repeatOpen && (
                    <DropdownMenu onClose={() => setRepeatOpen(false)}>
                      {repeatOptions.map((option) => (
                        <DropdownItem
                          key={option}
                          selected={taskData.repeat.toLowerCase() === option.toLowerCase()}
                          onClick={() => {
                            setTaskData(prev => ({ ...prev, repeat: option.toLowerCase() }))
                            setRepeatOpen(false)
                          }}
                        >
                          <span>{option}</span>
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  )}
                </div>
              </PropertyRow>
            </div>
          </div>

          {/* Description section */}
          <div className="border-b border-border p-4">
            <h3 className="mb-2 text-xs uppercase tracking-wider text-foreground-secondary">
              Description
            </h3>
            <textarea
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className="w-full resize-none rounded-[6px] border border-border bg-background-secondary p-3 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-accent-blue focus:outline-none"
            />
          </div>

          {/* Subtasks section */}
          <div className="p-4">
            <h3 className="mb-2 text-xs uppercase tracking-wider text-foreground-secondary">
              Subtasks
            </h3>
            <div className="space-y-1">
              {taskData.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 rounded-[4px] px-1 py-1.5 transition-colors hover:bg-background-tertiary"
                >
                  <button
                    onClick={() => toggleSubtask(subtask.id)}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                      subtask.completed
                        ? "border-accent-blue/50 bg-accent-blue/20 text-accent-blue"
                        : "border-border hover:border-foreground-secondary"
                    )}
                  >
                    {subtask.completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </button>
                  <span
                    className={cn(
                      "text-sm",
                      subtask.completed
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
                    if (e.key === "Enter") addSubtask()
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
            Created {taskData.createdAt} · Modified {taskData.modifiedAt}
          </p>
        </div>
      </div>
    </>
  )
}

interface PropertyRowProps {
  label: string
  children: React.ReactNode
}

function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[100px] shrink-0 text-sm text-foreground-secondary">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

interface DropdownMenuProps {
  children: React.ReactNode
  onClose: () => void
}

function DropdownMenu({ children, onClose }: DropdownMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-[6px] border border-border bg-background-secondary p-1 shadow-lg">
        {children}
      </div>
    </>
  )
}

interface DropdownItemProps {
  children: React.ReactNode
  selected?: boolean
  onClick: () => void
}

function DropdownItem({ children, selected, onClick }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm transition-colors",
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
