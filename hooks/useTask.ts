// =============================================
// INDIVIDUAL TASK CONTAINER HOOK
// =============================================
// Container logic for individual task data and real-time updates

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { 
  Task,
  ApiResponse 
} from '@/database/types';

export interface TaskWithDetails extends Omit<Task, 'assigned_to_user_id' | 'created_by_user_id'> {
  assigned_to_user_id: string | null;
  created_by_user_id: string;
  section: {
    id: string;
    name: string;
    color: string;
    workspace_id: string;
    workspace: {
      id: string;
      name: string;
      color: string;
    };
  };
  assigned_user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  creator_user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface UseTaskOptions {
  autoRefresh?: boolean;
  enableRealtime?: boolean;
}

export interface UseTaskReturn {
  task: TaskWithDetails | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing individual task data with real-time updates
 * Provides detailed task information including related entities
 */
export const useTask = (
  taskId: string | null,
  options: UseTaskOptions = {}
): UseTaskReturn => {
  const {
    autoRefresh = true,
    enableRealtime = true,
  } = options;

  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Fetch task from API
  const fetchTask = useCallback(async (): Promise<void> => {
    if (!taskId) {
      setTask(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      clearError();

      const response = await fetch(`/api/tasks/${taskId}`);
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to fetch task');
      }

      const data = await response.json() as ApiResponse<TaskWithDetails>;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setTask(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch task';
      setError(errorMessage);
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [taskId, clearError]);

  // Refresh helper (alias for refetch)
  const refresh = useCallback((): Promise<void> => fetchTask(), [fetchTask]);

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    if (autoRefresh) {
      fetchTask();
    }
  }, [fetchTask, autoRefresh]);

  // Real-time updates via Supabase subscriptions
  useEffect(() => {
    if (!enableRealtime || !taskId) return;

    let mounted = true;

    const setupSubscriptions = async () => {
      try {
        // Get current user for filtering
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Subscribe to task changes for this specific task
        const taskSubscription = supabase
          .channel(`task_${taskId}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'tasks',
              filter: `id=eq.${taskId}`,
            },
            async (payload) => {
              if (!mounted) return;
              
              // Check if the change affects a task the user has access to
              if (payload.new && !payload.new.is_deleted) {
                // Task was updated/created - verify user still has access
                try {
                  const { data: taskCheck } = await supabase
                    .from('tasks')
                    .select(`
                      id,
                      section:sections!inner (
                        workspace:workspaces!inner (
                          workspace_members!inner (
                            user_id
                          )
                        )
                      )
                    `)
                    .eq('id', taskId)
                    .eq('section.workspace.workspace_members.user_id', user.id)
                    .single();

                  if (taskCheck) {
                    // User still has access - refresh the task
                    await fetchTask();
                  } else {
                    // User no longer has access - clear the task
                    setTask(null);
                    setError('Access to task has been revoked');
                  }
                } catch (err) {
                  console.error('Error checking task access during update:', err);
                }
              } else if (payload.event === 'DELETE' || (payload.new && payload.new.is_deleted)) {
                // Task was deleted or soft-deleted
                setTask(null);
                setError('Task has been deleted');
              }
            }
          )
          .subscribe();

        return () => {
          taskSubscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up task subscriptions:', err);
      }
    };

    const unsubscribePromise = setupSubscriptions();

    return () => {
      mounted = false;
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, [enableRealtime, taskId, fetchTask]);

  return {
    task,
    loading,
    error,
    
    // Actions
    refetch: fetchTask,
    refresh,
  };
};