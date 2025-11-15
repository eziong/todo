// =============================================
// WORKSPACES CONTAINER HOOK
// =============================================
// Container logic for workspace listing and management

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { 
  Workspace, 
  WorkspaceInsert, 
  PaginatedResponse, 
  ApiResponse 
} from '@/database/types';

export interface WorkspaceWithUserRole extends Workspace {
  user_role: 'owner' | 'admin' | 'member' | 'viewer';
  user_permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    admin: boolean;
  };
  last_active_at: string;
}

export interface UseWorkspacesOptions {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
  autoRefresh?: boolean;
}

export interface UseWorkspacesReturn {
  workspaces: WorkspaceWithUserRole[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  
  // Actions
  refetch: () => Promise<void>;
  createWorkspace: (data: Omit<WorkspaceInsert, 'owner_id'>) => Promise<WorkspaceWithUserRole>;
  deleteWorkspace: (id: string) => Promise<void>;
  
  // Pagination
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  
  // Search and filters
  setSearch: (search: string) => void;
  setIncludeDeleted: (include: boolean) => void;
}

/**
 * Hook for managing user's workspaces
 * Provides listing, creation, and basic management functionality
 */
export const useWorkspaces = (options: UseWorkspacesOptions = {}): UseWorkspacesReturn => {
  const {
    page: initialPage = 1,
    limit = 20,
    search: initialSearch = '',
    includeDeleted: initialIncludeDeleted = false,
    autoRefresh = true,
  } = options;

  const [workspaces, setWorkspaces] = useState<WorkspaceWithUserRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseWorkspacesReturn['pagination']>(null);
  
  // Query parameters
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [includeDeleted, setIncludeDeleted] = useState(initialIncludeDeleted);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Fetch workspaces from API
  const fetchWorkspaces = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      if (includeDeleted) {
        params.append('include_deleted', 'true');
      }

      const response = await fetch(`/api/workspaces?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to fetch workspaces');
      }

      const data = await response.json() as PaginatedResponse<WorkspaceWithUserRole>;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setWorkspaces(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workspaces';
      setError(errorMessage);
      setWorkspaces([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, includeDeleted, clearError]);

  // Create new workspace
  const createWorkspace = useCallback(async (data: Omit<WorkspaceInsert, 'owner_id'>): Promise<WorkspaceWithUserRole> => {
    try {
      clearError();

      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to create workspace');
      }

      const result = await response.json() as ApiResponse<WorkspaceWithUserRole>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to create workspace');
      }

      // Add the new workspace to the current list if it would appear on current page
      setWorkspaces(prev => [result.data!, ...prev]);
      
      // Refetch to get updated pagination
      await fetchWorkspaces();

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [clearError, fetchWorkspaces]);

  // Delete workspace
  const deleteWorkspace = useCallback(async (id: string): Promise<void> => {
    try {
      clearError();

      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to delete workspace');
      }

      // Remove workspace from current list
      setWorkspaces(prev => prev.filter(w => w.id !== id));
      
      // Refetch to get updated pagination
      await fetchWorkspaces();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workspace';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [clearError, fetchWorkspaces]);

  // Pagination actions
  const nextPage = useCallback((): void => {
    if (pagination?.hasNext) {
      setPage(prev => prev + 1);
    }
  }, [pagination?.hasNext]);

  const prevPage = useCallback((): void => {
    if (pagination?.hasPrev) {
      setPage(prev => Math.max(1, prev - 1));
    }
  }, [pagination?.hasPrev]);

  const goToPage = useCallback((targetPage: number): void => {
    if (pagination && targetPage >= 1 && targetPage <= pagination.totalPages) {
      setPage(targetPage);
    }
  }, [pagination]);

  // Search actions
  const setSearchWithReset = useCallback((newSearch: string): void => {
    setSearch(newSearch);
    setPage(1); // Reset to first page when searching
  }, []);

  const setIncludeDeletedWithReset = useCallback((include: boolean): void => {
    setIncludeDeleted(include);
    setPage(1); // Reset to first page when changing filter
  }, []);

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Real-time updates via Supabase subscriptions
  useEffect(() => {
    if (!autoRefresh) return;

    let mounted = true;

    const setupSubscriptions = async () => {
      try {
        // Get current user for filtering
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Subscribe to workspace changes for user's workspaces
        const workspacesSubscription = supabase
          .channel('workspaces_changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'workspaces',
            },
            async (payload) => {
              if (!mounted) return;
              
              // Check if this workspace affects the current user
              const newPayload = payload.new as any;
              const oldPayload = payload.old as any;
              const workspaceId = newPayload?.id || oldPayload?.id;
              if (workspaceId) {
                const { data: memberCheck } = await supabase
                  .from('workspace_members')
                  .select('id')
                  .eq('workspace_id', workspaceId)
                  .eq('user_id', user.id)
                  .single();

                if (memberCheck) {
                  // This workspace change affects the current user
                  await fetchWorkspaces();
                }
              }
            }
          )
          .subscribe();

        // Subscribe to workspace member changes
        const membersSubscription = supabase
          .channel('workspace_members_changes')
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'workspace_members',
              filter: `user_id=eq.${user.id}`,
            },
            async () => {
              if (mounted) {
                await fetchWorkspaces();
              }
            }
          )
          .subscribe();

        return () => {
          workspacesSubscription.unsubscribe();
          membersSubscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up workspace subscriptions:', err);
      }
    };

    const unsubscribePromise = setupSubscriptions();

    return () => {
      mounted = false;
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, [autoRefresh, fetchWorkspaces]);

  return {
    workspaces,
    loading,
    error,
    pagination,
    
    // Actions
    refetch: fetchWorkspaces,
    createWorkspace,
    deleteWorkspace,
    
    // Pagination
    nextPage,
    prevPage,
    goToPage,
    
    // Search and filters
    setSearch: setSearchWithReset,
    setIncludeDeleted: setIncludeDeletedWithReset,
  };
};