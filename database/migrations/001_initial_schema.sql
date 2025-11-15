-- =============================================
-- MIGRATION 001: INITIAL SCHEMA
-- =============================================
-- Creates the complete todo application schema
-- Run this migration in Supabase SQL editor

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    google_id TEXT UNIQUE,
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    last_active_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_timezone_check CHECK (timezone IS NOT NULL)
);

-- Workspaces table
CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT,
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    CONSTRAINT workspaces_name_check CHECK (length(trim(name)) >= 1 AND length(trim(name)) <= 100),
    CONSTRAINT workspaces_color_check CHECK (color ~* '^#[0-9a-f]{6}$')
);

-- Workspace members junction table
CREATE TABLE public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{"read": true, "write": true, "delete": false, "admin": false}',
    invited_by_user_id UUID REFERENCES public.users(id),
    invitation_accepted_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    CONSTRAINT workspace_members_unique_membership UNIQUE (workspace_id, user_id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT workspace_members_role_check CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    CONSTRAINT workspace_members_self_invite_check CHECK (user_id != invited_by_user_id)
);

-- Sections table
CREATE TABLE public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#6b7280',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    CONSTRAINT sections_name_check CHECK (length(trim(name)) >= 1 AND length(trim(name)) <= 100),
    CONSTRAINT sections_position_check CHECK (position >= 0),
    CONSTRAINT sections_color_check CHECK (color ~* '^#[0-9a-f]{6}$'),
    CONSTRAINT sections_unique_position UNIQUE (workspace_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- Tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    
    assigned_to_user_id UUID REFERENCES public.users(id),
    created_by_user_id UUID NOT NULL REFERENCES public.users(id),
    
    start_date DATE,
    end_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    position INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    attachments JSONB DEFAULT '[]',
    
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
    ) STORED,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
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

-- Events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    
    old_values JSONB,
    new_values JSONB,
    delta JSONB,
    
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    CONSTRAINT events_type_check CHECK (event_type IN (
        'created', 'updated', 'deleted', 'restored', 'archived', 'unarchived',
        'assigned', 'unassigned', 'status_changed', 'moved', 'completed',
        'member_added', 'member_removed', 'role_changed', 'permission_changed'
    )),
    CONSTRAINT events_entity_type_check CHECK (entity_type IN (
        'user', 'workspace', 'workspace_member', 'section', 'task'
    ))
);

COMMIT;