-- =============================================
-- MIGRATION 003: TRIGGERS AND VIEWS
-- =============================================
-- Adds automated triggers and helpful views
-- Run after migration 002

BEGIN;

-- =============================================
-- TRIGGERS FOR AUTOMATION
-- =============================================

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER update_workspaces_updated_at 
    BEFORE UPDATE ON public.workspaces 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspace_members_updated_at ON public.workspace_members;
CREATE TRIGGER update_workspace_members_updated_at 
    BEFORE UPDATE ON public.workspace_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sections_updated_at ON public.sections;
CREATE TRIGGER update_sections_updated_at 
    BEFORE UPDATE ON public.sections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply event logging triggers (excluding events table itself)
DROP TRIGGER IF EXISTS log_workspace_events ON public.workspaces;
CREATE TRIGGER log_workspace_events 
    AFTER INSERT OR UPDATE OR DELETE ON public.workspaces 
    FOR EACH ROW EXECUTE FUNCTION log_event();

DROP TRIGGER IF EXISTS log_workspace_member_events ON public.workspace_members;
CREATE TRIGGER log_workspace_member_events 
    AFTER INSERT OR UPDATE OR DELETE ON public.workspace_members 
    FOR EACH ROW EXECUTE FUNCTION log_event();

DROP TRIGGER IF EXISTS log_section_events ON public.sections;
CREATE TRIGGER log_section_events 
    AFTER INSERT OR UPDATE OR DELETE ON public.sections 
    FOR EACH ROW EXECUTE FUNCTION log_event();

DROP TRIGGER IF EXISTS log_task_events ON public.tasks;
CREATE TRIGGER log_task_events 
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION log_event();

-- Workspace owner membership trigger
DROP TRIGGER IF EXISTS ensure_workspace_owner_membership_trigger ON public.workspaces;
CREATE TRIGGER ensure_workspace_owner_membership_trigger 
    AFTER INSERT OR UPDATE OF owner_id ON public.workspaces 
    FOR EACH ROW EXECUTE FUNCTION ensure_workspace_owner_membership();

-- Soft delete cascade triggers
DROP TRIGGER IF EXISTS soft_delete_workspace_cascade ON public.workspaces;
CREATE TRIGGER soft_delete_workspace_cascade 
    AFTER UPDATE OF is_deleted ON public.workspaces 
    FOR EACH ROW EXECUTE FUNCTION soft_delete_cascade();

DROP TRIGGER IF EXISTS soft_delete_section_cascade ON public.sections;
CREATE TRIGGER soft_delete_section_cascade 
    AFTER UPDATE OF is_deleted ON public.sections 
    FOR EACH ROW EXECUTE FUNCTION soft_delete_cascade();

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS user_workspace_access;
DROP VIEW IF EXISTS task_summary;
DROP VIEW IF EXISTS workspace_stats;
DROP VIEW IF EXISTS task_activity;

-- User workspace access summary
CREATE VIEW user_workspace_access AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.avatar_url,
    w.id as workspace_id,
    w.name as workspace_name,
    w.color as workspace_color,
    w.icon as workspace_icon,
    wm.role,
    wm.permissions,
    wm.created_at as joined_at,
    wm.last_active_at,
    wm.invitation_accepted_at
FROM public.users u
JOIN public.workspace_members wm ON u.id = wm.user_id
JOIN public.workspaces w ON wm.workspace_id = w.id  
WHERE NOT u.is_deleted 
    AND NOT wm.is_deleted 
    AND NOT w.is_deleted;

-- Comprehensive task summary with related data
CREATE VIEW task_summary AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.start_date,
    t.end_date,
    t.due_date,
    t.completed_at,
    t.position,
    t.tags,
    t.estimated_hours,
    t.actual_hours,
    t.workspace_id,
    w.name as workspace_name,
    w.color as workspace_color,
    t.section_id,
    s.name as section_name,
    s.color as section_color,
    s.position as section_position,
    t.assigned_to_user_id,
    au.name as assignee_name,
    au.email as assignee_email,
    au.avatar_url as assignee_avatar,
    t.created_by_user_id,
    cu.name as creator_name,
    cu.email as creator_email,
    t.created_at,
    t.updated_at,
    -- Computed fields
    CASE 
        WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE AND t.status != 'completed' 
        THEN true 
        ELSE false 
    END as is_overdue,
    CASE 
        WHEN t.due_date IS NOT NULL AND t.due_date <= CURRENT_DATE + INTERVAL '3 days' AND t.status != 'completed' 
        THEN true 
        ELSE false 
    END as is_due_soon
FROM public.tasks t
JOIN public.sections s ON t.section_id = s.id
JOIN public.workspaces w ON t.workspace_id = w.id
JOIN public.users cu ON t.created_by_user_id = cu.id
LEFT JOIN public.users au ON t.assigned_to_user_id = au.id
WHERE NOT t.is_deleted 
    AND NOT s.is_deleted 
    AND NOT w.is_deleted
    AND NOT cu.is_deleted
    AND (au.id IS NULL OR NOT au.is_deleted);

