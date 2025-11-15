/**
 * Integration tests for task API endpoints
 */

import { createMocks } from 'node-mocks-http'
import taskByIdHandler from '@/app/api/tasks/[id]/route'
import taskSearchHandler from '@/app/api/tasks/search/route'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  auth: {
    getUser: jest.fn(),
  },
  rpc: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('/api/tasks/[id]', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' }
  const mockTask = {
    id: 'task-1',
    sectionId: 'section-1',
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo',
    priority: 'medium',
    assignedToUserId: null,
    dueDate: null,
    position: 0,
    isArchived: false,
    tags: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: 'user-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  describe('GET /api/tasks/[id]', () => {
    it('should return task by id', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockTask,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'task-1' },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.data).toEqual(mockTask)
    })

    it('should return 404 for non-existent task', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'non-existent' },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(404)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthenticated'),
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'task-1' },
      })

      await taskByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })
  })

  describe('PUT /api/tasks/[id]', () => {
    const updateData = {
      title: 'Updated Task',
      description: 'Updated description',
      status: 'in_progress',
      priority: 'high',
    }

    it('should update task', async () => {
      const updatedTask = {
        ...mockTask,
        ...updateData,
        updatedAt: '2023-01-02T00:00:00Z',
      }

      // Mock permission check
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockTask,
        error: null,
      })

      // Mock update
      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        data: updatedTask,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'task-1' },
        body: updateData,
        headers: {
          authorization: 'Bearer mock-token',
          'content-type': 'application/json',
        },
      })

      await taskByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.data).toEqual(updatedTask)
    })

    it('should validate update data', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'task-1' },
        body: { status: 'invalid_status' },
        headers: {
          authorization: 'Bearer mock-token',
          'content-type': 'application/json',
        },
      })

      await taskByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle concurrent updates with optimistic locking', async () => {
      // Simulate outdated version
      const outdatedTask = { ...mockTask, updatedAt: '2023-01-01T00:00:00Z' }
      
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { ...mockTask, updatedAt: '2023-01-01T12:00:00Z' }, // Updated version
        error: null,
      })

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'task-1' },
        body: { ...updateData, lastUpdated: outdatedTask.updatedAt },
        headers: {
          authorization: 'Bearer mock-token',
          'content-type': 'application/json',
        },
      })

      await taskByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(409) // Conflict
    })
  })

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete task', async () => {
      // Mock permission check
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockTask,
        error: null,
      })

      // Mock delete (soft delete)
      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        data: { ...mockTask, isArchived: true },
        error: null,
      })

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'task-1' },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle hard delete with force parameter', async () => {
      // Mock permission check
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockTask,
        error: null,
      })

      // Mock hard delete
      mockSupabaseClient.from().delete().eq().mockResolvedValue({
        data: null,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'task-1', force: 'true' },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })
})

describe('/api/tasks/search', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' }
  const mockSearchResults = [
    {
      id: 'task-1',
      title: 'Test Task One',
      description: 'First test task',
      status: 'todo',
      priority: 'medium',
      workspaceName: 'Test Workspace',
      sectionName: 'Test Section',
      relevanceScore: 0.9,
      contextSnippet: 'Test task context',
      highlightMatches: [
        {
          field: 'title',
          value: 'Test Task One',
          matches: [{ start: 0, end: 4 }]
        }
      ]
    },
    {
      id: 'task-2',
      title: 'Another Test Task',
      description: 'Second test task',
      status: 'in_progress',
      priority: 'high',
      workspaceName: 'Test Workspace',
      sectionName: 'Another Section',
      relevanceScore: 0.7,
      contextSnippet: 'Another task context',
      highlightMatches: [
        {
          field: 'title',
          value: 'Another Test Task',
          matches: [{ start: 8, end: 12 }]
        }
      ]
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  describe('GET /api/tasks/search', () => {
    it('should search tasks with query', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockSearchResults,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          q: 'test',
          limit: '10',
          offset: '0'
        },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskSearchHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.data).toEqual(mockSearchResults)
      expect(data.pagination.total).toBe(mockSearchResults.length)
    })

    it('should filter tasks by status', async () => {
      const filteredResults = mockSearchResults.filter(task => task.status === 'todo')
      
      mockSupabaseClient.rpc.mockResolvedValue({
        data: filteredResults,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          q: 'test',
          status: 'todo',
          limit: '10',
          offset: '0'
        },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskSearchHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.data).toEqual(filteredResults)
    })

    it('should filter tasks by priority', async () => {
      const filteredResults = mockSearchResults.filter(task => task.priority === 'high')
      
      mockSupabaseClient.rpc.mockResolvedValue({
        data: filteredResults,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          q: 'test',
          priority: 'high',
          limit: '10',
          offset: '0'
        },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskSearchHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.data).toEqual(filteredResults)
    })

    it('should search with workspace filter', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockSearchResults,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          q: 'test',
          workspaceId: 'workspace-1',
          limit: '10',
          offset: '0'
        },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskSearchHandler(req, res)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'search_tasks_enhanced',
        expect.objectContaining({
          search_query: 'test',
          workspace_id: 'workspace-1',
        })
      )
    })

    it('should handle search with date range', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockSearchResults,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          q: 'test',
          dueDateFrom: '2023-01-01',
          dueDateTo: '2023-12-31',
          limit: '10',
          offset: '0'
        },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskSearchHandler(req, res)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'search_tasks_enhanced',
        expect.objectContaining({
          search_query: 'test',
          due_date_from: '2023-01-01',
          due_date_to: '2023-12-31',
        })
      )
    })

    it('should return empty results for no matches', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          q: 'nonexistent',
          limit: '10',
          offset: '0'
        },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskSearchHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.data).toEqual([])
      expect(data.pagination.total).toBe(0)
    })

    it('should handle search errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Search function error' },
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          q: 'test',
          limit: '10',
          offset: '0'
        },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskSearchHandler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })

    it('should validate search parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          limit: 'invalid',
          offset: 'invalid'
        },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskSearchHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should limit search results to maximum allowed', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          q: 'test',
          limit: '1000', // Exceeding maximum
          offset: '0'
        },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await taskSearchHandler(req, res)

      // Should clamp to maximum allowed limit
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'search_tasks_enhanced',
        expect.objectContaining({
          search_limit: 100, // Maximum allowed
        })
      )
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthenticated'),
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { q: 'test' },
      })

      await taskSearchHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })
  })
})