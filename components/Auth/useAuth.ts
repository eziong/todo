// =============================================
// AUTHENTICATION CONTAINER HOOK
// =============================================
// Container logic for authentication state management

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User, UserInsert, UserUpdate } from '@/database/types';
// Remove unused imports for cleaner code

// Auth return type
export type UseAuthReturn = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<User>;
};

/**
 * Authentication container hook
 * Manages authentication state, user sessions, and auth operations
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Load user profile from database
  const loadUserProfile = useCallback(async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user doesn't exist, create profile
        if (error.code === 'PGRST116') {
          await createUserProfile(userId);
          return;
        }
        throw error;
      }

      if (data) {
        setUser(data);
      }
    } catch (err) {
      // Error loading user profile
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    }
  }, []);

  // Create user profile in database
  const createUserProfile = async (userId: string): Promise<void> => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('No authenticated user found');
      }

      const newUser: UserInsert = {
        id: userId,
        email: authUser.email || '',
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Unknown User',
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        google_id: authUser.user_metadata?.sub || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        preferences: {
          theme: 'auto',
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
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
        last_active_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUser(data);
      }
    } catch (err) {
      // Error creating user profile
      setError(err instanceof Error ? err.message : 'Failed to create user profile');
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        clearError();

        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (mounted) {
            setError(sessionError.message);
            setUser(null);
          }
          return;
        }

        if (session?.user && mounted) {
          await loadUserProfile(session.user.id);
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session): Promise<void> => {
        if (!mounted) return;

        try {
          setLoading(true);
          clearError();

          if (event === 'SIGNED_IN' && session?.user) {
            await loadUserProfile(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            await loadUserProfile(session.user.id);
          }
        } catch (err) {
          if (mounted) {
            setError(err instanceof Error ? err.message : 'Authentication state change failed');
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearError, loadUserProfile]);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [clearError]);

  // Sign in with email and password (for future implementation)
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [clearError]);

  // Sign up with email and password (for future implementation)
  const signUp = useCallback(async (email: string, password: string, name: string): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [clearError]);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [clearError]);

  // Update user profile
  const updateProfile = useCallback(async (data: UserUpdate): Promise<User> => {
    try {
      if (!user?.id) {
        throw new Error('No user logged in');
      }

      setLoading(true);
      clearError();

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (updatedUser) {
        setUser(updatedUser);
        return updatedUser;
      }

      throw new Error('Failed to update profile');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, clearError]);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
  };
};