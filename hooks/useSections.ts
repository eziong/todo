// =============================================
// SECTIONS CONTAINER HOOK
// =============================================
// Container logic for section listing and management within workspaces

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { 
  Section, 
  SectionInsert, 
  PaginatedResponse, 
  ApiResponse 
} from '@/database/types';

export interface SectionWithStats extends Section {
  task_count: number;
}

export interface UseSectionsOptions {
  page?: number;
  limit?: number;
  includeArchived?: boolean;
  search?: string;
  autoRefresh?: boolean;
}

export interface UseSectionsReturn {
  sections: SectionWithStats[];
  loading: boolean;
  error: string | null;
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
  createSection: (data: Omit<SectionInsert, 'workspace_id' | 'position'>) => Promise<SectionWithStats>;
  deleteSection: (id: string, force?: boolean) => Promise<void>;
  
  // Pagination
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  
  // Search and filters
  setSearch: (search: string) => void;
  setIncludeArchived: (include: boolean) => void;
}

/**
 * Hook for managing sections within a workspace
 * Provides listing, creation, and basic management functionality
 */
export const useSections = (
  workspaceId: string,
  options: UseSectionsOptions = {}
): UseSectionsReturn => {
  const {
    page: initialPage = 1,
    limit = 50,
    includeArchived: initialIncludeArchived = false,
    search: initialSearch = '',
    autoRefresh = true,
  } = options;

  const [sections, setSections] = useState<SectionWithStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseSectionsReturn['pagination']>(null);
  
  // Query parameters
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [includeArchived, setIncludeArchived] = useState(initialIncludeArchived);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Fetch sections from API
  const fetchSections = useCallback(async (): Promise<void> => {
    if (!workspaceId) {
      setSections([]);
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

      if (includeArchived) {
        params.append('include_archived', 'true');
      }

      const response = await fetch(`/api/workspaces/${workspaceId}/sections?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to fetch sections');
      }

      const data = await response.json() as PaginatedResponse<SectionWithStats>;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setSections(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sections';
      setError(errorMessage);
      setSections([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, page, limit, search, includeArchived, clearError]);

  // Create new section
  const createSection = useCallback(async (
    data: Omit<SectionInsert, 'workspace_id' | 'position'>
  ): Promise<SectionWithStats> => {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    try {
      clearError();

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

      // Add the new section to the current list (optimistic update)
      setSections(prev => [...prev, result.data!].sort((a, b) => a.position - b.position));
      
      // Refetch to get updated data and pagination
      await fetchSections();

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create section';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workspaceId, clearError, fetchSections]);

  // Delete section
  const deleteSection = useCallback(async (id: string, force?: boolean): Promise<void> => {
    try {
      clearError();

      const params = force ? '?force=true' : '';
      const response = await fetch(`/api/sections/${id}${params}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<null>;
        throw new Error(errorData.error || 'Failed to delete section');
      }

      // Remove section from current list (optimistic update)
      setSections(prev => prev.filter(s => s.id !== id));
      
      // Refetch to get updated pagination
      await fetchSections();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete section';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [clearError, fetchSections]);

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

  // Search actions
  const setSearchWithReset = useCallback((newSearch: string): void => {
    setSearch(newSearch);
    setPage(1); // Reset to first page when searching
  }, []);

  const setIncludeArchivedWithReset = useCallback((include: boolean): void => {
    setIncludeArchived(include);
    setPage(1); // Reset to first page when changing filter
  }, []);

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // Real-time updates via Supabase subscriptions
  useEffect(() => {
    if (!autoRefresh || !workspaceId) return;

    let mounted = true;

    const setupSubscriptions = async () => {
      try {
        // Get current user for filtering
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Subscribe to section changes for the specific workspace
        const sectionsSubscription = supabase
          .channel(`sections_changes_${workspaceId}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'sections',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            async (payload) => {
              if (!mounted) return;
              
              // Check if user has access to this workspace
              const { data: memberCheck } = await supabase
                .from('workspace_members')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq('user_id', user.id)
                .single();

              if (memberCheck) {
                // This section change affects the current user
                await fetchSections();
              }
            }
          )
          .subscribe();

        return () => {
          sectionsSubscription.unsubscribe();
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
  }, [autoRefresh, workspaceId, fetchSections]);

  return {
    sections,
    loading,
    error,
    pagination,
    
    // Actions
    refetch: fetchSections,
    createSection,
    deleteSection,
    
    // Pagination
    nextPage,
    prevPage,
    goToPage,
    
    // Search and filters
    setSearch: setSearchWithReset,
    setIncludeArchived: setIncludeArchivedWithReset,
  };
};