import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Login } from '@/components/Auth/Login/Login'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import * as useLoginHook from '@/components/Auth/Login/useLogin'

// Mock the useLogin hook
jest.mock('@/components/Auth/Login/useLogin')

const mockUseLogin = useLoginHook.useLogin as jest.MockedFunction<typeof useLoginHook.useLogin>

describe('Login Component', () => {
  const mockHandleGoogleSignIn = jest.fn()
  const mockHandleEmailSignIn = jest.fn()
  const mockClearError = jest.fn()

  const defaultMockReturn = {
    loading: false,
    error: null,
    handleGoogleSignIn: mockHandleGoogleSignIn,
    handleEmailSignIn: mockHandleEmailSignIn,
    clearError: mockClearError,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLogin.mockReturnValue(defaultMockReturn)
  })

  it('renders login form with default props', () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    
    // Email form should not be visible by default
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it('renders login form with custom title and subtitle', () => {
    renderWithProviders(
      <Login 
        title="Custom Title" 
        subtitle="Custom subtitle text" 
      />
    )
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom subtitle text')).toBeInTheDocument()
  })

  it('shows email login form when showEmailLogin is true', () => {
    renderWithProviders(<Login showEmailLogin />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByText('or')).toBeInTheDocument()
  })

  it('handles Google sign in click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />)
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await user.click(googleButton)
    
    expect(mockHandleGoogleSignIn).toHaveBeenCalledTimes(1)
  })

  it('disables Google button when loading', () => {
    mockUseLogin.mockReturnValue({
      ...defaultMockReturn,
      loading: true,
    })
    
    renderWithProviders(<Login />)
    
    const googleButton = screen.getByRole('button', { name: /signing in.../i })
    expect(googleButton).toBeDisabled()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('displays error message', () => {
    mockUseLogin.mockReturnValue({
      ...defaultMockReturn,
      error: 'Authentication failed',
    })
    
    renderWithProviders(<Login />)
    
    expect(screen.getByText('Authentication failed')).toBeInTheDocument()
  })

  it('clears error when close button is clicked', async () => {
    const user = userEvent.setup()
    mockUseLogin.mockReturnValue({
      ...defaultMockReturn,
      error: 'Authentication failed',
    })
    
    renderWithProviders(<Login />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(mockClearError).toHaveBeenCalledTimes(1)
  })

  describe('Email form validation and submission', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Login showEmailLogin />)
      
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      await user.click(submitButton)
      
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(mockHandleEmailSignIn).not.toHaveBeenCalled()
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Login showEmailLogin />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)
      
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      expect(mockHandleEmailSignIn).not.toHaveBeenCalled()
    })

    it('validates password length', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Login showEmailLogin />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, '123')
      await user.click(submitButton)
      
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
      expect(mockHandleEmailSignIn).not.toHaveBeenCalled()
    })

    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Login showEmailLogin />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      expect(mockHandleEmailSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(screen.queryByText(/required/)).not.toBeInTheDocument()
    })

    it('toggles password visibility', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Login showEmailLogin />)
      
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
      
      // Initially password should be hidden
      expect(passwordInput.type).toBe('password')
      
      // Click to show password
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('text')
      
      // Click to hide password again
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    })

    it('clears form errors when fields are corrected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Login showEmailLogin />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      
      // Submit empty form to trigger validation errors
      await user.click(submitButton)
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
      
      // Enter valid email and password
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      // Errors should be cleared
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument()
      expect(screen.queryByText('Password is required')).not.toBeInTheDocument()
    })

    it('disables form when loading', () => {
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      })
      
      renderWithProviders(<Login showEmailLogin />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('progressbar').closest('button')
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
      
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
      expect(toggleButton).toBeDisabled()
    })
  })

  describe('Sign up link', () => {
    it('shows sign up link when onToggleSignUp is provided', () => {
      const mockToggle = jest.fn()
      renderWithProviders(<Login onToggleSignUp={mockToggle} />)
      
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('calls onToggleSignUp when sign up button is clicked', async () => {
      const user = userEvent.setup()
      const mockToggle = jest.fn()
      renderWithProviders(<Login onToggleSignUp={mockToggle} />)
      
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      await user.click(signUpButton)
      
      expect(mockToggle).toHaveBeenCalledTimes(1)
    })

    it('hides sign up link when onToggleSignUp is not provided', () => {
      renderWithProviders(<Login />)
      
      expect(screen.queryByText(/don't have an account/i)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /sign up/i })).not.toBeInTheDocument()
    })

    it('disables sign up link when loading', () => {
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      })
      
      const mockToggle = jest.fn()
      renderWithProviders(<Login onToggleSignUp={mockToggle} />)
      
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      expect(signUpButton).toBeDisabled()
    })
  })

  describe('accessibility', () => {
    it('has proper form structure', () => {
      renderWithProviders(<Login showEmailLogin />)
      
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      expect(form).toHaveAttribute('novalidate')
    })

    it('has proper input labels and types', () => {
      renderWithProviders(<Login showEmailLogin />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('shows proper aria attributes on password toggle', () => {
      renderWithProviders(<Login showEmailLogin />)
      
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
      expect(toggleButton).toHaveAttribute('aria-label', 'toggle password visibility')
    })
  })
})