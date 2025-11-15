// =============================================
// TODO LIST APPLICATION - TYPESCRIPT TYPES
// =============================================
// Generated TypeScript interfaces for Supabase schema
// Corresponds to PostgreSQL schema definitions

// =============================================
// UTILITY TYPES
// =============================================

// Base audit fields for all entities
export interface BaseEntity {
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// Database enums
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkspaceMemberRole = 'owner' | 'admin' | 'member' | 'viewer';
export type EventType = 
  // Core CRUD operations
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'restored' 
  // Status and state changes
  | 'archived' 
  | 'unarchived'
  | 'status_changed' 
  | 'completed'
  | 'reopened'
  // Assignment and ownership
  | 'assigned' 
  | 'unassigned'
  | 'reassigned'
  | 'ownership_transferred'
  // Movement and organization
  | 'moved' 
  | 'reordered'
  | 'duplicated'
  | 'merged'
  // Membership and permissions
  | 'member_added' 
  | 'member_removed'
  | 'member_invited'
  | 'invitation_accepted'
  | 'invitation_declined'
  | 'role_changed' 
  | 'permission_changed'
  | 'access_granted'
  | 'access_revoked'
  // Authentication and security
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_changed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'suspicious_activity'
  // System and application events
  | 'search_performed'
  | 'export_generated'
  | 'import_completed'
  | 'backup_created'
  | 'settings_changed'
  | 'integration_connected'
  | 'integration_disconnected'
  // User interaction events
  | 'viewed'
  | 'commented'
  | 'mentioned'
  | 'watched'
  | 'unwatched'
  | 'notification_sent'
  | 'email_sent'
  | 'reminder_triggered';

export type EntityType = 
  | 'user' 
  | 'workspace' 
  | 'workspace_member' 
  | 'section' 
  | 'task'
  | 'comment'
  | 'attachment'
  | 'notification'
  | 'integration'
  | 'api_key'
  | 'session';

// Permission structure for workspace members
export interface WorkspacePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  admin: boolean;
}

// User preferences structure
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    task_assignments?: boolean;
    due_date_reminders?: boolean;
  };
  ui?: {
    compact_mode?: boolean;
    show_completed_tasks?: boolean;
    default_view?: 'list' | 'board' | 'calendar';
  };
}

// Workspace settings structure
export interface WorkspaceSettings {
  features?: {
    time_tracking?: boolean;
    file_attachments?: boolean;
    due_date_reminders?: boolean;
    task_templates?: boolean;
  };
  integrations?: {
    calendar?: boolean;
    slack?: boolean;
    email?: boolean;
  };
  security?: {
    require_task_approval?: boolean;
    restrict_member_invites?: boolean;
  };
}

// =============================================
// CORE ENTITY TYPES
// =============================================

// Users table type
export interface User extends BaseEntity {
  id: string; // UUID, references auth.users
  email: string;
  name: string;
  avatar_url?: string;
  google_id?: string;
  timezone: string;
  preferences: UserPreferences;
  last_active_at?: string;
}

// Workspaces table type
export interface Workspace extends BaseEntity {
  id: string; // UUID
  name: string;
  description?: string;
  owner_id: string; // UUID, references users
  color: string;
  icon?: string;
  settings: WorkspaceSettings;
  
  // Search vector (read-only, generated)
  search_vector?: string;
}

// Workspace members junction table type
export interface WorkspaceMember extends BaseEntity {
  id: string; // UUID
  workspace_id: string; // UUID, references workspaces
  user_id: string; // UUID, references users
  role: WorkspaceMemberRole;
  permissions: WorkspacePermissions;
  invited_by_user_id?: string; // UUID, references users
  invitation_accepted_at?: string;
  last_active_at?: string;
}

// Sections table type
export interface Section extends BaseEntity {
  id: string; // UUID
  workspace_id: string; // UUID, references workspaces
  name: string;
  description?: string;
  position: number;
  color: string;
  is_archived: boolean;
  
  // Search vector (read-only, generated)
  search_vector?: string;
}

// Tasks table type
export interface Task extends BaseEntity {
  id: string; // UUID
  section_id: string; // UUID, references sections
  workspace_id: string; // UUID, references workspaces (denormalized)
  
