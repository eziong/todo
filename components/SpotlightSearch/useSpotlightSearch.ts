// =============================================
// SPOTLIGHT SEARCH CONTAINER HOOK
// =============================================
// Container logic for spotlight search modal with enhanced database search, keyboard navigation, and real-time results

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Auth';
import { useTaskSearch } from '@/hooks/useTaskSearch';
import { useDebounce } from '@/hooks/useDebounce';
import type {
  SearchResult,
  TaskSearchResult,
  SearchSuggestion,
} from '@/database/types';

// =============================================
// TYPES
// =============================================

export type SearchCategory = 'all' | 'workspaces' | 'sections' | 'tasks' | 'people';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: 'workspace' | 'section' | 'task' | 'user';
  icon: string;
  url?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  workspaceName?: string;
  sectionName?: string;
  assigneeName?: string;
  dueDate?: string;
  tags?: string[];
  relevanceScore: number;
  contextSnippet?: string;
  highlightMatches: Array<{
    field: string;
    value: string;
    matches: Array<{ start: number; end: number }>;
  }>;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  shortcut?: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: string;
  results: number;
}

export interface SearchState {
  isOpen: boolean;
  query: string;
  selectedCategory: SearchCategory;
  results: SearchResultItem[];
  filteredResults: SearchResultItem[];
  suggestions: SearchSuggestion[];
  selectedIndex: number;
  isLoading: boolean;
  suggestionsLoading: boolean;
  error: string | null;
  quickActions: QuickAction[];
  recentSearches: RecentSearch[];
  showNoResults: boolean;
  searchTime: number;
}

export interface UseSpotlightSearchReturn {
  // State
  state: SearchState;
  
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  
  // Modal controls
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  
  // Search functionality
  handleQueryChange: (query: string) => void;
  clearQuery: () => void;
  performSearch: (query: string) => Promise<void>;
  
  // Category filtering
  selectCategory: (category: SearchCategory) => void;
  getCategoryResults: (category: SearchCategory) => SearchResultItem[];
  getCategoryCount: (category: SearchCategory) => number;
  
  // Keyboard navigation
  handleKeyDown: (event: React.KeyboardEvent) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  selectResult: (index?: number) => void;
  
  // Quick actions
  executeQuickAction: (actionId: string) => void;
  getVisibleQuickActions: () => QuickAction[];
  
  // Recent searches
  addRecentSearch: (query: string, resultsCount: number) => void;
  clearRecentSearches: () => void;
  executeRecentSearch: (query: string) => void;
  
  // Navigation
  navigateToResult: (result: SearchResultItem) => void;
  
  // Global keyboard shortcut
  registerGlobalShortcut: (element: HTMLElement | null) => void;
  
  // Enhanced search features
  getSuggestions: (partialQuery: string) => void;
  getSearchTime: () => number;
}

// =============================================
// CONSTANTS
// =============================================

const SEARCH_DEBOUNCE_MS = 300;
const SUGGESTIONS_DEBOUNCE_MS = 200;
const MAX_RESULTS_PER_CATEGORY = 20;
const MAX_RECENT_SEARCHES = 10;
const MIN_QUERY_LENGTH = 1;
const MIN_SUGGESTIONS_LENGTH = 2;

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Transform database search result to SearchResultItem format
const transformSearchResult = (result: SearchResult): SearchResultItem => {
  const getEntityIcon = (entityType: string): string => {
    switch (entityType) {
      case 'workspace': return '📁';
      case 'section': return '📂';
      case 'task': return '📝';
      default: return '📄';
    }
  };

  const getEntityUrl = (result: SearchResult): string => {
    switch (result.entity_type) {
      case 'workspace':
        return `/workspace/${result.entity_id}`;
      case 'section':
        return `/workspace/${result.workspace_id}/section/${result.entity_id}`;
      case 'task':
        return `/workspace/${result.workspace_id}/task/${result.entity_id}`;
      default:
        return '#';
    }
  };

  return {
    id: result.entity_id,
    title: result.title,
    subtitle: result.description || result.context_snippet,
    description: result.description,
    type: result.entity_type as 'workspace' | 'section' | 'task',
    icon: getEntityIcon(result.entity_type),
    url: getEntityUrl(result),
    workspaceName: result.workspace_name,
    sectionName: result.section_name,
    relevanceScore: result.relevance_score,
    contextSnippet: result.context_snippet,
    highlightMatches: [{
      field: 'title',
      value: result.title,
      matches: [] // This would be populated by actual highlighting logic
    }],
  };
};

const transformTaskResult = (result: TaskSearchResult): SearchResultItem => {
  return {
    id: result.id,
    title: result.title,
    subtitle: result.description || result.context_snippet,
    description: result.description,
    type: 'task',
    icon: getTaskIcon(result.status),
    url: `/workspace/${result.workspace_id}/task/${result.id}`,
    priority: result.priority,
    status: result.status,
    workspaceName: result.workspace_name,
    sectionName: result.section_name,
    assigneeName: result.assignee_name,
    dueDate: result.due_date,
    tags: result.tags,
    relevanceScore: result.relevance_score,
    contextSnippet: result.context_snippet,
    highlightMatches: [{
      field: 'title',
      value: result.title,
      matches: [] // This would be populated by actual highlighting logic
    }],
  };
};

