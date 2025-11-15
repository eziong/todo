// =============================================
// TASK SEARCH API ROUTES
// =============================================
// Handles global task search across workspaces

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/permissions';
import { 
  validateSearchQuery, 
  validatePagination 
} from '@/lib/validation/task';
import type { 
  TaskStatus,
  TaskPriority,
  SearchResponse,
  ApiResponse 
} from '@/database/types';

/**
 * Build search query with filters
 */
function buildSearchQuery(
  supabase: any,
  userId: string,
  searchTerm?: string,
  workspaceId?: string,
  status?: TaskStatus[],
  priority?: TaskPriority[],
  assignedToUserId?: string[],
  dueDateFrom?: string,
  dueDateTo?: string,
  tags?: string[]
) {
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
      section:sections!inner (
        id,
        name,
        workspace_id,
        workspace:workspaces!inner (
          id,
          name,
          color,
          workspace_members!inner (
            user_id
          )
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
    .eq('is_deleted', false)
    .eq('section.workspace.workspace_members.user_id', userId);

  // Workspace filter
  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  // Text search
  if (searchTerm) {
    // Use PostgreSQL full-text search if available, otherwise use ilike
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  // Status filter
  if (status && status.length > 0) {
    query = query.in('status', status);
  }

  // Priority filter
  if (priority && priority.length > 0) {
    query = query.in('priority', priority);
  }

  // Assigned user filter
  if (assignedToUserId && assignedToUserId.length > 0) {
    if (assignedToUserId.includes('unassigned')) {
      const otherUserIds = assignedToUserId.filter(id => id !== 'unassigned');
      if (otherUserIds.length > 0) {
        query = query.or(`assigned_to_user_id.is.null,assigned_to_user_id.in.(${otherUserIds.join(',')})`);
      } else {
        query = query.is('assigned_to_user_id', null);
      }
    } else {
      query = query.in('assigned_to_user_id', assignedToUserId);
    }
  }

  // Due date range filter
  if (dueDateFrom) {
    query = query.gte('due_date', dueDateFrom);
  }
  if (dueDateTo) {
    query = query.lte('due_date', dueDateTo);
  }

  // Tags filter
  if (tags && tags.length > 0) {
    // PostgreSQL array overlap operator
    query = query.overlaps('tags', tags);
  }

  return query;
}

// GET /api/tasks/search - Global task search
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const authResult = await requireAuth();
    if (!authResult) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', status: 401 } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    const { user, supabase } = authResult;

    // Parse query parameters
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('q');
    const workspaceId = url.searchParams.get('workspace_id');
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '20';
    
    // Filter parameters
    const statusParams = url.searchParams.getAll('status') as TaskStatus[];
    const priorityParams = url.searchParams.getAll('priority') as TaskPriority[];
    const assignedToParams = url.searchParams.getAll('assigned_to');
    const dueDateFrom = url.searchParams.get('due_date_from');
    const dueDateTo = url.searchParams.get('due_date_to');
    const tagsParams = url.searchParams.getAll('tags');

    // Sort parameters
    const sortBy = url.searchParams.get('sort_by') || 'updated_at';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';

    // Validate search query
    const searchValidation = validateSearchQuery(searchTerm || undefined);
    if (!searchValidation.isValid) {
      return NextResponse.json(
        { 
          data: null, 
          error: searchValidation.errors.map(e => e.message).join(', '), 
          status: 400 
        } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate pagination
    const paginationValidation = validatePagination(page, limit);
    if (!paginationValidation.isValid) {
      return NextResponse.json(
        { 
          data: null, 
          error: paginationValidation.errors.map(e => e.message).join(', '), 
          status: 400 
        } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Validate sort parameters
    const validSortFields = ['title', 'created_at', 'updated_at', 'due_date', 'priority', 'status'];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { data: null, error: 'Invalid sort field', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json(
        { data: null, error: 'Invalid sort order', status: 400 } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Build and execute search query
    let query = buildSearchQuery(
      supabase,
      user.id,
      searchTerm || undefined,
      workspaceId || undefined,
      statusParams.length > 0 ? statusParams : undefined,
      priorityParams.length > 0 ? priorityParams : undefined,
      assignedToParams.length > 0 ? assignedToParams : undefined,
      dueDateFrom || undefined,
      dueDateTo || undefined,
      tagsParams.length > 0 ? tagsParams : undefined
    );

    // Add sorting
    const ascending = sortOrder === 'asc';
    if (sortBy === 'priority') {
      // Custom priority sorting: urgent > high > medium > low
      const priorityOrder = "CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END";
      query = query.order(priorityOrder, { ascending });
    } else {
      query = query.order(sortBy, { ascending });
    }

    // Add pagination
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data: tasks, error: tasksError, count } = await query;

    if (tasksError) {
      console.error('Error searching tasks:', tasksError);
      return NextResponse.json(
        { data: null, error: 'Search failed', status: 500 } satisfies ApiResponse<null>,
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const searchTime = endTime - startTime;

    // Transform results
    const transformedTasks = tasks?.map((task: any) => ({
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
      section: {
        id: task.section.id,
        name: task.section.name,
        workspace_id: task.section.workspace_id,
        workspace: {
          id: task.section.workspace.id,
          name: task.section.workspace.name,
          color: task.section.workspace.color,
        },
      },
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

    const total = count || 0;

    const response: SearchResponse<typeof transformedTasks[0]> = {
      data: transformedTasks,
      query: searchTerm || '',
      total,
      took: searchTime,
      error: null,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in GET /api/tasks/search:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}