// =============================================
// INDIVIDUAL WORKSPACE CONTAINER HOOK
// =============================================
// Container logic for individual workspace management with real-time updates

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { 
  Workspace, 
  WorkspaceUpdate, 
  Section,
  WorkspaceMember,
  User,
  ApiResponse 
} from '@/database/types';

export interface WorkspaceDetails extends Workspace {
  user_role: 'owner' | 'admin' | 'member' | 'viewer';
  user_permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    admin: boolean;
  };
  member_count: number;
  members: Array<{
    id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    permissions: {
      read: boolean;
      write: boolean;
      delete: boolean;
      admin: boolean;
    };
    last_active_at: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      avatar_url: string | null;
    };
  }>;
  sections: Section[];
}

export interface UseWorkspaceOptions {
  autoRefresh?: boolean;
  includeArchivedSections?: boolean;
}

export interface UseWorkspaceReturn {
  workspace: WorkspaceDetails | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  updateWorkspace: (data: WorkspaceUpdate) => Promise<WorkspaceDetails>;
  deleteWorkspace: () => Promise<void>;
  
  // Permission helpers
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canAdmin: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

/**
 * Hook for managing individual workspace with real-time updates
 * Provides detailed workspace information including members and sections
 */
export const useWorkspace = (
  workspaceId: string | undefined,
  options: UseWorkspaceOptions = {}
): UseWorkspaceReturn => {
  const {
    autoRefresh = true,
    includeArchivedSections = false,
  } = options;

  const [workspace, setWorkspace] = useState<WorkspaceDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Fetch workspace details from API
  const fetchWorkspace = useCallback(async (): Promise<void> => {
    if (!workspaceId) {
      setWorkspace(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      clearError();

      const response = await fetch(`/api/workspaces/${workspaceId}`);
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to fetch workspace');
      }

      const data = await response.json() as ApiResponse<WorkspaceDetails>;
      
      if (data.error || !data.data) {
        throw new Error(data.error || 'Failed to fetch workspace');
      }

      // Filter sections based on archive preference
      const filteredSections = includeArchivedSections 
        ? data.data.sections 
        : data.data.sections.filter(section => !section.is_archived);

      setWorkspace({
        ...data.data,
        sections: filteredSections,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workspace';
      setError(errorMessage);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, includeArchivedSections, clearError]);

  // Update workspace
  const updateWorkspace = useCallback(async (data: WorkspaceUpdate): Promise<WorkspaceDetails> => {
    if (!workspaceId) {
      throw new Error('No workspace ID provided');
    }

    try {
      clearError();

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to update workspace');
      }

      const result = await response.json() as ApiResponse<Workspace>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to update workspace');
      }

      // Update local state with the updated workspace data
      if (workspace) {
        const updatedWorkspace: WorkspaceDetails = {
          ...workspace,
          ...result.data,
        };
        setWorkspace(updatedWorkspace);
        return updatedWorkspace;
      }

      // Refetch full details if we don't have current workspace
      await fetchWorkspace();
      return workspace!;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workspace';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workspaceId, workspace, clearError, fetchWorkspace]);

  // Delete workspace
  const deleteWorkspace = useCallback(async (): Promise<void> => {
    if (!workspaceId) {
      throw new Error('No workspace ID provided');
    }

    try {
      clearError();

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to delete workspace');
      }

      // Clear local state
      setWorkspace(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workspace';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workspaceId, clearError]);

  // Permission helpers
  const canRead = workspace?.user_permissions?.read ?? false;
  const canWrite = workspace?.user_permissions?.write ?? false;
  const canDelete = workspace?.user_permissions?.delete ?? false;
  const canAdmin = workspace?.user_permissions?.admin ?? false;
  const isOwner = workspace?.user_role === 'owner';
  const isAdmin = workspace?.user_role === 'admin';
  const isMember = workspace?.user_role === 'member';

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  // Real-time updates via Supabase subscriptions
  useEffect(() => {
    if (!autoRefresh || !workspaceId) return;

    let mounted = true;

    const setupSubscriptions = async () => {
      try {
        // Get current user for filtering
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Subscribe to workspace changes
        const workspaceSubscription = supabase
          .channel(`workspace_${workspaceId}_changes`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'workspaces',
              filter: `id=eq.${workspaceId}`,
            },
            async (payload) => {
              if (!mounted) return;
              
              if (payload.eventType === 'DELETE' || payload.new?.is_deleted) {
                setWorkspace(null);
              } else {
                await fetchWorkspace();
              }
            }
          )
          .subscribe();

        // Subscribe to workspace member changes
        const membersSubscription = supabase
          .channel(`workspace_${workspaceId}_members_changes`)
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'workspace_members',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            async () => {
              if (mounted) {
                await fetchWorkspace();
              }
            }
          )
          .subscribe();

        // Subscribe to section changes
        const sectionsSubscription = supabase
          .channel(`workspace_${workspaceId}_sections_changes`)
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'sections',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            async () => {
              if (mounted) {
                await fetchWorkspace();
              }
            }
          )
          .subscribe();

        return () => {
          workspaceSubscription.unsubscribe();
          membersSubscription.unsubscribe();
          sectionsSubscription.unsubscribe();
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
  }, [autoRefresh, workspaceId, fetchWorkspace]);

  return {
    workspace,
    loading,
    error,
    
    // Actions
    refetch: fetchWorkspace,
    updateWorkspace,
    deleteWorkspace,
    
    // Permission helpers
    canRead,
    canWrite,
    canDelete,
    canAdmin,
    isOwner,
    isAdmin,
    isMember,
  };
};