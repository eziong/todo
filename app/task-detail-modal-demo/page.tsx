// =============================================
// TASK DETAIL MODAL DEMO PAGE
// =============================================
// Demonstrates the TaskDetailModal component with full functionality

'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Alert,
} from '@mui/material';
import { TaskCard } from '@/components/TaskCard';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import type { 
  TaskWithRelations, 
  User, 
  TaskUpdate,
  TaskAttachment,
} from '@/types';

// =============================================
// MOCK DATA
// =============================================

const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    timezone: 'America/New_York',
    preferences: {
      theme: 'auto',
      language: 'en',
      notifications: { email: true, push: true, task_assignments: true, due_date_reminders: true },
      ui: { compact_mode: false, show_completed_tasks: true, default_view: 'list' },
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_deleted: false,
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b15c5bbe?w=100&h=100&fit=crop&crop=face',
    timezone: 'America/New_York',
    preferences: {
      theme: 'auto',
      language: 'en',
      notifications: { email: true, push: true, task_assignments: true, due_date_reminders: true },
      ui: { compact_mode: false, show_completed_tasks: true, default_view: 'list' },
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_deleted: false,
  },
];

const mockTasks: TaskWithRelations[] = [
  {
    id: '1',
    section_id: 'section-1',
    workspace_id: 'workspace-1',
    title: 'Design new user onboarding flow',
    description: 'Create wireframes and prototypes for the new user onboarding experience. Include user research insights and accessibility considerations.',
    status: 'in_progress',
    priority: 'high',
    assigned_to_user_id: '1',
    created_by_user_id: '1',
    start_date: '2024-01-15',
    end_date: '2024-01-30',
    due_date: '2024-01-28',
    position: 1,
    tags: ['design', 'ux', 'onboarding', 'research'],
    estimated_hours: 40,
    actual_hours: 24,
    attachments: [
      {
        id: 'att-1',
        name: 'onboarding-wireframes.fig',
        url: '#',
        size: 2048000,
        type: 'application/figma',
        uploaded_at: '2024-01-16T10:00:00Z',
        uploaded_by_user_id: '1',
      },
      {
        id: 'att-2',
        name: 'user-research-findings.pdf',
        url: '#',
        size: 1024000,
        type: 'application/pdf',
        uploaded_at: '2024-01-17T14:30:00Z',
        uploaded_by_user_id: '1',
      },
    ],
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-20T16:45:00Z',
    is_deleted: false,
    assignee: mockUsers[0],
    creator: mockUsers[0],
  },
  {
    id: '2',
    section_id: 'section-1',
    workspace_id: 'workspace-1',
    title: 'Implement authentication system',
    description: 'Set up user authentication with Google OAuth integration and session management.',
    status: 'todo',
    priority: 'urgent',
    assigned_to_user_id: '2',
    created_by_user_id: '1',
    start_date: '2024-01-20',
    due_date: '2024-01-25',
    position: 2,
    tags: ['backend', 'auth', 'security'],
    estimated_hours: 20,
    attachments: [],
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z',
    is_deleted: false,
    assignee: mockUsers[1],
    creator: mockUsers[0],
  },
  {
    id: '3',
    section_id: 'section-1',
    workspace_id: 'workspace-1',
    title: 'Write API documentation',
    description: '',
    status: 'completed',
    priority: 'medium',
    assigned_to_user_id: undefined,
    created_by_user_id: '2',
    due_date: '2024-01-18',
    completed_at: '2024-01-17T15:30:00Z',
    position: 3,
    tags: ['documentation', 'api'],
    estimated_hours: 8,
    actual_hours: 6,
    attachments: [],
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-17T15:30:00Z',
    is_deleted: false,
    creator: mockUsers[1],
  },
];

const availableTags = [
  'frontend', 'backend', 'design', 'ux', 'ui', 'api', 'database', 
  'testing', 'documentation', 'security', 'performance', 'mobile',
  'desktop', 'research', 'planning', 'review', 'bug', 'feature',
  'enhancement', 'refactor', 'optimization',
];

// =============================================
// MAIN COMPONENT
// =============================================

