import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import { TodoId, ProjectId, UserId } from '@/types/branded'
import type { Todo, TodoWithProject, CreateTodoInput, UpdateTodoInput, TodoFilters } from '@/types/domain'

// --- Server Response Branding ---

interface ServerTodoProject {
  id: string
  name: string
  color: string | null
}

interface ServerTodo {
  id: string
  userId: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  projectId: string | null
  parentId: string | null
  position: number | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ServerTodoWithProject extends ServerTodo {
  project: ServerTodoProject | null
}

function brandTodo(raw: ServerTodo): Todo {
  return {
    ...raw,
    id: TodoId(raw.id),
    userId: UserId(raw.userId),
    status: raw.status as Todo['status'],
    priority: raw.priority as Todo['priority'],
    projectId: raw.projectId ? ProjectId(raw.projectId) : null,
    parentId: raw.parentId ? TodoId(raw.parentId) : null,
  }
}

function brandTodoWithProject(raw: ServerTodoWithProject): TodoWithProject {
  return {
    ...brandTodo(raw),
    project: raw.project
      ? {
          id: ProjectId(raw.project.id),
          name: raw.project.name,
          color: raw.project.color,
        }
      : null,
  }
}

// --- Queries ---

export async function fetchTodos(filters?: TodoFilters): Promise<TodoWithProject[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.priority) params.set('priority', filters.priority)
  if (filters?.projectId) params.set('projectId', filters.projectId)
  if (filters?.search) params.set('search', filters.search)

  const query = params.toString()
  const path = query ? `/api/todos?${query}` : '/api/todos'
  const data = await apiGet<ServerTodoWithProject[]>(path)
  return data.map(brandTodoWithProject)
}

export async function fetchTodo(id: TodoId): Promise<TodoWithProject> {
  const data = await apiGet<ServerTodoWithProject>(`/api/todos/${id}`)
  return brandTodoWithProject(data)
}

export async function fetchSubtasks(parentId: TodoId): Promise<Todo[]> {
  const data = await apiGet<ServerTodo[]>(`/api/todos/${parentId}/subtasks`)
  return data.map(brandTodo)
}

// --- Mutations ---

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const data = await apiPost<ServerTodoWithProject>('/api/todos', input)
  return brandTodo(data)
}

export async function updateTodo(id: TodoId, input: UpdateTodoInput): Promise<Todo> {
  const data = await apiPatch<ServerTodoWithProject>(`/api/todos/${id}`, input)
  return brandTodo(data)
}

export async function deleteTodo(id: TodoId): Promise<void> {
  await apiDelete(`/api/todos/${id}`)
}
