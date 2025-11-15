// =============================================
// TASK DUPLICATION API ROUTES
// =============================================
// Handles task duplication within sections

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/permissions';
import { 
  validateTaskInsert, 
  validateUUID 
} from '@/lib/validation/task';
import type { 
  TaskInsert,
  ApiResponse,
  EventInsert 
} from '@/database/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface DuplicateTaskRequest {
  title_suffix?: string;
  target_section_id?: string;
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
      message: 'Insufficient permissions to duplicate tasks',
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
 * Helper function to check target section if different from source
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
      message: 'Cannot duplicate tasks to different workspaces',
    };
  }

  const permissions = targetSection.workspace.workspace_members[0]?.permissions;
  if (!permissions?.write) {
    return {
      section: targetSection,
      allowed: false,
      status: 403,
      message: 'Insufficient permissions to create tasks in target section',
    };
  }

  return {
    section: targetSection,
    allowed: true,
    status: 200,
    message: 'Success',
  };
}

// POST /api/tasks/[id]/duplicate - Duplicate task
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
    let duplicateData: DuplicateTaskRequest = {};
    try {
      duplicateData = await request.json();
    } catch {
      // Empty body is acceptable for duplication
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

    // Determine target section
    const targetSectionId = duplicateData.target_section_id || task.section_id;
    let targetSection = task.section;

    // Check target section permissions if different from source
    if (targetSectionId !== task.section_id) {
      const targetSectionCheck = await checkTargetSection(
        supabase,
        user.id,
        targetSectionId,
        task.section.workspace_id
      );

      if (!targetSectionCheck.allowed || !targetSectionCheck.section) {
        return NextResponse.json(
          { data: null, error: targetSectionCheck.message, status: targetSectionCheck.status } satisfies ApiResponse<null>,
          { status: targetSectionCheck.status }
        );
      }

      targetSection = targetSectionCheck.section;
    }

    // Get next position in target section
    let nextPosition = 0;
    if (duplicateData.position !== undefined) {
      nextPosition = duplicateData.position;
    } else {
      const { data: lastTask } = await supabase
        .from('tasks')
        .select('position')
        .eq('section_id', targetSectionId)
        .eq('is_deleted', false)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      nextPosition = lastTask ? lastTask.position + 1 : 0;
    }

    // Create duplicate task data
    const titleSuffix = duplicateData.title_suffix || ' (Copy)';
    const duplicateTaskData: TaskInsert = {
      section_id: targetSectionId,
      workspace_id: task.workspace_id,
      title: `${task.title}${titleSuffix}`,
      description: task.description,
      status: 'todo', // Always start duplicates as todo
      priority: task.priority,
      assigned_to_user_id: undefined, // Don't copy assignment
      created_by_user_id: user.id,
      start_date: task.start_date,
      end_date: task.end_date,
      due_date: task.due_date,
      position: nextPosition,
      tags: [...(task.tags || [])],
      estimated_hours: task.estimated_hours,
      actual_hours: undefined, // Reset actual hours for duplicate
      attachments: [], // Don't copy attachments for now
      completed_at: undefined,
    };

    // Validate duplicate task data
    const validation = validateTaskInsert(duplicateTaskData);
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

    // Insert duplicate task
    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert([duplicateTaskData])
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
      console.error('Error duplicating task:', insertError);
      return NextResponse.json(
        { data: null, error: 'Failed to duplicate task', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    // Create audit event
    try {
      const event: EventInsert = {
        user_id: user.id,
        workspace_id: task.workspace_id,
        event_type: 'created',
        entity_type: 'task',
        entity_id: newTask.id,
        new_values: {
          ...duplicateTaskData,
          duplicated_from: taskId,
        },
        category: 'user_action',
        severity: 'info',
        source: 'web',
        tags: [],
        context: {
          original_task_id: taskId,
          original_task_title: task.title,
          duplicate_task_title: duplicateTaskData.title
        }
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
      duplicated_from: taskId,
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
    console.error('Unexpected error in POST /api/tasks/[id]/duplicate:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}