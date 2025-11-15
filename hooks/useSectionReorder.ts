// =============================================
// SECTION REORDER CONTAINER HOOK
// =============================================
// Container logic for section reordering within workspace

'use client';

import { useState, useCallback } from 'react';
import type { 
  Section, 
  ApiResponse 
} from '@/database/types';

export interface ReorderItem {
  id: string;
  position: number;
}

export interface UseSectionReorderOptions {
  onReorderSuccess?: (sections: Section[]) => void;
  onReorderError?: (error: string) => void;
}

export interface UseSectionReorderReturn {
  loading: boolean;
  error: string | null;
  
  // Actions
  reorderSections: (workspaceId: string, sections: ReorderItem[]) => Promise<Section[]>;
  clearError: () => void;
}

/**
 * Hook for section reordering functionality
 * Provides optimistic updates and handles reorder operations
 */
export const useSectionReorder = (
  options: UseSectionReorderOptions = {}
): UseSectionReorderReturn => {
  const { onReorderSuccess, onReorderError } = options;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Reorder sections
  const reorderSections = useCallback(async (
    workspaceId: string,
    sections: ReorderItem[]
  ): Promise<Section[]> => {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    if (!sections || sections.length === 0) {
      throw new Error('Sections array is required');
    }

    setLoading(true);
    setError(null);

    try {
      // Validate sections data
      const validatedSections = sections.map((section, index) => ({
        id: section.id,
        position: index, // Use index as position to ensure sequential ordering
      }));

      // Sort by position to ensure consistency
      validatedSections.sort((a, b) => a.position - b.position);

      // Use the first section's ID for the API endpoint (any section ID from the workspace works)
      const sampleSectionId = validatedSections[0].id;

      const response = await fetch(`/api/sections/${sampleSectionId}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sections: validatedSections }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to reorder sections');
      }

      const result = await response.json() as ApiResponse<{
        updated: boolean;
        sections: Section[];
        workspace_id: string;
      }>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to reorder sections');
      }

      const updatedSections = result.data.sections;
      
      // Call success callback if provided
      if (onReorderSuccess) {
        onReorderSuccess(updatedSections);
      }

      setLoading(false);
      return updatedSections;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder sections';
      setError(errorMessage);
      setLoading(false);
      
      // Call error callback if provided
      if (onReorderError) {
        onReorderError(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
  }, [onReorderSuccess, onReorderError]);

  return {
    loading,
    error,
    
    // Actions
    reorderSections,
    clearError,
  };
};