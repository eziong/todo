// =============================================
// TASK DASHBOARD CONTAINER HOOK
// =============================================
// Container logic for dashboard task aggregation and insights

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { 
  TaskStatus,
  TaskPriority,
  ApiResponse 
} from '@/database/types';

export interface DashboardTask {
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

export interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  due_today: number;
  due_this_week: number;
  in_progress_tasks: number;
  urgent_tasks: number;
  high_priority_tasks: number;
  assigned_to_me: number;
  created_by_me: number;
  completion_rate: number;
}

export interface WorkspaceSummary {
  workspace_id: string;
  workspace_name: string;
  workspace_color: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  my_tasks: number;
}

export interface DashboardData {
  stats: DashboardStats;
  workspaces: WorkspaceSummary[];
  recent_tasks: DashboardTask[];
  overdue_tasks: DashboardTask[];
  due_today: DashboardTask[];
  due_this_week: DashboardTask[];
  my_assigned_tasks: DashboardTask[];
}

export interface UseTaskDashboardOptions {
  workspaceId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export interface UseTaskDashboardReturn {
  // Dashboard data
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  
  // Individual data sections for convenience
  stats: DashboardStats | null;
  workspaces: WorkspaceSummary[];
  recentTasks: DashboardTask[];
  overdueTasks: DashboardTask[];
  dueTodayTasks: DashboardTask[];
  dueThisWeekTasks: DashboardTask[];
  myAssignedTasks: DashboardTask[];
  
  // Actions
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // Filtering
  setWorkspaceFilter: (workspaceId?: string) => void;
  workspaceFilter: string | undefined;
  
  // Quick access helpers
  hasOverdueTasks: boolean;
  hasDueTodayTasks: boolean;
  hasMyTasks: boolean;
  completionPercentage: number;
  urgentTaskCount: number;
}

/**
 * Hook for dashboard task aggregation and insights
 * Provides comprehensive dashboard data with real-time updates
 */
export const useTaskDashboard = (
  options: UseTaskDashboardOptions = {}
): UseTaskDashboardReturn => {
  const {
    workspaceId: initialWorkspaceId,
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute default
  } = options;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceFilter, setWorkspaceFilter] = useState<string | undefined>(initialWorkspaceId);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const params = new URLSearchParams();
      if (workspaceFilter) {
        params.append('workspace_id', workspaceFilter);
      }

      const url = `/api/tasks/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to fetch dashboard data');
      }

      const result = await response.json() as ApiResponse<DashboardData>;
      
      if (result.error) {
        throw new Error(result.error);
      }

      setData(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceFilter, clearError]);

  // Refresh helper (alias for refetch)
  const refresh = useCallback((): Promise<void> => fetchDashboard(), [fetchDashboard]);

  // Set workspace filter
  const setWorkspaceFilterAndRefresh = useCallback((newWorkspaceId?: string): void => {
    setWorkspaceFilter(newWorkspaceId);
  }, []);

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    if (autoRefresh) {
      fetchDashboard();
    }
  }, [fetchDashboard, autoRefresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(() => {
      fetchDashboard();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchDashboard]);

  // Extract individual data sections for convenience
  const stats = data?.stats || null;
  const workspaces = data?.workspaces || [];
  const recentTasks = data?.recent_tasks || [];
  const overdueTasks = data?.overdue_tasks || [];
  const dueTodayTasks = data?.due_today || [];
  const dueThisWeekTasks = data?.due_this_week || [];
  const myAssignedTasks = data?.my_assigned_tasks || [];

  // Quick access helpers
  const hasOverdueTasks = overdueTasks.length > 0;
  const hasDueTodayTasks = dueTodayTasks.length > 0;
  const hasMyTasks = myAssignedTasks.length > 0;
  const completionPercentage = stats?.completion_rate || 0;
  const urgentTaskCount = stats?.urgent_tasks || 0;

  return {
    // Dashboard data
    data,
    loading,
    error,
    
    // Individual data sections for convenience
    stats,
    workspaces,
    recentTasks,
    overdueTasks,
    dueTodayTasks,
    dueThisWeekTasks,
    myAssignedTasks,
    
    // Actions
    refetch: fetchDashboard,
    refresh,
    
    // Filtering
    setWorkspaceFilter: setWorkspaceFilterAndRefresh,
    workspaceFilter,
    
    // Quick access helpers
    hasOverdueTasks,
    hasDueTodayTasks,
    hasMyTasks,
    completionPercentage,
    urgentTaskCount,
  };
};