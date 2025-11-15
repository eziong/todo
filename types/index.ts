// =============================================
// TODO LIST APPLICATION - FRONTEND TYPES
// =============================================
// Integrates comprehensive database types with frontend-specific types
// Database types are the source of truth for data entities

// Re-export all database types as the primary source of truth
export type {
  // Core entities
  User,
  Workspace,
  WorkspaceMember,
  Section,
  Task,
  Event,
  
  // Enums
  TaskStatus,
  TaskPriority,
  WorkspaceMemberRole,
  EventType,
  EntityType,
  
  // Utility types
  BaseEntity,
  WorkspacePermissions,
  UserPreferences,
  WorkspaceSettings,
  TaskAttachment,
  
  // Views
  UserWorkspaceAccess,
  TaskSummary,
  
  // Insert/Update types
  UserInsert,
  UserUpdate,
  WorkspaceInsert,
  WorkspaceUpdate,
  WorkspaceMemberInsert,
  WorkspaceMemberUpdate,
  SectionInsert,
  SectionUpdate,
  TaskInsert,
  TaskUpdate,
  EventInsert,
  
  // Query types
  TaskFilters,
  TaskSort,
  WorkspaceMemberFilters,
  EventFilters,
  
  // Real-time types
  RealtimePayload,
  
  // Form validation types from database
  TaskFormData,
  WorkspaceFormData,
  SectionFormData,
  
  // Database and API types
  Database,
  SearchResponse,
  PaginatedResponse,
} from '@/database/types';

// Import specific types for frontend extensions
import type {
  User,
  Workspace,
  WorkspaceMember,
  Section,
  Task,
  TaskPriority,
  TaskStatus,
  WorkspaceMemberRole,
  WorkspaceInsert,
  WorkspaceUpdate,
  SectionInsert,
  SectionUpdate,
  TaskInsert,
  TaskUpdate,
  UserUpdate,
  WorkspaceSettings,
  TaskFilters,
} from '@/database/types';

// =============================================
// FRONTEND-SPECIFIC TYPES
// =============================================

// =============================================
// UI COMPONENT TYPES
// =============================================

// Base component props for container-presenter pattern
export interface BaseComponentProps {
  className?: string;
}

// Theme integration types for macOS-inspired UI
export interface MacOSTheme {
  shadows: {
    subtle: string;
    medium: string;
    strong: string;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
}

// =============================================
// FRONTEND DATA TRANSFORMATION TYPES
// =============================================

// Frontend-specific data models with computed properties and relations
export interface WorkspaceWithSections extends Workspace {
  sections: SectionWithTasks[];
  memberCount?: number;
  taskCount?: number;
}

export interface SectionWithTasks extends Section {
  tasks: Task[];
  taskCount?: number;
  completedTaskCount?: number;
}

export interface TaskWithRelations extends Task {
  workspace?: Workspace;
  section?: Section;
  assignee?: User;
  creator?: User;
}

// =============================================
// CONTAINER HOOK RETURN TYPES
// =============================================

// Container hook return types aligned with database schema
export interface UseWorkspaceReturn {
  workspaces: WorkspaceWithSections[];
  activeWorkspace: WorkspaceWithSections | null;
  loading: boolean;
  error: string | null;
  createWorkspace: (data: WorkspaceInsert) => Promise<Workspace>;
  updateWorkspace: (id: string, data: WorkspaceUpdate) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  setActiveWorkspace: (workspace: WorkspaceWithSections | null) => void;
  refetchWorkspaces: () => Promise<void>;
}

export interface UseSectionReturn {
  sections: SectionWithTasks[];
  loading: boolean;
  error: string | null;
  createSection: (workspaceId: string, data: SectionInsert) => Promise<Section>;
  updateSection: (id: string, data: SectionUpdate) => Promise<Section>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (workspaceId: string, sectionIds: string[]) => Promise<void>;
  refetchSections: () => Promise<void>;
}

export interface UseTaskReturn {
  tasks: TaskWithRelations[];
  loading: boolean;
  error: string | null;
  createTask: (sectionId: string, data: TaskInsert) => Promise<Task>;
  updateTask: (id: string, data: TaskUpdate) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<Task>;
  reorderTasks: (sectionId: string, taskIds: string[]) => Promise<void>;
  refetchTasks: () => Promise<void>;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: UserUpdate) => Promise<User>;
}

export interface UseWorkspaceMemberReturn {
  members: WorkspaceMember[];
  loading: boolean;
  error: string | null;
  inviteMember: (workspaceId: string, email: string, role: WorkspaceMemberRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: WorkspaceMemberRole) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
}

// =============================================
// FRONTEND FORM TYPES
// =============================================

// Form types extending database types with frontend-specific validations
export interface CreateWorkspaceFormData extends Omit<WorkspaceInsert, 'owner_id' | 'settings'> {
  color: string; // Required in forms
  settings?: WorkspaceSettings;
}

export type UpdateWorkspaceFormData = WorkspaceUpdate;

export interface CreateSectionFormData extends Omit<SectionInsert, 'workspace_id' | 'position' | 'is_archived'> {
  color: string; // Required in forms
}

export type UpdateSectionFormData = SectionUpdate;

export interface CreateTaskFormData extends Omit<TaskInsert, 'section_id' | 'workspace_id' | 'created_by_user_id' | 'position' | 'attachments'> {
  status: TaskStatus; // Required in forms
  priority: TaskPriority; // Required in forms
}

export type UpdateTaskFormData = TaskUpdate;

// User registration form (not in database types)
export interface UserRegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  timezone?: string;
}

// User login form
export interface UserLoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Invite member form
export interface InviteMemberFormData {
  email: string;
  role: WorkspaceMemberRole;
  message?: string;
}

// =============================================
// FRONTEND API TYPES
// =============================================

// Frontend-specific API response types (complement database ApiResponse)
export interface FrontendApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp?: string;
}

// Enhanced error type for frontend
export interface FrontendApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
  field?: string; // For form validation errors
  timestamp?: string;
}

// Loading states for async operations
export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

// =============================================
// UI STATE MANAGEMENT TYPES
// =============================================

// Modal state management
export interface ModalState {
  isOpen: boolean;
  type?: 'create' | 'edit' | 'delete' | 'confirm';
  data?: unknown;
}

// Drag and drop state
export interface DragState {
  isDragging: boolean;
  draggedItem?: {
    id: string;
    type: 'task' | 'section';
    data: Task | Section;
  };
  dropTarget?: {
    id: string;
    type: 'task' | 'section';
    position?: number;
  };
}

// Filter and sort state for lists
export interface ListState<TFilters = Record<string, unknown>, TSortField = string> {
  filters: TFilters;
  sort: {
    field: TSortField;
    direction: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    limit: number;
  };
  searchQuery: string;
}

// Task list specific state
export type TaskListState = ListState<TaskFilters, keyof Task>;

// =============================================
// UTILITY TYPES FOR CONTAINER-PRESENTER PATTERN
// =============================================

// Generic container props that all presenters receive
export interface ContainerProps {
  loading: boolean;
  error: string | null;
}

// Generic form container props
export interface FormContainerProps<TFormData> extends ContainerProps {
  formData: TFormData;
  onSubmit: (data: TFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  validationErrors?: Record<keyof TFormData, string>;
}

// =============================================
// EXPORT FRONTEND TYPES
// =============================================
// All types are exported individually above - this section is for documentation only