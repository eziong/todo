# Enhanced Event Logging and Activity Tracking System

A comprehensive event logging and activity tracking system for the Todo application, providing complete audit trails, user activity analytics, and real-time activity feeds.

## 🎯 Overview

This system captures and tracks all user actions, system events, and security activities across the application, providing:

- **Complete Audit Trail**: Every action is logged with full context and metadata
- **Activity Analytics**: Aggregated metrics and insights into user behavior
- **Real-time Activity Feeds**: Live updates on workspace and user activity
- **Security Monitoring**: Authentication events and suspicious activity detection
- **Performance Tracking**: Search performance, API response times, and system metrics

## 📁 System Components

### Database Layer

#### Enhanced Events Table
```sql
-- Core event tracking with enhanced metadata
CREATE TABLE public.events (
    id UUID PRIMARY KEY,
    workspace_id UUID,
    user_id UUID,
    
    -- Event classification
    event_type TEXT NOT NULL, -- 30+ event types supported
    entity_type TEXT NOT NULL, -- All entity types covered
    entity_id UUID,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    delta JSONB,
    
    -- Enhanced metadata
    category TEXT, -- 'user_action', 'security', 'system', etc.
    severity TEXT, -- 'debug', 'info', 'warning', 'error', 'critical'
    source TEXT,   -- 'web', 'api', 'mobile', 'integration'
    correlation_id UUID,
    context JSONB,
    tags TEXT[],
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Standard audit fields
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false
);
```

#### Activity Aggregation Tables
- `user_activity_summary`: Hourly/daily/weekly/monthly activity rollups
- `event_category_stats`: Event category statistics for analytics

### Application Layer

#### Core Libraries

1. **EventLogger** (`/lib/events/eventLogger.ts`)
   - Main event logging class with specialized methods
   - Support for all event types and entities
   - Automatic correlation ID generation
   - Context-aware logging

2. **ActivityQueries** (`/lib/events/activityQueries.ts`)
   - Query functions for retrieving activity data
   - Performance-optimized with proper indexing
   - Filtering and pagination support

3. **Event Middleware** (`/lib/events/middleware.ts`)
   - Automatic request context capture
   - API route event logging
   - Session management

#### React Hooks

1. **useActivity** (`/hooks/useActivity.ts`)
   - `useRecentActivity`: Real-time activity feeds
   - `useEntityActivityTimeline`: Entity-specific history
   - `useEventLogger`: Event logging utilities
   - `useWorkspaceActivityStats`: Analytics and metrics

#### UI Components

1. **ActivityFeed** (`/components/ActivityFeed/`)
   - Real-time activity display
   - Filterable by event categories
   - Auto-refresh with pagination
   - User-friendly event descriptions

## 🚀 Quick Start

### 1. Database Setup

Run the migration to set up the enhanced event logging system:

```sql
-- Apply the migration
\i database/migrations/007_enhanced_event_logging.sql
```

### 2. Basic Event Logging

```typescript
import { eventLogger } from '@/lib/events/eventLogger';

// Log a task creation
await eventLogger.logTaskCreated({
  workspaceId: 'workspace-id',
  taskId: 'task-id',
  taskData: { title: 'New Task', status: 'todo' },
  sectionId: 'section-id'
});

// Log a search event
await eventLogger.logSearchEvent({
  workspaceId: 'workspace-id',
  searchQuery: 'project tasks',
  searchType: 'tasks',
  resultsCount: 15,
  executionTimeMs: 45
});

// Log authentication event
await eventLogger.logAuthEvent({
  userId: 'user-id',
  eventType: 'login',
  context: { login_method: 'oauth' }
});
```

### 3. Activity Feeds

```typescript
import { useActivityFeed } from '@/hooks/useActivity';
import { ActivityFeed } from '@/components/ActivityFeed';

function WorkspaceDashboard({ workspaceId }) {
  return (
    <div>
      <h2>Recent Activity</h2>
      <ActivityFeed 
        workspaceId={workspaceId}
        categories={['user_action', 'system']}
        limit={20}
      />
    </div>
  );
}
```

### 4. API Route Integration

```typescript
import { withAutoEventLogging } from '@/lib/events/middleware';

async function taskUpdateHandler(req, { params }) {
  // Your existing logic here
  const result = await updateTask(params.id, updateData);
  
  // Event logging happens automatically via triggers
  // Additional custom events can be logged manually
  
  return NextResponse.json(result);
}

export const PATCH = withAutoEventLogging(taskUpdateHandler, {
  eventType: 'api_call',
  entityType: 'task',
  category: 'user_action'
});
```

## 📊 Event Types and Categories

### Event Types

#### Core CRUD Operations
- `created`, `updated`, `deleted`, `restored`

#### Status and State Changes
- `status_changed`, `completed`, `reopened`, `archived`, `unarchived`

#### Assignment and Ownership
- `assigned`, `unassigned`, `reassigned`, `ownership_transferred`

#### Movement and Organization
- `moved`, `reordered`, `duplicated`, `merged`

#### Security and Authentication
- `login`, `logout`, `login_failed`, `password_changed`
- `mfa_enabled`, `suspicious_activity`

