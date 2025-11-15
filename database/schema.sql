-- =============================================
-- TODO LIST APPLICATION - DATABASE SCHEMA
-- =============================================
-- Supabase PostgreSQL schema for collaborative todo app
-- Features: Workspace > Section > Task hierarchy
-- Authentication: Google OAuth via Supabase Auth
-- Architecture: Multi-tenant with RLS

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    google_id TEXT UNIQUE, -- Google OAuth ID for linking
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}', -- UI preferences, settings
    last_active_at TIMESTAMPTZ,
    
    -- Standard audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_timezone_check CHECK (timezone IS NOT NULL)
);

-- Workspaces table (top-level organization)
CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    color TEXT DEFAULT '#6366f1', -- For UI theming
    icon TEXT, -- Icon identifier for UI
    settings JSONB DEFAULT '{}', -- Workspace-specific settings
    
    -- Standard audit fields  
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT workspaces_name_check CHECK (length(trim(name)) >= 1 AND length(trim(name)) <= 100),
    CONSTRAINT workspaces_color_check CHECK (color ~* '^#[0-9a-f]{6}$')
);

-- Workspace members junction table (many-to-many)
CREATE TABLE public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{"read": true, "write": true, "delete": false, "admin": false}',
    invited_by_user_id UUID REFERENCES public.users(id),
    invitation_accepted_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    
    -- Standard audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT workspace_members_unique_membership UNIQUE (workspace_id, user_id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT workspace_members_role_check CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    CONSTRAINT workspace_members_self_invite_check CHECK (user_id != invited_by_user_id)
);

-- Sections table (groups within workspaces)
CREATE TABLE public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0, -- For ordering within workspace
    color TEXT DEFAULT '#6b7280',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    
    -- Standard audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), 
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT sections_name_check CHECK (length(trim(name)) >= 1 AND length(trim(name)) <= 100),
    CONSTRAINT sections_position_check CHECK (position >= 0),
    CONSTRAINT sections_color_check CHECK (color ~* '^#[0-9a-f]{6}$'),
    CONSTRAINT sections_unique_position UNIQUE (workspace_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- Tasks table (individual todo items)
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, -- Denormalized for performance
    
    -- Task content
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    
    -- Assignment and dates
    assigned_to_user_id UUID REFERENCES public.users(id),
    created_by_user_id UUID NOT NULL REFERENCES public.users(id),
    
    -- Date fields
    start_date DATE,
    end_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Organization
    position INTEGER NOT NULL DEFAULT 0, -- For ordering within section
    tags TEXT[] DEFAULT '{}', -- Array of tag strings
    
    -- Metadata
    estimated_hours DECIMAL(5,2), -- Time estimation
    actual_hours DECIMAL(5,2), -- Time tracking
    attachments JSONB DEFAULT '[]', -- File references
    
    -- Search optimization
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
    ) STORED,
    
    -- Standard audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT tasks_title_check CHECK (length(trim(title)) >= 1 AND length(trim(title)) <= 500),
    CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT tasks_position_check CHECK (position >= 0),
    CONSTRAINT tasks_date_logic_check CHECK (
        (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) AND
        (due_date IS NULL OR start_date IS NULL OR start_date <= due_date)
    ),
    CONSTRAINT tasks_hours_check CHECK (
        (estimated_hours IS NULL OR estimated_hours > 0) AND
        (actual_hours IS NULL OR actual_hours >= 0)
    ),
    CONSTRAINT tasks_completed_status_check CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR 
        (status != 'completed' AND completed_at IS NULL)
    ),
    CONSTRAINT tasks_unique_position UNIQUE (section_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- Events table (comprehensive audit log)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Event details
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'workspace', 'section', 'task', 'user'
    entity_id UUID, -- ID of the affected entity
    
    -- Change tracking
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    delta JSONB, -- Computed differences
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Standard audit fields (no soft delete for audit records)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT events_type_check CHECK (event_type IN (
        'created', 'updated', 'deleted', 'restored', 'archived', 'unarchived',
        'assigned', 'unassigned', 'status_changed', 'moved', 'completed',
        'member_added', 'member_removed', 'role_changed', 'permission_changed'
    )),
    CONSTRAINT events_entity_type_check CHECK (entity_type IN (
        'user', 'workspace', 'workspace_member', 'section', 'task'
    ))
);

