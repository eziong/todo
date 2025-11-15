// =============================================
// TASK ASSIGNMENTS CONTAINER HOOK
// =============================================
// Container logic for managing task assignments within workspaces

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { 
  ApiResponse 
} from '@/database/types';

export interface AssignableUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  last_active_at: string | null;
}

export interface TaskAssignmentSummary {
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar_url: string | null;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
  avg_completion_time_hours: number | null;
}

export interface UseTaskAssignmentsOptions {
  autoRefresh?: boolean;
  includeInactiveUsers?: boolean;
}

export interface UseTaskAssignmentsReturn {
  // User data
  assignableUsers: AssignableUser[];
  assignmentSummaries: TaskAssignmentSummary[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // User queries
  getUserById: (userId: string) => AssignableUser | null;
  getUsersByRole: (role: AssignableUser['role']) => AssignableUser[];
  getActiveUsers: () => AssignableUser[];
  
  // Assignment queries
  getUserAssignmentSummary: (userId: string) => TaskAssignmentSummary | null;
  getTopPerformers: (limit?: number) => TaskAssignmentSummary[];
  getOverloadedUsers: (threshold?: number) => TaskAssignmentSummary[];
  
  // Utilities
  hasUsers: boolean;
  totalUsers: number;
  activeUsersCount: number;
}

/**
 * Hook for managing task assignments within a workspace
 * Provides user lists and assignment analytics for task management
 */
export const useTaskAssignments = (
  workspaceId: string | null,
  options: UseTaskAssignmentsOptions = {}
): UseTaskAssignmentsReturn => {
  const {
    autoRefresh = true,
    includeInactiveUsers = true,
  } = options;

  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [assignmentSummaries, setAssignmentSummaries] = useState<TaskAssignmentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Fetch assignable users from workspace members API
  const fetchAssignableUsers = useCallback(async (): Promise<void> => {
    if (!workspaceId) {
      setAssignableUsers([]);
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to fetch workspace members');
      }

      const data = await response.json() as ApiResponse<any[]>;
      
      if (data.error) {
        throw new Error(data.error);
      }

      const users: AssignableUser[] = (data.data || []).map((member: any) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatar_url: member.user.avatar_url,
        role: member.role,
        last_active_at: member.last_active_at,
      }));

      setAssignableUsers(users);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignable users';
      setError(errorMessage);
      setAssignableUsers([]);
    }
  }, [workspaceId]);

  // Calculate assignment summaries from task data
  const calculateAssignmentSummaries = useCallback(async (): Promise<void> => {
    if (!workspaceId || assignableUsers.length === 0) {
      setAssignmentSummaries([]);
      return;
    }

    try {
      // Get all tasks in the workspace with assignment and completion data
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          assigned_to_user_id,
          status,
          due_date,
          created_at,
          completed_at,
          section:sections!inner (
            workspace_id
          )
        `)
        .eq('section.workspace_id', workspaceId)
        .eq('is_deleted', false);

      if (tasksError) {
        throw new Error('Failed to fetch task data for assignment summaries');
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const summaries: TaskAssignmentSummary[] = assignableUsers.map(user => {
        const userTasks = (tasks || []).filter(task => task.assigned_to_user_id === user.id);
        const completedTasks = userTasks.filter(task => task.status === 'completed');
        const overdueTasks = userTasks.filter(task => 
          task.due_date && 
          new Date(task.due_date) < today && 
          task.status !== 'completed'
        );
        const inProgressTasks = userTasks.filter(task => task.status === 'in_progress');

        // Calculate completion rate
        const completionRate = userTasks.length > 0 
          ? Math.round((completedTasks.length / userTasks.length) * 100)
          : 0;

        // Calculate average completion time
        let avgCompletionTimeHours = null;
        if (completedTasks.length > 0) {
          const totalCompletionTime = completedTasks.reduce((total, task) => {
            if (task.completed_at && task.created_at) {
              const createdAt = new Date(task.created_at);
              const completedAt = new Date(task.completed_at);
              const diffHours = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
              return total + diffHours;
            }
            return total;
          }, 0);
          
          avgCompletionTimeHours = Math.round(totalCompletionTime / completedTasks.length * 10) / 10;
        }

        return {
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          user_avatar_url: user.avatar_url,
          total_tasks: userTasks.length,
          completed_tasks: completedTasks.length,
          overdue_tasks: overdueTasks.length,
          in_progress_tasks: inProgressTasks.length,
          completion_rate: completionRate,
          avg_completion_time_hours: avgCompletionTimeHours,
        };
      });

      setAssignmentSummaries(summaries);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate assignment summaries';
      setError(errorMessage);
      setAssignmentSummaries([]);
    }
  }, [workspaceId, assignableUsers]);

  // Main fetch function
  const fetchData = useCallback(async (): Promise<void> => {
    if (!workspaceId) {
      setAssignableUsers([]);
      setAssignmentSummaries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      clearError();

      // Fetch users first, then calculate summaries
      await fetchAssignableUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignment data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, clearError, fetchAssignableUsers]);

  // Calculate summaries when users change
  useEffect(() => {
    if (assignableUsers.length > 0) {
      calculateAssignmentSummaries();
    }
  }, [assignableUsers, calculateAssignmentSummaries]);

  // Refresh helper (alias for refetch)
  const refresh = useCallback((): Promise<void> => fetchData(), [fetchData]);

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    if (autoRefresh) {
      fetchData();
    }
  }, [fetchData, autoRefresh]);

  // User query functions
  const getUserById = useCallback((userId: string): AssignableUser | null => {
    return assignableUsers.find(user => user.id === userId) || null;
  }, [assignableUsers]);

  const getUsersByRole = useCallback((role: AssignableUser['role']): AssignableUser[] => {
    return assignableUsers.filter(user => user.role === role);
  }, [assignableUsers]);

  const getActiveUsers = useCallback((): AssignableUser[] => {
    if (includeInactiveUsers) {
      return assignableUsers;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return assignableUsers.filter(user => {
      if (!user.last_active_at) {
        return false; // No activity recorded
      }
      return new Date(user.last_active_at) >= thirtyDaysAgo;
    });
  }, [assignableUsers, includeInactiveUsers]);

  // Assignment query functions
  const getUserAssignmentSummary = useCallback((userId: string): TaskAssignmentSummary | null => {
    return assignmentSummaries.find(summary => summary.user_id === userId) || null;
  }, [assignmentSummaries]);

  const getTopPerformers = useCallback((limit: number = 5): TaskAssignmentSummary[] => {
    return [...assignmentSummaries]
      .filter(summary => summary.total_tasks > 0)
      .sort((a, b) => b.completion_rate - a.completion_rate)
      .slice(0, limit);
  }, [assignmentSummaries]);

  const getOverloadedUsers = useCallback((threshold: number = 10): TaskAssignmentSummary[] => {
    return assignmentSummaries.filter(summary => 
      summary.total_tasks - summary.completed_tasks >= threshold
    );
  }, [assignmentSummaries]);

  // Computed properties
  const hasUsers = assignableUsers.length > 0;
  const totalUsers = assignableUsers.length;
  const activeUsersCount = getActiveUsers().length;

  return {
    // User data
    assignableUsers,
    assignmentSummaries,
    loading,
    error,
    
    // Actions
    refetch: fetchData,
    refresh,
    
    // User queries
    getUserById,
    getUsersByRole,
    getActiveUsers,
    
    // Assignment queries
    getUserAssignmentSummary,
    getTopPerformers,
    getOverloadedUsers,
    
    // Utilities
    hasUsers,
    totalUsers,
    activeUsersCount,
  };
};