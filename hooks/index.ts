// =============================================
// HOOKS BARREL EXPORT
// =============================================
// Re-exports all workspace and section management hooks for easier importing

// Workspace hooks
export { useWorkspaces } from './useWorkspaces';
export { useWorkspace } from './useWorkspace';
export { useWorkspaceMembers } from './useWorkspaceMembers';
export { useWorkspaceMutations } from './useWorkspaceMutations';
export { useWorkspacePermissions } from './useWorkspacePermissions';

// Section hooks
export { useSections } from './useSections';
export { useSection } from './useSection';
export { useSectionMutations } from './useSectionMutations';
export { useSectionReorder } from './useSectionReorder';
export { useSectionTasks } from './useSectionTasks';

// Task hooks
export { useTask } from './useTask';
export { useTaskMutations } from './useTaskMutations';
export { useTaskSearch } from './useTaskSearch';
export { useTaskDashboard } from './useTaskDashboard';
export { useTaskDragDrop } from './useTaskDragDrop';
export { useTaskAssignments } from './useTaskAssignments';
export { useTaskFilters } from './useTaskFilters';

// Activity hooks
export { 
  useRecentActivity,
  useEntityActivityTimeline,
  useTaskActivity,
  useWorkspaceActivityStats,
  useUserActivitySummary,
  useSecurityEvents,
  useEventLogger,
  useActivityFeed
} from './useActivity';

// Enhanced activity hooks
export { useActivityStatistics } from './useActivityStatistics';
export { useActivityRealTime } from './useActivityRealTime';
export { useActivityNotifications } from './useActivityNotifications';

// Utility hooks
export { useDebounce } from './useDebounce';

export type {
  // useWorkspaces types
  WorkspaceWithUserRole,
  UseWorkspacesOptions,
  UseWorkspacesReturn,
} from './useWorkspaces';

export type {
  // useWorkspace types  
  WorkspaceDetails,
  UseWorkspaceOptions,
  UseWorkspaceReturn,
} from './useWorkspace';

export type {
  // useWorkspaceMembers types
  WorkspaceMemberWithUser,
  UseWorkspaceMembersOptions,
  UseWorkspaceMembersReturn,
} from './useWorkspaceMembers';

export type {
  // useWorkspaceMutations types
  UseWorkspaceMutationsReturn,
} from './useWorkspaceMutations';

export type {
  // useWorkspacePermissions types
  WorkspacePermissionData,
  UseWorkspacePermissionsReturn,
} from './useWorkspacePermissions';

export type {
  // useSections types
  SectionWithStats,
  UseSectionsOptions,
  UseSectionsReturn,
} from './useSections';

export type {
  // useSection types
  SectionWithDetails,
  UseSectionOptions,
  UseSectionReturn,
} from './useSection';

export type {
  // useSectionMutations types
  SectionMutation,
  UseSectionMutationsReturn,
} from './useSectionMutations';

export type {
  // useSectionReorder types
  ReorderItem,
  UseSectionReorderOptions,
  UseSectionReorderReturn,
} from './useSectionReorder';

export type {
  // useSectionTasks types
  TaskWithUsers,
  UseSectionTasksOptions,
  UseSectionTasksReturn,
} from './useSectionTasks';

export type {
  // useTask types
  TaskWithDetails,
  UseTaskOptions,
  UseTaskReturn,
} from './useTask';

export type {
  // useTaskMutations types
  CreateTaskData,
  UpdateTaskData,
  StatusUpdateData,
  AssignmentData,
  PositionUpdateData,
  MoveTaskData,
  DuplicateTaskData,
  ArchiveTaskData,
  UseTaskMutationsOptions,
  UseTaskMutationsReturn,
} from './useTaskMutations';

export type {
  // useTaskSearch types
  TaskSearchResult,
  SearchFilters,
  SearchOptions,
  UseTaskSearchReturn,
} from './useTaskSearch';

export type {
  // useTaskDashboard types
  DashboardTask,
  DashboardStats,
  WorkspaceSummary,
  DashboardData,
  UseTaskDashboardOptions,
  UseTaskDashboardReturn,
} from './useTaskDashboard';

export type {
  // useTaskDragDrop types
  DraggedTask,
  DropTarget,
  DragDropState,
  UseTaskDragDropOptions,
  UseTaskDragDropReturn,
} from './useTaskDragDrop';

export type {
  // useTaskAssignments types
  AssignableUser,
  TaskAssignmentSummary,
  UseTaskAssignmentsOptions,
  UseTaskAssignmentsReturn,
} from './useTaskAssignments';

export type {
  // useTaskFilters types
  TaskFilters,
  TaskSort,
  FilterPreset,
  UseTaskFiltersOptions,
  UseTaskFiltersReturn,
} from './useTaskFilters';

export type {
  // useActivityStatistics types
  ActivityMetrics,
  PeriodComparison,
  RealTimeStats,
  UseActivityStatisticsProps,
  UseActivityStatisticsReturn,
} from './useActivityStatistics';

export type {
  // useActivityRealTime types
  RealTimeEvent,
  RealTimeMetrics,
  RealTimeAlerts,
  UseActivityRealTimeProps,
  UseActivityRealTimeReturn,
} from './useActivityRealTime';

export type {
  // useActivityNotifications types
  NotificationRule,
  ActivityNotification,
  NotificationSettings,
  UseActivityNotificationsProps,
  UseActivityNotificationsReturn,
} from './useActivityNotifications';