-- =============================================
-- ENHANCED EVENT LOGGING AND ACTIVITY TRACKING SYSTEM
-- Migration 007
-- =============================================
-- Comprehensive enhancements to event logging for complete audit trail
-- and activity history functionality with performance optimizations

-- =============================================
-- ENHANCED EVENT TYPES AND ENTITY COVERAGE
-- =============================================

-- Extend existing event types for comprehensive tracking
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_type_check CHECK (event_type IN (
    -- Core CRUD operations
    'created', 'updated', 'deleted', 'restored',
    
    -- Status and state changes
    'archived', 'unarchived', 'status_changed', 'completed', 'reopened',
    
    -- Assignment and ownership
    'assigned', 'unassigned', 'reassigned', 'ownership_transferred',
    
    -- Movement and organization
    'moved', 'reordered', 'duplicated', 'merged',
    
    -- Membership and permissions
    'member_added', 'member_removed', 'member_invited', 'invitation_accepted', 'invitation_declined',
    'role_changed', 'permission_changed', 'access_granted', 'access_revoked',
    
    -- Authentication and security
    'login', 'logout', 'login_failed', 'password_changed', 'mfa_enabled', 'mfa_disabled',
    'api_key_created', 'api_key_revoked', 'suspicious_activity',
    
    -- System and application events
    'search_performed', 'export_generated', 'import_completed', 'backup_created',
    'settings_changed', 'integration_connected', 'integration_disconnected',
    
    -- User interaction events
    'viewed', 'commented', 'mentioned', 'watched', 'unwatched',
    'notification_sent', 'email_sent', 'reminder_triggered'
));

-- Extend entity types to cover all trackable entities
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_entity_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_entity_type_check CHECK (entity_type IN (
    'user', 'workspace', 'workspace_member', 'section', 'task',
    'comment', 'attachment', 'notification', 'integration', 'api_key', 'session'
));

-- =============================================
-- ENHANCED EVENT TABLE STRUCTURE
-- =============================================

-- Add new columns for comprehensive event tracking
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS correlation_id UUID;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS related_entity_type TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS related_entity_id UUID;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add constraints for new columns
ALTER TABLE public.events ADD CONSTRAINT events_category_check CHECK (category IN (
    'system', 'user_action', 'security', 'integration', 'automation', 'error'
));

ALTER TABLE public.events ADD CONSTRAINT events_severity_check CHECK (severity IN (
    'debug', 'info', 'warning', 'error', 'critical'
));

ALTER TABLE public.events ADD CONSTRAINT events_source_check CHECK (source IN (
    'web', 'api', 'mobile', 'integration', 'system', 'automation', 'webhook'
));

-- =============================================
-- ACTIVITY AGGREGATION TABLES
-- =============================================

-- User activity summary table for dashboard and analytics
CREATE TABLE IF NOT EXISTS public.user_activity_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    
    -- Time period for aggregation
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL DEFAULT 'day', -- 'hour', 'day', 'week', 'month'
    
    -- Activity counters
    total_events INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_updated INTEGER DEFAULT 0,
    sections_created INTEGER DEFAULT 0,
    workspaces_created INTEGER DEFAULT 0,
    searches_performed INTEGER DEFAULT 0,
    logins INTEGER DEFAULT 0,
    
    -- Activity metrics
    active_minutes INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    most_active_hour INTEGER, -- 0-23
    
    -- Standard audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT user_activity_summary_period_check CHECK (period_start < period_end),
    CONSTRAINT user_activity_summary_period_type_check CHECK (period_type IN ('hour', 'day', 'week', 'month')),
    CONSTRAINT user_activity_summary_hour_check CHECK (most_active_hour IS NULL OR (most_active_hour >= 0 AND most_active_hour <= 23)),
    CONSTRAINT user_activity_summary_unique_period UNIQUE (user_id, workspace_id, period_start, period_type)
);

-- Event categories aggregation for analytics
CREATE TABLE IF NOT EXISTS public.event_category_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    
    -- Time period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL DEFAULT 'day',
    
    -- Category breakdown
    category TEXT NOT NULL,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    
    -- Statistics
    event_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    unique_entities INTEGER DEFAULT 0,
    
    -- Standard audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT event_category_stats_period_check CHECK (period_start < period_end),
    CONSTRAINT event_category_stats_period_type_check CHECK (period_type IN ('hour', 'day', 'week', 'month')),
    CONSTRAINT event_category_stats_unique_period UNIQUE (workspace_id, period_start, period_type, category, event_type, entity_type)
);

