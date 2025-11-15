// =============================================
// ACTIVITY QUERIES LIBRARY
// =============================================
// Functions for querying activity data and generating activity feeds

import { createClient } from '@/lib/supabase/client';
import type { 
  ActivityFeedItem,
  EntityActivityTimelineItem,
  EventFilters,
  ActivityFilters,
  ActivitySummaryFilters,
  UserActivitySummary,
  EventCategoryStats,
  EventCategory,
  EntityType,
  ActivityPeriodType
} from '@/types/database';

// =============================================
// ACTIVITY QUERIES CLASS
// =============================================

export class ActivityQueries {
  private supabase = createClient();

  // =============================================
  // RECENT ACTIVITY QUERIES
  // =============================================

  async getRecentActivity({
    workspaceId,
    userId,
    categories = ['user_action', 'system'],
    limit = 50,
    offset = 0
  }: {
    workspaceId?: string;
    userId?: string;
    categories?: EventCategory[];
    limit?: number;
    offset?: number;
  } = {}): Promise<ActivityFeedItem[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_recent_activity', {
        p_workspace_id: workspaceId || null,
        p_user_id: userId || null,
        p_categories: categories,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('Failed to fetch recent activity:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  async getWorkspaceActivity({
    workspaceId,
    categories,
    limit = 50,
    offset = 0
  }: {
    workspaceId: string;
    categories?: EventCategory[];
    limit?: number;
    offset?: number;
  }): Promise<ActivityFeedItem[]> {
    return this.getRecentActivity({
      workspaceId,
      categories,
      limit,
      offset
    });
  }

  async getUserActivity({
    userId,
    workspaceId,
    categories,
    limit = 50,
    offset = 0
  }: {
    userId: string;
    workspaceId?: string;
    categories?: EventCategory[];
    limit?: number;
    offset?: number;
  }): Promise<ActivityFeedItem[]> {
    return this.getRecentActivity({
      workspaceId,
      userId,
      categories,
      limit,
      offset
    });
  }

  // =============================================
  // ENTITY ACTIVITY TIMELINE
  // =============================================

