// =============================================
// SECTION TASKS API ROUTES
// =============================================
// Handles task listing and creation within sections

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/permissions';
import { 
  validateTaskInsert, 
  validateUUID 
} from '@/lib/validation/task';
import type { 
  TaskStatus,
  TaskPriority,
  TaskInsert,
  EventInsert,
  ApiResponse,
  PaginatedResponse 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to check user permissions for section via workspace
async function checkSectionPermission(
  supabase: ReturnType<typeof createClient>,
  userId: string, 
  sectionId: string, 
  requiredPermission: 'read' | 'write' | 'delete' | 'admin'
): Promise<{ allowed: boolean; member: any; section: any }> {
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

// GET /api/sections/[id]/tasks - Get tasks within section (preview)
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

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const includeCompleted = url.searchParams.get('include_completed') === 'true';
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status') as TaskStatus | null;
    const priority = url.searchParams.get('priority') as TaskPriority | null;
    const assignedTo = url.searchParams.get('assigned_to');

    // Build query for tasks
    let query = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        assigned_to_user_id,
        created_by_user_id,
        start_date,
        end_date,
        due_date,
        completed_at,
        position,
        tags,
        estimated_hours,
        actual_hours,
        created_at,
        updated_at,
        assigned_user:users!assigned_to_user_id (
          id,
          name,
          email,
          avatar_url
        ),
        creator_user:users!created_by_user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('section_id', sectionId)
      .eq('is_deleted', false);

    // Filter out completed tasks unless explicitly requested
    if (!includeCompleted) {
      query = query.neq('status', 'completed');
    }

    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Add status filter if provided
    if (status && ['todo', 'in_progress', 'completed', 'cancelled', 'on_hold'].includes(status)) {
      query = query.eq('status', status);
    }

    // Add priority filter if provided
    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      query = query.eq('priority', priority);
    }

    // Add assigned user filter if provided
    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        query = query.is('assigned_to_user_id', null);
      } else {
        query = query.eq('assigned_to_user_id', assignedTo);
      }
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to).order('position', { ascending: true });

    const { data: tasks, error: tasksError, count } = await query;

    if (tasksError) {
      console.error('Error fetching section tasks:', tasksError);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch tasks', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Transform tasks data
    const transformedTasks = tasks?.map((task: Record<string, any>) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigned_to_user_id: task.assigned_to_user_id,
      created_by_user_id: task.created_by_user_id,
      start_date: task.start_date,
      end_date: task.end_date,
      due_date: task.due_date,
      completed_at: task.completed_at,
      position: task.position,
      tags: task.tags,
      estimated_hours: task.estimated_hours,
      actual_hours: task.actual_hours,
      created_at: task.created_at,
      updated_at: task.updated_at,
      assigned_user: task.assigned_user ? {
        id: task.assigned_user.id,
        name: task.assigned_user.name,
        email: task.assigned_user.email,
        avatar_url: task.assigned_user.avatar_url,
      } : null,
      creator_user: {
        id: task.creator_user.id,
        name: task.creator_user.name,
        email: task.creator_user.email,
        avatar_url: task.creator_user.avatar_url,
      },
    })) || [];

    // Get section information for context
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select(`
        id,
        name,
        workspace_id,
        workspace:workspaces!inner (
          id,
          name
        )
      `)
      .eq('id', sectionId)
      .eq('is_deleted', false)
      .single();

    if (sectionError) {
      console.error('Error fetching section info:', sectionError);
    }

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<typeof transformedTasks[0]> & {
      section?: {
        id: string;
        name: string;
        workspace_id: string;
        workspace: {
          id: string;
          name: string;
        };
      };
    } = {
      data: transformedTasks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      error: null,
      section: section ? {
        id: section.id,
        name: section.name,
        workspace_id: section.workspace_id,
        workspace: {
          id: section.workspace.id,
          name: section.workspace.name,
        },
      } : undefined,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in GET /api/sections/[id]/tasks:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST /api/sections/[id]/tasks - Create new task in section
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: sectionId } = await params;

    // Authenticate user
    const authResult = await requireAuth();
    if (!authResult) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    const { user, supabase } = authResult;

    // Parse request body
    let taskData: Partial<TaskInsert>;
    try {
      taskData = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON in request body', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Check if user has write permission for section
    const { allowed, section } = await checkSectionPermission(supabase, user.id, sectionId, 'write');
    
    if (!allowed) {
      const status = section ? 403 : 404;
      const message = section ? 'Forbidden - insufficient permissions' : 'Section not found';
      return NextResponse.json(
        { data: null, error: message, status } satisfies ApiResponse<null>,
        { status }
      );
    }

    // Get next position for task in section
    const { data: lastTask } = await supabase
      .from('tasks')
      .select('position')
      .eq('section_id', sectionId)
      .eq('is_deleted', false)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = lastTask ? lastTask.position + 1 : 0;

    // Prepare task data with defaults
    const insertData: TaskInsert = {
      section_id: sectionId,
      workspace_id: section.workspace_id,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || null,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      assigned_to_user_id: taskData.assigned_to_user_id || null,
      created_by_user_id: user.id,
      start_date: taskData.start_date || null,
      end_date: taskData.end_date || null,
      due_date: taskData.due_date || null,
      position: taskData.position !== undefined ? taskData.position : nextPosition,
      tags: taskData.tags || [],
      estimated_hours: taskData.estimated_hours || null,
      actual_hours: taskData.actual_hours || null,
      attachments: taskData.attachments || [],
      completed_at: null,
    };

    // Validate task data
    const validation = validateTaskInsert(insertData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          data: null, 
          error: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`, 
          status: 400 
        } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Check if assigned user is a workspace member (if assigning)
    if (insertData.assigned_to_user_id) {
      const { data: assigneeMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', section.workspace_id)
        .eq('user_id', insertData.assigned_to_user_id)
        .single();

      if (!assigneeMember) {
        return NextResponse.json(
          { data: null, error: 'Assigned user is not a member of this workspace', status: 400 } satisfies ApiResponse<null>,
          { status: 400 }
        );
      }
    }

    // Insert task
    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert([insertData])
      .select(`
        *,
        section:sections!inner (
          id,
          name,
          color,
          workspace_id,
          workspace:workspaces!inner (
            id,
            name,
            color
          )
        ),
        assigned_user:users!assigned_to_user_id (
          id,
          name,
          email,
          avatar_url
        ),
        creator_user:users!created_by_user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating task:', insertError);
      return NextResponse.json(
        { data: null, error: 'Failed to create task', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Create audit event
    try {
      const event: EventInsert = {
        user_id: user.id,
        workspace_id: section.workspace_id,
        event_type: 'created',
        entity_type: 'task',
        entity_id: newTask.id,
        new_values: insertData,
      };

      await supabase.from('events').insert([event]);
    } catch (error) {
      console.error('Failed to create audit event:', error);
      // Don't fail the main operation for audit errors
    }

    // Transform response
    const transformedTask = {
      id: newTask.id,
      section_id: newTask.section_id,
      workspace_id: newTask.workspace_id,
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      assigned_to_user_id: newTask.assigned_to_user_id,
      created_by_user_id: newTask.created_by_user_id,
      start_date: newTask.start_date,
      end_date: newTask.end_date,
      due_date: newTask.due_date,
      completed_at: newTask.completed_at,
      position: newTask.position,
      tags: newTask.tags,
      estimated_hours: newTask.estimated_hours,
      actual_hours: newTask.actual_hours,
      attachments: newTask.attachments,
      created_at: newTask.created_at,
      updated_at: newTask.updated_at,
      is_deleted: newTask.is_deleted,
      section: {
        id: newTask.section.id,
        name: newTask.section.name,
        color: newTask.section.color,
        workspace_id: newTask.section.workspace_id,
        workspace: {
          id: newTask.section.workspace.id,
          name: newTask.section.workspace.name,
          color: newTask.section.workspace.color,
        },
      },
      assigned_user: newTask.assigned_user ? {
        id: newTask.assigned_user.id,
        name: newTask.assigned_user.name,
        email: newTask.assigned_user.email,
        avatar_url: newTask.assigned_user.avatar_url,
      } : null,
      creator_user: {
        id: newTask.creator_user.id,
        name: newTask.creator_user.name,
        email: newTask.creator_user.email,
        avatar_url: newTask.creator_user.avatar_url,
      },
    };

    return NextResponse.json(
      {
        data: transformedTask,
        error: null,
        status: 201,
      } satisfies ApiResponse<typeof transformedTask>,
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/sections/[id]/tasks:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}