// =============================================
// WORKSPACE NAVIGATION HOOK
// =============================================
// Hook for managing workspace data and navigation state specific to sidebar needs

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/Auth/useAuth';
import type { 
  Workspace, 
  Section
} from '@/types/database';

// =============================================
// TYPES
// =============================================

export interface WorkspaceNavigationState {
  selectedWorkspaceId: string | null;
  expandedWorkspaces: Set<string>;
}

export interface UseWorkspaceNavigationReturn {
  // State
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  expandedWorkspaces: Set<string>;
  
  // Actions
  selectWorkspace: (id: string) => void;
  toggleWorkspaceExpansion: (id: string) => void;
  
  // Utils
  isLoading: boolean;
  error: string | null;
}

// =============================================
// MOCK DATA
// =============================================

const MOCK_WORKSPACES: Workspace[] = [
  {
    id: '1',
    name: 'Personal Tasks',
    description: 'My personal projects and tasks',
    color: '#007AFF',
    owner_id: 'user-1',
    settings: {
      features: {
        time_tracking: true,
        due_date_reminders: true,
      },
    },
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Work Projects',
    description: 'Professional tasks and team collaboration',
    color: '#FF9500',
    owner_id: 'user-1',
    settings: {
      features: {
        time_tracking: true,
        due_date_reminders: true,
      },
    },
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Learning & Development',
    description: 'Courses, books, and skill development',
    color: '#34C759',
    owner_id: 'user-1',
    settings: {
      features: {
        time_tracking: false,
        due_date_reminders: true,
      },
    },
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useWorkspaceNavigation = (): UseWorkspaceNavigationReturn => {
  const { user, loading: authLoading } = useAuth();
  
  // =============================================
  // STATE MANAGEMENT
  // =============================================
  
  const [state, setState] = useState<WorkspaceNavigationState>({
    selectedWorkspaceId: null,
    expandedWorkspaces: new Set(['1']), // Default expand first workspace
  });
  
  // =============================================
  // COMPUTED VALUES
  // =============================================
  
  const workspaces = useMemo(() => {
    // TODO: Fetch workspaces from API
    return MOCK_WORKSPACES;
  }, []);
  
  const isLoading = useMemo(() => {
    return authLoading;
  }, [authLoading]);
  
  // =============================================
  // ACTIONS
  // =============================================
  
  const selectWorkspace = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedWorkspaceId: prev.selectedWorkspaceId === id ? null : id,
    }));
  }, []);
  
  const toggleWorkspaceExpansion = useCallback((id: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedWorkspaces);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return {
        ...prev,
        expandedWorkspaces: newExpanded,
      };
    });
  }, []);
  
  // =============================================
  // RETURN INTERFACE
  // =============================================
  
  return {
    // State
    workspaces,
    selectedWorkspaceId: state.selectedWorkspaceId,
    expandedWorkspaces: state.expandedWorkspaces,
    
    // Actions
    selectWorkspace,
    toggleWorkspaceExpansion,
    
    // Utils
    isLoading,
    error: null, // TODO: Implement error handling
  };
};