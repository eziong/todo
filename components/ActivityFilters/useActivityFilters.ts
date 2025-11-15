// =============================================
// ACTIVITY FILTERS CONTAINER HOOK
// =============================================
// Container logic for advanced activity filtering

import { useState, useCallback, useMemo } from 'react';
import type { 
  EventType, 
  EventCategory, 
  EventSeverity, 
  EventSource, 
  EntityType,
  EventFilters 
} from '@/types/database';

export interface UseActivityFiltersProps {
  initialFilters?: Partial<EventFilters>;
  onFiltersChange?: (filters: EventFilters) => void;
  availableUsers?: Array<{ id: string; name: string; email: string }>;
  availableWorkspaces?: Array<{ id: string; name: string }>;
}

export interface FilterOption<T = string> {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface UseActivityFiltersReturn {
  // Current filter state
  filters: EventFilters;
  
  // Individual filter controls
  eventTypes: EventType[];
  setEventTypes: (types: EventType[]) => void;
  
  categories: EventCategory[];
  setCategories: (categories: EventCategory[]) => void;
  
  severities: EventSeverity[];
  setSeverities: (severities: EventSeverity[]) => void;
  
  sources: EventSource[];
  setSources: (sources: EventSource[]) => void;
  
  entityTypes: EntityType[];
  setEntityTypes: (types: EntityType[]) => void;
  
  userId: string | undefined;
  setUserId: (userId: string | undefined) => void;
  
  workspaceId: string | undefined;
  setWorkspaceId: (workspaceId: string | undefined) => void;
  
  dateRange: {
    from: string | null;
    to: string | null;
  };
  setDateRange: (range: { from: string | null; to: string | null }) => void;
  
  tags: string[];
  setTags: (tags: string[]) => void;
  
  correlationId: string;
  setCorrelationId: (id: string) => void;
  
  // Filter options
  eventTypeOptions: FilterOption<EventType>[];
  categoryOptions: FilterOption<EventCategory>[];
  severityOptions: FilterOption<EventSeverity>[];
  sourceOptions: FilterOption<EventSource>[];
  entityTypeOptions: FilterOption<EntityType>[];
  
  // Actions
  applyFilters: () => void;
  resetFilters: () => void;
  clearFilters: () => void;
  
  // Computed state
  hasActiveFilters: boolean;
  activeFilterCount: number;
  isValid: boolean;
  
