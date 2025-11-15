// =============================================
// REACT QUERY CLIENT SETUP
// =============================================
// Centralized React Query configuration with optimistic caching

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time - data stays in cache for 10 minutes after becoming unused
      gcTime: 10 * 60 * 1000, // 10 minutes
      
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for important data
      refetchOnWindowFocus: true,
      
      // Background refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Error handling
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // Here you could show a toast notification
      },
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // User queries
  user: () => ['user'] as const,
  userProfile: (userId: string) => ['user', 'profile', userId] as const,
  
  // Workspace queries
  workspaces: () => ['workspaces'] as const,
  workspace: (id: string) => ['workspace', id] as const,
  workspaceMembers: (workspaceId: string) => ['workspace', workspaceId, 'members'] as const,
  
  // Section queries
  sections: (workspaceId: string) => ['sections', workspaceId] as const,
  section: (id: string) => ['section', id] as const,
  
  // Task queries
  tasks: (filters?: any) => ['tasks', ...(filters ? [filters] : [])] as const,
  task: (id: string) => ['task', id] as const,
  tasksBySection: (sectionId: string) => ['tasks', 'section', sectionId] as const,
  tasksToday: () => ['tasks', 'today'] as const,
  tasksCompleted: (filters?: any) => ['tasks', 'completed', ...(filters ? [filters] : [])] as const,
  tasksInfinite: (filters?: any) => ['tasks', 'infinite', ...(filters ? [filters] : [])] as const,
  
  // Activity/Event queries
  activities: (filters?: any) => ['activities', ...(filters ? [filters] : [])] as const,
  activitiesInfinite: (filters?: any) => ['activities', 'infinite', ...(filters ? [filters] : [])] as const,
  
  // Search queries
  search: (query: string, filters?: any) => ['search', query, ...(filters ? [filters] : [])] as const,
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all workspace-related data
  allWorkspaces: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
    queryClient.invalidateQueries({ queryKey: ['workspace'] });
    queryClient.invalidateQueries({ queryKey: ['sections'] });
  },
  
  // Invalidate specific workspace
  workspace: (workspaceId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sections(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers(workspaceId) });
  },
  
  // Invalidate all task-related data
  allTasks: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
  
  // Invalidate specific task
  task: (taskId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) });
    // Also invalidate task lists that might contain this task
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
  
  // Invalidate section and its tasks
  section: (sectionId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.section(sectionId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasksBySection(sectionId) });
  },
  
  // Invalidate all activities
  allActivities: () => {
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  },
} as const;

// Prefetch helpers for common navigation patterns
export const prefetchQueries = {
  // Prefetch workspace data when hovering over workspace in sidebar
  workspace: (workspaceId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.workspace(workspaceId),
      queryFn: () => {
        // This would be replaced with actual API call
        throw new Error('API implementation needed');
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
  
  // Prefetch today's tasks
  todayTasks: () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasksToday(),
      queryFn: () => {
        // This would be replaced with actual API call
        throw new Error('API implementation needed');
      },
      staleTime: 1 * 60 * 1000, // 1 minute for time-sensitive data
    });
  },
} as const;