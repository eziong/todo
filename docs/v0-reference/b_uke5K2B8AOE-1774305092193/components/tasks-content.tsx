"use client"

import { useState } from "react"
import { 
  GripVertical, 
  ChevronDown,
  ChevronRight,
  Calendar,
  Filter,
  ArrowUpDown,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskDetailPanel } from "@/components/task-detail-panel"

type Priority = "urgent" | "high" | "medium" | "low" | "none"

interface Task {
  id: string
  title: string
  priority: Priority
  project?: { name: string; color: string }
  dueDate?: string
  completed?: boolean
}

interface TaskSection {
  id: string
  title: string
  tasks: Task[]
  collapsed?: boolean
  showCount?: boolean
}

const projects = {
  server: { name: "@Svr", color: "bg-accent-blue" },
  youtube: { name: "@YT", color: "bg-accent-purple" },
  command: { name: "@Cmd", color: "bg-accent-blue" },
}

const taskSections: TaskSection[] = [
  {
    id: "today",
    title: "Today",
    tasks: [
      { id: "t1", title: "Fix production auth bug", priority: "urgent", project: projects.server, dueDate: "Today" },
      { id: "t2", title: "Record video intro", priority: "medium", project: projects.youtube },
      { id: "t3", title: "Review pull request", priority: "none", project: projects.command },
    ],
  },
  {
    id: "tomorrow",
    title: "Tomorrow",
    tasks: [
      { id: "t4", title: "Edit video chapter 3", priority: "none", project: projects.youtube },
      { id: "t5", title: "Write changelog", priority: "none", project: projects.command },
    ],
  },
  {
    id: "this-week",
    title: "This Week",
    tasks: [
      { id: "t6", title: "Migrate database", priority: "medium", project: projects.server },
      { id: "t7", title: "Design settings page", priority: "none", project: projects.command },
      { id: "t8", title: "Upload episode 15", priority: "none", project: projects.youtube },
    ],
  },
]

const noDateTasks: Task[] = [
  { id: "nd1", title: "Research competitor features", priority: "low" },
  { id: "nd2", title: "Update documentation", priority: "none" },
  { id: "nd3", title: "Clean up old branches", priority: "none" },
  { id: "nd4", title: "Organize file structure", priority: "none" },
  { id: "nd5", title: "Review analytics setup", priority: "none" },
  { id: "nd6", title: "Plan Q2 roadmap", priority: "low" },
]

const completedTasks: Task[] = [
  { id: "c1", title: "Set up CI/CD pipeline", priority: "none", project: projects.server, completed: true },
  { id: "c2", title: "Create thumbnail template", priority: "none", project: projects.youtube, completed: true },
  { id: "c3", title: "Implement dark mode", priority: "none", project: projects.command, completed: true },
]

const priorityColors: Record<Priority, string> = {
  urgent: "bg-accent-red",
  high: "bg-accent-orange",
  medium: "bg-accent-yellow",
  low: "bg-accent-gray",
  none: "",
}

