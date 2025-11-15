// =============================================
// PROTECTED ROUTE CONTAINER HOOK
// =============================================
// Container logic for protected route component

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../AuthProvider';
import type { User } from '@/database/types';

export interface UseProtectedRouteReturn {
  user: User | null; // User from auth context
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  shouldRedirect: boolean;
}

export interface UseProtectedRouteOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  allowedRoles?: string[];
  onUnauthorized?: () => void;
}

/**
 * Protected route container hook
 * Manages route protection and authentication checks
 */
export const useProtectedRoute = (
  options: UseProtectedRouteOptions = {}
): UseProtectedRouteReturn => {
  const {
    redirectTo = '/login',
    requireAuth = true,
    allowedRoles,
    onUnauthorized,
  } = options;

  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;
  // For now, treat all authenticated users as authorized since User doesn't have role
  // Role-based auth would need workspace context
  const isAuthorized = !allowedRoles || isAuthenticated;
  const shouldRedirect = requireAuth && !isAuthenticated && !authLoading;

  // Sync loading state with auth loading
  useEffect(() => {
    setLoading(authLoading);
  }, [authLoading]);

  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) {
      return;
    }

    // Handle unauthenticated users
    if (requireAuth && !isAuthenticated) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.replace(redirectTo);
      }
      return;
    }

    // Handle unauthorized users (wrong role)
    if (isAuthenticated && allowedRoles && !isAuthorized) {
      setError('You do not have permission to access this page');
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.replace('/unauthorized');
      }
      return;
    }

    // Clear any previous errors
    setError(null);
  }, [
    authLoading,
    isAuthenticated,
    isAuthorized,
    requireAuth,
    allowedRoles,
    router,
    redirectTo,
    onUnauthorized,
  ]);

  return {
    user,
    loading: loading || authLoading,
    error,
    isAuthenticated,
    isAuthorized,
    shouldRedirect,
  };
};