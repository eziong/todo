// =============================================
// SEARCH FILTERS CONTAINER HOOK
// =============================================
// Container logic for advanced search filters with Material Design interface

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { 
  TaskStatus,
  TaskPriority,
} from '@/database/types';
import type { SearchFilters as BaseSearchFilters } from '@/hooks/useTaskSearch';

// =============================================
// TYPES
// =============================================

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
  color?: string;
  icon?: string;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface UseSearchFiltersReturn {
  // Filter state
  filters: BaseSearchFilters;
  activeFiltersCount: number;
  hasActiveFilters: boolean;
  
  // Individual filter values
  selectedWorkspace: string | null;
  selectedSections: string[];
  selectedStatuses: TaskStatus[];
  selectedPriorities: TaskPriority[];
  selectedAssignees: string[];
  selectedTags: string[];
  dueDateRange: DateRange;
  entityTypes: Array<'workspace' | 'section' | 'task'>;
  
  // Filter options
  statusOptions: FilterOption[];
  priorityOptions: FilterOption[];
  workspaceOptions: FilterOption[];
  sectionOptions: FilterOption[];
  assigneeOptions: FilterOption[];
  tagOptions: FilterOption[];
  
  // Filter actions
  setWorkspaceFilter: (workspaceId: string | null) => void;
  setSectionFilter: (sectionIds: string[]) => void;
  setStatusFilter: (statuses: TaskStatus[]) => void;
  setPriorityFilter: (priorities: TaskPriority[]) => void;
  setAssigneeFilter: (assigneeIds: string[]) => void;
  setTagFilter: (tags: string[]) => void;
  setDueDateRange: (range: DateRange) => void;
  setEntityTypes: (types: Array<'workspace' | 'section' | 'task'>) => void;
  
  // Quick actions
  clearAllFilters: () => void;
  clearFilter: (filterType: keyof BaseSearchFilters) => void;
  applyPreset: (presetName: string) => void;
  
  // Utility functions
  getFilterSummary: () => string;
  exportFilters: () => string;
  importFilters: (filtersString: string) => boolean;
  
  // UI state
  isExpanded: boolean;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}

export interface SearchFiltersProps {
  className?: string;
  onFiltersChange?: (filters: BaseSearchFilters) => void;
  initialFilters?: Partial<BaseSearchFilters>;
  compact?: boolean;
}

// =============================================
// CONSTANTS
// =============================================

