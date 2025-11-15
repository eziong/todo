-- =============================================
-- MIGRATION 004: ROW LEVEL SECURITY POLICIES
-- =============================================
-- Implements comprehensive RLS policies for multi-tenant security
-- Run after migration 003

BEGIN;

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can read basic profile info of workspace members
DROP POLICY IF EXISTS "Users can read workspace member profiles" ON public.users;
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

-- Allow user creation during authentication
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- WORKSPACES TABLE POLICIES
-- =============================================

-- Users can read workspaces they have access to
DROP POLICY IF EXISTS "Users can read accessible workspaces" ON public.workspaces;
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

-- Users can create workspaces (they become the owner)
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
CREATE POLICY "Users can create workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Workspace owners can update their workspaces
DROP POLICY IF EXISTS "Workspace owners can update workspaces" ON public.workspaces;
CREATE POLICY "Workspace owners can update workspaces" ON public.workspaces
    FOR UPDATE USING (owner_id = auth.uid() AND NOT is_deleted);

-- Workspace owners can soft-delete their workspaces
DROP POLICY IF EXISTS "Workspace owners can delete workspaces" ON public.workspaces;
CREATE POLICY "Workspace owners can delete workspaces" ON public.workspaces
    FOR DELETE USING (owner_id = auth.uid());

-- =============================================
-- WORKSPACE MEMBERS TABLE POLICIES
-- =============================================

-- Users can read workspace memberships for workspaces they belong to
DROP POLICY IF EXISTS "Users can read workspace memberships" ON public.workspace_members;
CREATE POLICY "Users can read workspace memberships" ON public.workspace_members
    FOR SELECT USING (
        NOT is_deleted AND 
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() AND NOT is_deleted
        )
    );

-- Workspace admins and owners can add members
DROP POLICY IF EXISTS "Workspace admins can add members" ON public.workspace_members;
CREATE POLICY "Workspace admins can add members" ON public.workspace_members
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM public.workspace_members wm 
            WHERE wm.user_id = auth.uid() 
                AND NOT wm.is_deleted 
                AND wm.role IN ('owner', 'admin')
        )
    );

-- Workspace admins and owners can update memberships
DROP POLICY IF EXISTS "Workspace admins can update memberships" ON public.workspace_members;
CREATE POLICY "Workspace admins can update memberships" ON public.workspace_members
    FOR UPDATE USING (
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM public.workspace_members wm 
            WHERE wm.user_id = auth.uid() 
                AND NOT wm.is_deleted 
                AND wm.role IN ('owner', 'admin')
        )
    );

-- Workspace admins and owners can remove members
DROP POLICY IF EXISTS "Workspace admins can remove members" ON public.workspace_members;
CREATE POLICY "Workspace admins can remove members" ON public.workspace_members
    FOR DELETE USING (
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM public.workspace_members wm 
            WHERE wm.user_id = auth.uid() 
                AND NOT wm.is_deleted 
                AND wm.role IN ('owner', 'admin')
        )
    );

-- Users can leave workspaces (delete their own membership)
DROP POLICY IF EXISTS "Users can leave workspaces" ON public.workspace_members;
CREATE POLICY "Users can leave workspaces" ON public.workspace_members
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- SECTIONS TABLE POLICIES
-- =============================================

-- Users can read sections in accessible workspaces
DROP POLICY IF EXISTS "Users can read workspace sections" ON public.sections;
CREATE POLICY "Users can read workspace sections" ON public.sections
    FOR SELECT USING (
        NOT is_deleted AND 
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() AND NOT is_deleted
        )
    );

-- Users with write permission can create sections
DROP POLICY IF EXISTS "Users with write permission can create sections" ON public.sections;
CREATE POLICY "Users with write permission can create sections" ON public.sections
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM public.workspace_members wm 
            WHERE wm.user_id = auth.uid() 
                AND NOT wm.is_deleted 
                AND (wm.permissions->>'write')::BOOLEAN = true
        )
    );

-- Users with write permission can update sections
DROP POLICY IF EXISTS "Users with write permission can update sections" ON public.sections;
CREATE POLICY "Users with write permission can update sections" ON public.sections
    FOR UPDATE USING (
        NOT is_deleted AND
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM public.workspace_members wm 
            WHERE wm.user_id = auth.uid() 
                AND NOT wm.is_deleted 
                AND (wm.permissions->>'write')::BOOLEAN = true
        )
    );

