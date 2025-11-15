// =============================================
// MAIN CONTENT CONTAINER HOOK
// =============================================
// Business logic for main content area layout with filtering, sorting, and view management

import React from 'react';
import type { 
  Task, 
  Section, 
  Workspace,
  TaskStatus,
  TaskPriority,
} from '@/types/database';

// =============================================
// TYPES
// =============================================

export interface FilterState {
  status: TaskStatus[];
  priority: TaskPriority[];
  assignees: string[];
  sections: string[];
  searchQuery: string;
  showCompleted: boolean;
}

export interface SortState {
  field: keyof Task;
  direction: 'asc' | 'desc';
}

export interface ViewState {
  mode: 'grid' | 'list';
  groupBy: 'none' | 'status' | 'priority' | 'assignee' | 'section';
  pageSize: number;
  showDetails: boolean;
}

export interface PaginationState {
  page: number;
  limit: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  total: number;
}

export interface MainContentState {
  // Layout
  activeWorkspace: Workspace | null;
  selectedSection: Section | null;
  
  // Data
  tasks: Task[];
  filteredTasks: Task[];
  loading: boolean;
  error: string | null;
  
  // UI State
  filters: FilterState;
  sort: SortState;
  view: ViewState;
  pagination: PaginationState;
  
  // Refresh state
  isRefreshing: boolean;
  lastRefresh: Date | null;
}

// =============================================
// CONTAINER HOOK RETURN TYPE
// =============================================

export interface UseMainContentReturn {
  // State
  state: MainContentState;
  
  // Data operations
  refreshContent: () => Promise<void>;
  loadMoreTasks: () => Promise<void>;
  
  // Filter operations
  updateFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  
  // Sort operations
  updateSort: (field: keyof Task, direction?: 'asc' | 'desc') => void;
  
  // View operations
  toggleViewMode: () => void;
  updateViewState: (view: Partial<ViewState>) => void;
  
  // Navigation
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setSelectedSection: (section: Section | null) => void;
  
  // Search
  handleSearchChange: (query: string) => void;
  clearSearch: () => void;
  
  // Task operations
  createTask: () => void;
  selectTask: (task: Task) => void;
  
  // Utility
  getEmptyStateProps: () => {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  getLoadingStateProps: () => {
    isLoading: boolean;
    message: string;
  };
}

// =============================================
// DEFAULT STATES
// =============================================

const DEFAULT_FILTERS: FilterState = {
  status: [],
  priority: [],
  assignees: [],
  sections: [],
  searchQuery: '',
  showCompleted: true,
};

const DEFAULT_SORT: SortState = {
  field: 'created_at',
  direction: 'desc',
};

const DEFAULT_VIEW: ViewState = {
  mode: 'grid',
  groupBy: 'none',
  pageSize: 20,
  showDetails: false,
};

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  limit: 20,
  hasMore: false,
  isLoadingMore: false,
  total: 0,
};

// =============================================
// CONTAINER HOOK IMPLEMENTATION
// =============================================