-- =============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================

-- Users indexes
CREATE INDEX CONCURRENTLY idx_users_email ON public.users(email) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_users_google_id ON public.users(google_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_users_active_not_deleted ON public.users(last_active_at DESC) WHERE NOT is_deleted;

-- Workspaces indexes  
CREATE INDEX CONCURRENTLY idx_workspaces_owner ON public.workspaces(owner_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_workspaces_created ON public.workspaces(created_at DESC) WHERE NOT is_deleted;

-- Workspace members indexes
CREATE INDEX CONCURRENTLY idx_workspace_members_workspace ON public.workspace_members(workspace_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_workspace_members_user ON public.workspace_members(user_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_workspace_members_role ON public.workspace_members(workspace_id, role) WHERE NOT is_deleted;

-- Sections indexes
CREATE INDEX CONCURRENTLY idx_sections_workspace ON public.sections(workspace_id, position) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_sections_archived ON public.sections(workspace_id, is_archived, position) WHERE NOT is_deleted;

-- Tasks indexes (critical for performance)
CREATE INDEX CONCURRENTLY idx_tasks_section ON public.tasks(section_id, position) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_tasks_workspace ON public.tasks(workspace_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_tasks_assigned_user ON public.tasks(assigned_to_user_id) WHERE NOT is_deleted AND assigned_to_user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_tasks_created_by ON public.tasks(created_by_user_id) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_tasks_status ON public.tasks(workspace_id, status) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_tasks_priority ON public.tasks(workspace_id, priority) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_tasks_due_date ON public.tasks(due_date) WHERE NOT is_deleted AND due_date IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_tasks_search ON public.tasks USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_tasks_tags ON public.tasks USING GIN(tags) WHERE NOT is_deleted;

-- Events indexes (for audit queries)
CREATE INDEX CONCURRENTLY idx_events_workspace ON public.events(workspace_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_events_user ON public.events(user_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_events_entity ON public.events(entity_type, entity_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_events_type ON public.events(event_type, created_at DESC) WHERE NOT is_deleted;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_tasks_workspace_status_priority ON public.tasks(workspace_id, status, priority, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX CONCURRENTLY idx_tasks_assigned_status ON public.tasks(assigned_to_user_id, status, due_date) WHERE NOT is_deleted AND assigned_to_user_id IS NOT NULL;

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspace_members_updated_at BEFORE UPDATE ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for event logging
CREATE OR REPLACE FUNCTION log_event()
RETURNS TRIGGER AS $$
DECLARE
    event_type_val TEXT;
    workspace_id_val UUID;
    old_vals JSONB;
    new_vals JSONB;
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
        current_setting('app.current_user_id', true)::UUID,
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

-- Apply event logging triggers (excluding events table itself)
CREATE TRIGGER log_workspace_events AFTER INSERT OR UPDATE OR DELETE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION log_event();
CREATE TRIGGER log_workspace_member_events AFTER INSERT OR UPDATE OR DELETE ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION log_event();
CREATE TRIGGER log_section_events AFTER INSERT OR UPDATE OR DELETE ON public.sections FOR EACH ROW EXECUTE FUNCTION log_event();
CREATE TRIGGER log_task_events AFTER INSERT OR UPDATE OR DELETE ON public.tasks FOR EACH ROW EXECUTE FUNCTION log_event();

-- Function to handle workspace owner changes
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

CREATE TRIGGER ensure_workspace_owner_membership_trigger 
    AFTER INSERT OR UPDATE OF owner_id ON public.workspaces 
    FOR EACH ROW EXECUTE FUNCTION ensure_workspace_owner_membership();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Users policies - users can read their own data and basic info of workspace members
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read workspace member profiles" ON public.users
    FOR SELECT USING (
        id IN (
            SELECT wm.user_id 
            FROM public.workspace_members wm 
            WHERE wm.workspace_id IN (
                SELECT workspace_id 
                FROM public.workspace_members 
                WHERE user_id = auth.uid() AND NOT is_deleted
            ) AND NOT wm.is_deleted
        )
    );

-- Workspaces policies
CREATE POLICY "Users can read accessible workspaces" ON public.workspaces
    FOR SELECT USING (
        NOT is_deleted AND (
            owner_id = auth.uid() OR 
            id IN (
                SELECT workspace_id 
                FROM public.workspace_members 
                WHERE user_id = auth.uid() AND NOT is_deleted
            )
        )
    );

CREATE POLICY "Workspace owners can update workspaces" ON public.workspaces
    FOR UPDATE USING (owner_id = auth.uid() AND NOT is_deleted);

CREATE POLICY "Users can create workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can delete workspaces" ON public.workspaces
    FOR DELETE USING (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "Users can read workspace memberships" ON public.workspace_members
    FOR SELECT USING (
        NOT is_deleted AND 
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() AND NOT is_deleted
        )
    );

CREATE POLICY "Workspace admins can manage memberships" ON public.workspace_members
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin') 
                AND NOT is_deleted
        )
    );

-- Sections policies  
CREATE POLICY "Users can read workspace sections" ON public.sections
    FOR SELECT USING (
        NOT is_deleted AND 
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() AND NOT is_deleted
        )
    );

CREATE POLICY "Users with write permission can modify sections" ON public.sections
    FOR ALL USING (
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM public.workspace_members wm 
            WHERE wm.user_id = auth.uid() 
                AND NOT wm.is_deleted 
                AND (wm.permissions->>'write')::BOOLEAN = true
        )
    );

-- Tasks policies
CREATE POLICY "Users can read workspace tasks" ON public.tasks  
    FOR SELECT USING (
        NOT is_deleted AND 
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() AND NOT is_deleted
        )
    );

CREATE POLICY "Users with write permission can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM public.workspace_members wm 
            WHERE wm.user_id = auth.uid() 
                AND NOT wm.is_deleted 
                AND (wm.permissions->>'write')::BOOLEAN = true
        ) AND created_by_user_id = auth.uid()
    );

CREATE POLICY "Task creators and workspace writers can update tasks" ON public.tasks
    FOR UPDATE USING (
        NOT is_deleted AND (
            created_by_user_id = auth.uid() OR
            assigned_to_user_id = auth.uid() OR
            workspace_id IN (
                SELECT wm.workspace_id 
                FROM public.workspace_members wm 
                WHERE wm.user_id = auth.uid() 
                    AND NOT wm.is_deleted 
                    AND (wm.permissions->>'write')::BOOLEAN = true
            )
        )
    );

CREATE POLICY "Users with delete permission can delete tasks" ON public.tasks
    FOR DELETE USING (
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM public.workspace_members wm 
            WHERE wm.user_id = auth.uid() 
                AND NOT wm.is_deleted 
                AND (wm.permissions->>'delete')::BOOLEAN = true
        ) OR created_by_user_id = auth.uid()
    );

-- Events policies (read-only for workspace members)
CREATE POLICY "Users can read workspace events" ON public.events
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() AND NOT is_deleted
        ) OR user_id = auth.uid()
    );

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- View for user's workspace access summary
CREATE VIEW user_workspace_access AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    w.id as workspace_id,
    w.name as workspace_name,
    wm.role,
    wm.permissions,
    wm.created_at as joined_at,
    wm.last_active_at
FROM public.users u
JOIN public.workspace_members wm ON u.id = wm.user_id
JOIN public.workspaces w ON wm.workspace_id = w.id  
WHERE NOT u.is_deleted 
    AND NOT wm.is_deleted 
    AND NOT w.is_deleted;

-- View for task summary with assignee info
CREATE VIEW task_summary AS
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.due_date,
    t.workspace_id,
    w.name as workspace_name,
    t.section_id,
    s.name as section_name,
    t.assigned_to_user_id,
    au.name as assignee_name,
    au.email as assignee_email,
    t.created_by_user_id,
    cu.name as creator_name,
    t.created_at,
    t.updated_at
FROM public.tasks t
JOIN public.sections s ON t.section_id = s.id
JOIN public.workspaces w ON t.workspace_id = w.id
JOIN public.users cu ON t.created_by_user_id = cu.id
LEFT JOIN public.users au ON t.assigned_to_user_id = au.id
WHERE NOT t.is_deleted 
    AND NOT s.is_deleted 
    AND NOT w.is_deleted;