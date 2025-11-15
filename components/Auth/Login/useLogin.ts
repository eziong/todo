// =============================================
// LOGIN CONTAINER HOOK
// =============================================
// Container logic for login component

'use client';

import { useState, useCallback } from 'react';
import { useAuthContext } from '../AuthProvider';

export interface UseLoginReturn {
  loading: boolean;
  error: string | null;
  handleGoogleSignIn: () => Promise<void>;
  handleEmailSignIn: (email: string, password: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Login container hook
 * Manages login state and authentication operations
 */
export const useLogin = (): UseLoginReturn => {
  const { signInWithGoogle, signIn } = useAuthContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
  const handleEmailSignIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [signIn]);

  return {
    loading,
    error,
    handleGoogleSignIn,
    handleEmailSignIn,
    clearError,
  };
};