import { renderHook, act } from '@testing-library/react'
import { useNavigationSidebar } from '@/components/NavigationSidebar/useNavigationSidebar'
import { useMediaQuery } from '@mui/material'
import { createTestQueryClient } from '@/__tests__/utils/test-utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock dependencies
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
  useTheme: () => ({
    breakpoints: {
      down: jest.fn(),
      between: jest.fn(),
      up: jest.fn(),
    },
  }),
}))

jest.mock('@/components/Auth')
jest.mock('./useWorkspaceNavigation')
jest.mock('@/hooks/useRouter')

import * as Auth from '@/components/Auth'
import * as WorkspaceNavigation from '@/components/NavigationSidebar/useWorkspaceNavigation'
import * as Router from '@/hooks/useRouter'

const mockUseMediaQuery = useMediaQuery as jest.MockedFunction<typeof useMediaQuery>
const mockUseAuth = Auth.useAuth as jest.MockedFunction<typeof Auth.useAuth>
const mockUseWorkspaceNavigation = WorkspaceNavigation.useWorkspaceNavigation as jest.MockedFunction<typeof WorkspaceNavigation.useWorkspaceNavigation>
const mockUseRouter = Router.useRouter as jest.MockedFunction<typeof Router.useRouter>

const createWrapper = () => {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useNavigationSidebar', () => {
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

  const mockWorkspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
    description: 'Test workspace description',
    color: '#2563eb',
    iconType: 'emoji' as const,
    iconValue: '🏢',
    ownerId: 'test-user-id',
    sections: [
      {
        id: 'section-1',
        workspaceId: 'workspace-1',
        name: 'Test Section',
        description: 'Test section description',
        position: 0,
        color: '#10b981',
        isArchived: false,
        tasks: [],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      }
    ],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  }

  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseMediaQuery.mockReturnValue(false) // Desktop by default

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

    mockUseWorkspaceNavigation.mockReturnValue({
      workspaces: [mockWorkspace],
      activeWorkspace: mockWorkspace,
      selectedWorkspaceId: 'workspace-1',
      expandedWorkspaces: new Set(['workspace-1']),
      loading: false,
      error: null,
      selectWorkspace: jest.fn(),
      toggleWorkspaceExpansion: jest.fn(),
    })

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      pathname: '/dashboard',
      searchParams: new URLSearchParams(),
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useNavigationSidebar(), {
      wrapper: createWrapper(),
    })

    expect(result.current.state.isOpen).toBe(true) // Desktop default
    expect(result.current.state.searchQuery).toBe('')
    expect(result.current.state.isSearching).toBe(false)
    expect(result.current.state.width).toBe(280)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.workspaces).toEqual([mockWorkspace])
  })

  describe('responsive behavior', () => {
    it('should set appropriate state for mobile devices', () => {
      // Mock mobile breakpoint
      mockUseMediaQuery.mockImplementation((query) => {
        // Simulate mobile breakpoint
        return query.includes('down')
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isMobile).toBe(true)
      expect(result.current.drawerVariant).toBe('temporary')
    })

    it('should set appropriate state for tablet devices', () => {
      // Mock tablet breakpoint
      mockUseMediaQuery.mockImplementation((query) => {
        if (query.includes('down')) return false // Not mobile
        if (query.includes('between')) return true // Is tablet
        if (query.includes('up')) return false // Not desktop
        return false
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isTablet).toBe(true)
      expect(result.current.drawerVariant).toBe('persistent')
    })

    it('should set appropriate state for desktop devices', () => {
      // Mock desktop breakpoint
      mockUseMediaQuery.mockImplementation((query) => {
        if (query.includes('down')) return false // Not mobile
        if (query.includes('between')) return false // Not tablet
        if (query.includes('up')) return true // Is desktop
        return false
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isDesktop).toBe(true)
      expect(result.current.drawerVariant).toBe('permanent')
    })
  })

  describe('sidebar actions', () => {
    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      const initialState = result.current.state.isOpen

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.state.isOpen).toBe(!initialState)
    })

    it('should open sidebar', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.closeSidebar()
      })

      expect(result.current.state.isOpen).toBe(false)

      act(() => {
        result.current.openSidebar()
      })

      expect(result.current.state.isOpen).toBe(true)
    })

    it('should close sidebar', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.openSidebar()
      })

      expect(result.current.state.isOpen).toBe(true)

      act(() => {
        result.current.closeSidebar()
      })

      expect(result.current.state.isOpen).toBe(false)
    })
  })

  describe('search functionality', () => {
    it('should handle search query changes', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.handleSearchChange('test query')
      })

      expect(result.current.state.searchQuery).toBe('test query')
      expect(result.current.state.isSearching).toBe(true)
    })

    it('should filter workspaces by name', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.handleSearchChange('Test Work')
      })

      expect(result.current.state.searchResults.workspaces).toHaveLength(1)
      expect(result.current.state.searchResults.workspaces[0].name).toBe('Test Workspace')
    })

    it('should filter sections by name', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.handleSearchChange('Test Sec')
      })

      expect(result.current.state.searchResults.sections).toHaveLength(1)
      expect(result.current.state.searchResults.sections[0].name).toBe('Test Section')
    })

    it('should clear search', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      // First set a search query
      act(() => {
        result.current.handleSearchChange('test')
      })

      expect(result.current.state.searchQuery).toBe('test')
      expect(result.current.state.isSearching).toBe(true)

      // Then clear it
      act(() => {
        result.current.clearSearch()
      })

      expect(result.current.state.searchQuery).toBe('')
      expect(result.current.state.isSearching).toBe(false)
      expect(result.current.state.searchResults.workspaces).toHaveLength(0)
    })

    it('should return empty results for empty search query', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.handleSearchChange('')
      })

      expect(result.current.state.searchResults.workspaces).toHaveLength(0)
      expect(result.current.state.searchResults.sections).toHaveLength(0)
    })
  })

  describe('workspace navigation', () => {
    it('should select workspace and navigate', () => {
      const mockSelectWorkspace = jest.fn()
      mockUseWorkspaceNavigation.mockReturnValue({
        ...mockUseWorkspaceNavigation(),
        selectWorkspace: mockSelectWorkspace,
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.selectWorkspace('workspace-2')
      })

      expect(mockSelectWorkspace).toHaveBeenCalledWith('workspace-2')
      expect(mockPush).toHaveBeenCalledWith('/workspace/workspace-2')
    })

    it('should close sidebar on mobile after workspace selection', () => {
      // Mock mobile breakpoint
      mockUseMediaQuery.mockImplementation((query) => {
        return query.includes('down')
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      // Open sidebar first
      act(() => {
        result.current.openSidebar()
      })

      expect(result.current.state.isOpen).toBe(true)

      act(() => {
        result.current.selectWorkspace('workspace-2')
      })

      expect(result.current.state.isOpen).toBe(false)
    })

    it('should toggle workspace expansion', () => {
      const mockToggleExpansion = jest.fn()
      mockUseWorkspaceNavigation.mockReturnValue({
        ...mockUseWorkspaceNavigation(),
        toggleWorkspaceExpansion: mockToggleExpansion,
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.toggleWorkspaceExpansion('workspace-1')
      })

      expect(mockToggleExpansion).toHaveBeenCalledWith('workspace-1')
    })
  })

  describe('user actions', () => {
    it('should handle user menu click', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      const mockEvent = { target: {} } as React.MouseEvent<HTMLElement>

      act(() => {
        result.current.handleUserMenuClick(mockEvent)
      })

      expect(consoleSpy).toHaveBeenCalledWith('User menu clicked', mockEvent)
      consoleSpy.mockRestore()
    })

    it('should handle settings click', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.handleSettingsClick()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Settings clicked')
      consoleSpy.mockRestore()
    })

    it('should handle sign out', async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined)
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        signOut: mockSignOut,
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.handleSignOut()
      })

      expect(mockSignOut).toHaveBeenCalled()
      expect(result.current.state.isOpen).toBe(false) // Sidebar should be closed
    })

    it('should handle sign out error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const signOutError = new Error('Sign out failed')
      const mockSignOut = jest.fn().mockRejectedValue(signOutError)
      
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        signOut: mockSignOut,
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.handleSignOut()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', signOutError)
      consoleSpy.mockRestore()
    })
  })

  describe('quick navigation', () => {
    it('should handle quick navigation', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.handleQuickNavigation('/dashboard')
      })

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should close sidebar on mobile after quick navigation', () => {
      // Mock mobile breakpoint
      mockUseMediaQuery.mockImplementation((query) => {
        return query.includes('down')
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      // Open sidebar first
      act(() => {
        result.current.openSidebar()
      })

      expect(result.current.state.isOpen).toBe(true)

      act(() => {
        result.current.handleQuickNavigation('/today')
      })

      expect(result.current.state.isOpen).toBe(false)
    })

    it('should return current path from router', () => {
      mockUseRouter.mockReturnValue({
        ...mockUseRouter(),
        pathname: '/workspace/123',
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      expect(result.current.currentPath).toBe('/workspace/123')
    })
  })

  describe('resize functionality', () => {
    it('should handle resize start', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startResizing()
      })

      expect(result.current.state.isResizing).toBe(true)
    })

    it('should handle resize stop', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startResizing()
      })

      expect(result.current.state.isResizing).toBe(true)

      act(() => {
        result.current.stopResizing()
      })

      expect(result.current.state.isResizing).toBe(false)
    })

    it('should update width within constraints', () => {
      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      // Test normal width
      act(() => {
        result.current.updateWidth(300)
      })

      expect(result.current.state.width).toBe(300)

      // Test minimum constraint
      act(() => {
        result.current.updateWidth(150)
      })

      expect(result.current.state.width).toBe(200) // Should be constrained to minimum

      // Test maximum constraint
      act(() => {
        result.current.updateWidth(500)
      })

      expect(result.current.state.width).toBe(400) // Should be constrained to maximum
    })
  })

  describe('loading and error states', () => {
    it('should combine auth and workspace loading states', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        loading: true,
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      expect(result.current.loading).toBe(true)
    })

    it('should combine auth and workspace error states', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        error: 'Auth error',
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      expect(result.current.error).toBe('Auth error')
    })

    it('should prioritize workspace error over auth error', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        error: 'Auth error',
      })

      mockUseWorkspaceNavigation.mockReturnValue({
        ...mockUseWorkspaceNavigation(),
        error: 'Workspace error',
      })

      const { result } = renderHook(() => useNavigationSidebar(), {
        wrapper: createWrapper(),
      })

      expect(result.current.error).toBe('Workspace error')
    })
  })
})