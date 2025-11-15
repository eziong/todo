# Todo Application Database Schema

Comprehensive PostgreSQL database schema for a collaborative todo list application built on Supabase.

## 📋 Overview

This schema implements a **Workspace > Section > Task** hierarchy with multi-user collaboration, Google OAuth authentication, and comprehensive audit logging.

### Key Features
- ✅ Multi-tenant workspace architecture
- ✅ Role-based access control (RBAC)
- ✅ Row Level Security (RLS) policies
- ✅ Comprehensive audit logging
- ✅ Full-text search capabilities
- ✅ Soft delete support
- ✅ Real-time compatibility
- ✅ Performance optimized indexes

## 🗂️ Schema Structure

### Core Tables

#### `users`
Extends Supabase auth.users with application-specific profile data.
```sql
- id (UUID, FK to auth.users)
- email, name, avatar_url
- google_id (OAuth integration)
- timezone, preferences (JSONB)
- Standard audit fields
```

#### `workspaces`
Top-level containers for organizing work.
```sql
- id, name, description
- owner_id (FK to users)
- color, icon (UI customization)
- settings (JSONB)
- Standard audit fields
```

#### `workspace_members`
Many-to-many relationship between users and workspaces.
```sql
- workspace_id, user_id
- role (owner|admin|member|viewer)
- permissions (JSONB)
- invitation tracking
- Standard audit fields
```

#### `sections`
Groups within workspaces for organizing tasks.
```sql
- workspace_id (FK)
- name, description, position
- color, is_archived
- Standard audit fields
```

#### `tasks`
Individual todo items with comprehensive metadata.
```sql
- section_id, workspace_id (FKs)
- title, description, status, priority
- assigned_to_user_id, created_by_user_id
- start_date, end_date, due_date, completed_at
- position, tags[], estimated_hours, actual_hours
- search_vector (generated for full-text search)
- Standard audit fields
```

#### `events`
Comprehensive audit log for all system activities.
```sql
- workspace_id, user_id, entity_type, entity_id
- event_type, old_values, new_values, delta
- ip_address, user_agent, session_id
- Standard audit fields
```

### Views

#### `user_workspace_access`
Summary of user workspace memberships with roles and permissions.

#### `task_summary`
Comprehensive task view with workspace, section, and user details.

#### `workspace_stats`
Aggregated statistics for workspace dashboards.

#### `task_activity`
Recent task activity feed with readable descriptions.

## 🚀 Quick Start

### 1. Run Migrations in Supabase

Execute migrations in order in the Supabase SQL Editor:

```sql
-- 1. Initial schema
\i database/migrations/001_initial_schema.sql

-- 2. Indexes and functions  
\i database/migrations/002_indexes_and_functions.sql

-- 3. Triggers and views
\i database/migrations/003_triggers_and_views.sql

-- 4. RLS policies
\i database/migrations/004_rls_policies.sql
```

### 2. Configure Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 3. Example Usage

```typescript
// Create a workspace
const { data: workspace } = await supabase
  .from('workspaces')
  .insert({
    name: 'My Project',
    description: 'Project description',
    owner_id: user.id,
    color: '#6366f1'
  })
  .select()
  .single()

// Add a task
const { data: task } = await supabase
  .from('tasks')
  .insert({
    title: 'Complete feature',
    section_id: section.id,
    workspace_id: workspace.id,
    created_by_user_id: user.id,
    status: 'todo',
    priority: 'high',
    due_date: '2024-12-31'
  })
  .select()
  .single()

// Search tasks
const { data: searchResults } = await supabase
  .rpc('search_tasks', {
    workspace_uuid: workspace.id,
    search_query: 'feature implementation',
    result_limit: 20
  })
```

## 🔒 Security Model

### Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

- **Users**: Can read own profile + workspace member profiles
- **Workspaces**: Access based on membership
- **Tasks**: Read/write based on workspace permissions
- **Events**: Read-only audit trail access

### Permission System

Workspace members have granular permissions:
```json
{
  "read": true,
  "write": true, 
  "delete": false,
  "admin": false
}
```

### Role Hierarchy
1. **Owner**: Full access, can transfer ownership
2. **Admin**: Manage members, settings, all content
3. **Member**: Create/edit content, invite members
4. **Viewer**: Read-only access

## 🔍 Search & Indexing

### Full-Text Search
Tasks include generated search vectors for fast text search:
```sql
search_vector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('english', description), 'B') ||
  setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
) STORED
```

### Performance Indexes
Comprehensive indexing strategy covering:
- Workspace membership queries
- Task filtering and sorting
- Search operations
- Audit trail queries
- Composite indexes for common patterns

## 🔄 Real-Time Features

### Supabase Real-Time
All tables support real-time subscriptions:

```typescript
// Listen to task changes in a workspace
supabase
  .channel(`workspace:${workspaceId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `workspace_id=eq.${workspaceId}`
  }, handleTaskChange)
  .subscribe()
```

### Event Logging
Automatic event logging captures:
- Entity creation/modification/deletion
- Status changes and assignments  
- Membership changes
- Permission modifications

## 📊 Performance Considerations

### Optimizations Implemented
- Denormalized workspace_id in tasks for faster filtering
- Composite indexes for common query patterns
- Generated search vectors for full-text search
- Materialized view for search index (optional)
- Efficient soft delete implementation

### Recommended Practices
- Use task_summary view for display queries
- Leverage search_tasks function for full-text search
- Implement pagination for large datasets
- Cache workspace membership for frequent checks
- Use workspace stats view for dashboard metrics

## 🔧 Maintenance

### Regular Tasks
```sql
-- Refresh materialized search index (if using)
REFRESH MATERIALIZED VIEW CONCURRENTLY task_search_index;

-- Analyze tables for query optimization
ANALYZE public.tasks;
ANALYZE public.workspace_members;

-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### Monitoring Queries
```sql
-- Check RLS policy performance
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Monitor slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%public.tasks%' 
ORDER BY mean_exec_time DESC;
```

## 🚨 Troubleshooting

### Common Issues

#### RLS Policy Errors
```sql
-- Check if user has workspace access
SELECT * FROM get_user_workspace_ids(auth.uid());

-- Verify permissions
SELECT * FROM user_workspace_access WHERE user_id = auth.uid();
```

#### Performance Issues
```sql
-- Check index usage
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM tasks WHERE workspace_id = $1 AND status = 'todo';

-- Monitor connection count
SELECT count(*) FROM pg_stat_activity;
```

#### Search Not Working
```sql
-- Verify search vectors are generated
SELECT id, title, search_vector FROM tasks WHERE search_vector IS NULL;

-- Test search function
SELECT * FROM search_tasks('workspace-uuid', 'test query', 10);
```

## 📝 Migration Notes

### Breaking Changes
- Ensure auth.users exists before running migrations
- RLS policies require authenticated context
- Some indexes created CONCURRENTLY may need manual verification

### Rollback Strategy
```sql
-- Disable RLS for emergency access
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
```

## 🤝 Contributing

When modifying the schema:

1. Create new migration files with sequential numbers
2. Test RLS policies thoroughly
3. Update TypeScript types accordingly
4. Verify performance impact of new indexes
5. Document any breaking changes

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Performance Tuning Guide](https://supabase.com/docs/guides/platform/performance)