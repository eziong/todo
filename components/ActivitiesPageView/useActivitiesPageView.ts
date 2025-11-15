// =============================================
// ACTIVITIES PAGE VIEW CONTAINER HOOK
// =============================================
// Container logic for Activities page with filtering, pagination, and export functionality

import { useState, useMemo, useCallback } from 'react';
import { useActivityFeed } from '@/hooks/useActivity';
import type { 
  ActivityFeedItem, 
  EventCategory, 
  EventType, 
  EntityType, 
  EventSeverity,
  User 
} from '@/types/database';

// =============================================
// TYPES
// =============================================

export interface ActivitiesPageViewProps {
  workspaceId?: string;
  userId?: string;
  users?: User[];
  className?: string;
  initialFilters?: ActivityFiltersState;
}

export type ActivityViewMode = 'list' | 'timeline' | 'grouped';
export type DateRangePreset = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom';
export type ActivitySortField = 'created_at' | 'event_type' | 'entity_type' | 'user_name' | 'severity';
export type ActivitySortDirection = 'asc' | 'desc';

export interface ActivityFiltersState {
  categories: EventCategory[];
  eventTypes: EventType[];
  entityTypes: EntityType[];
  severities: EventSeverity[];
  userIds: string[];
  dateRange: DateRangePreset;
  customDateRange: {
    start: string | null;
    end: string | null;
  };
  searchQuery: string;
}

interface ActivitiesPaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface ActivitiesPageViewState {
  activities: ActivityFeedItem[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  isExporting: boolean;
  isLoadingMore: boolean;
  viewMode: ActivityViewMode;
  sortField: ActivitySortField;
  sortDirection: ActivitySortDirection;
  filters: ActivityFiltersState;
  pagination: ActivitiesPaginationState;
  showFilters: boolean;
  autoRefresh: boolean;
}

interface ActivityStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byCategory: Record<EventCategory, number>;
  byEventType: Record<EventType, number>;
  bySeverity: Record<EventSeverity, number>;
}

interface GroupedActivities {
  today: ActivityFeedItem[];
  yesterday: ActivityFeedItem[];
  thisWeek: ActivityFeedItem[];
  thisMonth: ActivityFeedItem[];
  older: ActivityFeedItem[];
}

export interface UseActivitiesPageViewReturn {
  state: ActivitiesPageViewState;
  actions: {
    refreshActivities: () => Promise<void>;
    loadMoreActivities: () => Promise<void>;
    setViewMode: (mode: ActivityViewMode) => void;
    setSorting: (field: ActivitySortField, direction: ActivitySortDirection) => void;
    updateFilters: (filters: Partial<ActivityFiltersState>) => void;
    clearFilters: () => void;
    setShowFilters: (show: boolean) => void;
    setAutoRefresh: (enabled: boolean) => void;
    exportActivities: (format: 'csv' | 'json') => Promise<void>;
  };
  computed: {
    filteredActivities: ActivityFeedItem[];
    activityStats: ActivityStats;
    groupedActivities: GroupedActivities;
    isFiltered: boolean;
    isEmpty: boolean;
    canLoadMore: boolean;
  };
}

// =============================================
// HELPER FUNCTIONS
// =============================================

const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getTodayString = (): string => getDateString(new Date());

const getYesterdayString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
};

const getWeekStartString = (): string => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  return getDateString(startOfWeek);
};

const getMonthStartString = (): string => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return getDateString(startOfMonth);
};

const getQuarterStartString = (): string => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
  return getDateString(startOfQuarter);
};

const isActivityFromToday = (activity: ActivityFeedItem): boolean => {
  const activityDate = new Date(activity.created_at).toISOString().split('T')[0];
  return activityDate === getTodayString();
};

const isActivityFromYesterday = (activity: ActivityFeedItem): boolean => {
  const activityDate = new Date(activity.created_at).toISOString().split('T')[0];
  return activityDate === getYesterdayString();
};

const isActivityFromThisWeek = (activity: ActivityFeedItem): boolean => {
  const activityDate = new Date(activity.created_at).toISOString().split('T')[0];
  return activityDate >= getWeekStartString() && activityDate <= getTodayString();
};

const isActivityFromThisMonth = (activity: ActivityFeedItem): boolean => {
  const activityDate = new Date(activity.created_at).toISOString().split('T')[0];
  return activityDate >= getMonthStartString() && activityDate <= getTodayString();
};

