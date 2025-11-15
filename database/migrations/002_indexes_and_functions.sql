-- =============================================
-- MIGRATION 002: INDEXES, FUNCTIONS & TRIGGERS
-- =============================================
-- Adds performance indexes, utility functions, and audit triggers
-- Run after migration 001

BEGIN;

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public.users(email) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_google_id ON public.users(google_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_not_deleted ON public.users(last_active_at DESC) WHERE NOT is_deleted;

-- Workspaces indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_created ON public.workspaces(created_at DESC) WHERE NOT is_deleted;

-- Workspace members indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_members_role ON public.workspace_members(workspace_id, role) WHERE NOT is_deleted;

-- Sections indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sections_workspace ON public.sections(workspace_id, position) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sections_archived ON public.sections(workspace_id, is_archived, position) WHERE NOT is_deleted;

-- Tasks indexes (critical for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_section ON public.tasks(section_id, position) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_workspace ON public.tasks(workspace_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_user ON public.tasks(assigned_to_user_id) WHERE NOT is_deleted AND assigned_to_user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by_user_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status ON public.tasks(workspace_id, status) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_priority ON public.tasks(workspace_id, priority) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE NOT is_deleted AND due_date IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_search ON public.tasks USING GIN(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tags ON public.tasks USING GIN(tags) WHERE NOT is_deleted;

-- Events indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_workspace ON public.events(workspace_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_user ON public.events(user_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_entity ON public.events(entity_type, entity_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_type ON public.events(event_type, created_at DESC) WHERE NOT is_deleted;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_workspace_status_priority ON public.tasks(workspace_id, status, priority, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_status ON public.tasks(assigned_to_user_id, status, due_date) WHERE NOT is_deleted AND assigned_to_user_id IS NOT NULL;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function for comprehensive event logging
CREATE OR REPLACE FUNCTION log_event()
RETURNS TRIGGER AS $$
DECLARE
    event_type_val TEXT;
    workspace_id_val UUID;
    old_vals JSONB;
    new_vals JSONB;
    current_user_id UUID;
BEGIN
    -- Determine event type
    IF TG_OP = 'INSERT' THEN
        event_type_val := 'created';
        old_vals := NULL;
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        event_type_val := 'updated';
        old_vals := to_jsonb(OLD);
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        event_type_val := 'deleted';
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

    -- Get current user ID safely
    BEGIN
        current_user_id := current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := auth.uid();
    END;

    -- Insert event record
    INSERT INTO public.events (
        workspace_id,
        user_id,
        event_type,
        entity_type,
        entity_id,
        old_values,
        new_values,
        delta
    ) VALUES (
        workspace_id_val,
        current_user_id,
        event_type_val,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        old_vals,
        new_vals,
        CASE 
            WHEN old_vals IS NOT NULL AND new_vals IS NOT NULL 
            THEN new_vals - old_vals 
            ELSE NULL 
        END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure workspace owner is always a member
CREATE OR REPLACE FUNCTION ensure_workspace_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure owner is always a member with owner role
    INSERT INTO public.workspace_members (workspace_id, user_id, role, permissions)
    VALUES (
        NEW.id, 
        NEW.owner_id, 
        'owner', 
        '{"read": true, "write": true, "delete": true, "admin": true}'::JSONB
    )
    ON CONFLICT (workspace_id, user_id) 
    DO UPDATE SET 
        role = 'owner',
        permissions = '{"read": true, "write": true, "delete": true, "admin": true}'::JSONB,
        updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle soft delete cascading
CREATE OR REPLACE FUNCTION soft_delete_cascade()
RETURNS TRIGGER AS $$
BEGIN
    -- When a workspace is soft deleted, soft delete related entities
    IF TG_TABLE_NAME = 'workspaces' AND NEW.is_deleted = true AND OLD.is_deleted = false THEN
        UPDATE public.workspace_members SET is_deleted = true WHERE workspace_id = NEW.id AND NOT is_deleted;
        UPDATE public.sections SET is_deleted = true WHERE workspace_id = NEW.id AND NOT is_deleted;
        UPDATE public.tasks SET is_deleted = true WHERE workspace_id = NEW.id AND NOT is_deleted;
    END IF;
    
    -- When a section is soft deleted, soft delete its tasks
    IF TG_TABLE_NAME = 'sections' AND NEW.is_deleted = true AND OLD.is_deleted = false THEN
        UPDATE public.tasks SET is_deleted = true WHERE section_id = NEW.id AND NOT is_deleted;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for search across tasks
CREATE OR REPLACE FUNCTION search_tasks(
    workspace_uuid UUID,
    search_query TEXT,
    result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    section_name TEXT,
    assignee_name TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        s.name as section_name,
        u.name as assignee_name,
        ts_rank(t.search_vector, websearch_to_tsquery('english', search_query)) as rank
    FROM public.tasks t
    JOIN public.sections s ON t.section_id = s.id
    LEFT JOIN public.users u ON t.assigned_to_user_id = u.id
    WHERE t.workspace_id = workspace_uuid
        AND NOT t.is_deleted
        AND NOT s.is_deleted
        AND (u.id IS NULL OR NOT u.is_deleted)
        AND t.search_vector @@ websearch_to_tsquery('english', search_query)
    ORDER BY rank DESC, t.updated_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;