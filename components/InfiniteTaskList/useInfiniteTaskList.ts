// =============================================
// INFINITE TASK LIST CONTAINER HOOK
// =============================================
// Container hook for infinite scrolling task lists with React Query integration

import { useCallback, useMemo } from 'react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { queryKeys } from '@/lib/data/queryClient';
import type { Task, TaskFilters } from '@/types';

// =============================================
// TYPES
// =============================================

export interface UseInfiniteTaskListOptions {
  filters?: TaskFilters;
  pageSize?: number;
  enabled?: boolean;
  searchQuery?: string;
}

export interface UseInfiniteTaskListReturn {
  // Data
  tasks: Task[];
  totalCount: number;
  
  // Loading states
  loading: boolean;
  loadingMore: boolean;
  isInitialLoading: boolean;
  
  // Pagination
  hasNextPage: boolean;
  fetchNextPage: () => void;
  
  // Error handling
  error: Error | null;
  
  // Intersection observer ref for auto-loading
  loadMoreRef: React.RefCallback<Element>;
  
  // Manual control
  refetch: () => void;
  
  // Task actions
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Performance metrics
  itemCount: number;
  pageCount: number;
}

// Mock API function - would be replaced with actual API calls
const fetchTasksPage = async (params: { 
  pageParam: number;
  filters?: TaskFilters;
  searchQuery?: string;
  pageSize?: number;
}): Promise<{
  data: Task[];
  nextCursor: number | null;
  hasNextPage: boolean;
  totalCount: number;
}> => {
  const { pageParam, filters, searchQuery, pageSize = 20 } = params;
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock data generation
  const generateMockTask = (index: number): Task => ({
    id: `task-${pageParam}-${index}`,
    title: `Task ${pageParam * pageSize + index + 1}`,
    description: `Description for task ${pageParam * pageSize + index + 1}`,
    status: Math.random() > 0.7 ? 'completed' : 'pending',
    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as Task['priority'],
    due_date: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
    section_id: 'mock-section-id',
    workspace_id: 'mock-workspace-id',
    created_by_user_id: 'mock-user-id',
    assigned_to_user_id: Math.random() > 0.5 ? 'mock-user-id' : null,
    position: pageParam * pageSize + index,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: [],
    attachments: [],
  });
  
  // Filter based on search query
  const allTasks = Array.from({ length: pageSize }, (_, index) => generateMockTask(index));
  
  let filteredTasks = allTasks;
  if (searchQuery) {
    filteredTasks = allTasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Apply filters
  if (filters?.status) {
    filteredTasks = filteredTasks.filter(task => task.status === filters.status);
  }
  
  if (filters?.priority) {
    filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
  }
  
  if (filters?.assignedToMe) {
    filteredTasks = filteredTasks.filter(task => task.assigned_to_user_id === 'mock-user-id');
  }
  
  if (filters?.dueToday) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    filteredTasks = filteredTasks.filter(task => 
      task.due_date && new Date(task.due_date) <= today
    );
  }
  
  // Simulate pagination
  const hasNextPage = pageParam < 10; // Simulate 10 pages max
  const nextCursor = hasNextPage ? pageParam + 1 : null;
  const totalCount = hasNextPage ? (pageParam + 1) * pageSize + Math.floor(Math.random() * pageSize) : (pageParam + 1) * pageSize;
  
  return {
    data: filteredTasks,
    nextCursor,
    hasNextPage,
    totalCount,
  };
};

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useInfiniteTaskList = ({
  filters,
  pageSize = 20,
  enabled = true,
  searchQuery,
}: UseInfiniteTaskListOptions = {}): UseInfiniteTaskListReturn => {
  
  // Generate unique query key based on filters and search
  const queryKey = useMemo(() => 
    queryKeys.tasksInfinite({ ...filters, search: searchQuery })
  , [filters, searchQuery]);

  // Use infinite scroll hook
  const {
    flatData: tasks,
    totalCount,
    loading,
    loadingMore,
    isInitialLoading,
    hasNextPage,
    fetchNextPage,
    error,
    ref: loadMoreRef,
    refetch,
    itemCount,
    pageCount,
  } = useInfiniteScroll<Task>({
    queryKey,
    queryFn: ({ pageParam }) => fetchTasksPage({
      pageParam,
      filters,
      searchQuery,
      pageSize,
    }),
    pageSize,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes for task data
    rootMargin: '100px', // Start loading 100px before scrolling to bottom
  });

  // Task action handlers (would integrate with mutations)
  const toggleTaskCompletion = useCallback(async (taskId: string): Promise<void> => {
    try {
      // Mock implementation - would use React Query mutation
      console.log('Toggle task completion:', taskId);
      
      // Simulate optimistic update
      // optimisticUpdates.updateTaskCompletion(taskId, !tasks.find(t => t.id === taskId)?.status === 'completed');
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      throw error;
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>): Promise<void> => {
    try {
      console.log('Update task:', taskId, updates);
      
      // Simulate optimistic update
      // optimisticUpdates.updateTask(taskId, updates);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      console.log('Delete task:', taskId);
      
      // Simulate optimistic update
      // optimisticUpdates.removeTask(taskId);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }, []);

  return {
    // Data
    tasks,
    totalCount,
    
    // Loading states
    loading,
    loadingMore,
    isInitialLoading,
    
    // Pagination
    hasNextPage,
    fetchNextPage,
    
    // Error handling
    error,
    
    // Intersection observer ref
    loadMoreRef,
    
    // Manual control
    refetch,
    
    // Task actions
    toggleTaskCompletion,
    updateTask,
    deleteTask,
    
    // Performance metrics
    itemCount,
    pageCount,
  };
};