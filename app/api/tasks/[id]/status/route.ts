// =============================================
// TASK STATUS UPDATE API ROUTES
// =============================================
// Handles task status transitions and updates

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/permissions';
import { 
  validateStatus, 
  validateStatusTransition, 
  validateUUID 
} from '@/lib/validation/task';
import type { 
  TaskStatus,
  ApiResponse,
  EventInsert 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface StatusUpdateRequest {
  status: TaskStatus;
  completed_at?: string | null;
}

/**
 * Helper function to get task with permission check
 */
async function getTaskWithPermission(
  supabase: any,
  userId: string,
  taskId: string
): Promise<{
  task: any | null;
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

  // Get task with workspace info and permission check
  const { data: taskWithPermission, error } = await supabase
    .from('tasks')
    .select(`
      *,
      section:sections!inner (
        workspace_id,
        workspace:workspaces!inner (
          workspace_members!inner (
            user_id,
            permissions
          )
        )
      )
    `)
    .eq('id', taskId)
    .eq('is_deleted', false)
    .eq('section.workspace.workspace_members.user_id', userId)
    .single();

  if (error || !taskWithPermission) {
    return {
      task: null,
      allowed: false,
      status: 404,
      message: 'Task not found or access denied',
    };
  }

  const permissions = taskWithPermission.section.workspace.workspace_members[0]?.permissions;
  if (!permissions?.write) {
    return {
      task: taskWithPermission,
      allowed: false,
      status: 403,
      message: 'Insufficient permissions to update task status',
    };
  }

  return {
    task: taskWithPermission,
    allowed: true,
    status: 200,
    message: 'Success',
  };
}

// PUT /api/tasks/[id]/status - Update task status
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
    let statusData: StatusUpdateRequest;
    try {
      statusData = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON in request body', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate new status
    const statusErrors = validateStatus(statusData.status);
    if (statusErrors.length > 0) {
      return NextResponse.json(
        { 
          data: null, 
          error: statusErrors.map(e => e.message).join(', '), 
          status: 400 
        } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Check permissions and get task
    const { task, allowed, status, message } = await getTaskWithPermission(
      supabase,
      user.id,
      taskId
    );

    if (!allowed || !task) {
      return NextResponse.json(
        { data: null, error: message, status } satisfies ApiResponse<null>,
        { status }
      );
    }

    // Validate status transition
    const transitionValidation = validateStatusTransition(task.status, statusData.status);
    if (!transitionValidation.isValid) {
      return NextResponse.json(
        { 
          data: null, 
          error: transitionValidation.errors.map(e => e.message).join(', '), 
          status: 400 
        } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: statusData.status,
    };

    // Handle completion timestamp
    if (statusData.status === 'completed') {
      updateData.completed_at = statusData.completed_at || new Date().toISOString();
    } else if (task.completed_at) {
      // Reopening a completed task (if it was completed before and new status is not completed)
      updateData.completed_at = undefined;
    }

    // Store old values for audit
    const oldValues = {
      status: task.status,
      completed_at: task.completed_at,
    };

    // Update task status
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select(`
        id,
        status,
        completed_at,
        updated_at,
        section:sections!inner (
          workspace_id
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating task status:', updateError);
      return NextResponse.json(
        { data: null, error: 'Failed to update task status', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Create audit event
    try {
      const event: EventInsert = {
        user_id: user.id,
        workspace_id: task.section.workspace_id,
        event_type: 'status_changed',
        entity_type: 'task',
        entity_id: taskId,
        old_values: oldValues,
        new_values: updateData,
        category: 'user_action',
        severity: 'info',
        source: 'web',
        tags: [],
        context: {
          task_title: task.title,
          section_id: task.section_id,
          section_name: task.section.name
        }
      };

      await supabase.from('events').insert([event]);
    } catch (error) {
      console.error('Failed to create audit event:', error);
      // Don't fail the main operation for audit errors
    }

    return NextResponse.json({
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
        completed_at: updatedTask.completed_at,
        updated_at: updatedTask.updated_at,
      },
      error: null,
      status: 200,
    } satisfies ApiResponse<{
      id: string;
      status: TaskStatus;
      completed_at: string | null;
      updated_at: string;
    }>);

  } catch (error) {
    console.error('Unexpected error in PUT /api/tasks/[id]/status:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}