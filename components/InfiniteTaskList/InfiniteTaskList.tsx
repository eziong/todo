// =============================================
// INFINITE TASK LIST PRESENTER COMPONENT
// =============================================
// Pure functional component for infinite scrolling task list

import React from 'react';
import {
  Box,
  List,
  ListItem,
  Typography,
  CircularProgress,
  Alert,
  Skeleton,
  useTheme,
  alpha,
  Button,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { TaskCard } from '@/components/TaskCard/TaskCard';
import { useInfiniteTaskList } from './useInfiniteTaskList';
import type { TaskFilters } from '@/types/database';
import { designTokens } from '@/theme/utils';

// =============================================
// TYPES
// =============================================

export interface InfiniteTaskListProps {
  className?: string;
  filters?: TaskFilters;
  searchQuery?: string;
  pageSize?: number;
  emptyStateMessage?: string;
  emptyStateAction?: React.ReactNode;
  showRefreshButton?: boolean;
}

// =============================================
// LOADING SKELETON COMPONENT
// =============================================

const TaskListSkeleton: React.FC = () => (
  <Box sx={{ p: 2 }}>
    {Array.from({ length: 5 }, (_, index) => (
      <Box key={index} sx={{ mb: 2 }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
      </Box>
    ))}
  </Box>
);

// =============================================
// LOAD MORE INDICATOR COMPONENT
// =============================================

interface LoadMoreIndicatorProps {
  loading: boolean;
  hasMore: boolean;
  error: Error | null;
  onRetry: () => void;
}

const LoadMoreIndicator: React.FC<LoadMoreIndicatorProps> = ({
  loading,
  hasMore,
  error,
  onRetry,
}) => {
  const theme = useTheme();

  if (error) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
        }}
      >
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={onRetry}>
              Retry
            </Button>
          }
          sx={{
            borderRadius: designTokens.borderRadius.md,
          }}
        >
          Failed to load more tasks
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Loading more tasks...
        </Typography>
      </Box>
    );
  }

  if (!hasMore) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No more tasks to load
        </Typography>
      </Box>
    );
  }

  return null;
};

// =============================================
// EMPTY STATE COMPONENT
// =============================================

interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, action }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 6,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontSize: '2rem',
            color: 'primary.main',
          }}
        >
          ✓
        </Typography>
      </Box>
      
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{ maxWidth: 400 }}
      >
        {message}
      </Typography>
      
      {action && (
        <Box>{action}</Box>
      )}
    </Box>
  );
};

// =============================================
// PRESENTER COMPONENT
// =============================================

export const InfiniteTaskList: React.FC<InfiniteTaskListProps> = ({
  className,
  filters,
  searchQuery,
  pageSize,
  emptyStateMessage = 'No tasks found',
  emptyStateAction,
  showRefreshButton = true,
}) => {
  const theme = useTheme();
  
  const {
    tasks,
    totalCount,
    loading,
    loadingMore,
    isInitialLoading,
    hasNextPage,
    fetchNextPage,
    error,
    loadMoreRef,
    refetch,
    toggleTaskCompletion,
    updateTask,
    deleteTask,
  } = useInfiniteTaskList({
    filters,
    searchQuery,
    pageSize,
  });

  // Handle refresh
  const handleRefresh = (): void => {
    refetch();
  };

  // Error state
  if (error && !tasks.length) {
    return (
      <Box className={className} sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
          sx={{
            borderRadius: designTokens.borderRadius.md,
          }}
        >
          Failed to load tasks. Please try again.
        </Alert>
      </Box>
    );
  }

  // Initial loading state
  if (isInitialLoading) {
    return (
      <Box className={className}>
        <TaskListSkeleton />
      </Box>
    );
  }

  // Empty state
  if (!loading && tasks.length === 0) {
    return (
      <Box className={className}>
        <EmptyState 
          message={emptyStateMessage}
          action={emptyStateAction}
        />
      </Box>
    );
  }

  return (
    <Box className={className}>
      {/* Header with count and refresh */}
      <Box
        sx={{
          p: 2,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {totalCount > 0 && (
            <>
              Showing {tasks.length} of {totalCount} tasks
              {searchQuery && ` for "${searchQuery}"`}
            </>
          )}
        </Typography>
        
        {showRefreshButton && (
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: designTokens.borderRadius.md,
            }}
          >
            Refresh
          </Button>
        )}
      </Box>

      {/* Task list */}
      <List sx={{ p: 0 }}>
        {tasks.map((task, index) => (
          <ListItem
            key={task.id}
            sx={{
              px: 2,
              py: 1,
              borderBottom: index < tasks.length - 1 
                ? `1px solid ${alpha(theme.palette.divider, 0.06)}`
                : 'none',
              width: '100%',
            }}
          >
            <TaskCard
              task={task}
              onToggleComplete={() => toggleTaskCompletion(task.id)}
              onUpdate={(id, updates) => updateTask(id, updates)}
              onDelete={() => deleteTask(task.id)}
              onOpenModal={(task) => {/* TODO: implement modal opening */}}
            />
          </ListItem>
        ))}
      </List>

      {/* Load more indicator */}
      <Box ref={loadMoreRef}>
        <LoadMoreIndicator
          loading={loadingMore}
          hasMore={hasNextPage}
          error={hasNextPage ? null : error}
          onRetry={fetchNextPage}
        />
      </Box>
    </Box>
  );
};