-- =============================================
-- FULL-TEXT SEARCH ENHANCEMENT
-- =============================================
-- Enhance existing search functionality across workspaces, sections, and tasks
-- Add search vectors, indexes, and functions for relevance ranking

-- Add full-text search vectors to workspaces
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

-- Add full-text search vectors to sections
ALTER TABLE public.sections 
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

-- Create GIN indexes for full-text search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_search 
ON public.workspaces USING GIN(search_vector);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sections_search 
ON public.sections USING GIN(search_vector);

-- =============================================
-- SEARCH FUNCTIONS
-- =============================================

-- Comprehensive search function across all entities with relevance ranking
CREATE OR REPLACE FUNCTION public.search_all(
    search_query TEXT,
    workspace_id_filter UUID DEFAULT NULL,
    result_limit INTEGER DEFAULT 50,
    result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    entity_type TEXT,
    entity_id UUID,
    title TEXT,
    description TEXT,
    workspace_id UUID,
    workspace_name TEXT,
    section_id UUID,
    section_name TEXT,
    relevance_score REAL,
    context_snippet TEXT,
    entity_data JSONB
) 
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    ts_query TSQUERY;
BEGIN
    -- Convert search query to tsquery with support for partial matches
    BEGIN
        ts_query := plainto_tsquery('english', search_query);
        -- If no results with plainto_tsquery, try with prefix matching
        IF ts_query IS NULL OR ts_query = ''::tsquery THEN
            ts_query := to_tsquery('english', trim(search_query) || ':*');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Fallback to simple word search
        ts_query := to_tsquery('english', replace(trim(search_query), ' ', ' & '));
    END;
    
    RETURN QUERY
    WITH search_results AS (
        -- Search in workspaces
        SELECT 
            'workspace'::TEXT as entity_type,
            w.id as entity_id,
            w.name as title,
            w.description,
            w.id as workspace_id,
            w.name as workspace_name,
            NULL::UUID as section_id,
            NULL::TEXT as section_name,
            ts_rank(w.search_vector, ts_query) as relevance_score,
            ts_headline('english', coalesce(w.description, w.name), ts_query, 'MaxWords=20, MinWords=5') as context_snippet,
            jsonb_build_object(
                'id', w.id,
                'name', w.name,
                'description', w.description,
                'color', w.color,
                'icon', w.icon,
                'created_at', w.created_at,
                'updated_at', w.updated_at
            ) as entity_data
        FROM public.workspaces w
        WHERE NOT w.is_deleted 
            AND w.search_vector @@ ts_query
            AND (workspace_id_filter IS NULL OR w.id = workspace_id_filter)
        
        UNION ALL
        
        -- Search in sections
        SELECT 
            'section'::TEXT as entity_type,
            s.id as entity_id,
            s.name as title,
            s.description,
            s.workspace_id,
            w.name as workspace_name,
            s.id as section_id,
            s.name as section_name,
            ts_rank(s.search_vector, ts_query) as relevance_score,
            ts_headline('english', coalesce(s.description, s.name), ts_query, 'MaxWords=20, MinWords=5') as context_snippet,
            jsonb_build_object(
                'id', s.id,
                'name', s.name,
                'description', s.description,
                'position', s.position,
                'color', s.color,
                'is_archived', s.is_archived,
                'workspace_id', s.workspace_id,
                'created_at', s.created_at,
                'updated_at', s.updated_at
            ) as entity_data
        FROM public.sections s
        JOIN public.workspaces w ON s.workspace_id = w.id
        WHERE NOT s.is_deleted 
            AND NOT w.is_deleted
            AND NOT s.is_archived
            AND s.search_vector @@ ts_query
            AND (workspace_id_filter IS NULL OR s.workspace_id = workspace_id_filter)
        
        UNION ALL
        
        -- Search in tasks (enhanced from existing search_vector)
        SELECT 
            'task'::TEXT as entity_type,
            t.id as entity_id,
            t.title,
            t.description,
            t.workspace_id,
            w.name as workspace_name,
            t.section_id,
            s.name as section_name,
            ts_rank(t.search_vector, ts_query) as relevance_score,
            ts_headline('english', coalesce(t.description, t.title), ts_query, 'MaxWords=20, MinWords=5') as context_snippet,
            jsonb_build_object(
                'id', t.id,
                'title', t.title,
                'description', t.description,
                'status', t.status,
                'priority', t.priority,
                'assigned_to_user_id', t.assigned_to_user_id,
                'created_by_user_id', t.created_by_user_id,
                'due_date', t.due_date,
                'tags', t.tags,
                'section_id', t.section_id,
                'workspace_id', t.workspace_id,
                'created_at', t.created_at,
                'updated_at', t.updated_at
            ) as entity_data
        FROM public.tasks t
        JOIN public.sections s ON t.section_id = s.id
        JOIN public.workspaces w ON t.workspace_id = w.id
        WHERE NOT t.is_deleted 
            AND NOT s.is_deleted 
            AND NOT w.is_deleted
            AND NOT s.is_archived
            AND t.search_vector @@ ts_query
            AND (workspace_id_filter IS NULL OR t.workspace_id = workspace_id_filter)
    )
    SELECT * FROM search_results
    ORDER BY relevance_score DESC, entity_type, title
    LIMIT result_limit
    OFFSET result_offset;