const filterActivitiesByDateRange = (
  activities: ActivityFeedItem[], 
  dateRange: DateRangePreset, 
  customRange: { start: string | null; end: string | null }
): ActivityFeedItem[] => {
  if (dateRange === 'all') return activities;
  
  const now = getTodayString();
  let startDate: string;
  
  switch (dateRange) {
    case 'today':
      startDate = now;
      break;
    case 'week':
      startDate = getWeekStartString();
      break;
    case 'month':
      startDate = getMonthStartString();
      break;
    case 'quarter':
      startDate = getQuarterStartString();
      break;
    case 'custom':
      if (!customRange.start || !customRange.end) return activities;
      return activities.filter(activity => {
        const activityDate = new Date(activity.created_at).toISOString().split('T')[0];
        return activityDate >= customRange.start! && activityDate <= customRange.end!;
      });
    default:
      return activities;
  }
  
  return activities.filter(activity => {
    const activityDate = new Date(activity.created_at).toISOString().split('T')[0];
    return activityDate >= startDate;
  });
};

const sortActivities = (
  activities: ActivityFeedItem[], 
  field: ActivitySortField, 
  direction: ActivitySortDirection
): ActivityFeedItem[] => {
  return [...activities].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    
    switch (field) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'event_type':
        aValue = a.event_type;
        bValue = b.event_type;
        break;
      case 'entity_type':
        aValue = a.entity_type;
        bValue = b.entity_type;
        break;
      case 'user_name':
        aValue = a.user_name || '';
        bValue = b.user_name || '';
        break;
      case 'severity':
        const severityOrder = { critical: 5, error: 4, warning: 3, info: 2, debug: 1 };
        aValue = severityOrder[a.severity as keyof typeof severityOrder] || 0;
        bValue = severityOrder[b.severity as keyof typeof severityOrder] || 0;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

const exportToCSV = (activities: ActivityFeedItem[]): string => {
  const headers = ['Date', 'Time', 'Event Type', 'Entity Type', 'User', 'Description', 'Workspace', 'Severity'];
  const rows = activities.map(activity => [
    new Date(activity.created_at).toLocaleDateString(),
    new Date(activity.created_at).toLocaleTimeString(),
    activity.event_type,
    activity.entity_type,
    activity.user_name || '',
    activity.description,
    activity.workspace_name || '',
    activity.severity,
  ]);
  
  return [headers, ...rows].map(row => 
    row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
  ).join('\n');
};

const exportToJSON = (activities: ActivityFeedItem[]): string => {
  return JSON.stringify(activities, null, 2);
};

// =============================================
// DEFAULT VALUES
// =============================================

const DEFAULT_FILTERS: ActivityFiltersState = {
  categories: [],
  eventTypes: [],
  entityTypes: [],
  severities: [],
  userIds: [],
  dateRange: 'all',
  customDateRange: { start: null, end: null },
  searchQuery: '',
};

const DEFAULT_PAGINATION: ActivitiesPaginationState = {
  page: 1,
  limit: 50,
  total: 0,
  hasMore: true,
};

// =============================================
// MAIN HOOK
// =============================================

export const useActivitiesPageView = (props: ActivitiesPageViewProps): UseActivitiesPageViewReturn => {
  const { workspaceId, userId, users, initialFilters } = props;
  
  // State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ActivityViewMode>('list');
  const [sortField, setSortField] = useState<ActivitySortField>('created_at');
  const [sortDirection, setSortDirection] = useState<ActivitySortDirection>('desc');
  const [filters, setFilters] = useState<ActivityFiltersState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [pagination] = useState<ActivitiesPaginationState>(DEFAULT_PAGINATION);
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Activity hook
  const {
    activity: activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useActivityFeed({
    workspaceId,
    categories: filters.categories,
    limit: pagination.limit,
    autoRefresh,
  });
  
  // Apply local filters and sorting
  const filteredActivities = useMemo(() => {
    let filtered = activities;
    
    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(query) ||
        activity.event_type.toLowerCase().includes(query) ||
        activity.entity_type.toLowerCase().includes(query) ||
        (activity.user_name && activity.user_name.toLowerCase().includes(query)) ||
        (activity.workspace_name && activity.workspace_name.toLowerCase().includes(query))
      );
    }
    
    // Event type filter
    if (filters.eventTypes.length > 0) {
      filtered = filtered.filter(activity => filters.eventTypes.includes(activity.event_type));
    }
    
    // Entity type filter
    if (filters.entityTypes.length > 0) {
      filtered = filtered.filter(activity => filters.entityTypes.includes(activity.entity_type));
    }
    
    // Severity filter
    if (filters.severities.length > 0) {
      filtered = filtered.filter(activity => filters.severities.includes(activity.severity));
    }
    
    // User filter
    if (filters.userIds.length > 0) {
      filtered = filtered.filter(activity => {
        // This would need to be implemented based on how user IDs are stored in activity items
        // For now, we'll filter by user name
        return activity.user_name && filters.userIds.some(userId => {
          const user = users?.find(u => u.id === userId);
          return user && activity.user_name === user.name;
        });
      });
    }
    
    // Date range filter
    filtered = filterActivitiesByDateRange(filtered, filters.dateRange, filters.customDateRange);
    
    // Sort
    return sortActivities(filtered, sortField, sortDirection);
  }, [activities, filters, sortField, sortDirection, users]);
  
  // Group activities by time period
  const groupedActivities = useMemo((): GroupedActivities => {
    return {
      today: filteredActivities.filter(isActivityFromToday),
      yesterday: filteredActivities.filter(isActivityFromYesterday),
      thisWeek: filteredActivities.filter(activity => 
        isActivityFromThisWeek(activity) && !isActivityFromToday(activity) && !isActivityFromYesterday(activity)
      ),
      thisMonth: filteredActivities.filter(activity => 
        isActivityFromThisMonth(activity) && !isActivityFromThisWeek(activity)
      ),
      older: filteredActivities.filter(activity => !isActivityFromThisMonth(activity)),
    };
  }, [filteredActivities]);
  
  // Compute activity stats
  const activityStats = useMemo((): ActivityStats => {
    const byCategory: Record<EventCategory, number> = {
      system: 0,
      user_action: 0,
      security: 0,
      integration: 0,
      automation: 0,
      error: 0,
    };
    
    const byEventType: Record<EventType, number> = {} as Record<EventType, number>;
    const bySeverity: Record<EventSeverity, number> = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };
    
    activities.forEach(activity => {
      byCategory[activity.category] = (byCategory[activity.category] || 0) + 1;
      byEventType[activity.event_type] = (byEventType[activity.event_type] || 0) + 1;
      bySeverity[activity.severity] = (bySeverity[activity.severity] || 0) + 1;
    });
    
    return {
      total: activities.length,
      today: activities.filter(isActivityFromToday).length,
      thisWeek: activities.filter(isActivityFromThisWeek).length,
      thisMonth: activities.filter(isActivityFromThisMonth).length,
      byCategory,
      byEventType,
      bySeverity,
    };
  }, [activities]);
  
  // Actions
  const refreshActivities = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      console.error('Failed to refresh activities:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);
  
  const loadMoreActivities = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      await loadMore();
    } catch (err) {
      console.error('Failed to load more activities:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, loadMore]);
  
  const setSorting = useCallback((field: ActivitySortField, direction: ActivitySortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);
  
  const updateFilters = useCallback((newFilters: Partial<ActivityFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);
  
  const exportActivities = useCallback(async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      const dataToExport = filteredActivities;
      let content: string;
      let filename: string;
      let mimeType: string;
      
      if (format === 'csv') {
        content = exportToCSV(dataToExport);
        filename = `activities-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        content = exportToJSON(dataToExport);
        filename = `activities-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }
      
      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export activities:', err);
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, [filteredActivities]);
  
  // Computed properties
  const isFiltered = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== null);
    }
    return value !== '' && value !== 'all';
  });
  const isEmpty = filteredActivities.length === 0;
  const canLoadMore = hasMore && !isLoadingMore;
  
  // State object
  const state: ActivitiesPageViewState = {
    activities: filteredActivities,
    loading,
    error,
    isRefreshing,
    isExporting,
    isLoadingMore,
    viewMode,
    sortField,
    sortDirection,
    filters,
    pagination,
    showFilters,
    autoRefresh,
  };
  
  return {
    state,
    actions: {
      refreshActivities,
      loadMoreActivities,
      setViewMode,
      setSorting,
      updateFilters,
      clearFilters,
      setShowFilters,
      setAutoRefresh,
      exportActivities,
    },
    computed: {
      filteredActivities,
      activityStats,
      groupedActivities,
      isFiltered,
      isEmpty,
      canLoadMore,
    },
  };
};