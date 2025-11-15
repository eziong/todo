// =============================================
// INDIVIDUAL TASK API ROUTES
// =============================================
// Handles individual task CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  checkWorkspacePermission, 
  requireAuth 
} from '@/lib/auth/permissions';
import { 
  validateTaskUpdate, 
  validateUUID 
} from '@/lib/validation/task';
import type { 
  Task,
  TaskUpdate,
  ApiResponse,
  EventInsert 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Helper function to get task with permission check
 */
async function getTaskWithPermission(
  supabase: any,
  userId: string,
  taskId: string,
  requiredPermission: 'read' | 'write' | 'delete'
): Promise<{
  task: Task | null;
  allowed: boolean;
  status: number;
  message: string;
}> {
  // Validate task ID format
  const uuidErrors = validateUUID(taskId, 'task_id');
  if (uuidErrors.length > 0) {
    return {
      task: null,
      allowed: false,
      status: 400,
      message: 'Invalid task ID format',
    };
  }

  // Get task with workspace info
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(`
      *,
      section:sections!inner (
        id,
        name,
        workspace_id
      )
    `)
    .eq('id', taskId)
    .eq('is_deleted', false)
    .single();

  if (taskError || !task) {
    return {
      task: null,
      allowed: false,
      status: 404,
      message: 'Task not found',
    };
  }

  // Check workspace permission
  const permissionCheck = await checkWorkspacePermission(
    supabase,
    userId,
    task.section.workspace_id,
    requiredPermission
  );

  if (!permissionCheck.allowed) {
    return {
      task,
      allowed: false,
      status: 403,
      message: permissionCheck.reason || 'Insufficient permissions',
    };
  }

  return {
    task,
    allowed: true,
    status: 200,
    message: 'Success',
  };
}

/**
 * Helper function to create audit event
 */
async function createAuditEvent(
  supabase: any,
  userId: string,
  workspaceId: string,
  taskId: string,
  eventType: string,
  oldValues?: any,
  newValues?: any
): Promise<void> {
  try {
    const event: EventInsert = {
      user_id: userId,
      workspace_id: workspaceId,
      event_type: eventType as any,
      entity_type: 'task',
      entity_id: taskId,
      old_values: oldValues,
      new_values: newValues,
    };

    await supabase.from('events').insert([event]);
  } catch (error) {
    console.error('Failed to create audit event:', error);
    // Don't fail the main operation for audit errors
  }
}

// GET /api/tasks/[id] - Get specific task with full details
export async function GET(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: taskId } = await params;

    // Authenticate user
    const authResult = await requireAuth();
    if (!authResult) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    const { user, supabase } = authResult;

    // Check permissions and get task
    const { task, allowed, status, message } = await getTaskWithPermission(
      supabase,
      user.id,
      taskId,
      'read'
    );

    if (!allowed) {
      return NextResponse.json(
        { data: null, error: message, status } satisfies ApiResponse<null>,
        { status }
      );
    }

    // Get full task details with related data
    const { data: fullTask, error: fullTaskError } = await supabase
      .from('tasks')
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
      .eq('id', taskId)
      .single();

    if (fullTaskError) {
      console.error('Error fetching full task details:', fullTaskError);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch task details', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Transform response
    const transformedTask = {
      id: fullTask.id,
      section_id: fullTask.section_id,
      workspace_id: fullTask.workspace_id,
      title: fullTask.title,
      description: fullTask.description,
      status: fullTask.status,
      priority: fullTask.priority,
      assigned_to_user_id: fullTask.assigned_to_user_id,
      created_by_user_id: fullTask.created_by_user_id,
      start_date: fullTask.start_date,
      end_date: fullTask.end_date,
      due_date: fullTask.due_date,
      completed_at: fullTask.completed_at,
      position: fullTask.position,
      tags: fullTask.tags,
      estimated_hours: fullTask.estimated_hours,
      actual_hours: fullTask.actual_hours,
      attachments: fullTask.attachments,
      created_at: fullTask.created_at,
      updated_at: fullTask.updated_at,
      is_deleted: fullTask.is_deleted,
      section: {
        id: fullTask.section.id,
        name: fullTask.section.name,
        color: fullTask.section.color,
        workspace_id: fullTask.section.workspace_id,
        workspace: {
          id: fullTask.section.workspace.id,
          name: fullTask.section.workspace.name,
          color: fullTask.section.workspace.color,
        },
      },
      assigned_user: fullTask.assigned_user ? {
        id: fullTask.assigned_user.id,
        name: fullTask.assigned_user.name,
        email: fullTask.assigned_user.email,
        avatar_url: fullTask.assigned_user.avatar_url,
      } : null,
      creator_user: {
        id: fullTask.creator_user.id,
        name: fullTask.creator_user.name,
        email: fullTask.creator_user.email,
        avatar_url: fullTask.creator_user.avatar_url,
      },
    };

    return NextResponse.json({
      data: transformedTask,
      error: null,
      status: 200,
    } satisfies ApiResponse<typeof transformedTask>);

  } catch (error) {
    console.error('Unexpected error in GET /api/tasks/[id]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: taskId } = await params;

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
    let updateData: TaskUpdate;
    try {
      updateData = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON in request body', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate update data
    const validation = validateTaskUpdate(updateData);
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

    // Check permissions and get current task
    const { task, allowed, status, message } = await getTaskWithPermission(
      supabase,
      user.id,
      taskId,
      'write'
    );

    if (!allowed || !task) {
      return NextResponse.json(
        { data: null, error: message, status } satisfies ApiResponse<null>,
        { status }
      );
    }

    // Check if task assignment is allowed
    if (updateData.assigned_to_user_id !== undefined) {
      const assignPermissionCheck = await checkWorkspacePermission(
        supabase,
        user.id,
        task.workspace_id,
        'admin'
      );

      if (!assignPermissionCheck.allowed) {
        return NextResponse.json(
          { data: null, error: 'Insufficient permissions to assign tasks', status: 403 } satisfies ApiResponse<null>,
          { status: 403 }
        );
      }

      // If assigning to someone, verify they're a workspace member
      if (updateData.assigned_to_user_id) {
        const { data: assigneeMember } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', task.workspace_id)
          .eq('user_id', updateData.assigned_to_user_id)
          .single();

        if (!assigneeMember) {
          return NextResponse.json(
            { data: null, error: 'Assigned user is not a member of this workspace', status: 400 } satisfies ApiResponse<null>,
            { status: 400 }
          );
        }
      }
    }

    // Handle status-specific logic
    if (updateData.status && updateData.status !== task.status) {
      if (updateData.status === 'completed' && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString();
      } else if (updateData.status !== 'completed' && task.completed_at) {
        updateData.completed_at = null;
      }
    }

    // Store old values for audit
    const oldValues = { ...task };

    // Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
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

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { data: null, error: 'Failed to update task', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Create audit event
    await createAuditEvent(
      supabase,
      user.id,
      task.workspace_id,
      taskId,
      'updated',
      oldValues,
      updateData
    );

    // Transform response
    const transformedTask = {
      id: updatedTask.id,
      section_id: updatedTask.section_id,
      workspace_id: updatedTask.workspace_id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      assigned_to_user_id: updatedTask.assigned_to_user_id,
      created_by_user_id: updatedTask.created_by_user_id,
      start_date: updatedTask.start_date,
      end_date: updatedTask.end_date,
      due_date: updatedTask.due_date,
      completed_at: updatedTask.completed_at,
      position: updatedTask.position,
      tags: updatedTask.tags,
      estimated_hours: updatedTask.estimated_hours,
      actual_hours: updatedTask.actual_hours,
      attachments: updatedTask.attachments,
      created_at: updatedTask.created_at,
      updated_at: updatedTask.updated_at,
      is_deleted: updatedTask.is_deleted,
      section: {
        id: updatedTask.section.id,
        name: updatedTask.section.name,
        color: updatedTask.section.color,
        workspace_id: updatedTask.section.workspace_id,
        workspace: {
          id: updatedTask.section.workspace.id,
          name: updatedTask.section.workspace.name,
          color: updatedTask.section.workspace.color,
        },
      },
      assigned_user: updatedTask.assigned_user ? {
        id: updatedTask.assigned_user.id,
        name: updatedTask.assigned_user.name,
        email: updatedTask.assigned_user.email,
        avatar_url: updatedTask.assigned_user.avatar_url,
      } : null,
      creator_user: {
        id: updatedTask.creator_user.id,
        name: updatedTask.creator_user.name,
        email: updatedTask.creator_user.email,
        avatar_url: updatedTask.creator_user.avatar_url,
      },
    };

    return NextResponse.json({
      data: transformedTask,
      error: null,
      status: 200,
    } satisfies ApiResponse<typeof transformedTask>);

  } catch (error) {
    console.error('Unexpected error in PUT /api/tasks/[id]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Soft delete task
export async function DELETE(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: taskId } = await params;

    // Authenticate user
    const authResult = await requireAuth();
    if (!authResult) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    const { user, supabase } = authResult;

    // Check permissions and get task
    const { task, allowed, status, message } = await getTaskWithPermission(
      supabase,
      user.id,
      taskId,
      'delete'
    );

    if (!allowed || !task) {
      return NextResponse.json(
        { data: null, error: message, status } satisfies ApiResponse<null>,
        { status }
      );
    }

    // Additional permission check: only admins or task creator can delete
    const isTaskCreator = task.created_by_user_id === user.id;
    const permissionCheck = await checkWorkspacePermission(
      supabase,
      user.id,
      task.workspace_id,
      'admin'
    );

    if (!isTaskCreator && !permissionCheck.allowed) {
      return NextResponse.json(
        { data: null, error: 'Only task creators or admins can delete tasks', status: 403 } satisfies ApiResponse<null>,
        { status: 403 }
      );
    }

    // Soft delete the task
    const { error: deleteError } = await supabase
      .from('tasks')
      .update({ is_deleted: true })
      .eq('id', taskId);

    if (deleteError) {
      console.error('Error deleting task:', deleteError);
      return NextResponse.json(
        { data: null, error: 'Failed to delete task', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Create audit event
    await createAuditEvent(
      supabase,
      user.id,
      task.workspace_id,
      taskId,
      'deleted',
      task,
      null
    );

    return NextResponse.json({
      data: { id: taskId, deleted: true },
      error: null,
      status: 200,
    } satisfies ApiResponse<{ id: string; deleted: boolean }>);

  } catch (error) {
    console.error('Unexpected error in DELETE /api/tasks/[id]:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}