  // Task content
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  // Assignment and ownership
  assigned_to_user_id?: string; // UUID, references users
  created_by_user_id: string; // UUID, references users
  
  // Date fields
  start_date?: string; // DATE format: YYYY-MM-DD
  end_date?: string; // DATE format: YYYY-MM-DD
  due_date?: string; // DATE format: YYYY-MM-DD
  completed_at?: string; // TIMESTAMPTZ format
  
  // Organization
  position: number;
  tags: string[];
  
  // Metadata
  estimated_hours?: number;
  actual_hours?: number;
  attachments: TaskAttachment[];
  
  // Search vector (read-only, generated)
  search_vector?: string;
}

// Event categories for classification
export type EventCategory = 
  | 'system' 
  | 'user_action' 
  | 'security' 
  | 'integration' 
  | 'automation' 
  | 'error';

// Event severity levels
export type EventSeverity = 
  | 'debug' 
  | 'info' 
  | 'warning' 
  | 'error' 
  | 'critical';

// Event sources
export type EventSource = 
  | 'web' 
  | 'api' 
  | 'mobile' 
  | 'integration' 
  | 'system' 
  | 'automation' 
  | 'webhook';

// Activity period types
export type ActivityPeriodType = 
  | 'hour' 
  | 'day' 
  | 'week' 
  | 'month';

// Enhanced Events table type
export interface Event extends BaseEntity {
  id: string; // UUID
  workspace_id?: string; // UUID, references workspaces
  user_id?: string; // UUID, references users
  
  // Event details
  event_type: EventType;
  entity_type: EntityType;
  entity_id?: string; // UUID of affected entity
  
  // Change tracking
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  delta?: Record<string, unknown>;
  
  // Enhanced classification and metadata
  category: EventCategory;
  severity: EventSeverity;
  source: EventSource;
  correlation_id?: string; // UUID for grouping related events
  related_entity_type?: string;
  related_entity_id?: string; // UUID
  context: Record<string, unknown>;
  tags: string[];
  
  // Request metadata
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

// =============================================
// ADDITIONAL UTILITY TYPES
// =============================================

// Task attachment structure
export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
  uploaded_by_user_id: string;
}

// =============================================
// VIEW TYPES
// =============================================

// User workspace access view type
export interface UserWorkspaceAccess {
  user_id: string;
  email: string;
  name: string;
  workspace_id: string;
  workspace_name: string;
  role: WorkspaceMemberRole;
  permissions: WorkspacePermissions;
  joined_at: string;
  last_active_at?: string;
}

// Task summary view type
export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  workspace_id: string;
  workspace_name: string;
  section_id: string;
  section_name: string;
  assigned_to_user_id?: string;
  assignee_name?: string;
  assignee_email?: string;
  created_by_user_id: string;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// INSERT/UPDATE TYPES (for mutations)
// =============================================

// User insert/update types (excluding auto-generated fields)
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at' | 'is_deleted'> & {
  id: string; // Required for auth integration
};

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>>;

// Workspace insert/update types
export type WorkspaceInsert = Omit<Workspace, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'search_vector'>;
export type WorkspaceUpdate = Partial<Omit<Workspace, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'search_vector'>>;

// Workspace member insert/update types
export type WorkspaceMemberInsert = Omit<WorkspaceMember, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>;
export type WorkspaceMemberUpdate = Partial<Omit<WorkspaceMember, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>>;

// Section insert/update types
export type SectionInsert = Omit<Section, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'search_vector'>;
export type SectionUpdate = Partial<Omit<Section, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'search_vector'>>;

// Task insert/update types
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'search_vector'>;
export type TaskUpdate = Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'search_vector'>>;

// User Activity Summary table type
export interface UserActivitySummary extends BaseEntity {
  id: string; // UUID
  user_id: string; // UUID, references users
  workspace_id?: string; // UUID, references workspaces
  
  // Time period for aggregation
  period_start: string; // TIMESTAMPTZ
  period_end: string; // TIMESTAMPTZ
  period_type: ActivityPeriodType;
  
