import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useTodos } from './useTodos'
import { useInbox } from './useInbox'
import { useProjects } from './useProjects'
import { fetchRecentActivity } from '@/services/activity'
import type { TodoWithProject, InboxItem, ProjectWithStats, ActivityLog } from '@/types/domain'

// --- Date Helpers ---

function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getTomorrowStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function getEndOfWeekStr(): string {
  const d = new Date()
  const dayOfWeek = d.getDay()
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  d.setDate(d.getDate() + daysUntilSunday)
  return d.toISOString().split('T')[0]
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// --- Derived Data ---

function deriveTodaysTasks(todos: TodoWithProject[]): TodoWithProject[] {
  const today = getTodayStr()
  return todos.filter(
    (t) =>
      t.status !== 'completed' &&
      (t.dueDate?.startsWith(today) || t.status === 'in_progress'),
  )
}

interface UpcomingTasks {
  tomorrow: TodoWithProject[]
  thisWeek: TodoWithProject[]
}

function deriveUpcomingTasks(todos: TodoWithProject[]): UpcomingTasks {
  const today = getTodayStr()
  const tomorrow = getTomorrowStr()
  const endOfWeek = getEndOfWeekStr()

  const incomplete = todos.filter((t) => t.status !== 'completed' && t.dueDate)

  return {
    tomorrow: incomplete.filter((t) => t.dueDate!.startsWith(tomorrow)),
    thisWeek: incomplete.filter(
      (t) => t.dueDate! > tomorrow && t.dueDate! <= endOfWeek,
    ),
  }
}

// --- Hook ---

export interface DashboardData {
  greeting: string
  dateStr: string
  todaysTasks: TodoWithProject[]
  inboxItems: InboxItem[]
  inboxUnprocessedCount: number
  upcoming: UpcomingTasks
  projects: ProjectWithStats[]
  recentActivity: ActivityLog[]
  isLoading: boolean
  error: Error | null
}

export function useDashboard(): DashboardData {
  const todosQuery = useTodos()
  const inboxQuery = useInbox()
  const projectsQuery = useProjects(false)
  const activityQuery = useQuery({
    queryKey: queryKeys.activity.lists(),
    queryFn: () => fetchRecentActivity(10),
  })

  const allTodos = todosQuery.data ?? []
  const allInboxItems = inboxQuery.data ?? []

  const unprocessedInbox = allInboxItems.filter((item) => !item.processed)

  return {
    greeting: getGreeting(),
    dateStr: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }),
    todaysTasks: deriveTodaysTasks(allTodos),
    inboxItems: unprocessedInbox,
    inboxUnprocessedCount: unprocessedInbox.length,
    upcoming: deriveUpcomingTasks(allTodos),
    projects: projectsQuery.data ?? [],
    recentActivity: activityQuery.data ?? [],
    isLoading:
      todosQuery.isLoading ||
      inboxQuery.isLoading ||
      projectsQuery.isLoading ||
      activityQuery.isLoading,
    error: todosQuery.error || inboxQuery.error || projectsQuery.error || activityQuery.error,
  }
}
