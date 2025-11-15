// =============================================
// USER MENU CONTAINER HOOK
// =============================================
// Container logic for user menu component

'use client';

import { useState, useCallback } from 'react';
import { useAuthContext } from '../AuthProvider';
import type { User } from '@/database/types';

export interface UseUserMenuReturn {
  user: User | null; // User from auth context
  loading: boolean;
  error: string | null;
  isMenuOpen: boolean;
  anchorEl: HTMLElement | null;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  handleMenuClose: () => void;
  handleSignOut: () => Promise<void>;
  handleProfileClick: () => void;
  clearError: () => void;
}

/**
 * User menu container hook
 * Manages user menu state and logout functionality
 */
export const useUserMenu = (): UseUserMenuReturn => {
  const { user, signOut, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const isMenuOpen = Boolean(anchorEl);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle menu open
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  // Handle menu close
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Handle sign out
  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setAnchorEl(null);
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  // Handle profile click
  const handleProfileClick = useCallback(() => {
    setAnchorEl(null);
    // TODO: Navigate to profile page
    // Will be implemented when profile page is ready
  }, []);

  return {
    user,
    loading: loading || authLoading,
    error,
    isMenuOpen,
    anchorEl,
    handleMenuOpen,
    handleMenuClose,
    handleSignOut,
    handleProfileClick,
    clearError,
  };
};