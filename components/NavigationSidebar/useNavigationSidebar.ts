// =============================================
// NAVIGATION SIDEBAR CONTAINER HOOK
// =============================================
// Container logic for navigation sidebar with workspace data, search, and user state management

import { useState, useCallback, useMemo } from 'react';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@/components/Auth';
import { useWorkspaceNavigation } from './useWorkspaceNavigation';
import { useRouter } from '@/hooks/useRouter';
import type { 
  WorkspaceWithSections, 
  SectionWithTasks, 
  User
} from '@/types';

// =============================================
// TYPES
// =============================================

export interface NavigationSearchResults {
  workspaces: WorkspaceWithSections[];
  sections: SectionWithTasks[];
  recentItems: Array<{
    id: string;
    title: string;
    type: 'workspace' | 'section';
    workspace?: WorkspaceWithSections;
    section?: SectionWithTasks;
  }>;
}

export interface NavigationState {
  isOpen: boolean;
  searchQuery: string;
  searchResults: NavigationSearchResults;
  selectedWorkspaceId: string | null;
  expandedWorkspaces: Set<string>;
  isSearching: boolean;
  isResizing: boolean;
  width: number;
}

export interface UseNavigationSidebarReturn {
  // Navigation state
  state: NavigationState;
  
  // User and auth
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Workspace data
  workspaces: WorkspaceWithSections[];
  activeWorkspace: WorkspaceWithSections | null;
  
  // Responsive behavior
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  drawerVariant: 'temporary' | 'persistent' | 'permanent';
  
  // Actions
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  
  // Search functionality
  handleSearchChange: (query: string) => void;
  clearSearch: () => void;
  
  // Workspace navigation
  selectWorkspace: (workspaceId: string) => void;
  toggleWorkspaceExpansion: (workspaceId: string) => void;
  
  // Settings and user actions
  handleUserMenuClick: (event: React.MouseEvent<HTMLElement>) => void;
  handleSettingsClick: () => void;
  handleSignOut: () => Promise<void>;
  
  // Quick navigation
  handleQuickNavigation: (path: string) => void;
  currentPath: string;
  
  // Resize functionality
  startResizing: () => void;
  stopResizing: () => void;
  updateWidth: (width: number) => void;
}

// =============================================
// CONSTANTS
// =============================================

const SIDEBAR_WIDTH_MIN = 200;
const SIDEBAR_WIDTH_MAX = 400;
const SIDEBAR_WIDTH_DEFAULT = 280;

