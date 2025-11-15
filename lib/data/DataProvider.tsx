// =============================================
// DATA PROVIDER - REACT QUERY INTEGRATION
// =============================================
// Wraps the application with React Query provider and real-time subscriptions

'use client';

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, invalidateQueries } from './queryClient';
import { useAuthContext } from '@/components/Auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
// =============================================
// TYPES
// =============================================

export interface DataProviderProps {
  className?: string;
  children: React.ReactNode;
}

// Real-time subscription payload types
interface RealtimePayload {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;
  old: Record<string, any>;
  schema: string;
}

// =============================================
// REAL-TIME SUBSCRIPTION HOOKS
// =============================================

const useRealtimeSubscriptions = (): void => {
  const { user } = useAuthContext();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    // Subscribe to workspace changes
    const workspaceSubscription = supabase
      .channel('workspaces')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspaces',
        },
        (payload: RealtimePayload) => {
          console.log('Workspace change:', payload);
          
          // Invalidate relevant queries
          if (payload.eventType === 'DELETE') {
            invalidateQueries.allWorkspaces();
          } else if (payload.new?.id) {
            invalidateQueries.workspace(payload.new.id);
            invalidateQueries.allWorkspaces();
          }
        }
      )
      .subscribe();

    // Subscribe to section changes
    const sectionSubscription = supabase
      .channel('sections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sections',
        },
        (payload: RealtimePayload) => {
          console.log('Section change:', payload);
          
          if (payload.eventType === 'DELETE') {
            if (payload.old?.workspace_id) {
              invalidateQueries.workspace(payload.old.workspace_id);
            }
          } else if (payload.new?.id) {
            invalidateQueries.section(payload.new.id);
            if (payload.new.workspace_id) {
              invalidateQueries.workspace(payload.new.workspace_id);
            }
          }
          
          invalidateQueries.allWorkspaces();
        }
      )
      .subscribe();

    // Subscribe to task changes
    const taskSubscription = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload: RealtimePayload) => {
          console.log('Task change:', payload);
          
          if (payload.eventType === 'DELETE') {
            if (payload.old?.section_id) {
              invalidateQueries.section(payload.old.section_id);
            }
            if (payload.old?.workspace_id) {
              invalidateQueries.workspace(payload.old.workspace_id);
            }
          } else if (payload.new?.id) {
            invalidateQueries.task(payload.new.id);
            if (payload.new.section_id) {
              invalidateQueries.section(payload.new.section_id);
            }
            if (payload.new.workspace_id) {
              invalidateQueries.workspace(payload.new.workspace_id);
            }
          }
          
          // Always invalidate task lists as they might be affected
          invalidateQueries.allTasks();
        }
      )
      .subscribe();

    // Subscribe to activity/event changes
    const activitySubscription = supabase
      .channel('events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        (payload: RealtimePayload) => {
          console.log('Activity change:', payload);
          invalidateQueries.allActivities();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      workspaceSubscription.unsubscribe();
      sectionSubscription.unsubscribe();
      taskSubscription.unsubscribe();
      activitySubscription.unsubscribe();
    };
  }, [user, supabase]);
};

// =============================================
// DATA PROVIDER COMPONENT
// =============================================

export const DataProvider: React.FC<DataProviderProps> = ({
  children,
  className,
}) => {
  // Set up real-time subscriptions
  useRealtimeSubscriptions();

  return (
    <div className={className}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </div>
  );
};

// =============================================
// OPTIMISTIC UPDATE HELPERS
// =============================================

export const optimisticUpdates = {
  // Optimistically update task completion
  updateTaskCompletion: (taskId: string, completed: boolean) => {
    queryClient.setQueriesData(
      { queryKey: ['tasks'] },
      (oldData: any) => {
        if (!oldData) return oldData;
        
        // Handle different data structures (single task, array, infinite query)
        if (Array.isArray(oldData)) {
          return oldData.map((task: any) =>
            task.id === taskId ? { ...task, status: completed ? 'completed' : 'pending' } : task
          );
        }
        
        if (oldData.pages) {
          // Handle infinite query structure
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((task: any) =>
                task.id === taskId ? { ...task, status: completed ? 'completed' : 'pending' } : task
              ),
            })),
          };
        }
        
        if (oldData.id === taskId) {
          return { ...oldData, status: completed ? 'completed' : 'pending' };
        }
        
        return oldData;
      }
    );
  },

  // Optimistically add new task
  addTask: (sectionId: string, newTask: any) => {
    queryClient.setQueryData(
      ['tasks', 'section', sectionId],
      (oldData: any[]) => {
        if (!oldData) return [newTask];
        return [newTask, ...oldData];
      }
    );
  },

  // Optimistically update task
  updateTask: (taskId: string, updates: Partial<any>) => {
    queryClient.setQueriesData(
      { queryKey: ['tasks'] },
      (oldData: any) => {
        if (!oldData) return oldData;
        
        if (Array.isArray(oldData)) {
          return oldData.map((task: any) =>
            task.id === taskId ? { ...task, ...updates } : task
          );
        }
        
        if (oldData.pages) {
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((task: any) =>
                task.id === taskId ? { ...task, ...updates } : task
              ),
            })),
          };
        }
        
        if (oldData.id === taskId) {
          return { ...oldData, ...updates };
        }
        
        return oldData;
      }
    );
  },

  // Optimistically remove task
  removeTask: (taskId: string) => {
    queryClient.setQueriesData(
      { queryKey: ['tasks'] },
      (oldData: any) => {
        if (!oldData) return oldData;
        
        if (Array.isArray(oldData)) {
          return oldData.filter((task: any) => task.id !== taskId);
        }
        
        if (oldData.pages) {
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.filter((task: any) => task.id !== taskId),
            })),
          };
        }
        
        return oldData;
      }
    );
  },
} as const;