// =============================================
// INDIVIDUAL SECTION API ROUTES
// =============================================
// Handles specific section operations (GET, PUT, DELETE)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSectionUpdate } from '@/lib/validation/section';
import type { 
  Section, 
  ApiResponse 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to check user permissions for section via workspace
async function checkSectionPermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string, 
  sectionId: string, 
  requiredPermission: 'read' | 'write' | 'delete' | 'admin'
): Promise<{ allowed: boolean; member: Record<string, unknown> | null; section: Record<string, unknown> | null }> {
  // Get section with workspace info
  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('id, workspace_id')
    .eq('id', sectionId)
    .eq('is_deleted', false)
    .single();

  if (sectionError || !section) {
    return { allowed: false, member: null, section: null };
  }

  // Check workspace membership and permissions
  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .select('role, permissions')
    .eq('workspace_id', section.workspace_id)
    .eq('user_id', userId)
    .single();

  if (memberError || !member) {
    return { allowed: false, member: null, section };
  }

  const hasPermission = member.permissions[requiredPermission] === true;
  return { allowed: hasPermission, member, section };
}

// GET /api/sections/[id] - Get specific section details
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if user has read permission for section
    const { allowed, section: sectionCheck } = await checkSectionPermission(supabase, user.id, sectionId, 'read');
    
    if (!allowed) {
      const status = sectionCheck ? 403 : 404;
      const message = sectionCheck ? 'Forbidden - insufficient permissions' : 'Section not found';
      return NextResponse.json(
        { data: null, error: message, status } satisfies ApiResponse<null>,
        { status }
      );
    }

    // Get section details with additional information
    const { data: section, error: sectionError } = await supabase
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
        workspace:workspaces!inner (
          id,
          name,
          color
        )
      `)
      .eq('id', sectionId)
      .eq('is_deleted', false)
      .single();

    if (sectionError) {
      if (sectionError.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Section not found', status: 404 } satisfies ApiResponse<null>,
          { status: 404 }
        );
      }

      console.error('Error fetching section:', sectionError);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch section', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Get task statistics
    const { data: taskStats, error: statsError } = await supabase
      .from('tasks')
      .select('status')
      .eq('section_id', sectionId)
      .eq('is_deleted', false);

    if (statsError) {
      console.error('Error fetching task statistics:', statsError);
    }

    const statistics = {
      total_tasks: taskStats?.length || 0,
      completed_tasks: taskStats?.filter(t => t.status === 'completed').length || 0,
      in_progress_tasks: taskStats?.filter(t => t.status === 'in_progress').length || 0,
      todo_tasks: taskStats?.filter(t => t.status === 'todo').length || 0,
    };

    // Transform workspace data
    const workspaceData = Array.isArray(section.workspace) 
      ? section.workspace[0] 
      : section.workspace;
    
    const transformedData = {
      ...section,
      workspace: workspaceData ? {
        id: workspaceData.id,
        name: workspaceData.name,
        color: workspaceData.color,
      } : null,
      statistics,
    };

    return NextResponse.json(
      { data: transformedData, error: null, status: 200 } satisfies ApiResponse<typeof transformedData>
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/sections/[id]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// PUT /api/sections/[id] - Update section
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if user has write permission for section
    const { allowed, section: sectionCheck } = await checkSectionPermission(supabase, user.id, sectionId, 'write');
    
    if (!allowed) {
      const status = sectionCheck ? 403 : 404;
      const message = sectionCheck ? 'Forbidden - insufficient permissions' : 'Section not found';
      return NextResponse.json(
        { data: null, error: message, status } satisfies ApiResponse<null>,
        { status }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    const validation = validateSectionUpdate(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { data: null, error: validation.errors.join(', '), status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Update section
    const { data: section, error: updateError } = await supabase
      .from('sections')
      .update(validation.sanitizedData)
      .eq('id', sectionId)
      .eq('is_deleted', false)
      .select(`
        id,
        workspace_id,
        name,
        description,
        position,
        color,
        is_archived,
        is_deleted,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating section:', updateError);
      
      // Handle unique constraint violations
      if (updateError.code === '23505') {
        return NextResponse.json(
          { data: null, error: 'A section with this name already exists in the workspace', status: 409 } satisfies ApiResponse<null>,
          { status: 409 }
        );
      }

      return NextResponse.json(
        { data: null, error: 'Failed to update section', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: section, error: null, status: 200 } satisfies ApiResponse<Section>
    );
  } catch (error) {
    console.error('Unexpected error in PUT /api/sections/[id]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id] - Soft delete section
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if user has delete permission for section
    const { allowed, section: sectionCheck } = await checkSectionPermission(supabase, user.id, sectionId, 'delete');
    
    if (!allowed) {
      const status = sectionCheck ? 403 : 404;
      const message = sectionCheck ? 'Forbidden - insufficient permissions' : 'Section not found';
      return NextResponse.json(
        { data: null, error: message, status } satisfies ApiResponse<null>,
        { status }
      );
    }

    // Check if section exists and is not already deleted
    const { data: section, error: checkError } = await supabase
      .from('sections')
      .select('id, name, workspace_id')
      .eq('id', sectionId)
      .eq('is_deleted', false)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Section not found', status: 404 } satisfies ApiResponse<null>,
          { status: 404 }
        );
      }

      console.error('Error checking section:', checkError);
      return NextResponse.json(
        { data: null, error: 'Failed to check section', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Check if section has active tasks
    const { count: taskCount, error: taskCountError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('section_id', sectionId)
      .eq('is_deleted', false);

    if (taskCountError) {
      console.error('Error counting tasks:', taskCountError);
      return NextResponse.json(
        { data: null, error: 'Failed to check section dependencies', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Parse query parameters for force delete
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    if (taskCount && taskCount > 0 && !force) {
      return NextResponse.json(
        { 
          data: null, 
          error: `Cannot delete section with ${taskCount} task(s). Use force=true to delete anyway.`, 
          status: 409 
        } satisfies ApiResponse<null>,
        { status: 409 }
      );
    }

    // Soft delete section (this will cascade to tasks via database triggers)
    const { error: deleteError } = await supabase
      .from('sections')
      .update({ is_deleted: true })
      .eq('id', sectionId);

    if (deleteError) {
      console.error('Error deleting section:', deleteError);
      return NextResponse.json(
        { data: null, error: 'Failed to delete section', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { id: sectionId, deleted: true }, error: null, status: 200 } satisfies ApiResponse<{ id: string; deleted: boolean }>
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/sections/[id]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}