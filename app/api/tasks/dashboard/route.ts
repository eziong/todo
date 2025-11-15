// =============================================
// TASK DASHBOARD API ROUTES
// =============================================
// Handles dashboard task aggregation and insights

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/permissions';
import type { 
  TaskStatus,
  TaskPriority,
  ApiResponse 
} from '@/database/types';

interface DashboardTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_to_user_id: string | null;
  workspace_id: string;
  workspace_name: string;
  section_id: string;
  section_name: string;
  assigned_user: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  due_today: number;
  due_this_week: number;
  in_progress_tasks: number;
  
  // By priority
  urgent_tasks: number;
  high_priority_tasks: number;
  
  // By assignment
  assigned_to_me: number;
  created_by_me: number;
  
  // Completion rate (percentage)
  completion_rate: number;
}

interface WorkspaceSummary {
  workspace_id: string;
  workspace_name: string;
  workspace_color: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  my_tasks: number;
}

interface DashboardData {
  stats: DashboardStats;
  workspaces: WorkspaceSummary[];
  recent_tasks: DashboardTask[];
  overdue_tasks: DashboardTask[];
  due_today: DashboardTask[];
  due_this_week: DashboardTask[];
  my_assigned_tasks: DashboardTask[];
}

/**
 * Get date ranges for dashboard calculations
 */
function getDateRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  return {
    today: today.toISOString().split('T')[0],
    tomorrow: tomorrow.toISOString().split('T')[0],
    weekFromNow: weekFromNow.toISOString().split('T')[0],
    now: now.toISOString(),
  };
}

/**
 * Get dashboard statistics
 */
async function getDashboardStats(supabase: any, userId: string): Promise<DashboardStats> {
  const dates = getDateRanges();
  
  // Get all tasks the user has access to
  const { data: allTasks, error } = await supabase
    .from('tasks')
    .select(`
      id,
      status,
      priority,
      due_date,
      assigned_to_user_id,
      created_by_user_id,
      completed_at,
      section:sections!inner (
        workspace:workspaces!inner (
          workspace_members!inner (
            user_id
          )
        )
      )
    `)
    .eq('is_deleted', false)
    .eq('section.workspace.workspace_members.user_id', userId);

  if (error || !allTasks) {
    throw new Error('Failed to fetch tasks for dashboard stats');
  }

  const stats: DashboardStats = {
    total_tasks: allTasks.length,
    completed_tasks: 0,
    overdue_tasks: 0,
    due_today: 0,
    due_this_week: 0,
    in_progress_tasks: 0,
    urgent_tasks: 0,
    high_priority_tasks: 0,
    assigned_to_me: 0,
    created_by_me: 0,
    completion_rate: 0,
  };

  for (const task of allTasks) {
    // Status counts
    if (task.status === 'completed') {
      stats.completed_tasks++;
    } else if (task.status === 'in_progress') {
      stats.in_progress_tasks++;
    }

    // Priority counts
    if (task.priority === 'urgent') {
      stats.urgent_tasks++;
    } else if (task.priority === 'high') {
      stats.high_priority_tasks++;
    }

    // Assignment counts
    if (task.assigned_to_user_id === userId) {
      stats.assigned_to_me++;
    }
    if (task.created_by_user_id === userId) {
      stats.created_by_me++;
    }

    // Due date analysis (only for non-completed tasks)
    if (task.due_date && task.status !== 'completed') {
      const dueDate = task.due_date;
      
      if (dueDate < dates.today) {
        stats.overdue_tasks++;
      } else if (dueDate === dates.today) {
        stats.due_today++;
      } else if (dueDate <= dates.weekFromNow) {
        stats.due_this_week++;
      }
    }
  }

  // Calculate completion rate
  if (stats.total_tasks > 0) {
    stats.completion_rate = Math.round((stats.completed_tasks / stats.total_tasks) * 100);
  }

  return stats;
}

/**
 * Get workspace summaries
 */
async function getWorkspaceSummaries(supabase: any, userId: string): Promise<WorkspaceSummary[]> {
  const dates = getDateRanges();

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select(`
      id,
      name,
      color,
      workspace_members!inner (
        user_id
      ),
      sections!inner (
        tasks (
          id,
          status,
          due_date,
          assigned_to_user_id,
          is_deleted
        )
      )
    `)
    .eq('workspace_members.user_id', userId)
    .eq('is_deleted', false);

  if (error || !workspaces) {
    throw new Error('Failed to fetch workspace summaries');
  }

  return workspaces.map((workspace: any) => {
    const allTasks = workspace.sections.flatMap((section: any) => 
      section.tasks.filter((task: any) => !task.is_deleted)
    );

    const completedTasks = allTasks.filter((task: any) => task.status === 'completed').length;
    const overdueTasks = allTasks.filter((task: any) => 
      task.due_date && task.due_date < dates.today && task.status !== 'completed'
    ).length;
    const myTasks = allTasks.filter((task: any) => task.assigned_to_user_id === userId).length;

    return {
      workspace_id: workspace.id,
      workspace_name: workspace.name,
      workspace_color: workspace.color,
      total_tasks: allTasks.length,
      completed_tasks: completedTasks,
      overdue_tasks: overdueTasks,
      my_tasks: myTasks,
    };
  });
}