-- =============================================
-- ENHANCED INDEXING FOR PERFORMANCE
-- =============================================

-- Drop existing event indexes to recreate optimized versions
DROP INDEX IF EXISTS idx_events_workspace;
DROP INDEX IF EXISTS idx_events_user;
DROP INDEX IF EXISTS idx_events_entity;
DROP INDEX IF EXISTS idx_events_type;

-- Recreate with enhanced structure
CREATE INDEX CONCURRENTLY idx_events_workspace_category ON public.events(workspace_id, category, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_events_user_activity ON public.events(user_id, category, created_at DESC) WHERE NOT is_deleted AND category = 'user_action';
CREATE INDEX CONCURRENTLY idx_events_entity_detailed ON public.events(entity_type, entity_id, event_type, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_events_correlation ON public.events(correlation_id) WHERE NOT is_deleted AND correlation_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_events_severity ON public.events(severity, created_at DESC) WHERE NOT is_deleted AND severity IN ('error', 'critical');
CREATE INDEX CONCURRENTLY idx_events_source ON public.events(source, category, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_events_context ON public.events USING GIN(context) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_events_tags ON public.events USING GIN(tags) WHERE NOT is_deleted;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_events_user_workspace_activity ON public.events(user_id, workspace_id, category, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_events_entity_workspace ON public.events(entity_type, workspace_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_events_recent_activity ON public.events(workspace_id, created_at DESC, event_type) WHERE NOT is_deleted AND created_at > now() - INTERVAL '30 days';

-- Activity summary table indexes
CREATE INDEX CONCURRENTLY idx_user_activity_summary_user_period ON public.user_activity_summary(user_id, period_type, period_start DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_user_activity_summary_workspace ON public.user_activity_summary(workspace_id, period_start DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_event_category_stats_workspace_period ON public.event_category_stats(workspace_id, period_type, period_start DESC) WHERE NOT is_deleted;

-- =============================================
-- ENHANCED EVENT LOGGING FUNCTIONS
-- =============================================

-- Enhanced event logging function with additional context
CREATE OR REPLACE FUNCTION log_enhanced_event(
    p_workspace_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_event_type TEXT DEFAULT 'updated',
    p_entity_type TEXT DEFAULT 'unknown',
    p_entity_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_category TEXT DEFAULT 'user_action',
    p_severity TEXT DEFAULT 'info',
    p_source TEXT DEFAULT 'web',
    p_correlation_id UUID DEFAULT NULL,
    p_related_entity_type TEXT DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL,
    p_context JSONB DEFAULT '{}',
    p_tags TEXT[] DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
    delta_values JSONB;
BEGIN
    -- Calculate delta if both old and new values provided
    delta_values := CASE 
        WHEN p_old_values IS NOT NULL AND p_new_values IS NOT NULL 
        THEN p_new_values - p_old_values 
        ELSE NULL 
    END;
    
    -- Insert enhanced event record
    INSERT INTO public.events (
        workspace_id, user_id, event_type, entity_type, entity_id,
        old_values, new_values, delta,
        category, severity, source, correlation_id,
        related_entity_type, related_entity_id, context, tags,
        ip_address, user_agent, session_id
    ) VALUES (
        p_workspace_id, p_user_id, p_event_type, p_entity_type, p_entity_id,
        p_old_values, p_new_values, delta_values,
        p_category, p_severity, p_source, p_correlation_id,
        p_related_entity_type, p_related_entity_id, p_context, p_tags,
        p_ip_address, p_user_agent, p_session_id
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user authentication events
CREATE OR REPLACE FUNCTION log_auth_event(
    p_user_id UUID,
    p_event_type TEXT, -- 'login', 'logout', 'login_failed', etc.
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
    RETURN log_enhanced_event(
        p_workspace_id := NULL,
        p_user_id := p_user_id,
        p_event_type := p_event_type,
        p_entity_type := 'session',
        p_entity_id := NULL,
        p_category := 'security',
        p_severity := CASE 
            WHEN p_event_type = 'login_failed' THEN 'warning'
            WHEN p_event_type = 'suspicious_activity' THEN 'error'
            ELSE 'info'
        END,
        p_source := 'web',
        p_context := p_context,
        p_tags := ARRAY[p_event_type, 'authentication'],
        p_ip_address := p_ip_address,
        p_user_agent := p_user_agent,
        p_session_id := p_session_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log search activities
CREATE OR REPLACE FUNCTION log_search_event(
    p_user_id UUID,
    p_workspace_id UUID DEFAULT NULL,
    p_search_query TEXT DEFAULT '',
    p_search_type TEXT DEFAULT 'general',
    p_filters JSONB DEFAULT '{}',
    p_results_count INTEGER DEFAULT 0,
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
    RETURN log_enhanced_event(
        p_workspace_id := p_workspace_id,
        p_user_id := p_user_id,
        p_event_type := 'search_performed',
        p_entity_type := 'workspace',
        p_entity_id := p_workspace_id,
        p_category := 'user_action',
        p_severity := 'debug',
        p_source := 'web',
        p_context := jsonb_build_object(
            'query', p_search_query,
            'type', p_search_type,
            'filters', p_filters,
            'results_count', p_results_count,
            'execution_time_ms', p_execution_time_ms
        ),
        p_tags := ARRAY['search', p_search_type]
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced trigger function for automatic event logging
CREATE OR REPLACE FUNCTION log_enhanced_automatic_event()
RETURNS TRIGGER AS $$
DECLARE
    event_type_val TEXT;
    workspace_id_val UUID;
    old_vals JSONB;
    new_vals JSONB;
    category_val TEXT := 'user_action';
    correlation_id_val UUID;
BEGIN
    -- Generate correlation ID for related operations
    correlation_id_val := gen_random_uuid();
    
    -- Determine event type based on operation
    IF TG_OP = 'INSERT' THEN
        event_type_val := 'created';
        old_vals := NULL;
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        -- Detect specific types of updates
        event_type_val := CASE 
            WHEN TG_TABLE_NAME = 'tasks' AND OLD.status != NEW.status THEN 'status_changed'
            WHEN TG_TABLE_NAME = 'tasks' AND OLD.assigned_to_user_id != NEW.assigned_to_user_id THEN 'reassigned'
            WHEN TG_TABLE_NAME = 'tasks' AND OLD.section_id != NEW.section_id THEN 'moved'
            WHEN TG_TABLE_NAME = 'tasks' AND OLD.position != NEW.position THEN 'reordered'
            WHEN TG_TABLE_NAME = 'sections' AND OLD.is_archived != NEW.is_archived THEN 
                CASE WHEN NEW.is_archived THEN 'archived' ELSE 'unarchived' END
            ELSE 'updated'
        END;
        old_vals := to_jsonb(OLD);
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        event_type_val := CASE 
            WHEN OLD.is_deleted THEN 'deleted'
            ELSE 'deleted'
        END;
        old_vals := to_jsonb(OLD);
        new_vals := NULL;
    END IF;

    -- Extract workspace_id based on table
    workspace_id_val := CASE TG_TABLE_NAME
        WHEN 'workspaces' THEN 
            COALESCE(NEW.id, OLD.id)
        WHEN 'workspace_members' THEN 
            COALESCE(NEW.workspace_id, OLD.workspace_id)
        WHEN 'sections' THEN 
            COALESCE(NEW.workspace_id, OLD.workspace_id)
        WHEN 'tasks' THEN 
            COALESCE(NEW.workspace_id, OLD.workspace_id)
        ELSE NULL
    END;
    
    -- Determine category based on event type and table
    category_val := CASE 
        WHEN event_type_val IN ('login', 'logout', 'login_failed') THEN 'security'
        WHEN event_type_val IN ('member_added', 'member_removed', 'role_changed') THEN 'security'
        WHEN TG_TABLE_NAME = 'events' THEN 'system'
        ELSE 'user_action'
    END;

    -- Insert enhanced event record
    PERFORM log_enhanced_event(
        p_workspace_id := workspace_id_val,
        p_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID,
        p_event_type := event_type_val,
        p_entity_type := TG_TABLE_NAME,
        p_entity_id := COALESCE(NEW.id, OLD.id),
        p_old_values := old_vals,
        p_new_values := new_vals,
        p_category := category_val,
        p_severity := 'info',
        p_source := COALESCE(current_setting('app.request_source', true), 'web'),
        p_correlation_id := correlation_id_val,
        p_context := jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'trigger_name', TG_NAME
        ),
        p_tags := ARRAY[TG_TABLE_NAME, TG_OP::text],
        p_ip_address := NULLIF(current_setting('app.client_ip', true), '')::INET,
        p_user_agent := current_setting('app.user_agent', true),
        p_session_id := current_setting('app.session_id', true)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace existing triggers with enhanced version
DROP TRIGGER IF EXISTS log_workspace_events ON public.workspaces;
DROP TRIGGER IF EXISTS log_workspace_member_events ON public.workspace_members;
DROP TRIGGER IF EXISTS log_section_events ON public.sections;
DROP TRIGGER IF EXISTS log_task_events ON public.tasks;

CREATE TRIGGER log_workspace_events_enhanced 
    AFTER INSERT OR UPDATE OR DELETE ON public.workspaces 
    FOR EACH ROW EXECUTE FUNCTION log_enhanced_automatic_event();

CREATE TRIGGER log_workspace_member_events_enhanced 
    AFTER INSERT OR UPDATE OR DELETE ON public.workspace_members 
    FOR EACH ROW EXECUTE FUNCTION log_enhanced_automatic_event();

CREATE TRIGGER log_section_events_enhanced 
    AFTER INSERT OR UPDATE OR DELETE ON public.sections 
    FOR EACH ROW EXECUTE FUNCTION log_enhanced_automatic_event();

CREATE TRIGGER log_task_events_enhanced 
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION log_enhanced_automatic_event();

-- =============================================
-- ACTIVITY AGGREGATION FUNCTIONS
-- =============================================

-- Function to aggregate user activity for a specific time period
CREATE OR REPLACE FUNCTION aggregate_user_activity(
    p_user_id UUID DEFAULT NULL,
    p_workspace_id UUID DEFAULT NULL,
    p_period_start TIMESTAMPTZ DEFAULT date_trunc('day', now() - INTERVAL '1 day'),
    p_period_end TIMESTAMPTZ DEFAULT date_trunc('day', now()),
    p_period_type TEXT DEFAULT 'day'
)
RETURNS VOID AS $$
DECLARE
    activity_record RECORD;
BEGIN
    -- Loop through users (if user_id is NULL, process all users)
    FOR activity_record IN 
        SELECT DISTINCT 
            e.user_id,
            COALESCE(e.workspace_id, p_workspace_id) as workspace_id
        FROM public.events e
        WHERE (p_user_id IS NULL OR e.user_id = p_user_id)
          AND (p_workspace_id IS NULL OR e.workspace_id = p_workspace_id)
          AND e.created_at >= p_period_start 
          AND e.created_at < p_period_end
          AND NOT e.is_deleted
          AND e.user_id IS NOT NULL
    LOOP
        -- Insert or update activity summary
        INSERT INTO public.user_activity_summary (
            user_id, workspace_id, period_start, period_end, period_type,
            total_events,
            tasks_created,
            tasks_completed,
            tasks_updated,
            sections_created,
            workspaces_created,
            searches_performed,
            logins,
            active_minutes,
            last_activity_at,
            most_active_hour
        )
        SELECT 
            activity_record.user_id,
            activity_record.workspace_id,
            p_period_start,
            p_period_end,
            p_period_type,
            COUNT(*) as total_events,
            COUNT(*) FILTER (WHERE entity_type = 'task' AND event_type = 'created') as tasks_created,
            COUNT(*) FILTER (WHERE entity_type = 'task' AND event_type IN ('completed', 'status_changed') 
                           AND new_values->>'status' = 'completed') as tasks_completed,
            COUNT(*) FILTER (WHERE entity_type = 'task' AND event_type = 'updated') as tasks_updated,
            COUNT(*) FILTER (WHERE entity_type = 'section' AND event_type = 'created') as sections_created,
            COUNT(*) FILTER (WHERE entity_type = 'workspace' AND event_type = 'created') as workspaces_created,
            COUNT(*) FILTER (WHERE event_type = 'search_performed') as searches_performed,
            COUNT(*) FILTER (WHERE event_type = 'login') as logins,
            GREATEST(1, EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 60)::INTEGER as active_minutes,
            MAX(created_at) as last_activity_at,
            MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM created_at)) as most_active_hour
        FROM public.events e
        WHERE e.user_id = activity_record.user_id
          AND (activity_record.workspace_id IS NULL OR e.workspace_id = activity_record.workspace_id)
          AND e.created_at >= p_period_start 
          AND e.created_at < p_period_end
          AND NOT e.is_deleted
        ON CONFLICT (user_id, workspace_id, period_start, period_type) 
        DO UPDATE SET
            total_events = EXCLUDED.total_events,
            tasks_created = EXCLUDED.tasks_created,
            tasks_completed = EXCLUDED.tasks_completed,
            tasks_updated = EXCLUDED.tasks_updated,
            sections_created = EXCLUDED.sections_created,
            workspaces_created = EXCLUDED.workspaces_created,
            searches_performed = EXCLUDED.searches_performed,
            logins = EXCLUDED.logins,
            active_minutes = EXCLUDED.active_minutes,
            last_activity_at = EXCLUDED.last_activity_at,
            most_active_hour = EXCLUDED.most_active_hour,
            updated_at = now();
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate event category statistics
CREATE OR REPLACE FUNCTION aggregate_event_category_stats(
    p_workspace_id UUID DEFAULT NULL,
    p_period_start TIMESTAMPTZ DEFAULT date_trunc('day', now() - INTERVAL '1 day'),
    p_period_end TIMESTAMPTZ DEFAULT date_trunc('day', now()),
    p_period_type TEXT DEFAULT 'day'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.event_category_stats (
        workspace_id, period_start, period_end, period_type,
        category, event_type, entity_type,
        event_count, unique_users, unique_entities
    )
    SELECT 
        e.workspace_id,
        p_period_start,
        p_period_end,
        p_period_type,
        e.category,
        e.event_type,
        e.entity_type,
        COUNT(*) as event_count,
        COUNT(DISTINCT e.user_id) as unique_users,
        COUNT(DISTINCT e.entity_id) as unique_entities
    FROM public.events e
    WHERE (p_workspace_id IS NULL OR e.workspace_id = p_workspace_id)
      AND e.created_at >= p_period_start 
      AND e.created_at < p_period_end
      AND NOT e.is_deleted
    GROUP BY e.workspace_id, e.category, e.event_type, e.entity_type
    ON CONFLICT (workspace_id, period_start, period_type, category, event_type, entity_type) 
    DO UPDATE SET
        event_count = EXCLUDED.event_count,
        unique_users = EXCLUDED.unique_users,
        unique_entities = EXCLUDED.unique_entities,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ACTIVITY QUERY FUNCTIONS
-- =============================================

-- Function to get recent activity for a user or workspace
CREATE OR REPLACE FUNCTION get_recent_activity(
    p_workspace_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    event_type TEXT,
    entity_type TEXT,
    entity_id UUID,
    user_name TEXT,
    workspace_name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ,
    category TEXT,
    severity TEXT,
    context JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.event_type,
        e.entity_type,
        e.entity_id,
        u.name as user_name,
        w.name as workspace_name,
        CASE e.entity_type
            WHEN 'task' THEN COALESCE(e.new_values->>'title', e.old_values->>'title', 'Unknown Task')
            WHEN 'section' THEN COALESCE(e.new_values->>'name', e.old_values->>'name', 'Unknown Section')
            WHEN 'workspace' THEN COALESCE(e.new_values->>'name', e.old_values->>'name', 'Unknown Workspace')
            ELSE 'System Event'
        END as description,
        e.created_at,
        e.category,
        e.severity,
        e.context
    FROM public.events e
    LEFT JOIN public.users u ON e.user_id = u.id
    LEFT JOIN public.workspaces w ON e.workspace_id = w.id
    WHERE (p_workspace_id IS NULL OR e.workspace_id = p_workspace_id)
      AND (p_user_id IS NULL OR e.user_id = p_user_id)
      AND (p_categories IS NULL OR e.category = ANY(p_categories))
      AND NOT e.is_deleted
    ORDER BY e.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity timeline for an entity
CREATE OR REPLACE FUNCTION get_entity_activity_timeline(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    event_type TEXT,
    user_name TEXT,
    old_values JSONB,
    new_values JSONB,
    delta JSONB,
    created_at TIMESTAMPTZ,
    correlation_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.event_type,
        u.name as user_name,
        e.old_values,
        e.new_values,
        e.delta,
        e.created_at,
        e.correlation_id
    FROM public.events e
    LEFT JOIN public.users u ON e.user_id = u.id
    WHERE e.entity_type = p_entity_type
      AND e.entity_id = p_entity_id
      AND NOT e.is_deleted
    ORDER BY e.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS FOR ACTIVITY SUMMARY UPDATES
-- =============================================

-- Add triggers for activity summary updates
CREATE TRIGGER update_user_activity_summary_updated_at 
    BEFORE UPDATE ON public.user_activity_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_category_stats_updated_at 
    BEFORE UPDATE ON public.event_category_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CLEANUP AND ARCHIVAL FUNCTIONS
-- =============================================

-- Function to archive old events (move to cold storage or delete)
CREATE OR REPLACE FUNCTION archive_old_events(
    p_older_than_days INTEGER DEFAULT 365,
    p_keep_critical BOOLEAN DEFAULT true
)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Soft delete old events, keeping critical security events
    UPDATE public.events 
    SET is_deleted = true, updated_at = now()
    WHERE created_at < now() - INTERVAL '1 day' * p_older_than_days
      AND NOT is_deleted
      AND (NOT p_keep_critical OR (category != 'security' OR severity NOT IN ('error', 'critical')));
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old activity summaries
CREATE OR REPLACE FUNCTION cleanup_old_activity_summaries(
    p_older_than_days INTEGER DEFAULT 180
)
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    DELETE FROM public.user_activity_summary 
    WHERE period_start < now() - INTERVAL '1 day' * p_older_than_days
      AND period_type = 'hour'; -- Keep daily/weekly/monthly summaries longer
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SESSION CONTEXT FUNCTION
-- =============================================

-- Function to set session context variables for event logging
CREATE OR REPLACE FUNCTION set_session_context(
    user_id UUID DEFAULT NULL,
    session_id TEXT DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    source TEXT DEFAULT 'web'
)
RETURNS VOID AS $$
BEGIN
    -- Set session variables for use in triggers
    PERFORM set_config('app.current_user_id', COALESCE(user_id::text, ''), true);
    PERFORM set_config('app.session_id', COALESCE(session_id, ''), true);
    PERFORM set_config('app.client_ip', COALESCE(ip_address::text, ''), true);
    PERFORM set_config('app.user_agent', COALESCE(user_agent, ''), true);
    PERFORM set_config('app.request_source', COALESCE(source, 'web'), true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PERMISSIONS AND SECURITY
-- =============================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_enhanced_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_auth_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_search_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_entity_activity_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION set_session_context TO authenticated;

-- Admin-only functions
GRANT EXECUTE ON FUNCTION aggregate_user_activity TO service_role;
GRANT EXECUTE ON FUNCTION aggregate_event_category_stats TO service_role;
GRANT EXECUTE ON FUNCTION archive_old_events TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_activity_summaries TO service_role;

COMMENT ON TABLE public.events IS 'Comprehensive audit log for all system events with enhanced tracking capabilities';
COMMENT ON TABLE public.user_activity_summary IS 'Aggregated user activity statistics for analytics and dashboards';
COMMENT ON TABLE public.event_category_stats IS 'Event category statistics for workspace analytics';

COMMENT ON FUNCTION log_enhanced_event IS 'Enhanced event logging with comprehensive context and metadata';
COMMENT ON FUNCTION log_auth_event IS 'Specialized function for logging authentication and security events';
COMMENT ON FUNCTION log_search_event IS 'Function for logging search activities with performance metrics';
COMMENT ON FUNCTION get_recent_activity IS 'Query function for retrieving recent activity feeds';
COMMENT ON FUNCTION get_entity_activity_timeline IS 'Query function for entity-specific activity history';