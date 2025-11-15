// =============================================
// TASK LIST PRESENTER COMPONENT
// =============================================
// Pure UI component for displaying a sortable list of tasks with drag-and-drop

'use client';

import React from 'react';
import {
  Box,
  Stack,
  Alert,
  Typography,
  Button,
  Paper,
  Skeleton,
  useTheme,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
} from '@dnd-kit/sortable';
import { TaskCard } from '../TaskCard';
import { useTaskList, type TaskListProps } from './useTaskList';

// =============================================
// LOADING SKELETON COMPONENT
// =============================================

const TaskCardSkeleton: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: theme.macOS.borderRadius.medium,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack spacing={1}>
        <Skeleton variant="text" width="70%" height={24} />
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="40%" height={16} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width="30%" height={16} />
        </Box>
      </Stack>
    </Paper>
  );
};

// =============================================
// EMPTY STATE COMPONENT
// =============================================

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        textAlign: 'center',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: theme.palette.text.secondary,
          mb: 1,
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          mb: 3,
          maxWidth: 400,
        }}
      >
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAction}
          sx={{
            borderRadius: theme.macOS.borderRadius.medium,
            textTransform: 'none',
            px: 3,
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

// =============================================
// PRESENTER COMPONENT
// =============================================

export const TaskList: React.FC<TaskListProps> = (props) => {
  const theme = useTheme();
  const container = useTaskList(props);
  const { state } = container;
  
  // =============================================
  // LOADING STATE
  // =============================================
  
  if (state.loading && state.tasks.length === 0) {
    return (
      <Stack spacing={2} className={props.className}>
        {Array.from({ length: 3 }).map((_, index) => (
          <TaskCardSkeleton key={index} />
        ))}
      </Stack>
    );
  }
  
  // =============================================
  // EMPTY STATE
  // =============================================
  
  if (!state.loading && state.tasks.length === 0) {
    return (
      <Box className={props.className}>
        {props.emptyStateProps && (
          <EmptyState {...props.emptyStateProps} />
        )}
      </Box>
    );
  }
  
  // =============================================
  // ERROR STATE
  // =============================================
  
  const renderError = (): React.ReactNode => {
    if (!state.error) return null;
    
    return (
      <Alert
        severity="error"
        sx={{
          mb: 2,
          borderRadius: theme.macOS.borderRadius.medium,
        }}
        onClose={container.clearError}
      >
        {state.error}
      </Alert>
    );
  };
  
  // =============================================
  // MAIN RENDER
  // =============================================
  
  return (
    <Box className={props.className}>
      {renderError()}
      
      <DndContext {...container.dndContextProps}>
        <SortableContext {...container.sortableContextProps}>
          <Stack
            spacing={2}
            sx={{
              position: 'relative',
              '& > *': {
                transition: theme.macOS.animation.medium,
              },
            }}
          >
            {state.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                users={props.users}
                onUpdate={container.handleUpdateTask}
                onDelete={container.handleDeleteTask}
                onOpenModal={props.onOpenTaskModal}
                onToggleComplete={container.handleToggleComplete}
                disabled={state.isReordering}
              />
            ))}
          </Stack>
        </SortableContext>
        
        {/* Drag Overlay */}
        <DragOverlay>
          {state.activeTask && (
            <TaskCard
              task={state.activeTask}
              users={props.users}
              onUpdate={() => Promise.resolve()}
              onDelete={() => Promise.resolve()}
              onOpenModal={() => {}}
              onToggleComplete={() => Promise.resolve()}
              disabled
              className="drag-overlay"
            />
          )}
        </DragOverlay>
      </DndContext>
      
      {/* Loading overlay for reordering */}
      {state.isReordering && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.macOS.borderRadius.medium,
            zIndex: 1000,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            Reordering tasks...
          </Typography>
        </Box>
      )}
    </Box>
  );
};