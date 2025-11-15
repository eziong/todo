// =============================================
// WORKSPACE PERMISSIONS CONTAINER HOOK
// =============================================
// Container logic for workspace permission checking and management

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/Auth/useAuth';
import type { 
  WorkspacePermissions,
  WorkspaceMemberRole,
  ApiResponse 
} from '@/database/types';

export interface WorkspacePermissionData {
  role: WorkspaceMemberRole | null;
  permissions: WorkspacePermissions | null;
  isMember: boolean;
}

export interface UseWorkspacePermissionsReturn {
  // Permission data
  role: WorkspaceMemberRole | null;
  permissions: WorkspacePermissions | null;
  isMember: boolean;
  loading: boolean;
  error: string | null;
  
  // Permission checks
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canAdmin: boolean;
  
  // Role checks
  isOwner: boolean;
  isAdmin: boolean;
  isMemberRole: boolean;
  isViewer: boolean;
  
  // Action permissions
  canCreateSections: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangeRoles: boolean;
  canDeleteWorkspace: boolean;
  canModifySettings: boolean;
  
  // Actions
  refetch: () => Promise<void>;
  
  // Helpers
  hasPermission: (permission: keyof WorkspacePermissions) => boolean;
  hasRole: (requiredRole: WorkspaceMemberRole | WorkspaceMemberRole[]) => boolean;
  canManageUser: (targetUserId: string, targetRole?: WorkspaceMemberRole) => boolean;
}

/**
 * Hook for workspace permission checking and management
 * Provides comprehensive permission checking for workspace operations
 */
export const useWorkspacePermissions = (
  workspaceId: string | undefined
): UseWorkspacePermissionsReturn => {
  const { user } = useAuth();
  
  const [permissionData, setPermissionData] = useState<WorkspacePermissionData>({
    role: null,
    permissions: null,
    isMember: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Fetch permission data from API or direct database query
  const fetchPermissions = useCallback(async (): Promise<void> => {
    if (!workspaceId || !user?.id) {
      setPermissionData({
        role: null,
        permissions: null,
        isMember: false,
      });
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      clearError();

      // Query workspace member data directly from Supabase
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('role, permissions')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (memberError) {
        if (memberError.code === 'PGRST116') {
          // User is not a member
          setPermissionData({
            role: null,
            permissions: null,
            isMember: false,
          });
          return;
        }
        throw memberError;
      }

      setPermissionData({
        role: memberData.role,
        permissions: memberData.permissions,
        isMember: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch permissions';
      setError(errorMessage);
      setPermissionData({
        role: null,
        permissions: null,
        isMember: false,
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user?.id, clearError]);

  // Basic permission checks
  const canRead = useMemo(() => 
    permissionData.permissions?.read ?? false, 
    [permissionData.permissions]
  );
  
  const canWrite = useMemo(() => 
    permissionData.permissions?.write ?? false, 
    [permissionData.permissions]
  );
  
  const canDelete = useMemo(() => 
    permissionData.permissions?.delete ?? false, 
    [permissionData.permissions]
  );
  
  const canAdmin = useMemo(() => 
    permissionData.permissions?.admin ?? false, 
    [permissionData.permissions]
  );

  // Role checks
  const isOwner = useMemo(() => 
    permissionData.role === 'owner', 
    [permissionData.role]
  );
  
  const isAdmin = useMemo(() => 
    permissionData.role === 'admin', 
    [permissionData.role]
  );
  
  const isMemberRole = useMemo(() => 
    permissionData.role === 'member', 
    [permissionData.role]
  );
  
  const isViewer = useMemo(() => 
    permissionData.role === 'viewer', 
    [permissionData.role]
  );

  // Action-specific permissions
  const canCreateSections = useMemo(() => 
    canWrite && (isOwner || isAdmin || isMemberRole), 
    [canWrite, isOwner, isAdmin, isMemberRole]
  );
  
  const canCreateTasks = useMemo(() => 
    canWrite, 
    [canWrite]
  );
  
  const canEditTasks = useMemo(() => 
    canWrite, 
    [canWrite]
  );
  
  const canDeleteTasks = useMemo(() => 
    canDelete || (canWrite && (isOwner || isAdmin)), 
    [canDelete, canWrite, isOwner, isAdmin]
  );
  
  const canAssignTasks = useMemo(() => 
    canWrite && (isOwner || isAdmin || isMemberRole), 
    [canWrite, isOwner, isAdmin, isMemberRole]
  );
  
  const canInviteMembers = useMemo(() => 
    canAdmin, 
    [canAdmin]
  );
  
  const canRemoveMembers = useMemo(() => 
    canAdmin, 
    [canAdmin]
  );
  
  const canChangeRoles = useMemo(() => 
    canAdmin, 
    [canAdmin]
  );
  
  const canDeleteWorkspace = useMemo(() => 
    isOwner, 
    [isOwner]
  );
  
  const canModifySettings = useMemo(() => 
    canAdmin, 
    [canAdmin]
  );

  // Permission checking helper
  const hasPermission = useCallback((permission: keyof WorkspacePermissions): boolean => {
    return permissionData.permissions?.[permission] ?? false;
  }, [permissionData.permissions]);

  // Role checking helper
  const hasRole = useCallback((requiredRole: WorkspaceMemberRole | WorkspaceMemberRole[]): boolean => {
    if (!permissionData.role) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(permissionData.role);
    }
    
    return permissionData.role === requiredRole;
  }, [permissionData.role]);

  // User management permission helper
  const canManageUser = useCallback((targetUserId: string, targetRole?: WorkspaceMemberRole): boolean => {
    // Cannot manage yourself for some operations
    if (targetUserId === user?.id && (targetRole === 'owner' || !targetRole)) {
      return false;
    }

    // Only admins and owners can manage users
    if (!canAdmin) {
      return false;
    }

    // Only owners can manage owners or promote to owner
    if (targetRole === 'owner' || (targetRole && !isOwner)) {
      return isOwner;
    }

    return true;
  }, [user?.id, canAdmin, isOwner]);

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Real-time updates via Supabase subscriptions
  useEffect(() => {
    if (!workspaceId || !user?.id) return;

    let mounted = true;

    const setupSubscriptions = async () => {
      try {
        // Subscribe to workspace member changes for current user
        const memberSubscription = supabase
          .channel(`workspace_${workspaceId}_permissions_${user.id}`)
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'workspace_members',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            async (payload) => {
              if (!mounted) return;
              
              // Check if this affects the current user
              const newPayload = payload.new as any;
              const oldPayload = payload.old as any;
              const affectedUserId = newPayload?.user_id || oldPayload?.user_id;
              if (affectedUserId === user.id) {
                await fetchPermissions();
              }
            }
          )
          .subscribe();

        return () => {
          memberSubscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up permission subscriptions:', err);
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
  }, [workspaceId, user?.id, fetchPermissions]);

  return {
    // Permission data
    role: permissionData.role,
    permissions: permissionData.permissions,
    isMember: permissionData.isMember,
    loading,
    error,
    
    // Permission checks
    canRead,
    canWrite,
    canDelete,
    canAdmin,
    
    // Role checks
    isOwner,
    isAdmin,
    isMemberRole,
    isViewer,
    
    // Action permissions
    canCreateSections,
    canCreateTasks,
    canEditTasks,
    canDeleteTasks,
    canAssignTasks,
    canInviteMembers,
    canRemoveMembers,
    canChangeRoles,
    canDeleteWorkspace,
    canModifySettings,
    
    // Actions
    refetch: fetchPermissions,
    
    // Helpers
    hasPermission,
    hasRole,
    canManageUser,
  };
};