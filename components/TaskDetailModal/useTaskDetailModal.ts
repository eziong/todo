// =============================================
// TASK DETAIL MODAL CONTAINER HOOK
// =============================================
// Business logic for comprehensive task detail modal with editing capabilities

import React from 'react';
import type { 
  TaskWithRelations, 
  User,
  TaskStatus,
  TaskPriority,
  TaskUpdate,
  TaskAttachment,
} from '@/types';

// =============================================
// TYPES
// =============================================

export interface TaskDetailModalProps {
  task: TaskWithRelations | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: TaskUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  users?: User[];
  availableTags?: string[];
  onUploadFile?: (file: File) => Promise<TaskAttachment>;
  onDeleteFile?: (attachmentId: string) => Promise<void>;
}

export interface TaskDetailFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to_user_id: string | null;
  start_date: string;
  end_date: string;
  due_date: string;
  tags: string[];
  estimated_hours: number | null;
}

export interface TaskDetailModalState {
  // Form data
  formData: TaskDetailFormData;
  
  // UI states
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  
  // Tab state
  activeTab: 'details' | 'comments' | 'history' | 'attachments';
  
  // File upload state
  isUploadingFile: boolean;
  uploadProgress: number;
  
  // Comment state
  newComment: string;
  isSubmittingComment: boolean;
  
  // Modal state
  showDeleteConfirm: boolean;
  showUnsavedChangesWarning: boolean;
  
  // Validation errors
  validationErrors: Record<string, string>;
}

export interface UseTaskDetailModalReturn {
  // State
  state: TaskDetailModalState;
  
  // Form handlers
  updateField: <K extends keyof TaskDetailFormData>(field: K, value: TaskDetailFormData[K]) => void;
  resetForm: () => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  
  // Tag management
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  
  // File management
  handleFileUpload: (files: FileList) => Promise<void>;
  handleFileDelete: (attachmentId: string) => Promise<void>;
  
  // Comment management
  updateComment: (comment: string) => void;
  submitComment: () => Promise<void>;
  
  // Tab management
  setActiveTab: (tab: TaskDetailModalState['activeTab']) => void;
  
  // Delete handlers
  showDeleteDialog: () => void;
  hideDeleteDialog: () => void;
  handleDelete: () => Promise<void>;
  
  // Validation
  validateForm: () => boolean;
  clearError: () => void;
  
  // Modal control
  handleClose: () => void;
  
  // Keyboard shortcuts
  handleKeyDown: (event: React.KeyboardEvent) => void;
  
