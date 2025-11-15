import { renderHook, act, waitFor } from '@testing-library/react'
import { useSpotlightSearch } from '@/components/SpotlightSearch/useSpotlightSearch'
import { createTestQueryClient } from '@/__tests__/utils/test-utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

jest.mock('@/components/Auth')
jest.mock('@/hooks/useTaskSearch')
jest.mock('@/hooks/useDebounce')

import * as Auth from '@/components/Auth'
import * as TaskSearch from '@/hooks/useTaskSearch'
import * as Debounce from '@/hooks/useDebounce'

const mockUseAuth = Auth.useAuth as jest.MockedFunction<typeof Auth.useAuth>
const mockUseTaskSearch = TaskSearch.useTaskSearch as jest.MockedFunction<typeof TaskSearch.useTaskSearch>
const mockUseDebounce = Debounce.useDebounce as jest.MockedFunction<typeof Debounce.useDebounce>

const createWrapper = () => {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useSpotlightSearch', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: null,
    google_id: null,
    timezone: 'UTC',
    preferences: {
      theme: 'auto',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        task_assignments: true,
        due_date_reminders: true,
      },
      ui: {
        compact_mode: false,
        show_completed_tasks: true,
        default_view: 'list',
      },
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    last_active_at: '2023-01-01T00:00:00Z',
  }

  const mockSearchResults = [
    {
      id: 'task-1',
      title: 'Test Task',
      description: 'Test task description',
      type: 'task' as const,
      icon: '📋',
      priority: 'medium' as const,
      status: 'todo' as const,
      workspaceName: 'Test Workspace',
      sectionName: 'Test Section',
      relevanceScore: 0.9,
      contextSnippet: 'Test task context',
      highlightMatches: [
        {
          field: 'title',
          value: 'Test Task',
          matches: [{ start: 0, end: 4 }]
        }
      ]
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useAuth
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })

    // Mock useTaskSearch
    mockUseTaskSearch.mockReturnValue({
      searchTasks: jest.fn().mockResolvedValue({
        data: mockSearchResults,
        suggestions: [],
        totalResults: 1,
        searchTime: 50,
      }),
      clearResults: jest.fn(),
      isLoading: false,
      error: null,
      results: mockSearchResults,
      suggestions: [],
      totalResults: 1,
      searchTime: 50,
    })

    // Mock useDebounce
    mockUseDebounce.mockImplementation((value) => value)
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSpotlightSearch(), {
      wrapper: createWrapper(),
    })

    expect(result.current.state.isOpen).toBe(false)
    expect(result.current.state.query).toBe('')
    expect(result.current.state.selectedCategory).toBe('all')
    expect(result.current.state.selectedIndex).toBe(0)
    expect(result.current.state.isLoading).toBe(false)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  describe('modal controls', () => {
    it('should open search modal', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.openSearch()
      })

      expect(result.current.state.isOpen).toBe(true)
    })

    it('should close search modal', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      // First open it
      act(() => {
        result.current.openSearch()
      })

      expect(result.current.state.isOpen).toBe(true)

      // Then close it
      act(() => {
        result.current.closeSearch()
      })

      expect(result.current.state.isOpen).toBe(false)
    })

    it('should toggle search modal', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      // Initially closed
      expect(result.current.state.isOpen).toBe(false)

      // Toggle to open
      act(() => {
        result.current.toggleSearch()
      })

      expect(result.current.state.isOpen).toBe(true)

      // Toggle to close
      act(() => {
        result.current.toggleSearch()
      })

      expect(result.current.state.isOpen).toBe(false)
    })
  })

  describe('search functionality', () => {
    it('should handle query changes', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.handleQueryChange('test query')
      })

      expect(result.current.state.query).toBe('test query')
    })

    it('should clear query', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      // Set a query first
      act(() => {
        result.current.handleQueryChange('test query')
      })

      expect(result.current.state.query).toBe('test query')

      // Clear it
      act(() => {
        result.current.clearQuery()
      })

      expect(result.current.state.query).toBe('')
      expect(result.current.state.results).toEqual([])
    })

    it('should perform search', async () => {
      const mockSearchTasks = jest.fn().mockResolvedValue({
        data: mockSearchResults,
        suggestions: [],
        totalResults: 1,
        searchTime: 50,
      })

      mockUseTaskSearch.mockReturnValue({
        searchTasks: mockSearchTasks,
        clearResults: jest.fn(),
        isLoading: false,
        error: null,
        results: mockSearchResults,
        suggestions: [],
        totalResults: 1,
        searchTime: 50,
      })

      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.performSearch('test')
      })

      expect(mockSearchTasks).toHaveBeenCalledWith({
        query: 'test',
        filters: {},
        pagination: { limit: 50, offset: 0 },
      })
      expect(result.current.state.results).toEqual(mockSearchResults)
    })

    it('should handle search error', async () => {
      const searchError = new Error('Search failed')
      const mockSearchTasks = jest.fn().mockRejectedValue(searchError)

      mockUseTaskSearch.mockReturnValue({
        searchTasks: mockSearchTasks,
        clearResults: jest.fn(),
        isLoading: false,
        error: 'Search failed',
        results: [],
        suggestions: [],
        totalResults: 0,
        searchTime: 0,
      })

      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.performSearch('test')
      })

      expect(result.current.state.error).toBe('Search failed')
    })

    it('should show no results when search returns empty', async () => {
      const mockSearchTasks = jest.fn().mockResolvedValue({
        data: [],
        suggestions: [],
        totalResults: 0,
        searchTime: 25,
      })

      mockUseTaskSearch.mockReturnValue({
        searchTasks: mockSearchTasks,
        clearResults: jest.fn(),
        isLoading: false,
        error: null,
        results: [],
        suggestions: [],
        totalResults: 0,
        searchTime: 25,
      })

      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.performSearch('nonexistent')
      })

      expect(result.current.state.showNoResults).toBe(true)
      expect(result.current.state.results).toEqual([])
    })
  })

  describe('category filtering', () => {
    it('should select category', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.selectCategory('tasks')
      })

      expect(result.current.state.selectedCategory).toBe('tasks')
    })

    it('should filter results by category', () => {
      const mixedResults = [
        { ...mockSearchResults[0], type: 'task' as const },
        {
          id: 'workspace-1',
          title: 'Test Workspace',
          type: 'workspace' as const,
          icon: '🏢',
          relevanceScore: 0.8,
          highlightMatches: [],
        },
      ]

      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      // Set mixed results
      act(() => {
        result.current.state.results = mixedResults
      })

      // Filter by tasks
      const taskResults = result.current.getCategoryResults('tasks')
      expect(taskResults).toHaveLength(1)
      expect(taskResults[0].type).toBe('task')

      // Filter by workspaces
      const workspaceResults = result.current.getCategoryResults('workspaces')
      expect(workspaceResults).toHaveLength(1)
      expect(workspaceResults[0].type).toBe('workspace')

      // All should return everything
      const allResults = result.current.getCategoryResults('all')
      expect(allResults).toHaveLength(2)
    })

    it('should get category count', () => {
      const mixedResults = [
        { ...mockSearchResults[0], type: 'task' as const },
        {
          id: 'workspace-1',
          title: 'Test Workspace',
          type: 'workspace' as const,
          icon: '🏢',
          relevanceScore: 0.8,
          highlightMatches: [],
        },
        {
          id: 'section-1',
          title: 'Test Section',
          type: 'section' as const,
          icon: '📁',
          relevanceScore: 0.7,
          highlightMatches: [],
        },
      ]

      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      // Set mixed results
      act(() => {
        result.current.state.results = mixedResults
      })

      expect(result.current.getCategoryCount('all')).toBe(3)
      expect(result.current.getCategoryCount('tasks')).toBe(1)
      expect(result.current.getCategoryCount('workspaces')).toBe(1)
      expect(result.current.getCategoryCount('sections')).toBe(1)
    })
  })

  describe('keyboard navigation', () => {
    it('should navigate to next result', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      // Set some results
      act(() => {
        result.current.state.filteredResults = mockSearchResults
      })

      expect(result.current.state.selectedIndex).toBe(0)

      act(() => {
        result.current.navigateNext()
      })

      expect(result.current.state.selectedIndex).toBe(1)
    })

    it('should navigate to previous result', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      // Set some results and start at index 1
      act(() => {
        result.current.state.filteredResults = mockSearchResults
        result.current.state.selectedIndex = 1
      })

      act(() => {
        result.current.navigatePrevious()
      })

      expect(result.current.state.selectedIndex).toBe(0)
    })

    it('should wrap around when navigating past bounds', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      const results = [mockSearchResults[0], mockSearchResults[0], mockSearchResults[0]]

      // Set results
      act(() => {
        result.current.state.filteredResults = results
        result.current.state.selectedIndex = 2 // Last index
      })

      // Navigate next should wrap to 0
      act(() => {
        result.current.navigateNext()
      })

      expect(result.current.state.selectedIndex).toBe(0)

      // Navigate previous should wrap to last
      act(() => {
        result.current.navigatePrevious()
      })

      expect(result.current.state.selectedIndex).toBe(2)
    })

    it('should select current result', () => {
      const mockPush = jest.fn()
      require('next/navigation').useRouter.mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
      })

      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      const resultWithUrl = { ...mockSearchResults[0], url: '/test-url' }

      // Set results
      act(() => {
        result.current.state.filteredResults = [resultWithUrl]
        result.current.state.selectedIndex = 0
      })

      act(() => {
        result.current.selectCurrent()
      })

      expect(mockPush).toHaveBeenCalledWith('/test-url')
      expect(result.current.state.isOpen).toBe(false)
    })
  })

  describe('quick actions', () => {
    it('should get quick actions for authenticated user', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      const quickActions = result.current.getQuickActions()
      expect(quickActions.length).toBeGreaterThan(0)
      
      // Should include common actions like "New Task"
      expect(quickActions.some(action => action.title.includes('New'))).toBe(true)
    })

    it('should execute quick action', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      const quickActions = result.current.getQuickActions()
      const firstAction = quickActions[0]

      expect(() => {
        firstAction.action()
      }).not.toThrow()
    })
  })

  describe('recent searches', () => {
    it('should add search to recent searches', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.addToRecentSearches('test query', 5)
      })

      expect(result.current.state.recentSearches).toHaveLength(1)
      expect(result.current.state.recentSearches[0].query).toBe('test query')
      expect(result.current.state.recentSearches[0].results).toBe(5)
    })

    it('should clear recent searches', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      // Add some searches first
      act(() => {
        result.current.addToRecentSearches('test 1', 5)
        result.current.addToRecentSearches('test 2', 3)
      })

      expect(result.current.state.recentSearches).toHaveLength(2)

      act(() => {
        result.current.clearRecentSearches()
      })

      expect(result.current.state.recentSearches).toHaveLength(0)
    })

    it('should limit recent searches to max count', () => {
      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      // Add more searches than the limit (assuming limit is 10)
      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addToRecentSearches(`test ${i}`, i)
        }
      })

      // Should not exceed the limit
      expect(result.current.state.recentSearches.length).toBeLessThanOrEqual(10)
    })
  })

  describe('suggestions', () => {
    it('should get search suggestions', () => {
      const mockSuggestions = [
        { id: 'suggestion-1', text: 'Test suggestion', type: 'query' },
        { id: 'suggestion-2', text: 'Another suggestion', type: 'autocomplete' },
      ]

      mockUseTaskSearch.mockReturnValue({
        searchTasks: jest.fn(),
        clearResults: jest.fn(),
        isLoading: false,
        error: null,
        results: [],
        suggestions: mockSuggestions,
        totalResults: 0,
        searchTime: 0,
      })

      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      expect(result.current.getSuggestions()).toEqual(mockSuggestions)
    })
  })

  describe('authentication integration', () => {
    it('should handle unauthenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      })

      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should provide different quick actions for unauthenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      })

      const { result } = renderHook(() => useSpotlightSearch(), {
        wrapper: createWrapper(),
      })

      const quickActions = result.current.getQuickActions()
      
      // Should include sign in action for unauthenticated users
      expect(quickActions.some(action => 
        action.title.toLowerCase().includes('sign') || 
        action.title.toLowerCase().includes('login')
      )).toBe(true)
    })
  })
})