// =============================================
// SECTION TASKS CONTAINER HOOK
// =============================================
// Container logic for task listing and management within sections

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { 
  Task,
  TaskStatus,
  TaskPriority,
  PaginatedResponse, 
  ApiResponse 
} from '@/database/types';

export interface TaskWithUsers extends Omit<Task, 'assigned_to_user_id' | 'created_by_user_id'> {
  assigned_to_user_id: string | null;
  created_by_user_id: string;
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

export interface UseSectionTasksOptions {
  page?: number;
  limit?: number;
  includeCompleted?: boolean;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string | 'unassigned';
  autoRefresh?: boolean;
}

export interface UseSectionTasksReturn {
  tasks: TaskWithUsers[];
  loading: boolean;
  error: string | null;
  section: {
    id: string;
    name: string;
    workspace_id: string;
    workspace: {
      id: string;
      name: string;
    };
  } | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  
  // Actions
  refetch: () => Promise<void>;
  
  // Pagination
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  
  // Filters
  setSearch: (search: string) => void;
  setIncludeCompleted: (include: boolean) => void;
  setStatus: (status: TaskStatus | undefined) => void;
  setPriority: (priority: TaskPriority | undefined) => void;
  setAssignedTo: (assignedTo: string | 'unassigned' | undefined) => void;
}

/**
 * Hook for managing tasks within a specific section
 * Provides listing and filtering functionality for section tasks
 */
export const useSectionTasks = (
  sectionId: string | null,
  options: UseSectionTasksOptions = {}
): UseSectionTasksReturn => {
  const {
    page: initialPage = 1,
    limit = 20,
    includeCompleted: initialIncludeCompleted = false,
    search: initialSearch = '',
    status: initialStatus,
    priority: initialPriority,
    assignedTo: initialAssignedTo,
    autoRefresh = true,
  } = options;

  const [tasks, setTasks] = useState<TaskWithUsers[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<UseSectionTasksReturn['section']>(null);
  const [pagination, setPagination] = useState<UseSectionTasksReturn['pagination']>(null);
  
  // Query parameters
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [includeCompleted, setIncludeCompleted] = useState(initialIncludeCompleted);
  const [status, setStatus] = useState<TaskStatus | undefined>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority | undefined>(initialPriority);
  const [assignedTo, setAssignedTo] = useState<string | 'unassigned' | undefined>(initialAssignedTo);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Fetch tasks from API
  const fetchTasks = useCallback(async (): Promise<void> => {
    if (!sectionId) {
      setTasks([]);
      setSection(null);
      setPagination(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      clearError();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      if (includeCompleted) {
        params.append('include_completed', 'true');
      }

      if (status) {
        params.append('status', status);
      }

      if (priority) {
        params.append('priority', priority);
      }

      if (assignedTo) {
        params.append('assigned_to', assignedTo);
      }

      const response = await fetch(`/api/sections/${sectionId}/tasks?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const data = await response.json() as PaginatedResponse<TaskWithUsers> & {
        section?: UseSectionTasksReturn['section'];
      };
      
      if (data.error) {
        throw new Error(data.error);
      }

      setTasks(data.data);
      setPagination(data.pagination);
      setSection(data.section || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      setTasks([]);
      setPagination(null);
      setSection(null);
    } finally {
      setLoading(false);
    }
  }, [sectionId, page, limit, search, includeCompleted, status, priority, assignedTo, clearError]);

  // Pagination actions
  const nextPage = useCallback((): void => {
    if (pagination?.hasNext) {
      setPage(prev => prev + 1);
    }
  }, [pagination?.hasNext]);

  const prevPage = useCallback((): void => {
    if (pagination?.hasPrev) {
      setPage(prev => Math.max(1, prev - 1));
    }
  }, [pagination?.hasPrev]);

  const goToPage = useCallback((targetPage: number): void => {
    if (pagination && targetPage >= 1 && targetPage <= pagination.totalPages) {
      setPage(targetPage);
    }
  }, [pagination]);

  // Filter actions with page reset
  const setSearchWithReset = useCallback((newSearch: string): void => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const setIncludeCompletedWithReset = useCallback((include: boolean): void => {
    setIncludeCompleted(include);
    setPage(1);
  }, []);

  const setStatusWithReset = useCallback((newStatus: TaskStatus | undefined): void => {
    setStatus(newStatus);
    setPage(1);
  }, []);

  const setPriorityWithReset = useCallback((newPriority: TaskPriority | undefined): void => {
    setPriority(newPriority);
    setPage(1);
  }, []);

  const setAssignedToWithReset = useCallback((newAssignedTo: string | 'unassigned' | undefined): void => {
    setAssignedTo(newAssignedTo);
    setPage(1);
  }, []);

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time updates via Supabase subscriptions
  useEffect(() => {
    if (!autoRefresh || !sectionId) return;

    let mounted = true;

    const setupSubscriptions = async () => {
      try {
        // Get current user for filtering
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Subscribe to task changes for this specific section
        const tasksSubscription = supabase
          .channel(`section_tasks_${sectionId}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'tasks',
              filter: `section_id=eq.${sectionId}`,
            },
            async (payload) => {
              if (!mounted) return;
              
              // Check if user has access to this section's workspace
              const { data: sectionCheck } = await supabase
                .from('sections')
                .select(`
                  workspace_id,
                  workspace:workspaces!inner (
                    workspace_members!inner (
                      user_id
                    )
                  )
                `)
                .eq('id', sectionId)
                .eq('workspace.workspace_members.user_id', user.id)
                .single();

              if (sectionCheck) {
                // This task change affects the current user
                await fetchTasks();
              }
            }
          )
          .subscribe();

        return () => {
          tasksSubscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up section tasks subscriptions:', err);
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
  }, [autoRefresh, sectionId, fetchTasks]);

  return {
    tasks,
    loading,
    error,
    section,
    pagination,
    
    // Actions
    refetch: fetchTasks,
    
    // Pagination
    nextPage,
    prevPage,
    goToPage,
    
    // Filters
    setSearch: setSearchWithReset,
    setIncludeCompleted: setIncludeCompletedWithReset,
    setStatus: setStatusWithReset,
    setPriority: setPriorityWithReset,
    setAssignedTo: setAssignedToWithReset,
  };
};