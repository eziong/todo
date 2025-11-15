// =============================================
// WORKSPACE MEMBERS CONTAINER HOOK
// =============================================
// Container logic for workspace member management

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { 
  WorkspaceMember, 
  WorkspaceMemberUpdate,
  WorkspaceMemberRole,
  WorkspacePermissions,
  User,
  PaginatedResponse,
  ApiResponse 
} from '@/database/types';

export interface WorkspaceMemberWithUser {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceMemberRole;
  permissions: WorkspacePermissions;
  invited_by_user_id: string | null;
  invitation_accepted_at: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  invited_by: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface UseWorkspaceMembersOptions {
  page?: number;
  limit?: number;
  role?: WorkspaceMemberRole;
  search?: string;
  autoRefresh?: boolean;
}

export interface UseWorkspaceMembersReturn {
  members: WorkspaceMemberWithUser[];
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
  addMember: (email: string, role?: WorkspaceMemberRole, permissions?: WorkspacePermissions) => Promise<WorkspaceMemberWithUser>;
  updateMember: (userId: string, data: { role?: WorkspaceMemberRole; permissions?: WorkspacePermissions }) => Promise<WorkspaceMemberWithUser>;
  removeMember: (userId: string) => Promise<void>;
  
  // Pagination
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  
  // Filters
  setRole: (role: WorkspaceMemberRole | null) => void;
  setSearch: (search: string) => void;
  
  // Helpers
  getMember: (userId: string) => WorkspaceMemberWithUser | null;
  getMembersByRole: (role: WorkspaceMemberRole) => WorkspaceMemberWithUser[];
  getOwners: () => WorkspaceMemberWithUser[];
  getAdmins: () => WorkspaceMemberWithUser[];
}

/**
 * Hook for managing workspace members
 * Provides member listing, adding, updating, and removing functionality
 */
export const useWorkspaceMembers = (
  workspaceId: string | undefined,
  options: UseWorkspaceMembersOptions = {}
): UseWorkspaceMembersReturn => {
  const {
    page: initialPage = 1,
    limit = 20,
    role: initialRole,
    search: initialSearch = '',
    autoRefresh = true,
  } = options;

  const [members, setMembers] = useState<WorkspaceMemberWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseWorkspaceMembersReturn['pagination']>(null);
  
  // Query parameters
  const [page, setPage] = useState(initialPage);
  const [role, setRole] = useState<WorkspaceMemberRole | null>(initialRole || null);
  const [search, setSearch] = useState(initialSearch);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Fetch members from API
  const fetchMembers = useCallback(async (): Promise<void> => {
    if (!workspaceId) {
      setMembers([]);
      setPagination(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      clearError();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (role) {
        params.append('role', role);
      }

      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/workspaces/${workspaceId}/members?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to fetch workspace members');
      }

      const data = await response.json() as PaginatedResponse<WorkspaceMemberWithUser>;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMembers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workspace members';
      setError(errorMessage);
      setMembers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, page, limit, role, search, clearError]);

  // Add member to workspace
  const addMember = useCallback(async (
    email: string, 
    memberRole: WorkspaceMemberRole = 'member', 
    permissions?: WorkspacePermissions
  ): Promise<WorkspaceMemberWithUser> => {
    if (!workspaceId) {
      throw new Error('No workspace ID provided');
    }

    try {
      clearError();

      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          role: memberRole,
          permissions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to add member to workspace');
      }

      const result = await response.json() as ApiResponse<WorkspaceMemberWithUser>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to add member to workspace');
      }

      // Add the new member to the current list
      setMembers(prev => [result.data!, ...prev]);
      
      // Refetch to get updated pagination
      await fetchMembers();

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add member to workspace';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workspaceId, clearError, fetchMembers]);

  // Update member role/permissions
  const updateMember = useCallback(async (
    userId: string, 
    data: { role?: WorkspaceMemberRole; permissions?: WorkspacePermissions }
  ): Promise<WorkspaceMemberWithUser> => {
    if (!workspaceId) {
      throw new Error('No workspace ID provided');
    }

    try {
      clearError();

      const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to update workspace member');
      }

      const result = await response.json() as ApiResponse<WorkspaceMemberWithUser>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to update workspace member');
      }

      // Update the member in the current list
      setMembers(prev => prev.map(member => 
        member.user_id === userId ? result.data! : member
      ));

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workspace member';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workspaceId, clearError]);

  // Remove member from workspace
  const removeMember = useCallback(async (userId: string): Promise<void> => {
    if (!workspaceId) {
      throw new Error('No workspace ID provided');
    }

    try {
      clearError();

      const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to remove member from workspace');
      }

      // Remove member from current list
      setMembers(prev => prev.filter(member => member.user_id !== userId));
      
      // Refetch to get updated pagination
      await fetchMembers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member from workspace';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workspaceId, clearError, fetchMembers]);

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

  // Filter actions
  const setRoleWithReset = useCallback((newRole: WorkspaceMemberRole | null): void => {
    setRole(newRole);
    setPage(1); // Reset to first page when changing filter
  }, []);

  const setSearchWithReset = useCallback((newSearch: string): void => {
    setSearch(newSearch);
    setPage(1); // Reset to first page when searching
  }, []);

  // Helper functions
  const getMember = useCallback((userId: string): WorkspaceMemberWithUser | null => {
    return members.find(member => member.user_id === userId) || null;
  }, [members]);

  const getMembersByRole = useCallback((targetRole: WorkspaceMemberRole): WorkspaceMemberWithUser[] => {
    return members.filter(member => member.role === targetRole);
  }, [members]);

  const getOwners = useCallback((): WorkspaceMemberWithUser[] => {
    return getMembersByRole('owner');
  }, [getMembersByRole]);

  const getAdmins = useCallback((): WorkspaceMemberWithUser[] => {
    return getMembersByRole('admin');
  }, [getMembersByRole]);

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Real-time updates via Supabase subscriptions
  useEffect(() => {
    if (!autoRefresh || !workspaceId) return;

    let mounted = true;

    const setupSubscriptions = async () => {
      try {
        // Subscribe to workspace member changes
        const membersSubscription = supabase
          .channel(`workspace_${workspaceId}_members_management`)
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'workspace_members',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            async () => {
              if (mounted) {
                await fetchMembers();
              }
            }
          )
          .subscribe();

        // Subscribe to user changes that might affect member display
        const usersSubscription = supabase
          .channel(`workspace_${workspaceId}_users_updates`)
          .on('postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
            },
            async (payload) => {
              if (mounted && payload.new) {
                // Check if this user is a member of current workspace
                const memberExists = members.some(member => member.user_id === payload.new.id);
                if (memberExists) {
                  await fetchMembers();
                }
              }
            }
          )
          .subscribe();

        return () => {
          membersSubscription.unsubscribe();
          usersSubscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up workspace members subscriptions:', err);
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
  }, [autoRefresh, workspaceId, members, fetchMembers]);

  return {
    members,
    loading,
    error,
    pagination,
    
    // Actions
    refetch: fetchMembers,
    addMember,
    updateMember,
    removeMember,
    
    // Pagination
    nextPage,
    prevPage,
    goToPage,
    
    // Filters
    setRole: setRoleWithReset,
    setSearch: setSearchWithReset,
    
    // Helpers
    getMember,
    getMembersByRole,
    getOwners,
    getAdmins,
  };
};