  async getEntityActivityTimeline({
    entityType,
    entityId,
    limit = 100
  }: {
    entityType: EntityType;
    entityId: string;
    limit?: number;
  }): Promise<EntityActivityTimelineItem[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_entity_activity_timeline', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_limit: limit
      });

      if (error) {
        console.error('Failed to fetch entity activity timeline:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching entity activity timeline:', error);
      return [];
    }
  }

  async getTaskActivityTimeline(taskId: string, limit = 50): Promise<EntityActivityTimelineItem[]> {
    return this.getEntityActivityTimeline({
      entityType: 'task',
      entityId: taskId,
      limit
    });
  }

  async getWorkspaceActivityTimeline(workspaceId: string, limit = 100): Promise<EntityActivityTimelineItem[]> {
    return this.getEntityActivityTimeline({
      entityType: 'workspace',
      entityId: workspaceId,
      limit
    });
  }

  // =============================================
  // EVENT QUERIES WITH FILTERS
  // =============================================

  async getEvents(filters: EventFilters = {}): Promise<any[]> {
    try {
      let query = this.supabase
        .from('events')
        .select(`
          *,
          users:user_id (name, email),
          workspaces:workspace_id (name)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.workspace_id) {
        query = query.eq('workspace_id', filters.workspace_id);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.entity_type && filters.entity_type.length > 0) {
        query = query.in('entity_type', filters.entity_type);
      }

      if (filters.entity_id) {
        query = query.eq('entity_id', filters.entity_id);
      }

      if (filters.event_type && filters.event_type.length > 0) {
        query = query.in('event_type', filters.event_type);
      }

      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }

      if (filters.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity);
      }

      if (filters.source && filters.source.length > 0) {
        query = query.in('source', filters.source);
      }

      if (filters.correlation_id) {
        query = query.eq('correlation_id', filters.correlation_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error } = await query.limit(1000);

      if (error) {
        console.error('Failed to fetch events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  // =============================================
  // ACTIVITY SUMMARIES AND ANALYTICS
  // =============================================

  async getUserActivitySummary({
    userId,
    workspaceId,
    periodType = 'day',
    periodStart,
    periodEnd
  }: ActivitySummaryFilters & { userId: string }): Promise<UserActivitySummary[]> {
    try {
      let query = this.supabase
        .from('user_activity_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('period_start', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      if (periodType) {
        query = query.eq('period_type', periodType);
      }

      if (periodStart) {
        query = query.gte('period_start', periodStart);
      }

      if (periodEnd) {
        query = query.lte('period_end', periodEnd);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Failed to fetch user activity summary:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user activity summary:', error);
      return [];
    }
  }

  async getWorkspaceActivityStats({
    workspaceId,
    periodType = 'day',
    periodStart,
    periodEnd
  }: {
    workspaceId: string;
    periodType?: ActivityPeriodType;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<EventCategoryStats[]> {
    try {
      let query = this.supabase
        .from('event_category_stats')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_deleted', false)
        .order('period_start', { ascending: false });

      if (periodType) {
        query = query.eq('period_type', periodType);
      }

      if (periodStart) {
        query = query.gte('period_start', periodStart);
      }

      if (periodEnd) {
        query = query.lte('period_end', periodEnd);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Failed to fetch workspace activity stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching workspace activity stats:', error);
      return [];
    }
  }

  // =============================================
  // SPECIALIZED ACTIVITY QUERIES
  // =============================================

  async getTaskActivitySummary(taskId: string): Promise<{
    total_events: number;
    status_changes: number;
    assignments: number;
    last_activity: string | null;
    contributors: string[];
  }> {
    try {
      const { data: events, error } = await this.supabase
        .from('events')
        .select('event_type, user_id, created_at')
        .eq('entity_type', 'task')
        .eq('entity_id', taskId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch task activity summary:', error);
        return {
          total_events: 0,
          status_changes: 0,
          assignments: 0,
          last_activity: null,
          contributors: []
        };
      }

      const statusChanges = events?.filter(e => 
        ['status_changed', 'completed', 'reopened'].includes(e.event_type)
      ).length || 0;

      const assignments = events?.filter(e => 
        ['assigned', 'unassigned', 'reassigned'].includes(e.event_type)
      ).length || 0;

      const contributors = [...new Set(
        events?.map(e => e.user_id).filter(Boolean) || []
      )];

      return {
        total_events: events?.length || 0,
        status_changes: statusChanges,
        assignments: assignments,
        last_activity: events?.[0]?.created_at || null,
        contributors
      };
    } catch (error) {
      console.error('Error fetching task activity summary:', error);
      return {
        total_events: 0,
        status_changes: 0,
        assignments: 0,
        last_activity: null,
        contributors: []
      };
    }
  }

  async getWorkspaceTrendingActivity({
    workspaceId,
    days = 7,
    limit = 20
  }: {
    workspaceId: string;
    days?: number;
    limit?: number;
  }): Promise<{
    trending_tasks: any[];
    active_users: any[];
    popular_sections: any[];
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get trending tasks (most activity)
      const { data: trendingTasks, error: tasksError } = await this.supabase
        .from('events')
        .select('entity_id, count(*)')
        .eq('workspace_id', workspaceId)
        .eq('entity_type', 'task')
        .gte('created_at', startDate)
        .eq('is_deleted', false)
        .group('entity_id')
        .order('count', { ascending: false })
        .limit(limit);

      // Get active users
      const { data: activeUsers, error: usersError } = await this.supabase
        .from('events')
        .select('user_id, count(*)')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate)
        .eq('is_deleted', false)
        .not('user_id', 'is', null)
        .group('user_id')
        .order('count', { ascending: false })
        .limit(limit);

      // Get popular sections
      const { data: popularSections, error: sectionsError } = await this.supabase
        .from('events')
        .select('entity_id, count(*)')
        .eq('workspace_id', workspaceId)
        .eq('entity_type', 'section')
        .gte('created_at', startDate)
        .eq('is_deleted', false)
        .group('entity_id')
        .order('count', { ascending: false })
        .limit(limit);

      if (tasksError || usersError || sectionsError) {
        console.error('Error fetching trending activity:', { tasksError, usersError, sectionsError });
      }

      return {
        trending_tasks: trendingTasks || [],
        active_users: activeUsers || [],
        popular_sections: popularSections || []
      };
    } catch (error) {
      console.error('Error fetching workspace trending activity:', error);
      return {
        trending_tasks: [],
        active_users: [],
        popular_sections: []
      };
    }
  }

  // =============================================
  // SECURITY AND AUDIT QUERIES
  // =============================================

  async getSecurityEvents({
    workspaceId,
    userId,
    severity = ['warning', 'error', 'critical'],
    days = 30,
    limit = 100
  }: {
    workspaceId?: string;
    userId?: string;
    severity?: string[];
    days?: number;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      let query = this.supabase
        .from('events')
        .select(`
          *,
          users:user_id (name, email)
        `)
        .eq('category', 'security')
        .in('severity', severity)
        .gte('created_at', startDate)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        console.error('Failed to fetch security events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching security events:', error);
      return [];
    }
  }

  async getAuditTrail({
    entityType,
    entityId,
    userId,
    startDate,
    endDate,
    limit = 500
  }: {
    entityType?: EntityType;
    entityId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    return this.getEvents({
      entity_type: entityType ? [entityType] : undefined,
      entity_id: entityId,
      user_id: userId,
      date_from: startDate,
      date_to: endDate
    });
  }

  // =============================================
  // ACTIVITY METRICS AND STATISTICS
  // =============================================

  async getActivityMetrics({
    workspaceId,
    userId,
    days = 7
  }: {
    workspaceId?: string;
    userId?: string;
    days?: number;
  } = {}): Promise<{
    total_events: number;
    daily_average: number;
    most_active_day: string | null;
    category_breakdown: Record<string, number>;
    entity_breakdown: Record<string, number>;
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      let query = this.supabase
        .from('events')
        .select('created_at, category, entity_type')
        .gte('created_at', startDate)
        .eq('is_deleted', false);

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('Failed to fetch activity metrics:', error);
        return {
          total_events: 0,
          daily_average: 0,
          most_active_day: null,
          category_breakdown: {},
          entity_breakdown: {}
        };
      }

      const totalEvents = events?.length || 0;
      const dailyAverage = Math.round(totalEvents / days);

      // Calculate category breakdown
      const categoryBreakdown = events?.reduce((acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate entity type breakdown
      const entityBreakdown = events?.reduce((acc, event) => {
        acc[event.entity_type] = (acc[event.entity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Find most active day
      const dailyCounts = events?.reduce((acc, event) => {
        const day = event.created_at.split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const mostActiveDay = Object.entries(dailyCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      return {
        total_events: totalEvents,
        daily_average: dailyAverage,
        most_active_day: mostActiveDay,
        category_breakdown: categoryBreakdown,
        entity_breakdown: entityBreakdown
      };
    } catch (error) {
      console.error('Error fetching activity metrics:', error);
      return {
        total_events: 0,
        daily_average: 0,
        most_active_day: null,
        category_breakdown: {},
        entity_breakdown: {}
      };
    }
  }
}

// =============================================
// SINGLETON INSTANCE
// =============================================

export const activityQueries = new ActivityQueries();

// =============================================
// CONVENIENCE FUNCTIONS
// =============================================

export const getRecentActivity = activityQueries.getRecentActivity.bind(activityQueries);
export const getWorkspaceActivity = activityQueries.getWorkspaceActivity.bind(activityQueries);
export const getUserActivity = activityQueries.getUserActivity.bind(activityQueries);
export const getEntityActivityTimeline = activityQueries.getEntityActivityTimeline.bind(activityQueries);
export const getTaskActivityTimeline = activityQueries.getTaskActivityTimeline.bind(activityQueries);
export const getEvents = activityQueries.getEvents.bind(activityQueries);
export const getUserActivitySummary = activityQueries.getUserActivitySummary.bind(activityQueries);
export const getWorkspaceActivityStats = activityQueries.getWorkspaceActivityStats.bind(activityQueries);
export const getTaskActivitySummary = activityQueries.getTaskActivitySummary.bind(activityQueries);
export const getSecurityEvents = activityQueries.getSecurityEvents.bind(activityQueries);
export const getAuditTrail = activityQueries.getAuditTrail.bind(activityQueries);
export const getActivityMetrics = activityQueries.getActivityMetrics.bind(activityQueries);

export default activityQueries;