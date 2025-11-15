// =============================================
// LOGIN CONTAINER HOOK
// =============================================
// Container logic for login component

'use client';

import { useState, useCallback } from 'react';
import { useAuthContext } from '../AuthProvider';

export interface UseLoginReturn {
  // Authentication state
  loading: boolean;
  error: string | null;
  
  // Form state
  email: string;
  password: string;
  showPassword: boolean;
  formErrors: { email?: string; password?: string };
  
  // Form actions
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  toggleShowPassword: () => void;
  
  // Authentication actions
  handleGoogleSignIn: () => Promise<void>;
  handleEmailSignIn: () => Promise<void>;
  clearError: () => void;
  
  // Validation
  validateForm: () => boolean;
}

/**
 * Login container hook
 * Manages login state and authentication operations
 */
export const useLogin = (): UseLoginReturn => {
  const { signInWithGoogle, signIn } = useAuthContext();
  
  // Authentication state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
    setFormErrors({});
  }, []);
  
  // Form actions
  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);
  
  // Validate email format
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);
  
  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, validateEmail]);

  // Handle Google sign-in
  const handleGoogleSignIn = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [signInWithGoogle]);

  // Handle email/password sign-in
  const handleEmailSignIn = useCallback(async (): Promise<void> => {
    // Validate form first
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [signIn, email, password, validateForm]);

  return {
    // Authentication state
    loading,
    error,
    
    // Form state
    email,
    password,
    showPassword,
    formErrors,
    
    // Form actions
    setEmail,
    setPassword,
    toggleShowPassword,
    
    // Authentication actions
    handleGoogleSignIn,
    handleEmailSignIn,
    clearError,
    
    // Validation
    validateForm,
  };
};