-- Users with delete permission can remove sections
DROP POLICY IF EXISTS "Users with delete permission can delete sections" ON public.sections;
CREATE POLICY "Users with delete permission can delete sections" ON public.sections
    FOR DELETE USING (
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM public.workspace_members wm 
            WHERE wm.user_id = auth.uid() 
                AND NOT wm.is_deleted 
                AND (wm.permissions->>'delete')::BOOLEAN = true
        )
    );

-- =============================================
-- TASKS TABLE POLICIES
-- =============================================

-- Users can read tasks in accessible workspaces
DROP POLICY IF EXISTS "Users can read workspace tasks" ON public.tasks;
CREATE POLICY "Users can read workspace tasks" ON public.tasks
    FOR SELECT USING (
        NOT is_deleted AND 
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() AND NOT is_deleted
        )
    );

-- Users with write permission can create tasks
DROP POLICY IF EXISTS "Users with write permission can create tasks" ON public.tasks;
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

-- Task creators, assignees, and users with write permission can update tasks
DROP POLICY IF EXISTS "Authorized users can update tasks" ON public.tasks;
CREATE POLICY "Authorized users can update tasks" ON public.tasks
    FOR UPDATE USING (
        NOT is_deleted AND (
            -- Task creator can always update
            created_by_user_id = auth.uid() OR
            -- Assigned user can update task status and time tracking
            assigned_to_user_id = auth.uid() OR
            -- Users with write permission can update
            workspace_id IN (
                SELECT wm.workspace_id 
                FROM public.workspace_members wm 
                WHERE wm.user_id = auth.uid() 
                    AND NOT wm.is_deleted 
                    AND (wm.permissions->>'write')::BOOLEAN = true
            )
        )
    );

-- Task creators and users with delete permission can remove tasks
DROP POLICY IF EXISTS "Authorized users can delete tasks" ON public.tasks;
CREATE POLICY "Authorized users can delete tasks" ON public.tasks
    FOR DELETE USING (
        -- Task creator can delete
        created_by_user_id = auth.uid() OR
        -- Users with delete permission can delete
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM public.workspace_members wm 
            WHERE wm.user_id = auth.uid() 
                AND NOT wm.is_deleted 
                AND (wm.permissions->>'delete')::BOOLEAN = true
        )
    );

-- =============================================
-- EVENTS TABLE POLICIES
-- =============================================

-- Users can read events for workspaces they have access to
DROP POLICY IF EXISTS "Users can read workspace events" ON public.events;
CREATE POLICY "Users can read workspace events" ON public.events
    FOR SELECT USING (
        -- Can read events for accessible workspaces
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() AND NOT is_deleted
        ) OR 
        -- Can read their own events across all workspaces
        user_id = auth.uid()
    );

-- Events are read-only for users (only created by system triggers)
-- No INSERT, UPDATE, or DELETE policies for users

-- =============================================
-- VIEW POLICIES (if needed)
-- =============================================

-- Note: Views inherit RLS from their underlying tables
-- Additional view-specific policies can be added here if needed

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================

-- Function to check if user has specific permission in workspace
CREATE OR REPLACE FUNCTION user_has_workspace_permission(
    user_uuid UUID, 
    workspace_uuid UUID, 
    permission_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.workspace_members wm 
        WHERE wm.user_id = user_uuid 
            AND wm.workspace_id = workspace_uuid 
            AND NOT wm.is_deleted 
            AND (wm.permissions->>permission_name)::BOOLEAN = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is workspace admin or owner
CREATE OR REPLACE FUNCTION user_is_workspace_admin(
    user_uuid UUID, 
    workspace_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.workspace_members wm 
        WHERE wm.user_id = user_uuid 
            AND wm.workspace_id = workspace_uuid 
            AND NOT wm.is_deleted 
            AND wm.role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible workspace IDs
CREATE OR REPLACE FUNCTION get_user_workspace_ids(user_uuid UUID)
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT workspace_id 
        FROM public.workspace_members 
        WHERE user_id = user_uuid AND NOT is_deleted
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SECURITY GRANTS
-- =============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to tables for authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.workspaces TO authenticated;
GRANT ALL ON public.workspace_members TO authenticated;
GRANT ALL ON public.sections TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT SELECT ON public.events TO authenticated;

-- Grant access to views
GRANT SELECT ON user_workspace_access TO authenticated;
GRANT SELECT ON task_summary TO authenticated;
GRANT SELECT ON workspace_stats TO authenticated;
GRANT SELECT ON task_activity TO authenticated;
GRANT SELECT ON task_search_index TO authenticated;

-- Grant access to sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION search_tasks(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_workspace_permission(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_is_workspace_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_workspace_ids(UUID) TO authenticated;

COMMIT;