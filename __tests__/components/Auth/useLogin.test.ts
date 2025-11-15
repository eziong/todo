import { renderHook, act } from '@testing-library/react'
import { useLogin } from '@/components/Auth/Login/useLogin'
import * as AuthProvider from '@/components/Auth/AuthProvider'

// Mock the AuthProvider
jest.mock('@/components/Auth/AuthProvider')

const mockUseAuthContext = AuthProvider.useAuthContext as jest.MockedFunction<typeof AuthProvider.useAuthContext>

describe('useLogin', () => {
  const mockSignInWithGoogle = jest.fn()
  const mockSignIn = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuthContext.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signInWithGoogle: mockSignInWithGoogle,
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
    })
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLogin())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(typeof result.current.handleGoogleSignIn).toBe('function')
    expect(typeof result.current.handleEmailSignIn).toBe('function')
    expect(typeof result.current.clearError).toBe('function')
  })

  describe('handleGoogleSignIn', () => {
    it('should handle successful Google sign in', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined)
      
      const { result } = renderHook(() => useLogin())

      await act(async () => {
        await result.current.handleGoogleSignIn()
      })

      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle Google sign in error', async () => {
      const error = new Error('Google sign-in failed')
      mockSignInWithGoogle.mockRejectedValue(error)
      
      const { result } = renderHook(() => useLogin())

      await act(async () => {
        await result.current.handleGoogleSignIn()
      })

      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Google sign-in failed')
    })

    it('should handle non-Error Google sign in failure', async () => {
      mockSignInWithGoogle.mockRejectedValue('String error')
      
      const { result } = renderHook(() => useLogin())

      await act(async () => {
        await result.current.handleGoogleSignIn()
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Google sign-in failed')
    })

    it('should set loading state during Google sign in', async () => {
      let resolveSignIn: () => void
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve
      })
      
      mockSignInWithGoogle.mockReturnValue(signInPromise)
      
      const { result } = renderHook(() => useLogin())

      // Start the sign in process
      act(() => {
        result.current.handleGoogleSignIn()
      })

      // Should be loading
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)

      // Complete the sign in
      await act(async () => {
        resolveSignIn!()
        await signInPromise
      })

      // Should not be loading anymore
      expect(result.current.loading).toBe(false)
    })
  })

  describe('handleEmailSignIn', () => {
    it('should handle successful email sign in', async () => {
      mockSignIn.mockResolvedValue(undefined)
      
      const { result } = renderHook(() => useLogin())

      await act(async () => {
        await result.current.handleEmailSignIn('test@example.com', 'password123')
      })

      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle email sign in error', async () => {
      const error = new Error('Invalid credentials')
      mockSignIn.mockRejectedValue(error)
      
      const { result } = renderHook(() => useLogin())

      await act(async () => {
        await result.current.handleEmailSignIn('test@example.com', 'wrongpassword')
      })

      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should handle non-Error email sign in failure', async () => {
      mockSignIn.mockRejectedValue('String error')
      
      const { result } = renderHook(() => useLogin())

      await act(async () => {
        await result.current.handleEmailSignIn('test@example.com', 'password')
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Email sign-in failed')
    })

    it('should set loading state during email sign in', async () => {
      let resolveSignIn: () => void
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve
      })
      
      mockSignIn.mockReturnValue(signInPromise)
      
      const { result } = renderHook(() => useLogin())

      // Start the sign in process
      act(() => {
        result.current.handleEmailSignIn('test@example.com', 'password123')
      })

      // Should be loading
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)

      // Complete the sign in
      await act(async () => {
        resolveSignIn!()
        await signInPromise
      })

      // Should not be loading anymore
      expect(result.current.loading).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      const error = new Error('Test error')
      mockSignInWithGoogle.mockRejectedValue(error)
      
      const { result } = renderHook(() => useLogin())

      // Generate an error
      await act(async () => {
        await result.current.handleGoogleSignIn()
      })

      expect(result.current.error).toBe('Test error')

      // Clear the error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe('error handling integration', () => {
    it('should clear previous error when starting new sign in', async () => {
      // First, create an error
      const firstError = new Error('First error')
      mockSignInWithGoogle.mockRejectedValueOnce(firstError)
      
      const { result } = renderHook(() => useLogin())

      await act(async () => {
        await result.current.handleGoogleSignIn()
      })

      expect(result.current.error).toBe('First error')

      // Now perform successful sign in
      mockSignInWithGoogle.mockResolvedValueOnce(undefined)

      await act(async () => {
        await result.current.handleGoogleSignIn()
      })

      // Error should be cleared
      expect(result.current.error).toBe(null)
    })

    it('should clear error when switching between sign in methods', async () => {
      // Create error with Google sign in
      const googleError = new Error('Google error')
      mockSignInWithGoogle.mockRejectedValueOnce(googleError)
      
      const { result } = renderHook(() => useLogin())

      await act(async () => {
        await result.current.handleGoogleSignIn()
      })

      expect(result.current.error).toBe('Google error')

      // Now try email sign in (successful)
      mockSignIn.mockResolvedValueOnce(undefined)

      await act(async () => {
        await result.current.handleEmailSignIn('test@example.com', 'password')
      })

      // Error should be cleared
      expect(result.current.error).toBe(null)
    })
  })
})