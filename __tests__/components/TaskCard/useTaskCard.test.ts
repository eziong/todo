import { renderHook, act } from '@testing-library/react'
import { useTaskCard } from '@/components/TaskCard/useTaskCard'
import { createTestQueryClient } from '@/__tests__/utils/test-utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock dependencies
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

jest.mock('@/components/ModalRouter/useModalRouter', () => ({
  useModalRouter: () => ({
    openModal: jest.fn(),
  }),
  MODAL_TYPES: {
    TASK_DETAIL: 'task-detail',
  },
}))

const createWrapper = () => {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTaskCard', () => {
  const mockTask = {
    id: 'task-1',
    sectionId: 'section-1',
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo' as const,
    priority: 'medium' as const,
    assignedToUserId: null,
    dueDate: null,
    position: 0,
    isArchived: false,
    tags: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: 'user-1',
  }

  const mockProps = {
    task: mockTask,
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    onOpenModal: jest.fn(),
    onToggleComplete: jest.fn(),
    users: [
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        avatar_url: null,
        google_id: null,
        timezone: 'UTC',
        preferences: {
          theme: 'auto',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            task_assignments: true,
            due_date_reminders: true,
          },
          ui: {
            compact_mode: false,
            show_completed_tasks: true,
            default_view: 'list',
          },
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        last_active_at: '2023-01-01T00:00:00Z',
      }
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTaskCard(mockProps), {
      wrapper: createWrapper(),
    })

    expect(result.current.state.task).toEqual(mockTask)
    expect(result.current.state.inlineEdit.isEditing).toBe(false)
    expect(result.current.state.isUpdating).toBe(false)
    expect(result.current.state.error).toBe(null)
    expect(result.current.state.isHovered).toBe(false)
  })

  describe('inline editing', () => {
    it('should start editing title', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startEdit('title')
      })

      expect(result.current.state.inlineEdit.isEditing).toBe(true)
      expect(result.current.state.inlineEdit.field).toBe('title')
      expect(result.current.state.inlineEdit.value).toBe('Test Task')
    })

    it('should start editing description', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startEdit('description')
      })

      expect(result.current.state.inlineEdit.isEditing).toBe(true)
      expect(result.current.state.inlineEdit.field).toBe('description')
      expect(result.current.state.inlineEdit.value).toBe('Test task description')
    })

    it('should update edit value', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startEdit('title')
      })

      act(() => {
        result.current.updateEditValue('Updated Title')
      })

      expect(result.current.state.inlineEdit.value).toBe('Updated Title')
      expect(result.current.state.inlineEdit.hasChanges).toBe(true)
    })

    it('should cancel edit', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startEdit('title')
      })

      act(() => {
        result.current.updateEditValue('Changed')
      })

      act(() => {
        result.current.cancelEdit()
      })

      expect(result.current.state.inlineEdit.isEditing).toBe(false)
      expect(result.current.state.inlineEdit.hasChanges).toBe(false)
      expect(result.current.state.inlineEdit.value).toBe('')
    })

    it('should save edit when changes exist', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined)
      const propsWithUpdate = { ...mockProps, onUpdate: mockOnUpdate }

      const { result } = renderHook(() => useTaskCard(propsWithUpdate), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startEdit('title')
      })

      act(() => {
        result.current.updateEditValue('Updated Title')
      })

      await act(async () => {
        await result.current.saveEdit()
      })

      expect(mockOnUpdate).toHaveBeenCalledWith('task-1', { title: 'Updated Title' })
      expect(result.current.state.inlineEdit.isEditing).toBe(false)
    })

    it('should not save edit when no changes', async () => {
      const mockOnUpdate = jest.fn()
      const propsWithUpdate = { ...mockProps, onUpdate: mockOnUpdate }

      const { result } = renderHook(() => useTaskCard(propsWithUpdate), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startEdit('title')
      })

      await act(async () => {
        await result.current.saveEdit()
      })

      expect(mockOnUpdate).not.toHaveBeenCalled()
      expect(result.current.state.inlineEdit.isEditing).toBe(false)
    })

    it('should handle save edit error', async () => {
      const mockOnUpdate = jest.fn().mockRejectedValue(new Error('Update failed'))
      const propsWithUpdate = { ...mockProps, onUpdate: mockOnUpdate }

      const { result } = renderHook(() => useTaskCard(propsWithUpdate), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startEdit('title')
      })

      act(() => {
        result.current.updateEditValue('Updated Title')
      })

      await act(async () => {
        await result.current.saveEdit()
      })

      expect(result.current.state.error).toBe('Update failed')
      expect(result.current.state.inlineEdit.isEditing).toBe(false)
    })
  })

  describe('quick actions', () => {
    it('should toggle complete', async () => {
      const mockOnToggleComplete = jest.fn().mockResolvedValue(undefined)
      const propsWithToggle = { ...mockProps, onToggleComplete: mockOnToggleComplete }

      const { result } = renderHook(() => useTaskCard(propsWithToggle), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.toggleComplete()
      })

      expect(mockOnToggleComplete).toHaveBeenCalledWith('task-1')
    })

    it('should handle toggle complete error', async () => {
      const mockOnToggleComplete = jest.fn().mockRejectedValue(new Error('Toggle failed'))
      const propsWithToggle = { ...mockProps, onToggleComplete: mockOnToggleComplete }

      const { result } = renderHook(() => useTaskCard(propsWithToggle), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.toggleComplete()
      })

      expect(result.current.state.error).toBe('Toggle failed')
    })

    it('should update status', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined)
      const propsWithUpdate = { ...mockProps, onUpdate: mockOnUpdate }

      const { result } = renderHook(() => useTaskCard(propsWithUpdate), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.updateStatus('in_progress')
      })

      expect(mockOnUpdate).toHaveBeenCalledWith('task-1', { status: 'in_progress' })
    })

    it('should update priority', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined)
      const propsWithUpdate = { ...mockProps, onUpdate: mockOnUpdate }

      const { result } = renderHook(() => useTaskCard(propsWithUpdate), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.updatePriority('high')
      })

      expect(mockOnUpdate).toHaveBeenCalledWith('task-1', { priority: 'high' })
    })

    it('should update assignee', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined)
      const propsWithUpdate = { ...mockProps, onUpdate: mockOnUpdate }

      const { result } = renderHook(() => useTaskCard(propsWithUpdate), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.updateAssignee('user-1')
      })

      expect(mockOnUpdate).toHaveBeenCalledWith('task-1', { assignedToUserId: 'user-1' })
    })
  })

  describe('UI interactions', () => {
    it('should handle mouse enter', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.handleMouseEnter()
      })

      expect(result.current.state.isHovered).toBe(true)
      expect(result.current.state.showActions).toBe(true)
    })

    it('should handle mouse leave', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.handleMouseEnter()
      })

      expect(result.current.state.isHovered).toBe(true)

      act(() => {
        result.current.handleMouseLeave()
      })

      expect(result.current.state.isHovered).toBe(false)
      expect(result.current.state.showActions).toBe(false)
    })

    it('should handle mouse down and up', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.handleMouseDown()
      })

      expect(result.current.state.isPressed).toBe(true)

      act(() => {
        result.current.handleMouseUp()
      })

      expect(result.current.state.isPressed).toBe(false)
    })
  })

  describe('modal integration', () => {
    it('should open task modal', () => {
      const mockOnOpenModal = jest.fn()
      const propsWithModal = { ...mockProps, onOpenModal: mockOnOpenModal }

      const { result } = renderHook(() => useTaskCard(propsWithModal), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.openTaskModal()
      })

      expect(mockOnOpenModal).toHaveBeenCalledWith(mockTask)
    })
  })

  describe('utility functions', () => {
    it('should get status color', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      const color = result.current.getStatusColor()
      expect(typeof color).toBe('string')
    })

    it('should get priority color', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      const color = result.current.getPriorityColor()
      expect(typeof color).toBe('string')
    })

    it('should get due date status for overdue task', () => {
      const overdueTask = {
        ...mockTask,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      }
      const propsWithOverdue = { ...mockProps, task: overdueTask }

      const { result } = renderHook(() => useTaskCard(propsWithOverdue), {
        wrapper: createWrapper(),
      })

      const status = result.current.getDueDateStatus()
      expect(status).toBe('overdue')
    })

    it('should get due date status for due soon task', () => {
      const dueSoonTask = {
        ...mockTask,
        dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
      }
      const propsWithDueSoon = { ...mockProps, task: dueSoonTask }

      const { result } = renderHook(() => useTaskCard(propsWithDueSoon), {
        wrapper: createWrapper(),
      })

      const status = result.current.getDueDateStatus()
      expect(status).toBe('due-soon')
    })

    it('should return null for task with no due date', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      const status = result.current.getDueDateStatus()
      expect(status).toBe(null)
    })

    it('should format due date', () => {
      const taskWithDueDate = {
        ...mockTask,
        dueDate: '2023-12-25T00:00:00Z',
      }
      const propsWithDueDate = { ...mockProps, task: taskWithDueDate }

      const { result } = renderHook(() => useTaskCard(propsWithDueDate), {
        wrapper: createWrapper(),
      })

      const formattedDate = result.current.formatDueDate()
      expect(formattedDate).toContain('Dec') // Should contain month abbreviation
    })

    it('should determine if task can be edited', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      expect(result.current.canEdit()).toBe(true)
    })

    it('should determine if task cannot be edited when disabled', () => {
      const disabledProps = { ...mockProps, disabled: true }
      const { result } = renderHook(() => useTaskCard(disabledProps), {
        wrapper: createWrapper(),
      })

      expect(result.current.canEdit()).toBe(false)
    })

    it('should determine when to show actions', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      // Initially should not show actions
      expect(result.current.shouldShowActions()).toBe(false)

      // Should show actions when hovered
      act(() => {
        result.current.handleMouseEnter()
      })

      expect(result.current.shouldShowActions()).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useTaskCard(mockProps), {
        wrapper: createWrapper(),
      })

      // Set an error first
      act(() => {
        // Simulate an error by triggering a failed update
        result.current.state.error = 'Test error'
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.state.error).toBe(null)
    })
  })

  describe('loading states', () => {
    it('should show updating state during status update', async () => {
      const mockOnUpdate = jest.fn(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      const propsWithSlowUpdate = { ...mockProps, onUpdate: mockOnUpdate }

      const { result } = renderHook(() => useTaskCard(propsWithSlowUpdate), {
        wrapper: createWrapper(),
      })

      // Start the update
      act(() => {
        result.current.updateStatus('in_progress')
      })

      // Should be in updating state
      expect(result.current.state.isUpdating).toBe(true)

      // Wait for update to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
      })

      expect(result.current.state.isUpdating).toBe(false)
    })
  })
})