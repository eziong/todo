// =============================================
// TASK ASSIGNMENT API ROUTES
// =============================================
// Handles task assignment and unassignment

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  requireAuth, 
  checkWorkspacePermission 
} from '@/lib/auth/permissions';
import { validateUUID } from '@/lib/validation/task';
import type { 
  ApiResponse,
  EventInsert 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface AssignmentRequest {
  assigned_to_user_id: string | null;
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

  // Get task with workspace info
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(`
      *,
      section:sections!inner (
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

  // Check if user has admin permission (required for assignments)
  const permissionCheck = await checkWorkspacePermission(
    supabase,
    userId,
    task.section.workspace_id,
    'admin'
  );

  if (!permissionCheck.allowed) {
    return {
      task,
      allowed: false,
      status: 403,
      message: 'Only workspace admins can assign tasks',
    };
  }

  return {
    task,
    allowed: true,
    status: 200,
    message: 'Success',
  };
}

// PUT /api/tasks/[id]/assign - Assign or unassign task
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
    let assignmentData: AssignmentRequest;
    try {
      assignmentData = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON in request body', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate assigned user ID format if provided
    if (assignmentData.assigned_to_user_id) {
      const uuidErrors = validateUUID(assignmentData.assigned_to_user_id, 'assigned_to_user_id');
      if (uuidErrors.length > 0) {
        return NextResponse.json(
          { 
            data: null, 
            error: uuidErrors.map(e => e.message).join(', '), 
            status: 400 
          } satisfies ApiResponse<null>,
          { status: 400 }
        );
      }
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

    // If assigning to someone, verify they're a workspace member
    let assignedUser = null;
    if (assignmentData.assigned_to_user_id) {
      const { data: assigneeMember, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          user:users!inner (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('workspace_id', task.section.workspace_id)
        .eq('user_id', assignmentData.assigned_to_user_id)
        .single();

      if (memberError || !assigneeMember) {
        return NextResponse.json(
          { data: null, error: 'Assigned user is not a member of this workspace', status: 400 } satisfies ApiResponse<null>,
          { status: 400 }
        );
      }

      assignedUser = assigneeMember.user;
    }

    // Store old values for audit
    const oldValues = {
      assigned_to_user_id: task.assigned_to_user_id,
    };

    // Update task assignment
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_to_user_id: assignmentData.assigned_to_user_id,
      })
      .eq('id', taskId)
      .select(`
        id,
        assigned_to_user_id,
        updated_at,
        assigned_user:users!assigned_to_user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating task assignment:', updateError);
      return NextResponse.json(
        { data: null, error: 'Failed to update task assignment', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Create audit event
    try {
      const eventType = assignmentData.assigned_to_user_id ? 'assigned' : 'unassigned';
      const event: EventInsert = {
        user_id: user.id,
        workspace_id: task.section.workspace_id,
        event_type: eventType,
        entity_type: 'task',
        entity_id: taskId,
        old_values: oldValues,
        new_values: {
          assigned_to_user_id: assignmentData.assigned_to_user_id,
        },
      };

      await supabase.from('events').insert([event]);
    } catch (error) {
      console.error('Failed to create audit event:', error);
      // Don't fail the main operation for audit errors
    }

    return NextResponse.json({
      data: {
        id: updatedTask.id,
        assigned_to_user_id: updatedTask.assigned_to_user_id,
        assigned_user: updatedTask.assigned_user ? {
          id: updatedTask.assigned_user.id,
          name: updatedTask.assigned_user.name,
          email: updatedTask.assigned_user.email,
          avatar_url: updatedTask.assigned_user.avatar_url,
        } : null,
        updated_at: updatedTask.updated_at,
      },
      error: null,
      status: 200,
    } satisfies ApiResponse<{
      id: string;
      assigned_to_user_id: string | null;
      assigned_user: {
        id: string;
        name: string;
        email: string;
        avatar_url: string | null;
      } | null;
      updated_at: string;
    }>);

  } catch (error) {
    console.error('Unexpected error in PUT /api/tasks/[id]/assign:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}