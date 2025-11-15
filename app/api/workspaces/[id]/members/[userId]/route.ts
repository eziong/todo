// =============================================
// INDIVIDUAL WORKSPACE MEMBER API ROUTES
// =============================================
// Handles individual workspace member operations (PUT, DELETE)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { 
  WorkspaceMemberUpdate,
  WorkspacePermissions,
  WorkspaceMemberRole,
  ApiResponse 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
    userId: string;
  }>;
}

// Default workspace permissions for different roles
const DEFAULT_PERMISSIONS: Record<WorkspaceMemberRole, WorkspacePermissions> = {
  owner: { read: true, write: true, delete: true, admin: true },
  admin: { read: true, write: true, delete: false, admin: true },
  member: { read: true, write: true, delete: false, admin: false },
  viewer: { read: true, write: false, delete: false, admin: false },
};

// Helper function to check user permissions for workspace
async function checkWorkspacePermission(
  supabase: any,
  userId: string, 
  workspaceId: string, 
  requiredPermission: 'read' | 'write' | 'delete' | 'admin'
) {
  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('role, permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (error || !member) {
    return { allowed: false, member: null };
  }

  const hasPermission = member.permissions[requiredPermission] === true;
  return { allowed: hasPermission, member };
}

// PUT /api/workspaces/[id]/members/[userId] - Update member role/permissions
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: workspaceId, userId: targetUserId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if user has admin permission for workspace
    const { allowed, member: currentMember } = await checkWorkspacePermission(supabase, user.id, workspaceId, 'admin');
    
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Forbidden - admin permissions required to update members', status: 403 } satisfies ApiResponse<null>,
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Check if target member exists
    const { data: targetMember, error: memberError } = await supabase
      .from('workspace_members')
      .select(`
        id,
        workspace_id,
        user_id,
        role,
        permissions,
        user:users!inner (
          id,
          name,
          email
        )
      `)
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId)
      .single();

    if (memberError || !targetMember) {
      return NextResponse.json(
        { data: null, error: 'Member not found in workspace', status: 404 } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    // Validate role if provided
    const newRole = body.role as WorkspaceMemberRole | undefined;
    if (newRole && !['owner', 'admin', 'member', 'viewer'].includes(newRole)) {
      return NextResponse.json(
        { data: null, error: 'Invalid role. Must be one of: owner, admin, member, viewer', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Special rules for role changes
    if (newRole) {
      // Only owners can promote to owner
      if (newRole === 'owner' && currentMember?.role !== 'owner') {
        return NextResponse.json(
          { data: null, error: 'Only workspace owners can promote members to owner', status: 403 } satisfies ApiResponse<null>,
          { status: 403 }
        );
      }

      // Prevent demoting the last owner
      if (targetMember.role === 'owner' && newRole !== 'owner') {
        const { count: ownerCount, error: countError } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('role', 'owner');

        if (countError) {
          console.error('Error counting owners:', countError);
          return NextResponse.json(
            { data: null, error: 'Failed to validate ownership transfer', status: 500 } satisfies ApiResponse<null>,
            { status: 500 }
          );
        }

        if ((ownerCount ?? 0) <= 1) {
          return NextResponse.json(
            { data: null, error: 'Cannot demote the last owner. Promote another member to owner first.', status: 409 } satisfies ApiResponse<null>,
            { status: 409 }
          );
        }
      }

      // Prevent self-demotion from owner (unless there are other owners)
      if (user.id === targetUserId && currentMember?.role === 'owner' && newRole !== 'owner') {
        const { count: ownerCount, error: countError } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('role', 'owner');

        if (countError) {
          console.error('Error counting owners:', countError);
          return NextResponse.json(
            { data: null, error: 'Failed to validate ownership transfer', status: 500 } satisfies ApiResponse<null>,
            { status: 500 }
          );
        }

        if ((ownerCount ?? 0) <= 1) {
          return NextResponse.json(
            { data: null, error: 'You cannot demote yourself as the sole owner', status: 409 } satisfies ApiResponse<null>,
            { status: 409 }
          );
        }
      }
    }

    // Prepare update data
    const updateData: WorkspaceMemberUpdate = {};

    if (newRole) {
      updateData.role = newRole;
      // If role is changing, also update default permissions unless custom permissions provided
      if (!body.permissions) {
        updateData.permissions = DEFAULT_PERMISSIONS[newRole];
      }
    }

    if (body.permissions) {
      // Validate permissions structure
      const permissions = body.permissions as WorkspacePermissions;
      if (typeof permissions.read !== 'boolean' ||
          typeof permissions.write !== 'boolean' ||
          typeof permissions.delete !== 'boolean' ||
          typeof permissions.admin !== 'boolean') {
        return NextResponse.json(
          { data: null, error: 'Invalid permissions format', status: 400 } satisfies ApiResponse<null>,
          { status: 400 }
        );
      }
      updateData.permissions = permissions;
    }

    // Only proceed if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { data: null, error: 'No valid fields to update', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Update workspace member
    const { data: updatedMember, error: updateError } = await supabase
      .from('workspace_members')
      .update(updateData)
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId)
      .select(`
        id,
        workspace_id,
        user_id,
        role,
        permissions,
        invited_by_user_id,
        invitation_accepted_at,
        last_active_at,
        created_at,
        updated_at,
        user:users!inner (
          id,
          name,
          email,
          avatar_url
        ),
        invited_by:users!workspace_members_invited_by_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating workspace member:', updateError);
      return NextResponse.json(
        { data: null, error: 'Failed to update workspace member', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: updatedMember, error: null, status: 200 } satisfies ApiResponse<typeof updatedMember>
    );
  } catch (error) {
    console.error('Unexpected error in PUT /api/workspaces/[id]/members/[userId]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id]/members/[userId] - Remove member from workspace
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: workspaceId, userId: targetUserId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if target member exists
    const { data: targetMember, error: memberError } = await supabase
      .from('workspace_members')
      .select('id, role, user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId)
      .single();

    if (memberError || !targetMember) {
      return NextResponse.json(
        { data: null, error: 'Member not found in workspace', status: 404 } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    // Check permissions - either admin permission OR removing oneself
    const { allowed, member: currentMember } = await checkWorkspacePermission(supabase, user.id, workspaceId, 'admin');
    const isSelfRemoval = user.id === targetUserId;
    
    if (!allowed && !isSelfRemoval) {
      return NextResponse.json(
        { data: null, error: 'Forbidden - admin permissions required to remove members', status: 403 } satisfies ApiResponse<null>,
        { status: 403 }
      );
    }

    // Prevent removing the last owner
    if (targetMember.role === 'owner') {
      const { count: ownerCount, error: countError } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('role', 'owner');

      if (countError) {
        console.error('Error counting owners:', countError);
        return NextResponse.json(
          { data: null, error: 'Failed to validate ownership transfer', status: 500 } satisfies ApiResponse<null>,
          { status: 500 }
        );
      }

      if ((ownerCount ?? 0) <= 1) {
        return NextResponse.json(
          { data: null, error: 'Cannot remove the last owner. Transfer ownership first or delete the workspace.', status: 409 } satisfies ApiResponse<null>,
          { status: 409 }
        );
      }
    }

    // Additional check for self-removal: warn if removing last admin
    if (isSelfRemoval && currentMember?.role === 'admin') {
      const { count: adminCount, error: countError } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .in('role', ['owner', 'admin']);

      if (countError) {
        console.error('Error counting admins:', countError);
      } else if ((adminCount ?? 0) <= 1) {
        return NextResponse.json(
          { data: null, error: 'You are the last admin. Consider promoting another member before leaving.', status: 409 } satisfies ApiResponse<null>,
          { status: 409 }
        );
      }
    }

    // Remove member from workspace
    const { error: deleteError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId);

    if (deleteError) {
      console.error('Error removing workspace member:', deleteError);
      return NextResponse.json(
        { data: null, error: 'Failed to remove member from workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { workspace_id: workspaceId, user_id: targetUserId, removed: true }, error: null, status: 200 } satisfies ApiResponse<{ workspace_id: string; user_id: string; removed: boolean }>
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/workspaces/[id]/members/[userId]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}