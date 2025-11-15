// =============================================
// TASK LIST CONTAINER HOOK
// =============================================
// Business logic for task list with drag-and-drop reordering and task management

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { 
  Task, 
  User,
} from '@/types/database';

// =============================================
// TYPES
// =============================================

export interface TaskListProps {
  tasks: Task[];
  users?: User[];
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleComplete: (id: string) => Promise<void>;
  onReorderTasks: (taskIds: string[]) => Promise<void>;
  onOpenTaskModal: (task: Task) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
  emptyStateProps?: {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  };
}

export interface TaskListState {
  // Data
  tasks: Task[];
  activeTask: Task | null;
  
  // UI States
  loading: boolean;
  error: string | null;
  isReordering: boolean;
  
  // Drag state
  draggedTaskId: string | null;
}

export interface UseTaskListReturn {
  // State
  state: TaskListState;
  
  // Drag and drop context props
  dndContextProps: {
    sensors: ReturnType<typeof useSensors>;
    onDragStart: (event: DragStartEvent) => void;
    onDragEnd: (event: DragEndEvent) => void;
  };
  
  // Sortable context props
  sortableContextProps: {
    items: string[];
    strategy: typeof verticalListSortingStrategy;
  };
  
  // Task operations
  handleUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;
  handleToggleComplete: (id: string) => Promise<void>;
  
  // UI helpers
  renderEmptyState: () => React.ReactNode;
  renderLoadingState: () => React.ReactNode;
  renderErrorState: () => React.ReactNode;
  
  // Error handling
  clearError: () => void;
  
  // Utility
  getTaskIndex: (taskId: string) => number;
  canReorder: () => boolean;
}

// =============================================
// CONTAINER HOOK IMPLEMENTATION
// =============================================

export const useTaskList = ({
  tasks,
  users = [],
  onUpdateTask,
  onDeleteTask,
  onToggleComplete,
  onReorderTasks,
  onOpenTaskModal,
  loading = false,
  error = null,
  emptyStateProps,
}: TaskListProps): UseTaskListReturn => {
  // =============================================
  // STATE MANAGEMENT
  // =============================================
  
  const [state, setState] = React.useState<TaskListState>({
    tasks,
    activeTask: null,
    loading,
    error,
    isReordering: false,
    draggedTaskId: null,
  });
  
  // =============================================
  // UPDATE STATE WHEN PROPS CHANGE
  // =============================================
  
  React.useEffect(() => {
    setState(prev => ({
      ...prev,
      tasks,
      loading,
      error,
    }));
  }, [tasks, loading, error]);
  
  // =============================================
  // DRAG AND DROP SENSORS
  // =============================================
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to start dragging
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  // =============================================
  // DRAG AND DROP HANDLERS
  // =============================================
  
  const handleDragStart = React.useCallback((event: DragStartEvent): void => {
    const { active } = event;
    const taskId = String(active.id);
    const activeTask = state.tasks.find(task => task.id === taskId);
    
    setState(prev => ({
      ...prev,
      activeTask: activeTask || null,
      draggedTaskId: taskId,
    }));
  }, [state.tasks]);
  
  const handleDragEnd = React.useCallback(async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    
    setState(prev => ({
      ...prev,
      activeTask: null,
      draggedTaskId: null,
    }));
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const activeIndex = state.tasks.findIndex(task => task.id === active.id);
    const overIndex = state.tasks.findIndex(task => task.id === over.id);
    
    if (activeIndex === -1 || overIndex === -1) {
      return;
    }
    
    setState(prev => ({ ...prev, isReordering: true, error: null }));
    
    try {
      // Optimistically update the local state
      const reorderedTasks = arrayMove(state.tasks, activeIndex, overIndex);
      setState(prev => ({ ...prev, tasks: reorderedTasks }));
      
      // Call the external reorder handler
      const taskIds = reorderedTasks.map(task => task.id);
      await onReorderTasks(taskIds);
      
      setState(prev => ({ ...prev, isReordering: false }));
    } catch (error) {
      // Revert the optimistic update on error
      setState(prev => ({
        ...prev,
        tasks,
        isReordering: false,
        error: error instanceof Error ? error.message : 'Failed to reorder tasks',
      }));
    }
  }, [state.tasks, tasks, onReorderTasks]);
  
  // =============================================
  // TASK OPERATION HANDLERS
  // =============================================
  
  const handleUpdateTask = React.useCallback(async (
    id: string, 
    updates: Partial<Task>
  ): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await onUpdateTask(id, updates);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update task',
      }));
      throw error; // Re-throw for individual task card error handling
    }
  }, [onUpdateTask]);
  
  const handleDeleteTask = React.useCallback(async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await onDeleteTask(id);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete task',
      }));
      throw error; // Re-throw for individual task card error handling
    }
  }, [onDeleteTask]);
  
  const handleToggleComplete = React.useCallback(async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await onToggleComplete(id);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to toggle task completion',
      }));
      throw error; // Re-throw for individual task card error handling
    }
  }, [onToggleComplete]);
  
  // =============================================
  // UI RENDER HELPERS
  // =============================================
  
  const renderEmptyState = React.useCallback((): React.ReactNode => {
    if (!emptyStateProps) return null;
    
    // This should be handled in the presenter component
    return null;
  }, [emptyStateProps]);
  
  const renderLoadingState = React.useCallback((): React.ReactNode => {
    // This should be handled in the presenter component
    return null;
  }, []);
  
  const renderErrorState = React.useCallback((): React.ReactNode => {
    // This should be handled in the presenter component
    return null;
  }, []);
  
  // =============================================
  // UTILITY FUNCTIONS
  // =============================================
  
  const getTaskIndex = React.useCallback((taskId: string): number => {
    return state.tasks.findIndex(task => task.id === taskId);
  }, [state.tasks]);
  
  const canReorder = React.useCallback((): boolean => {
    return state.tasks.length > 1 && !state.loading && !state.isReordering;
  }, [state.tasks.length, state.loading, state.isReordering]);
  
  const clearError = React.useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  // =============================================
  // MEMOIZED PROPS
  // =============================================
  
  const dndContextProps = React.useMemo(() => ({
    sensors,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  }), [sensors, handleDragStart, handleDragEnd]);
  
  const sortableContextProps = React.useMemo(() => ({
    items: state.tasks.map(task => task.id),
    strategy: verticalListSortingStrategy,
  }), [state.tasks]);
  
  // =============================================
  // RETURN INTERFACE
  // =============================================
  
  return {
    // State
    state,
    
    // Drag and drop context props
    dndContextProps,
    
    // Sortable context props
    sortableContextProps,
    
    // Task operations
    handleUpdateTask,
    handleDeleteTask,
    handleToggleComplete,
    
    // UI helpers
    renderEmptyState,
    renderLoadingState,
    renderErrorState,
    
    // Error handling
    clearError,
    
    // Utility
    getTaskIndex,
    canReorder,
  };
};