-- Workspace statistics view
CREATE VIEW workspace_stats AS
SELECT 
    w.id as workspace_id,
    w.name as workspace_name,
    w.owner_id,
    -- Member counts
    COUNT(DISTINCT wm.user_id) as total_members,
    COUNT(DISTINCT CASE WHEN wm.role = 'owner' THEN wm.user_id END) as owners_count,
    COUNT(DISTINCT CASE WHEN wm.role = 'admin' THEN wm.user_id END) as admins_count,
    COUNT(DISTINCT CASE WHEN wm.role = 'member' THEN wm.user_id END) as members_count,
    COUNT(DISTINCT CASE WHEN wm.role = 'viewer' THEN wm.user_id END) as viewers_count,
    -- Section counts
    COUNT(DISTINCT s.id) as total_sections,
    COUNT(DISTINCT CASE WHEN s.is_archived THEN s.id END) as archived_sections,
    -- Task counts
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) as todo_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'cancelled' THEN t.id END) as cancelled_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'on_hold' THEN t.id END) as on_hold_tasks,
    -- Priority counts
    COUNT(DISTINCT CASE WHEN t.priority = 'urgent' THEN t.id END) as urgent_tasks,
    COUNT(DISTINCT CASE WHEN t.priority = 'high' THEN t.id END) as high_priority_tasks,
    COUNT(DISTINCT CASE WHEN t.priority = 'medium' THEN t.id END) as medium_priority_tasks,
    COUNT(DISTINCT CASE WHEN t.priority = 'low' THEN t.id END) as low_priority_tasks,
    -- Overdue tasks
    COUNT(DISTINCT CASE 
        WHEN t.due_date IS NOT NULL 
            AND t.due_date < CURRENT_DATE 
            AND t.status != 'completed' 
        THEN t.id 
    END) as overdue_tasks,
    -- Activity metrics
    MAX(wm.last_active_at) as last_member_activity,
    MAX(t.updated_at) as last_task_update,
    w.created_at,
    w.updated_at
FROM public.workspaces w
LEFT JOIN public.workspace_members wm ON w.id = wm.workspace_id AND NOT wm.is_deleted
LEFT JOIN public.sections s ON w.id = s.workspace_id AND NOT s.is_deleted
LEFT JOIN public.tasks t ON w.id = t.workspace_id AND NOT t.is_deleted
WHERE NOT w.is_deleted
GROUP BY w.id, w.name, w.owner_id, w.created_at, w.updated_at;

-- Recent task activity view
CREATE VIEW task_activity AS
SELECT 
    t.id as task_id,
    t.title as task_title,
    t.workspace_id,
    w.name as workspace_name,
    s.name as section_name,
    e.event_type,
    e.user_id,
    u.name as user_name,
    u.email as user_email,
    e.created_at as activity_date,
    e.old_values,
    e.new_values,
    e.delta,
    -- Readable activity description
    CASE e.event_type
        WHEN 'created' THEN 'Task created'
        WHEN 'updated' THEN 
            CASE 
                WHEN e.delta ? 'status' THEN 'Status changed from ' || COALESCE((e.old_values->>'status'), 'unknown') || ' to ' || (e.new_values->>'status')
                WHEN e.delta ? 'assigned_to_user_id' THEN 'Assignment changed'
                WHEN e.delta ? 'priority' THEN 'Priority changed from ' || COALESCE((e.old_values->>'priority'), 'unknown') || ' to ' || (e.new_values->>'priority')
                WHEN e.delta ? 'due_date' THEN 'Due date changed'
                ELSE 'Task updated'
            END
        WHEN 'deleted' THEN 'Task deleted'
        WHEN 'completed' THEN 'Task completed'
        WHEN 'assigned' THEN 'Task assigned'
        WHEN 'unassigned' THEN 'Task unassigned'
        ELSE e.event_type
    END as activity_description
FROM public.events e
JOIN public.tasks t ON e.entity_id = t.id
JOIN public.workspaces w ON t.workspace_id = w.id
JOIN public.sections s ON t.section_id = s.id
LEFT JOIN public.users u ON e.user_id = u.id
WHERE e.entity_type = 'task'
    AND NOT e.is_deleted
    AND NOT t.is_deleted
    AND NOT w.is_deleted
    AND NOT s.is_deleted
    AND (u.id IS NULL OR NOT u.is_deleted)
ORDER BY e.created_at DESC;

-- Create a materialized view for search performance (optional)
-- This can be refreshed periodically for better search performance
CREATE MATERIALIZED VIEW IF NOT EXISTS task_search_index AS
SELECT 
    t.id,
    t.workspace_id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.tags,
    s.name as section_name,
    w.name as workspace_name,
    au.name as assignee_name,
    cu.name as creator_name,
    t.search_vector,
    t.created_at,
    t.updated_at
FROM public.tasks t
JOIN public.sections s ON t.section_id = s.id
JOIN public.workspaces w ON t.workspace_id = w.id
JOIN public.users cu ON t.created_by_user_id = cu.id
LEFT JOIN public.users au ON t.assigned_to_user_id = au.id
WHERE NOT t.is_deleted 
    AND NOT s.is_deleted 
    AND NOT w.is_deleted
    AND NOT cu.is_deleted
    AND (au.id IS NULL OR NOT au.is_deleted);

-- Index for the materialized view
CREATE INDEX IF NOT EXISTS idx_task_search_index_workspace ON task_search_index(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_search_index_vector ON task_search_index USING GIN(search_vector);

COMMIT;