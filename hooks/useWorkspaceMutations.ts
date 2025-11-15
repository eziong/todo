// =============================================
// WORKSPACE MUTATIONS CONTAINER HOOK
// =============================================
// Container logic for workspace creation, update, and delete mutations

'use client';

import { useState, useCallback } from 'react';
import type { 
  WorkspaceInsert, 
  WorkspaceUpdate, 
  Workspace,
  ApiResponse 
} from '@/database/types';
import { WorkspaceWithUserRole } from './useWorkspaces';
import { WorkspaceDetails } from './useWorkspace';

export interface UseWorkspaceMutationsReturn {
  // Loading states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  
  // Mutations
  createWorkspace: (data: Omit<WorkspaceInsert, 'owner_id'>) => Promise<WorkspaceWithUserRole>;
  updateWorkspace: (id: string, data: WorkspaceUpdate) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  
  // Validation
  validateWorkspaceData: (data: Partial<WorkspaceInsert | WorkspaceUpdate>) => { isValid: boolean; errors: string[] };
  
  // Helpers
  clearErrors: () => void;
}

/**
 * Hook for workspace mutations (create, update, delete)
 * Provides optimized mutations with loading states and error handling
 */
export const useWorkspaceMutations = (): UseWorkspaceMutationsReturn => {
  // Loading states
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Error states
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Clear all errors
  const clearErrors = useCallback((): void => {
    setCreateError(null);
    setUpdateError(null);
    setDeleteError(null);
  }, []);

  // Validate workspace data
  const validateWorkspaceData = useCallback((
    data: Partial<WorkspaceInsert | WorkspaceUpdate>
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate name
    if (data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string') {
        errors.push('Workspace name is required');
      } else if (data.name.trim().length === 0) {
        errors.push('Workspace name cannot be empty');
      } else if (data.name.trim().length > 100) {
        errors.push('Workspace name must be less than 100 characters');
      }
    }

    // Validate description
    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== 'string') {
        errors.push('Description must be a string');
      } else if (data.description.length > 500) {
        errors.push('Description must be less than 500 characters');
      }
    }

    // Validate color
    if (data.color !== undefined) {
      if (!data.color || typeof data.color !== 'string') {
        errors.push('Color is required');
      } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
        errors.push('Color must be a valid hex color (e.g., #3B82F6)');
      }
    }

    // Validate icon
    if (data.icon !== undefined && data.icon !== null) {
      if (typeof data.icon !== 'string') {
        errors.push('Icon must be a string');
      } else if (data.icon.length > 50) {
        errors.push('Icon identifier must be less than 50 characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  // Create workspace
  const createWorkspace = useCallback(async (data: Omit<WorkspaceInsert, 'owner_id'>): Promise<WorkspaceWithUserRole> => {
    try {
      setIsCreating(true);
      setCreateError(null);

      // Validate input data
      const validation = validateWorkspaceData(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Prepare workspace data with defaults
      const workspaceData = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        color: data.color || '#3B82F6',
        icon: data.icon || null,
        settings: data.settings || {
          features: {
            time_tracking: true,
            file_attachments: true,
            due_date_reminders: true,
            task_templates: false,
          },
          integrations: {
            calendar: false,
            slack: false,
            email: true,
          },
          security: {
            require_task_approval: false,
            restrict_member_invites: false,
          },
        },
      };

      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workspaceData),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to create workspace');
      }

      const result = await response.json() as ApiResponse<WorkspaceWithUserRole>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to create workspace');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace';
      setCreateError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [validateWorkspaceData]);

  // Update workspace
  const updateWorkspace = useCallback(async (id: string, data: WorkspaceUpdate): Promise<Workspace> => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      if (!id) {
        throw new Error('Workspace ID is required');
      }

      // Validate input data
      const validation = validateWorkspaceData(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Only include fields that are defined
      const updateData: WorkspaceUpdate = {};
      
      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }
      
      if (data.description !== undefined) {
        updateData.description = data.description?.trim() || undefined;
      }
      
      if (data.color !== undefined) {
        updateData.color = data.color;
      }
      
      if (data.icon !== undefined) {
        updateData.icon = data.icon;
      }
      
      if (data.settings !== undefined) {
        updateData.settings = data.settings;
      }

      // Check if there are any fields to update
      if (Object.keys(updateData).length === 0) {
        throw new Error('No valid fields to update');
      }

      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to update workspace');
      }

      const result = await response.json() as ApiResponse<Workspace>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to update workspace');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workspace';
      setUpdateError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [validateWorkspaceData]);

  // Delete workspace
  const deleteWorkspace = useCallback(async (id: string): Promise<void> => {
    try {
      setIsDeleting(true);
      setDeleteError(null);

      if (!id) {
        throw new Error('Workspace ID is required');
      }

      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to delete workspace');
      }

      // No need to return data for delete operation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workspace';
      setDeleteError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    // Loading states
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error states
    createError,
    updateError,
    deleteError,
    
    // Mutations
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    
    // Validation
    validateWorkspaceData,
    
    // Helpers
    clearErrors,
  };
};