export const useMainContent = (): UseMainContentReturn => {
  // =============================================
  // STATE MANAGEMENT
  // =============================================
  
  const [state, setState] = React.useState<MainContentState>({
    // Layout
    activeWorkspace: null,
    selectedSection: null,
    
    // Data
    tasks: [],
    filteredTasks: [],
    loading: false,
    error: null,
    
    // UI State
    filters: DEFAULT_FILTERS,
    sort: DEFAULT_SORT,
    view: DEFAULT_VIEW,
    pagination: DEFAULT_PAGINATION,
    
    // Refresh state
    isRefreshing: false,
    lastRefresh: null,
  });
  
  // =============================================
  // DERIVED STATE & EFFECTS
  // =============================================
  
  // Apply filters and sorting to tasks
  React.useEffect(() => {
    const applyFiltersAndSort = (): void => {
      let filtered = [...state.tasks];
      
      // Apply search filter
      if (state.filters.searchQuery.trim()) {
        const searchLower = state.filters.searchQuery.toLowerCase();
        filtered = filtered.filter(task =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply status filter
      if (state.filters.status.length > 0) {
        filtered = filtered.filter(task => 
          state.filters.status.includes(task.status)
        );
      }
      
      // Apply priority filter
      if (state.filters.priority.length > 0) {
        filtered = filtered.filter(task => 
          state.filters.priority.includes(task.priority)
        );
      }
      
      // Apply assignee filter
      if (state.filters.assignees.length > 0) {
        filtered = filtered.filter(task => 
          task.assigned_to_user_id && 
          state.filters.assignees.includes(task.assigned_to_user_id)
        );
      }
      
      // Apply section filter
      if (state.filters.sections.length > 0) {
        filtered = filtered.filter(task => 
          state.filters.sections.includes(task.section_id)
        );
      }
      
      // Apply completed filter
      if (!state.filters.showCompleted) {
        filtered = filtered.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        const aValue = a[state.sort.field];
        const bValue = b[state.sort.field];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (aValue > bValue) comparison = 1;
        if (aValue < bValue) comparison = -1;
        
        return state.sort.direction === 'desc' ? -comparison : comparison;
      });
      
      setState(prev => ({
        ...prev,
        filteredTasks: filtered,
        pagination: {
          ...prev.pagination,
          total: filtered.length,
          hasMore: filtered.length > prev.pagination.limit,
        },
      }));
    };
    
    applyFiltersAndSort();
  }, [state.tasks, state.filters, state.sort]);
  
  // =============================================
  // DATA OPERATIONS
  // =============================================
  
  const refreshContent = React.useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isRefreshing: true, error: null }));
    
    try {
      // TODO: Implement API call to refresh tasks
      // For now, simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        lastRefresh: new Date(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Failed to refresh content',
      }));
    }
  }, []);
  
  const loadMoreTasks = React.useCallback(async (): Promise<void> => {
    if (state.pagination.isLoadingMore || !state.pagination.hasMore) return;
    
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, isLoadingMore: true },
    }));
    
    try {
      // TODO: Implement API call to load more tasks
      // For now, simulate loading
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setState(prev => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          page: prev.pagination.page + 1,
          isLoadingMore: false,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, isLoadingMore: false },
        error: error instanceof Error ? error.message : 'Failed to load more tasks',
      }));
    }
  }, [state.pagination.isLoadingMore, state.pagination.hasMore]);
  
  // =============================================
  // FILTER OPERATIONS
  // =============================================
  
  const updateFilters = React.useCallback((filters: Partial<FilterState>): void => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      pagination: { ...prev.pagination, page: 1 }, // Reset pagination
    }));
  }, []);
  
  const clearFilters = React.useCallback((): void => {
    setState(prev => ({
      ...prev,
      filters: DEFAULT_FILTERS,
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);
  
  const resetFilters = React.useCallback((): void => {
    setState(prev => ({
      ...prev,
      filters: DEFAULT_FILTERS,
      sort: DEFAULT_SORT,
      view: DEFAULT_VIEW,
      pagination: DEFAULT_PAGINATION,
    }));
  }, []);
  
  // =============================================
  // SORT OPERATIONS
  // =============================================
  
  const updateSort = React.useCallback((
    field: keyof Task, 
    direction?: 'asc' | 'desc'
  ): void => {
    setState(prev => {
      const newDirection = direction || 
        (prev.sort.field === field && prev.sort.direction === 'asc' ? 'desc' : 'asc');
      
      return {
        ...prev,
        sort: { field, direction: newDirection },
        pagination: { ...prev.pagination, page: 1 }, // Reset pagination
      };
    });
  }, []);
  
  // =============================================
  // VIEW OPERATIONS
  // =============================================
  
  const toggleViewMode = React.useCallback((): void => {
    setState(prev => ({
      ...prev,
      view: {
        ...prev.view,
        mode: prev.view.mode === 'grid' ? 'list' : 'grid',
      },
    }));
  }, []);
  
  const updateViewState = React.useCallback((view: Partial<ViewState>): void => {
    setState(prev => ({
      ...prev,
      view: { ...prev.view, ...view },
    }));
  }, []);
  
  // =============================================
  // NAVIGATION
  // =============================================
  
  const setActiveWorkspace = React.useCallback((workspace: Workspace | null): void => {
    setState(prev => ({
      ...prev,
      activeWorkspace: workspace,
      selectedSection: null, // Clear section when workspace changes
      filters: DEFAULT_FILTERS, // Reset filters
      pagination: DEFAULT_PAGINATION, // Reset pagination
    }));
  }, []);
  
  const setSelectedSection = React.useCallback((section: Section | null): void => {
    setState(prev => ({
      ...prev,
      selectedSection: section,
      filters: {
        ...DEFAULT_FILTERS,
        sections: section ? [section.id] : [],
      },
      pagination: DEFAULT_PAGINATION, // Reset pagination
    }));
  }, []);
  
  // =============================================
  // SEARCH
  // =============================================
  
  const handleSearchChange = React.useCallback((query: string): void => {
    updateFilters({ searchQuery: query });
  }, [updateFilters]);
  
  const clearSearch = React.useCallback((): void => {
    updateFilters({ searchQuery: '' });
  }, [updateFilters]);
  
  // =============================================
  // TASK OPERATIONS
  // =============================================
  
  const createTask = React.useCallback((): void => {
    // TODO: Implement task creation
  }, []);
  
  const selectTask = React.useCallback((task: Task): void => {
    // TODO: Implement task selection
    void task.id; // Use the task id to avoid unused parameter warning
  }, []);
  
  // =============================================
  // UTILITY FUNCTIONS
  // =============================================
  
  const getEmptyStateProps = React.useCallback(() => {
    const hasFilters = Object.values(state.filters).some(filter => {
      if (Array.isArray(filter)) return filter.length > 0;
      if (typeof filter === 'string') return filter.trim() !== '';
      if (typeof filter === 'boolean') return filter !== true; // showCompleted defaults to true
      return false;
    });
    
    if (hasFilters) {
      return {
        title: 'No tasks match your filters',
        description: 'Try adjusting your filters or search terms to find what you\'re looking for.',
        actionLabel: 'Clear Filters',
        onAction: clearFilters,
      };
    }
    
    if (state.selectedSection) {
      return {
        title: 'No tasks in this section',
        description: 'Get started by creating your first task in this section.',
        actionLabel: 'Create Task',
        onAction: createTask,
      };
    }
    
    if (state.activeWorkspace) {
      return {
        title: 'No tasks in this workspace',
        description: 'Create sections and tasks to get organized and boost your productivity.',
        actionLabel: 'Create Task',
        onAction: createTask,
      };
    }
    
    return {
      title: 'Select a workspace to get started',
      description: 'Choose a workspace from the sidebar to view and manage your tasks.',
    };
  }, [state.filters, state.selectedSection, state.activeWorkspace, clearFilters, createTask]);
  
  const getLoadingStateProps = React.useCallback(() => ({
    isLoading: state.loading || state.isRefreshing,
    message: state.isRefreshing ? 'Refreshing tasks...' : 'Loading tasks...',
  }), [state.loading, state.isRefreshing]);
  
  // =============================================
  // RETURN INTERFACE
  // =============================================
  
  return {
    // State
    state,
    
    // Data operations
    refreshContent,
    loadMoreTasks,
    
    // Filter operations
    updateFilters,
    clearFilters,
    resetFilters,
    
    // Sort operations
    updateSort,
    
    // View operations
    toggleViewMode,
    updateViewState,
    
    // Navigation
    setActiveWorkspace,
    setSelectedSection,
    
    // Search
    handleSearchChange,
    clearSearch,
    
    // Task operations
    createTask,
    selectTask,
    
    // Utility
    getEmptyStateProps,
    getLoadingStateProps,
  };
};