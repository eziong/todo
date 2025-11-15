// =============================================
// TASK SEARCH CONTAINER HOOK
// =============================================
// Container logic for global task search functionality with enhanced database integration

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { 
  TaskStatus,
  TaskPriority,
  SearchResult,
  TaskSearchResult,
  SearchSuggestion,
  Database
} from '@/database/types';
import { 
  performGlobalSearch, 
  performTaskSearch, 
  getSearchSuggestions 
} from '@/database/search-examples';

// Re-export database types for enhanced search
export type { TaskSearchResult, SearchResult, SearchSuggestion } from '@/database/types';

export interface EnhancedSearchResult extends SearchResult {
  // Additional frontend properties
  icon: string;
  highlightMatches: Array<{
    field: string;
    value: string;
    matches: Array<{ start: number; end: number }>;
  }>;
}

export interface SearchFilters {
  workspaceId?: string;
  sectionIds?: string[];
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedToUserId?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  tags?: string[];
  entityTypes?: Array<'workspace' | 'section' | 'task'>;
}

export interface SearchOptions {
  sortBy?: 'relevance' | 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UseTaskSearchReturn {
  // Search state
  globalResults: SearchResult[];
  taskResults: TaskSearchResult[];
  suggestions: SearchSuggestion[];
  loading: boolean;
  suggestionsLoading: boolean;
  error: string | null;
  query: string;
  total: number;
  searchTime: number;
  
  // Filters and options
  filters: SearchFilters;
  options: SearchOptions;
  
  // Search actions
  searchGlobal: (query: string, filters?: SearchFilters, options?: SearchOptions) => Promise<void>;
  searchTasks: (query: string, filters?: SearchFilters, options?: SearchOptions) => Promise<void>;
  getSuggestions: (partialQuery: string) => Promise<void>;
  clearSearch: () => void;
  setFilters: (filters: SearchFilters) => void;
  setOptions: (options: SearchOptions) => void;
  setQuery: (query: string) => void;
  
  // Quick search helpers
  searchByWorkspace: (workspaceId: string, query?: string) => Promise<void>;
  searchByStatus: (status: TaskStatus[], query?: string) => Promise<void>;
  searchByAssignee: (assigneeId: string, query?: string) => Promise<void>;
  searchByTags: (tags: string[], query?: string) => Promise<void>;
  
  // Utility functions
  hasGlobalResults: boolean;
  hasTaskResults: boolean;
  hasFilters: boolean;
  clearFilters: () => void;
  groupResultsByType: () => Record<string, SearchResult[]>;
  
  // Enhanced features
  transformToEnhancedResults: (results: SearchResult[]) => EnhancedSearchResult[];
}

/**
 * Hook for enhanced global search functionality
 * Provides comprehensive search with database integration, filters, suggestions, and real-time features
 */
export const useTaskSearch = (): UseTaskSearchReturn => {
  // State management
  const [globalResults, setGlobalResults] = useState<SearchResult[]>([]);
  const [taskResults, setTaskResults] = useState<TaskSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [total, setTotal] = useState<number>(0);
  const [searchTime, setSearchTime] = useState<number>(0);
  
  // Filters and options
  const [filters, setFilters] = useState<SearchFilters>({});
  const [options, setOptions] = useState<SearchOptions>({
    sortBy: 'relevance',
    sortOrder: 'desc',
    limit: 20,
    offset: 0,
  });

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const suggestionAbortControllerRef = useRef<AbortController | null>(null);

  // Clear error helper
  const clearError = useCallback((): void => setError(null), []);

  // Transform results to enhanced format
  const transformToEnhancedResults = useCallback((results: SearchResult[]): EnhancedSearchResult[] => {
    return results.map(result => ({
      ...result,
      icon: result.entity_type === 'workspace' ? '📁' : result.entity_type === 'section' ? '📂' : '📝',
      highlightMatches: [
        {
          field: 'title',
          value: result.title,
          matches: [] // This would be populated by the search highlighting logic
        },
        ...(result.description ? [{
          field: 'description',
          value: result.description,
          matches: []
        }] : [])
      ]
    }));
  }, []);

  // Group results by entity type
  const groupResultsByType = useCallback((): Record<string, SearchResult[]> => {
    return globalResults.reduce((groups, result) => {
      const type = result.entity_type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(result);
      return groups;
    }, {} as Record<string, SearchResult[]>);
  }, [globalResults]);

  // Global search function using enhanced database search
  const searchGlobal = useCallback(async (
    searchQuery: string,
    searchFilters: SearchFilters = {},
    searchOptions: SearchOptions = {}
  ): Promise<void> => {
    try {
      // Cancel previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      clearError();

      const mergedFilters = { ...filters, ...searchFilters };
      const mergedOptions = { ...options, ...searchOptions };
      
      const { data, error: searchError, executionTime } = await performGlobalSearch(
        supabase,
        searchQuery.trim(),
        mergedFilters.workspaceId,
        mergedOptions.limit,
        mergedOptions.offset
      );

      if (searchError) {
        throw new Error(searchError.message);
      }

      setGlobalResults(data || []);
      setQuery(searchQuery);
      setTotal((data || []).length);
      setSearchTime(executionTime);
      
      // Update stored filters and options
      setFilters(mergedFilters);
      setOptions(mergedOptions);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Search was cancelled
      }
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setGlobalResults([]);
      setTotal(0);
      setSearchTime(0);
    } finally {
      setLoading(false);
    }
  }, [filters, options, clearError]);

