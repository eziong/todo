// =============================================
// SEARCH SUGGESTIONS CONTAINER HOOK
// =============================================
// Container logic for search suggestions with autocomplete functionality and caching

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { SearchSuggestion } from '@/database/types';

// =============================================
// TYPES
// =============================================

export interface SuggestionGroup {
  title: string;
  suggestions: SearchSuggestion[];
  icon: string;
  color?: string;
}

export interface UseSearchSuggestionsReturn {
  // State
  suggestions: SearchSuggestion[];
  groupedSuggestions: SuggestionGroup[];
  loading: boolean;
  error: string | null;
  isVisible: boolean;
  selectedIndex: number;
  
  // Actions
  getSuggestions: (query: string) => Promise<void>;
  selectSuggestion: (suggestion: SearchSuggestion) => void;
  selectByIndex: (index: number) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  clearSuggestions: () => void;
  hideSuggestions: () => void;
  showSuggestions: () => void;
  
  // Keyboard handling
  handleKeyDown: (event: React.KeyboardEvent) => boolean;
  
  // Cache management
  clearCache: () => void;
  getCacheSize: () => number;
  
  // Configuration
  setMaxSuggestions: (max: number) => void;
  setDebounceMs: (ms: number) => void;
}

export interface SearchSuggestionsProps {
  className?: string;
  query: string;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  onSuggestionHover?: (suggestion: SearchSuggestion | null) => void;
  getSuggestionsFunction?: (query: string) => Promise<SearchSuggestion[]>;
  maxSuggestions?: number;
  debounceMs?: number;
  workspaceId?: string;
  showCategories?: boolean;
  compact?: boolean;
}

// =============================================
// CONSTANTS
// =============================================

