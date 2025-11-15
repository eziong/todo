# TypeScript Types Integration Guide

## Overview

The todo application uses a comprehensive, integrated type system that combines Supabase-aligned database types with frontend-specific types. This ensures type safety across the entire application stack.

## File Structure

```
types/
├── README.md           # This documentation
├── index.ts           # Main frontend types with database type integration
└── database.ts        # Barrel export for database types

database/
└── types.ts           # Comprehensive Supabase-aligned database types
```

## Type Hierarchy

### 1. Database Types (Source of Truth)
Located in `/database/types.ts` - these are the comprehensive Supabase-aligned types that define:

- **Core Entities**: User, Workspace, WorkspaceMember, Section, Task, Event
- **Enums**: TaskStatus, TaskPriority, WorkspaceMemberRole, EventType, EntityType
- **Utility Types**: BaseEntity, WorkspacePermissions, UserPreferences, WorkspaceSettings
- **Insert/Update Types**: For all entities (excluding auto-generated fields)
- **API Types**: ApiResponse, PaginatedResponse, SearchResponse
- **Query Types**: TaskFilters, TaskSort, etc.
- **Supabase Integration**: Database interface for typed client

### 2. Frontend Types (Extensions)
Located in `/types/index.ts` - these extend and complement the database types:

- **Frontend Data Models**: WorkspaceWithSections, SectionWithTasks, TaskWithRelations
- **Container Hook Returns**: UseWorkspaceReturn, UseTaskReturn, UseAuthReturn, etc.
- **Form Types**: Enhanced form validation types based on database types
- **UI State Management**: ModalState, DragState, ListState
- **Component Props**: BaseComponentProps, ContainerProps, FormContainerProps

## Key Features

### 1. Database Types as Source of Truth
All entity definitions come from the database schema, ensuring consistency between frontend and backend.

```typescript
// ✅ Correct - Using database types
import type { Task, TaskStatus, TaskPriority } from '@/types';

// ❌ Avoid - Don't create duplicate entity definitions
interface MyTask { /* duplicate definition */ }
```

### 2. Container-Presenter Pattern Compliance
Hook return types are designed to work with the container-presenter architecture:

```typescript
// Container hook
export const useTask = (): UseTaskReturn => {
  // Implementation
};

// Presenter component props
interface TaskListProps {
  className?: string;
  // Props from container hook
}
```

### 3. TypeScript Strict Mode Compatibility
All types are designed for strict TypeScript mode with:
- No `any` types (use `unknown` instead)
- Proper null handling
- Explicit optional properties
- No empty object types

### 4. Form Type Integration
Form types extend database insert/update types:

```typescript
// Extends database insert type with form-specific requirements
export interface CreateTaskFormData extends Omit<TaskInsert, 'section_id' | 'workspace_id' | 'created_by_user_id' | 'position' | 'attachments'> {
  status: TaskStatus; // Required in forms
  priority: TaskPriority; // Required in forms
}
```

## Usage Patterns

### 1. Component Development
```typescript
import type { 
  Task, 
  UseTaskReturn, 
  BaseComponentProps 
} from '@/types';

// Container hook
export const useTaskList = (): UseTaskReturn => {
  // Hook implementation
};

// Presenter component
interface TaskListProps extends BaseComponentProps {
  // Additional props
}

export const TaskList: React.FC<TaskListProps> = ({ className }) => {
  const taskData = useTaskList();
  // Component implementation
};
```

### 2. API Integration
```typescript
import type { 
  Task, 
  TaskInsert, 
  TaskUpdate, 
  ApiResponse 
} from '@/types';

// Type-safe API calls
const createTask = async (data: TaskInsert): Promise<Task> => {
  // API implementation
};
```

### 3. State Management
```typescript
import type { 
  Task, 
  TaskListState, 
  TaskFilters 
} from '@/types';

// Type-safe state management
const [listState, setListState] = useState<TaskListState>({
  filters: {},
  sort: { field: 'created_at', direction: 'desc' },
  pagination: { page: 1, limit: 20 },
  searchQuery: '',
});
```

## Import Guidelines

### Recommended Import Pattern
```typescript
// ✅ Import from main types barrel
import type { 
  Task, 
  TaskStatus, 
  UseTaskReturn,
  BaseComponentProps 
} from '@/types';
```

### Database Types Only
```typescript
// ✅ When you only need database types
import type { 
  Task, 
  TaskInsert, 
  Database 
} from '@/types/database';
```

### Direct Database Import (Avoid)
```typescript
// ❌ Avoid direct imports from database/types
import type { Task } from '@/database/types';
```

## Type Safety Features

### 1. Enum Safety
```typescript
// ✅ Type-safe enum usage
const status: TaskStatus = 'in_progress';

// ❌ Invalid values caught at compile time
const invalidStatus: TaskStatus = 'invalid'; // Type error
```

### 2. Database Schema Alignment
All types match the actual database schema, preventing runtime errors:

```typescript
// ✅ Matches database column names
interface Task {
  created_at: string;  // Not createdAt
  assigned_to_user_id?: string;  // Not assignedToUserId
}
```

### 3. Relationship Safety
```typescript
// ✅ Type-safe relationships
interface TaskWithRelations extends Task {
  workspace?: Workspace;
  section?: Section;
  assignee?: User;
  creator?: User;
}
```

## Migration Notes

This integrated type system replaces the previous basic types in `/types/index.ts`. The key changes:

1. **Database types are now the source of truth** for all entity definitions
2. **Naming convention follows database schema** (snake_case for database fields)
3. **Enhanced type safety** with strict TypeScript compliance
4. **Container-presenter pattern support** built into hook return types
5. **Form types extend database types** for consistency

## Contributing

When adding new types:

1. **Database entities**: Add to `/database/types.ts`
2. **Frontend-specific types**: Add to `/types/index.ts`
3. **Always run `npm run lint`** to ensure type safety
4. **Follow container-presenter pattern** for component types
5. **Use database types as the foundation** for all data models

## Performance Considerations

- Types are compile-time only and don't affect runtime performance
- Barrel exports from `/types/index.ts` provide tree-shaking optimization
- Database types include comprehensive Insert/Update types for efficient mutations
- Real-time types support Supabase subscriptions without additional overhead