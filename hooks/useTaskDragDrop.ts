// =============================================
// TASK DRAG AND DROP CONTAINER HOOK
// =============================================
// Container logic for drag-and-drop task operations

'use client';

import { useState, useCallback, useRef } from 'react';
import { useTaskMutations } from './useTaskMutations';

export interface DraggedTask {
  id: string;
  title: string;
  section_id: string;
  position: number;
  workspace_id: string;
}

export interface DropTarget {
  type: 'section' | 'position';
  section_id: string;
  position?: number;
  workspace_id: string;
}

export interface DragDropState {
  isDragging: boolean;
  draggedTask: DraggedTask | null;
  draggedOverTarget: DropTarget | null;
  dragPreview: {
    x: number;
    y: number;
    visible: boolean;
  };
}

export interface UseTaskDragDropOptions {
  onDragStart?: (task: DraggedTask) => void;
  onDragEnd?: (task: DraggedTask, target: DropTarget | null, success: boolean) => void;
  onDrop?: (task: DraggedTask, target: DropTarget) => void;
  onError?: (error: string) => void;
  allowCrossSectionMove?: boolean;
  allowCrossWorkspaceMove?: boolean;
}

export interface UseTaskDragDropReturn {
  // Drag state
  dragState: DragDropState;
  
  // Drag operations
  startDrag: (task: DraggedTask, event: React.DragEvent | React.PointerEvent) => void;
  endDrag: () => void;
  
  // Drop operations
  handleDragOver: (target: DropTarget, event: React.DragEvent) => void;
  handleDragEnter: (target: DropTarget, event: React.DragEvent) => void;
  handleDragLeave: (event: React.DragEvent) => void;
  handleDrop: (target: DropTarget, event: React.DragEvent) => Promise<void>;
  
  // Utilities
  canDropOnTarget: (task: DraggedTask, target: DropTarget) => boolean;
  isValidDrop: (task: DraggedTask, target: DropTarget) => boolean;
  getDragPreviewStyle: () => React.CSSProperties;
  
  // Touch support
  handleTouchStart: (task: DraggedTask, event: React.TouchEvent) => void;
  handleTouchMove: (event: React.TouchEvent) => void;
  handleTouchEnd: (event: React.TouchEvent) => void;
  
  // Cleanup
  clearDragState: () => void;
}

/**
 * Hook for task drag-and-drop operations
 * Supports both mouse and touch interactions with comprehensive validation
 */