const MOBILE_BREAKPOINT = 'sm';
const TABLET_BREAKPOINT = 'md';

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useNavigationSidebar = (): UseNavigationSidebarReturn => {
  const theme = useTheme();
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const { push, pathname } = useRouter();
  
  // Use workspace navigation hook for data management
  const {
    workspaces,
    activeWorkspace,
    selectedWorkspaceId,
    expandedWorkspaces,
    loading: workspaceLoading,
    error: workspaceError,
    selectWorkspace: workspaceSelect,
    toggleWorkspaceExpansion: workspaceToggleExpansion,
  } = useWorkspaceNavigation();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down(MOBILE_BREAKPOINT));
  const isTablet = useMediaQuery(theme.breakpoints.between(MOBILE_BREAKPOINT, TABLET_BREAKPOINT));
  const isDesktop = useMediaQuery(theme.breakpoints.up(TABLET_BREAKPOINT));
  
  // Navigation state (excluding workspace data which comes from useWorkspaceNavigation)
  const [state, setState] = useState<NavigationState>({
    isOpen: !isMobile, // Default closed on mobile, open on desktop
    searchQuery: '',
    searchResults: {
      workspaces: [],
      sections: [],
      recentItems: [],
    },
    selectedWorkspaceId: selectedWorkspaceId,
    expandedWorkspaces: expandedWorkspaces,
    isSearching: false,
    isResizing: false,
    width: SIDEBAR_WIDTH_DEFAULT,
  });

  // Combine loading and error states
  const loading = authLoading || workspaceLoading;
  const error = authError || workspaceError;
  
  // Determine drawer variant based on screen size
  const drawerVariant = useMemo(() => {
    if (isMobile) return 'temporary';
    if (isTablet) return 'persistent'; 
    return 'permanent';
  }, [isMobile, isTablet]);

  // Update sidebar state when mobile breakpoint changes
  // Using a ref to avoid triggering effect on every render
  const [initialMobileState] = useState(!isMobile);
  if (state.isOpen !== initialMobileState && isMobile) {
    setState(prev => ({ ...prev, isOpen: false }));
  }

  // Search functionality
  const performSearch = useCallback((query: string): NavigationSearchResults => {
    const lowercaseQuery = query.toLowerCase();
    
    if (!query.trim()) {
      return {
        workspaces: [],
        sections: [],
        recentItems: [],
      };
    }

    const matchingWorkspaces = workspaces.filter(workspace =>
      workspace.name.toLowerCase().includes(lowercaseQuery) ||
      workspace.description?.toLowerCase().includes(lowercaseQuery)
    );

    const matchingSections: SectionWithTasks[] = [];
    workspaces.forEach(workspace => {
      const sections = workspace.sections.filter(section =>
        section.name.toLowerCase().includes(lowercaseQuery)
      );
      matchingSections.push(...sections);
    });

    // Mock recent items (would come from user activity tracking)
    const recentItems = [
      { 
        id: '1', 
        title: 'Personal Tasks', 
        type: 'workspace' as const, 
        workspace: workspaces[0] 
      },
      { 
        id: '1-1', 
        title: 'Today', 
        type: 'section' as const, 
        section: workspaces[0]?.sections[0],
        workspace: workspaces[0]
      },
    ].filter(item =>
      item.title.toLowerCase().includes(lowercaseQuery)
    );

    return {
      workspaces: matchingWorkspaces,
      sections: matchingSections,
      recentItems,
    };
  }, [workspaces]);

  // Action handlers
  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const closeSidebar = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const openSidebar = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      isSearching: query.length > 0,
      searchResults: performSearch(query),
    }));
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      isSearching: false,
      searchResults: {
        workspaces: [],
        sections: [],
        recentItems: [],
      },
    }));
  }, []);

  const selectWorkspace = useCallback((workspaceId: string) => {
    workspaceSelect(workspaceId);
    
    // Navigate to workspace page
    push(`/workspace/${workspaceId}`);
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      closeSidebar();
    }
  }, [isMobile, closeSidebar, workspaceSelect, push]);

  const toggleWorkspaceExpansion = useCallback((workspaceId: string) => {
    workspaceToggleExpansion(workspaceId);
  }, [workspaceToggleExpansion]);

  // User menu and settings handlers
  const handleUserMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    // Implementation will depend on UserMenu component
    // eslint-disable-next-line no-console
    console.log('User menu clicked', event);
  }, []);

  const handleSettingsClick = useCallback(() => {
    // Implementation will depend on settings routing
    // eslint-disable-next-line no-console
    console.log('Settings clicked');
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      closeSidebar();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Sign out error:', error);
    }
  }, [signOut, closeSidebar]);

  // Quick navigation handler
  const handleQuickNavigation = useCallback((path: string) => {
    push(path);
    
    // Close sidebar on mobile after navigation
    if (isMobile) {
      closeSidebar();
    }
  }, [push, isMobile, closeSidebar]);

  // Resize functionality for desktop
  const startResizing = useCallback(() => {
    setState(prev => ({ ...prev, isResizing: true }));
  }, []);

  const stopResizing = useCallback(() => {
    setState(prev => ({ ...prev, isResizing: false }));
  }, []);

  const updateWidth = useCallback((width: number) => {
    const constrainedWidth = Math.min(
      Math.max(width, SIDEBAR_WIDTH_MIN),
      SIDEBAR_WIDTH_MAX
    );
    setState(prev => ({ ...prev, width: constrainedWidth }));
  }, []);

  return {
    // State (merge navigation state with workspace data)
    state: {
      ...state,
      selectedWorkspaceId,
      expandedWorkspaces,
    },
    
    // User and auth
    user,
    isAuthenticated: !!user,
    loading,
    error,
    
    // Workspace data
    workspaces,
    activeWorkspace,
    
    // Responsive
    isMobile,
    isTablet,
    isDesktop,
    drawerVariant,
    
    // Actions
    toggleSidebar,
    closeSidebar,
    openSidebar,
    
    // Search
    handleSearchChange,
    clearSearch,
    
    // Navigation
    selectWorkspace,
    toggleWorkspaceExpansion,
    
    // User actions
    handleUserMenuClick,
    handleSettingsClick,
    handleSignOut,
    
    // Quick navigation
    handleQuickNavigation,
    currentPath: pathname,
    
    // Resize
    startResizing,
    stopResizing,
    updateWidth,
  };
};