const getTaskIcon = (status: string): string => {
  const statusIcons = {
    todo: '⭕',
    in_progress: '🔄', 
    completed: '✅',
    cancelled: '❌',
    on_hold: '⏸️',
  };
  return statusIcons[status as keyof typeof statusIcons] || '📝';
};

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useSpotlightSearch = (): UseSpotlightSearchReturn => {
  const router = useRouter();
  const { user } = useAuth();
  const taskSearch = useTaskSearch();
  
  // Debounced query for search
  const debouncedQuery = useDebounce(taskSearch.query, SEARCH_DEBOUNCE_MS);
  const debouncedSuggestionsQuery = useDebounce(taskSearch.query, SUGGESTIONS_DEBOUNCE_MS);

  // Component state
  const [state, setState] = useState<SearchState>({
    isOpen: false,
    query: '',
    selectedCategory: 'all',
    results: [],
    filteredResults: [],
    suggestions: [],
    selectedIndex: 0,
    isLoading: false,
    suggestionsLoading: false,
    error: null,
    quickActions: [],
    recentSearches: [],
    showNoResults: false,
    searchTime: 0,
  });

  // Sync state with taskSearch
  useEffect(() => {
    setState(prev => ({
      ...prev,
      query: taskSearch.query,
      isLoading: taskSearch.loading,
      error: taskSearch.error,
      searchTime: taskSearch.searchTime,
      suggestions: taskSearch.suggestions,
      suggestionsLoading: taskSearch.suggestionsLoading,
    }));
  }, [
    taskSearch.query,
    taskSearch.loading,
    taskSearch.error,
    taskSearch.searchTime,
    taskSearch.suggestions,
    taskSearch.suggestionsLoading,
  ]);

  // Filter results by category helper
  const filterResultsByCategory = useCallback((results: SearchResultItem[], category: SearchCategory): SearchResultItem[] => {
    if (category === 'all') return results;
    
    const typeMap: Record<SearchCategory, string[]> = {
      workspaces: ['workspace'],
      sections: ['section'],
      tasks: ['task'],
      people: ['user'],
      all: [],
    };
    
    const types = typeMap[category] || [];
    return results.filter(result => types.includes(result.type));
  }, []);

  // Update results when search data changes
  useEffect(() => {
    const allResults = [
      ...taskSearch.globalResults.map(transformSearchResult),
      ...taskSearch.taskResults.map(transformTaskResult),
    ];
    
    setState(prev => ({
      ...prev,
      results: allResults,
      filteredResults: filterResultsByCategory(allResults, prev.selectedCategory),
      showNoResults: allResults.length === 0 && prev.query.length >= MIN_QUERY_LENGTH,
    }));
  }, [taskSearch.globalResults, taskSearch.taskResults, filterResultsByCategory]);

  // Modal controls
  const closeSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      selectedIndex: 0,
      showNoResults: false,
    }));
    taskSearch.clearSearch();
  }, [taskSearch]);

  // Open search modal
  const openSearch = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const toggleSearch = useCallback(() => {
    if (state.isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }, [state.isOpen, openSearch, closeSearch]);

  // Recent searches
  const addRecentSearch = useCallback((query: string, resultsCount: number) => {
    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query,
      timestamp: new Date().toISOString(),
      results: resultsCount,
    };

    setState(prev => ({
      ...prev,
      recentSearches: [newSearch, ...prev.recentSearches.slice(0, MAX_RECENT_SEARCHES - 1)],
    }));
  }, []);

  const clearRecentSearches = useCallback(() => {
    setState(prev => ({ ...prev, recentSearches: [] }));
  }, []);

  const executeRecentSearch = useCallback((query: string) => {
    taskSearch.setQuery(query);
    if (query.trim()) {
      taskSearch.searchGlobal(query);
    }
  }, [taskSearch]);

  // Navigation
  const navigateToResult = useCallback((result: SearchResultItem) => {
    if (result.url) {
      addRecentSearch(state.query, state.results.length);
      router.push(result.url);
      closeSearch();
    }
  }, [state.query, state.results.length, router, addRecentSearch, closeSearch]);

  // Quick actions based on current context
  const quickActions = useMemo<QuickAction[]>(() => [
    {
      id: 'create-task',
      title: 'Create new task',
      description: 'Add a new task to your current workspace',
      icon: '➕',
      action: (): void => {
        // TODO: Implement task creation
        closeSearch();
      },
      shortcut: 'Cmd+N',
    },
    {
      id: 'create-workspace',
      title: 'Create new workspace',
      description: 'Start a new workspace for your projects',
      icon: '📁',
      action: (): void => {
        // TODO: Implement workspace creation
        closeSearch();
      },
    },
    {
      id: 'create-section',
      title: 'Create new section',
      description: 'Organize tasks with a new section',
      icon: '🏷️',
      action: (): void => {
        // TODO: Implement section creation
        closeSearch();
      },
    },
  ], [closeSearch]);

  // Initialize quick actions in state
  useEffect(() => {
    setState(prev => ({ ...prev, quickActions }));
  }, [quickActions]);

  // Search functionality using enhanced database search
  const handleQueryChange = useCallback((query: string) => {
    taskSearch.setQuery(query);
  }, [taskSearch]);

  const clearQuery = useCallback(() => {
    taskSearch.clearSearch();
  }, [taskSearch]);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      await taskSearch.searchGlobal(query);
    }
  }, [taskSearch]);

  // Enhanced search with debounced queries
  useEffect(() => {
    if (debouncedQuery.trim().length >= MIN_QUERY_LENGTH) {
      taskSearch.searchGlobal(debouncedQuery);
    } else {
      taskSearch.clearSearch();
    }
  }, [debouncedQuery, taskSearch]);

  // Get suggestions with debounced input
  useEffect(() => {
    if (debouncedSuggestionsQuery.trim().length >= MIN_SUGGESTIONS_LENGTH) {
      taskSearch.getSuggestions(debouncedSuggestionsQuery);
    }
  }, [debouncedSuggestionsQuery, taskSearch]);

  // Category filtering
  const getCategoryResults = useCallback((category: SearchCategory): SearchResultItem[] => {
    return filterResultsByCategory(state.results, category);
  }, [state.results, filterResultsByCategory]);

  const getCategoryCount = useCallback((category: SearchCategory): number => {
    return getCategoryResults(category).length;
  }, [getCategoryResults]);

  const selectCategory = useCallback((category: SearchCategory) => {
    const filteredResults = getCategoryResults(category);
    setState(prev => ({ 
      ...prev, 
      selectedCategory: category,
      filteredResults,
      selectedIndex: 0,
    }));
  }, [getCategoryResults]);

  // Keyboard navigation
  const selectNext = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIndex: Math.min(prev.selectedIndex + 1, prev.filteredResults.length - 1),
    }));
  }, []);

  const selectPrevious = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIndex: Math.max(prev.selectedIndex - 1, 0),
    }));
  }, []);

  const selectResult = useCallback((index?: number) => {
    const targetIndex = index ?? state.selectedIndex;
    const result = state.filteredResults[targetIndex];
    
    if (result) {
      navigateToResult(result);
    }
  }, [state.selectedIndex, state.filteredResults, navigateToResult]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectPrevious();
        break;
      case 'Enter':
        event.preventDefault();
        selectResult();
        break;
      case 'Escape':
        event.preventDefault();
        closeSearch();
        break;
      case 'Tab':
        event.preventDefault();
        // Cycle through categories
        const categories: SearchCategory[] = ['all', 'workspaces', 'sections', 'tasks', 'people'];
        const currentIndex = categories.indexOf(state.selectedCategory);
        const nextIndex = (currentIndex + 1) % categories.length;
        selectCategory(categories[nextIndex]);
        break;
    }
  }, [state.selectedCategory, selectNext, selectPrevious, selectResult, closeSearch, selectCategory]);

  // Quick actions
  const executeQuickAction = useCallback((actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action) {
      action.action();
    }
  }, [quickActions]);

  const getVisibleQuickActions = useCallback((): QuickAction[] => {
    // Show quick actions when there's no query or no results
    if (!state.query.trim() || (state.showNoResults && state.filteredResults.length === 0)) {
      return quickActions;
    }
    return [];
  }, [state.query, state.showNoResults, state.filteredResults.length, quickActions]);

  // Enhanced search features
  const getSuggestions = useCallback((partialQuery: string) => {
    if (partialQuery.trim().length >= MIN_SUGGESTIONS_LENGTH) {
      taskSearch.getSuggestions(partialQuery);
    }
  }, [taskSearch]);

  const getSearchTime = useCallback(() => {
    return state.searchTime;
  }, [state.searchTime]);

  // Global keyboard shortcut registration
  const registerGlobalShortcut = useCallback((element: HTMLElement | null): (() => void) | undefined => {
    if (!element) return;

    const handleGlobalKeydown = (event: KeyboardEvent): void => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toggleSearch();
      }
    };

    element.addEventListener('keydown', handleGlobalKeydown);
    
    return (): void => {
      element.removeEventListener('keydown', handleGlobalKeydown);
    };
  }, [toggleSearch]);

  return {
    // State
    state,
    
    // Authentication
    user,
    isAuthenticated: !!user,
    
    // Modal controls
    openSearch,
    closeSearch,
    toggleSearch,
    
    // Search functionality
    handleQueryChange,
    clearQuery,
    performSearch,
    
    // Category filtering
    selectCategory,
    getCategoryResults,
    getCategoryCount,
    
    // Keyboard navigation
    handleKeyDown,
    selectNext,
    selectPrevious,
    selectResult,
    
    // Quick actions
    executeQuickAction,
    getVisibleQuickActions,
    
    // Recent searches
    addRecentSearch,
    clearRecentSearches,
    executeRecentSearch,
    
    // Navigation
    navigateToResult,
    
    // Global keyboard shortcut
    registerGlobalShortcut,
    
    // Enhanced search features
    getSuggestions,
    getSearchTime,
  };
};