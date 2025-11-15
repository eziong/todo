// =============================================
// TASK CARD CONTAINER HOOK
// =============================================
// Business logic for task card component with inline editing, drag-and-drop, and modal integration

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useModalRouter, MODAL_TYPES } from '@/components/ModalRouter/useModalRouter';
import type { 
  TaskWithRelations, 
  TaskStatus,
  TaskPriority,
  User,
} from '@/types';

// =============================================
// TYPES
// =============================================

export interface TaskCardProps {
  task: TaskWithRelations;
  onUpdate: (id: string, updates: Partial<TaskWithRelations>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenModal: (task: TaskWithRelations) => void;
  onToggleComplete: (id: string) => Promise<void>;
  users?: User[];
  className?: string;
  disabled?: boolean;
}

export interface InlineEditState {
  field: 'title' | 'description' | null;
  value: string;
  isEditing: boolean;
  hasChanges: boolean;
}

export interface TaskCardState {
  // Data
  task: TaskWithRelations;
  
  // UI States
  inlineEdit: InlineEditState;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Visual states
  isHovered: boolean;
  isPressed: boolean;
  showActions: boolean;
  
  // Drag state
  isDragEnabled: boolean;
}

export interface UseTaskCardReturn {
  // State
  state: TaskCardState;
  
  // Drag and drop
  dragHandleProps: Record<string, unknown>;
  sortableProps: Record<string, unknown>;
  isDragging: boolean;
  
  // Inline editing
  startEdit: (field: 'title' | 'description') => void;
  cancelEdit: () => void;
  saveEdit: () => Promise<void>;
  updateEditValue: (value: string) => void;
  
  // Quick actions
  toggleComplete: () => Promise<void>;
  updateStatus: (status: TaskStatus) => Promise<void>;
  updatePriority: (priority: TaskPriority) => Promise<void>;
  updateAssignee: (userId: string | null) => Promise<void>;
  
  // Navigation
  openTaskModal: () => void;
  
  // UI events
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleMouseDown: () => void;
  handleMouseUp: () => void;
  
  // Error handling
  clearError: () => void;
  
  // Utility
  getStatusColor: () => string;
  getPriorityColor: () => string;
  getDueDateStatus: () => 'overdue' | 'due-soon' | 'normal' | null;
  formatDueDate: () => string;
  canEdit: () => boolean;
  shouldShowActions: () => boolean;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

const getStatusColor = (status: TaskStatus, theme?: unknown): string => {
  const colors = (theme as any)?.macOS?.todo?.task?.status || {
    todo: '#86868B',
    in_progress: '#007AFF',
    completed: '#34C759',
    cancelled: '#C7C7CC',
    on_hold: '#FF9500',
  };
  
  return colors[status] || colors.todo;
};

const getPriorityColor = (priority: TaskPriority, theme?: unknown): string => {
  const colors = (theme as any)?.macOS?.todo?.task?.priority || {
    low: '#86868B',
    medium: '#FF9500',
    high: '#FF3B30',
    urgent: '#AF52DE',
  };
  
  return colors[priority] || colors.low;
};

const getDueDateStatus = (dueDate?: string): 'overdue' | 'due-soon' | 'normal' | null => {
  if (!dueDate) return null;
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffInHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 0) return 'overdue';
  if (diffInHours < 24) return 'due-soon';
  return 'normal';
};

const formatDueDate = (dueDate?: string): string => {
  if (!dueDate) return '';
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) {
    return `${Math.abs(diffInDays)} days overdue`;
  } else if (diffInDays === 0) {
    return 'Due today';
  } else if (diffInDays === 1) {
    return 'Due tomorrow';
  } else if (diffInDays < 7) {
    return `Due in ${diffInDays} days`;
  } else {
    return due.toLocaleDateString();
  }
};

// =============================================
// CONTAINER HOOK IMPLEMENTATION
// =============================================

