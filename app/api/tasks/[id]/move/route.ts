// =============================================
// TASK MOVE API ROUTES
// =============================================
// Handles moving tasks between sections

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

interface MoveTaskRequest {
  target_section_id: string;
  position?: number;
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
        id,
        name,
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
      message: 'Insufficient permissions to move tasks',
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
 * Helper function to check if target section exists and user has access
 */
async function checkTargetSection(
  supabase: any,
  userId: string,
  targetSectionId: string,
  sourceWorkspaceId: string
): Promise<{
  section: any | null;
  allowed: boolean;
  status: number;
  message: string;
}> {
  // Validate section ID format
  const uuidErrors = validateUUID(targetSectionId, 'target_section_id');
  if (uuidErrors.length > 0) {
    return {
      section: null,
      allowed: false,
      status: 400,
      message: 'Invalid target section ID format',
    };
  }

  // Get target section with workspace info and permission check
  const { data: targetSection, error } = await supabase
    .from('sections')
    .select(`
      id,
      name,
      workspace_id,
      workspace:workspaces!inner (
        workspace_members!inner (
          user_id,
          permissions
        )
      )
    `)
    .eq('id', targetSectionId)
    .eq('is_deleted', false)
    .eq('workspace.workspace_members.user_id', userId)
    .single();

  if (error || !targetSection) {
    return {
      section: null,
      allowed: false,
      status: 404,
      message: 'Target section not found or access denied',
    };
  }

  // Check if moving to a different workspace
  if (targetSection.workspace_id !== sourceWorkspaceId) {
    return {
      section: targetSection,
      allowed: false,
      status: 400,
      message: 'Cannot move tasks between different workspaces',
    };
  }

  const permissions = targetSection.workspace.workspace_members[0]?.permissions;
  if (!permissions?.write) {
    return {
      section: targetSection,
      allowed: false,
      status: 403,
      message: 'Insufficient permissions to move tasks to target section',
    };
  }

  return {
    section: targetSection,
    allowed: true,
    status: 200,
    message: 'Success',
  };
}

/**
 * Reorder tasks in target section after task move
 */
async function insertTaskInSection(
  supabase: any,
  taskId: string,
  targetSectionId: string,
  position?: number
): Promise<{ success: boolean; newPosition: number; error?: string }> {
  try {
    // Get all tasks in the target section ordered by position
    const { data: targetTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, position')
      .eq('section_id', targetSectionId)
      .eq('is_deleted', false)
      .order('position', { ascending: true });

    if (tasksError) {
      return { success: false, newPosition: 0, error: 'Failed to fetch target section tasks' };
    }

    // Calculate the insertion position
    let insertPosition = position !== undefined ? position : targetTasks.length;
    insertPosition = Math.max(0, Math.min(insertPosition, targetTasks.length));

    // Update positions of existing tasks that need to shift
    const tasksToUpdate = targetTasks
      .filter((_, index) => index >= insertPosition)
      .map((task, index) => ({
        id: task.id,
        position: insertPosition + index + 1,
      }));

    // Update existing task positions first
    if (tasksToUpdate.length > 0) {
      const updatePromises = tasksToUpdate.map(update => 
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
        return { success: false, newPosition: insertPosition, error: 'Failed to update task positions' };
      }
    }

    return { success: true, newPosition: insertPosition };
  } catch (error) {
    console.error('Error in insertTaskInSection:', error);
    return { success: false, newPosition: 0, error: 'Unexpected error during task insertion' };
  }
}

/**
 * Compact positions in source section after task removal
 */
async function compactSourceSection(
  supabase: any,
  sourceSectionId: string,
  removedPosition: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all tasks in source section that need position adjustment
    const { data: tasksToAdjust, error: tasksError } = await supabase
      .from('tasks')
      .select('id, position')
      .eq('section_id', sourceSectionId)
      .eq('is_deleted', false)
      .gt('position', removedPosition)
      .order('position', { ascending: true });

    if (tasksError) {
      return { success: false, error: 'Failed to fetch source section tasks' };
    }

    if (tasksToAdjust.length === 0) {
      return { success: true };
    }

    // Update positions to fill the gap
    const updatePromises = tasksToAdjust.map((task, index) => 
      supabase
        .from('tasks')
        .update({ position: removedPosition + index })
        .eq('id', task.id)
    );

    const updateResults = await Promise.all(updatePromises);
    
    // Check if any updates failed
    const failedUpdates = updateResults.filter(result => result.error);
    if (failedUpdates.length > 0) {
      console.error('Failed to compact source section positions:', failedUpdates);
      return { success: false, error: 'Failed to compact source section positions' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in compactSourceSection:', error);
    return { success: false, error: 'Unexpected error during source section compacting' };
  }
}

// POST /api/tasks/[id]/move - Move task to different section
export async function POST(
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
    let moveData: MoveTaskRequest;
    try {
      moveData = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON in request body', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate position if provided
    if (moveData.position !== undefined) {
      const positionErrors = validatePosition(moveData.position);
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
    }

    // Check permissions and get source task
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

    // Check if task is already in the target section
    if (task.section_id === moveData.target_section_id) {
      return NextResponse.json(
        { data: null, error: 'Task is already in the target section', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Check target section permissions
    const targetSectionCheck = await checkTargetSection(
      supabase,
      user.id,
      moveData.target_section_id,
      task.section.workspace_id
    );

    if (!targetSectionCheck.allowed || !targetSectionCheck.section) {
      return NextResponse.json(
        { data: null, error: targetSectionCheck.message, status: targetSectionCheck.status } satisfies ApiResponse<null>,
        { status: targetSectionCheck.status }
      );
    }

    // Insert task in target section (this also handles position shifting)
    const insertResult = await insertTaskInSection(
      supabase,
      taskId,
      moveData.target_section_id,
      moveData.position
    );

    if (!insertResult.success) {
      return NextResponse.json(
        { data: null, error: insertResult.error || 'Failed to insert task in target section', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Move the task to the target section
    const { data: movedTask, error: moveError } = await supabase
      .from('tasks')
      .update({
        section_id: moveData.target_section_id,
        position: insertResult.newPosition,
      })
      .eq('id', taskId)
      .select(`
        id,
        section_id,
        position,
        updated_at,
        section:sections!inner (
          id,
          name,
          workspace_id
        )
      `)
      .single();

    if (moveError) {
      console.error('Error moving task:', moveError);
      return NextResponse.json(
        { data: null, error: 'Failed to move task', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Compact source section positions
    const compactResult = await compactSourceSection(
      supabase,
      task.section_id,
      task.position
    );

    if (!compactResult.success) {
      console.error('Failed to compact source section:', compactResult.error);
      // Don't fail the main operation, just log the error
    }

    // Create audit event
    try {
      const event: EventInsert = {
        user_id: user.id,
        workspace_id: task.section.workspace_id,
        event_type: 'moved',
        entity_type: 'task',
        entity_id: taskId,
        old_values: {
          section_id: task.section_id,
          position: task.position,
        },
        new_values: {
          section_id: moveData.target_section_id,
          position: insertResult.newPosition,
        },
      };

      await supabase.from('events').insert([event]);
    } catch (error) {
      console.error('Failed to create audit event:', error);
      // Don't fail the main operation for audit errors
    }

    return NextResponse.json({
      data: {
        id: movedTask.id,
        section_id: movedTask.section_id,
        position: movedTask.position,
        updated_at: movedTask.updated_at,
        section: {
          id: movedTask.section.id,
          name: movedTask.section.name,
          workspace_id: movedTask.section.workspace_id,
        },
      },
      error: null,
      status: 200,
    } satisfies ApiResponse<{
      id: string;
      section_id: string;
      position: number;
      updated_at: string;
      section: {
        id: string;
        name: string;
        workspace_id: string;
      };
    }>);

  } catch (error) {
    console.error('Unexpected error in POST /api/tasks/[id]/move:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}