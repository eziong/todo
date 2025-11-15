// =============================================
// INDIVIDUAL WORKSPACE API ROUTES
// =============================================
// Handles specific workspace operations (GET, PUT, DELETE)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { 
  Workspace, 
  WorkspaceUpdate, 
  ApiResponse 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

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

// GET /api/workspaces/[id] - Get specific workspace with details
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: workspaceId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if user has read permission for workspace
    const { allowed, member } = await checkWorkspacePermission(supabase, user.id, workspaceId, 'read');
    
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Forbidden - insufficient permissions', status: 403 } satisfies ApiResponse<null>,
        { status: 403 }
      );
    }

    // Get workspace details
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members!inner (
          id,
          user_id,
          role,
          permissions,
          last_active_at,
          user:users!inner (
            id,
            name,
            email,
            avatar_url
          )
        ),
        sections (
          id,
          name,
          description,
          position,
          color,
          is_archived,
          created_at,
          updated_at
        )
      `)
      .eq('id', workspaceId)
      .eq('is_deleted', false)
      .single();

    if (workspaceError) {
      if (workspaceError.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Workspace not found', status: 404 } satisfies ApiResponse<null>,
          { status: 404 }
        );
      }

      console.error('Error fetching workspace:', workspaceError);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Get member count
    const { count: memberCount, error: countError } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    if (countError) {
      console.error('Error counting members:', countError);
    }

    // Transform the response
    const responseData = {
      ...workspace,
      user_role: member?.role || 'viewer',
      user_permissions: member?.permissions || { read: true, write: false, delete: false, admin: false },
      member_count: memberCount || 0,
      members: workspace.workspace_members?.map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        permissions: m.permissions,
        last_active_at: m.last_active_at,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatar_url: m.user.avatar_url,
        },
      })) || [],
      sections: (workspace.sections || [])
        .filter((s: any) => !s.is_archived) // Only show active sections by default
        .sort((a: any, b: any) => a.position - b.position),
    };

    // Remove the nested workspace_members since we've transformed it
    delete responseData.workspace_members;

    return NextResponse.json(
      { data: responseData, error: null, status: 200 } satisfies ApiResponse<typeof responseData>
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/workspaces/[id]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[id] - Update workspace
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: workspaceId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if user has write permission for workspace
    const { allowed } = await checkWorkspacePermission(supabase, user.id, workspaceId, 'write');
    
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Forbidden - insufficient permissions', status: 403 } satisfies ApiResponse<null>,
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { data: null, error: 'Workspace name cannot be empty', status: 400 } satisfies ApiResponse<null>,
          { status: 400 }
        );
      }

      if (body.name.trim().length > 100) {
        return NextResponse.json(
          { data: null, error: 'Workspace name must be less than 100 characters', status: 400 } satisfies ApiResponse<null>,
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: WorkspaceUpdate = {};

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.color !== undefined) {
      updateData.color = body.color;
    }

    if (body.icon !== undefined) {
      updateData.icon = body.icon;
    }

    if (body.settings !== undefined) {
      updateData.settings = body.settings;
    }

    // Only proceed if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { data: null, error: 'No valid fields to update', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Update workspace
    const { data: workspace, error: updateError } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', workspaceId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating workspace:', updateError);
      return NextResponse.json(
        { data: null, error: 'Failed to update workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: workspace, error: null, status: 200 } satisfies ApiResponse<Workspace>
    );
  } catch (error) {
    console.error('Unexpected error in PUT /api/workspaces/[id]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Soft delete workspace
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: workspaceId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if user has delete permission (typically only owners)
    const { allowed, member } = await checkWorkspacePermission(supabase, user.id, workspaceId, 'delete');
    
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Forbidden - only workspace owners can delete workspaces', status: 403 } satisfies ApiResponse<null>,
        { status: 403 }
      );
    }

    // Additional check: Only owners should be able to delete workspaces
    if (member?.role !== 'owner') {
      return NextResponse.json(
        { data: null, error: 'Forbidden - only workspace owners can delete workspaces', status: 403 } satisfies ApiResponse<null>,
        { status: 403 }
      );
    }

    // Check if workspace exists and is not already deleted
    const { data: workspace, error: checkError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', workspaceId)
      .eq('is_deleted', false)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Workspace not found', status: 404 } satisfies ApiResponse<null>,
          { status: 404 }
        );
      }

      console.error('Error checking workspace:', checkError);
      return NextResponse.json(
        { data: null, error: 'Failed to check workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Soft delete workspace (this will cascade to sections and tasks via database triggers)
    const { error: deleteError } = await supabase
      .from('workspaces')
      .update({ is_deleted: true })
      .eq('id', workspaceId);

    if (deleteError) {
      console.error('Error deleting workspace:', deleteError);
      return NextResponse.json(
        { data: null, error: 'Failed to delete workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { id: workspaceId, deleted: true }, error: null, status: 200 } satisfies ApiResponse<{ id: string; deleted: boolean }>
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/workspaces/[id]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}