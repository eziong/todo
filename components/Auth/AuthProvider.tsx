// =============================================
// AUTHENTICATION PROVIDER COMPONENT
// =============================================
// Provider component for authentication context

'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from './useAuth';
import { AuthErrorBoundary } from './ErrorBoundary/AuthErrorBoundary';
import type { UseAuthReturn, BaseComponentProps } from '@/types';

// Authentication context
const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

// Authentication provider props
export interface AuthProviderProps extends BaseComponentProps {
  children: React.ReactNode;
}

/**
 * Authentication Provider Component
 * Provides authentication state and methods to child components
 * 
 * @param props - The provider props
 * @returns The provider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  className 
}) => {
  const authValue = useAuth();

  return (
    <AuthErrorBoundary>
      <AuthContext.Provider value={authValue}>
        <div className={className}>
          {children}
        </div>
      </AuthContext.Provider>
    </AuthErrorBoundary>
  );
};

/**
 * Hook to access authentication context
 * Must be used within AuthProvider
 * 
 * @returns Authentication context value
 * @throws Error if used outside of AuthProvider
 */
export const useAuthContext = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};