  // Task search function using enhanced database search
  const searchTasks = useCallback(async (
    searchQuery: string,
    searchFilters: SearchFilters = {},
    searchOptions: SearchOptions = {}
  ): Promise<void> => {
    try {
      // Cancel previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      clearError();

      const mergedFilters = { ...filters, ...searchFilters };
      const mergedOptions = { ...options, ...searchOptions };
      
      const { data, error: searchError, executionTime } = await performTaskSearch(
        supabase,
        searchQuery.trim(),
        {
          workspaceId: mergedFilters.workspaceId,
          sectionIds: mergedFilters.sectionIds,
          status: mergedFilters.status,
          priority: mergedFilters.priority,
          assignedTo: mergedFilters.assignedToUserId,
          tags: mergedFilters.tags,
          dueDateFrom: mergedFilters.dueDateFrom,
          dueDateTo: mergedFilters.dueDateTo,
          limit: mergedOptions.limit,
          offset: mergedOptions.offset
        }
      );

      if (searchError) {
        throw new Error(searchError.message);
      }

      setTaskResults(data || []);
      setQuery(searchQuery);
      setTotal((data || []).length);
      setSearchTime(executionTime);
      
      // Update stored filters and options
      setFilters(mergedFilters);
      setOptions(mergedOptions);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Search was cancelled
      }
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setTaskResults([]);
      setTotal(0);
      setSearchTime(0);
    } finally {
      setLoading(false);
    }
  }, [filters, options, clearError]);

  // Get search suggestions with debouncing
  const getSuggestions = useCallback(async (partialQuery: string): Promise<void> => {
    if (partialQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      // Cancel previous suggestion request
      if (suggestionAbortControllerRef.current) {
        suggestionAbortControllerRef.current.abort();
      }
      suggestionAbortControllerRef.current = new AbortController();

      setSuggestionsLoading(true);

      const { data, error: suggestionError } = await getSearchSuggestions(
        supabase,
        partialQuery,
        filters.workspaceId,
        10
      );

      if (suggestionError) {
        console.warn('Failed to fetch suggestions:', suggestionError.message);
        setSuggestions([]);
        return;
      }

      setSuggestions(data || []);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled
      }
      console.warn('Failed to fetch suggestions:', err);
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [filters.workspaceId]);

  // Clear search
  const clearSearch = useCallback((): void => {
    setGlobalResults([]);
    setTaskResults([]);
    setSuggestions([]);
    setQuery('');
    setTotal(0);
    setSearchTime(0);
    setError(null);
  }, []);

  // Clear filters
  const clearFilters = useCallback((): void => {
    setFilters({});
  }, []);

  // Quick search helpers using the enhanced search functions
  const searchByWorkspace = useCallback(async (workspaceId: string, searchQuery: string = ''): Promise<void> => {
    await searchGlobal(searchQuery, { workspaceId });
  }, [searchGlobal]);

  const searchByStatus = useCallback(async (status: TaskStatus[], searchQuery: string = ''): Promise<void> => {
    await searchTasks(searchQuery, { status });
  }, [searchTasks]);

  const searchByAssignee = useCallback(async (assigneeId: string, searchQuery: string = ''): Promise<void> => {
    await searchTasks(searchQuery, { assignedToUserId: [assigneeId] });
  }, [searchTasks]);

  const searchByTags = useCallback(async (tags: string[], searchQuery: string = ''): Promise<void> => {
    await searchTasks(searchQuery, { tags });
  }, [searchTasks]);

  // Computed properties
  const hasGlobalResults = useMemo((): boolean => globalResults.length > 0, [globalResults.length]);
  const hasTaskResults = useMemo((): boolean => taskResults.length > 0, [taskResults.length]);
  
  const hasFilters = useMemo((): boolean => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof SearchFilters];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });
  }, [filters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (suggestionAbortControllerRef.current) {
        suggestionAbortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Search state
    globalResults,
    taskResults,
    suggestions,
    loading,
    suggestionsLoading,
    error,
    query,
    total,
    searchTime,
    
    // Filters and options
    filters,
    options,
    
    // Search actions
    searchGlobal,
    searchTasks,
    getSuggestions,
    clearSearch,
    setFilters,
    setOptions,
    setQuery,
    
    // Quick search helpers
    searchByWorkspace,
    searchByStatus,
    searchByAssignee,
    searchByTags,
    
    // Utility functions
    hasGlobalResults,
    hasTaskResults,
    hasFilters,
    clearFilters,
    groupResultsByType,
    
    // Enhanced features
    transformToEnhancedResults,
  };
};