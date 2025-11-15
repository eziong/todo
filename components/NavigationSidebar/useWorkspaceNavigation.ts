// =============================================
// WORKSPACE NAVIGATION HOOK
// =============================================
// Hook for managing workspace data and navigation state specific to sidebar needs

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/Auth';
import type { 
  WorkspaceWithSections, 
  SectionWithTasks
} from '@/types';

// =============================================
// TYPES
// =============================================

export interface WorkspaceNavigationState {
  selectedWorkspaceId: string | null;
  expandedWorkspaces: Set<string>;
  recentWorkspaces: string[];
  favorites: string[];
}

export interface UseWorkspaceNavigationReturn {
  // Data
  workspaces: WorkspaceWithSections[];
  activeWorkspace: WorkspaceWithSections | null;
  recentWorkspaces: WorkspaceWithSections[];
  favoriteWorkspaces: WorkspaceWithSections[];
  
  // State
  selectedWorkspaceId: string | null;
  expandedWorkspaces: Set<string>;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  selectWorkspace: (workspaceId: string) => void;
  toggleWorkspaceExpansion: (workspaceId: string) => void;
  addToRecentWorkspaces: (workspaceId: string) => void;
  toggleFavoriteWorkspace: (workspaceId: string) => void;
  
  // CRUD operations (placeholder for API integration)
  createWorkspace: (data: { name: string; description?: string; color: string }) => Promise<WorkspaceWithSections>;
  updateWorkspace: (id: string, data: { name?: string; description?: string; color?: string }) => Promise<WorkspaceWithSections>;
  deleteWorkspace: (id: string) => Promise<void>;
  
  // Section operations
  createSection: (workspaceId: string, data: { name: string; color: string }) => Promise<SectionWithTasks>;
  updateSection: (sectionId: string, data: { name?: string; color?: string }) => Promise<SectionWithTasks>;
  deleteSection: (sectionId: string) => Promise<void>;
  
  // Utility functions
  getWorkspaceByIdWithSections: (id: string) => WorkspaceWithSections | undefined;
  getSectionsByWorkspaceId: (workspaceId: string) => SectionWithTasks[];
  getTotalTaskCount: () => number;
  getCompletedTaskCount: () => number;
}

// =============================================
// MOCK DATA
// =============================================
// This will be replaced with real API calls