const DEFAULT_DEBOUNCE_MS = 200;
const DEFAULT_MAX_SUGGESTIONS = 10;
const MIN_QUERY_LENGTH = 2;
const CACHE_SIZE_LIMIT = 100;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache entry interface
interface CacheEntry {
  suggestions: SearchSuggestion[];
  timestamp: number;
  workspaceId?: string;
}

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useSearchSuggestions = (
  getSuggestionsFunction?: (query: string, workspaceId?: string) => Promise<SearchSuggestion[]>,
  initialMaxSuggestions: number = DEFAULT_MAX_SUGGESTIONS,
  initialDebounceMs: number = DEFAULT_DEBOUNCE_MS,
  workspaceId?: string
): UseSearchSuggestionsReturn => {
  // State management
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [maxSuggestions, setMaxSuggestions] = useState<number>(initialMaxSuggestions);
  const [debounceMs, setDebounceMs] = useState<number>(initialDebounceMs);

  // Cache and refs
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate cache key
  const getCacheKey = useCallback((query: string, workspace?: string): string => {
    return `${query.toLowerCase().trim()}|${workspace || 'global'}`;
  }, []);

  // Clean expired cache entries
  const cleanCache = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
      }
    }
  }, []);

  // Get suggestions from cache
  const getCachedSuggestions = useCallback((query: string, workspace?: string): SearchSuggestion[] | null => {
    const cacheKey = getCacheKey(query, workspace);
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.suggestions;
    }
    
    return null;
  }, [getCacheKey]);

  // Store suggestions in cache
  const cacheSuggestions = useCallback((
    query: string,
    suggestionsToCache: SearchSuggestion[],
    workspace?: string
  ) => {
    const cache = cacheRef.current;
    const cacheKey = getCacheKey(query, workspace);
    
    // Clean old entries if cache is getting too large
    if (cache.size >= CACHE_SIZE_LIMIT) {
      cleanCache();
      
      // If still too large, remove oldest entries
      if (cache.size >= CACHE_SIZE_LIMIT) {
        const sortedEntries = Array.from(cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toRemove = sortedEntries.slice(0, cache.size - CACHE_SIZE_LIMIT + 1);
        toRemove.forEach(([key]) => cache.delete(key));
      }
    }
    
    cache.set(cacheKey, {
      suggestions: suggestionsToCache,
      timestamp: Date.now(),
      workspaceId: workspace,
    });
  }, [getCacheKey, cleanCache]);

  // Group suggestions by entity type
  const groupedSuggestions = useMemo((): SuggestionGroup[] => {
    const groups: Record<string, { suggestions: SearchSuggestion[]; icon: string; color?: string }> = {};
    
    suggestions.forEach(suggestion => {
      const type = suggestion.entity_type;
      
      if (!groups[type]) {
        groups[type] = {
          suggestions: [],
          icon: getEntityTypeIcon(type),
          color: getEntityTypeColor(type),
        };
      }
      
      groups[type].suggestions.push(suggestion);
    });

    return Object.entries(groups).map(([type, group]) => ({
      title: getEntityTypeLabel(type),
      suggestions: group.suggestions,
      icon: group.icon,
      color: group.color,
    }));
  }, [suggestions]);

  // Helper functions for entity types
  const getEntityTypeIcon = (entityType: string): string => {
    switch (entityType) {
      case 'workspace': return '📁';
      case 'section': return '📂';
      case 'task': return '📝';
      case 'tag': return '🏷️';
      default: return '💡';
    }
  };

  const getEntityTypeColor = (entityType: string): string => {
    switch (entityType) {
      case 'workspace': return '#3B82F6';
      case 'section': return '#10B981';
      case 'task': return '#6366F1';
      case 'tag': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getEntityTypeLabel = (entityType: string): string => {
    switch (entityType) {
      case 'workspace': return 'Workspaces';
      case 'section': return 'Sections';
      case 'task': return 'Tasks';
      case 'tag': return 'Tags';
      default: return 'Suggestions';
    }
  };

  // Get suggestions function
  const getSuggestions = useCallback(async (query: string): Promise<void> => {
    if (!query.trim() || query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsVisible(false);
      setError(null);
      return;
    }

    // Check cache first
    const cached = getCachedSuggestions(query, workspaceId);
    if (cached) {
      setSuggestions(cached.slice(0, maxSuggestions));
      setIsVisible(cached.length > 0);
      setSelectedIndex(-1);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      if (!getSuggestionsFunction) {
        throw new Error('No suggestions function provided');
      }

      const result = await getSuggestionsFunction(query, workspaceId);
      
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      const limitedResults = result.slice(0, maxSuggestions);
      
      setSuggestions(limitedResults);
      setIsVisible(limitedResults.length > 0);
      setSelectedIndex(-1);
      
      // Cache the results
      cacheSuggestions(query, result, workspaceId);
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch suggestions';
      setError(errorMessage);
      setSuggestions([]);
      setIsVisible(false);
    } finally {
      setLoading(false);
    }
  }, [
    workspaceId,
    maxSuggestions,
    getSuggestionsFunction,
    getCachedSuggestions,
    cacheSuggestions,
  ]);

  // Selection functions
  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setIsVisible(false);
    setSelectedIndex(-1);
  }, []);

  const selectByIndex = useCallback((index: number) => {
    if (index >= 0 && index < suggestions.length) {
      const suggestion = suggestions[index];
      selectSuggestion(suggestion);
      return suggestion;
    }
    return null;
  }, [suggestions, selectSuggestion]);

  const navigateNext = useCallback(() => {
    setSelectedIndex(prev => {
      if (prev < suggestions.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [suggestions.length]);

  const navigatePrevious = useCallback(() => {
    setSelectedIndex(prev => {
      if (prev > 0) {
        return prev - 1;
      }
      return -1;
    });
  }, []);

  // Clear functions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setIsVisible(false);
    setSelectedIndex(-1);
    setError(null);
  }, []);

  const hideSuggestions = useCallback(() => {
    setIsVisible(false);
    setSelectedIndex(-1);
  }, []);

  const showSuggestions = useCallback(() => {
    if (suggestions.length > 0) {
      setIsVisible(true);
    }
  }, [suggestions.length]);

  // Keyboard handling
  const handleKeyDown = useCallback((event: React.KeyboardEvent): boolean => {
    if (!isVisible || suggestions.length === 0) {
      return false;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        navigateNext();
        return true;
      case 'ArrowUp':
        event.preventDefault();
        navigatePrevious();
        return true;
      case 'Enter':
        if (selectedIndex >= 0) {
          event.preventDefault();
          selectByIndex(selectedIndex);
          return true;
        }
        return false;
      case 'Escape':
        event.preventDefault();
        hideSuggestions();
        return true;
      case 'Tab':
        if (selectedIndex >= 0) {
          event.preventDefault();
          selectByIndex(selectedIndex);
          return true;
        }
        return false;
      default:
        return false;
    }
  }, [isVisible, suggestions.length, selectedIndex, navigateNext, navigatePrevious, selectByIndex, hideSuggestions]);

  // Cache management
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getCacheSize = useCallback((): number => {
    return cacheRef.current.size;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Periodic cache cleanup
  useEffect(() => {
    const interval = setInterval(cleanCache, 60000); // Clean every minute
    return () => clearInterval(interval);
  }, [cleanCache]);

  return {
    // State
    suggestions,
    groupedSuggestions,
    loading,
    error,
    isVisible,
    selectedIndex,
    
    // Actions
    getSuggestions,
    selectSuggestion,
    selectByIndex,
    navigateNext,
    navigatePrevious,
    clearSuggestions,
    hideSuggestions,
    showSuggestions,
    
    // Keyboard handling
    handleKeyDown,
    
    // Cache management
    clearCache,
    getCacheSize,
    
    // Configuration
    setMaxSuggestions,
    setDebounceMs,
  };
};