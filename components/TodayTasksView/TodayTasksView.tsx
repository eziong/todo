// =============================================
// TODAY TASKS VIEW PRESENTER COMPONENT
// =============================================
// Pure UI component for displaying tasks due today with Material UI and macOS aesthetics

'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Badge,
  Paper,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  CheckCircle as CompletedIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Today as TodayIcon,
  Assignment as AssignmentIcon,
  Clear as ClearIcon,
  Visibility as ShowIcon,
  VisibilityOff as HideIcon,
  KeyboardArrowUp as UpIcon,
  KeyboardArrowDown as DownIcon,
} from '@mui/icons-material';
import { useTodayTasksView, type TodayTasksViewProps } from './useTodayTasksView';
import { TaskCard } from '@/components/TaskCard/TaskCard';
import type { Task, User } from '@/types/database';
import { designTokens } from '@/theme/utils';

// =============================================
// INTERFACE
// =============================================

export type TodayTasksViewComponentProps = TodayTasksViewProps;

// =============================================
// FILTER SECTION COMPONENT
// =============================================

interface FilterSectionProps {
  selectedPriorities: string[];
  selectedStatuses: string[];
  showCompletedTasks: boolean;
  onTogglePriority: (priority: string) => void;
  onToggleStatus: (status: string) => void;
  onToggleShowCompleted: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
  disabled?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedPriorities,
  selectedStatuses,
  showCompletedTasks,
  onTogglePriority,
  onToggleStatus,
  onToggleShowCompleted,
  onClearFilters,
  isFiltered,
  disabled = false,
}) => {
  const theme = useTheme();

  const priorities = [
    { value: 'urgent', label: 'Urgent', color: theme.palette.error.dark },
    { value: 'high', label: 'High', color: theme.palette.error.main },
    { value: 'medium', label: 'Medium', color: theme.palette.warning.main },
    { value: 'low', label: 'Low', color: theme.palette.success.main },
  ];

  const statuses = [
    { value: 'todo', label: 'To Do', color: theme.palette.grey[600] },
    { value: 'in_progress', label: 'In Progress', color: theme.palette.info.main },
  ];

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: designTokens.borderRadius.lg,
        background: theme.palette.background.paper,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Filters
        </Typography>
        {isFiltered && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            disabled={disabled}
            sx={{ textTransform: 'none' }}
          >
            Clear All
          </Button>
        )}
      </Stack>

      <Stack spacing={2}>
        {/* Priority Filters */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Priority
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {priorities.map((priority) => (
              <Chip
                key={priority.value}
                label={priority.label}
                onClick={() => onTogglePriority(priority.value)}
                variant={selectedPriorities.includes(priority.value) ? 'filled' : 'outlined'}
                disabled={disabled}
                sx={{
                  backgroundColor: selectedPriorities.includes(priority.value) ? priority.color : 'transparent',
                  borderColor: priority.color,
                  color: selectedPriorities.includes(priority.value) 
                    ? theme.palette.getContrastText(priority.color) 
                    : priority.color,
                  '&:hover': {
                    backgroundColor: selectedPriorities.includes(priority.value) 
                      ? priority.color 
                      : `${priority.color}20`,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Status Filters */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Status
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {statuses.map((status) => (
              <Chip
                key={status.value}
                label={status.label}
                onClick={() => onToggleStatus(status.value)}
                variant={selectedStatuses.includes(status.value) ? 'filled' : 'outlined'}
                disabled={disabled}
                sx={{
                  backgroundColor: selectedStatuses.includes(status.value) ? status.color : 'transparent',
                  borderColor: status.color,
                  color: selectedStatuses.includes(status.value) 
                    ? theme.palette.getContrastText(status.color) 
                    : status.color,
                  '&:hover': {
                    backgroundColor: selectedStatuses.includes(status.value) 
                      ? status.color 
                      : `${status.color}20`,
                  },
                }}
              />
            ))}
            
            {/* Show/Hide Completed Toggle */}
            <Chip
              label={showCompletedTasks ? 'Hide Completed' : 'Show Completed'}
              icon={showCompletedTasks ? <HideIcon /> : <ShowIcon />}
              onClick={onToggleShowCompleted}
              variant={showCompletedTasks ? 'filled' : 'outlined'}
              color={showCompletedTasks ? 'success' : 'default'}
              disabled={disabled}
            />
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

// =============================================
// TASK SECTION COMPONENT
// =============================================

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  icon: React.ReactNode;
  color: string;
  users?: User[];
  onTaskClick?: (task: Task) => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const TaskSection: React.FC<TaskSectionProps> = ({
  title,
  tasks,
  icon,
  color,
  users,
  onTaskClick,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  if (tasks.length === 0) {
    return null;
  }

  const handleToggleExpanded = (): void => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Paper 
        elevation={1} 
        sx={{ 
          borderRadius: designTokens.borderRadius.md,
          overflow: 'hidden',
          border: `1px solid ${color}20`,
        }}
      >
        <Box
          onClick={handleToggleExpanded}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            backgroundColor: `${color}10`,
            cursor: collapsible ? 'pointer' : 'default',
            borderBottom: expanded ? `1px solid ${theme.palette.divider}` : 'none',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ color, display: 'flex' }}>
              {icon}
            </Box>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            <Badge badgeContent={tasks.length} color="primary" />
          </Stack>
          
          {collapsible && (
            <IconButton size="small">
              {expanded ? <UpIcon /> : <DownIcon />}
            </IconButton>
          )}
        </Box>
        
        {expanded && (
          <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  users={users}
                  onClick={() => onTaskClick?.(task)}
                  showDragHandle={false}
                  onUpdate={async () => {}}
                  onDelete={async () => {}}
                  onOpenModal={() => {}}
                  onToggleComplete={async () => {}}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

// =============================================
// STATS OVERVIEW COMPONENT
// =============================================

interface StatsOverviewProps {
  taskCounts: {
    overdue: number;
    dueToday: number;
    dueSoon: number;
    completed: number;
    total: number;
  };
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ taskCounts }) => {
  const theme = useTheme();

  const stats = [
    {
      label: 'Overdue',
      value: taskCounts.overdue,
      icon: <WarningIcon />,
      color: theme.palette.error.main,
    },
    {
      label: 'Due Today',
      value: taskCounts.dueToday,
      icon: <TodayIcon />,
      color: theme.palette.warning.main,
    },
    {
      label: 'Due Soon',
      value: taskCounts.dueSoon,
      icon: <ScheduleIcon />,
      color: theme.palette.info.main,
    },
    {
      label: 'Completed',
      value: taskCounts.completed,
      icon: <CompletedIcon />,
      color: theme.palette.success.main,
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {stats.map((stat) => (
        <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
          <Card 
            elevation={1}
            sx={{
              textAlign: 'center',
              borderRadius: designTokens.borderRadius.md,
              border: `1px solid ${stat.color}30`,
              transition: designTokens.animation.fast,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ color: stat.color, mb: 1 }}>
                {stat.icon}
              </Box>
              <Typography variant="h4" fontWeight={700} color={stat.color}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

export const TodayTasksView: React.FC<TodayTasksViewComponentProps> = (props) => {
  const theme = useTheme();
  const { state, actions, computed, infinite } = useTodayTasksView(props);
  
  const [showFilters, setShowFilters] = React.useState(false);

  // Loading state
  if (state.loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="300px"
        className={props.className}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Error state
  if (state.error) {
    return (
      <Box className={props.className} sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: designTokens.borderRadius.md }}>
          <Typography variant="body2" gutterBottom>
            Failed to load today&apos;s tasks
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {state.error}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button 
              size="small" 
              onClick={actions.refreshTasks}
              disabled={state.isRefreshing}
              startIcon={state.isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              Try Again
            </Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box className={props.className} sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Today's Tasks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="Toggle filters">
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                borderRadius: designTokens.borderRadius.md,
                textTransform: 'none',
              }}
            >
              Filters
              {computed.isFiltered && (
                <Badge 
                  badgeContent=" " 
                  color="primary" 
                  variant="dot" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Button>
          </Tooltip>
          
          <Tooltip title="Refresh tasks">
            <IconButton
              onClick={actions.refreshTasks}
              disabled={state.isRefreshing}
              sx={{ borderRadius: designTokens.borderRadius.md }}
            >
              {state.isRefreshing ? (
                <CircularProgress size={20} />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Stats Overview */}
      <StatsOverview taskCounts={computed.taskCounts} />

      {/* Filters */}
      {showFilters && (
        <FilterSection
          selectedPriorities={state.selectedPriorities}
          selectedStatuses={state.selectedStatuses}
          showCompletedTasks={state.showCompletedTasks}
          onTogglePriority={actions.togglePriorityFilter}
          onToggleStatus={(status: string) => actions.toggleStatusFilter(status as any)}
          onToggleShowCompleted={actions.toggleShowCompleted}
          onClearFilters={actions.clearFilters}
          isFiltered={computed.isFiltered}
          disabled={state.loading}
        />
      )}

      {/* Task Sections */}
      <Box>
        {/* Overdue Tasks */}
        <TaskSection
          title="Overdue Tasks"
          tasks={computed.urgencyGroups.overdue}
          icon={<WarningIcon />}
          color={theme.palette.error.main}
          users={props.users}
          onTaskClick={props.onTaskClick}
          collapsible={false}
        />

        {/* Due Today */}
        <TaskSection
          title="Due Today"
          tasks={computed.urgencyGroups.dueToday}
          icon={<TodayIcon />}
          color={theme.palette.warning.main}
          users={props.users}
          onTaskClick={props.onTaskClick}
          collapsible={false}
        />

        {/* Due Soon */}
        <TaskSection
          title="Due Soon (Next 3 Days)"
          tasks={computed.urgencyGroups.dueSoon}
          icon={<ScheduleIcon />}
          color={theme.palette.info.main}
          users={props.users}
          onTaskClick={props.onTaskClick}
          collapsible={true}
          defaultExpanded={computed.urgencyGroups.dueSoon.length > 0}
        />

        {/* Other Tasks */}
        <TaskSection
          title="Other Priority Tasks"
          tasks={computed.urgencyGroups.upcoming}
          icon={<AssignmentIcon />}
          color={theme.palette.primary.main}
          users={props.users}
          onTaskClick={props.onTaskClick}
          collapsible={true}
          defaultExpanded={false}
        />
      </Box>

      {/* Infinite Scroll Load More */}
      {infinite.hasNextPage && (
        <Box ref={infinite.loadMoreRef} sx={{ mt: 3, textAlign: 'center' }}>
          {infinite.loadingMore ? (
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Loading more tasks...
              </Typography>
            </Stack>
          ) : (
            <Button
              variant="outlined"
              onClick={infinite.fetchNextPage}
              sx={{
                borderRadius: designTokens.borderRadius.md,
                textTransform: 'none',
              }}
            >
              Load More Tasks
            </Button>
          )}
        </Box>
      )}

      {/* Empty State */}
      {computed.isEmpty && props.showEmptyState !== false && (
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="h2" sx={{ mb: 2, opacity: 0.5 }}>
            🎉
          </Typography>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {computed.isFiltered ? 'No tasks match your filters' : 'All caught up!'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {computed.isFiltered 
              ? 'Try adjusting your filters to see more tasks.'
              : 'You have no tasks due today. Great work!'}
          </Typography>
          {computed.isFiltered && (
            <Button 
              variant="outlined" 
              onClick={actions.clearFilters}
              sx={{ textTransform: 'none' }}
            >
              Clear Filters
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );
};