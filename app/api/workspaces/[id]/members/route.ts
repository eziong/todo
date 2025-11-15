// =============================================
// WORKSPACE MEMBERS API ROUTES
// =============================================
// Handles workspace member management (list and add members)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { 
  WorkspaceMember, 
  WorkspaceMemberInsert,
  WorkspacePermissions,
  WorkspaceMemberRole,
  ApiResponse, 
  PaginatedResponse 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
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

// GET /api/workspaces/[id]/members - List workspace members
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
    const { allowed } = await checkWorkspacePermission(supabase, user.id, workspaceId, 'read');
    
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Forbidden - insufficient permissions', status: 403 } satisfies ApiResponse<null>,
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const role = url.searchParams.get('role') as WorkspaceMemberRole | null;
    const search = url.searchParams.get('search');

    // Build query for workspace members
    let query = supabase
      .from('workspace_members')
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
          avatar_url,
          last_active_at
        ),
        invited_by:users!workspace_members_invited_by_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('workspace_id', workspaceId);

    // Filter by role if specified
    if (role && ['owner', 'admin', 'member', 'viewer'].includes(role)) {
      query = query.eq('role', role);
    }

    // Add search filter if provided (search in user name and email)
    if (search) {
      query = query.or(
        `user.name.ilike.%${search}%,user.email.ilike.%${search}%`
      );
    }

    // Add pagination and ordering
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching workspace members:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch workspace members', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Transform data
    const members = data?.map(member => ({
      id: member.id,
      workspace_id: member.workspace_id,
      user_id: member.user_id,
      role: member.role,
      permissions: member.permissions,
      invited_by_user_id: member.invited_by_user_id,
      invitation_accepted_at: member.invitation_accepted_at,
      last_active_at: member.last_active_at,
      created_at: member.created_at,
      updated_at: member.updated_at,
      user: member.user,
      invited_by: member.invited_by,
    })) || [];

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<typeof members[0]> = {
      data: members,
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
    console.error('Unexpected error in GET /api/workspaces/[id]/members:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/members - Add member to workspace
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

    // Check if user has admin permission for workspace
    const { allowed } = await checkWorkspacePermission(supabase, user.id, workspaceId, 'admin');
    
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Forbidden - admin permissions required to add members', status: 403 } satisfies ApiResponse<null>,
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json(
        { data: null, error: 'User email is required', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const role = (body.role as WorkspaceMemberRole) || 'member';
    
    if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json(
        { data: null, error: 'Invalid role. Must be one of: owner, admin, member, viewer', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Find user by email
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .eq('email', body.email.toLowerCase().trim())
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { data: null, error: 'User not found. The user must be registered on the platform first.', status: 404 } satisfies ApiResponse<null>,
        { status: 404 }
      );
    }

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('workspace_members')
      .select('id, role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUser.id)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('Error checking existing membership:', memberCheckError);
      return NextResponse.json(
        { data: null, error: 'Failed to check membership status', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    if (existingMember) {
      return NextResponse.json(
        { data: null, error: 'User is already a member of this workspace', status: 409 } satisfies ApiResponse<null>,
        { status: 409 }
      );
    }

    // Prevent adding owners unless current user is an owner
    if (role === 'owner') {
      const { member: currentMember } = await checkWorkspacePermission(supabase, user.id, workspaceId, 'admin');
      if (currentMember?.role !== 'owner') {
        return NextResponse.json(
          { data: null, error: 'Only workspace owners can add other owners', status: 403 } satisfies ApiResponse<null>,
          { status: 403 }
        );
      }
    }

    // Prepare member data
    const memberData: WorkspaceMemberInsert = {
      workspace_id: workspaceId,
      user_id: targetUser.id,
      role,
      permissions: body.permissions || DEFAULT_PERMISSIONS[role],
      invited_by_user_id: user.id,
      invitation_accepted_at: new Date().toISOString(), // Auto-accept for now
      last_active_at: new Date().toISOString(),
    };

    // Create workspace member
    const { data: newMember, error: createError } = await supabase
      .from('workspace_members')
      .insert(memberData)
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

    if (createError) {
      console.error('Error creating workspace member:', createError);
      return NextResponse.json(
        { data: null, error: 'Failed to add member to workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: newMember, error: null, status: 201 } satisfies ApiResponse<typeof newMember>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/workspaces/[id]/members:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}