  // Activity counters
  total_events: number;
  tasks_created: number;
  tasks_completed: number;
  tasks_updated: number;
  sections_created: number;
  workspaces_created: number;
  searches_performed: number;
  logins: number;
  
  // Activity metrics
  active_minutes: number;
  last_activity_at?: string; // TIMESTAMPTZ
  most_active_hour?: number; // 0-23
}

// Event Category Statistics table type
export interface EventCategoryStats extends BaseEntity {
  id: string; // UUID
  workspace_id?: string; // UUID, references workspaces
  
  // Time period
  period_start: string; // TIMESTAMPTZ
  period_end: string; // TIMESTAMPTZ
  period_type: ActivityPeriodType;
  
  // Category breakdown
  category: EventCategory;
  event_type: EventType;
  entity_type?: EntityType;
  
  // Statistics
  event_count: number;
  unique_users: number;
  unique_entities: number;
}

// Activity feed item for UI display
export interface ActivityFeedItem {
  id: string;
  event_type: EventType;
  entity_type: EntityType;
  entity_id?: string;
  user_name?: string;
  workspace_name?: string;
  description: string;
  created_at: string;
  category: EventCategory;
  severity: EventSeverity;
  context: Record<string, unknown>;
}

// Entity activity timeline item
export interface EntityActivityTimelineItem {
  id: string;
  event_type: EventType;
  user_name?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  delta?: Record<string, unknown>;
  created_at: string;
  correlation_id?: string;
}

// Event insert type (events are typically not updated)
export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>;

// User activity summary insert/update types
export type UserActivitySummaryInsert = Omit<UserActivitySummary, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>;
export type UserActivitySummaryUpdate = Partial<Omit<UserActivitySummary, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>>;

// Event category stats insert/update types
export type EventCategoryStatsInsert = Omit<EventCategoryStats, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>;
export type EventCategoryStatsUpdate = Partial<Omit<EventCategoryStats, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>>;

// =============================================
// SUPABASE-SPECIFIC TYPES
// =============================================

