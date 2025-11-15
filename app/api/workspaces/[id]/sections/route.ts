// =============================================
// WORKSPACE SECTIONS API ROUTES
// =============================================
// Handles section operations within workspaces (GET, POST)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSectionCreate } from '@/lib/validation/section';
import type { 
  Section, 
  SectionInsert, 
  ApiResponse, 
  PaginatedResponse 
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

// GET /api/workspaces/[id]/sections - List sections in workspace
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

    // Verify workspace exists and is not deleted
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
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

      console.error('Error checking workspace:', workspaceError);
      return NextResponse.json(
        { data: null, error: 'Failed to verify workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const includeArchived = url.searchParams.get('include_archived') === 'true';
    const search = url.searchParams.get('search');

    // Build query for sections
    let query = supabase
      .from('sections')
      .select(`
        id,
        workspace_id,
        name,
        description,
        position,
        color,
        is_archived,
        created_at,
        updated_at,
        tasks:tasks(count)
      `)
      .eq('workspace_id', workspaceId)
      .eq('is_deleted', false);

    // Filter archived sections unless explicitly requested
    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    // Add search filter if provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to).order('position', { ascending: true });

    const { data: sections, error: sectionsError, count } = await query;

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch sections', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Transform sections data to include task count
    const transformedSections = sections?.map((section: any) => ({
      id: section.id,
      workspace_id: section.workspace_id,
      name: section.name,
      description: section.description,
      position: section.position,
      color: section.color,
      is_archived: section.is_archived,
      created_at: section.created_at,
      updated_at: section.updated_at,
      task_count: section.tasks?.[0]?.count || 0,
    })) || [];

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<typeof transformedSections[0]> = {
      data: transformedSections,
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
    console.error('Unexpected error in GET /api/workspaces/[id]/sections:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/sections - Create new section in workspace
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

    // Check if user has write permission for workspace
    const { allowed } = await checkWorkspacePermission(supabase, user.id, workspaceId, 'write');
    
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Forbidden - insufficient permissions', status: 403 } satisfies ApiResponse<null>,
        { status: 403 }
      );
    }

    // Verify workspace exists and is not deleted
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
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

      console.error('Error checking workspace:', workspaceError);
      return NextResponse.json(
        { data: null, error: 'Failed to verify workspace', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Add workspace_id to the data
    const sectionData = { ...body, workspace_id: workspaceId };
    
    // If position not provided, get the next available position
    if (sectionData.position === undefined) {
      const { data: maxPositionResult, error: positionError } = await supabase
        .from('sections')
        .select('position')
        .eq('workspace_id', workspaceId)
        .eq('is_deleted', false)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      if (positionError && positionError.code !== 'PGRST116') {
        console.error('Error getting max position:', positionError);
        return NextResponse.json(
          { data: null, error: 'Failed to determine section position', status: 500 } satisfies ApiResponse<null>,
          { status: 500 }
        );
      }

      sectionData.position = (maxPositionResult?.position ?? -1) + 1;
    }

    // Validate section data
    const validation = validateSectionCreate(sectionData);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { data: null, error: validation.errors.join(', '), status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Create section
    const { data: section, error: createError } = await supabase
      .from('sections')
      .insert(validation.sanitizedData)
      .select(`
        id,
        workspace_id,
        name,
        description,
        position,
        color,
        is_archived,
        created_at,
        updated_at
      `)
      .single();

    if (createError) {
      console.error('Error creating section:', createError);
      
      // Handle unique constraint violations
      if (createError.code === '23505') {
        return NextResponse.json(
          { data: null, error: 'A section with this name already exists in the workspace', status: 409 } satisfies ApiResponse<null>,
          { status: 409 }
        );
      }

      return NextResponse.json(
        { data: null, error: 'Failed to create section', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Add task count (0 for new section)
    const responseData = {
      ...section,
      task_count: 0,
    };

    return NextResponse.json(
      { data: responseData, error: null, status: 201 } satisfies ApiResponse<typeof responseData>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/workspaces/[id]/sections:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}