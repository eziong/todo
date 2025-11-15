// =============================================
// TASK POSITION/REORDERING API ROUTES
// =============================================
// Handles task reordering within sections

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/permissions';
import { 
  validatePosition, 
  validateUUID 
} from '@/lib/validation/task';
import type { 
  ApiResponse,
  EventInsert 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface PositionUpdateRequest {
  position: number;
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
      message: 'Insufficient permissions to reorder tasks',
    };
  }

  return {
    task: taskWithPermission,
    allowed: true,
    status: 200,
    message: 'Success',
  };
}

/**
 * Reorder tasks in section after position change
 */
async function reorderTasks(
  supabase: any,
  sectionId: string,
  taskId: string,
  newPosition: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all tasks in the section ordered by position
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, position')
      .eq('section_id', sectionId)
      .eq('is_deleted', false)
      .order('position', { ascending: true });

    if (tasksError) {
      return { success: false, error: 'Failed to fetch section tasks' };
    }

    // Find the current task
    const currentTaskIndex = allTasks.findIndex(t => t.id === taskId);
    if (currentTaskIndex === -1) {
      return { success: false, error: 'Task not found in section' };
    }

    const currentTask = allTasks[currentTaskIndex];
    
    // Remove the current task from the array
    const otherTasks = allTasks.filter(t => t.id !== taskId);
    
    // Calculate the new position within bounds
    const maxPosition = otherTasks.length;
    const clampedPosition = Math.max(0, Math.min(newPosition, maxPosition));
    
    // Insert the task at the new position
    otherTasks.splice(clampedPosition, 0, { ...currentTask, position: clampedPosition });
    
    // Update all positions to be sequential
    const updates = otherTasks.map((task, index) => ({
      id: task.id,
      position: index,
    }));

    // Batch update all task positions
    const updatePromises = updates.map(update => 
      supabase
        .from('tasks')
        .update({ position: update.position })
        .eq('id', update.id)
    );

    const updateResults = await Promise.all(updatePromises);
    
    // Check if any updates failed
    const failedUpdates = updateResults.filter(result => result.error);
    if (failedUpdates.length > 0) {
      console.error('Failed to update some task positions:', failedUpdates);
      return { success: false, error: 'Failed to update task positions' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in reorderTasks:', error);
    return { success: false, error: 'Unexpected error during reordering' };
  }
}

// PUT /api/tasks/[id]/position - Update task position within section
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
    let positionData: PositionUpdateRequest;
    try {
      positionData = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON in request body', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate position
    const positionErrors = validatePosition(positionData.position);
    if (positionErrors.length > 0) {
      return NextResponse.json(
        { 
          data: null, 
          error: positionErrors.map(e => e.message).join(', '), 
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

    // Store old position for audit
    const oldPosition = task.position;

    // Reorder tasks in the section
    const reorderResult = await reorderTasks(
      supabase,
      task.section_id,
      taskId,
      positionData.position
    );

    if (!reorderResult.success) {
      return NextResponse.json(
        { data: null, error: reorderResult.error || 'Failed to reorder tasks', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Get the updated task to return the new position
    const { data: updatedTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id, position, updated_at')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated task:', fetchError);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch updated task position', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Create audit event
    try {
      const event: EventInsert = {
        user_id: user.id,
        workspace_id: task.section.workspace_id,
        event_type: 'moved',
        entity_type: 'task',
        entity_id: taskId,
        old_values: { position: oldPosition },
        new_values: { position: updatedTask.position },
      };

      await supabase.from('events').insert([event]);
    } catch (error) {
      console.error('Failed to create audit event:', error);
      // Don't fail the main operation for audit errors
    }

    return NextResponse.json({
      data: {
        id: updatedTask.id,
        position: updatedTask.position,
        updated_at: updatedTask.updated_at,
      },
      error: null,
      status: 200,
    } satisfies ApiResponse<{
      id: string;
      position: number;
      updated_at: string;
    }>);

  } catch (error) {
    console.error('Unexpected error in PUT /api/tasks/[id]/position:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}