-- =============================================
-- SEARCH OPTIMIZATION ENHANCEMENTS
-- =============================================
-- Additional indexes and optimizations for search performance

-- =============================================
-- ADDITIONAL SEARCH INDEXES
-- =============================================

-- Composite index for workspace search with user permissions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_search_with_perms
ON public.workspaces(owner_id, search_vector) 
WHERE NOT is_deleted;

-- Index for section search within workspace context
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sections_workspace_search
ON public.sections(workspace_id, search_vector) 
WHERE NOT is_deleted AND NOT is_archived;

-- Enhanced task search index with common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_search_filtered
ON public.tasks(workspace_id, status, priority, search_vector) 
WHERE NOT is_deleted;

-- Index for tag-based searches (already exists as idx_tasks_tags)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tags_gin
-- ON public.tasks USING GIN(tags) WHERE NOT is_deleted;

-- Partial index for tasks with due dates for search prioritization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_search_due_date
ON public.tasks(due_date, search_vector) 
WHERE NOT is_deleted AND due_date IS NOT NULL;

-- Index for assigned tasks search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_search_assigned
ON public.tasks(assigned_to_user_id, search_vector) 
WHERE NOT is_deleted AND assigned_to_user_id IS NOT NULL;

-- =============================================
-- SEARCH PERFORMANCE FUNCTIONS
-- =============================================

-- Function to warm up search indexes (useful for dev/staging environments)
CREATE OR REPLACE FUNCTION public.warmup_search_indexes()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result_text TEXT := '';
    rec RECORD;
BEGIN
    -- Warm up workspace search
    PERFORM count(*) FROM public.workspaces WHERE search_vector @@ plainto_tsquery('test');
    result_text := result_text || 'Warmed up workspace search index. ';
    
    -- Warm up section search  
    PERFORM count(*) FROM public.sections WHERE search_vector @@ plainto_tsquery('test');
    result_text := result_text || 'Warmed up section search index. ';
    
    -- Warm up task search
    PERFORM count(*) FROM public.tasks WHERE search_vector @@ plainto_tsquery('test');
    result_text := result_text || 'Warmed up task search index. ';
    
    -- Return summary
    RETURN result_text || 'All search indexes warmed up successfully.';
END;
$$;

