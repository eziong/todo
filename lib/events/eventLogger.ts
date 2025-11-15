// =============================================
// EVENT LOGGING UTILITY LIBRARY
// =============================================
// Comprehensive event logging utilities for the Todo application
// Provides high-level functions for logging various types of events

import { createClient } from '@/lib/supabase/client';
import type { 
  EventType, 
  EntityType, 
  EventCategory, 
  EventSeverity, 
  EventSource,
  AuthEventContext,
  SearchEventContext,
  TaskEventContext,
  SystemEventContext
} from '@/types/database';

// =============================================
// CORE EVENT LOGGING CLASS
// =============================================

export class EventLogger {
  private supabase = createClient();
  private userId: string | null = null;
  private sessionId: string | null = null;
  private userAgent: string | null = null;

  constructor() {
    // Initialize with current session info
    this.initializeSession();
  }

  private async initializeSession() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      this.userId = user?.id || null;
      this.sessionId = this.generateSessionId();
      this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    } catch (error) {
      console.warn('Failed to initialize event logger session:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getClientInfo() {
    return {
      user_agent: this.userAgent,
      session_id: this.sessionId,
      // Note: IP address should be set server-side for security
      ip_address: null
    };
  }

  // =============================================
  // CORE EVENT LOGGING METHOD
  // =============================================

  async logEvent({
    workspaceId,
    userId = this.userId,
    eventType = 'updated',
    entityType,
    entityId,
    oldValues,
    newValues,
    category = 'user_action',
    severity = 'info',
    source = 'web',
    correlationId,
    relatedEntityType,
    relatedEntityId,
    context = {},
    tags = []
  }: {
    workspaceId?: string;
    userId?: string | null;
    eventType?: EventType;
    entityType: EntityType;
    entityId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    category?: EventCategory;
    severity?: EventSeverity;
    source?: EventSource;
    correlationId?: string;
    relatedEntityType?: EntityType;
    relatedEntityId?: string;
    context?: Record<string, unknown>;
    tags?: string[];
  }): Promise<string | null> {
    try {
      const clientInfo = this.getClientInfo();
      
      const { data, error } = await this.supabase.rpc('log_enhanced_event', {
        p_workspace_id: workspaceId || null,
        p_user_id: userId,
        p_event_type: eventType,
        p_entity_type: entityType,
        p_entity_id: entityId || null,
        p_old_values: oldValues || null,
        p_new_values: newValues || null,
        p_category: category,
        p_severity: severity,
        p_source: source,
        p_correlation_id: correlationId || null,
        p_related_entity_type: relatedEntityType || null,
        p_related_entity_id: relatedEntityId || null,
        p_context: context,
        p_tags: tags,
        ...clientInfo
      });

      if (error) {
        console.error('Failed to log event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging event:', error);
      return null;
    }
  }

  // =============================================
  // TASK-SPECIFIC EVENT LOGGING
  // =============================================

  async logTaskCreated({
    workspaceId,
    taskId,
    taskData,
    sectionId,
    correlationId
  }: {
    workspaceId: string;
    taskId: string;
    taskData: Record<string, unknown>;
    sectionId: string;
    correlationId?: string;
  }) {
    return this.logEvent({
      workspaceId,
      eventType: 'created',
      entityType: 'task',
      entityId: taskId,
      newValues: taskData,
      category: 'user_action',
      severity: 'info',
      correlationId,
      relatedEntityType: 'section',
      relatedEntityId: sectionId,
      context: { section_id: sectionId },
      tags: ['task', 'create', taskData.status as string || 'todo']
    });
  }

  async logTaskUpdated({
    workspaceId,
    taskId,
    oldTaskData,
    newTaskData,
    correlationId
  }: {
    workspaceId: string;
    taskId: string;
    oldTaskData: Record<string, unknown>;
    newTaskData: Record<string, unknown>;
    correlationId?: string;
  }) {
    // Determine specific event type based on what changed
    let eventType: EventType = 'updated';
    const oldStatus = oldTaskData.status as string;
    const newStatus = newTaskData.status as string;
    const oldAssignee = oldTaskData.assigned_to_user_id as string;
    const newAssignee = newTaskData.assigned_to_user_id as string;
    const oldSection = oldTaskData.section_id as string;
    const newSection = newTaskData.section_id as string;

    if (oldStatus !== newStatus) {
      eventType = newStatus === 'completed' ? 'completed' : 'status_changed';
    } else if (oldAssignee !== newAssignee) {
      eventType = 'reassigned';
    } else if (oldSection !== newSection) {
      eventType = 'moved';
    }

    const context: TaskEventContext = {
      previous_status: oldStatus,
      new_status: newStatus,
      previous_assignee: oldAssignee,
      new_assignee: newAssignee,
      previous_section: oldSection,
      new_section: newSection
    };

    return this.logEvent({
      workspaceId,
      eventType,
      entityType: 'task',
      entityId: taskId,
      oldValues: oldTaskData,
      newValues: newTaskData,
      category: 'user_action',
      severity: 'info',
      correlationId,
      context,
      tags: ['task', 'update', eventType, newStatus]
    });
  }

  async logTaskDeleted({
    workspaceId,
    taskId,
    taskData,
    correlationId
  }: {
    workspaceId: string;
    taskId: string;
    taskData: Record<string, unknown>;
    correlationId?: string;
  }) {
    return this.logEvent({
      workspaceId,
      eventType: 'deleted',
      entityType: 'task',
      entityId: taskId,
      oldValues: taskData,
      category: 'user_action',
      severity: 'info',
      correlationId,
      context: { 
        previous_status: taskData.status,
        section_id: taskData.section_id 
      },
      tags: ['task', 'delete', taskData.status as string || 'unknown']
    });
  }

  // =============================================
  // WORKSPACE AND SECTION EVENT LOGGING
  // =============================================

  async logWorkspaceCreated({
    workspaceId,
    workspaceData,
    correlationId
  }: {
    workspaceId: string;
    workspaceData: Record<string, unknown>;
    correlationId?: string;
  }) {
    return this.logEvent({
      workspaceId,
      eventType: 'created',
      entityType: 'workspace',
      entityId: workspaceId,
      newValues: workspaceData,
      category: 'user_action',
      severity: 'info',
      correlationId,
      tags: ['workspace', 'create']
    });
  }

  async logSectionCreated({
    workspaceId,
    sectionId,
    sectionData,
    correlationId
  }: {
    workspaceId: string;
    sectionId: string;
    sectionData: Record<string, unknown>;
    correlationId?: string;
  }) {
    return this.logEvent({
      workspaceId,
      eventType: 'created',
      entityType: 'section',
      entityId: sectionId,
      newValues: sectionData,
      category: 'user_action',
      severity: 'info',
      correlationId,
      context: { workspace_id: workspaceId },
      tags: ['section', 'create']
    });
  }

  async logMemberAdded({
    workspaceId,
    memberId,
    memberData,
    invitedByUserId,
    correlationId
  }: {
    workspaceId: string;
    memberId: string;
    memberData: Record<string, unknown>;
    invitedByUserId?: string;
    correlationId?: string;
  }) {
    return this.logEvent({
      workspaceId,
      eventType: 'member_added',
      entityType: 'workspace_member',
      entityId: memberId,
      newValues: memberData,
      category: 'user_action',
      severity: 'info',
      correlationId,
      context: { 
        invited_by: invitedByUserId,
        role: memberData.role 
      },
      tags: ['member', 'add', memberData.role as string || 'member']
    });
  }

  // =============================================
  // AUTHENTICATION EVENT LOGGING
  // =============================================

  async logAuthEvent({
    userId,
    eventType,
    context = {},
    ipAddress,
    correlationId
  }: {
    userId: string;
    eventType: 'login' | 'logout' | 'login_failed' | 'password_changed' | 'mfa_enabled' | 'mfa_disabled';
    context?: AuthEventContext;
    ipAddress?: string;
    correlationId?: string;
  }) {
    try {
      const { data, error } = await this.supabase.rpc('log_auth_event', {
        p_user_id: userId,
        p_event_type: eventType,
        p_ip_address: ipAddress || null,
        p_user_agent: this.userAgent,
        p_session_id: this.sessionId,
        p_context: context
      });

      if (error) {
        console.error('Failed to log auth event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging auth event:', error);
      return null;
    }
  }

  // =============================================
  // SEARCH EVENT LOGGING
  // =============================================

  async logSearchEvent({
    workspaceId,
    searchQuery,
    searchType = 'general',
    filters = {},
    resultsCount = 0,
    executionTimeMs,
    correlationId
  }: {
    workspaceId?: string;
    searchQuery: string;
    searchType?: string;
    filters?: Record<string, unknown>;
    resultsCount?: number;
    executionTimeMs?: number;
    correlationId?: string;
  }) {
    try {
      const { data, error } = await this.supabase.rpc('log_search_event', {
        p_user_id: this.userId!,
        p_workspace_id: workspaceId || null,
        p_search_query: searchQuery,
        p_search_type: searchType,
        p_filters: filters,
        p_results_count: resultsCount,
        p_execution_time_ms: executionTimeMs || null
      });

      if (error) {
        console.error('Failed to log search event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging search event:', error);
      return null;
    }
  }

  // =============================================
  // VIEW TRACKING
  // =============================================

  async logEntityViewed({
    workspaceId,
    entityType,
    entityId,
    context = {},
    correlationId
  }: {
    workspaceId?: string;
    entityType: EntityType;
    entityId: string;
    context?: Record<string, unknown>;
    correlationId?: string;
  }) {
    return this.logEvent({
      workspaceId,
      eventType: 'viewed',
      entityType,
      entityId,
      category: 'user_action',
      severity: 'debug',
      correlationId,
      context,
      tags: [entityType, 'view']
    });
  }

  // =============================================
  // ERROR AND SYSTEM EVENT LOGGING
  // =============================================

  async logError({
    workspaceId,
    errorCode,
    errorMessage,
    stackTrace,
    entityType,
    entityId,
    context = {},
    correlationId
  }: {
    workspaceId?: string;
    errorCode: string;
    errorMessage: string;
    stackTrace?: string;
    entityType?: EntityType;
    entityId?: string;
    context?: SystemEventContext;
    correlationId?: string;
  }) {
    const errorContext = {
      error_code: errorCode,
      error_message: errorMessage,
      stack_trace: stackTrace,
      ...context
    };

    return this.logEvent({
      workspaceId,
      eventType: 'updated', // Using 'updated' as fallback since 'error' isn't in the enum
      entityType: entityType || 'user',
      entityId,
      category: 'error',
      severity: 'error',
      context: errorContext,
      correlationId,
      tags: ['error', errorCode]
    });
  }

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  async logBatchOperation({
    workspaceId,
    operationType,
    entityType,
    entityIds,
    context = {},
    correlationId
  }: {
    workspaceId?: string;
    operationType: string;
    entityType: EntityType;
    entityIds: string[];
    context?: Record<string, unknown>;
    correlationId?: string;
  }) {
    const batchContext = {
      operation_type: operationType,
      entity_count: entityIds.length,
      entity_ids: entityIds,
      ...context
    };

    return this.logEvent({
      workspaceId,
      eventType: 'updated', // Using 'updated' as fallback
      entityType,
      category: 'user_action',
      severity: 'info',
      context: batchContext,
      correlationId,
      tags: ['batch', operationType, entityType]
    });
  }

  // =============================================
  // CORRELATION HELPERS
  // =============================================

  generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // =============================================
  // CONTEXT HELPERS
  // =============================================

  buildTaskContext(oldTask: any, newTask: any): TaskEventContext {
    return {
      previous_status: oldTask?.status,
      new_status: newTask?.status,
      previous_assignee: oldTask?.assigned_to_user_id,
      new_assignee: newTask?.assigned_to_user_id,
      previous_section: oldTask?.section_id,
      new_section: newTask?.section_id,
      automation_triggered: false
    };
  }
}

// =============================================
// SINGLETON INSTANCE
// =============================================

export const eventLogger = new EventLogger();

// =============================================
// CONVENIENCE FUNCTIONS
// =============================================

export const logTaskCreated = eventLogger.logTaskCreated.bind(eventLogger);
export const logTaskUpdated = eventLogger.logTaskUpdated.bind(eventLogger);
export const logTaskDeleted = eventLogger.logTaskDeleted.bind(eventLogger);
export const logWorkspaceCreated = eventLogger.logWorkspaceCreated.bind(eventLogger);
export const logSectionCreated = eventLogger.logSectionCreated.bind(eventLogger);
export const logMemberAdded = eventLogger.logMemberAdded.bind(eventLogger);
export const logAuthEvent = eventLogger.logAuthEvent.bind(eventLogger);
export const logSearchEvent = eventLogger.logSearchEvent.bind(eventLogger);
export const logEntityViewed = eventLogger.logEntityViewed.bind(eventLogger);
export const logError = eventLogger.logError.bind(eventLogger);
export const logBatchOperation = eventLogger.logBatchOperation.bind(eventLogger);

// =============================================
// REACT HOOKS INTEGRATION
// =============================================

export const useEventLogger = () => {
  return {
    eventLogger,
    logTaskCreated,
    logTaskUpdated,
    logTaskDeleted,
    logWorkspaceCreated,
    logSectionCreated,
    logMemberAdded,
    logAuthEvent,
    logSearchEvent,
    logEntityViewed,
    logError,
    logBatchOperation,
    generateCorrelationId: eventLogger.generateCorrelationId.bind(eventLogger)
  };
};

export default eventLogger;