  // Utility
  getStatusOptions: () => { value: TaskStatus; label: string; color: string }[];
  getPriorityOptions: () => { value: TaskPriority; label: string; color: string }[];
  getUserOptions: () => { value: string; label: string; avatar?: string }[];
  getChangedFields: () => Partial<TaskUpdate>;
  canSave: () => boolean;
  canDelete: () => boolean;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

const createInitialFormData = (task: TaskWithRelations | null): TaskDetailFormData => {
  if (!task) {
    return {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assigned_to_user_id: null,
      start_date: '',
      end_date: '',
      due_date: '',
      tags: [],
      estimated_hours: null,
    };
  }

  return {
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assigned_to_user_id: task.assigned_to_user_id || null,
    start_date: task.start_date || '',
    end_date: task.end_date || '',
    due_date: task.due_date || '',
    tags: [...(task.tags || [])],
    estimated_hours: task.estimated_hours ?? null,
  };
};

const validateTaskForm = (formData: TaskDetailFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Title is required
  if (!formData.title.trim()) {
    errors.title = 'Title is required';
  } else if (formData.title.length > 255) {
    errors.title = 'Title must be less than 255 characters';
  }

  // Description length check
  if (formData.description && formData.description.length > 2000) {
    errors.description = 'Description must be less than 2000 characters';
  }

  // Date validation
  if (formData.start_date && formData.end_date) {
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    if (startDate >= endDate) {
      errors.end_date = 'End date must be after start date';
    }
  }

  if (formData.start_date && formData.due_date) {
    const startDate = new Date(formData.start_date);
    const dueDate = new Date(formData.due_date);
    if (startDate > dueDate) {
      errors.due_date = 'Due date must be after start date';
    }
  }

  // Estimated hours validation
  if (formData.estimated_hours !== null && formData.estimated_hours < 0) {
    errors.estimated_hours = 'Estimated hours must be a positive number';
  }

  // Tags validation
  if (formData.tags.length > 10) {
    errors.tags = 'Maximum 10 tags allowed';
  }

  return errors;
};

// =============================================
// CONTAINER HOOK IMPLEMENTATION
// =============================================

export const useTaskDetailModal = ({
  task,
  open,
  onClose,
  onUpdate,
  onDelete,
  users = [],
  onUploadFile,
  onDeleteFile,
}: TaskDetailModalProps): UseTaskDetailModalReturn => {
  // =============================================
  // STATE MANAGEMENT
  // =============================================
  
  const [state, setState] = React.useState<TaskDetailModalState>({
    formData: createInitialFormData(task),
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    error: null,
    hasUnsavedChanges: false,
    activeTab: 'details',
    isUploadingFile: false,
    uploadProgress: 0,
    newComment: '',
    isSubmittingComment: false,
    showDeleteConfirm: false,
    showUnsavedChangesWarning: false,
    validationErrors: {},
  });
  
  // =============================================
  // FORM DATA MANAGEMENT
  // =============================================
  
  const updateField = React.useCallback(<K extends keyof TaskDetailFormData>(
    field: K, 
    value: TaskDetailFormData[K]
  ): void => {
    setState(prev => {
      const newFormData = { ...prev.formData, [field]: value };
      const originalData = createInitialFormData(task);
      const hasChanges = JSON.stringify(newFormData) !== JSON.stringify(originalData);
      
      // Clear field-specific validation error
      const newValidationErrors = { ...prev.validationErrors };
      delete newValidationErrors[field];
      
      return {
        ...prev,
        formData: newFormData,
        hasUnsavedChanges: hasChanges,
        validationErrors: newValidationErrors,
      };
    });
  }, [task]);
  
  const resetForm = React.useCallback((): void => {
    setState(prev => ({
      ...prev,
      formData: createInitialFormData(task),
      hasUnsavedChanges: false,
      validationErrors: {},
      error: null,
    }));
  }, [task]);
  
  // =============================================
  // UPDATE FORM WHEN TASK CHANGES
  // =============================================
  
  React.useEffect(() => {
    if (open) {
      setState(prev => ({
        ...prev,
        formData: createInitialFormData(task),
        hasUnsavedChanges: false,
        validationErrors: {},
        error: null,
      }));
    }
  }, [task, open]);
  
  // =============================================
  // FORM VALIDATION
  // =============================================
  
  const validateForm = React.useCallback((): boolean => {
    const errors = validateTaskForm(state.formData);
    setState(prev => ({ ...prev, validationErrors: errors }));
    return Object.keys(errors).length === 0;
  }, [state.formData]);
  
  // =============================================
  // SAVE HANDLER
  // =============================================
  
  const handleSave = React.useCallback(async (): Promise<void> => {
    if (!task || !validateForm()) {
      return;
    }
    
    setState(prev => ({ ...prev, isSaving: true, error: null }));
    
    try {
      const updates: TaskUpdate = {};
      const originalData = createInitialFormData(task);
      
      // Only include changed fields
      (Object.keys(state.formData) as (keyof TaskDetailFormData)[]).forEach(key => {
        if (JSON.stringify(state.formData[key]) !== JSON.stringify(originalData[key])) {
          (updates as Record<string, unknown>)[key] = state.formData[key];
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await onUpdate(task.id, updates);
      }
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: false,
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save task',
      }));
    }
  }, [task, state.formData, onUpdate, validateForm]);
  
