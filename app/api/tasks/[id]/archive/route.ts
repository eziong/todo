// =============================================
// TASK ARCHIVE API ROUTES
// =============================================
// Handles task archiving and restoration

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

interface ArchiveRequest {
  is_archived?: boolean;
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
        workspace_id,
        is_archived
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

  // Check if user has admin permission (required for archiving)
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
      message: 'Only workspace admins can archive tasks',
    };
  }

  return {
    task,
    allowed: true,
    status: 200,
    message: 'Success',
  };
}

// PUT /api/tasks/[id]/archive - Archive or restore task
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
    let archiveData: ArchiveRequest;
    try {
      archiveData = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON in request body', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Default to archiving if not specified
    const shouldArchive = archiveData.is_archived !== false;

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

    // Check if section is archived (can't archive tasks in archived sections)
    if (shouldArchive && task.section.is_archived) {
      return NextResponse.json(
        { data: null, error: 'Cannot archive tasks in an archived section', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Check if already in the desired state
    const currentlyArchived = task.is_archived || false;
    if (currentlyArchived === shouldArchive) {
      const action = shouldArchive ? 'archived' : 'restored';
      return NextResponse.json(
        { data: null, error: `Task is already ${action}`, status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Store old values for audit
    const oldValues = {
      is_archived: currentlyArchived,
    };

    // Update task archive status
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        is_archived: shouldArchive,
      })
      .eq('id', taskId)
      .select(`
        id,
        is_archived,
        updated_at,
        section:sections!inner (
          workspace_id
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating task archive status:', updateError);
      return NextResponse.json(
        { data: null, error: 'Failed to update task archive status', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Create audit event
    try {
      const eventType = shouldArchive ? 'archived' : 'unarchived';
      const event: EventInsert = {
        user_id: user.id,
        workspace_id: task.section.workspace_id,
        event_type: eventType,
        entity_type: 'task',
        entity_id: taskId,
        old_values: oldValues,
        new_values: {
          is_archived: shouldArchive,
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
        is_archived: updatedTask.is_archived,
        updated_at: updatedTask.updated_at,
      },
      error: null,
      status: 200,
    } satisfies ApiResponse<{
      id: string;
      is_archived: boolean;
      updated_at: string;
    }>);

  } catch (error) {
    console.error('Unexpected error in PUT /api/tasks/[id]/archive:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}