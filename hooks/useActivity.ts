// =============================================
// ACTIVITY HOOKS
// =============================================
// React hooks for activity tracking and event logging

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/Auth/useAuth';
import { activityQueries } from '@/lib/events/activityQueries';
import { eventLogger } from '@/lib/events/eventLogger';
import type {
  ActivityFeedItem,
  EntityActivityTimelineItem,
  EventFilters,
  ActivityFilters,
  UserActivitySummary,
  EventCategoryStats,
  EventCategory,
  EntityType,
  ActivityPeriodType
} from '@/types/database';

// =============================================
// RECENT ACTIVITY HOOK
// =============================================

export function useRecentActivity({
  workspaceId,
  userId,
  categories = ['user_action', 'system'],
  limit = 50,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: {
  workspaceId?: string;
  userId?: string;
  categories?: EventCategory[];
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}) {
  const [activity, setActivity] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchActivity = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      }

      const currentOffset = reset ? 0 : offset;
      const newActivity = await activityQueries.getRecentActivity({
        workspaceId,
        userId,
        categories,
        limit,
        offset: currentOffset
      });

      if (reset) {
        setActivity(newActivity);
      } else {
        setActivity(prev => [...prev, ...newActivity]);
      }

      setHasMore(newActivity.length === limit);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId, categories, limit, offset]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setOffset(prev => prev + limit);
    }
  }, [loading, hasMore, limit]);

  const refresh = useCallback(() => {
    fetchActivity(true);
  }, [fetchActivity]);

  // Initial load
  useEffect(() => {
    fetchActivity(true);
  }, [workspaceId, userId, categories, limit]);

  // Load more when offset changes
  useEffect(() => {
    if (offset > 0) {
      fetchActivity(false);
    }
  }, [offset, fetchActivity]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      // Only refresh the first page to avoid disrupting pagination
      fetchActivity(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchActivity]);

  return {
    activity,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}

// =============================================
// ENTITY ACTIVITY TIMELINE HOOK
// =============================================

export function useEntityActivityTimeline({
  entityType,
  entityId,
  limit = 100,
  autoRefresh = false
}: {
  entityType: EntityType;
  entityId: string;
  limit?: number;
  autoRefresh?: boolean;
}) {
  const [timeline, setTimeline] = useState<EntityActivityTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const data = await activityQueries.getEntityActivityTimeline({
        entityType,
        entityId,
        limit
      });
      setTimeline(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timeline');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, limit]);

  const refresh = useCallback(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Auto refresh for real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchTimeline, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTimeline]);

  return {
    timeline,
    loading,
    error,
    refresh
  };
}

// =============================================
// TASK ACTIVITY HOOK
// =============================================

export function useTaskActivity(taskId: string) {
  const [summary, setSummary] = useState({
    total_events: 0,
    status_changes: 0,
    assignments: 0,
    last_activity: null as string | null,
    contributors: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    timeline,
    loading: timelineLoading,
    error: timelineError,
    refresh: refreshTimeline
  } = useEntityActivityTimeline({
    entityType: 'task',
    entityId: taskId,
    limit: 50,
    autoRefresh: true
  });

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await activityQueries.getTaskActivitySummary(taskId);
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch task activity summary');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const refresh = useCallback(() => {
    fetchSummary();
    refreshTimeline();
  }, [fetchSummary, refreshTimeline]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    timeline,
    loading: loading || timelineLoading,
    error: error || timelineError,
    refresh
  };
}

// =============================================
// WORKSPACE ACTIVITY STATS HOOK
// =============================================

export function useWorkspaceActivityStats({
  workspaceId,
  periodType = 'day',
  days = 7
}: {
  workspaceId: string;
  periodType?: ActivityPeriodType;
  days?: number;
}) {
  const [stats, setStats] = useState<EventCategoryStats[]>([]);
  const [metrics, setMetrics] = useState({
    total_events: 0,
    daily_average: 0,
    most_active_day: null as string | null,
    category_breakdown: {} as Record<string, number>,
    entity_breakdown: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const [statsData, metricsData] = await Promise.all([
        activityQueries.getWorkspaceActivityStats({
          workspaceId,
          periodType,
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString()
        }),
        activityQueries.getActivityMetrics({
          workspaceId,
          days
        })
      ]);

      setStats(statsData);
      setMetrics(metricsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspace activity stats');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, periodType, days]);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Memoized computed values
  const computedStats = useMemo(() => {
    const totalEvents = stats.reduce((sum, stat) => sum + stat.event_count, 0);
    const uniqueUsers = Math.max(...stats.map(stat => stat.unique_users), 0);
    
    const categoryStats = stats.reduce((acc, stat) => {
      acc[stat.category] = (acc[stat.category] || 0) + stat.event_count;
      return acc;
    }, {} as Record<string, number>);

    const eventTypeStats = stats.reduce((acc, stat) => {
      acc[stat.event_type] = (acc[stat.event_type] || 0) + stat.event_count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents,
      uniqueUsers,
      categoryStats,
      eventTypeStats,
      averageEventsPerDay: totalEvents / days
    };
  }, [stats, days]);

  return {
    stats,
    metrics,
    computedStats,
    loading,
    error,
    refresh
  };
}

// =============================================
// USER ACTIVITY SUMMARY HOOK
// =============================================

export function useUserActivitySummary({
  userId,
  workspaceId,
  periodType = 'day',
  days = 30
}: {
  userId?: string;
  workspaceId?: string;
  periodType?: ActivityPeriodType;
  days?: number;
}) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [summary, setSummary] = useState<UserActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const data = await activityQueries.getUserActivitySummary({
        userId: targetUserId,
        workspace_id: workspaceId,
        period_type: periodType,
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString()
      });

      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user activity summary');
    } finally {
      setLoading(false);
    }
  }, [targetUserId, workspaceId, periodType, days]);

  const refresh = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Computed totals
  const totals = useMemo(() => {
    return summary.reduce((acc, period) => ({
      totalEvents: acc.totalEvents + period.total_events,
      tasksCreated: acc.tasksCreated + period.tasks_created,
      tasksCompleted: acc.tasksCompleted + period.tasks_completed,
      tasksUpdated: acc.tasksUpdated + period.tasks_updated,
      sectionsCreated: acc.sectionsCreated + period.sections_created,
      searchesPerformed: acc.searchesPerformed + period.searches_performed,
      activeMinutes: acc.activeMinutes + period.active_minutes,
      logins: acc.logins + period.logins
    }), {
      totalEvents: 0,
      tasksCreated: 0,
      tasksCompleted: 0,
      tasksUpdated: 0,
      sectionsCreated: 0,
      searchesPerformed: 0,
      activeMinutes: 0,
      logins: 0
    });
  }, [summary]);

  return {
    summary,
    totals,
    loading,
    error,
    refresh
  };
}