// Database type definition for Supabase client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      workspaces: {
        Row: Workspace;
        Insert: WorkspaceInsert;
        Update: WorkspaceUpdate;
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: WorkspaceMemberInsert;
        Update: WorkspaceMemberUpdate;
      };
      sections: {
        Row: Section;
        Insert: SectionInsert;
        Update: SectionUpdate;
      };
      tasks: {
        Row: Task;
        Insert: TaskInsert;
        Update: TaskUpdate;
      };
      events: {
        Row: Event;
        Insert: EventInsert;
        Update: Partial<EventInsert>;
      };
      user_activity_summary: {
        Row: UserActivitySummary;
        Insert: UserActivitySummaryInsert;
        Update: UserActivitySummaryUpdate;
      };
      event_category_stats: {
        Row: EventCategoryStats;
        Insert: EventCategoryStatsInsert;
        Update: EventCategoryStatsUpdate;
      };
      search_audit: {
        Row: SearchAudit;
        Insert: Omit<SearchAudit, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>;
        Update: Partial<Omit<SearchAudit, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>>;
      };
    };
    Views: {
      user_workspace_access: {
        Row: UserWorkspaceAccess;
      };
      task_summary: {
        Row: TaskSummary;
      };
      search_index_stats: {
        Row: SearchIndexStats;
      };
    };
    Functions: {
      search_all: {
        Args: {
          search_query: string;
          workspace_id_filter?: string;
          result_limit?: number;
          result_offset?: number;
        };
        Returns: SearchResult[];
      };
      search_tasks: {
        Args: {
          search_query: string;
          workspace_id_filter?: string;
          section_ids?: string[];
          status_filter?: string[];
          priority_filter?: string[];
          assigned_to_filter?: string[];
          tags_filter?: string[];
          due_date_from?: string;
          due_date_to?: string;
          result_limit?: number;
          result_offset?: number;
        };
        Returns: TaskSearchResult[];
      };
      get_search_suggestions: {
        Args: {
          partial_query: string;
          workspace_id_filter?: string;
          suggestion_limit?: number;
        };
        Returns: SearchSuggestion[];
      };
      get_search_stats: {
        Args: {
          workspace_id_filter?: string;
        };
        Returns: SearchStats[];
      };
      get_search_performance_metrics: {
        Args: {
          workspace_id_filter?: string;
        };
        Returns: SearchPerformanceMetric[];
      };
      warmup_search_indexes: {
        Args: Record<string, never>;
        Returns: string;
      };
      rebuild_search_vectors: {
        Args: {
          entity_type?: string;
        };
        Returns: string;
      };
      log_search_query: {
        Args: {
          p_user_id: string;
          p_workspace_id?: string;
          p_search_query: string;
          p_search_type: string;
          p_filters_applied?: Record<string, unknown>;
          p_results_count?: number;
          p_execution_time_ms?: number;
        };
        Returns: string;
      };
      log_enhanced_event: {
        Args: {
          p_workspace_id?: string;
          p_user_id?: string;
          p_event_type?: EventType;
          p_entity_type?: EntityType;
          p_entity_id?: string;
          p_old_values?: Record<string, unknown>;
          p_new_values?: Record<string, unknown>;
          p_category?: EventCategory;
          p_severity?: EventSeverity;
          p_source?: EventSource;
          p_correlation_id?: string;
          p_related_entity_type?: string;
          p_related_entity_id?: string;
          p_context?: Record<string, unknown>;
          p_tags?: string[];
          p_ip_address?: string;
          p_user_agent?: string;
          p_session_id?: string;
        };
        Returns: string;
      };
      log_auth_event: {
        Args: {
          p_user_id: string;
          p_event_type: EventType;
          p_ip_address?: string;
          p_user_agent?: string;
          p_session_id?: string;
          p_context?: Record<string, unknown>;
        };
        Returns: string;
      };
      log_search_event: {
        Args: {
          p_user_id: string;
          p_workspace_id?: string;
          p_search_query?: string;
          p_search_type?: string;
          p_filters?: Record<string, unknown>;
          p_results_count?: number;
          p_execution_time_ms?: number;
        };
        Returns: string;
      };
      get_recent_activity: {
        Args: {
          p_workspace_id?: string;
          p_user_id?: string;
          p_limit?: number;
          p_offset?: number;
          p_categories?: EventCategory[];
        };
        Returns: ActivityFeedItem[];
      };
      get_entity_activity_timeline: {
        Args: {
          p_entity_type: EntityType;
          p_entity_id: string;
          p_limit?: number;
        };
        Returns: EntityActivityTimelineItem[];
      };
      aggregate_user_activity: {
        Args: {
          p_user_id?: string;
          p_workspace_id?: string;
          p_period_start?: string;
          p_period_end?: string;
          p_period_type?: ActivityPeriodType;
        };
        Returns: void;
      };
      aggregate_event_category_stats: {
        Args: {
          p_workspace_id?: string;
          p_period_start?: string;
          p_period_end?: string;
          p_period_type?: ActivityPeriodType;
        };
        Returns: void;
      };
    };
  };
}

// =============================================
// API RESPONSE TYPES
// =============================================

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error: string | null;
}

// Search response type
export interface SearchResponse<T> {
  data: T[];
  query: string;
  total: number;
  took: number; // milliseconds
  error: string | null;
}

// =============================================
// SEARCH-SPECIFIC TYPES
// =============================================

// Search result item for unified search
export interface SearchResult {
  entity_type: 'workspace' | 'section' | 'task';
  entity_id: string;
  title: string;
  description?: string;
  workspace_id: string;
  workspace_name: string;
  section_id?: string;
  section_name?: string;
  relevance_score: number;
  context_snippet: string;
  entity_data: Record<string, unknown>;
}

// Enhanced task search result with additional metadata
export interface TaskSearchResult {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to_user_id?: string;
  assignee_name?: string;
  created_by_user_id: string;
  creator_name: string;
  due_date?: string;
  tags: string[];
  section_id: string;
  section_name: string;
  workspace_id: string;
  workspace_name: string;
  relevance_score: number;
  context_snippet: string;
  created_at: string;
  updated_at: string;
}

// Search suggestion item
export interface SearchSuggestion {
  suggestion: string;
  entity_type: 'workspace' | 'section' | 'task' | 'tag';
  entity_count: number;
}

