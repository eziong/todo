// =============================================
// SECTION CONTAINER HOOK
// =============================================
// Container logic for individual section management with real-time updates

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { 
  Section, 
  ApiResponse 
} from '@/database/types';

export interface SectionWithDetails extends Section {
  workspace?: {
    id: string;
    name: string;
    color: string;
  };
  statistics: {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
  };
}

export interface UseSectionOptions {
  autoRefresh?: boolean;
}

export interface UseSectionReturn {
  section: SectionWithDetails | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  updateSection: (data: Partial<Section>) => Promise<SectionWithDetails>;
  deleteSection: (force?: boolean) => Promise<void>;
  archiveSection: (archive?: boolean) => Promise<SectionWithDetails>;
}

/**
 * Hook for managing a specific section with real-time updates
 * Provides detailed section information and update functionality
 */
export const useSection = (
  sectionId: string | null,
  options: UseSectionOptions = {}
): UseSectionReturn => {
  const { autoRefresh = true } = options;

  const [section, setSection] = useState<SectionWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Fetch section from API
  const fetchSection = useCallback(async (): Promise<void> => {
    if (!sectionId) {
      setSection(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      clearError();

      const response = await fetch(`/api/sections/${sectionId}`);
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to fetch section');
      }

      const data = await response.json() as ApiResponse<SectionWithDetails>;
      
      if (data.error || !data.data) {
        throw new Error(data.error || 'Failed to fetch section');
      }

      setSection(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch section';
      setError(errorMessage);
      setSection(null);
    } finally {
      setLoading(false);
    }
  }, [sectionId, clearError]);

  // Update section
  const updateSection = useCallback(async (
    data: Partial<Section>
  ): Promise<SectionWithDetails> => {
    if (!sectionId) {
      throw new Error('Section ID is required');
    }

    try {
      clearError();

      const response = await fetch(`/api/sections/${sectionId}`, {
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

      // Optimistically update the section and then refetch for complete data
      setSection(prev => prev ? { ...prev, ...result.data } : null);
      await fetchSection();

      return section!;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update section';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [sectionId, clearError, fetchSection, section]);

  // Delete section
  const deleteSection = useCallback(async (force?: boolean): Promise<void> => {
    if (!sectionId) {
      throw new Error('Section ID is required');
    }

    try {
      clearError();

      const params = force ? '?force=true' : '';
      const response = await fetch(`/api/sections/${sectionId}${params}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to delete section');
      }

      // Clear the section data as it's been deleted
      setSection(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete section';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [sectionId, clearError]);

  // Archive/unarchive section
  const archiveSection = useCallback(async (archive: boolean = true): Promise<SectionWithDetails> => {
    if (!sectionId) {
      throw new Error('Section ID is required');
    }

    try {
      clearError();

      const response = await fetch(`/api/sections/${sectionId}/archive`, {
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

      const result = await response.json() as ApiResponse<SectionWithDetails>;
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to archive section');
      }

      // Update the section with the new archived status
      setSection(result.data);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive section';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [sectionId, clearError]);

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    fetchSection();
  }, [fetchSection]);

  // Real-time updates via Supabase subscriptions
  useEffect(() => {
    if (!autoRefresh || !sectionId) return;

    let mounted = true;

    const setupSubscriptions = async () => {
      try {
        // Get current user for filtering
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Subscribe to changes for this specific section
        const sectionSubscription = supabase
          .channel(`section_changes_${sectionId}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'sections',
              filter: `id=eq.${sectionId}`,
            },
            async (payload) => {
              if (!mounted) return;
              
              const newPayload = payload.new as any;
              const eventType = payload.eventType;

              if (eventType === 'DELETE' || (newPayload && newPayload.is_deleted)) {
                // Section was deleted
                setSection(null);
              } else {
                // Section was updated, refetch to get complete data
                await fetchSection();
              }
            }
          )
          .subscribe();

        // Subscribe to task changes that affect this section's statistics
        const taskSubscription = supabase
          .channel(`section_tasks_${sectionId}`)
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks',
              filter: `section_id=eq.${sectionId}`,
            },
            async () => {
              if (mounted) {
                // Task changed, refetch section to update statistics
                await fetchSection();
              }
            }
          )
          .subscribe();

        return () => {
          sectionSubscription.unsubscribe();
          taskSubscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up section subscriptions:', err);
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
  }, [autoRefresh, sectionId, fetchSection]);

  return {
    section,
    loading,
    error,
    
    // Actions
    refetch: fetchSection,
    updateSection,
    deleteSection,
    archiveSection,
  };
};