// =============================================
// EVENT LOGGING HOOKS
// =============================================

export function useEventLogger() {
  const { user } = useAuth();
  
  const logTaskEvent = useCallback(async ({
    workspaceId,
    taskId,
    eventType,
    oldTaskData,
    newTaskData,
    correlationId
  }: {
    workspaceId: string;
    taskId: string;
    eventType: 'created' | 'updated' | 'deleted';
    oldTaskData?: Record<string, unknown>;
    newTaskData?: Record<string, unknown>;
    correlationId?: string;
  }) => {
    if (!user?.id) return null;

    switch (eventType) {
      case 'created':
        return eventLogger.logTaskCreated({
          workspaceId,
          taskId,
          taskData: newTaskData!,
          sectionId: newTaskData!.section_id as string,
          correlationId
        });
      
      case 'updated':
        return eventLogger.logTaskUpdated({
          workspaceId,
          taskId,
          oldTaskData: oldTaskData!,
          newTaskData: newTaskData!,
          correlationId
        });
      
      case 'deleted':
        return eventLogger.logTaskDeleted({
          workspaceId,
          taskId,
          taskData: oldTaskData!,
          correlationId
        });
    }
  }, [user?.id]);

  const logSearchEvent = useCallback(async ({
    workspaceId,
    searchQuery,
    searchType = 'general',
    filters = {},
    resultsCount = 0,
    executionTimeMs
  }: {
    workspaceId?: string;
    searchQuery: string;
    searchType?: string;
    filters?: Record<string, unknown>;
    resultsCount?: number;
    executionTimeMs?: number;
  }) => {
    if (!user?.id) return null;

    return eventLogger.logSearchEvent({
      workspaceId,
      searchQuery,
      searchType,
      filters,
      resultsCount,
      executionTimeMs
    });
  }, [user?.id]);

  const logEntityView = useCallback(async ({
    workspaceId,
    entityType,
    entityId,
    context = {}
  }: {
    workspaceId?: string;
    entityType: EntityType;
    entityId: string;
    context?: Record<string, unknown>;
  }) => {
    if (!user?.id) return null;

    return eventLogger.logEntityViewed({
      workspaceId,
      entityType,
      entityId,
      context
    });
  }, [user?.id]);

  return {
    logTaskEvent,
    logSearchEvent,
    logEntityView,
    generateCorrelationId: eventLogger.generateCorrelationId.bind(eventLogger)
  };
}

// =============================================
// ACTIVITY FEED HOOK
// =============================================

export function useActivityFeed({
  workspaceId,
  categories = ['user_action'],
  limit = 20,
  autoRefresh = true
}: {
  workspaceId?: string;
  categories?: EventCategory[];
  limit?: number;
  autoRefresh?: boolean;
} = {}) {
  const { user } = useAuth();
  
  const {
    activity,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  } = useRecentActivity({
    workspaceId,
    categories,
    limit,
    autoRefresh,
    refreshInterval: 15000 // 15 seconds for activity feed
  });

  // Filter out user's own events for a cleaner feed
  const filteredActivity = useMemo(() => {
    return activity.filter(item => {
      // Show all workspace-wide important events
      if (['workspace', 'section'].includes(item.entity_type)) {
        return true;
      }
      
      // For task events, show if it's not the current user or if it's important
      if (item.entity_type === 'task') {
        return item.user_name !== user?.name || 
               ['completed', 'assigned', 'status_changed'].includes(item.event_type);
      }
      
      return true;
    });
  }, [activity, user?.name]);

  return {
    activity: filteredActivity,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}

// =============================================
// SECURITY EVENTS HOOK
// =============================================

export function useSecurityEvents({
  workspaceId,
  days = 30,
  autoRefresh = false
}: {
  workspaceId?: string;
  days?: number;
  autoRefresh?: boolean;
} = {}) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await activityQueries.getSecurityEvents({
        workspaceId,
        days
      });
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security events');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, days]);

  const refresh = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto refresh for security monitoring
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchEvents, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [autoRefresh, fetchEvents]);

  const criticalEvents = useMemo(() => {
    return events.filter(event => 
      event.severity === 'critical' || event.event_type === 'suspicious_activity'
    );
  }, [events]);

  return {
    events,
    criticalEvents,
    loading,
    error,
    refresh
  };
}