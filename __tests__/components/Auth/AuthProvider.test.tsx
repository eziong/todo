import React from 'react'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuthContext } from '@/components/Auth/AuthProvider'
import * as useAuthHook from '@/components/Auth/useAuth'
import type { UseAuthReturn } from '@/types/database'

// Mock the useAuth hook
jest.mock('@/components/Auth/useAuth')

const mockUseAuth = useAuthHook.useAuth as jest.MockedFunction<typeof useAuthHook.useAuth>

// Mock AuthErrorBoundary
jest.mock('@/components/Auth/ErrorBoundary/AuthErrorBoundary', () => ({
  AuthErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-error-boundary">{children}</div>
}))

// Test component that uses the auth context
const TestConsumer: React.FC = () => {
  const auth = useAuthContext()
  return (
    <div>
      <div data-testid="auth-loading">{auth.loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="auth-user">{auth.user?.email || 'no-user'}</div>
      <div data-testid="auth-error">{auth.error || 'no-error'}</div>
    </div>
  )
}

// Test component that tries to use auth context outside provider
const TestConsumerOutsideProvider: React.FC = () => {
  try {
    useAuthContext()
    return <div>Should not render</div>
  } catch (error) {
    return <div data-testid="context-error">{error instanceof Error ? error.message : 'Unknown error'}</div>
  }
}

describe('AuthProvider', () => {
  const mockAuthValue: UseAuthReturn = {
    user: null,
    loading: false,
    error: null,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue(mockAuthValue)
  })

  it('should render children and provide auth context', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-error-boundary')).toBeInTheDocument()
    expect(screen.getByTestId('auth-loading')).toHaveTextContent('not-loading')
    expect(screen.getByTestId('auth-user')).toHaveTextContent('no-user')
    expect(screen.getByTestId('auth-error')).toHaveTextContent('no-error')
  })

  it('should apply className to wrapper div', () => {
    const { container } = render(
      <AuthProvider className="custom-class">
        <div>Test content</div>
      </AuthProvider>
    )

    const wrapperDiv = container.firstChild?.firstChild
    expect(wrapperDiv).toHaveClass('custom-class')
  })

  it('should provide loading state from useAuth', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthValue,
      loading: true,
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-loading')).toHaveTextContent('loading')
  })

  it('should provide user data from useAuth', () => {
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

    mockUseAuth.mockReturnValue({
      ...mockAuthValue,
      user: mockUser,
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-user')).toHaveTextContent('test@example.com')
  })

  it('should provide error state from useAuth', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthValue,
      error: 'Authentication failed',
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-error')).toHaveTextContent('Authentication failed')
  })

  it('should wrap children in AuthErrorBoundary', () => {
    render(
      <AuthProvider>
        <div data-testid="test-child">Test child</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-error-boundary')).toBeInTheDocument()
    expect(screen.getByTestId('test-child')).toBeInTheDocument()
  })

  describe('useAuthContext hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      render(<TestConsumerOutsideProvider />)
      
      expect(screen.getByTestId('context-error')).toHaveTextContent(
        'useAuthContext must be used within an AuthProvider'
      )
    })

    it('should return auth context when used within AuthProvider', () => {
      const TestComponent: React.FC = () => {
        const auth = useAuthContext()
        return <div data-testid="context-success">Context available: {typeof auth.signIn}</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('context-success')).toHaveTextContent('Context available: function')
    })

    it('should provide all auth methods from useAuth', () => {
      const TestComponent: React.FC = () => {
        const auth = useAuthContext()
        const methods = [
          'signIn',
          'signUp', 
          'signInWithGoogle',
          'signOut',
          'updateProfile'
        ]
        
        return (
          <div>
            {methods.map(method => (
              <div key={method} data-testid={`method-${method}`}>
                {typeof (auth as any)[method]}
              </div>
            ))}
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const methods = ['signIn', 'signUp', 'signInWithGoogle', 'signOut', 'updateProfile']
      methods.forEach(method => {
        expect(screen.getByTestId(`method-${method}`)).toHaveTextContent('function')
      })
    })
  })

  describe('integration with useAuth', () => {
    it('should call useAuth on render', () => {
      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      )

      expect(mockUseAuth).toHaveBeenCalledTimes(1)
    })

    it('should pass through all useAuth return values', () => {
      const customAuthValue: UseAuthReturn = {
        user: {
          id: 'custom-user',
          email: 'custom@example.com',
          name: 'Custom User',
          avatar_url: 'http://example.com/avatar.jpg',
          google_id: 'google-123',
          timezone: 'America/New_York',
          preferences: {
            theme: 'dark',
            language: 'es',
            timezone: 'America/New_York',
            notifications: {
              email: false,
              push: false,
              task_assignments: false,
              due_date_reminders: false,
            },
            ui: {
              compact_mode: true,
              show_completed_tasks: false,
              default_view: 'grid',
            },
          },
          created_at: '2023-06-01T00:00:00Z',
          updated_at: '2023-06-01T00:00:00Z',
          last_active_at: '2023-06-01T00:00:00Z',
        },
        loading: true,
        error: 'Custom error',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      }

      mockUseAuth.mockReturnValue(customAuthValue)

      const TestComponent: React.FC = () => {
        const auth = useAuthContext()
        return (
          <div>
            <div data-testid="user-id">{auth.user?.id}</div>
            <div data-testid="user-email">{auth.user?.email}</div>
            <div data-testid="user-theme">{auth.user?.preferences.theme}</div>
            <div data-testid="loading">{auth.loading ? 'true' : 'false'}</div>
            <div data-testid="error">{auth.error}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('user-id')).toHaveTextContent('custom-user')
      expect(screen.getByTestId('user-email')).toHaveTextContent('custom@example.com')
      expect(screen.getByTestId('user-theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('loading')).toHaveTextContent('true')
      expect(screen.getByTestId('error')).toHaveTextContent('Custom error')
    })
  })
})