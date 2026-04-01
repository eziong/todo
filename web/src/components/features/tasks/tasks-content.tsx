"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  Filter,
  ArrowUpDown,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TaskDetailPanel } from "@/components/features/tasks/task-detail-panel"
import { TaskRow } from "./task-row"
import { FilterSection, FilterOption } from "./task-filter"
import {
  groupTodosByDate,
  filterTodos,
  sortTodos,
  getActiveFilterCount,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  type DateGroup,
  type TaskFilterState,
  type TaskSortState,
  type SortField,
  type DueFilter,
} from "./task-utils"
import { useDeleteTodo } from "@/hooks/useTodos"
import { useAppStore } from "@/stores/app-store"
import type { TodoId } from "@/types/branded"
import type { TodoWithProject, CreateTodoInput, UpdateTodoInput, TodoPriority, TodoStatus } from "@/types/domain"

// --- Sort options ---

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "dueDate", label: "Due Date" },
  { field: "priority", label: "Priority" },
  { field: "createdAt", label: "Created" },
  { field: "title", label: "Alphabetical" },
]

// --- Props ---

interface TasksContentProps {
  todos: TodoWithProject[]
  onCreateTodo: (input: CreateTodoInput) => void
  onUpdateTodo: (id: TodoId, input: UpdateTodoInput) => void
  isCreating: boolean
}