#### System Events
- `search_performed`, `export_generated`, `backup_created`
- `integration_connected`, `settings_changed`

#### User Interactions
- `viewed`, `commented`, `mentioned`, `watched`
- `notification_sent`, `reminder_triggered`

### Event Categories

- **user_action**: User-initiated actions and interactions
- **security**: Authentication, authorization, and security events
- **system**: Automated system operations and maintenance
- **integration**: External service interactions
- **automation**: Automated workflows and triggers
- **error**: Error conditions and exceptions

### Event Severity Levels

- **debug**: Detailed diagnostic information
- **info**: General informational events
- **warning**: Potentially problematic situations
- **error**: Error conditions that don't prevent operation
- **critical**: Serious error conditions requiring immediate attention

## 🔍 Advanced Features

### Correlation IDs

Track related events across the system:

```typescript
const correlationId = eventLogger.generateCorrelationId();

// Log multiple related events
await eventLogger.logTaskCreated({ taskId: '1', correlationId });
await eventLogger.logTaskAssigned({ taskId: '1', correlationId });
await eventLogger.logNotificationSent({ taskId: '1', correlationId });
```

### Context-Rich Logging

Include detailed context with events:

```typescript
await eventLogger.logEvent({
  eventType: 'task_completed',
  entityType: 'task',
  entityId: 'task-id',
  context: {
    completion_time: Date.now(),
    time_spent_minutes: 120,
    difficulty_rating: 3,
    automation_triggered: false,
    team_collaboration: true
  },
  tags: ['milestone', 'project-alpha', 'high-priority']
});
```

### Batch Operations

Log batch operations efficiently:

```typescript
await eventLogger.logBatchOperation({
  workspaceId: 'workspace-id',
  operationType: 'bulk_status_update',
  entityType: 'task',
  entityIds: ['task-1', 'task-2', 'task-3'],
  context: {
    new_status: 'completed',
    batch_size: 3,
    operation_duration_ms: 150
  }
});
```

### Activity Analytics

Get comprehensive activity insights:

```typescript
import { useWorkspaceActivityStats } from '@/hooks/useActivity';

function AnalyticsDashboard({ workspaceId }) {
  const { stats, metrics, loading } = useWorkspaceActivityStats({
    workspaceId,
    periodType: 'day',
    days: 30
  });

  return (
    <div>
      <div>Total Events: {metrics.total_events}</div>
      <div>Daily Average: {metrics.daily_average}</div>
      <div>Most Active Day: {metrics.most_active_day}</div>
      
      <h3>Category Breakdown:</h3>
      {Object.entries(metrics.category_breakdown).map(([category, count]) => (
        <div key={category}>{category}: {count}</div>
      ))}
    </div>
  );
}
```

## 🔐 Security and Privacy

### Data Protection

- **Sensitive Data Filtering**: Automatic exclusion of passwords, tokens, and PII
- **IP Address Handling**: Optional IP logging with privacy controls
- **Data Retention**: Configurable retention periods for different event types
- **Access Controls**: RLS policies restrict event access to authorized users

### Audit Compliance

- **Immutable Records**: Events cannot be modified after creation
- **Complete Trail**: Every action is logged with full context
- **Tamper Evidence**: Cryptographic integrity checks available
- **Export Capabilities**: Audit trail exports for compliance reporting

### Performance Optimizations

- **Efficient Indexing**: Optimized indexes for common query patterns
- **Automatic Aggregation**: Background jobs for activity summaries
- **Selective Logging**: Configurable event types and severity levels
- **Batch Processing**: Efficient bulk operations

## 📈 Performance and Scalability

### Indexing Strategy

```sql
-- Core performance indexes
CREATE INDEX CONCURRENTLY idx_events_workspace_category 
    ON events(workspace_id, category, created_at DESC);
CREATE INDEX CONCURRENTLY idx_events_user_activity 
    ON events(user_id, category, created_at DESC);
CREATE INDEX CONCURRENTLY idx_events_entity_detailed 
    ON events(entity_type, entity_id, event_type, created_at DESC);
```

### Automatic Aggregation

Background functions aggregate activity data:

```sql
-- Daily aggregation
SELECT aggregate_user_activity(
    p_period_start := date_trunc('day', now() - INTERVAL '1 day'),
    p_period_end := date_trunc('day', now()),
    p_period_type := 'day'
);
```

### Data Cleanup

Automated cleanup of old events:

```sql
-- Archive events older than 1 year
SELECT archive_old_events(365, true);

-- Clean up old hourly summaries
SELECT cleanup_old_activity_summaries(180);
```

## 🛠 API Reference

### Core Functions

#### EventLogger Methods

```typescript
// Task events
logTaskCreated(options): Promise<string>
logTaskUpdated(options): Promise<string>
logTaskDeleted(options): Promise<string>

// Authentication events
logAuthEvent(options): Promise<string>

// Search events
logSearchEvent(options): Promise<string>

// Generic event logging
logEvent(options): Promise<string>

// Error logging
logError(options): Promise<string>
```

