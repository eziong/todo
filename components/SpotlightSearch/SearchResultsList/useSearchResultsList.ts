// =============================================
// SEARCH RESULTS LIST CONTAINER HOOK
// =============================================
// Container logic for search results display with relevance ranking, highlighting, and advanced features

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchResultItem } from '../useSpotlightSearch';

// =============================================
// TYPES
// =============================================

export interface ResultGroup {
  type: string;
  label: string;
  icon: string;
  color: string;
  results: SearchResultItem[];
  count: number;
}

export interface SortOption {
  field: 'relevance' | 'title' | 'updated_at' | 'created_at' | 'due_date';
  direction: 'asc' | 'desc';
  label: string;
}

export interface ViewMode {
  id: 'list' | 'grid' | 'compact';
  label: string;
  icon: string;
}

export interface UseSearchResultsListReturn {
  // State
  results: SearchResultItem[];
  groupedResults: ResultGroup[];
  selectedIndex: number;
  viewMode: ViewMode['id'];
  sortBy: SortOption;
  showRelevanceScores: boolean;
  showContextSnippets: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Configuration
  availableSortOptions: SortOption[];
  availableViewModes: ViewMode[];
  
  // Actions
  selectResult: (index: number) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  navigateToResult: (result: SearchResultItem) => void;
  setSortBy: (sort: SortOption) => void;
  setViewMode: (mode: ViewMode['id']) => void;
  toggleRelevanceScores: () => void;
  toggleContextSnippets: () => void;
  
  // Filtering
  filterByType: (type: string) => void;
  clearTypeFilter: () => void;
  getTypeFilter: () => string | null;
  
  // Highlighting
  getHighlightData: (text: string, query: string) => Array<{ text: string; isHighlighted: boolean }>;
  getRelevanceLabel: (score: number) => string;
  getRelevanceColor: (score: number) => string;
  
  // Keyboard handling
  handleKeyDown: (event: React.KeyboardEvent) => boolean;
  
  // Utility functions
  getTotalCount: () => number;
  getResultSummary: () => string;
  exportResults: () => string;
}

export interface SearchResultsListProps {
  className?: string;
  results: SearchResultItem[];
  query: string;
  loading?: boolean;
  error?: string | null;
  onResultSelect?: (result: SearchResultItem) => void;
  onResultHover?: (result: SearchResultItem | null) => void;
  showGrouping?: boolean;
  defaultViewMode?: ViewMode['id'];
  defaultSortBy?: SortOption;
  showRelevanceScores?: boolean;
  showContextSnippets?: boolean;
  compact?: boolean;
  maxResults?: number;
}

// =============================================
// CONSTANTS
// =============================================

const SORT_OPTIONS: SortOption[] = [
  { field: 'relevance', direction: 'desc', label: 'Relevance' },
  { field: 'title', direction: 'asc', label: 'Name (A-Z)' },
  { field: 'title', direction: 'desc', label: 'Name (Z-A)' },
  { field: 'updated_at', direction: 'desc', label: 'Recently Updated' },
  { field: 'created_at', direction: 'desc', label: 'Recently Created' },
  { field: 'due_date', direction: 'asc', label: 'Due Date (Nearest)' },
];

