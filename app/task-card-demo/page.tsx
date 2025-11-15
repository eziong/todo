// =============================================
// TASK CARD DEMO PAGE
// =============================================
// Demonstration page showcasing the TaskCard component with all features

'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  useTheme,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { TaskList } from '@/components/TaskList';
import type { TaskWithRelations, User, TaskStatus, TaskPriority } from '@/types';

// =============================================
// MOCK DATA
// =============================================

const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar_url: 'https://i.pravatar.cc/40?u=john',
    timezone: 'America/New_York',
    preferences: { theme: 'light' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_deleted: false,
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar_url: 'https://i.pravatar.cc/40?u=jane',
    timezone: 'America/Los_Angeles',
    preferences: { theme: 'dark' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_deleted: false,
  },
  {
    id: 'user3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    avatar_url: 'https://i.pravatar.cc/40?u=mike',
    timezone: 'Europe/London',
    preferences: { theme: 'auto' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_deleted: false,
  },
];

const createMockTask = (
  id: string,
  title: string,
  description: string,
  status: TaskStatus,
  priority: TaskPriority,
  assigneeId?: string,
  dueDate?: string,
  tags: string[] = []
): TaskWithRelations => ({
  id,
  title,
  description,
  status,
  priority,
  section_id: 'section1',
  workspace_id: 'workspace1',
  assigned_to_user_id: assigneeId || undefined,
  created_by_user_id: 'user1',
  position: parseInt(id),
  tags,
  due_date: dueDate,
  start_date: undefined,
  end_date: undefined,
  completed_at: status === 'completed' ? '2024-11-15T00:00:00Z' : undefined,
  estimated_hours: undefined,
  actual_hours: undefined,
  attachments: [],
  created_at: '2024-11-10T00:00:00Z',
  updated_at: '2024-11-15T00:00:00Z',
  is_deleted: false,
});

// =============================================
// DEMO PAGE COMPONENT
// =============================================

export default function TaskCardDemoPage(): React.ReactElement {
  const theme = useTheme();
  const [tasks, setTasks] = React.useState<TaskWithRelations[]>([
    createMockTask(
      '1',
      'Implement user authentication',
      'Set up JWT-based authentication with Google OAuth integration and password reset functionality.',
      'in_progress',
      'high',
      'user1',
      '2024-11-20',
      ['auth', 'security', 'backend']
    ),
    createMockTask(
      '2',
      'Design homepage layout',
      'Create responsive homepage design with hero section, feature highlights, and testimonials.',
      'todo',
      'medium',
      'user2',
      '2024-11-25',
      ['ui', 'design', 'frontend']
    ),
    createMockTask(
      '3',
      'Set up CI/CD pipeline',
      'Configure GitHub Actions for automated testing and deployment to staging and production environments.',
      'todo',
      'urgent',
      undefined,
      '2024-11-18',
      ['devops', 'automation']
    ),
    createMockTask(
      '4',
      'Write API documentation',
      'Document all REST API endpoints with examples, request/response formats, and authentication requirements.',
      'completed',
      'low',
      'user3',
      undefined,
      ['docs', 'api']
    ),
    createMockTask(
      '5',
      'Fix mobile responsive issues',
      'Address layout problems on mobile devices, especially in the navigation and form components.',
      'todo',
      'medium',
      'user2',
      '2024-11-16',
      ['frontend', 'mobile', 'bugs']
    ),
    createMockTask(
      '6',
      'Optimize database queries',
      'Review and optimize slow database queries identified in performance monitoring.',
      'on_hold',
      'high',
      'user1',
      '2024-11-30',
      ['database', 'performance']
    ),
  ]);

  // =============================================
  // HANDLERS
  // =============================================

  const handleUpdateTask = React.useCallback(async (
    id: string,
    updates: Partial<TaskWithRelations>
  ): Promise<void> => {
    console.log('Updating task:', id, updates);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  }, []);

  const handleDeleteTask = React.useCallback(async (id: string): Promise<void> => {
    console.log('Deleting task:', id);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  }, []);

  const handleToggleComplete = React.useCallback(async (id: string): Promise<void> => {
    console.log('Toggling completion for task:', id);
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    
    await handleUpdateTask(id, {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
    });
  }, [tasks, handleUpdateTask]);

  const handleReorderTasks = React.useCallback(async (taskIds: string[]): Promise<void> => {
    console.log('Reordering tasks:', taskIds);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reorder tasks based on new order
    const reorderedTasks = taskIds.map(id => tasks.find(task => task.id === id)).filter(Boolean) as TaskWithRelations[];
    setTasks(reorderedTasks);
  }, [tasks]);

  const handleOpenTaskModal = React.useCallback((task: TaskWithRelations): void => {
    console.log('Opening task modal for:', task);
    // TODO: Implement task modal in Task 9
    alert(`Opening modal for: ${task.title}\n\nThis will be implemented in Task 9 (TaskDetailModal)`);
  }, []);

  const handleCreateTask = React.useCallback((): void => {
    const newTask = createMockTask(
      Date.now().toString(),
      'New Task',
      'Description for new task...',
      'todo',
      'medium',
      undefined,
      undefined,
      []
    );
    
    setTasks(prevTasks => [newTask, ...prevTasks]);
  }, []);

  // =============================================
  // RENDER
  // =============================================

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: theme.palette.text.primary,
          }}
        >
          Task Card Demo
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            mb: 3,
            fontSize: '1.1rem',
            lineHeight: 1.6,
          }}
        >
          Comprehensive demonstration of the TaskCard component with all features:
          inline editing, drag-and-drop reordering, status management, priority indicators,
          and modal integration.
        </Typography>
        
        {/* Feature Overview */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.macOS.borderRadius.large,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            ✨ Features Demonstrated
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="Inline Editing (Click title/description)" size="small" variant="outlined" />
            <Chip label="Drag & Drop Reordering" size="small" variant="outlined" />
            <Chip label="Status Management" size="small" variant="outlined" />
            <Chip label="Priority Indicators" size="small" variant="outlined" />
            <Chip label="Due Date Warnings" size="small" variant="outlined" />
            <Chip label="Assignee Avatars" size="small" variant="outlined" />
            <Chip label="Tag Display" size="small" variant="outlined" />
            <Chip label="Quick Actions" size="small" variant="outlined" />
            <Chip label="Modal Integration" size="small" variant="outlined" />
            <Chip label="macOS Aesthetics" size="small" variant="outlined" />
          </Stack>
        </Paper>

        {/* Action Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
          sx={{
            borderRadius: theme.macOS.borderRadius.medium,
            textTransform: 'none',
            fontWeight: 500,
            px: 3,
            py: 1,
          }}
        >
          Add New Task
        </Button>
      </Box>

      {/* Task List */}
      <TaskList
        tasks={tasks}
        users={mockUsers}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
        onReorderTasks={handleReorderTasks}
        onOpenTaskModal={handleOpenTaskModal}
        emptyStateProps={{
          title: 'No tasks available',
          description: 'Create your first task to see the TaskCard component in action.',
          actionLabel: 'Create Task',
          onAction: handleCreateTask,
        }}
      />

      {/* Instructions */}
      <Paper
        sx={{
          mt: 4,
          p: 3,
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.macOS.borderRadius.large,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          🎮 How to Use
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">
            <strong>• Inline Editing:</strong> Click on any task title or description to edit inline
          </Typography>
          <Typography variant="body2">
            <strong>• Drag & Drop:</strong> Use the drag handle (⋮⋮) to reorder tasks
          </Typography>
          <Typography variant="body2">
            <strong>• Quick Actions:</strong> Use checkboxes to complete tasks, dropdown to change status
          </Typography>
          <Typography variant="body2">
            <strong>• Priority:</strong> Click priority chips to change priority levels
          </Typography>
          <Typography variant="body2">
            <strong>• Modal:</strong> Click the launch icon (↗) to open task details
          </Typography>
          <Typography variant="body2">
            <strong>• Keyboard:</strong> Press Enter to save edits, Escape to cancel
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}