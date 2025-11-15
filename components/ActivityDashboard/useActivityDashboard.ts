// =============================================
// ACTIVITY DASHBOARD CONTAINER HOOK
// =============================================
// Container logic for activity statistics and metrics dashboard

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  useWorkspaceActivityStats, 
  useUserActivitySummary, 
  useSecurityEvents 
} from '@/hooks/useActivity';
import type { 
  ActivityPeriodType, 
  EventCategory, 
  EventCategoryStats,
  UserActivitySummary 
} from '@/types/database';

export interface UseActivityDashboardProps {
  workspaceId?: string;
  userId?: string;
  periodType?: ActivityPeriodType;
  days?: number;
  autoRefresh?: boolean;
}

export interface ActivityMetrics {
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  averageEventsPerDay: number;
  mostActiveDay: string | null;
  topCategories: Array<{ category: EventCategory; count: number; percentage: number }>;
  topEventTypes: Array<{ eventType: string; count: number; percentage: number }>;
  userActivity: {
    activeUsers: number;
    totalLogins: number;
    averageSessionTime: number;
  };
  trends: {
    growthRate: number; // percentage change from previous period
    peakHours: Array<{ hour: number; count: number }>;
    categoryTrends: Array<{ category: EventCategory; trend: 'up' | 'down' | 'stable'; change: number }>;
  };
}

export interface SecuritySummary {
  totalEvents: number;
  criticalEvents: number;
  failedLogins: number;
  suspiciousActivity: number;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
}

export interface UseActivityDashboardReturn {
  // Data
  metrics: ActivityMetrics | null;
  securitySummary: SecuritySummary | null;
  rawStats: EventCategoryStats[];
  userSummary: UserActivitySummary[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Controls
  periodType: ActivityPeriodType;
  setPeriodType: (period: ActivityPeriodType) => void;
  days: number;
  setDays: (days: number) => void;
  selectedCategories: EventCategory[];
  setSelectedCategories: (categories: EventCategory[]) => void;
  
  // Actions
  refresh: () => void;
  
  // Computed
  isRealTime: boolean;
  lastUpdated: Date | null;
}

export const useActivityDashboard = ({
  workspaceId,
  userId,
  periodType: initialPeriodType = 'day',
  days: initialDays = 7,
  autoRefresh = true
}: UseActivityDashboardProps): UseActivityDashboardReturn => {
  // State
  const [periodType, setPeriodType] = useState<ActivityPeriodType>(initialPeriodType);
  const [days, setDays] = useState(initialDays);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([
    'user_action', 'system', 'security'
  ]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch workspace activity stats
  const {
    stats: rawStats,
    metrics: rawMetrics,
    computedStats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats
  } = useWorkspaceActivityStats({
    workspaceId: workspaceId!,
    periodType,
    days
  });

  // Fetch user activity summary
  const {
    summary: userSummary,
    totals: userTotals,
    loading: userLoading,
    error: userError,
    refresh: refreshUser
  } = useUserActivitySummary({
    userId,
    workspaceId,
    periodType,
    days
  });

  // Fetch security events
  const {
    events: securityEvents,
    criticalEvents,
    loading: securityLoading,
    error: securityError,
    refresh: refreshSecurity
  } = useSecurityEvents({
    workspaceId,
    days,
    autoRefresh
  });

  // Combined loading and error states
  const loading = statsLoading || userLoading || securityLoading;
  const error = statsError || userError || securityError;

  // Refresh all data
  const refresh = useCallback(() => {
    refreshStats();
    refreshUser();
    refreshSecurity();
    setLastUpdated(new Date());
  }, [refreshStats, refreshUser, refreshSecurity]);

  // Calculate comprehensive metrics
  const metrics = useMemo((): ActivityMetrics | null => {
    if (!rawStats.length || !computedStats) return null;

    const { totalEvents, categoryStats, eventTypeStats, averageEventsPerDay } = computedStats;

    // Calculate events for different periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const eventsToday = rawStats
      .filter(stat => new Date(stat.period_start) >= today)
      .reduce((sum, stat) => sum + stat.event_count, 0);

    const eventsThisWeek = rawStats
      .filter(stat => new Date(stat.period_start) >= thisWeek)
      .reduce((sum, stat) => sum + stat.event_count, 0);

    // Top categories with percentages
    const topCategories = Object.entries(categoryStats)
      .map(([category, count]) => ({
        category: category as EventCategory,
        count,
        percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top event types with percentages
    const topEventTypes = Object.entries(eventTypeStats)
      .map(([eventType, count]) => ({
        eventType,
        count,
        percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // User activity metrics from user summary
    const activeUsers = userSummary.length;
    const totalLogins = userTotals.logins;
    const averageSessionTime = userTotals.activeMinutes / Math.max(activeUsers, 1);

    // Growth rate calculation (simplified)
    const previousPeriodEvents = rawStats
      .filter(stat => {
        const statDate = new Date(stat.period_start);
        const periodStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);
        const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return statDate >= periodStart && statDate < currentPeriodStart;
      })
      .reduce((sum, stat) => sum + stat.event_count, 0);

    const growthRate = previousPeriodEvents > 0 
      ? ((totalEvents - previousPeriodEvents) / previousPeriodEvents) * 100 
      : 0;

    // Peak hours analysis
    const hourlyActivity = new Array(24).fill(0);
    rawStats.forEach(stat => {
      const hour = new Date(stat.period_start).getHours();
      hourlyActivity[hour] += stat.event_count;
    });

    const peakHours = hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Category trends (simplified)
    const categoryTrends = topCategories.map(({ category, count }) => ({
      category,
      trend: 'stable' as const, // Would need historical data for real trends
      change: 0 // Would calculate from previous period
    }));

    return {
      totalEvents,
      eventsToday,
      eventsThisWeek,
      averageEventsPerDay,
      mostActiveDay: null, // Would need more detailed analysis
      topCategories,
      topEventTypes,
      userActivity: {
        activeUsers,
        totalLogins,
        averageSessionTime
      },
      trends: {
        growthRate,
        peakHours,
        categoryTrends
      }
    };
  }, [rawStats, computedStats, userSummary, userTotals, days]);

  // Security summary
  const securitySummary = useMemo((): SecuritySummary | null => {
    if (!securityEvents) return null;

    const totalEvents = securityEvents.length;
    const criticalEventsCount = criticalEvents.length;
    
    const failedLogins = securityEvents.filter(event => 
      event.event_type === 'login_failed'
    ).length;

    const suspiciousActivity = securityEvents.filter(event => 
      event.event_type === 'suspicious_activity'
    ).length;

    const recentAlerts = criticalEvents
      .slice(0, 5)
      .map(event => ({
        id: event.id,
        type: event.event_type,
        severity: event.severity,
        message: `${event.event_type.replace('_', ' ')} detected`,
        timestamp: event.created_at
      }));

    return {
      totalEvents,
      criticalEvents: criticalEventsCount,
      failedLogins,
      suspiciousActivity,
      recentAlerts
    };
  }, [securityEvents, criticalEvents]);

  // Update last updated timestamp when data changes
  useEffect(() => {
    if (!loading && (metrics || securitySummary)) {
      setLastUpdated(new Date());
    }
  }, [loading, metrics, securitySummary]);

  return {
    metrics,
    securitySummary,
    rawStats,
    userSummary,
    loading,
    error,
    periodType,
    setPeriodType,
    days,
    setDays,
    selectedCategories,
    setSelectedCategories,
    refresh,
    isRealTime: autoRefresh,
    lastUpdated
  };
};