export default function TaskDetailModalDemoPage(): React.ReactElement {
  const [tasks, setTasks] = React.useState<TaskWithRelations[]>(mockTasks);
  const [selectedTask, setSelectedTask] = React.useState<TaskWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // =============================================
  // HANDLERS
  // =============================================

  const handleOpenModal = React.useCallback((task: TaskWithRelations) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTask(null), 300); // Delay to allow modal animation
  }, []);

  const handleUpdateTask = React.useCallback(async (id: string, updates: TaskUpdate): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTasks(prev => prev.map(task => 
        task.id === id 
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      ));
      
      // Update selected task if it's the one being edited
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
      }
      
      setNotification({ message: 'Task updated successfully!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      // console.error('Failed to update task:', error);
      setNotification({ message: 'Failed to update task. Please try again.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      throw error;
    }
  }, [selectedTask]);

  const handleDeleteTask = React.useCallback(async (id: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTasks(prev => prev.filter(task => task.id !== id));
      setNotification({ message: 'Task deleted successfully!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      // console.error('Failed to delete task:', error);
      setNotification({ message: 'Failed to delete task. Please try again.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      throw error;
    }
  }, []);

  const handleToggleComplete = React.useCallback(async (id: string): Promise<void> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    const updates: TaskUpdate = {
      status: newStatus,
      ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
    };

    await handleUpdateTask(id, updates);
  }, [tasks, handleUpdateTask]);

  const handleUploadFile = React.useCallback(async (file: File): Promise<TaskAttachment> => {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const attachment: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: file.name,
      url: '#',
      size: file.size,
      type: file.type,
      uploaded_at: new Date().toISOString(),
      uploaded_by_user_id: '1',
    };
    
    // Update the task with the new attachment
    if (selectedTask) {
      const updatedTask = {
        ...selectedTask,
        attachments: [...selectedTask.attachments, attachment],
      };
      setSelectedTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
    }
    
    return attachment;
  }, [selectedTask]);

  const handleDeleteFile = React.useCallback(async (attachmentId: string): Promise<void> => {
    // Simulate file deletion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (selectedTask) {
      const updatedTask = {
        ...selectedTask,
        attachments: selectedTask.attachments.filter(att => att.id !== attachmentId),
      };
      setSelectedTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
    }
  }, [selectedTask]);

  // =============================================
  // RENDER
  // =============================================

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Task Detail Modal Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This demo showcases the comprehensive TaskDetailModal component with full task editing capabilities.
          Click on any task card or the &quot;Open Details&quot; button to view the modal.
        </Typography>
      </Box>

      {/* Notification */}
      {notification && (
        <Box sx={{ mb: 3 }}>
          <Alert 
            severity={notification.type}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Alert>
        </Box>
      )}

      {/* Demo Controls */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Demo Controls
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {tasks.map((task) => (
            <Button
              key={task.id}
              variant="outlined"
              onClick={() => handleOpenModal(task)}
              sx={{ 
                textAlign: 'left', 
                justifyContent: 'flex-start',
                minWidth: 200,
                flex: '1 1 auto',
              }}
            >
              Open: {task.title}
            </Button>
          ))}
        </Box>
      </Paper>

      {/* Task Cards */}
      <Typography variant="h5" gutterBottom>
        Task Cards
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Click on any task card to open the detail modal.
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 2 }}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            onOpenModal={handleOpenModal}
            onToggleComplete={handleToggleComplete}
            users={mockUsers}
          />
        ))}
      </Box>

      {/* Features List */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Modal Features Demonstrated
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              ✅ Form Features:
            </Typography>
            <ul>
              <li>Title and description editing</li>
              <li>Status and priority selection</li>
              <li>Assignee management</li>
              <li>Date pickers (start, end, due)</li>
              <li>Tag management with autocomplete</li>
              <li>Estimated hours tracking</li>
              <li>Real-time validation</li>
            </ul>
          </Box>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              ✅ Advanced Features:
            </Typography>
            <ul>
              <li>Tabbed interface (Details, Comments, Attachments, History)</li>
              <li>File upload with progress tracking</li>
              <li>Unsaved changes detection</li>
              <li>Keyboard shortcuts (Ctrl+S, Esc)</li>
              <li>Delete confirmation dialog</li>
              <li>Auto-save draft capability</li>
              <li>Error handling and recovery</li>
            </ul>
          </Box>
        </Box>
      </Paper>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        users={mockUsers}
        availableTags={availableTags}
        onUploadFile={handleUploadFile}
        onDeleteFile={handleDeleteFile}
      />
    </Container>
  );
}