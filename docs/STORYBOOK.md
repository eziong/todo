# Component Storybook

## Overview

This document serves as a comprehensive catalog of all reusable components in the Todo App. Each component follows the container-presenter pattern with Material Design and macOS-inspired styling.

## Table of Contents

1. [Authentication Components](#authentication-components)
2. [Layout Components](#layout-components)
3. [Task Management Components](#task-management-components)
4. [Navigation Components](#navigation-components)
5. [Search Components](#search-components)
6. [Activity Components](#activity-components)
7. [UI Components](#ui-components)
8. [Accessibility Components](#accessibility-components)
9. [Error Handling Components](#error-handling-components)
10. [Performance Components](#performance-components)

---

## Authentication Components

### AuthProvider

**Purpose**: Global authentication state management and user session handling.

**Props**: 
```typescript
interface AuthProviderProps {
  children: ReactNode;
}
```

**Features**:
- Supabase authentication integration
- Session persistence
- Authentication state management
- User profile data

**Usage**:
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### Login

**Purpose**: User authentication form with email/password login.

**Props**:
```typescript
interface LoginProps {
  onSuccess?: (user: User) => void;
  redirectTo?: string;
  className?: string;
}
```

**Features**:
- Form validation
- Loading states
- Error handling
- Accessibility compliance

### UserProfile

**Purpose**: Display and edit user profile information.

**Props**:
```typescript
interface UserProfileProps {
  userId?: string;
  editable?: boolean;
  showAvatar?: boolean;
  onUpdate?: (profile: UserProfile) => void;
}
```

### UserMenu

**Purpose**: Dropdown menu for user actions and profile access.

**Features**:
- Profile access
- Settings navigation
- Logout functionality
- Theme switching

---

## Layout Components

### MainContent

**Purpose**: Main content area wrapper with responsive layout.

**Props**:
```typescript
interface MainContentProps {
  children: ReactNode;
  sidebar?: boolean;
  className?: string;
}
```

**Features**:
- Responsive design
- Sidebar toggle
- Content overflow handling
- Accessibility landmarks

### BreadcrumbNavigation

**Purpose**: Hierarchical navigation breadcrumbs.

**Props**:
```typescript
interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  maxItems?: number;
  separator?: ReactNode;
}
```

**Features**:
- Automatic truncation
- Click navigation
- Keyboard support
- Custom separators

---

## Task Management Components

### TaskCard

**Purpose**: Individual task display and interaction component.

**Props**:
```typescript
interface TaskCardProps {
  taskId: string;
  compact?: boolean;
  showSection?: boolean;
  draggable?: boolean;
  onUpdate?: (task: Task) => void;
  className?: string;
}
```

**Features**:
- Status toggling
- Inline editing
- Priority indicators
- Due date display
- Tag visualization
- Assignment info

**States**:
- Default
- Hover
- Selected
- Editing
- Loading
- Error

### TaskList

**Purpose**: Scrollable list of tasks with virtualization.

**Props**:
```typescript
interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  emptyMessage?: string;
  onTaskUpdate?: (task: Task) => void;
  sortBy?: TaskSortField;
  groupBy?: TaskGroupField;
}
```

**Features**:
- Virtual scrolling
- Infinite loading
- Sorting and filtering
- Empty states
- Loading skeletons

### TaskDetailModal

**Purpose**: Full task editor in modal dialog.

**Props**:
```typescript
interface TaskDetailModalProps {
  taskId?: string;
  open: boolean;
  onClose: () => void;
  onSave?: (task: Task) => void;
  mode?: 'view' | 'edit' | 'create';
}
```

**Features**:
- Full task editing
- Attachment support
- Comment system
- History tracking
- Keyboard shortcuts

### CompletedTasksView

**Purpose**: Specialized view for completed tasks.

**Features**:
- Archive functionality
- Completion statistics
- Filtering options
- Bulk operations

### TodayTasksView

**Purpose**: Today's tasks with time-based organization.

**Features**:
- Due today filter
- Time-based sorting
- Progress tracking
- Quick actions

---

## Navigation Components

### NavigationSidebar

**Purpose**: Main application sidebar navigation.

**Props**:
```typescript
interface NavigationSidebarProps {
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  workspaces: Workspace[];
}
```

**Features**:
- Workspace switching
- Section navigation
- Quick filters
- Collapsible design
- Search integration

**Responsive Behavior**:
- Desktop: Fixed sidebar
- Tablet: Collapsible sidebar
- Mobile: Slide-out drawer

### WorkspaceNavigation

**Purpose**: Workspace-specific navigation and section management.

**Features**:
- Section creation
- Section reordering
- Workspace settings
- Member management

---

## Search Components

### SpotlightSearch

**Purpose**: Global search interface with keyboard shortcuts.

**Props**:
```typescript
interface SpotlightSearchProps {
  onClose?: () => void;
  defaultQuery?: string;
  scope?: SearchScope;
}
```

**Features**:
- Instant search
- Keyboard navigation
- Search history
- Filter suggestions
- Result previews

### SearchFilters

**Purpose**: Advanced search filtering controls.

**Features**:
- Multiple filter types
- Date range selection
- Tag filtering
- Priority filtering
- Assignment filtering

### SearchResultsList

**Purpose**: Display search results with highlighting.

**Features**:
- Result highlighting
- Type-based grouping
- Pagination
- Click-through tracking

### SearchSuggestions

**Purpose**: Search query suggestions and autocomplete.

**Features**:
- Query completion
- Recent searches
- Popular searches
- Smart suggestions

---

## Activity Components

### ActivityFeed

**Purpose**: Real-time activity feed display.

**Props**:
```typescript
interface ActivityFeedProps {
  workspaceId?: string;
  userId?: string;
  limit?: number;
  realtime?: boolean;
}
```

**Features**:
- Real-time updates
- Activity grouping
- User avatars
- Relative timestamps
- Action links

### ActivityTimeline

**Purpose**: Chronological timeline of activities.

**Features**:
- Timeline visualization
- Activity clustering
- Date separators
- Load more functionality

### ActivityDashboard

**Purpose**: Activity overview and statistics.

**Features**:
- Activity metrics
- Trend analysis
- Team productivity
- Time-based filtering

---

## UI Components

### ThemeProvider

**Purpose**: Global theme management with Material-UI integration.

**Props**:
```typescript
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}
```

**Features**:
- Light/dark themes
- macOS-inspired styling
- Dynamic theme switching
- System preference detection

### ThemeToggle

**Purpose**: Theme switching control component.

**Features**:
- Animated transitions
- System sync option
- Accessibility support
- Persistent preferences

### LazyComponent

**Purpose**: Wrapper for lazy-loaded components with loading states.

**Props**:
```typescript
interface LazyComponentProps {
  fallback?: ReactNode;
  skeletonHeight?: number | string;
  children?: ReactNode;
}
```

**Features**:
- Suspense integration
- Custom fallbacks
- Skeleton loading
- Error boundaries

### OptimizedImage

**Purpose**: Optimized image component with Next.js integration.

**Props**:
```typescript
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  fallbackSrc?: string;
}
```

**Features**:
- WebP/AVIF support
- Responsive sizing
- Lazy loading
- Error fallbacks
- Blur placeholders

---

## Accessibility Components

### AccessibilityProvider

**Purpose**: Global accessibility configuration and utilities.

**Features**:
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- Focus management
- Announcement regions

### AccessibleForm

**Purpose**: Fully accessible form component.

**Props**:
```typescript
interface AccessibleFormProps {
  fields: FormField[];
  onSubmit: (data: FormData) => Promise<void>;
  title: string;
  description?: string;
}
```

**Features**:
- Form validation
- Error announcements
- Focus management
- Field relationships
- Submit states

### SkipToContent

**Purpose**: Skip navigation link for screen readers.

**Features**:
- Keyboard-only visibility
- Proper focus management
- WCAG compliance

---

## Error Handling Components

### GlobalErrorBoundary

**Purpose**: Application-wide error catching and handling.

**Props**:
```typescript
interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
}
```

**Features**:
- Error reporting
- Custom fallback UI
- Error recovery
- Development debugging

### UserFeedback

**Purpose**: User feedback collection and error reporting.

**Features**:
- Feedback forms
- Error reporting
- Rating system
- Email integration

---

## Performance Components

### PerformanceMonitor

**Purpose**: Web Vitals and performance tracking.

**Props**:
```typescript
interface PerformanceMonitorProps {
  enabled?: boolean;
  debug?: boolean;
}
```

**Features**:
- Web Vitals collection
- Performance metrics
- Analytics integration
- Development debugging

### MonitoringDashboard

**Purpose**: System monitoring and health display.

**Features**:
- Health checks
- Performance metrics
- Error tracking
- Real-time updates

---

## Component Usage Patterns

### Container-Presenter Pattern

Every component follows this pattern:

```typescript
// Container (useComponentName.ts)
export const useComponentName = (props): UseComponentNameReturn => {
  // All business logic, state management, and side effects
  return {
    // Return values for presenter
  };
};

// Presenter (ComponentName.tsx)
export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  const containerProps = useComponentName(props);
  
  // Pure UI rendering only
  return <div>{/* UI */}</div>;
};
```

### Common Props Pattern

Most components support these common props:

```typescript
interface CommonComponentProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}
```

### Loading States Pattern

Components with async operations include loading states:

```typescript
interface AsyncComponentState {
  loading: boolean;
  error: string | null;
  data: T | null;
}
```

### Event Handler Pattern

Event handlers follow consistent naming:

```typescript
interface ComponentEventHandlers {
  onUpdate?: (data: T) => void;
  onChange?: (value: any) => void;
  onError?: (error: Error) => void;
  onSuccess?: (result: T) => void;
}
```

---

## Styling Guidelines

### Material-UI Integration

All components use Material-UI with custom theming:

```typescript
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    // macOS-inspired colors
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "San Francisco", Roboto, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    // macOS-style shadows
  ],
});
```

### Responsive Design

Components are responsive by default:

```typescript
const useStyles = makeStyles((theme) => ({
  container: {
    [theme.breakpoints.down('md')]: {
      // Tablet styles
    },
    [theme.breakpoints.down('sm')]: {
      // Mobile styles
    },
  },
}));
```

---

## Testing Components

### Component Testing Template

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  const defaultProps = {
    // Default props for testing
  };

  it('renders without crashing', () => {
    render(<ComponentName {...defaultProps} />);
    expect(screen.getByTestId('component-name')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    const onAction = jest.fn();
    render(<ComponentName {...defaultProps} onAction={onAction} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalledWith(expectedValue);
  });
});
```

---

## Future Components

### Planned Components

- **CalendarView**: Calendar-based task viewing
- **GanttChart**: Project timeline visualization
- **Kanban Board**: Drag-and-drop task board
- **ReportBuilder**: Custom report creation
- **NotificationCenter**: In-app notifications
- **ChatWidget**: Team communication
- **FileUploader**: Drag-and-drop file uploads
- **DataExport**: Export functionality
- **IntegrationPanel**: Third-party integrations
- **TemplateLibrary**: Task and project templates

---

*Last updated: [Current Date]*
*For component-specific documentation, see individual component directories.*