const VIEW_MODES: ViewMode[] = [
  { id: 'list', label: 'List View', icon: '📋' },
  { id: 'grid', label: 'Grid View', icon: '▦' },
  { id: 'compact', label: 'Compact View', icon: '☰' },
];

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useSearchResultsList = (
  initialResults: SearchResultItem[] = [],
  query: string = '',
  onResultSelect?: (result: SearchResultItem) => void
): UseSearchResultsListReturn => {
  const router = useRouter();
  
  // State management
  const [results, setResults] = useState<SearchResultItem[]>(initialResults);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode['id']>('list');
  const [sortBy, setSortBy] = useState<SortOption>(SORT_OPTIONS[0]);
  const [showRelevanceScores, setShowRelevanceScores] = useState<boolean>(true);
  const [showContextSnippets, setShowContextSnippets] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update results when props change
  useEffect(() => {
    setResults(initialResults);
    setSelectedIndex(0);
    setError(null);
  }, [initialResults]);

  // Sort and filter results
  const sortedAndFilteredResults = useMemo(() => {
    let filtered = results;

    // Apply type filter
    if (typeFilter) {
      filtered = results.filter(result => result.type === typeFilter);
    }

    // Sort results
    const sorted = [...filtered].sort((a, b) => {
      const { field, direction } = sortBy;
      let aValue: any, bValue: any;

      switch (field) {
        case 'relevance':
          aValue = a.relevanceScore || 0;
          bValue = b.relevanceScore || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'updated_at':
          aValue = new Date(a.dueDate || 0).getTime();
          bValue = new Date(b.dueDate || 0).getTime();
          break;
        case 'created_at':
          aValue = new Date(a.dueDate || 0).getTime();
          bValue = new Date(b.dueDate || 0).getTime();
          break;
        case 'due_date':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        default:
          return 0;
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return sorted;
  }, [results, sortBy, typeFilter]);

  // Group results by type
  const groupedResults = useMemo((): ResultGroup[] => {
    const groups: Record<string, SearchResultItem[]> = {};
    
    sortedAndFilteredResults.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });

    return Object.entries(groups).map(([type, typeResults]) => ({
      type,
      label: getTypeLabel(type),
      icon: getTypeIcon(type),
      color: getTypeColor(type),
      results: typeResults,
      count: typeResults.length,
    }));
  }, [sortedAndFilteredResults]);

  // Helper functions for entity types
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'workspace': return 'Workspaces';
      case 'section': return 'Sections';
      case 'task': return 'Tasks';
      case 'user': return 'People';
      default: return 'Items';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'workspace': return '📁';
      case 'section': return '📂';
      case 'task': return '📝';
      case 'user': return '👤';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'workspace': return '#3B82F6';
      case 'section': return '#10B981';
      case 'task': return '#6366F1';
      case 'user': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  // Navigation functions
  const selectResult = useCallback((index: number) => {
    if (index >= 0 && index < sortedAndFilteredResults.length) {
      setSelectedIndex(index);
    }
  }, [sortedAndFilteredResults.length]);

  const navigateNext = useCallback(() => {
    setSelectedIndex(prev => 
      prev < sortedAndFilteredResults.length - 1 ? prev + 1 : prev
    );
  }, [sortedAndFilteredResults.length]);

  const navigatePrevious = useCallback(() => {
    setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
  }, []);

  const navigateToResult = useCallback((result: SearchResultItem) => {
    if (result.url) {
      router.push(result.url);
    }
    onResultSelect?.(result);
  }, [router, onResultSelect]);

  // Configuration functions
  const handleSetSortBy = useCallback((sort: SortOption) => {
    setSortBy(sort);
    setSelectedIndex(0); // Reset selection when sort changes
  }, []);

  const handleSetViewMode = useCallback((mode: ViewMode['id']) => {
    setViewMode(mode);
  }, []);

  const toggleRelevanceScores = useCallback(() => {
    setShowRelevanceScores(prev => !prev);
  }, []);

  const toggleContextSnippets = useCallback(() => {
    setShowContextSnippets(prev => !prev);
  }, []);

  // Filtering functions
  const filterByType = useCallback((type: string) => {
    setTypeFilter(type);
    setSelectedIndex(0);
  }, []);

  const clearTypeFilter = useCallback(() => {
    setTypeFilter(null);
    setSelectedIndex(0);
  }, []);

  const getTypeFilter = useCallback(() => typeFilter, [typeFilter]);

  // Get highlight data for text rendering
  const getHighlightData = useCallback((text: string, searchQuery: string): Array<{ text: string; isHighlighted: boolean }> => {
    if (!searchQuery.trim()) {
      return [{ text, isHighlighted: false }];
    }
    
    try {
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part) => ({
        text: part,
        isHighlighted: part.toLowerCase() === searchQuery.toLowerCase()
      }));
    } catch {
      return [{ text, isHighlighted: false }];
    }
  }, []);

  // Relevance functions
  const getRelevanceLabel = useCallback((score: number): string => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    if (score >= 0.2) return 'Poor';
    return 'Low';
  }, []);

  const getRelevanceColor = useCallback((score: number): string => {
    if (score >= 0.8) return '#10B981'; // green
    if (score >= 0.6) return '#3B82F6'; // blue
    if (score >= 0.4) return '#F59E0B'; // yellow
    if (score >= 0.2) return '#EF4444'; // red
    return '#6B7280'; // gray
  }, []);

  // Keyboard handling
  const handleKeyDown = useCallback((event: React.KeyboardEvent): boolean => {
    if (sortedAndFilteredResults.length === 0) return false;

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
        event.preventDefault();
        const currentResult = sortedAndFilteredResults[selectedIndex];
        if (currentResult) {
          navigateToResult(currentResult);
        }
        return true;
      case 'Escape':
        // Let parent handle escape
        return false;
      default:
        return false;
    }
  }, [sortedAndFilteredResults, selectedIndex, navigateNext, navigatePrevious, navigateToResult]);

  // Utility functions
  const getTotalCount = useCallback(() => sortedAndFilteredResults.length, [sortedAndFilteredResults.length]);

  const getResultSummary = useCallback((): string => {
    const total = getTotalCount();
    if (total === 0) return 'No results found';
    
    const filtered = typeFilter ? ` ${getTypeLabel(typeFilter).toLowerCase()}` : '';
    return `${total}${filtered} result${total === 1 ? '' : 's'} found`;
  }, [getTotalCount, typeFilter]);

  const exportResults = useCallback((): string => {
    return JSON.stringify(sortedAndFilteredResults, null, 2);
  }, [sortedAndFilteredResults]);

  return {
    // State
    results: sortedAndFilteredResults,
    groupedResults,
    selectedIndex,
    viewMode,
    sortBy,
    showRelevanceScores,
    showContextSnippets,
    isLoading,
    error,
    
    // Configuration
    availableSortOptions: SORT_OPTIONS,
    availableViewModes: VIEW_MODES,
    
    // Actions
    selectResult,
    navigateNext,
    navigatePrevious,
    navigateToResult,
    setSortBy: handleSetSortBy,
    setViewMode: handleSetViewMode,
    toggleRelevanceScores,
    toggleContextSnippets,
    
    // Filtering
    filterByType,
    clearTypeFilter,
    getTypeFilter,
    
    // Highlighting
    getHighlightData,
    getRelevanceLabel,
    getRelevanceColor,
    
    // Keyboard handling
    handleKeyDown,
    
    // Utility functions
    getTotalCount,
    getResultSummary,
    exportResults,
  };
};