import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/components/Auth/useAuth'
import { supabase } from '@/lib/supabase/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock Supabase client
jest.mock('@/lib/supabase/client')

const mockedSupabase = supabase as jest.Mocked<typeof supabase>

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAuth', () => {
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

  const mockSession = {
    user: { 
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' }
    },
    access_token: 'test-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Date.now() + 3600 * 1000,
    refresh_token: 'test-refresh-token'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    mockedSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
    
    mockedSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
    } as any)
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('should load user when session exists', async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.error).toBe(null)
  })

  it('should handle session error', async () => {
    const sessionError = new Error('Session error')
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: sessionError
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBe(null)
    expect(result.current.error).toBe('Session error')
  })

  it('should sign in with Google', async () => {
    mockedSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://google.com/oauth' },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.signInWithGoogle()
    })

    expect(mockedSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  })

  it('should handle Google sign in error', async () => {
    const oauthError = new Error('OAuth error')
    mockedSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: null, url: null },
      error: oauthError
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await expect(result.current.signInWithGoogle()).rejects.toThrow('OAuth error')
    })

    expect(result.current.error).toBe('OAuth error')
  })

  it('should sign in with email and password', async () => {
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockSession.user, session: mockSession },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.signIn('test@example.com', 'password123')
    })

    expect(mockedSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('should handle email sign in error', async () => {
    const signInError = new Error('Invalid credentials')
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: signInError
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await expect(result.current.signIn('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
    })

    expect(result.current.error).toBe('Invalid credentials')
  })

  it('should sign up with email and password', async () => {
    mockedSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockSession.user, session: mockSession },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.signUp('test@example.com', 'password123', 'Test User')
    })

    expect(mockedSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Test User',
        },
      },
    })
  })

  it('should sign out', async () => {
    mockedSupabase.auth.signOut.mockResolvedValue({
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockedSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('should handle sign out error', async () => {
    const signOutError = new Error('Sign out failed')
    mockedSupabase.auth.signOut.mockResolvedValue({
      error: signOutError
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await expect(result.current.signOut()).rejects.toThrow('Sign out failed')
    })

    expect(result.current.error).toBe('Sign out failed')
  })

  it('should update profile', async () => {
    const updatedUser = { ...mockUser, name: 'Updated Name' }
    
    mockedSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: updatedUser, error: null }),
    } as any)

    // Initialize with user
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    await act(async () => {
      const result_user = await result.current.updateProfile({ name: 'Updated Name' })
      expect(result_user).toEqual(updatedUser)
    })

    expect(result.current.user?.name).toBe('Updated Name')
  })

  it('should handle profile update error when no user is logged in', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.updateProfile({ name: 'New Name' })).rejects.toThrow('No user logged in')
    })
  })

  it('should create user profile if not exists', async () => {
    const notFoundError = { code: 'PGRST116', message: 'User not found' }
    
    // First call fails (user doesn't exist)
    mockedSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: notFoundError }),
    } as any)

    // Second call succeeds (user created)
    mockedSupabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
    } as any)

    // Mock getUser for profile creation
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null
    })

    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should handle auth state changes', async () => {
    const mockAuthStateCallback = jest.fn()
    
    mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      mockAuthStateCallback.mockImplementation(callback)
      return {
        data: { subscription: { unsubscribe: jest.fn() } }
      }
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    // Simulate SIGNED_IN event
    await act(async () => {
      await mockAuthStateCallback('SIGNED_IN', mockSession)
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    // Simulate SIGNED_OUT event
    await act(async () => {
      await mockAuthStateCallback('SIGNED_OUT', null)
    })

    await waitFor(() => {
      expect(result.current.user).toBe(null)
    })

    // Simulate TOKEN_REFRESHED event
    await act(async () => {
      await mockAuthStateCallback('TOKEN_REFRESHED', mockSession)
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })
  })
})