// =============================================
// ACTIVITY SEARCH CONTAINER HOOK
// =============================================
// Container logic for searching through activity history

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { 
  ActivityFeedItem, 
  EventType, 
  EventCategory, 
  EventSeverity,
  EntityType
} from '@/types/database';

export interface UseActivitySearchProps {
  workspaceId?: string;
  onSearch?: (results: ActivityFeedItem[]) => void;
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
}

export interface SearchSuggestion {
  type: 'user' | 'event_type' | 'entity' | 'tag' | 'recent';
  value: string;
  label: string;
  count?: number;
  icon?: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: string;
  resultCount: number;
}

export interface SearchFilters {
  eventTypes: EventType[];
  categories: EventCategory[];
  severities: EventSeverity[];
  entityTypes: EntityType[];
  users: string[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
  tags: string[];
}

export interface SearchStats {
  totalQueries: number;
  averageResults: number;
  mostSearchedTerms: Array<{ term: string; count: number }>;
  recentQueries: SearchHistory[];
}

export interface UseActivitySearchReturn {
  // Search state
  query: string;
  setQuery: (query: string) => void;
  results: ActivityFeedItem[];
  loading: boolean;
  error: string | null;
  
  // Filters
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  
  // Suggestions
  suggestions: SearchSuggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  
  // Search actions
  executeSearch: () => Promise<void>;
  clearSearch: () => void;
  
  // History
  searchHistory: SearchHistory[];
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  applyHistoryItem: (item: SearchHistory) => void;
  
  // Stats
  searchStats: SearchStats | null;
  
  // Computed values
  hasQuery: boolean;
  hasFilters: boolean;
  hasResults: boolean;
  resultCount: number;
  
  // Advanced search
  buildAdvancedQuery: (terms: string[]) => string;
  parseQuery: (query: string) => {
    terms: string[];
    operators: string[];
    quoted: string[];
  };
}

const defaultFilters: SearchFilters = {
  eventTypes: [],
  categories: [],
  severities: [],
  entityTypes: [],
  users: [],
  dateRange: {
    from: null,
    to: null
  },
  tags: []
};

export const useActivitySearch = ({
  workspaceId,
  onSearch,
  debounceMs = 300,
  minQueryLength = 2,
  maxResults = 100
}: UseActivitySearchProps): UseActivitySearchReturn => {
  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<SearchFilters>(defaultFilters);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);

  // Debounced query
  const debouncedQuery = useDebounce(query, debounceMs);

