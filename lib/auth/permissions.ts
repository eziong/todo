// =============================================
// AUTHORIZATION PERMISSIONS UTILITIES
// =============================================
// Utilities for checking workspace permissions and roles

import { createClient } from '@/lib/supabase/server';
import type { 
  WorkspacePermissions,
  WorkspaceMemberRole,
  User 
} from '@/database/types';

export interface PermissionCheckResult {
  allowed: boolean;
  member: {
    role: WorkspaceMemberRole;
    permissions: WorkspacePermissions;
  } | null;
  reason?: string;
}

export interface AuthContext {
  user: User;
  supabase: any;
}

// Default workspace permissions for different roles
export const DEFAULT_PERMISSIONS: Record<WorkspaceMemberRole, WorkspacePermissions> = {
  owner: { read: true, write: true, delete: true, admin: true },
  admin: { read: true, write: true, delete: false, admin: true },
  member: { read: true, write: true, delete: false, admin: false },
  viewer: { read: true, write: false, delete: false, admin: false },
};

/**
 * Check if user has specific permission for workspace
 */
export async function checkWorkspacePermission(
  supabase: any,
  userId: string, 
  workspaceId: string, 
  requiredPermission: keyof WorkspacePermissions
): Promise<PermissionCheckResult> {
  try {
    const { data: member, error } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (error || !member) {
      return { 
        allowed: false, 
        member: null,
        reason: 'User is not a member of this workspace'
      };
    }

    const hasPermission = member.permissions[requiredPermission] === true;
    
    return { 
      allowed: hasPermission, 
      member: {
        role: member.role,
        permissions: member.permissions,
      },
      reason: hasPermission ? undefined : `Missing ${requiredPermission} permission`
    };
  } catch (error) {
    return { 
      allowed: false, 
      member: null,
      reason: 'Failed to check permissions'
    };
  }
}

/**
 * Check if user has specific role for workspace
 */
export async function checkWorkspaceRole(
  supabase: any,
  userId: string, 
  workspaceId: string, 
  requiredRole: WorkspaceMemberRole | WorkspaceMemberRole[]
): Promise<PermissionCheckResult> {
  try {
    const { data: member, error } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (error || !member) {
      return { 
        allowed: false, 
        member: null,
        reason: 'User is not a member of this workspace'
      };
    }

    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRole = allowedRoles.includes(member.role);
    
    return { 
      allowed: hasRole, 
      member: {
        role: member.role,
        permissions: member.permissions,
      },
      reason: hasRole ? undefined : `Role ${member.role} not in required roles: ${allowedRoles.join(', ')}`
    };
  } catch (error) {
    return { 
      allowed: false, 
      member: null,
      reason: 'Failed to check role'
    };
  }
}

/**
 * Check if user can manage another user (for member management operations)
 */
export async function canManageUser(
  supabase: any,
  currentUserId: string,
  workspaceId: string,
  targetUserId: string,
  targetRole?: WorkspaceMemberRole
): Promise<PermissionCheckResult> {
  try {
    // Get current user's permissions
    const currentUserCheck = await checkWorkspacePermission(
      supabase, 
      currentUserId, 
      workspaceId, 
      'admin'
    );

    if (!currentUserCheck.allowed || !currentUserCheck.member) {
      return {
        allowed: false,
        member: null,
        reason: 'Current user lacks admin permissions'
      };
    }

    const currentUserRole = currentUserCheck.member.role;

    // Prevent self-modification for critical operations
    if (currentUserId === targetUserId) {
      // Can't demote yourself from owner if you're the last owner
      if (currentUserRole === 'owner' && targetRole && targetRole !== 'owner') {
        const { count: ownerCount } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('role', 'owner');

        if (ownerCount <= 1) {
          return {
            allowed: false,
            member: currentUserCheck.member,
            reason: 'Cannot demote the last owner'
          };
        }
      }
    }

    // Only owners can manage owners or promote to owner
    if (targetRole === 'owner' && currentUserRole !== 'owner') {
      return {
        allowed: false,
        member: currentUserCheck.member,
        reason: 'Only workspace owners can manage owner role'
      };
    }

    // Get target user's current role if modifying existing member
    if (targetUserId !== currentUserId) {
      const { data: targetMember } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', targetUserId)
        .single();

      // Only owners can manage other owners
      if (targetMember?.role === 'owner' && currentUserRole !== 'owner') {
        return {
          allowed: false,
          member: currentUserCheck.member,
          reason: 'Only workspace owners can manage other owners'
        };
      }
    }

    return {
      allowed: true,
      member: currentUserCheck.member
    };
  } catch (error) {
    return { 
      allowed: false, 
      member: null,
      reason: 'Failed to check user management permissions'
    };
  }
}

/**
 * Ensure user is authenticated and return user context
 */
export async function requireAuth(): Promise<{ user: User; supabase: any } | null> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return null;
    }

    // Get full user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return null;
    }

    return { user, supabase };
  } catch (error) {
    return null;
  }
}

/**
 * Check if workspace exists and is not deleted
 */
export async function checkWorkspaceExists(
  supabase: any,
  workspaceId: string
): Promise<{ exists: boolean; workspace?: any; reason?: string }> {
  try {
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('id, name, is_deleted')
      .eq('id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { exists: false, reason: 'Workspace not found' };
      }
      return { exists: false, reason: 'Failed to check workspace' };
    }

    if (workspace.is_deleted) {
      return { exists: false, reason: 'Workspace has been deleted' };
    }

    return { exists: true, workspace };
  } catch (error) {
    return { exists: false, reason: 'Failed to check workspace' };
  }
}

/**
 * Check if user exists in the system
 */
export async function checkUserExists(
  supabase: any,
  email: string
): Promise<{ exists: boolean; user?: any; reason?: string }> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { exists: false, reason: 'User not found. The user must be registered on the platform first.' };
      }
      return { exists: false, reason: 'Failed to check user' };
    }

    return { exists: true, user };
  } catch (error) {
    return { exists: false, reason: 'Failed to check user' };
  }
}

/**
 * Validate workspace ownership change
 */
export async function validateOwnershipTransfer(
  supabase: any,
  workspaceId: string,
  currentOwnerId: string,
  newOwnerId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Count current owners
    const { count: ownerCount, error: countError } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('role', 'owner');

    if (countError) {
      return { allowed: false, reason: 'Failed to validate ownership transfer' };
    }

    // If removing owner role and they're the last owner
    if (ownerCount <= 1 && !newOwnerId) {
      return { 
        allowed: false, 
        reason: 'Cannot remove the last owner. Transfer ownership first or delete the workspace.'
      };
    }

    // If adding new owner, check they're a member
    if (newOwnerId) {
      const { data: newOwnerMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', newOwnerId)
        .single();

      if (!newOwnerMember) {
        return { 
          allowed: false, 
          reason: 'New owner must be a member of the workspace first'
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    return { allowed: false, reason: 'Failed to validate ownership transfer' };
  }
}