export function TasksContent({
  todos,
  onCreateTodo,
  onUpdateTodo,
  isCreating,
}: TasksContentProps) {
  const searchParams = useSearchParams()

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<TaskFilterState>(() => {
    const priority = searchParams.get("priority")
    const due = searchParams.get("due")
    return {
      ...DEFAULT_FILTERS,
      ...(priority && ["urgent", "high", "medium", "low", "none"].includes(priority)
        ? { priority: priority as TodoPriority }
        : {}),
      ...(due && ["overdue", "today", "this-week", "no-date"].includes(due)
        ? { due: due as DueFilter }
        : {}),
    }
  })
  const [sort, setSort] = useState<TaskSortState>(DEFAULT_SORT)

  const [inputValue, setInputValue] = useState("")
  const [noDateExpanded, setNoDateExpanded] = useState(true)
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<TodoId | null>(null)
  const [deletingTodoId, setDeletingTodoId] = useState<TodoId | null>(null)
  const quickAddInputRef = useRef<HTMLInputElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  const quickAddFocusRequested = useAppStore((s) => s.quickAddFocusRequested)
  const clearQuickAddFocus = useAppStore((s) => s.clearQuickAddFocus)

  useEffect(() => {
    if (quickAddFocusRequested) {
      quickAddInputRef.current?.focus()
      clearQuickAddFocus()
    }
  }, [quickAddFocusRequested, clearQuickAddFocus])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
      if (sortOpen && sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [filterOpen, sortOpen])

  const deleteTodo = useDeleteTodo()

  // Apply filter → sort → group pipeline
  const filtered = filterTodos(todos, filters)
  const sorted = sortTodos(filtered, sort)
  const { sections, noDateTodos, completedTodos } = groupTodosByDate(sorted)
  const activeFilterCount = getActiveFilterCount(filters)

  const handleQuickAdd = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    onCreateTodo({ title: trimmed })
    setInputValue("")
  }

  const handleToggleStatus = (id: TodoId, currentStatus: string) => {
    onUpdateTodo(id, {
      status: currentStatus === "completed" ? "todo" : "completed",
    })
  }

  const handleConfirmDelete = () => {
    if (!deletingTodoId) return
    deleteTodo.mutate(deletingTodoId, {
      onSettled: () => setDeletingTodoId(null),
    })
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const handleSortChange = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }))
    setSortOpen(false)
  }

  const deletingTodo = deletingTodoId
    ? todos.find((t) => t.id === deletingTodoId)
    : null

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">All Tasks</h1>
          <div className="flex items-center gap-2">
            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="flex h-8 items-center gap-1.5 rounded-[6px] px-2 text-xs text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}

            {/* Filter dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-[6px] border border-border px-3 text-sm transition-colors",
                  filterOpen || activeFilterCount > 0
                    ? "bg-background-tertiary text-foreground"
                    : "bg-background-secondary text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                )}
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-blue px-1 text-xs font-medium text-white">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={cn("h-4 w-4 transition-transform", filterOpen && "rotate-180")} />
              </button>

              {filterOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-[8px] border border-border bg-background-secondary p-1 shadow-xl">
                  <FilterSection title="Priority">
                    <FilterOption label="All" selected={filters.priority === "all"} onClick={() => setFilters((f) => ({ ...f, priority: "all" }))} />
                    <FilterOption label="Urgent" dot="bg-accent-red" selected={filters.priority === "urgent"} onClick={() => setFilters((f) => ({ ...f, priority: "urgent" }))} />
                    <FilterOption label="High" dot="bg-accent-orange" selected={filters.priority === "high"} onClick={() => setFilters((f) => ({ ...f, priority: "high" }))} />
                    <FilterOption label="Medium" dot="bg-accent-yellow" selected={filters.priority === "medium"} onClick={() => setFilters((f) => ({ ...f, priority: "medium" }))} />
                    <FilterOption label="Low" dot="bg-accent-gray" selected={filters.priority === "low"} onClick={() => setFilters((f) => ({ ...f, priority: "low" }))} />
                  </FilterSection>

                  <div className="my-1 border-t border-border" />

                  <FilterSection title="Status">
                    <FilterOption label="All" selected={filters.status === "all"} onClick={() => setFilters((f) => ({ ...f, status: "all" }))} />
                    <FilterOption label="Todo" selected={filters.status === "todo"} onClick={() => setFilters((f) => ({ ...f, status: "todo" as TodoStatus }))} />
                    <FilterOption label="In Progress" selected={filters.status === "in_progress"} onClick={() => setFilters((f) => ({ ...f, status: "in_progress" as TodoStatus }))} />
                    <FilterOption label="Completed" selected={filters.status === "completed"} onClick={() => setFilters((f) => ({ ...f, status: "completed" as TodoStatus }))} />
                  </FilterSection>

                  <div className="my-1 border-t border-border" />

                  <FilterSection title="Due">
                    <FilterOption label="All" selected={filters.due === "all"} onClick={() => setFilters((f) => ({ ...f, due: "all" }))} />
                    <FilterOption label="Overdue" selected={filters.due === "overdue"} onClick={() => setFilters((f) => ({ ...f, due: "overdue" }))} />
                    <FilterOption label="Today" selected={filters.due === "today"} onClick={() => setFilters((f) => ({ ...f, due: "today" }))} />
                    <FilterOption label="This Week" selected={filters.due === "this-week"} onClick={() => setFilters((f) => ({ ...f, due: "this-week" }))} />
                    <FilterOption label="No Date" selected={filters.due === "no-date"} onClick={() => setFilters((f) => ({ ...f, due: "no-date" }))} />
                  </FilterSection>
                </div>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false) }}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-[6px] border border-border px-3 text-sm transition-colors",
                  sortOpen
                    ? "bg-background-tertiary text-foreground"
                    : "bg-background-secondary text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                )}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", sortOpen && "rotate-180")} />
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-[8px] border border-border bg-background-secondary p-1 shadow-xl">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.field}
                      onClick={() => handleSortChange(option.field)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[4px] px-2 py-1.5 text-sm transition-colors",
                        sort.field === option.field
                          ? "bg-background-tertiary text-foreground"
                          : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                      )}
                    >
                      <span>{option.label}</span>
                      {sort.field === option.field && (
                        <span className="text-xs text-accent-blue">
                          {sort.direction === "asc" ? "\u2191" : "\u2193"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick add input */}
        <div className="relative">
          <input
            ref={quickAddInputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) handleQuickAdd()
            }}
            placeholder="+ Add task..."
            disabled={isCreating}
            className="w-full rounded-[8px] border border-border bg-background-secondary px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/60 transition-colors focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue disabled:opacity-50"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-secondary/50 font-mono">
            Cmd+N
          </span>
        </div>

        {/* Task sections */}
        <div className="space-y-0">
          {sections.map((section) => (
            <TaskSectionGroup
              key={section.id}
              section={section}
              onToggleStatus={handleToggleStatus}
              onTaskClick={setSelectedTaskId}
              onDeleteTask={setDeletingTodoId}
            />
          ))}

          {/* No Date section */}
          {noDateTodos.length > 0 && (
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
                <span>No Date</span>
                <span className="text-foreground-secondary/50">({noDateTodos.length})</span>
              </button>
              {noDateExpanded && (
                <div>
                  {noDateTodos.map((todo) => (
                    <TaskRow
                      key={todo.id}
                      todo={todo}
                      onToggleStatus={() => handleToggleStatus(todo.id, todo.status)}
                      onTaskClick={() => setSelectedTaskId(todo.id)}
                      onDelete={() => setDeletingTodoId(todo.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completed section */}
          {completedTodos.length > 0 && (
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
                <span className="text-foreground-secondary/50">({completedTodos.length})</span>
              </button>

              {completedExpanded && (
                <div className="mt-1">
                  {completedTodos.map((todo) => (
                    <TaskRow
                      key={todo.id}
                      todo={todo}
                      completed
                      onToggleStatus={() => handleToggleStatus(todo.id, todo.status)}
                      onDelete={() => setDeletingTodoId(todo.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state when all filtered out */}
          {sections.length === 0 && noDateTodos.length === 0 && completedTodos.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-foreground-secondary">No tasks match the current filters.</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="mt-2 text-sm text-accent-blue transition-colors hover:text-accent-blue/80"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={Boolean(deletingTodoId)}
        onOpenChange={(open) => { if (!open) setDeletingTodoId(null) }}
      >
        <AlertDialogContent className="border-border bg-background-secondary">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground-secondary">
              Are you sure you want to delete{deletingTodo ? ` "${deletingTodo.title}"` : " this task"}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-accent-red text-white hover:bg-accent-red/90"
            >
              {deleteTodo.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// --- Sub-components ---

interface TaskSectionGroupProps {
  section: DateGroup
  onToggleStatus: (id: TodoId, currentStatus: string) => void
  onTaskClick: (id: TodoId) => void
  onDeleteTask: (id: TodoId) => void
}

function TaskSectionGroup({ section, onToggleStatus, onTaskClick, onDeleteTask }: TaskSectionGroupProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border-t border-border pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 py-2 text-xs uppercase tracking-wider text-foreground-secondary transition-colors hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <span
          className={cn(
            section.id === "overdue" && "text-accent-red"
          )}
        >
          {section.title}
        </span>
        <span className="text-foreground-secondary/50">({section.todos.length})</span>
      </button>
      {expanded && (
        <div>
          {section.todos.map((todo) => (
            <TaskRow
              key={todo.id}
              todo={todo}
              onToggleStatus={() => onToggleStatus(todo.id, todo.status)}
              onTaskClick={() => onTaskClick(todo.id)}
              onDelete={() => onDeleteTask(todo.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