export function TasksContent() {
  const [inputValue, setInputValue] = useState("")
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set())
  const [noDateExpanded, setNoDateExpanded] = useState(false)
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [filterOpen, setFilterOpen] = useState(true) // Show filter open by default per spec
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>("t1") // Show panel open by default

  const toggleChecked = (id: string) => {
    const newChecked = new Set(checkedTasks)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedTasks(newChecked)
  }

  const totalTasks = taskSections.reduce((acc, s) => acc + s.tasks.length, 0) + noDateTasks.length

  return (
    <>
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">All Tasks</h1>
        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <div className="relative">
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-[6px] border border-border px-3 text-sm transition-colors",
                filterOpen 
                  ? "bg-background-tertiary text-foreground" 
                  : "bg-background-secondary text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
              )}
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", filterOpen && "rotate-180")} />
            </button>

            {/* Filter dropdown panel */}
            {filterOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-[8px] border border-border bg-background-secondary p-1 shadow-xl">
                <FilterSection title="Priority">
                  <FilterOption label="All" selected />
                  <FilterOption label="Urgent" dot="bg-accent-red" />
                  <FilterOption label="High" dot="bg-accent-orange" />
                  <FilterOption label="Medium" dot="bg-accent-yellow" />
                  <FilterOption label="Low" dot="bg-accent-gray" />
                </FilterSection>
                
                <div className="my-1 border-t border-border" />
                
                <FilterSection title="Project">
                  <FilterOption label="All" selected />
                  <FilterOption label="Command Center" dot="bg-accent-blue" />
                  <FilterOption label="YouTube Channel" dot="bg-accent-purple" />
                  <FilterOption label="Server API" dot="bg-accent-green" />
                </FilterSection>
                
                <div className="my-1 border-t border-border" />
                
                <FilterSection title="Status">
                  <FilterOption label="All" selected />
                  <FilterOption label="Todo" />
                  <FilterOption label="In Progress" />
                  <FilterOption label="Completed" />
                </FilterSection>
                
                <div className="my-1 border-t border-border" />
                
                <FilterSection title="Due">
                  <FilterOption label="All" selected />
                  <FilterOption label="Overdue" />
                  <FilterOption label="Today" />
                  <FilterOption label="This Week" />
                  <FilterOption label="No Date" />
                </FilterSection>
              </div>
            )}
          </div>

          {/* Sort dropdown */}
          <button className="flex h-8 items-center gap-2 rounded-[6px] border border-border bg-background-secondary px-3 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground">
            <ArrowUpDown className="h-4 w-4" />
            <span>Sort</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick add input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="+ Add task..."
          className="w-full rounded-[8px] border border-border bg-background-secondary px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/60 transition-colors focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-secondary/50 font-mono">
          Cmd+N
        </span>
      </div>

      {/* Task sections */}
      <div className="space-y-0">
        {taskSections.map((section) => (
          <TaskSectionGroup
            key={section.id}
            section={section}
            checkedTasks={checkedTasks}
            onToggleChecked={toggleChecked}
            onTaskClick={setSelectedTaskId}
          />
        ))}

        {/* No Date section (collapsed by default) */}
        <div className="border-t border-border pt-3">
          <button
            onClick={() => setNoDateExpanded(!noDateExpanded)}
            className="flex w-full items-center gap-2 py-2 text-xs uppercase tracking-wider text-foreground-secondary transition-colors hover:text-foreground"
          >
            {noDateExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <span>{noDateTasks.length} tasks without due date</span>
          </button>

          {noDateExpanded && (
            <div className="mt-1">
              {noDateTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  checked={checkedTasks.has(task.id)}
                  onToggleChecked={() => toggleChecked(task.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Completed section (collapsed by default) */}
        <div className="border-t border-border pt-3">
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="flex w-full items-center gap-2 py-2 text-xs uppercase tracking-wider text-foreground-secondary transition-colors hover:text-foreground"
          >
            {completedExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <span>Show completed</span>
            <span className="text-foreground-secondary/50">({completedTasks.length})</span>
          </button>

          {completedExpanded && (
            <div className="mt-1">
              {completedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={{ ...task, completed: true }}
                  checked={true}
                  onToggleChecked={() => {}}
                  disabled
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Task Detail Panel */}
    <TaskDetailPanel 
      open={selectedTaskId !== null} 
      onClose={() => setSelectedTaskId(null)} 
    />
    </>
  )
}

interface TaskSectionGroupProps {
  section: TaskSection
  checkedTasks: Set<string>
  onToggleChecked: (id: string) => void
  onTaskClick: (id: string) => void
}

function TaskSectionGroup({ section, checkedTasks, onToggleChecked, onTaskClick }: TaskSectionGroupProps) {
  return (
    <div className="border-t border-border pt-3">
      {/* Section header */}
      <div className="flex items-center gap-2 py-2">
        <span className="text-xs uppercase tracking-wider text-foreground-secondary">
          {section.title}
        </span>
        <span className="text-xs text-foreground-secondary/50">({section.tasks.length})</span>
      </div>

      {/* Tasks */}
      <div>
        {section.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            checked={checkedTasks.has(task.id)}
            onToggleChecked={() => onToggleChecked(task.id)}
            onTaskClick={() => onTaskClick(task.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface TaskRowProps {
  task: Task
  checked: boolean
  onToggleChecked: () => void
  onTaskClick?: () => void
  disabled?: boolean
}

function TaskRow({ task, checked, onToggleChecked, onTaskClick, disabled }: TaskRowProps) {
  const hasPriorityDot = task.priority !== "none" && task.priority !== "low"

  return (
    <div 
      onClick={onTaskClick}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-[6px] px-2 py-2.5 transition-colors",
        !disabled && "hover:bg-background-tertiary"
      )}
    >
      {/* Drag handle (visible on hover) */}
      <button className={cn(
        "flex h-5 w-4 cursor-grab items-center justify-center text-foreground-secondary/0 transition-colors",
        !disabled && "group-hover:text-foreground-secondary/40 hover:text-foreground-secondary"
      )}>
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Priority dot */}
      <div className="flex w-2.5 items-center justify-center">
        {hasPriorityDot && (
          <div className={cn("h-2.5 w-2.5 rounded-full", priorityColors[task.priority])} />
        )}
      </div>

      {/* Checkbox */}
      <button
        onClick={onToggleChecked}
        disabled={disabled}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          checked || task.completed
            ? "border-accent-blue/50 bg-accent-blue/20 text-accent-blue"
            : "border-border bg-transparent hover:border-foreground-secondary",
          disabled && "cursor-default"
        )}
      >
        {(checked || task.completed) && (
          <Check className="h-3 w-3" strokeWidth={2.5} />
        )}
      </button>

      {/* Title */}
      <span className={cn(
        "flex-1 text-sm truncate",
        checked || task.completed
          ? "text-foreground-secondary/50 line-through"
          : "text-foreground"
      )}>
        {task.title}
      </span>

      {/* Project tag */}
      {task.project && (
        <span className={cn(
          "flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-xs",
          task.project.color === "bg-accent-blue" && "bg-accent-blue/15 text-accent-blue",
          task.project.color === "bg-accent-purple" && "bg-accent-purple/15 text-accent-purple",
          task.project.color === "bg-accent-green" && "bg-accent-green/15 text-accent-green"
        )}>
          {task.project.name}
        </span>
      )}

      {/* Due date */}
      {task.dueDate && !task.completed && (
        <span className="flex items-center gap-1 text-xs text-foreground-secondary">
          <Calendar className="h-3.5 w-3.5" />
          {task.dueDate}
        </span>
      )}
    </div>
  )
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
}

function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="py-1">
      <div className="px-2 py-1 text-xs uppercase tracking-wider text-foreground-secondary/60">
        {title}
      </div>
      {children}
    </div>
  )
}

interface FilterOptionProps {
  label: string
  selected?: boolean
  dot?: string
}

function FilterOption({ label, selected, dot }: FilterOptionProps) {
  return (
    <button className={cn(
      "flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm transition-colors",
      selected 
        ? "bg-background-tertiary text-foreground" 
        : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
    )}>
      {dot && <div className={cn("h-2 w-2 rounded-full", dot)} />}
      <span className="flex-1 text-left">{label}</span>
      {selected && <Check className="h-3.5 w-3.5 text-accent-blue" />}
    </button>
  )
}