  // Mock data for suggestions (in real app, this would come from API)
  const mockSuggestions: SearchSuggestion[] = [
    { type: 'user', value: 'john.doe', label: 'John Doe', count: 45, icon: '👤' },
    { type: 'user', value: 'jane.smith', label: 'Jane Smith', count: 32, icon: '👤' },
    { type: 'event_type', value: 'created', label: 'Created events', count: 123, icon: '➕' },
    { type: 'event_type', value: 'updated', label: 'Updated events', count: 89, icon: '✏️' },
    { type: 'event_type', value: 'completed', label: 'Completed events', count: 67, icon: '✅' },
    { type: 'entity', value: 'task', label: 'Tasks', count: 234, icon: '📋' },
    { type: 'entity', value: 'section', label: 'Sections', count: 45, icon: '📁' },
    { type: 'tag', value: 'urgent', label: '#urgent', count: 23, icon: '#' },
    { type: 'tag', value: 'bug', label: '#bug', count: 12, icon: '#' },
    { type: 'recent', value: 'status changed to completed', label: 'status changed to completed', icon: '🔍' },
    { type: 'recent', value: 'task created', label: 'task created', icon: '🔍' }
  ];

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('activitySearchHistory');
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = useCallback((searchQuery: string, searchFilters: SearchFilters, resultCount: number) => {
    const historyItem: SearchHistory = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query: searchQuery,
      filters: searchFilters,
      timestamp: new Date().toISOString(),
      resultCount
    };

    setSearchHistory(prev => {
      const updated = [historyItem, ...prev.filter(item => item.query !== searchQuery)].slice(0, 20);
      try {
        localStorage.setItem('activitySearchHistory', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
      return updated;
    });
  }, []);

  // Mock search function (in real app, this would call API)
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters): Promise<ActivityFeedItem[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    // Mock results based on query
    const mockResults: ActivityFeedItem[] = [];
    const resultCount = Math.floor(Math.random() * 20) + 5;
    
    for (let i = 0; i < resultCount; i++) {
      mockResults.push({
        id: `result-${i}`,
        event_type: 'created',
        entity_type: 'task',
        user_name: 'John Doe',
        workspace_name: 'Test Workspace',
        description: `Mock result ${i + 1} for query "${searchQuery}"`,
        created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        category: 'user_action',
        severity: 'info',
        context: {}
      });
    }

    return mockResults;
  }, []);

  // Execute search
  const executeSearch = useCallback(async () => {
    if (!query.trim() && !hasFilters) {
      setResults([]);
      setError(null);
      return;
    }

    if (query.length > 0 && query.length < minQueryLength) {
      setError(`Query must be at least ${minQueryLength} characters`);
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const searchResults = await performSearch(query, filters);
      setResults(searchResults);
      
      if (query.trim()) {
        saveToHistory(query, filters, searchResults.length);
      }
      
      onSearch?.(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, filters, hasFilters, minQueryLength, performSearch, saveToHistory, onSearch]);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= minQueryLength || hasFilters) {
      executeSearch();
    } else if (debouncedQuery.length === 0) {
      setResults([]);
      setError(null);
    }
  }, [debouncedQuery, executeSearch, minQueryLength, hasFilters]);

  // Update suggestions based on query
  useEffect(() => {
    if (query.length >= 1) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.label.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.value.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
      setSuggestions(filtered);
    } else {
      setSuggestions(mockSuggestions.slice(0, 10));
    }
  }, [query]);

  // Filter management
  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setShowSuggestions(false);
  }, []);

  // History management
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('activitySearchHistory');
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setSearchHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem('activitySearchHistory', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to update search history:', error);
      }
      return updated;
    });
  }, []);

  const applyHistoryItem = useCallback((item: SearchHistory) => {
    setQuery(item.query);
    setFiltersState(item.filters);
    setShowSuggestions(false);
  }, []);

  // Computed values
  const hasQuery = query.trim().length > 0;
  const hasFilters = useMemo(() => {
    return (
      filters.eventTypes.length > 0 ||
      filters.categories.length > 0 ||
      filters.severities.length > 0 ||
      filters.entityTypes.length > 0 ||
      filters.users.length > 0 ||
      filters.dateRange.from !== null ||
      filters.dateRange.to !== null ||
      filters.tags.length > 0
    );
  }, [filters]);
  
  const hasResults = results.length > 0;
  const resultCount = results.length;

  // Advanced query building
  const buildAdvancedQuery = useCallback((terms: string[]): string => {
    return terms.map(term => {
      if (term.includes(' ')) {
        return `"${term}";`
      }
      return term;
    }).join(' ');
  }, []);

  const parseQuery = useCallback((searchQuery: string) => {
    const quoted = searchQuery.match(/"([^"]+)"/g)?.map(q => q.slice(1, -1)) || [];
    const withoutQuoted = searchQuery.replace(/"([^"]+)"/g, '');
    const terms = withoutQuoted.split(/\s+/).filter(Boolean);
    const operators = searchQuery.match(/\b(AND|OR|NOT)\b/gi) || [];
    
    return { terms, operators, quoted };
  }, []);

  // Mock search stats
  useEffect(() => {
    setSearchStats({
      totalQueries: searchHistory.length,
      averageResults: searchHistory.length > 0 
        ? Math.round(searchHistory.reduce((sum, item) => sum + item.resultCount, 0) / searchHistory.length)
        : 0,
      mostSearchedTerms: [
        { term: 'task created', count: 15 },
        { term: 'john doe', count: 12 },
        { term: 'completed', count: 8 },
        { term: 'bug', count: 6 },
        { term: 'urgent', count: 4 }
      ],
      recentQueries: searchHistory.slice(0, 5)
    });
  }, [searchHistory]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    executeSearch,
    clearSearch,
    searchHistory,
    clearHistory,
    deleteHistoryItem,
    applyHistoryItem,
    searchStats,
    hasQuery,
    hasFilters,
    hasResults,
    resultCount,
    buildAdvancedQuery,
    parseQuery
  };
};