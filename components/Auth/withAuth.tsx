// =============================================
// WITH AUTH HOC
// =============================================
// Higher-order component for page-level authentication

'use client';

import React from 'react';
import { ProtectedRoute } from './ProtectedRoute/ProtectedRoute';
import type { UseProtectedRouteOptions } from './ProtectedRoute/useProtectedRoute';

export interface WithAuthOptions extends UseProtectedRouteOptions {
  displayName?: string;
}

/**
 * Higher-order component that wraps a component with authentication
 * 
 * @param Component - The component to protect
 * @param options - Authentication options
 * @returns Protected component
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { displayName, ...protectedRouteOptions } = options;

  const WrappedComponent: React.FC<P> = (props): React.ReactElement => {
    return (
      <ProtectedRoute {...protectedRouteOptions}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  // Set display name for debugging
  WrappedComponent.displayName = displayName || 
    `withAuth(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

// Convenience HOCs for common use cases

/**
 * Requires authentication - redirects to login if not authenticated
 */
export function withRequiredAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<WithAuthOptions, 'requireAuth'> = {}
): React.FC<P> {
  return withAuth(Component, {
    ...options,
    requireAuth: true,
    displayName: `withRequiredAuth(${Component.displayName || Component.name || 'Component'})`,
  });
}

/**
 * Requires admin role - shows error if user is not admin
 */
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<WithAuthOptions, 'requireAuth' | 'allowedRoles'> = {}
): React.FC<P> {
  return withAuth(Component, {
    ...options,
    requireAuth: true,
    allowedRoles: ['admin', 'owner'],
    displayName: `withAdminAuth(${Component.displayName || Component.name || 'Component'})`,
  });
}

/**
 * Requires owner role - shows error if user is not owner
 */
export function withOwnerAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<WithAuthOptions, 'requireAuth' | 'allowedRoles'> = {}
): React.FC<P> {
  return withAuth(Component, {
    ...options,
    requireAuth: true,
    allowedRoles: ['owner'],
    displayName: `withOwnerAuth(${Component.displayName || Component.name || 'Component'})`,
  });
}