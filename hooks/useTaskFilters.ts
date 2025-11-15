// =============================================
// TASK FILTERS CONTAINER HOOK
// =============================================
// Container logic for task filtering and sorting functionality

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { 
  TaskStatus,
  TaskPriority 
} from '@/database/types';

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedToUserId?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  tags?: string[];
  search?: string;
  includeCompleted?: boolean;
  includeArchived?: boolean;
}

export interface TaskSort {
  field: 'title' | 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'position' | 'status';
  direction: 'asc' | 'desc';
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: TaskFilters;
  sort?: TaskSort;
}

export interface UseTaskFiltersOptions {
  initialFilters?: TaskFilters;
  initialSort?: TaskSort;
  persistFilters?: boolean;
  storageKey?: string;
}

export interface UseTaskFiltersReturn {
  // Current state
  filters: TaskFilters;
  sort: TaskSort;
  
  // Filter actions
  setFilters: (filters: TaskFilters) => void;
  updateFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  clearFilters: () => void;
  
  // Sort actions
  setSort: (sort: TaskSort) => void;
  toggleSortDirection: () => void;
  setSortField: (field: TaskSort['field']) => void;
  
  // Quick filters
  filterByStatus: (status: TaskStatus[]) => void;
  filterByPriority: (priority: TaskPriority[]) => void;
  filterByAssignee: (userId: string | null) => void;
  filterByTag: (tag: string) => void;
  filterByDueDateRange: (from?: string, to?: string) => void;
  
  // Search
  setSearch: (search: string) => void;
  clearSearch: () => void;
  
  // Presets
  presets: FilterPreset[];
  savePreset: (name: string) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  
  // Utilities
  hasActiveFilters: boolean;
  hasActiveSearch: boolean;
  activeFilterCount: number;
  getFilterSummary: () => string;
  
  // URL serialization
  toQueryParams: () => URLSearchParams;
  fromQueryParams: (params: URLSearchParams) => void;
  
  // Persistence
  saveToStorage: () => void;
  loadFromStorage: () => void;
  clearStorage: () => void;
}

// Default filter presets
const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'my-tasks',
    name: 'My Tasks',
    filters: {
      assignedToUserId: ['me'], // Special value that gets replaced with actual user ID
      includeCompleted: false,
    },
    sort: {
      field: 'due_date',
      direction: 'asc',
    },
  },
  {
    id: 'overdue',
    name: 'Overdue',
    filters: {
      dueDateTo: 'today', // Special value that gets replaced with current date
      status: ['todo', 'in_progress'],
      includeCompleted: false,
    },
    sort: {
      field: 'due_date',
      direction: 'asc',
    },
  },
  {
    id: 'urgent',
    name: 'Urgent Tasks',
    filters: {
      priority: ['urgent'],
      status: ['todo', 'in_progress'],
      includeCompleted: false,
    },
    sort: {
      field: 'created_at',
      direction: 'desc',
    },
  },
  {
    id: 'completed',
    name: 'Recently Completed',
    filters: {
      status: ['completed'],
      includeCompleted: true,
    },
    sort: {
      field: 'updated_at',
      direction: 'desc',
    },
  },
  {
    id: 'unassigned',
    name: 'Unassigned',
    filters: {
      assignedToUserId: ['unassigned'],
      status: ['todo', 'in_progress'],
      includeCompleted: false,
    },
    sort: {
      field: 'priority',
      direction: 'desc',
    },
  },
];

/**
 * Hook for task filtering and sorting functionality
 * Provides comprehensive filter management with persistence and presets
 */