-- Function to rebuild search vectors (in case of data corruption)
CREATE OR REPLACE FUNCTION public.rebuild_search_vectors(
    entity_type TEXT DEFAULT 'all'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result_text TEXT := '';
    updated_count INTEGER;
BEGIN
    IF entity_type IN ('workspace', 'all') THEN
        -- Rebuild workspace search vectors
        UPDATE public.workspaces 
        SET updated_at = updated_at 
        WHERE NOT is_deleted;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        result_text := result_text || format('Rebuilt %s workspace search vectors. ', updated_count);
    END IF;
    
    IF entity_type IN ('section', 'all') THEN
        -- Rebuild section search vectors
        UPDATE public.sections 
        SET updated_at = updated_at 
        WHERE NOT is_deleted;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        result_text := result_text || format('Rebuilt %s section search vectors. ', updated_count);
    END IF;
    
    IF entity_type IN ('task', 'all') THEN
        -- Rebuild task search vectors
        UPDATE public.tasks 
        SET updated_at = updated_at 
        WHERE NOT is_deleted;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        result_text := result_text || format('Rebuilt %s task search vectors. ', updated_count);
    END IF;
    
    -- Analyze tables after rebuild
    ANALYZE public.workspaces;
    ANALYZE public.sections;
    ANALYZE public.tasks;
    
    RETURN result_text || 'Search vector rebuild completed.';
END;
$$;

-- Function to get detailed search performance metrics
CREATE OR REPLACE FUNCTION public.get_search_performance_metrics(
    workspace_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_description TEXT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'total_searchable_entities'::TEXT as metric_name,
        (
            SELECT count(*)::NUMERIC 
            FROM (
                SELECT id FROM public.workspaces 
                WHERE NOT is_deleted 
                    AND (workspace_id_filter IS NULL OR id = workspace_id_filter)
                UNION ALL
                SELECT id FROM public.sections 
                WHERE NOT is_deleted AND NOT is_archived
                    AND (workspace_id_filter IS NULL OR workspace_id = workspace_id_filter)
                UNION ALL
                SELECT id FROM public.tasks 
                WHERE NOT is_deleted
                    AND (workspace_id_filter IS NULL OR workspace_id = workspace_id_filter)
            ) entities
        ) as metric_value,
        'Total number of entities available for search'::TEXT as metric_description
    
    UNION ALL
    
    SELECT 
        'avg_workspace_search_vector_length'::TEXT as metric_name,
        (
            SELECT avg(length(search_vector::text))::NUMERIC 
            FROM public.workspaces 
            WHERE NOT is_deleted 
                AND search_vector IS NOT NULL
                AND (workspace_id_filter IS NULL OR id = workspace_id_filter)
        ) as metric_value,
        'Average length of workspace search vectors (indicates content richness)'::TEXT as metric_description
    
    UNION ALL
    
    SELECT 
        'avg_section_search_vector_length'::TEXT as metric_name,
        (
            SELECT avg(length(search_vector::text))::NUMERIC 
            FROM public.sections 
            WHERE NOT is_deleted AND NOT is_archived
                AND search_vector IS NOT NULL
                AND (workspace_id_filter IS NULL OR workspace_id = workspace_id_filter)
        ) as metric_value,
        'Average length of section search vectors (indicates content richness)'::TEXT as metric_description
    
    UNION ALL
    
    SELECT 
        'avg_task_search_vector_length'::TEXT as metric_name,
        (
            SELECT avg(length(search_vector::text))::NUMERIC 
            FROM public.tasks 
            WHERE NOT is_deleted
                AND search_vector IS NOT NULL
                AND (workspace_id_filter IS NULL OR workspace_id = workspace_id_filter)
        ) as metric_value,
        'Average length of task search vectors (indicates content richness)'::TEXT as metric_description
    
    UNION ALL
    
    SELECT 
        'unique_tags_count'::TEXT as metric_name,
        (
            SELECT count(DISTINCT tag)::NUMERIC
            FROM public.tasks, unnest(tags) as tag
            WHERE NOT is_deleted
                AND array_length(tags, 1) > 0
                AND (workspace_id_filter IS NULL OR workspace_id = workspace_id_filter)
        ) as metric_value,
        'Number of unique tags available for search'::TEXT as metric_description
    
    UNION ALL
    
    SELECT 
        'tasks_with_tags_percentage'::TEXT as metric_name,
        (
            SELECT CASE 
                WHEN total_tasks.count = 0 THEN 0
                ELSE (tasks_with_tags.count * 100.0 / total_tasks.count)
            END
            FROM 
                (SELECT count(*) as count 
                 FROM public.tasks 
                 WHERE NOT is_deleted 
                    AND (workspace_id_filter IS NULL OR workspace_id = workspace_id_filter)
                ) total_tasks,
                (SELECT count(*) as count 
                 FROM public.tasks 
                 WHERE NOT is_deleted 
                    AND array_length(tags, 1) > 0
                    AND (workspace_id_filter IS NULL OR workspace_id = workspace_id_filter)
                ) tasks_with_tags
        ) as metric_value,
        'Percentage of tasks that have tags assigned'::TEXT as metric_description;
END;
$$;

-- =============================================
-- SEARCH CONFIGURATION IMPROVEMENTS
-- =============================================

-- Update text search configuration to handle common abbreviations and synonyms
-- This creates a custom text search dictionary for better matching

-- Create a simple synonym dictionary for common task management terms
CREATE TEXT SEARCH DICTIONARY IF NOT EXISTS task_synonyms (
    TEMPLATE = synonym,
    SYNONYMS = task_synonyms
);

-- Note: You would need to create a synonyms file with content like:
-- todo,task,item
-- bug,issue,defect
-- feature,enhancement,improvement
-- urgent,critical,important
-- For now, we'll use the standard configuration

-- =============================================
-- SEARCH AUDIT AND LOGGING
-- =============================================

-- Table to log search queries for analytics and optimization
CREATE TABLE IF NOT EXISTS public.search_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    search_query TEXT NOT NULL,
    search_type TEXT NOT NULL, -- 'global', 'tasks', 'suggestions'
    filters_applied JSONB DEFAULT '{}',
    results_count INTEGER DEFAULT 0,
    execution_time_ms NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT search_audit_type_check CHECK (search_type IN ('global', 'tasks', 'suggestions', 'stats')),
    CONSTRAINT search_audit_query_check CHECK (length(trim(search_query)) > 0),
    CONSTRAINT search_audit_execution_time_check CHECK (execution_time_ms >= 0)
);

-- Index for search analytics
CREATE INDEX IF NOT EXISTS idx_search_audit_user_workspace 
ON public.search_audit(user_id, workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_audit_query_analysis 
ON public.search_audit(search_type, created_at DESC);

-- Function to log search queries (for analytics)
CREATE OR REPLACE FUNCTION public.log_search_query(
    p_user_id UUID,
    p_workspace_id UUID,
    p_search_query TEXT,
    p_search_type TEXT,
    p_filters_applied JSONB DEFAULT '{}',
    p_results_count INTEGER DEFAULT 0,
    p_execution_time_ms NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public.search_audit (
        user_id,
        workspace_id, 
        search_query,
        search_type,
        filters_applied,
        results_count,
        execution_time_ms
    ) VALUES (
        p_user_id,
        p_workspace_id,
        p_search_query,
        p_search_type,
        p_filters_applied,
        p_results_count,
        p_execution_time_ms
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;

-- =============================================
-- GRANTS AND PERMISSIONS
-- =============================================

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION public.warmup_search_indexes TO authenticated;
GRANT EXECUTE ON FUNCTION public.rebuild_search_vectors TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_search_performance_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_search_query TO authenticated;

-- Grant permissions on search audit table
GRANT SELECT ON public.search_audit TO authenticated;
GRANT INSERT ON public.search_audit TO authenticated;

-- Enable RLS on search audit table
ALTER TABLE public.search_audit ENABLE ROW LEVEL SECURITY;

-- RLS policy for search audit (users can only see their own searches)
CREATE POLICY "Users can read own search audit" ON public.search_audit
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create search audit records" ON public.search_audit
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =============================================
-- PERFORMANCE ANALYSIS
-- =============================================

-- Analyze all tables to update query planner statistics
ANALYZE public.workspaces;
ANALYZE public.sections; 
ANALYZE public.tasks;
ANALYZE public.search_audit;

-- Add helpful comments
COMMENT ON FUNCTION public.warmup_search_indexes IS 'Warm up search indexes to improve initial query performance';
COMMENT ON FUNCTION public.rebuild_search_vectors IS 'Rebuild search vectors for specified entity types or all entities';
COMMENT ON FUNCTION public.get_search_performance_metrics IS 'Get detailed metrics about search index performance and coverage';
COMMENT ON FUNCTION public.log_search_query IS 'Log search queries for analytics and performance optimization';
COMMENT ON TABLE public.search_audit IS 'Audit log for search queries to enable analytics and optimization';