const MOCK_WORKSPACES: WorkspaceWithSections[] = [
  {
    id: '1',
    name: 'Personal Tasks',
    description: 'Personal todo items and projects',
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
    sections: [
      {
        id: '1-1',
        name: 'Today',
        color: '#34C759',
        workspace_id: '1',
        position: 0,
        is_archived: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: [],
        taskCount: 5,
        completedTaskCount: 2,
      },
      {
        id: '1-2',
        name: 'This Week',
        color: '#FF9500',
        workspace_id: '1',
        position: 1,
        is_archived: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: [],
        taskCount: 8,
        completedTaskCount: 3,
      },
      {
        id: '1-3',
        name: 'Future Projects',
        color: '#5AC8FA',
        workspace_id: '1',
        position: 2,
        is_archived: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: [],
        taskCount: 12,
        completedTaskCount: 1,
      },
    ],
    memberCount: 1,
    taskCount: 25,
  },
  {
    id: '2',
    name: 'Work Projects',
    description: 'Professional tasks and team collaboration',
    color: '#5856D6',
    owner_id: 'user-1',
    settings: {
      features: { time_tracking: true },
    },
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sections: [
      {
        id: '2-1',
        name: 'Current Sprint',
        color: '#FF3B30',
        workspace_id: '2',
        position: 0,
        is_archived: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: [],
        taskCount: 12,
        completedTaskCount: 7,
      },
      {
        id: '2-2',
        name: 'Backlog',
        color: '#AF52DE',
        workspace_id: '2',
        position: 1,
        is_archived: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: [],
        taskCount: 28,
        completedTaskCount: 0,
      },
    ],
    memberCount: 5,
    taskCount: 40,
  },
  {
    id: '3',
    name: 'Learning & Development',
    description: 'Courses, tutorials, and skill development',
    color: '#30D158',
    owner_id: 'user-1',
    settings: {
      features: { time_tracking: false },
    },
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sections: [
      {
        id: '3-1',
        name: 'Current Courses',
        color: '#64D2FF',
        workspace_id: '3',
        position: 0,
        is_archived: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: [],
        taskCount: 6,
        completedTaskCount: 4,
      },
    ],
    memberCount: 1,
    taskCount: 6,
  },
];

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useWorkspaceNavigation = (): UseWorkspaceNavigationReturn => {
  const { user } = useAuth();
  
  // Local state for navigation
  const [navigationState, setNavigationState] = useState<WorkspaceNavigationState>({
    selectedWorkspaceId: MOCK_WORKSPACES[0]?.id || null,
    expandedWorkspaces: new Set([MOCK_WORKSPACES[0]?.id].filter(Boolean)),
    recentWorkspaces: [MOCK_WORKSPACES[0]?.id, MOCK_WORKSPACES[1]?.id].filter(Boolean),
    favorites: [],
  });

  // Mock loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock workspaces data
  const workspaces = MOCK_WORKSPACES;

  // Computed values
  const activeWorkspace = useMemo(() => 
    workspaces.find(w => w.id === navigationState.selectedWorkspaceId) || null,
    [workspaces, navigationState.selectedWorkspaceId]
  );

  const recentWorkspaces = useMemo(() => 
    navigationState.recentWorkspaces
      .map(id => workspaces.find(w => w.id === id))
      .filter(Boolean) as WorkspaceWithSections[],
    [workspaces, navigationState.recentWorkspaces]
  );

  const favoriteWorkspaces = useMemo(() =>
    navigationState.favorites
      .map(id => workspaces.find(w => w.id === id))
      .filter(Boolean) as WorkspaceWithSections[],
    [workspaces, navigationState.favorites]
  );

  // Navigation actions
  const addToRecentWorkspaces = useCallback((workspaceId: string) => {
    setNavigationState(prev => {
      const newRecent = [workspaceId, ...prev.recentWorkspaces.filter(id => id !== workspaceId)].slice(0, 5);
      return {
        ...prev,
        recentWorkspaces: newRecent,
      };
    });
  }, []);

  const selectWorkspace = useCallback((workspaceId: string) => {
    setNavigationState(prev => ({
      ...prev,
      selectedWorkspaceId: workspaceId,
      expandedWorkspaces: new Set([...prev.expandedWorkspaces, workspaceId]),
    }));
    addToRecentWorkspaces(workspaceId);
  }, [addToRecentWorkspaces]);

  const toggleWorkspaceExpansion = useCallback((workspaceId: string) => {
    setNavigationState(prev => {
      const newExpanded = new Set(prev.expandedWorkspaces);
      if (newExpanded.has(workspaceId)) {
        newExpanded.delete(workspaceId);
      } else {
        newExpanded.add(workspaceId);
      }
      return {
        ...prev,
        expandedWorkspaces: newExpanded,
      };
    });
  }, []);

  const toggleFavoriteWorkspace = useCallback((workspaceId: string) => {
    setNavigationState(prev => {
      const newFavorites = prev.favorites.includes(workspaceId)
        ? prev.favorites.filter(id => id !== workspaceId)
        : [...prev.favorites, workspaceId];
      return {
        ...prev,
        favorites: newFavorites,
      };
    });
  }, []);

  // CRUD operations (placeholders for API integration)
  const createWorkspace = useCallback(async (data: { name: string; description?: string; color: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newWorkspace: WorkspaceWithSections = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description || '',
        color: data.color,
        owner_id: user?.id || '',
        settings: {
          features: { 
            time_tracking: true,
            due_date_reminders: true,
          },
        },
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sections: [],
        memberCount: 1,
        taskCount: 0,
      };

      // In real implementation, this would be handled by a global workspace store
      // eslint-disable-next-line no-console
      console.log('Created workspace:', newWorkspace);
      return newWorkspace;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateWorkspace = useCallback(async (id: string, data: { name?: string; description?: string; color?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const workspace = workspaces.find(w => w.id === id);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const updatedWorkspace = {
        ...workspace,
        ...data,
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line no-console
      console.log('Updated workspace:', updatedWorkspace);
      return updatedWorkspace;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [workspaces]);

  const deleteWorkspace = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Remove from navigation state
      setNavigationState(prev => ({
        ...prev,
        selectedWorkspaceId: prev.selectedWorkspaceId === id ? workspaces[0]?.id || null : prev.selectedWorkspaceId,
        recentWorkspaces: prev.recentWorkspaces.filter(wId => wId !== id),
        favorites: prev.favorites.filter(wId => wId !== id),
      }));

      // eslint-disable-next-line no-console
      console.log('Deleted workspace:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [workspaces]);

  // Section operations
  const createSection = useCallback(async (workspaceId: string, data: { name: string; color: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newSection: SectionWithTasks = {
        id: Date.now().toString(),
        name: data.name,
        color: data.color,
        workspace_id: workspaceId,
        position: 0,
        is_archived: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: [],
        taskCount: 0,
        completedTaskCount: 0,
      };

      // eslint-disable-next-line no-console
      console.log('Created section:', newSection);
      return newSection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create section';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSection = useCallback(async (sectionId: string, data: { name?: string; color?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Find section across all workspaces
      let section: SectionWithTasks | undefined;
      for (const workspace of workspaces) {
        section = workspace.sections.find(s => s.id === sectionId);
        if (section) break;
      }

      if (!section) {
        throw new Error('Section not found');
      }

      const updatedSection = {
        ...section,
        ...data,
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line no-console
      console.log('Updated section:', updatedSection);
      return updatedSection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update section';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [workspaces]);

  const deleteSection = useCallback(async (sectionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      // eslint-disable-next-line no-console
      console.log('Deleted section:', sectionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete section';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Utility functions
  const getWorkspaceByIdWithSections = useCallback((id: string) => {
    return workspaces.find(w => w.id === id);
  }, [workspaces]);

  const getSectionsByWorkspaceId = useCallback((workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    return workspace?.sections || [];
  }, [workspaces]);

  const getTotalTaskCount = useCallback(() => {
    return workspaces.reduce((total, workspace) => total + (workspace.taskCount || 0), 0);
  }, [workspaces]);

  const getCompletedTaskCount = useCallback(() => {
    return workspaces.reduce((total, workspace) => {
      return total + workspace.sections.reduce((sectionTotal, section) => {
        return sectionTotal + (section.completedTaskCount || 0);
      }, 0);
    }, 0);
  }, [workspaces]);

  return {
    // Data
    workspaces,
    activeWorkspace,
    recentWorkspaces,
    favoriteWorkspaces,
    
    // State
    selectedWorkspaceId: navigationState.selectedWorkspaceId,
    expandedWorkspaces: navigationState.expandedWorkspaces,
    
    // Loading
    loading,
    error,
    
    // Actions
    selectWorkspace,
    toggleWorkspaceExpansion,
    addToRecentWorkspaces,
    toggleFavoriteWorkspace,
    
    // CRUD
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    
    // Sections
    createSection,
    updateSection,
    deleteSection,
    
    // Utilities
    getWorkspaceByIdWithSections,
    getSectionsByWorkspaceId,
    getTotalTaskCount,
    getCompletedTaskCount,
  };
};