#### Query Functions

```typescript
// Activity feeds
getRecentActivity(filters): Promise<ActivityFeedItem[]>
getWorkspaceActivity(filters): Promise<ActivityFeedItem[]>
getUserActivity(filters): Promise<ActivityFeedItem[]>

// Entity timelines
getEntityActivityTimeline(options): Promise<EntityActivityTimelineItem[]>
getTaskActivityTimeline(taskId): Promise<EntityActivityTimelineItem[]>

// Analytics
getActivityMetrics(options): Promise<ActivityMetrics>
getWorkspaceActivityStats(options): Promise<EventCategoryStats[]>
getUserActivitySummary(options): Promise<UserActivitySummary[]>
```

### React Hooks

```typescript
// Activity hooks
useRecentActivity(options): ActivityFeedResult
useEntityActivityTimeline(options): TimelineResult
useTaskActivity(taskId): TaskActivityResult
useWorkspaceActivityStats(options): StatsResult
useUserActivitySummary(options): SummaryResult

// Event logging hooks
useEventLogger(): EventLoggerHook
useActivityFeed(options): ActivityFeedHook
```

## 🔧 Configuration

### Environment Variables

```env
# Event logging configuration
EVENT_LOGGING_ENABLED=true
EVENT_RETENTION_DAYS=365
ACTIVITY_AGGREGATION_ENABLED=true
SECURITY_EVENT_RETENTION_DAYS=1095

# Performance settings
MAX_EVENTS_PER_REQUEST=1000
EVENT_BATCH_SIZE=100
AUTO_CLEANUP_ENABLED=true
```

### Database Configuration

```sql
-- Configure session variables
ALTER DATABASE your_database SET log_statement = 'none';
ALTER DATABASE your_database SET log_duration = off;

-- Performance tuning
ALTER TABLE events SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE events SET (autovacuum_analyze_scale_factor = 0.05);
```

## 🚨 Monitoring and Alerts

### Key Metrics to Monitor

- Event ingestion rate (events/second)
- Query response times (activity feeds, timelines)
- Storage growth (events table size)
- Error rates (failed event logging)
- Security events (failed logins, suspicious activity)

### Alerting Setup

```typescript
// Example monitoring setup
const ALERT_THRESHOLDS = {
  HIGH_ERROR_RATE: 100, // errors per hour
  SLOW_QUERY_TIME: 5000, // milliseconds
  STORAGE_USAGE: 0.85, // 85% of limit
  FAILED_LOGIN_ATTEMPTS: 10, // per user per hour
  SUSPICIOUS_ACTIVITY: 1 // immediate alert
};
```

## 🧪 Testing

### Unit Tests

```typescript
import { eventLogger } from '@/lib/events/eventLogger';
import { activityQueries } from '@/lib/events/activityQueries';

describe('Event Logging', () => {
  it('should log task creation events', async () => {
    const eventId = await eventLogger.logTaskCreated({
      workspaceId: 'test-workspace',
      taskId: 'test-task',
      taskData: { title: 'Test Task' },
      sectionId: 'test-section'
    });
    
    expect(eventId).toBeTruthy();
    
    const timeline = await activityQueries.getEntityActivityTimeline({
      entityType: 'task',
      entityId: 'test-task'
    });
    
    expect(timeline).toHaveLength(1);
    expect(timeline[0].event_type).toBe('created');
  });
});
```

### Integration Tests

```typescript
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '@/components/ActivityFeed';

describe('ActivityFeed', () => {
  it('should display recent activity', async () => {
    render(<ActivityFeed workspaceId="test-workspace" />);
    
    await screen.findByText('Activity Feed');
    expect(screen.getByText(/events/)).toBeInTheDocument();
  });
});
```

## 📋 Best Practices

### Event Logging

1. **Be Specific**: Use descriptive event types and include relevant context
2. **Use Correlation IDs**: Group related events together
3. **Include Performance Data**: Log execution times for operations
4. **Sanitize Sensitive Data**: Never log passwords, tokens, or PII
5. **Use Appropriate Severity**: Match severity levels to event importance

### Performance

1. **Batch Operations**: Use batch logging for bulk operations
2. **Optimize Queries**: Use proper indexes and query patterns
3. **Regular Cleanup**: Implement data retention and cleanup policies
4. **Monitor Storage**: Track database growth and performance metrics
5. **Cache Aggregations**: Use materialized views for frequently accessed data

### Security

1. **Access Controls**: Implement proper RLS policies
2. **Audit Access**: Log access to sensitive event data
3. **Data Retention**: Comply with privacy regulations
4. **Encryption**: Encrypt sensitive context data
5. **Regular Reviews**: Periodically review logged events for compliance

## 🤝 Contributing

When adding new event types or modifying the logging system:

1. Update the database migration with new event types
2. Add corresponding TypeScript types
3. Implement logging functions in `EventLogger`
4. Add query functions in `ActivityQueries`
5. Create appropriate React hooks
6. Update documentation and tests
7. Consider performance and security implications

## 📄 License

This event logging system is part of the Todo application and follows the same licensing terms.