export const useTaskCard = ({
  task,
  onUpdate,
  onOpenModal,
  onToggleComplete,
  disabled = false,
}: TaskCardProps): UseTaskCardReturn => {
  
  // Modal router for URL-based modal management
  const { openModal } = useModalRouter();
  // =============================================
  // STATE MANAGEMENT
  // =============================================
  
  const [state, setState] = React.useState<TaskCardState>({
    task,
    inlineEdit: {
      field: null,
      value: '',
      isEditing: false,
      hasChanges: false,
    },
    isUpdating: false,
    isDeleting: false,
    error: null,
    isHovered: false,
    isPressed: false,
    showActions: false,
    isDragEnabled: !disabled,
  });
  
  // =============================================
  // DRAG AND DROP SETUP
  // =============================================
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: disabled || state.inlineEdit.isEditing,
    data: {
      type: 'task',
      task,
    },
  });
  
  // =============================================
  // UPDATE TASK WHEN PROP CHANGES
  // =============================================
  
  React.useEffect(() => {
    setState(prev => ({ ...prev, task }));
  }, [task]);
  
  // =============================================
  // INLINE EDITING
  // =============================================
  
  const startEdit = React.useCallback((field: 'title' | 'description'): void => {
    const value = field === 'title' ? task.title : (task.description || '');
    setState(prev => ({
      ...prev,
      inlineEdit: {
        field,
        value,
        isEditing: true,
        hasChanges: false,
      },
    }));
  }, [task.title, task.description]);
  
  const cancelEdit = React.useCallback((): void => {
    setState(prev => ({
      ...prev,
      inlineEdit: {
        field: null,
        value: '',
        isEditing: false,
        hasChanges: false,
      },
    }));
  }, []);
  
  const updateEditValue = React.useCallback((value: string): void => {
    setState(prev => {
      const currentValue = prev.inlineEdit.field === 'title' 
        ? task.title 
        : (task.description || '');
      
      return {
        ...prev,
        inlineEdit: {
          ...prev.inlineEdit,
          value,
          hasChanges: value !== currentValue,
        },
      };
    });
  }, [task.title, task.description]);
  
  const saveEdit = React.useCallback(async (): Promise<void> => {
    const { field, value, hasChanges } = state.inlineEdit;
    if (!field || !hasChanges) {
      cancelEdit();
      return;
    }
    
    setState(prev => ({ ...prev, isUpdating: true, error: null }));
    
    try {
      const updates = { [field]: value };
      await onUpdate(task.id, updates);
      
      setState(prev => ({
        ...prev,
        isUpdating: false,
        inlineEdit: {
          field: null,
          value: '',
          isEditing: false,
          hasChanges: false,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update task',
      }));
    }
  }, [state.inlineEdit, task.id, onUpdate, cancelEdit]);
  
  // =============================================
  // QUICK ACTIONS
  // =============================================
  
  const toggleComplete = React.useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));
    
    try {
      await onToggleComplete(task.id);
      setState(prev => ({ ...prev, isUpdating: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to toggle completion',
      }));
    }
  }, [task.id, onToggleComplete]);
  
  const updateStatus = React.useCallback(async (status: TaskStatus): Promise<void> => {
    if (status === task.status) return;
    
    setState(prev => ({ ...prev, isUpdating: true, error: null }));
    
    try {
      await onUpdate(task.id, { status });
      setState(prev => ({ ...prev, isUpdating: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update status',
      }));
    }
  }, [task.id, task.status, onUpdate]);
  
  const updatePriority = React.useCallback(async (priority: TaskPriority): Promise<void> => {
    if (priority === task.priority) return;
    
    setState(prev => ({ ...prev, isUpdating: true, error: null }));
    
    try {
      await onUpdate(task.id, { priority });
      setState(prev => ({ ...prev, isUpdating: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update priority',
      }));
    }
  }, [task.id, task.priority, onUpdate]);
  
  const updateAssignee = React.useCallback(async (userId: string | null): Promise<void> => {
    if (userId === task.assigned_to_user_id) return;
    
    setState(prev => ({ ...prev, isUpdating: true, error: null }));
    
    try {
      await onUpdate(task.id, { assigned_to_user_id: userId || undefined });
      setState(prev => ({ ...prev, isUpdating: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update assignee',
      }));
    }
  }, [task.id, task.assigned_to_user_id, onUpdate]);
  
  // =============================================
  // NAVIGATION
  // =============================================
  
  const openTaskModal = React.useCallback((): void => {
    if (state.inlineEdit.isEditing) return;
    
    // Use URL-based modal routing
    openModal(MODAL_TYPES.TASK_DETAIL, task.id);
    
    // Also call the optional callback if provided
    if (onOpenModal) {
      onOpenModal(task);
    }
  }, [state.inlineEdit.isEditing, openModal, task.id, task, onOpenModal]);
  
  // =============================================
  // UI EVENT HANDLERS
  // =============================================
  
  const handleMouseEnter = React.useCallback((): void => {
    setState(prev => ({ ...prev, isHovered: true, showActions: true }));
  }, []);
  
  const handleMouseLeave = React.useCallback((): void => {
    setState(prev => ({ ...prev, isHovered: false, showActions: false, isPressed: false }));
  }, []);
  
  const handleMouseDown = React.useCallback((): void => {
    setState(prev => ({ ...prev, isPressed: true }));
  }, []);
  
  const handleMouseUp = React.useCallback((): void => {
    setState(prev => ({ ...prev, isPressed: false }));
  }, []);
  
  // =============================================
  // UTILITY FUNCTIONS
  // =============================================
  
  const getStatusColorCallback = React.useCallback(() => getStatusColor(task.status), [task.status]);
  
  const getPriorityColorCallback = React.useCallback(() => getPriorityColor(task.priority), [task.priority]);
  
  const getDueDateStatusCallback = React.useCallback(() => getDueDateStatus(task.due_date), [task.due_date]);
  
  const formatDueDateCallback = React.useCallback(() => formatDueDate(task.due_date), [task.due_date]);
  
  const canEdit = React.useCallback((): boolean => {
    return !disabled && !state.isUpdating && !state.isDeleting;
  }, [disabled, state.isUpdating, state.isDeleting]);
  
  const shouldShowActions = React.useCallback((): boolean => {
    return state.showActions && !state.inlineEdit.isEditing;
  }, [state.showActions, state.inlineEdit.isEditing]);
  
  const clearError = React.useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  // =============================================
  // DRAG AND DROP PROPS
  // =============================================
  
  const dragHandleProps = React.useMemo(() => ({
    ...attributes,
    ...listeners,
    style: {
      cursor: isDragging ? 'grabbing' : 'grab',
    },
  }), [attributes, listeners, isDragging]);
  
  const sortableProps = React.useMemo(() => ({
    ref: setNodeRef,
    style: {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      zIndex: isDragging ? 1000 : 1,
      opacity: isDragging ? 0.8 : 1,
    },
  }), [setNodeRef, transform, transition, isDragging]);
  
  // =============================================
  // KEYBOARD SHORTCUTS
  // =============================================
  
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!state.inlineEdit.isEditing) return;
      
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void saveEdit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.inlineEdit.isEditing, saveEdit, cancelEdit]);
  
  // =============================================
  // RETURN INTERFACE
  // =============================================
  
  return {
    // State
    state,
    
    // Drag and drop
    dragHandleProps,
    sortableProps,
    isDragging,
    
    // Inline editing
    startEdit,
    cancelEdit,
    saveEdit,
    updateEditValue,
    
    // Quick actions
    toggleComplete,
    updateStatus,
    updatePriority,
    updateAssignee,
    
    // Navigation
    openTaskModal,
    
    // UI events
    handleMouseEnter,
    handleMouseLeave,
    handleMouseDown,
    handleMouseUp,
    
    // Error handling
    clearError,
    
    // Utility
    getStatusColor: getStatusColorCallback,
    getPriorityColor: getPriorityColorCallback,
    getDueDateStatus: getDueDateStatusCallback,
    formatDueDate: formatDueDateCallback,
    canEdit,
    shouldShowActions,
  };
};