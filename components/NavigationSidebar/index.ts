// =============================================
// NAVIGATION SIDEBAR EXPORTS
// =============================================
// Central export file for navigation sidebar components and hooks

// Main component exports
export { NavigationSidebar } from './NavigationSidebar';
export { useNavigationSidebar } from './useNavigationSidebar';
export { useWorkspaceNavigation } from './useWorkspaceNavigation';

// Type exports
export type {
  NavigationSidebarProps,
} from './NavigationSidebar';

export type {
  NavigationSearchResults,
  NavigationState,
  UseNavigationSidebarReturn,
} from './useNavigationSidebar';

export type {
  WorkspaceNavigationState,
  UseWorkspaceNavigationReturn,
} from './useWorkspaceNavigation';

// Re-export related types from main types package
export type {
  WorkspaceWithSections,
  SectionWithTasks,
  BaseComponentProps,
} from '@/types';