  // =============================================
  // TAG MANAGEMENT
  // =============================================
  
  const addTag = React.useCallback((tag: string): void => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !state.formData.tags.includes(trimmedTag)) {
      updateField('tags', [...state.formData.tags, trimmedTag]);
    }
  }, [state.formData.tags, updateField]);
  
  const removeTag = React.useCallback((tag: string): void => {
    updateField('tags', state.formData.tags.filter(t => t !== tag));
  }, [state.formData.tags, updateField]);
  
  // =============================================
  // FILE MANAGEMENT
  // =============================================
  
  const handleFileUpload = React.useCallback(async (files: FileList): Promise<void> => {
    if (!onUploadFile || files.length === 0) return;
    
    setState(prev => ({ 
      ...prev, 
      isUploadingFile: true, 
      uploadProgress: 0,
      error: null 
    }));
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setState(prev => ({ 
          ...prev, 
          uploadProgress: ((i + 1) / files.length) * 100 
        }));
        
        await onUploadFile(file);
      }
      
      setState(prev => ({ 
        ...prev, 
        isUploadingFile: false, 
        uploadProgress: 0 
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUploadingFile: false,
        uploadProgress: 0,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      }));
    }
  }, [onUploadFile]);
  
  const handleFileDelete = React.useCallback(async (attachmentId: string): Promise<void> => {
    if (!onDeleteFile) return;
    
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await onDeleteFile(attachmentId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      }));
    }
  }, [onDeleteFile]);
  
  // =============================================
  // COMMENT MANAGEMENT
  // =============================================
  
  const updateComment = React.useCallback((comment: string): void => {
    setState(prev => ({ ...prev, newComment: comment }));
  }, []);
  
  const submitComment = React.useCallback(async (): Promise<void> => {
    if (!state.newComment.trim()) return;
    
    setState(prev => ({ ...prev, isSubmittingComment: true, error: null }));
    
    try {
      // TODO: Implement comment submission when API is ready
      // console.log('Submitting comment:', state.newComment);
      
      setState(prev => ({
        ...prev,
        isSubmittingComment: false,
        newComment: '',
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmittingComment: false,
        error: error instanceof Error ? error.message : 'Failed to submit comment',
      }));
    }
  }, [state.newComment]);
  
  // =============================================
  // TAB MANAGEMENT
  // =============================================
  
  const setActiveTab = React.useCallback((tab: TaskDetailModalState['activeTab']): void => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);
  
  // =============================================
  // DELETE HANDLERS
  // =============================================
  
  const showDeleteDialog = React.useCallback((): void => {
    setState(prev => ({ ...prev, showDeleteConfirm: true }));
  }, []);
  
  const hideDeleteDialog = React.useCallback((): void => {
    setState(prev => ({ ...prev, showDeleteConfirm: false }));
  }, []);
  
  const handleDelete = React.useCallback(async (): Promise<void> => {
    if (!task) return;
    
    setState(prev => ({ ...prev, isDeleting: true, error: null }));
    
    try {
      await onDelete(task.id);
      setState(prev => ({ ...prev, isDeleting: false }));
      onClose();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Failed to delete task',
      }));
    }
  }, [task, onDelete, onClose]);
  
  // =============================================
  // MODAL CONTROL
  // =============================================
  
  const handleCancel = React.useCallback((): void => {
    if (state.hasUnsavedChanges) {
      setState(prev => ({ ...prev, showUnsavedChangesWarning: true }));
    } else {
      onClose();
    }
  }, [state.hasUnsavedChanges, onClose]);
  
  const handleClose = React.useCallback((): void => {
    setState(prev => ({ 
      ...prev, 
      showUnsavedChangesWarning: false, 
      showDeleteConfirm: false 
    }));
    onClose();
  }, [onClose]);
  
  // =============================================
  // UTILITY FUNCTIONS
  // =============================================
  
  const clearError = React.useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  const getStatusOptions = React.useCallback(() => [
    { value: 'todo' as TaskStatus, label: 'To Do', color: '#86868B' },
    { value: 'in_progress' as TaskStatus, label: 'In Progress', color: '#007AFF' },
    { value: 'completed' as TaskStatus, label: 'Completed', color: '#34C759' },
    { value: 'on_hold' as TaskStatus, label: 'On Hold', color: '#FF9500' },
    { value: 'cancelled' as TaskStatus, label: 'Cancelled', color: '#C7C7CC' },
  ], []);
  
  const getPriorityOptions = React.useCallback(() => [
    { value: 'low' as TaskPriority, label: 'Low', color: '#86868B' },
    { value: 'medium' as TaskPriority, label: 'Medium', color: '#FF9500' },
    { value: 'high' as TaskPriority, label: 'High', color: '#FF3B30' },
    { value: 'urgent' as TaskPriority, label: 'Urgent', color: '#AF52DE' },
  ], []);
  
  const getUserOptions = React.useCallback(() => [
    { value: '', label: 'Unassigned' },
    ...users.map(user => ({
      value: user.id,
      label: user.name,
      avatar: user.avatar_url,
    })),
  ], [users]);
  
  const getChangedFields = React.useCallback((): Partial<TaskUpdate> => {
    if (!task) return {};
    
    const updates: Partial<TaskUpdate> = {};
    const originalData = createInitialFormData(task);
    
    (Object.keys(state.formData) as (keyof TaskDetailFormData)[]).forEach(key => {
      if (JSON.stringify(state.formData[key]) !== JSON.stringify(originalData[key])) {
        (updates as Record<string, unknown>)[key] = state.formData[key];
      }
    });
    
    return updates;
  }, [task, state.formData]);
  
  const canSave = React.useCallback((): boolean => {
    return Boolean(task) && 
           state.hasUnsavedChanges && 
           !state.isSaving && 
           !state.isDeleting &&
           state.formData.title.trim() !== '';
  }, [task, state.hasUnsavedChanges, state.isSaving, state.isDeleting, state.formData.title]);
  
  const canDelete = React.useCallback((): boolean => {
    return Boolean(task) && !state.isSaving && !state.isDeleting;
  }, [task, state.isSaving, state.isDeleting]);
  
  // =============================================
  // KEYBOARD SHORTCUTS
  // =============================================
  
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent): void => {
    // Escape to close
    if (event.key === 'Escape' && !state.showDeleteConfirm && !state.showUnsavedChangesWarning) {
      event.preventDefault();
      handleCancel();
    }
    
    // Ctrl/Cmd + S to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      if (canSave()) {
        void handleSave();
      }
    }
    
    // Ctrl/Cmd + Enter to save and close
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (canSave()) {
        void handleSave();
      }
    }
  }, [state.showDeleteConfirm, state.showUnsavedChangesWarning, handleCancel, canSave, handleSave]);
  
  // =============================================
  // RETURN INTERFACE
  // =============================================
  
  return {
    // State
    state,
    
    // Form handlers
    updateField,
    resetForm,
    handleSave,
    handleCancel,
    
    // Tag management
    addTag,
    removeTag,
    
    // File management
    handleFileUpload,
    handleFileDelete,
    
    // Comment management
    updateComment,
    submitComment,
    
    // Tab management
    setActiveTab,
    
    // Delete handlers
    showDeleteDialog,
    hideDeleteDialog,
    handleDelete,
    
    // Validation
    validateForm,
    clearError,
    
    // Modal control
    handleClose,
    
    // Keyboard shortcuts
    handleKeyDown,
    
    // Utility
    getStatusOptions,
    getPriorityOptions,
    getUserOptions,
    getChangedFields,
    canSave,
    canDelete,
  };
};