/**
 * Get task lists for dashboard sections
 */
async function getDashboardTasks(supabase: any, userId: string) {
  const dates = getDateRanges();

  // Base query for tasks with full details
  const baseQuery = `
    id,
    title,
    status,
    priority,
    due_date,
    assigned_to_user_id,
    created_at,
    updated_at,
    section:sections!inner (
      id,
      name,
      workspace_id,
      workspace:workspaces!inner (
        id,
        name,
        workspace_members!inner (
          user_id
        )
      )
    ),
    assigned_user:users!assigned_to_user_id (
      id,
      name,
      avatar_url
    )
  `;

  // Recent tasks (last 10 updated)
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select(baseQuery)
    .eq('is_deleted', false)
    .eq('section.workspace.workspace_members.user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(10);

  // Overdue tasks
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select(baseQuery)
    .eq('is_deleted', false)
    .eq('section.workspace.workspace_members.user_id', userId)
    .lt('due_date', dates.today)
    .neq('status', 'completed')
    .order('due_date', { ascending: true })
    .limit(20);

  // Due today
  const { data: dueTodayTasks } = await supabase
    .from('tasks')
    .select(baseQuery)
    .eq('is_deleted', false)
    .eq('section.workspace.workspace_members.user_id', userId)
    .eq('due_date', dates.today)
    .neq('status', 'completed')
    .order('priority', { ascending: false })
    .limit(20);

  // Due this week
  const { data: dueThisWeekTasks } = await supabase
    .from('tasks')
    .select(baseQuery)
    .eq('is_deleted', false)
    .eq('section.workspace.workspace_members.user_id', userId)
    .gt('due_date', dates.today)
    .lte('due_date', dates.weekFromNow)
    .neq('status', 'completed')
    .order('due_date', { ascending: true })
    .limit(20);

  // My assigned tasks (not completed)
  const { data: myAssignedTasks } = await supabase
    .from('tasks')
    .select(baseQuery)
    .eq('is_deleted', false)
    .eq('section.workspace.workspace_members.user_id', userId)
    .eq('assigned_to_user_id', userId)
    .neq('status', 'completed')
    .order('priority', { ascending: false })
    .limit(20);

  // Transform function
  const transformTask = (task: any): DashboardTask => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    assigned_to_user_id: task.assigned_to_user_id,
    workspace_id: task.section.workspace_id,
    workspace_name: task.section.workspace.name,
    section_id: task.section.id,
    section_name: task.section.name,
    assigned_user: task.assigned_user ? {
      id: task.assigned_user.id,
      name: task.assigned_user.name,
      avatar_url: task.assigned_user.avatar_url,
    } : null,
  });

  return {
    recent_tasks: (recentTasks || []).map(transformTask),
    overdue_tasks: (overdueTasks || []).map(transformTask),
    due_today: (dueTodayTasks || []).map(transformTask),
    due_this_week: (dueThisWeekTasks || []).map(transformTask),
    my_assigned_tasks: (myAssignedTasks || []).map(transformTask),
  };
}

// GET /api/tasks/dashboard - Get dashboard data
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

    // Parse query parameters for optional filters
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');

    // Fetch dashboard data in parallel
    const [stats, workspaces, taskLists] = await Promise.all([
      getDashboardStats(supabase, user.id),
      getWorkspaceSummaries(supabase, user.id),
      getDashboardTasks(supabase, user.id),
    ]);

    // Filter by workspace if specified
    let filteredWorkspaces = workspaces;
    if (workspaceId) {
      filteredWorkspaces = workspaces.filter(w => w.workspace_id === workspaceId);
    }

    const dashboardData: DashboardData = {
      stats,
      workspaces: filteredWorkspaces,
      ...taskLists,
    };

    return NextResponse.json({
      data: dashboardData,
      error: null,
      status: 200,
    } satisfies ApiResponse<DashboardData>);

  } catch (error) {
    console.error('Unexpected error in GET /api/tasks/dashboard:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', status: 500 } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}