// Search index statistics
export interface SearchIndexStats {
  entity_type: string;
  total_entities: number;
  indexed_entities: number;
  avg_search_vector_length: number;
}

// Search performance statistics
export interface SearchStats {
  workspace_count: number;
  section_count: number;
  task_count: number;
  total_indexed_entities: number;
  search_coverage_percentage: number;
}

// Search performance metrics
export interface SearchPerformanceMetric {
  metric_name: string;
  metric_value: number;
  metric_description: string;
}

// Search audit log entry
export interface SearchAudit extends BaseEntity {
  id: string;
  user_id?: string;
  workspace_id?: string;
  search_query: string;
  search_type: 'global' | 'tasks' | 'suggestions' | 'stats';
  filters_applied: Record<string, unknown>;
  results_count: number;
  execution_time_ms?: number;
}

// =============================================
// QUERY PARAMETER TYPES
// =============================================

// Task filters
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigned_to_user_id?: string[];
  due_date_from?: string;
  due_date_to?: string;
  tags?: string[];
  search?: string;
}

// Enhanced task search filters for the new search function
export interface TaskSearchFilters {
  search_query: string;
  workspace_id?: string;
  section_ids?: string[];
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigned_to?: string[];
  tags?: string[];
  due_date_from?: string;
  due_date_to?: string;
  limit?: number;
  offset?: number;
}

// Global search filters for searching across all entities
export interface GlobalSearchFilters {
  search_query: string;
  workspace_id?: string;
  entity_types?: ('workspace' | 'section' | 'task')[];
  limit?: number;
  offset?: number;
}

// Search suggestions filters
export interface SearchSuggestionFilters {
  partial_query: string;
  workspace_id?: string;
  limit?: number;
}

// Task sorting
export interface TaskSort {
  field: keyof Pick<Task, 'title' | 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'position'>;
  direction: 'asc' | 'desc';
}

// Workspace member filters
export interface WorkspaceMemberFilters {
  role?: WorkspaceMemberRole[];
  joined_after?: string;
  active_after?: string;
}

// Enhanced event filters
export interface EventFilters {
  event_type?: EventType[];
  entity_type?: EntityType[];
  entity_id?: string;
  user_id?: string;
  workspace_id?: string;
  category?: EventCategory[];
  severity?: EventSeverity[];
  source?: EventSource[];
  date_from?: string;
  date_to?: string;
  correlation_id?: string;
  tags?: string[];
}

// Activity filters for recent activity queries
export interface ActivityFilters {
  workspace_id?: string;
  user_id?: string;
  categories?: EventCategory[];
  entity_types?: EntityType[];
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// Activity summary filters
export interface ActivitySummaryFilters {
  user_id?: string;
  workspace_id?: string;
  period_type?: ActivityPeriodType;
  period_start?: string;
  period_end?: string;
}

// Event logging context interfaces
export interface AuthEventContext {
  login_method?: string;
  device_info?: string;
  location?: string;
  failed_attempts?: number;
  lockout_until?: string;
}

export interface SearchEventContext {
  query: string;
  type: string;
  filters?: Record<string, unknown>;
  results_count: number;
  execution_time_ms?: number;
  suggestions_shown?: number;
}

export interface TaskEventContext {
  previous_status?: string;
  new_status?: string;
  previous_assignee?: string;
  new_assignee?: string;
  previous_section?: string;
  new_section?: string;
  automation_triggered?: boolean;
}

export interface SystemEventContext {
  system_version?: string;
  migration_version?: string;
  error_code?: string;
  error_message?: string;
  stack_trace?: string;
}

// =============================================
// REAL-TIME TYPES
// =============================================

// Supabase real-time payload type
export interface RealtimePayload<T> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
  errors?: string[];
}

// =============================================
// FORM VALIDATION TYPES
// =============================================

// Form validation schemas (for use with libraries like Zod)
export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to_user_id?: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  tags: string[];
  estimated_hours?: number;
}

export interface WorkspaceFormData {
  name: string;
  description?: string;
  color: string;
  icon?: string;
}

export interface SectionFormData {
  name: string;
  description?: string;
  color: string;
}

// =============================================
// EXPORT ALL TYPES
// =============================================
// Types are exported individually above - this section is for documentation only