END;
$$;

-- Function for task-specific search with enhanced filters
CREATE OR REPLACE FUNCTION public.search_tasks(
    search_query TEXT,
    workspace_id_filter UUID DEFAULT NULL,
    section_ids UUID[] DEFAULT NULL,
    status_filter TEXT[] DEFAULT NULL,
    priority_filter TEXT[] DEFAULT NULL,
    assigned_to_filter UUID[] DEFAULT NULL,
    tags_filter TEXT[] DEFAULT NULL,
    due_date_from DATE DEFAULT NULL,
    due_date_to DATE DEFAULT NULL,
    result_limit INTEGER DEFAULT 50,
    result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    assigned_to_user_id UUID,
    assignee_name TEXT,
    created_by_user_id UUID,
    creator_name TEXT,
    due_date DATE,
    tags TEXT[],
    section_id UUID,
    section_name TEXT,
    workspace_id UUID,
    workspace_name TEXT,
    relevance_score REAL,
    context_snippet TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    ts_query TSQUERY;
BEGIN
    -- Convert search query to tsquery
    BEGIN
        ts_query := plainto_tsquery('english', search_query);
        IF ts_query IS NULL OR ts_query = ''::tsquery THEN
            ts_query := to_tsquery('english', trim(search_query) || ':*');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        ts_query := to_tsquery('english', replace(trim(search_query), ' ', ' & '));
    END;
    
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.assigned_to_user_id,
        au.name as assignee_name,
        t.created_by_user_id,
        cu.name as creator_name,
        t.due_date,
        t.tags,
        t.section_id,
        s.name as section_name,
        t.workspace_id,
        w.name as workspace_name,
        ts_rank(t.search_vector, ts_query) as relevance_score,
        ts_headline('english', coalesce(t.description, t.title), ts_query, 'MaxWords=20, MinWords=5') as context_snippet,
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
        AND NOT s.is_archived
        AND t.search_vector @@ ts_query
        AND (workspace_id_filter IS NULL OR t.workspace_id = workspace_id_filter)
        AND (section_ids IS NULL OR t.section_id = ANY(section_ids))
        AND (status_filter IS NULL OR t.status = ANY(status_filter))
        AND (priority_filter IS NULL OR t.priority = ANY(priority_filter))
        AND (assigned_to_filter IS NULL OR t.assigned_to_user_id = ANY(assigned_to_filter))
        AND (tags_filter IS NULL OR t.tags && tags_filter)
        AND (due_date_from IS NULL OR t.due_date >= due_date_from)
        AND (due_date_to IS NULL OR t.due_date <= due_date_to)
    ORDER BY relevance_score DESC, t.created_at DESC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$;

-- Function to get search suggestions based on partial input
CREATE OR REPLACE FUNCTION public.get_search_suggestions(
    partial_query TEXT,
    workspace_id_filter UUID DEFAULT NULL,
    suggestion_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    suggestion TEXT,
    entity_type TEXT,
    entity_count INTEGER
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH suggestions AS (
        -- Get workspace name suggestions
        SELECT 
            w.name as suggestion,
            'workspace'::TEXT as entity_type,
            1 as entity_count
        FROM public.workspaces w
        WHERE NOT w.is_deleted
            AND w.name ILIKE '%' || partial_query || '%'
            AND (workspace_id_filter IS NULL OR w.id = workspace_id_filter)
        
        UNION ALL
        
        -- Get section name suggestions
        SELECT 
            s.name as suggestion,
            'section'::TEXT as entity_type,
            1 as entity_count
        FROM public.sections s
        WHERE NOT s.is_deleted
            AND NOT s.is_archived
            AND s.name ILIKE '%' || partial_query || '%'
            AND (workspace_id_filter IS NULL OR s.workspace_id = workspace_id_filter)
        
        UNION ALL
        
        -- Get task title suggestions
        SELECT 
            t.title as suggestion,
            'task'::TEXT as entity_type,
            1 as entity_count
        FROM public.tasks t
        WHERE NOT t.is_deleted
            AND t.title ILIKE '%' || partial_query || '%'
            AND (workspace_id_filter IS NULL OR t.workspace_id = workspace_id_filter)
        
        UNION ALL
        
        -- Get tag suggestions
        SELECT DISTINCT
            unnest(t.tags) as suggestion,
            'tag'::TEXT as entity_type,
            count(*)::INTEGER as entity_count
        FROM public.tasks t
        WHERE NOT t.is_deleted
            AND EXISTS (
                SELECT 1 FROM unnest(t.tags) AS tag 
                WHERE tag ILIKE '%' || partial_query || '%'
            )
            AND (workspace_id_filter IS NULL OR t.workspace_id = workspace_id_filter)
        GROUP BY unnest(t.tags)
    )
    SELECT DISTINCT s.suggestion, s.entity_type, s.entity_count
    FROM suggestions s
    WHERE length(trim(s.suggestion)) > 0
    ORDER BY s.entity_count DESC, s.suggestion
    LIMIT suggestion_limit;
END;
$$;

-- =============================================
-- SEARCH OPTIMIZATION VIEW
-- =============================================

-- View that combines search results with additional metadata
CREATE OR REPLACE VIEW public.search_index_stats AS
SELECT 
    'workspace' as entity_type,
    count(*) as total_entities,
    count(*) FILTER (WHERE search_vector IS NOT NULL) as indexed_entities,
    avg(length(search_vector::text)) as avg_search_vector_length
FROM public.workspaces
WHERE NOT is_deleted

UNION ALL

SELECT 
    'section' as entity_type,
    count(*) as total_entities,
    count(*) FILTER (WHERE search_vector IS NOT NULL) as indexed_entities,
    avg(length(search_vector::text)) as avg_search_vector_length
FROM public.sections
WHERE NOT is_deleted AND NOT is_archived

UNION ALL

SELECT 
    'task' as entity_type,
    count(*) as total_entities,
    count(*) FILTER (WHERE search_vector IS NOT NULL) as indexed_entities,
    avg(length(search_vector::text)) as avg_search_vector_length
FROM public.tasks
WHERE NOT is_deleted;

-- =============================================
-- SEARCH STATISTICS FUNCTION
-- =============================================

-- Function to get search performance statistics
CREATE OR REPLACE FUNCTION public.get_search_stats(
    workspace_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    workspace_count INTEGER,
    section_count INTEGER,
    task_count INTEGER,
    total_indexed_entities INTEGER,
    search_coverage_percentage NUMERIC
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT count(*)::INTEGER FROM public.workspaces w 
         WHERE NOT w.is_deleted 
         AND (workspace_id_filter IS NULL OR w.id = workspace_id_filter)) as workspace_count,
        
        (SELECT count(*)::INTEGER FROM public.sections s 
         WHERE NOT s.is_deleted AND NOT s.is_archived
         AND (workspace_id_filter IS NULL OR s.workspace_id = workspace_id_filter)) as section_count,
        
        (SELECT count(*)::INTEGER FROM public.tasks t 
         WHERE NOT t.is_deleted
         AND (workspace_id_filter IS NULL OR t.workspace_id = workspace_id_filter)) as task_count,
        
        (SELECT (
            (SELECT count(*) FROM public.workspaces w 
             WHERE NOT w.is_deleted AND search_vector IS NOT NULL
             AND (workspace_id_filter IS NULL OR w.id = workspace_id_filter)) +
            (SELECT count(*) FROM public.sections s 
             WHERE NOT s.is_deleted AND NOT s.is_archived AND search_vector IS NOT NULL
             AND (workspace_id_filter IS NULL OR s.workspace_id = workspace_id_filter)) +
            (SELECT count(*) FROM public.tasks t 
             WHERE NOT t.is_deleted AND search_vector IS NOT NULL
             AND (workspace_id_filter IS NULL OR t.workspace_id = workspace_id_filter))
        )::INTEGER) as total_indexed_entities,
        
        (SELECT CASE 
            WHEN total_entities.total = 0 THEN 100.0
            ELSE (indexed_entities.indexed * 100.0 / total_entities.total)
        END
        FROM 
            (SELECT (
                (SELECT count(*) FROM public.workspaces w 
                 WHERE NOT w.is_deleted 
                 AND (workspace_id_filter IS NULL OR w.id = workspace_id_filter)) +
                (SELECT count(*) FROM public.sections s 
                 WHERE NOT s.is_deleted AND NOT s.is_archived
                 AND (workspace_id_filter IS NULL OR s.workspace_id = workspace_id_filter)) +
                (SELECT count(*) FROM public.tasks t 
                 WHERE NOT t.is_deleted
                 AND (workspace_id_filter IS NULL OR t.workspace_id = workspace_id_filter))
            ) as total) as total_entities,
            (SELECT (
                (SELECT count(*) FROM public.workspaces w 
                 WHERE NOT w.is_deleted AND search_vector IS NOT NULL
                 AND (workspace_id_filter IS NULL OR w.id = workspace_id_filter)) +
                (SELECT count(*) FROM public.sections s 
                 WHERE NOT s.is_deleted AND NOT s.is_archived AND search_vector IS NOT NULL
                 AND (workspace_id_filter IS NULL OR s.workspace_id = workspace_id_filter)) +
                (SELECT count(*) FROM public.tasks t 
                 WHERE NOT t.is_deleted AND search_vector IS NOT NULL
                 AND (workspace_id_filter IS NULL OR t.workspace_id = workspace_id_filter))
            ) as indexed) as indexed_entities
        ) as search_coverage_percentage;
END;
$$;

-- =============================================
-- GRANTS AND PERMISSIONS
-- =============================================

-- Grant execute permissions on search functions to authenticated users
GRANT EXECUTE ON FUNCTION public.search_all TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_search_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_search_stats TO authenticated;

-- Grant select on search views
GRANT SELECT ON public.search_index_stats TO authenticated;

-- =============================================
-- PERFORMANCE HINTS
-- =============================================

-- Analyze tables to update statistics for query planner
ANALYZE public.workspaces;
ANALYZE public.sections;
ANALYZE public.tasks;

-- Add comments for documentation
COMMENT ON FUNCTION public.search_all IS 'Comprehensive search across workspaces, sections, and tasks with relevance ranking';
COMMENT ON FUNCTION public.search_tasks IS 'Enhanced task search with filtering and relevance ranking';
COMMENT ON FUNCTION public.get_search_suggestions IS 'Get search suggestions based on partial input';
COMMENT ON FUNCTION public.get_search_stats IS 'Get search index coverage and performance statistics';
COMMENT ON VIEW public.search_index_stats IS 'Statistics about search index coverage across entity types';