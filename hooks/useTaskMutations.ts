// =============================================
// TASK MUTATIONS CONTAINER HOOK
// =============================================
// Container logic for task CRUD operations and mutations

'use client';

import { useState, useCallback } from 'react';
import type { 
  TaskInsert,
  TaskUpdate,
  TaskStatus,
  ApiResponse 
} from '@/database/types';
import type { TaskWithDetails } from './useTask';

export interface CreateTaskData {
  section_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to_user_id?: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  tags?: string[];
  estimated_hours?: number;
  position?: number;
}

export interface UpdateTaskData extends Partial<TaskUpdate> {}

export interface StatusUpdateData {
  status: TaskStatus;
  completed_at?: string | null;
}

export interface AssignmentData {
  assigned_to_user_id: string | null;
}

export interface PositionUpdateData {
  position: number;
}

export interface MoveTaskData {
  target_section_id: string;
  position?: number;
}

export interface DuplicateTaskData {
  title_suffix?: string;
  target_section_id?: string;
  position?: number;
}

export interface ArchiveTaskData {
  is_archived?: boolean;
}

export interface UseTaskMutationsOptions {
  onSuccess?: (task: TaskWithDetails) => void;
  onError?: (error: string) => void;
}

export interface UseTaskMutationsReturn {
  // Loading states
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  updatingStatus: boolean;
  assigning: boolean;
  positioning: boolean;
  moving: boolean;
  duplicating: boolean;
  archiving: boolean;
  
  // Error states
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  statusError: string | null;
  assignError: string | null;
  positionError: string | null;
  moveError: string | null;
  duplicateError: string | null;
  archiveError: string | null;
  
  // Mutation functions
  createTask: (data: CreateTaskData) => Promise<TaskWithDetails | null>;
  updateTask: (taskId: string, data: UpdateTaskData) => Promise<TaskWithDetails | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  updateStatus: (taskId: string, data: StatusUpdateData) => Promise<{ id: string; status: TaskStatus; completed_at: string | null; updated_at: string } | null>;
  assignTask: (taskId: string, data: AssignmentData) => Promise<any | null>;
  updatePosition: (taskId: string, data: PositionUpdateData) => Promise<any | null>;
  moveTask: (taskId: string, data: MoveTaskData) => Promise<any | null>;
  duplicateTask: (taskId: string, data?: DuplicateTaskData) => Promise<TaskWithDetails | null>;
  archiveTask: (taskId: string, data?: ArchiveTaskData) => Promise<any | null>;
  
  // Utility functions
  clearErrors: () => void;
}

/**
 * Hook for task mutation operations
 * Provides functions for creating, updating, and deleting tasks with optimistic updates
 */
export const useTaskMutations = (
  options: UseTaskMutationsOptions = {}
): UseTaskMutationsReturn => {
  const { onSuccess, onError } = options;

  // Loading states
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [positioning, setPositioning] = useState(false);
  const [moving, setMoving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Error states
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setCreateError(null);
    setUpdateError(null);
    setDeleteError(null);
    setStatusError(null);
    setAssignError(null);
    setPositionError(null);
    setMoveError(null);
    setDuplicateError(null);
    setArchiveError(null);
  }, []);

  // Create task
  const createTask = useCallback(async (data: CreateTaskData): Promise<TaskWithDetails | null> => {
    try {
      setCreating(true);
      setCreateError(null);

      const response = await fetch(`/api/sections/${data.section_id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to create task');
      }

      const result = await response.json() as ApiResponse<TaskWithDetails>;
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        onSuccess?.(result.data);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      setCreateError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setCreating(false);
    }
  }, [onSuccess, onError]);

  // Update task
  const updateTask = useCallback(async (taskId: string, data: UpdateTaskData): Promise<TaskWithDetails | null> => {
    try {
      setUpdating(true);
      setUpdateError(null);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to update task');
      }

      const result = await response.json() as ApiResponse<TaskWithDetails>;
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        onSuccess?.(result.data);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      setUpdateError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setUpdating(false);
    }
  }, [onSuccess, onError]);

  // Delete task
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      setDeleting(true);
      setDeleteError(null);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to delete task');
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      setDeleteError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setDeleting(false);
    }
  }, [onError]);

  // Update task status
  const updateStatus = useCallback(async (taskId: string, data: StatusUpdateData) => {
    try {
      setUpdatingStatus(true);
      setStatusError(null);

      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to update task status');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task status';
      setStatusError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setUpdatingStatus(false);
    }
  }, [onError]);

  // Assign task
  const assignTask = useCallback(async (taskId: string, data: AssignmentData) => {
    try {
      setAssigning(true);
      setAssignError(null);

      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to assign task');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign task';
      setAssignError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setAssigning(false);
    }
  }, [onError]);

  // Update position
  const updatePosition = useCallback(async (taskId: string, data: PositionUpdateData) => {
    try {
      setPositioning(true);
      setPositionError(null);

      const response = await fetch(`/api/tasks/${taskId}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to update task position');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task position';
      setPositionError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setPositioning(false);
    }
  }, [onError]);

  // Move task
  const moveTask = useCallback(async (taskId: string, data: MoveTaskData) => {
    try {
      setMoving(true);
      setMoveError(null);

      const response = await fetch(`/api/tasks/${taskId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to move task');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move task';
      setMoveError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setMoving(false);
    }
  }, [onError]);

  // Duplicate task
  const duplicateTask = useCallback(async (taskId: string, data: DuplicateTaskData = {}): Promise<TaskWithDetails | null> => {
    try {
      setDuplicating(true);
      setDuplicateError(null);

      const response = await fetch(`/api/tasks/${taskId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to duplicate task');
      }

      const result = await response.json() as ApiResponse<TaskWithDetails>;
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        onSuccess?.(result.data);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate task';
      setDuplicateError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setDuplicating(false);
    }
  }, [onSuccess, onError]);

  // Archive task
  const archiveTask = useCallback(async (taskId: string, data: ArchiveTaskData = {}) => {
    try {
      setArchiving(true);
      setArchiveError(null);

      const response = await fetch(`/api/tasks/${taskId}/archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to archive task');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive task';
      setArchiveError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setArchiving(false);
    }
  }, [onError]);

  return {
    // Loading states
    creating,
    updating,
    deleting,
    updatingStatus,
    assigning,
    positioning,
    moving,
    duplicating,
    archiving,
    
    // Error states
    createError,
    updateError,
    deleteError,
    statusError,
    assignError,
    positionError,
    moveError,
    duplicateError,
    archiveError,
    
    // Mutation functions
    createTask,
    updateTask,
    deleteTask,
    updateStatus,
    assignTask,
    updatePosition,
    moveTask,
    duplicateTask,
    archiveTask,
    
    // Utility functions
    clearErrors,
  };
};