const DEFAULT_FILTERS: BaseSearchFilters = {
  workspaceId: undefined,
  sectionIds: [],
  status: [],
  priority: [],
  assignedToUserId: [],
  tags: [],
  dueDateFrom: undefined,
  dueDateTo: undefined,
  entityTypes: ['workspace', 'section', 'task'],
};

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useSearchFilters = (
  initialFilters: Partial<BaseSearchFilters> = {},
  onFiltersChange?: (filters: BaseSearchFilters) => void
): UseSearchFiltersReturn => {
  // State management
  const [filters, setFilters] = useState<BaseSearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  // Filter options
  const statusOptions = useMemo<FilterOption[]>(() => [
    { id: 'todo', label: 'To Do', value: 'todo', icon: '⭕', color: '#6B7280' },
    { id: 'in_progress', label: 'In Progress', value: 'in_progress', icon: '🔄', color: '#3B82F6' },
    { id: 'completed', label: 'Completed', value: 'completed', icon: '✅', color: '#10B981' },
    { id: 'cancelled', label: 'Cancelled', value: 'cancelled', icon: '❌', color: '#EF4444' },
    { id: 'on_hold', label: 'On Hold', value: 'on_hold', icon: '⏸️', color: '#F59E0B' },
  ], []);

  const priorityOptions = useMemo<FilterOption[]>(() => [
    { id: 'urgent', label: 'Urgent', value: 'urgent', icon: '🔴', color: '#DC2626' },
    { id: 'high', label: 'High', value: 'high', icon: '🟠', color: '#EA580C' },
    { id: 'medium', label: 'Medium', value: 'medium', icon: '🟡', color: '#D97706' },
    { id: 'low', label: 'Low', value: 'low', icon: '🔵', color: '#2563EB' },
  ], []);

  // Mock options - In real implementation, these would come from API
  const workspaceOptions = useMemo<FilterOption[]>(() => [
    { id: 'workspace-1', label: 'Personal Projects', value: 'workspace-1', icon: '📋' },
    { id: 'workspace-2', label: 'Work Dashboard', value: 'workspace-2', icon: '💼' },
  ], []);

  const sectionOptions = useMemo<FilterOption[]>(() => [
    { id: 'section-1', label: 'Today', value: 'section-1', icon: '📅' },
    { id: 'section-2', label: 'This Week', value: 'section-2', icon: '📆' },
  ], []);

  const assigneeOptions = useMemo<FilterOption[]>(() => [
    { id: 'user-1', label: 'John Doe', value: 'user-1', icon: '👤' },
    { id: 'user-2', label: 'Jane Smith', value: 'user-2', icon: '👤' },
  ], []);

  const tagOptions = useMemo<FilterOption[]>(() => [
    { id: 'frontend', label: 'Frontend', value: 'frontend', color: '#3B82F6' },
    { id: 'backend', label: 'Backend', value: 'backend', color: '#10B981' },
    { id: 'design', label: 'Design', value: 'design', color: '#F59E0B' },
    { id: 'urgent', label: 'Urgent', value: 'urgent', color: '#EF4444' },
  ], []);

  // Computed values
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.workspaceId) count++;
    if (filters.sectionIds?.length) count++;
    if (filters.status?.length) count++;
    if (filters.priority?.length) count++;
    if (filters.assignedToUserId?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.dueDateFrom || filters.dueDateTo) count++;
    if (filters.entityTypes && filters.entityTypes.length < 3) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  // Individual filter accessors
  const selectedWorkspace = filters.workspaceId || null;
  const selectedSections = filters.sectionIds || [];
  const selectedStatuses = filters.status || [];
  const selectedPriorities = filters.priority || [];
  const selectedAssignees = filters.assignedToUserId || [];
  const selectedTags = filters.tags || [];
  const entityTypes = filters.entityTypes || ['workspace', 'section', 'task'];

  const dueDateRange: DateRange = {
    from: filters.dueDateFrom ? new Date(filters.dueDateFrom) : null,
    to: filters.dueDateTo ? new Date(filters.dueDateTo) : null,
  };

  // Filter actions
  const updateFilters = useCallback((updates: Partial<BaseSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const setWorkspaceFilter = useCallback((workspaceId: string | null) => {
    updateFilters({ 
      workspaceId: workspaceId || undefined,
      sectionIds: [], // Clear sections when workspace changes
    });
  }, [updateFilters]);

  const setSectionFilter = useCallback((sectionIds: string[]) => {
    updateFilters({ sectionIds });
  }, [updateFilters]);

  const setStatusFilter = useCallback((status: TaskStatus[]) => {
    updateFilters({ status });
  }, [updateFilters]);

  const setPriorityFilter = useCallback((priority: TaskPriority[]) => {
    updateFilters({ priority });
  }, [updateFilters]);

  const setAssigneeFilter = useCallback((assignedToUserId: string[]) => {
    updateFilters({ assignedToUserId });
  }, [updateFilters]);

  const setTagFilter = useCallback((tags: string[]) => {
    updateFilters({ tags });
  }, [updateFilters]);

  const setDueDateRange = useCallback((range: DateRange) => {
    updateFilters({
      dueDateFrom: range.from?.toISOString().split('T')[0],
      dueDateTo: range.to?.toISOString().split('T')[0],
    });
  }, [updateFilters]);

  const setEntityTypes = useCallback((entityTypes: Array<'workspace' | 'section' | 'task'>) => {
    updateFilters({ entityTypes });
  }, [updateFilters]);

  // Quick actions
  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const clearFilter = useCallback((filterType: keyof BaseSearchFilters) => {
    const updates: Partial<BaseSearchFilters> = {};
    
    switch (filterType) {
      case 'workspaceId':
        updates.workspaceId = undefined;
        updates.sectionIds = []; // Clear dependent filters
        break;
      case 'sectionIds':
        updates.sectionIds = [];
        break;
      case 'status':
        updates.status = [];
        break;
      case 'priority':
        updates.priority = [];
        break;
      case 'assignedToUserId':
        updates.assignedToUserId = [];
        break;
      case 'tags':
        updates.tags = [];
        break;
      case 'dueDateFrom':
        updates.dueDateFrom = undefined;
        break;
      case 'dueDateTo':
        updates.dueDateTo = undefined;
        break;
      case 'entityTypes':
        updates.entityTypes = ['workspace', 'section', 'task'];
        break;
    }
    
    updateFilters(updates);
  }, [updateFilters]);

  const applyPreset = useCallback((presetName: string) => {
    const presets: Record<string, Partial<BaseSearchFilters>> = {
      'my-tasks': {
        status: ['todo', 'in_progress'],
        assignedToUserId: ['current-user'], // Would be current user ID
      },
      'urgent': {
        priority: ['urgent', 'high'],
      },
      'this-week': {
        dueDateFrom: new Date().toISOString().split('T')[0],
        dueDateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      'completed': {
        status: ['completed'],
      },
    };

    const preset = presets[presetName];
    if (preset) {
      updateFilters(preset);
    }
  }, [updateFilters]);

  // Utility functions
  const getFilterSummary = useCallback((): string => {
    const summaryParts: string[] = [];

    if (filters.workspaceId) {
      const workspace = workspaceOptions.find(w => w.id === filters.workspaceId);
      summaryParts.push(`Workspace: ${workspace?.label || 'Unknown'}`);
    }

    if (filters.status?.length) {
      const statusLabels = filters.status.map(s => 
        statusOptions.find(opt => opt.value === s)?.label || s
      );
      summaryParts.push(`Status: ${statusLabels.join(', ')}`);
    }

    if (filters.priority?.length) {
      const priorityLabels = filters.priority.map(p => 
        priorityOptions.find(opt => opt.value === p)?.label || p
      );
      summaryParts.push(`Priority: ${priorityLabels.join(', ')}`);
    }

    if (filters.tags?.length) {
      summaryParts.push(`Tags: ${filters.tags.join(', ')}`);
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      const from = filters.dueDateFrom ? new Date(filters.dueDateFrom).toLocaleDateString() : 'Start';
      const to = filters.dueDateTo ? new Date(filters.dueDateTo).toLocaleDateString() : 'End';
      summaryParts.push(`Due: ${from} - ${to}`);
    }

    return summaryParts.join(' • ') || 'No filters applied';
  }, [filters, workspaceOptions, statusOptions, priorityOptions]);

  const exportFilters = useCallback((): string => {
    return JSON.stringify(filters);
  }, [filters]);

  const importFilters = useCallback((filtersString: string): boolean => {
    try {
      const importedFilters = JSON.parse(filtersString) as BaseSearchFilters;
      setFilters({ ...DEFAULT_FILTERS, ...importedFilters });
      return true;
    } catch {
      return false;
    }
  }, []);

  // UI state management
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const setExpanded = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
  }, []);

  return {
    // Filter state
    filters,
    activeFiltersCount,
    hasActiveFilters,
    
    // Individual filter values
    selectedWorkspace,
    selectedSections,
    selectedStatuses,
    selectedPriorities,
    selectedAssignees,
    selectedTags,
    dueDateRange,
    entityTypes,
    
    // Filter options
    statusOptions,
    priorityOptions,
    workspaceOptions,
    sectionOptions,
    assigneeOptions,
    tagOptions,
    
    // Filter actions
    setWorkspaceFilter,
    setSectionFilter,
    setStatusFilter,
    setPriorityFilter,
    setAssigneeFilter,
    setTagFilter,
    setDueDateRange,
    setEntityTypes,
    
    // Quick actions
    clearAllFilters,
    clearFilter,
    applyPreset,
    
    // Utility functions
    getFilterSummary,
    exportFilters,
    importFilters,
    
    // UI state
    isExpanded,
    toggleExpanded,
    setExpanded,
  };
};