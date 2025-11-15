// =============================================
// SECTION MUTATIONS CONTAINER HOOK
// =============================================
// Container logic for section create, update, delete operations

'use client';

import { useState, useCallback } from 'react';
import type { 
  Section, 
  SectionInsert, 
  SectionFormData,
  ApiResponse 
} from '@/database/types';

export interface SectionWithStats extends Section {
  task_count: number;
}

export interface SectionMutation {
  loading: boolean;
  error: string | null;
}

export interface UseSectionMutationsReturn {
  creating: SectionMutation;
  updating: SectionMutation;
  deleting: SectionMutation;
  archiving: SectionMutation;
  
  // Actions
  createSection: (workspaceId: string, data: SectionFormData) => Promise<SectionWithStats>;
  updateSection: (id: string, data: Partial<Section>) => Promise<Section>;
  deleteSection: (id: string, force?: boolean) => Promise<void>;
  archiveSection: (id: string, archive?: boolean) => Promise<Section>;
  clearErrors: () => void;
}

/**
 * Hook for section mutation operations
 * Provides create, update, delete, and archive functionality with loading states
 */
export const useSectionMutations = (): UseSectionMutationsReturn => {
  const [creating, setCreating] = useState<SectionMutation>({ loading: false, error: null });
  const [updating, setUpdating] = useState<SectionMutation>({ loading: false, error: null });
  const [deleting, setDeleting] = useState<SectionMutation>({ loading: false, error: null });
  const [archiving, setArchiving] = useState<SectionMutation>({ loading: false, error: null });

  // Clear all errors
  const clearErrors = useCallback((): void => {
    setCreating(prev => ({ ...prev, error: null }));
    setUpdating(prev => ({ ...prev, error: null }));
    setDeleting(prev => ({ ...prev, error: null }));
    setArchiving(prev => ({ ...prev, error: null }));
  }, []);

  // Create section
  const createSection = useCallback(async (
    workspaceId: string, 
    data: SectionFormData
  ): Promise<SectionWithStats> => {
    setCreating({ loading: true, error: null });

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to create section');
      }

      const result = await response.json() as ApiResponse<SectionWithStats>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to create section');
      }

      setCreating({ loading: false, error: null });
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create section';
      setCreating({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, []);

  // Update section
  const updateSection = useCallback(async (
    id: string, 
    data: Partial<Section>
  ): Promise<Section> => {
    setUpdating({ loading: true, error: null });

    try {
      const response = await fetch(`/api/sections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to update section');
      }

      const result = await response.json() as ApiResponse<Section>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to update section');
      }

      setUpdating({ loading: false, error: null });
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update section';
      setUpdating({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, []);

  // Delete section
  const deleteSection = useCallback(async (id: string, force?: boolean): Promise<void> => {
    setDeleting({ loading: true, error: null });

    try {
      const params = force ? '?force=true' : '';
      const response = await fetch(`/api/sections/${id}${params}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to delete section');
      }

      setDeleting({ loading: false, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete section';
      setDeleting({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, []);

  // Archive/unarchive section
  const archiveSection = useCallback(async (
    id: string, 
    archive: boolean = true
  ): Promise<Section> => {
    setArchiving({ loading: true, error: null });

    try {
      const response = await fetch(`/api/sections/${id}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archive }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to archive section');
      }

      const result = await response.json() as ApiResponse<Section>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to archive section');
      }

      setArchiving({ loading: false, error: null });
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive section';
      setArchiving({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, []);

  return {
    creating,
    updating,
    deleting,
    archiving,
    
    // Actions
    createSection,
    updateSection,
    deleteSection,
    archiveSection,
    clearErrors,
  };
};