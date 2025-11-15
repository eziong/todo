// =============================================
// SEARCH USAGE EXAMPLES
// =============================================
// Examples of how to use the enhanced full-text search functionality

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SearchResult, TaskSearchResult, SearchSuggestion } from './types';

type SupabaseClientType = SupabaseClient<Database>;

// =============================================
// SEARCH FUNCTIONS USAGE EXAMPLES
// =============================================

/**
 * Perform a global search across all entities
 */
export async function performGlobalSearch(
  supabase: SupabaseClientType,
  query: string,
  workspaceId?: string,
  limit: number = 20,
  offset: number = 0
) {
  const startTime = performance.now();
  
  const { data, error } = await supabase
    .rpc('search_all', {
      search_query: query,
      workspace_id_filter: workspaceId,
      result_limit: limit,
      result_offset: offset
    });

  const executionTime = performance.now() - startTime;

  // Log the search for analytics
  if (!error) {
    await supabase.rpc('log_search_query', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id || '',
      p_workspace_id: workspaceId,
      p_search_query: query,
      p_search_type: 'global',
      p_filters_applied: { workspace_id: workspaceId, limit, offset },
      p_results_count: data?.length || 0,
      p_execution_time_ms: executionTime
    });
  }

  return { data: data as SearchResult[], error, executionTime };
}

/**
 * Perform an enhanced task search with filtering
 */
export async function performTaskSearch(
  supabase: SupabaseClientType,
  query: string,
  filters: {
    workspaceId?: string;
    sectionIds?: string[];
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    tags?: string[];
    dueDateFrom?: string;
    dueDateTo?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const startTime = performance.now();
  
  const { data, error } = await supabase
    .rpc('search_tasks', {
      search_query: query,
      workspace_id_filter: filters.workspaceId,
      section_ids: filters.sectionIds,
      status_filter: filters.status,
      priority_filter: filters.priority,
      assigned_to_filter: filters.assignedTo,
      tags_filter: filters.tags,
      due_date_from: filters.dueDateFrom,
      due_date_to: filters.dueDateTo,
      result_limit: filters.limit || 20,
      result_offset: filters.offset || 0
    });

  const executionTime = performance.now() - startTime;

  // Log the search for analytics
  if (!error) {
    await supabase.rpc('log_search_query', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id || '',
      p_workspace_id: filters.workspaceId,
      p_search_query: query,
      p_search_type: 'tasks',
      p_filters_applied: filters,
      p_results_count: data?.length || 0,
      p_execution_time_ms: executionTime
    });
  }

  return { data: data as TaskSearchResult[], error, executionTime };
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(
  supabase: SupabaseClientType,
  partialQuery: string,
  workspaceId?: string,
  limit: number = 10
) {
  const { data, error } = await supabase
    .rpc('get_search_suggestions', {
      partial_query: partialQuery,
      workspace_id_filter: workspaceId,
      suggestion_limit: limit
    });

  return { data: data as SearchSuggestion[], error };
}

/**
 * Get search statistics for a workspace
 */
export async function getSearchStats(
  supabase: SupabaseClientType,
  workspaceId?: string
) {
  const { data: stats, error: statsError } = await supabase
    .rpc('get_search_stats', {
      workspace_id_filter: workspaceId
    });

  const { data: metrics, error: metricsError } = await supabase
    .rpc('get_search_performance_metrics', {
      workspace_id_filter: workspaceId
    });

  return {
    stats: stats?.[0] || null,
    metrics: metrics || [],
    error: statsError || metricsError
  };
}

// =============================================
// REACT HOOK EXAMPLES
// =============================================

/**
 * React hook for global search with debouncing
 */
import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from './hooks/useDebounce'; // Assume this exists

export function useGlobalSearch(
  supabase: SupabaseClientType,
  workspaceId?: string,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    async function search() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await performGlobalSearch(
          supabase,
          debouncedQuery,
          workspaceId
        );

        if (error) {
          setError(error.message);
        } else {
          setResults(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [debouncedQuery, workspaceId, supabase]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    hasResults: results.length > 0
  };
}

/**
 * React hook for search suggestions with caching
 */
export function useSearchSuggestions(
  supabase: SupabaseClientType,
  workspaceId?: string,
  debounceMs: number = 200
) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, debounceMs);

  // Simple cache to avoid redundant API calls
  const cache = useMemo(() => new Map<string, SearchSuggestion[]>(), []);

  useEffect(() => {
    async function getSuggestions() {
      if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      const cacheKey = `${workspaceId || 'global'}:${debouncedQuery}`;
      
      if (cache.has(cacheKey)) {
        setSuggestions(cache.get(cacheKey) || []);
        return;
      }

      setLoading(true);

      try {
        const { data } = await getSearchSuggestions(
          supabase,
          debouncedQuery,
          workspaceId
        );

        const results = data || [];
        cache.set(cacheKey, results);
        setSuggestions(results);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }

    getSuggestions();
  }, [debouncedQuery, workspaceId, supabase, cache]);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    clearSuggestions: () => setSuggestions([])
  };
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Group search results by entity type
 */
export function groupSearchResultsByType(results: SearchResult[]) {
  return results.reduce((groups, result) => {
    const type = result.entity_type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(result);
    return groups;
  }, {} as Record<string, SearchResult[]>);
}

/**
 * Calculate search relevance score ranges for result categorization
 */
export function categorizeSearchResults(results: SearchResult[]) {
  const scores = results.map(r => r.relevance_score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range = maxScore - minScore;
  const highThreshold = maxScore - (range * 0.3);
  const mediumThreshold = maxScore - (range * 0.7);

  return {
    high: results.filter(r => r.relevance_score >= highThreshold),
    medium: results.filter(r => r.relevance_score >= mediumThreshold && r.relevance_score < highThreshold),
    low: results.filter(r => r.relevance_score < mediumThreshold)
  };
}

// =============================================
// SEARCH MAINTENANCE FUNCTIONS
// =============================================

/**
 * Warm up search indexes (useful for dev/staging environments)
 */
export async function warmupSearchIndexes(supabase: SupabaseClientType) {
  const { data, error } = await supabase.rpc('warmup_search_indexes');
  return { result: data, error };
}

/**
 * Rebuild search vectors if needed
 */
export async function rebuildSearchVectors(
  supabase: SupabaseClientType,
  entityType: 'workspace' | 'section' | 'task' | 'all' = 'all'
) {
  const { data, error } = await supabase.rpc('rebuild_search_vectors', {
    entity_type: entityType
  });
  return { result: data, error };
}