/**
 * Integration tests for workspace API endpoints
 */

import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/workspaces/route'
import workspaceByIdHandler from '@/app/api/workspaces/[id]/route'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  auth: {
    getUser: jest.fn(),
  },
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('/api/workspaces', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' }
  const mockWorkspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
    description: 'Test description',
    color: '#2563eb',
    iconType: 'emoji',
    iconValue: '🏢',
    ownerId: 'user-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  describe('GET /api/workspaces', () => {
    it('should return workspaces for authenticated user', async () => {
      mockSupabaseClient.from().select().mockResolvedValue({
        data: [mockWorkspace],
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.data).toEqual([mockWorkspace])
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthenticated'),
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('POST /api/workspaces', () => {
    const newWorkspaceData = {
      name: 'New Workspace',
      description: 'New workspace description',
      color: '#10b981',
      iconType: 'emoji',
      iconValue: '📁',
    }

    it('should create a new workspace', async () => {
      const createdWorkspace = {
        ...newWorkspaceData,
        id: 'workspace-2',
        ownerId: mockUser.id,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      }

      mockSupabaseClient.from().insert().single.mockResolvedValue({
        data: createdWorkspace,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: newWorkspaceData,
        headers: {
          authorization: 'Bearer mock-token',
          'content-type': 'application/json',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const data = JSON.parse(res._getData())
      expect(data.data).toEqual(createdWorkspace)
    })

    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}, // Missing required fields
        headers: {
          authorization: 'Bearer mock-token',
          'content-type': 'application/json',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle database insertion errors', async () => {
      mockSupabaseClient.from().insert().single.mockResolvedValue({
        data: null,
        error: { message: 'Insertion failed' },
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: newWorkspaceData,
        headers: {
          authorization: 'Bearer mock-token',
          'content-type': 'application/json',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })
})

describe('/api/workspaces/[id]', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' }
  const mockWorkspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
    description: 'Test description',
    color: '#2563eb',
    iconType: 'emoji',
    iconValue: '🏢',
    ownerId: 'user-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  describe('GET /api/workspaces/[id]', () => {
    it('should return workspace by id', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockWorkspace,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'workspace-1' },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await workspaceByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.data).toEqual(mockWorkspace)
    })

    it('should return 404 for non-existent workspace', async () => {
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

      await workspaceByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(404)
    })

    it('should return 403 for unauthorized access', async () => {
      const otherUserWorkspace = { ...mockWorkspace, ownerId: 'other-user' }
      
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: otherUserWorkspace,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'workspace-1' },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await workspaceByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
    })
  })

  describe('PUT /api/workspaces/[id]', () => {
    const updateData = {
      name: 'Updated Workspace',
      description: 'Updated description',
    }

    it('should update workspace', async () => {
      const updatedWorkspace = {
        ...mockWorkspace,
        ...updateData,
        updatedAt: '2023-01-02T00:00:00Z',
      }

      // Mock permission check
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockWorkspace,
        error: null,
      })

      // Mock update
      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        data: updatedWorkspace,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'workspace-1' },
        body: updateData,
        headers: {
          authorization: 'Bearer mock-token',
          'content-type': 'application/json',
        },
      })

      await workspaceByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.data).toEqual(updatedWorkspace)
    })

    it('should validate update data', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'workspace-1' },
        body: { invalidField: 'value' },
        headers: {
          authorization: 'Bearer mock-token',
          'content-type': 'application/json',
        },
      })

      await workspaceByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('DELETE /api/workspaces/[id]', () => {
    it('should delete workspace', async () => {
      // Mock permission check
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockWorkspace,
        error: null,
      })

      // Mock delete
      mockSupabaseClient.from().delete().eq().mockResolvedValue({
        data: null,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'workspace-1' },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await workspaceByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should return 403 for unauthorized delete', async () => {
      const otherUserWorkspace = { ...mockWorkspace, ownerId: 'other-user' }
      
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: otherUserWorkspace,
        error: null,
      })

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'workspace-1' },
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      await workspaceByIdHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
    })
  })
})