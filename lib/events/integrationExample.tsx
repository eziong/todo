/** @jsxImportSource react */
// =============================================
// EVENT LOGGING INTEGRATION EXAMPLES
// =============================================
// Examples of how to integrate event logging into existing API routes and components

import { NextRequest, NextResponse } from 'next/server';
import { withAutoEventLogging } from '@/lib/events/middleware';
import { eventLogger } from '@/lib/events/eventLogger';
import { createClient } from '@/lib/supabase/server';
import type { SystemEventContext } from '@/types/database';

// =============================================
// EXAMPLE: TASK UPDATE API ROUTE WITH EVENT LOGGING
// =============================================

async function updateTaskHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const taskId = params.id;
    const updateData = await req.json();
    
    // Generate correlation ID for related events
    const correlationId = eventLogger.generateCorrelationId();

    // Get current task data for comparison
    const { data: currentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError || !currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select('*')
      .single();

    if (updateError) {
      // Log error event
      await eventLogger.logError({
        workspaceId: currentTask.workspace_id,
        errorCode: 'TASK_UPDATE_FAILED',
        errorMessage: updateError.message,
        entityType: 'task',
        entityId: taskId,
        correlationId,
        context: {
          update_data: updateData,
          error_details: updateError
        } as SystemEventContext
      });

      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    // Log successful task update event
    // Note: This will be automatically logged by the database trigger,
    // but we can log additional context or custom events here
    await eventLogger.logTaskUpdated({
      workspaceId: currentTask.workspace_id,
      taskId,
      oldTaskData: currentTask,
      newTaskData: updatedTask,
      correlationId
    });

    // Log specific events based on what changed
    if (currentTask.status !== updatedTask.status && updatedTask.status === 'completed') {
      // Log task completion as a separate celebratory event
      await eventLogger.logEvent({
        workspaceId: currentTask.workspace_id,
        eventType: 'completed',
        entityType: 'task',
        entityId: taskId,
        category: 'user_action',
        severity: 'info',
        correlationId,
        context: {
          completed_by: user.id,
          completion_time: new Date().toISOString(),
          previous_status: currentTask.status,
          time_to_complete: currentTask.created_at ? 
            Date.now() - new Date(currentTask.created_at).getTime() : null
        },
        tags: ['task', 'completion', 'milestone']
      });
    }

    if (currentTask.assigned_to_user_id !== updatedTask.assigned_to_user_id) {
      // Log assignment change
      await eventLogger.logEvent({
        workspaceId: currentTask.workspace_id,
        eventType: currentTask.assigned_to_user_id ? 'reassigned' : 'assigned',
        entityType: 'task',
        entityId: taskId,
        category: 'user_action',
        severity: 'info',
        correlationId,
        relatedEntityType: 'user',
        relatedEntityId: updatedTask.assigned_to_user_id,
        context: {
          previous_assignee: currentTask.assigned_to_user_id,
          new_assignee: updatedTask.assigned_to_user_id,
          assigned_by: user.id
        },
        tags: ['task', 'assignment', 'collaboration']
      });
    }

    return NextResponse.json({ data: updatedTask });

  } catch (error) {
    console.error('Error updating task:', error);
    
    // Log unexpected error
    await eventLogger.logError({
      errorCode: 'TASK_UPDATE_EXCEPTION',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stackTrace: error instanceof Error ? error.stack : undefined,
      entityType: 'task',
      entityId: params.id,
      context: {
        user_id: user.id,
        request_body: await req.json().catch(() => null)
      } as SystemEventContext
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export with auto event logging
export const PATCH = withAutoEventLogging(updateTaskHandler, {
  eventType: 'api_call',
  entityType: 'task',
  category: 'user_action'
});

// =============================================
// EXAMPLE: COMPONENT WITH EVENT LOGGING
// =============================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useEventLogger } from '@/hooks/useActivity';

interface TaskCardProps {
  task: any;
  onTaskUpdate: (taskId: string, updates: any) => void;
  onTaskView: (taskId: string) => void;
}

export function TaskCardWithEventLogging({ task, onTaskUpdate, onTaskView }: TaskCardProps) {
  const { logTaskEvent, logEntityView, generateCorrelationId } = useEventLogger();

  const handleTaskClick = async () => {
    // Log task view event
    await logEntityView({
      workspaceId: task.workspace_id,
      entityType: 'task',
      entityId: task.id,
      context: {
        view_source: 'task_card',
        task_status: task.status,
        task_priority: task.priority
      }
    });

    onTaskView(task.id);
  };

  const handleStatusChange = async (newStatus: string) => {
    const correlationId = generateCorrelationId();
    
    // Update task
    const oldTaskData = { ...task };
    const newTaskData = { ...task, status: newStatus };
    
    try {
      await onTaskUpdate(task.id, { status: newStatus });
      
      // Log the task update event
      await logTaskEvent({
        workspaceId: task.workspace_id,
        taskId: task.id,
        eventType: 'updated',
        oldTaskData,
        newTaskData,
        correlationId
      });

    } catch (error) {
      console.error('Failed to update task status:', error);
      // Error logging would be handled by the API route
    }
  };

  return (
    <div 
      className="task-card p-4 border rounded-lg cursor-pointer hover:shadow-md"
      onClick={handleTaskClick}
    >
      <h3 className="font-semibold">{task.title}</h3>
      <p className="text-sm text-gray-600">{task.description}</p>
      
      <div className="mt-2 flex justify-between items-center">
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          onClick={(e) => e.stopPropagation()} // Prevent card click
          className="px-2 py-1 border rounded"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        <span className={`px-2 py-1 rounded text-xs ${
          task.priority === 'high' ? 'bg-red-100 text-red-800' :
          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
}

// =============================================
// EXAMPLE: SEARCH COMPONENT WITH EVENT LOGGING
// =============================================

import { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchWithEventLoggingProps {
  onSearch: (query: string) => Promise<any[]>;
  workspaceId?: string;
}

export function SearchWithEventLogging({ onSearch, workspaceId }: SearchWithEventLoggingProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { logSearchEvent } = useEventLogger();
  
  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      const searchResults = await onSearch(searchQuery);
      const endTime = Date.now();
      
      setResults(searchResults);
      
      // Log search event with performance metrics
      await logSearchEvent({
        workspaceId,
        searchQuery,
        searchType: 'general',
        filters: {},
        resultsCount: searchResults.length,
        executionTimeMs: endTime - startTime
      });
      
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onSearch, workspaceId, logSearchEvent]);

  // Trigger search when debounced query changes
  React.useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  return (
    <div className="search-component">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tasks, sections, workspaces..."
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {loading && (
        <div className="mt-2 text-sm text-gray-500">Searching...</div>
      )}
      
      {results.length > 0 && (
        <div className="mt-2 space-y-2">
          {results.map((result, index) => (
            <div key={index} className="p-2 border rounded hover:bg-gray-50">
              <div className="font-medium">{result.title}</div>
              <div className="text-sm text-gray-600">{result.description}</div>
            </div>
          ))}
        </div>
      )}
      
      {query && !loading && results.length === 0 && (
        <div className="mt-2 text-sm text-gray-500">No results found</div>
      )}
    </div>
  );
}

// =============================================
// EXAMPLE: AUTH INTEGRATION
// =============================================

import { useAuth } from '@/components/Auth/useAuth';
import { useEffect } from 'react';

export function AuthEventLogger() {
  const { user, signOut } = useAuth();

  // Log login events
  useEffect(() => {
    if (user) {
      eventLogger.logAuthEvent({
        userId: user.id,
        eventType: 'login',
        context: {
          login_method: 'oauth',
          device_info: navigator.userAgent,
          location: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    if (user) {
      // Log logout before signing out
      await eventLogger.logAuthEvent({
        userId: user.id,
        eventType: 'logout',
        context: {
          session_duration: Date.now() - new Date(user.created_at || Date.now()).getTime()
        } as any
      });
    }
    
    await signOut();
  };

  return null; // This is just for event logging
}

// =============================================
// EXAMPLE: ERROR BOUNDARY WITH EVENT LOGGING
// =============================================


interface Props {
  children: ReactNode;
  workspaceId?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundaryWithLogging extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error event
    try {
      await eventLogger.logError({
        workspaceId: this.props.workspaceId,
        errorCode: 'COMPONENT_ERROR',
        errorMessage: error.message,
        stackTrace: error.stack,
        context: {
          error_boundary: true,
          timestamp: new Date().toISOString()
        } as SystemEventContext
      });
    } catch (logError) {
      console.error('Failed to log component error:', logError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-4 border border-red-300 rounded bg-red-50">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="text-red-600">
            An unexpected error occurred. The error has been logged and will be investigated.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}