export const useTaskFilters = (
  options: UseTaskFiltersOptions = {}
): UseTaskFiltersReturn => {
  const {
    initialFilters = {},
    initialSort = { field: 'position', direction: 'asc' },
    persistFilters = true,
    storageKey = 'taskFilters',
  } = options;

  const [filters, setFilters] = useState<TaskFilters>(initialFilters);
  const [sort, setSort] = useState<TaskSort>(initialSort);
  const [presets, setPresets] = useState<FilterPreset[]>(DEFAULT_PRESETS);

  // Update individual filter
  const updateFilter = useCallback(<K extends keyof TaskFilters>(
    key: K, 
    value: TaskFilters[K]
  ): void => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback((): void => {
    setFilters({});
  }, []);

  // Toggle sort direction
  const toggleSortDirection = useCallback((): void => {
    setSort(prev => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Set sort field (and reset direction to default for the field)
  const setSortField = useCallback((field: TaskSort['field']): void => {
    const defaultDirection = field === 'title' ? 'asc' : 'desc';
    setSort({
      field,
      direction: defaultDirection,
    });
  }, []);

  // Quick filter functions
  const filterByStatus = useCallback((status: TaskStatus[]): void => {
    updateFilter('status', status);
  }, [updateFilter]);

  const filterByPriority = useCallback((priority: TaskPriority[]): void => {
    updateFilter('priority', priority);
  }, [updateFilter]);

  const filterByAssignee = useCallback((userId: string | null): void => {
    if (userId === null) {
      updateFilter('assignedToUserId', ['unassigned']);
    } else {
      updateFilter('assignedToUserId', [userId]);
    }
  }, [updateFilter]);

  const filterByTag = useCallback((tag: string): void => {
    const currentTags = filters.tags || [];
    const updatedTags = currentTags.includes(tag) 
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    updateFilter('tags', updatedTags.length > 0 ? updatedTags : undefined);
  }, [filters.tags, updateFilter]);

  const filterByDueDateRange = useCallback((from?: string, to?: string): void => {
    updateFilter('dueDateFrom', from);
    updateFilter('dueDateTo', to);
  }, [updateFilter]);

  // Search functions
  const setSearch = useCallback((search: string): void => {
    updateFilter('search', search.trim() || undefined);
  }, [updateFilter]);

  const clearSearch = useCallback((): void => {
    updateFilter('search', undefined);
  }, [updateFilter]);

  // Preset management
  const savePreset = useCallback((name: string): void => {
    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name,
      filters: { ...filters },
      sort: { ...sort },
    };

    setPresets(prev => [...prev, newPreset]);
  }, [filters, sort]);

  const loadPreset = useCallback((presetId: string): void => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
      if (preset.sort) {
        setSort(preset.sort);
      }
    }
  }, [presets]);

  const deletePreset = useCallback((presetId: string): void => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
  }, []);

  // Computed properties
  const hasActiveFilters = useMemo((): boolean => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof TaskFilters];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });
  }, [filters]);

  const hasActiveSearch = useMemo((): boolean => {
    return Boolean(filters.search && filters.search.trim().length > 0);
  }, [filters.search]);

  const activeFilterCount = useMemo((): number => {
    let count = 0;
    
    if (filters.status && filters.status.length > 0) count++;
    if (filters.priority && filters.priority.length > 0) count++;
    if (filters.assignedToUserId && filters.assignedToUserId.length > 0) count++;
    if (filters.dueDateFrom || filters.dueDateTo) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.search) count++;
    if (filters.includeCompleted) count++;
    if (filters.includeArchived) count++;
    
    return count;
  }, [filters]);

  const getFilterSummary = useCallback((): string => {
    const parts: string[] = [];
    
    if (filters.status && filters.status.length > 0) {
      parts.push(`Status: ${filters.status.join(', ')}`);
    }
    
    if (filters.priority && filters.priority.length > 0) {
      parts.push(`Priority: ${filters.priority.join(', ')}`);
    }
    
    if (filters.assignedToUserId && filters.assignedToUserId.length > 0) {
      parts.push(`Assigned: ${filters.assignedToUserId.join(', ')}`);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      parts.push(`Tags: ${filters.tags.join(', ')}`);
    }
    
    if (filters.search) {
      parts.push(`Search: "${filters.search}"`);
    }
    
    return parts.join(' | ');
  }, [filters]);

  // URL serialization
  const toQueryParams = useCallback((): URLSearchParams => {
    const params = new URLSearchParams();
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, item));
        } else {
          params.set(key, value.toString());
        }
      }
    });
    
    // Add sort parameters
    params.set('sort_by', sort.field);
    params.set('sort_order', sort.direction);
    
    return params;
  }, [filters, sort]);

  const fromQueryParams = useCallback((params: URLSearchParams): void => {
    const newFilters: TaskFilters = {};
    
    // Parse filter parameters
    const status = params.getAll('status') as TaskStatus[];
    if (status.length > 0) newFilters.status = status;
    
    const priority = params.getAll('priority') as TaskPriority[];
    if (priority.length > 0) newFilters.priority = priority;
    
    const assignedToUserId = params.getAll('assignedToUserId');
    if (assignedToUserId.length > 0) newFilters.assignedToUserId = assignedToUserId;
    
    const tags = params.getAll('tags');
    if (tags.length > 0) newFilters.tags = tags;
    
    const search = params.get('search');
    if (search) newFilters.search = search;
    
    const dueDateFrom = params.get('dueDateFrom');
    if (dueDateFrom) newFilters.dueDateFrom = dueDateFrom;
    
    const dueDateTo = params.get('dueDateTo');
    if (dueDateTo) newFilters.dueDateTo = dueDateTo;
    
    const includeCompleted = params.get('includeCompleted') === 'true';
    if (includeCompleted) newFilters.includeCompleted = includeCompleted;
    
    const includeArchived = params.get('includeArchived') === 'true';
    if (includeArchived) newFilters.includeArchived = includeArchived;
    
    setFilters(newFilters);
    
    // Parse sort parameters
    const sortBy = params.get('sort_by') as TaskSort['field'];
    const sortOrder = params.get('sort_order') as TaskSort['direction'];
    
    if (sortBy && sortOrder) {
      setSort({ field: sortBy, direction: sortOrder });
    }
  }, []);

  // Persistence functions
  const saveToStorage = useCallback((): void => {
    if (!persistFilters || typeof window === 'undefined') return;
    
    try {
      const data = {
        filters,
        sort,
        presets: presets.filter(p => p.id.startsWith('custom-')), // Only save custom presets
        timestamp: Date.now(),
      };
      
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save filters to storage:', error);
    }
  }, [persistFilters, storageKey, filters, sort, presets]);

  const loadFromStorage = useCallback((): void => {
    if (!persistFilters || typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        if (data.filters) setFilters(data.filters);
        if (data.sort) setSort(data.sort);
        if (data.presets) {
          setPresets(prev => [...DEFAULT_PRESETS, ...data.presets]);
        }
      }
    } catch (error) {
      console.error('Failed to load filters from storage:', error);
    }
  }, [persistFilters, storageKey]);

  const clearStorage = useCallback((): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear filters from storage:', error);
    }
  }, [storageKey]);

  return {
    // Current state
    filters,
    sort,
    
    // Filter actions
    setFilters,
    updateFilter,
    clearFilters,
    
    // Sort actions
    setSort,
    toggleSortDirection,
    setSortField,
    
    // Quick filters
    filterByStatus,
    filterByPriority,
    filterByAssignee,
    filterByTag,
    filterByDueDateRange,
    
    // Search
    setSearch,
    clearSearch,
    
    // Presets
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    
    // Utilities
    hasActiveFilters,
    hasActiveSearch,
    activeFilterCount,
    getFilterSummary,
    
    // URL serialization
    toQueryParams,
    fromQueryParams,
    
    // Persistence
    saveToStorage,
    loadFromStorage,
    clearStorage,
  };
};