import { renderHook, waitFor, act } from '@testing-library/react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { createTestQueryClient } from '@/__tests__/utils/test-utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { server } from '@/__tests__/utils/mock-server'
import { http, HttpResponse } from 'msw'

const createWrapper = () => {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useWorkspace', () => {
  const mockWorkspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
    description: 'Test workspace description',
    color: '#2563eb',
    iconType: 'emoji' as const,
    iconValue: '🏢',
    ownerId: 'user-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  }

  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it('should fetch workspace data successfully', async () => {
    server.use(
      http.get('/api/workspaces/workspace-1', () => {
        return HttpResponse.json({ data: mockWorkspace })
      })
    )

    const { result } = renderHook(() => useWorkspace('workspace-1'), {
      wrapper: createWrapper(),
    })

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.workspace).toBeUndefined()

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.workspace).toEqual(mockWorkspace)
    expect(result.current.error).toBeNull()
  })

  it('should handle workspace fetch error', async () => {
    server.use(
      http.get('/api/workspaces/workspace-1', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      })
    )

    const { result } = renderHook(() => useWorkspace('workspace-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.workspace).toBeUndefined()
    expect(result.current.error).toBeTruthy()
  })

  it('should not fetch when workspaceId is null', () => {
    const { result } = renderHook(() => useWorkspace(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.workspace).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  it('should refetch workspace data', async () => {
    server.use(
      http.get('/api/workspaces/workspace-1', () => {
        return HttpResponse.json({ data: mockWorkspace })
      })
    )

    const { result } = renderHook(() => useWorkspace('workspace-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.workspace).toEqual(mockWorkspace)
    })

    // Trigger refetch
    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.workspace).toEqual(mockWorkspace)
  })

  it('should invalidate workspace cache', async () => {
    const { result } = renderHook(() => useWorkspace('workspace-1'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.invalidate()
    })

    // Should trigger a refetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })
})