import type { TodoWithProject, TodoPriority, TodoStatus } from "@/types/domain"

// --- Filter & Sort types ---

export type DueFilter = 'all' | 'overdue' | 'today' | 'this-week' | 'no-date'

export interface TaskFilterState {
  priority: TodoPriority | 'all'
  status: TodoStatus | 'all'
  due: DueFilter
}

export type SortField = 'dueDate' | 'priority' | 'createdAt' | 'title'
export type SortDirection = 'asc' | 'desc'

export interface TaskSortState {
  field: SortField
  direction: SortDirection
}

export const DEFAULT_FILTERS: TaskFilterState = {
  priority: 'all',
  status: 'all',
  due: 'all',
}

export const DEFAULT_SORT: TaskSortState = {
  field: 'dueDate',
  direction: 'asc',
}

const PRIORITY_ORDER: Record<TodoPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
}

export function filterTodos(todos: TodoWithProject[], filters: TaskFilterState): TodoWithProject[] {
  return todos.filter((todo) => {
    // Priority filter
    if (filters.priority !== 'all' && todo.priority !== filters.priority) return false

    // Status filter
    if (filters.status !== 'all' && todo.status !== filters.status) return false

    // Due filter
    if (filters.due !== 'all') {
      const now = new Date()
      const today = startOfDay(now)
      const endOfWeek = new Date(today)
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()))

      switch (filters.due) {
        case 'overdue':
          if (!todo.dueDate || startOfDay(new Date(todo.dueDate)) >= today) return false
          break
        case 'today':
          if (!todo.dueDate || startOfDay(new Date(todo.dueDate)).getTime() !== today.getTime()) return false
          break
        case 'this-week':
          if (!todo.dueDate) return false
          const due = startOfDay(new Date(todo.dueDate))
          if (due < today || due >= endOfWeek) return false
          break
        case 'no-date':
          if (todo.dueDate) return false
          break
      }
    }

    return true
  })
}

export function sortTodos(todos: TodoWithProject[], sort: TaskSortState): TodoWithProject[] {
  const sorted = [...todos]
  sorted.sort((a, b) => {
    let cmp = 0
    switch (sort.field) {
      case 'dueDate': {
        // Nulls last
        if (!a.dueDate && !b.dueDate) cmp = 0
        else if (!a.dueDate) cmp = 1
        else if (!b.dueDate) cmp = -1
        else cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        break
      }
      case 'priority':
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        break
      case 'createdAt':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'title':
        cmp = a.title.localeCompare(b.title)
        break
    }
    return sort.direction === 'asc' ? cmp : -cmp
  })
  return sorted
}

export function getActiveFilterCount(filters: TaskFilterState): number {
  let count = 0
  if (filters.priority !== 'all') count++
  if (filters.status !== 'all') count++
  if (filters.due !== 'all') count++
  return count
}

// --- Date grouping ---

export interface DateGroup {
  id: string
  title: string
  todos: TodoWithProject[]
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function groupTodosByDate(todos: TodoWithProject[]): {
  sections: DateGroup[]
  noDateTodos: TodoWithProject[]
  completedTodos: TodoWithProject[]
} {
  const now = new Date()
  const today = startOfDay(now)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
  const endOfWeek = new Date(today)
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()))

  const groups: Record<string, TodoWithProject[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  }
  const noDateTodos: TodoWithProject[] = []
  const completedTodos: TodoWithProject[] = []

  for (const todo of todos) {
    if (todo.status === "completed") {
      completedTodos.push(todo)
      continue
    }

    if (!todo.dueDate) {
      noDateTodos.push(todo)
      continue
    }

    const due = startOfDay(new Date(todo.dueDate))

    if (due < today) {
      groups.overdue.push(todo)
    } else if (due.getTime() === today.getTime()) {
      groups.today.push(todo)
    } else if (due.getTime() === tomorrow.getTime()) {
      groups.tomorrow.push(todo)
    } else if (due < endOfWeek) {
      groups.thisWeek.push(todo)
    } else {
      groups.later.push(todo)
    }
  }

  const sections: DateGroup[] = []
  if (groups.overdue.length > 0) sections.push({ id: "overdue", title: "Overdue", todos: groups.overdue })
  if (groups.today.length > 0) sections.push({ id: "today", title: "Today", todos: groups.today })
  if (groups.tomorrow.length > 0) sections.push({ id: "tomorrow", title: "Tomorrow", todos: groups.tomorrow })
  if (groups.thisWeek.length > 0) sections.push({ id: "this-week", title: "This Week", todos: groups.thisWeek })
  if (groups.later.length > 0) sections.push({ id: "later", title: "Later", todos: groups.later })

  return { sections, noDateTodos, completedTodos }
}

// --- Color utilities ---

export const priorityColors: Record<TodoPriority, string> = {
  urgent: "bg-accent-red",
  high: "bg-accent-orange",
  medium: "bg-accent-yellow",
  low: "bg-accent-gray",
  none: "",
}

export function getProjectColorClasses(color: string | null): string {
  switch (color) {
    case "blue": return "bg-accent-blue/15 text-accent-blue"
    case "purple": return "bg-accent-purple/15 text-accent-purple"
    case "green": return "bg-accent-green/15 text-accent-green"
    case "yellow": return "bg-accent-yellow/15 text-accent-yellow"
    case "red": return "bg-accent-red/15 text-accent-red"
    case "orange": return "bg-accent-orange/15 text-accent-orange"
    case "pink": return "bg-accent-pink/15 text-accent-pink"
    default: return "bg-accent-gray/15 text-accent-gray"
  }
}

export function formatDueDate(dueDate: string): string {
  const due = startOfDay(new Date(dueDate))
  const today = startOfDay(new Date())
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"

  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function getProjectDotColor(color: string | null): string {
  switch (color) {
    case "blue": return "bg-accent-blue"
    case "purple": return "bg-accent-purple"
    case "green": return "bg-accent-green"
    case "yellow": return "bg-accent-yellow"
    case "red": return "bg-accent-red"
    case "orange": return "bg-accent-orange"
    case "pink": return "bg-accent-pink"
    default: return "bg-accent-gray"
  }
}