export const useTaskDragDrop = (
  options: UseTaskDragDropOptions = {}
): UseTaskDragDropReturn => {
  const {
    onDragStart,
    onDragEnd,
    onDrop,
    onError,
    allowCrossSectionMove = true,
    allowCrossWorkspaceMove = false,
  } = options;

  const { updatePosition, moveTask } = useTaskMutations({
    onError,
  });

  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedTask: null,
    draggedOverTarget: null,
    dragPreview: {
      x: 0,
      y: 0,
      visible: false,
    },
  });

  // Touch tracking refs
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchThresholdRef = useRef<number>(10); // pixels to start drag
  const isDragStartedRef = useRef<boolean>(false);

  // Clear drag state
  const clearDragState = useCallback((): void => {
    setDragState({
      isDragging: false,
      draggedTask: null,
      draggedOverTarget: null,
      dragPreview: {
        x: 0,
        y: 0,
        visible: false,
      },
    });
    isDragStartedRef.current = false;
    touchStartRef.current = null;
  }, []);

  // Check if task can be dropped on target
  const canDropOnTarget = useCallback((task: DraggedTask, target: DropTarget): boolean => {
    // Same task can't be dropped on itself
    if (task.id === target.section_id) {
      return false;
    }

    // Cross-workspace validation
    if (!allowCrossWorkspaceMove && task.workspace_id !== target.workspace_id) {
      return false;
    }

    // Cross-section validation
    if (!allowCrossSectionMove && task.section_id !== target.section_id) {
      return false;
    }

    return true;
  }, [allowCrossSectionMove, allowCrossWorkspaceMove]);

  // Validate drop operation
  const isValidDrop = useCallback((task: DraggedTask, target: DropTarget): boolean => {
    if (!canDropOnTarget(task, target)) {
      return false;
    }

    // Position validation
    if (target.type === 'position' && typeof target.position !== 'number') {
      return false;
    }

    // Same section, same position - no-op
    if (task.section_id === target.section_id && task.position === target.position) {
      return false;
    }

    return true;
  }, [canDropOnTarget]);

  // Start drag operation
  const startDrag = useCallback((task: DraggedTask, event: React.DragEvent | React.PointerEvent): void => {
    if (dragState.isDragging) {
      return;
    }

    const clientX = 'clientX' in event ? event.clientX : 0;
    const clientY = 'clientY' in event ? event.clientY : 0;

    setDragState({
      isDragging: true,
      draggedTask: task,
      draggedOverTarget: null,
      dragPreview: {
        x: clientX,
        y: clientY,
        visible: true,
      },
    });

    onDragStart?.(task);
  }, [dragState.isDragging, onDragStart]);

  // End drag operation
  const endDrag = useCallback((): void => {
    const { draggedTask, draggedOverTarget } = dragState;
    
    onDragEnd?.(
      draggedTask!, 
      draggedOverTarget, 
      draggedOverTarget !== null && draggedTask !== null && isValidDrop(draggedTask, draggedOverTarget)
    );

    clearDragState();
  }, [dragState, onDragEnd, isValidDrop, clearDragState]);

  // Handle drag over
  const handleDragOver = useCallback((target: DropTarget, event: React.DragEvent): void => {
    event.preventDefault();

    if (!dragState.draggedTask) {
      return;
    }

    if (canDropOnTarget(dragState.draggedTask, target)) {
      event.dataTransfer.dropEffect = 'move';
      
      setDragState(prev => ({
        ...prev,
        draggedOverTarget: target,
        dragPreview: {
          ...prev.dragPreview,
          x: event.clientX,
          y: event.clientY,
        },
      }));
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  }, [dragState.draggedTask, canDropOnTarget]);

  // Handle drag enter
  const handleDragEnter = useCallback((target: DropTarget, event: React.DragEvent): void => {
    event.preventDefault();
    
    if (!dragState.draggedTask) {
      return;
    }

    if (canDropOnTarget(dragState.draggedTask, target)) {
      setDragState(prev => ({
        ...prev,
        draggedOverTarget: target,
      }));
    }
  }, [dragState.draggedTask, canDropOnTarget]);

  // Handle drag leave
  const handleDragLeave = useCallback((event: React.DragEvent): void => {
    // Only clear target if leaving the actual drop zone
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragState(prev => ({
        ...prev,
        draggedOverTarget: null,
      }));
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(async (target: DropTarget, event: React.DragEvent): Promise<void> => {
    event.preventDefault();

    const { draggedTask } = dragState;
    
    if (!draggedTask) {
      return;
    }

    if (!isValidDrop(draggedTask, target)) {
      onError?.('Invalid drop target');
      endDrag();
      return;
    }

    try {
      onDrop?.(draggedTask, target);

      // Determine if this is a move between sections or just a reorder
      const isCrossSection = draggedTask.section_id !== target.section_id;
      
      if (isCrossSection) {
        // Move to different section
        await moveTask(draggedTask.id, {
          target_section_id: target.section_id,
          position: target.position,
        });
      } else {
        // Reorder within same section
        if (target.position !== undefined) {
          await updatePosition(draggedTask.id, {
            position: target.position,
          });
        }
      }

      endDrag();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Drop operation failed';
      onError?.(errorMessage);
      endDrag();
    }
  }, [dragState, isValidDrop, onError, onDrop, moveTask, updatePosition, endDrag]);

  // Touch handlers for mobile support
  const handleTouchStart = useCallback((task: DraggedTask, event: React.TouchEvent): void => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isDragStartedRef.current = false;
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent): void => {
    if (!touchStartRef.current) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (!isDragStartedRef.current && distance > touchThresholdRef.current) {
      // Start drag on touch move if threshold exceeded
      isDragStartedRef.current = true;
      // Note: Touch drag implementation would need additional work
      // This is a basic structure for touch support
    }

    if (isDragStartedRef.current) {
      event.preventDefault();
      
      setDragState(prev => ({
        ...prev,
        dragPreview: {
          ...prev.dragPreview,
          x: touch.clientX,
          y: touch.clientY,
        },
      }));
    }
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent): void => {
    if (isDragStartedRef.current) {
      // Handle touch drop logic here
      endDrag();
    }
    
    touchStartRef.current = null;
    isDragStartedRef.current = false;
  }, [endDrag]);

  // Get drag preview styles
  const getDragPreviewStyle = useCallback((): React.CSSProperties => {
    if (!dragState.dragPreview.visible) {
      return { display: 'none' };
    }

    return {
      position: 'fixed',
      top: dragState.dragPreview.y - 10,
      left: dragState.dragPreview.x - 10,
      pointerEvents: 'none',
      zIndex: 1000,
      opacity: 0.8,
      transform: 'rotate(-5deg)',
      transition: 'none',
    };
  }, [dragState.dragPreview]);

  return {
    // Drag state
    dragState,
    
    // Drag operations
    startDrag,
    endDrag,
    
    // Drop operations
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    
    // Utilities
    canDropOnTarget,
    isValidDrop,
    getDragPreviewStyle,
    
    // Touch support
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    
    // Cleanup
    clearDragState,
  };
};