// =============================================
// WORKSPACES API ROUTES
// =============================================
// Handles workspace CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { 
  Workspace, 
  WorkspaceInsert, 
  WorkspaceMember, 
  WorkspaceMemberInsert,
  WorkspacePermissions,
  ApiResponse, 
  PaginatedResponse 
} from '@/database/types';

// Default workspace permissions for different roles
const DEFAULT_PERMISSIONS: Record<string, WorkspacePermissions> = {
  owner: { read: true, write: true, delete: true, admin: true },
  admin: { read: true, write: true, delete: false, admin: true },
  member: { read: true, write: true, delete: false, admin: false },
  viewer: { read: true, write: false, delete: false, admin: false },
};

// GET /api/workspaces - List user's workspaces
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const search = url.searchParams.get('search');
    const includeDeleted = url.searchParams.get('include_deleted') === 'true';

    // Build query for workspaces accessible to user
    let query = supabase
      .from('workspace_members')
      .select(`
        workspace:workspaces!inner (
          id,
          name,
          description,
          owner_id,
          color,
          icon,
          settings,
          created_at,
          updated_at,
          is_deleted
        ),
        role,
        permissions,
        last_active_at
      `)
      .eq('user_id', user.id);

    // Filter out deleted workspaces unless explicitly requested
    if (!includeDeleted) {
      query = query.eq('workspace.is_deleted', false);
    }

    // Add search filter if provided
    if (search) {
      query = query.ilike('workspace.name', `%${search}%`);
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to).order('last_active_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching workspaces:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch workspaces', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Transform data to include workspace details and user's role
    const workspaces = data?.map(item => ({
      ...item.workspace,
      user_role: item.role,
      user_permissions: item.permissions,
      last_active_at: item.last_active_at,
    })) || [];

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<typeof workspaces[0]> = {
      data: workspaces,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      error: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/workspaces:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: 'Workspace name is required', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    if (body.name.trim().length > 100) {
      return NextResponse.json(
        { data: null, error: 'Workspace name must be less than 100 characters', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Prepare workspace data
    const workspaceData: WorkspaceInsert = {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      owner_id: user.id,
      color: body.color || '#3B82F6', // Default to blue
      icon: body.icon || null,
      settings: body.settings || {
        features: {
          time_tracking: true,
          file_attachments: true,
          due_date_reminders: true,
          task_templates: false,
        },
        integrations: {
          calendar: false,
          slack: false,
          email: true,
        },
        security: {
          require_task_approval: false,
          restrict_member_invites: false,
        },
      },
    };

    // Create workspace in transaction
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert(workspaceData)
      .select()
      .single();

    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError);
      return NextResponse.json(
        { data: null, error: 'Failed to create workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Add creator as owner member
    const memberData: WorkspaceMemberInsert = {
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
      permissions: DEFAULT_PERMISSIONS.owner,
      invitation_accepted_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };

    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert(memberData);

    if (memberError) {
      // Rollback workspace creation if member creation fails
      await supabase
        .from('workspaces')
        .update({ is_deleted: true })
        .eq('id', workspace.id);

      console.error('Error creating workspace member:', memberError);
      return NextResponse.json(
        { data: null, error: 'Failed to create workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Return workspace with user role information
    const responseData = {
      ...workspace,
      user_role: 'owner',
      user_permissions: DEFAULT_PERMISSIONS.owner,
      last_active_at: new Date().toISOString(),
    };

    return NextResponse.json(
      { data: responseData, error: null, status: 201 } satisfies ApiResponse<typeof responseData>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/workspaces:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}