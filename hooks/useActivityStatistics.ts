// =============================================
// ACTIVITY STATISTICS HOOK
// =============================================
// Enhanced hook for activity statistics and real-time metrics

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/Auth/useAuth';
import type { 
  ActivityFeedItem, 
  EventCategory, 
  EventType,
  EntityType,
  ActivityPeriodType 
} from '@/types/database';

export interface ActivityMetrics {
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  activeUsers: number;
  averageEventsPerUser: number;
  peakActivityHour: number;
  mostActiveDay: string;
  topEventTypes: Array<{ type: EventType; count: number; percentage: number }>;
  topCategories: Array<{ category: EventCategory; count: number; percentage: number }>;
  topUsers: Array<{ userId: string; name: string; count: number }>;
  entityBreakdown: Array<{ entityType: EntityType; count: number; percentage: number }>;
  timeDistribution: Array<{ hour: number; count: number }>;
  dailyTrend: Array<{ date: string; count: number; change: number }>;
  categoryTrends: Array<{ category: EventCategory; trend: 'up' | 'down' | 'stable'; change: number }>;
  averageResponseTime: number;
  errorRate: number;
  successRate: number;
}

export interface PeriodComparison {
  current: ActivityMetrics;
  previous: ActivityMetrics;
  growthRates: Record<keyof ActivityMetrics, number>;
  significantChanges: Array<{
    metric: keyof ActivityMetrics;
    change: number;
    type: 'increase' | 'decrease';
    significance: 'low' | 'medium' | 'high';
  }>;
}

export interface RealTimeStats {
  liveEventCount: number;
  activeUserCount: number;
  eventsPerMinute: number;
  averageLatency: number;
  errorCount: number;
  lastUpdated: string;
}

export interface UseActivityStatisticsProps {
  workspaceId?: string;
  userId?: string;
  periodType?: ActivityPeriodType;
  period?: number; // Number of days/hours/etc
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
  enableComparison?: boolean;
}

export interface UseActivityStatisticsReturn {
  // Core metrics
  metrics: ActivityMetrics | null;
  realTimeStats: RealTimeStats | null;
  periodComparison: PeriodComparison | null;
  
  // State
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Controls
  periodType: ActivityPeriodType;
  setPeriodType: (type: ActivityPeriodType) => void;
  period: number;
  setPeriod: (period: number) => void;
  
  // Actions
  refresh: () => Promise<void>;
  startRealTime: () => void;
  stopRealTime: () => void;
  
  // Computed insights
  insights: Array<{
    type: 'trend' | 'anomaly' | 'milestone' | 'alert';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    actionable: boolean;
  }>;
  
  // Performance metrics
  isRealTimeActive: boolean;
  averageResponseTime: number;
  dataFreshness: number; // Seconds since last update
}