  // Presets
  applyPreset: (preset: FilterPreset) => void;
  saveAsPreset: (name: string) => FilterPreset;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: EventFilters;
  createdAt: string;
}

const defaultFilters: EventFilters = {
  event_type: [],
  entity_type: [],
  category: [],
  severity: [],
  source: [],
  user_id: undefined,
  workspace_id: undefined,
  date_from: undefined,
  date_to: undefined,
  tags: [],
  correlation_id: undefined
};

export const useActivityFilters = ({
  initialFilters = {},
  onFiltersChange,
  availableUsers = [],
  availableWorkspaces = []
}: UseActivityFiltersProps): UseActivityFiltersReturn => {
  // Initialize filters
  const [filters, setFilters] = useState<EventFilters>({
    ...defaultFilters,
    ...initialFilters
  });

  // Individual filter state
  const eventTypes = filters.event_type || [];
  const categories = filters.category || [];
  const severities = filters.severity || [];
  const sources = filters.source || [];
  const entityTypes = filters.entity_type || [];
  const userId = filters.user_id;
  const workspaceId = filters.workspace_id;
  const tags = filters.tags || [];
  const correlationId = filters.correlation_id || '';
  
  const dateRange = {
    from: filters.date_from || null,
    to: filters.date_to || null
  };

  // Filter option definitions
  const eventTypeOptions: FilterOption<EventType>[] = [
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
    { value: 'completed', label: 'Completed' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'moved', label: 'Moved' },
    { value: 'status_changed', label: 'Status Changed' },
    { value: 'archived', label: 'Archived' },
    { value: 'restored', label: 'Restored' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'search_performed', label: 'Search Performed' },
    { value: 'viewed', label: 'Viewed' },
    { value: 'commented', label: 'Commented' },
    { value: 'member_added', label: 'Member Added' },
    { value: 'member_removed', label: 'Member Removed' },
    { value: 'role_changed', label: 'Role Changed' }
  ];

  const categoryOptions: FilterOption<EventCategory>[] = [
    { value: 'user_action', label: 'User Actions' },
    { value: 'system', label: 'System Events' },
    { value: 'security', label: 'Security' },
    { value: 'integration', label: 'Integrations' },
    { value: 'automation', label: 'Automation' },
    { value: 'error', label: 'Errors' }
  ];

  const severityOptions: FilterOption<EventSeverity>[] = [
    { value: 'debug', label: 'Debug' },
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Critical' }
  ];

  const sourceOptions: FilterOption<EventSource>[] = [
    { value: 'web', label: 'Web App' },
    { value: 'api', label: 'API' },
    { value: 'mobile', label: 'Mobile App' },
    { value: 'integration', label: 'Integration' },
    { value: 'system', label: 'System' },
    { value: 'automation', label: 'Automation' },
    { value: 'webhook', label: 'Webhook' }
  ];

  const entityTypeOptions: FilterOption<EntityType>[] = [
    { value: 'user', label: 'Users' },
    { value: 'workspace', label: 'Workspaces' },
    { value: 'workspace_member', label: 'Workspace Members' },
    { value: 'section', label: 'Sections' },
    { value: 'task', label: 'Tasks' },
    { value: 'comment', label: 'Comments' },
    { value: 'attachment', label: 'Attachments' }
  ];

  // Update filter functions
  const updateFilters = useCallback((updates: Partial<EventFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  const setEventTypes = useCallback((types: EventType[]) => {
    updateFilters({ event_type: types });
  }, [updateFilters]);

  const setCategories = useCallback((cats: EventCategory[]) => {
    updateFilters({ category: cats });
  }, [updateFilters]);

  const setSeverities = useCallback((sevs: EventSeverity[]) => {
    updateFilters({ severity: sevs });
  }, [updateFilters]);

  const setSources = useCallback((srcs: EventSource[]) => {
    updateFilters({ source: srcs });
  }, [updateFilters]);

  const setEntityTypes = useCallback((types: EntityType[]) => {
    updateFilters({ entity_type: types });
  }, [updateFilters]);

  const setUserId = useCallback((id: string | undefined) => {
    updateFilters({ user_id: id });
  }, [updateFilters]);

  const setWorkspaceId = useCallback((id: string | undefined) => {
    updateFilters({ workspace_id: id });
  }, [updateFilters]);

  const setDateRange = useCallback((range: { from: string | null; to: string | null }) => {
    updateFilters({ 
      date_from: range.from || undefined, 
      date_to: range.to || undefined 
    });
  }, [updateFilters]);

  const setTags = useCallback((newTags: string[]) => {
    updateFilters({ tags: newTags });
  }, [updateFilters]);

  const setCorrelationId = useCallback((id: string) => {
    updateFilters({ correlation_id: id || undefined });
  }, [updateFilters]);

  // Actions
  const applyFilters = useCallback(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  const resetFilters = useCallback(() => {
    const resetFilters = { ...defaultFilters, ...initialFilters };
    setFilters(resetFilters);
    onFiltersChange?.(resetFilters);
  }, [initialFilters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);
  }, [onFiltersChange]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      eventTypes.length > 0 ||
      categories.length > 0 ||
      severities.length > 0 ||
      sources.length > 0 ||
      entityTypes.length > 0 ||
      userId !== undefined ||
      workspaceId !== undefined ||
      dateRange.from !== null ||
      dateRange.to !== null ||
      tags.length > 0 ||
      correlationId.length > 0
    );
  }, [eventTypes, categories, severities, sources, entityTypes, userId, workspaceId, dateRange, tags, correlationId]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (eventTypes.length > 0) count++;
    if (categories.length > 0) count++;
    if (severities.length > 0) count++;
    if (sources.length > 0) count++;
    if (entityTypes.length > 0) count++;
    if (userId !== undefined) count++;
    if (workspaceId !== undefined) count++;
    if (dateRange.from || dateRange.to) count++;
    if (tags.length > 0) count++;
    if (correlationId) count++;
    return count;
  }, [eventTypes, categories, severities, sources, entityTypes, userId, workspaceId, dateRange, tags, correlationId]);

  const isValid = useMemo(() => {
    // Date range validation
    if (dateRange.from && dateRange.to) {
      return new Date(dateRange.from) <= new Date(dateRange.to);
    }
    return true;
  }, [dateRange]);

  // Preset management
  const commonPresets: FilterPreset[] = [
    {
      id: 'user_actions',
      name: 'User Actions',
      description: 'Show only user-initiated actions',
      filters: {
        ...defaultFilters,
        category: ['user_action'],
        severity: ['info', 'warning', 'error']
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'security_events',
      name: 'Security Events',
      description: 'Show security-related events',
      filters: {
        ...defaultFilters,
        category: ['security'],
        event_type: ['login', 'logout', 'login_failed', 'suspicious_activity'],
        severity: ['warning', 'error', 'critical']
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'errors_only',
      name: 'Errors & Critical',
      description: 'Show only errors and critical events',
      filters: {
        ...defaultFilters,
        severity: ['error', 'critical']
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'recent_activity',
      name: 'Recent Activity',
      description: 'Show activity from the last 24 hours',
      filters: {
        ...defaultFilters,
        date_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        category: ['user_action', 'system']
      },
      createdAt: new Date().toISOString()
    }
  ];

  const applyPreset = useCallback((preset: FilterPreset) => {
    setFilters(preset.filters);
    onFiltersChange?.(preset.filters);
  }, [onFiltersChange]);

  const saveAsPreset = useCallback((name: string): FilterPreset => {
    const preset: FilterPreset = {
      id: `custom_${Date.now()}`,
      name,
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };
    
    // In a real app, this would save to localStorage or server
    console.log('Saving preset:', preset);
    
    return preset;
  }, [filters]);

  return {
    filters,
    eventTypes,
    setEventTypes,
    categories,
    setCategories,
    severities,
    setSeverities,
    sources,
    setSources,
    entityTypes,
    setEntityTypes,
    userId,
    setUserId,
    workspaceId,
    setWorkspaceId,
    dateRange,
    setDateRange,
    tags,
    setTags,
    correlationId,
    setCorrelationId,
    eventTypeOptions,
    categoryOptions,
    severityOptions,
    sourceOptions,
    entityTypeOptions,
    applyFilters,
    resetFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    isValid,
    applyPreset,
    saveAsPreset
  };
};