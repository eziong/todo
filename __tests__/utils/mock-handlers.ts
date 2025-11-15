import { http, HttpResponse } from 'msw'
import { mockWorkspace, mockSection, mockTask, mockUser } from './test-utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const handlers = [
  // Auth endpoints
  http.get(`${API_BASE}/auth/user`, () => {
    return HttpResponse.json({ user: mockUser })
  }),

  // Workspace endpoints
  http.get(`${API_BASE}/workspaces`, () => {
    return HttpResponse.json({ data: [mockWorkspace] })
  }),

  http.get(`${API_BASE}/workspaces/:id`, ({ params }) => {
    return HttpResponse.json({ data: mockWorkspace })
  }),

  http.post(`${API_BASE}/workspaces`, async ({ request }) => {
    const body = await request.json()
    const newWorkspace = {
      ...mockWorkspace,
      id: 'new-workspace-id',
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json({ data: newWorkspace }, { status: 201 })
  }),

  http.put(`${API_BASE}/workspaces/:id`, async ({ params, request }) => {
    const body = await request.json()
    const updatedWorkspace = {
      ...mockWorkspace,
      id: params.id as string,
      ...body,
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json({ data: updatedWorkspace })
  }),

  http.delete(`${API_BASE}/workspaces/:id`, () => {
    return HttpResponse.json({ success: true })
  }),

  // Section endpoints
  http.get(`${API_BASE}/workspaces/:workspaceId/sections`, () => {
    return HttpResponse.json({ data: [mockSection] })
  }),

  http.post(`${API_BASE}/workspaces/:workspaceId/sections`, async ({ request, params }) => {
    const body = await request.json()
    const newSection = {
      ...mockSection,
      id: 'new-section-id',
      workspaceId: params.workspaceId as string,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json({ data: newSection }, { status: 201 })
  }),

  http.get(`${API_BASE}/sections/:id`, ({ params }) => {
    return HttpResponse.json({ data: { ...mockSection, id: params.id as string } })
  }),

  http.put(`${API_BASE}/sections/:id`, async ({ params, request }) => {
    const body = await request.json()
    const updatedSection = {
      ...mockSection,
      id: params.id as string,
      ...body,
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json({ data: updatedSection })
  }),

  http.delete(`${API_BASE}/sections/:id`, () => {
    return HttpResponse.json({ success: true })
  }),

  // Task endpoints
  http.get(`${API_BASE}/sections/:sectionId/tasks`, () => {
    return HttpResponse.json({ data: [mockTask] })
  }),

  http.post(`${API_BASE}/sections/:sectionId/tasks`, async ({ request, params }) => {
    const body = await request.json()
    const newTask = {
      ...mockTask,
      id: 'new-task-id',
      sectionId: params.sectionId as string,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json({ data: newTask }, { status: 201 })
  }),

  http.get(`${API_BASE}/tasks/:id`, ({ params }) => {
    return HttpResponse.json({ data: { ...mockTask, id: params.id as string } })
  }),

  http.put(`${API_BASE}/tasks/:id`, async ({ params, request }) => {
    const body = await request.json()
    const updatedTask = {
      ...mockTask,
      id: params.id as string,
      ...body,
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json({ data: updatedTask })
  }),

  http.delete(`${API_BASE}/tasks/:id`, () => {
    return HttpResponse.json({ success: true })
  }),

  // Task search endpoint
  http.get(`${API_BASE}/tasks/search`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    
    const filteredTasks = query 
      ? [mockTask].filter(task => 
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          task.description?.toLowerCase().includes(query.toLowerCase())
        )
      : [mockTask]
    
    return HttpResponse.json({ 
      data: filteredTasks,
      pagination: {
        page: 1,
        limit: 10,
        total: filteredTasks.length,
        totalPages: 1
      }
    })
  }),

  // Task dashboard endpoint
  http.get(`${API_BASE}/tasks/dashboard`, () => {
    return HttpResponse.json({
      data: {
        today: [mockTask],
        overdue: [],
        upcoming: [],
        recent: [mockTask],
      }
    })
  }),

  // Activity/Events endpoints
  http.get(`${API_BASE}/events/recent`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'event-1',
          entityType: 'task',
          entityId: 'test-task-id',
          eventType: 'created',
          userId: 'test-user-id',
          metadata: { taskTitle: 'Test Task' },
          createdAt: new Date().toISOString(),
        }
      ]
    })
  }),

  http.get(`${API_BASE}/events/timeline/:entityType/:entityId`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'timeline-event-1',
          entityType: 'task',
          entityId: 'test-task-id',
          eventType: 'status_changed',
          userId: 'test-user-id',
          metadata: { 
            oldStatus: 'todo',
            newStatus: 'in_progress'
          },
          createdAt: new Date().toISOString(),
        }
      ]
    })
  }),

  // Error scenarios for testing
  http.get(`${API_BASE}/workspaces/error`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }),

  http.get(`${API_BASE}/workspaces/unauthorized`, () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }),

  http.get(`${API_BASE}/workspaces/not-found`, () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  }),
]