export const useActivityStatistics = ({
  workspaceId,
  userId,
  periodType = 'day',
  period = 7,
  autoRefresh = true,
  refreshInterval = 30000,
  enableRealTime = false,
  enableComparison = true
}: UseActivityStatisticsProps): UseActivityStatisticsReturn => {
  // State
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [currentPeriodType, setPeriodType] = useState(periodType);
  const [currentPeriod, setPeriod] = useState(period);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [responseTime, setResponseTime] = useState(0);

  const { user } = useAuth();

  // Mock data generator for statistics
  const generateMockMetrics = useCallback((): ActivityMetrics => {
    const baseCount = Math.floor(Math.random() * 1000) + 500;
    
    const eventTypes: EventType[] = ['created', 'updated', 'completed', 'assigned', 'moved'];
    const categories: EventCategory[] = ['user_action', 'system', 'security'];
    const entityTypes: EntityType[] = ['task', 'section', 'workspace', 'user'];

    const topEventTypes = eventTypes.map(type => ({
      type,
      count: Math.floor(Math.random() * baseCount * 0.3),
      percentage: 0
    }));

    // Calculate percentages
    const totalEventTypeCount = topEventTypes.reduce((sum, item) => sum + item.count, 0);
    topEventTypes.forEach(item => {
      item.percentage = totalEventTypeCount > 0 ? (item.count / totalEventTypeCount) * 100 : 0;
    });

    const topCategories = categories.map(category => ({
      category,
      count: Math.floor(Math.random() * baseCount * 0.4),
      percentage: 0
    }));

    const totalCategoryCount = topCategories.reduce((sum, item) => sum + item.count, 0);
    topCategories.forEach(item => {
      item.percentage = totalCategoryCount > 0 ? (item.count / totalCategoryCount) * 100 : 0;
    });

    return {
      totalEvents: baseCount,
      eventsToday: Math.floor(baseCount * 0.1),
      eventsThisWeek: Math.floor(baseCount * 0.7),
      eventsThisMonth: baseCount,
      activeUsers: Math.floor(Math.random() * 50) + 10,
      averageEventsPerUser: baseCount / (Math.floor(Math.random() * 50) + 10),
      peakActivityHour: Math.floor(Math.random() * 24),
      mostActiveDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)],
      topEventTypes: topEventTypes.sort((a, b) => b.count - a.count),
      topCategories: topCategories.sort((a, b) => b.count - a.count),
      topUsers: [
        { userId: '1', name: 'John Doe', count: Math.floor(Math.random() * 100) + 20 },
        { userId: '2', name: 'Jane Smith', count: Math.floor(Math.random() * 100) + 15 },
        { userId: '3', name: 'Mike Johnson', count: Math.floor(Math.random() * 100) + 10 }
      ],
      entityBreakdown: entityTypes.map(entityType => ({
        entityType,
        count: Math.floor(Math.random() * baseCount * 0.3),
        percentage: Math.random() * 100
      })),
      timeDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: Math.floor(Math.random() * 50)
      })),
      dailyTrend: Array.from({ length: currentPeriod }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 100) + 20,
          change: (Math.random() - 0.5) * 40 // -20% to +20% change
        };
      }).reverse(),
      categoryTrends: categories.map(category => ({
        category,
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        change: (Math.random() - 0.5) * 50
      })),
      averageResponseTime: Math.random() * 500 + 100,
      errorRate: Math.random() * 5,
      successRate: 95 + Math.random() * 4
    };
  }, [currentPeriod]);

  // Mock real-time stats generator
  const generateMockRealTimeStats = useCallback((): RealTimeStats => ({
    liveEventCount: Math.floor(Math.random() * 10),
    activeUserCount: Math.floor(Math.random() * 20) + 5,
    eventsPerMinute: Math.random() * 5,
    averageLatency: Math.random() * 200 + 50,
    errorCount: Math.floor(Math.random() * 3),
    lastUpdated: new Date().toISOString()
  }), []);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    const startTime = Date.now();
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

      const currentMetrics = generateMockMetrics();
      setMetrics(currentMetrics);

      // Generate comparison if enabled
      if (enableComparison) {
        const previousMetrics = generateMockMetrics();
        
        const growthRates: Record<string, number> = {};
        const significantChanges: any[] = [];

        // Calculate growth rates for numeric metrics
        Object.keys(currentMetrics).forEach(key => {
          const current = (currentMetrics as any)[key];
          const previous = (previousMetrics as any)[key];
          
          if (typeof current === 'number' && typeof previous === 'number' && previous > 0) {
            const growthRate = ((current - previous) / previous) * 100;
            growthRates[key] = growthRate;
            
            // Identify significant changes (>20% change)
            if (Math.abs(growthRate) > 20) {
              significantChanges.push({
                metric: key,
                change: growthRate,
                type: growthRate > 0 ? 'increase' : 'decrease',
                significance: Math.abs(growthRate) > 50 ? 'high' : 'medium'
              });
            }
          }
        });

        setPeriodComparison({
          current: currentMetrics,
          previous: previousMetrics,
          growthRates: growthRates as Record<keyof ActivityMetrics, number>,
          significantChanges
        });
      }

      setLastUpdated(new Date().toISOString());
      setResponseTime(Date.now() - startTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [generateMockMetrics, enableComparison]);

  // Real-time updates
  useEffect(() => {
    let realTimeInterval: NodeJS.Timeout;

    if (enableRealTime && isRealTimeActive) {
      realTimeInterval = setInterval(() => {
        setRealTimeStats(generateMockRealTimeStats());
      }, 5000); // Update every 5 seconds
    }

    return () => {
      if (realTimeInterval) {
        clearInterval(realTimeInterval);
      }
    };
  }, [enableRealTime, isRealTimeActive, generateMockRealTimeStats]);

  // Auto refresh
  useEffect(() => {
    let refreshIntervalId: NodeJS.Timeout;

    if (autoRefresh) {
      refreshIntervalId = setInterval(fetchStatistics, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
    };
  }, [autoRefresh, fetchStatistics]);

  // Initial load
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics, currentPeriodType, currentPeriod, workspaceId, userId]);

  // Real-time controls
  const startRealTime = useCallback(() => {
    setIsRealTimeActive(true);
    setRealTimeStats(generateMockRealTimeStats());
  }, [generateMockRealTimeStats]);

  const stopRealTime = useCallback(() => {
    setIsRealTimeActive(false);
    setRealTimeStats(null);
  }, []);

  const refresh = useCallback(async () => {
    await fetchStatistics();
  }, [fetchStatistics]);

  // Generate insights from metrics
  const insights = useMemo(() => {
    if (!metrics && !periodComparison) return [];

    const insights: Array<{
      type: 'trend' | 'anomaly' | 'milestone' | 'alert';
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      actionable: boolean;
    }> = [];

    // Growth trend insights
    if (periodComparison?.significantChanges) {
      periodComparison.significantChanges.forEach(change => {
        insights.push({
          type: 'trend',
          title: `${change.type === 'increase' ? 'Increase' : 'Decrease'} in ${change.metric}`,
          description: `${Math.abs(change.change).toFixed(1)}% ${change.type} compared to previous period`,
          severity: change.significance as 'low' | 'medium' | 'high',
          actionable: change.significance !== 'low'
        });
      });
    }

    // Performance insights
    if (metrics) {
      if (metrics.errorRate > 5) {
        insights.push({
          type: 'alert',
          title: 'High Error Rate',
          description: `Error rate is ${metrics.errorRate.toFixed(1)}%, above normal threshold`,
          severity: 'high',
          actionable: true
        });
      }

      if (metrics.averageResponseTime > 1000) {
        insights.push({
          type: 'alert',
          title: 'Slow Response Time',
          description: `Average response time is ${metrics.averageResponseTime.toFixed(0)}ms`,
          severity: 'medium',
          actionable: true
        });
      }

      // Milestone insights
      if (metrics.totalEvents > 1000) {
        insights.push({
          type: 'milestone',
          title: 'Activity Milestone',
          description: `Reached ${metrics.totalEvents} total events`,
          severity: 'low',
          actionable: false
        });
      }

      // Anomaly detection
      const avgHourlyActivity = metrics.timeDistribution.reduce((sum, hour) => sum + hour.count, 0) / 24;
      const peakActivity = Math.max(...metrics.timeDistribution.map(hour => hour.count));
      
      if (peakActivity > avgHourlyActivity * 3) {
        insights.push({
          type: 'anomaly',
          title: 'Activity Spike Detected',
          description: `Peak activity at ${metrics.peakActivityHour}:00 is ${(peakActivity / avgHourlyActivity).toFixed(1)}x average`,
          severity: 'medium',
          actionable: true
        });
      }
    }

    return insights.slice(0, 5); // Limit to top 5 insights
  }, [metrics, periodComparison]);

  // Calculate data freshness
  const dataFreshness = useMemo(() => {
    if (!lastUpdated) return Infinity;
    return Math.floor((new Date().getTime() - new Date(lastUpdated).getTime()) / 1000);
  }, [lastUpdated]);

  return {
    metrics,
    realTimeStats,
    periodComparison,
    loading,
    error,
    lastUpdated,
    periodType: currentPeriodType,
    setPeriodType,
    period: currentPeriod,
    setPeriod,
    refresh,
    startRealTime,
    stopRealTime,
    insights,
    isRealTimeActive,
    averageResponseTime: responseTime,
    dataFreshness
  };
};