// =============================================
// COMPLETED TASKS VIEW PRESENTER COMPONENT
// =============================================
// Pure UI component for displaying completed tasks with Material UI and macOS aesthetics

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
  Divider,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CompletedIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Undo as ReopenIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useCompletedTasksView, type CompletedTasksViewProps } from './useCompletedTasksView';
import type { Task, TaskPriority, User } from '@/types/database';
import { designTokens } from '@/theme/utils';

// =============================================
// INTERFACES
// =============================================

export type CompletedTasksViewComponentProps = CompletedTasksViewProps;

// =============================================
// TASK ACTIONS MENU COMPONENT
// =============================================

interface TaskActionsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onReopen: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const TaskActionsMenu: React.FC<TaskActionsMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onReopen,
  onArchive,
  onDelete,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={onReopen}>
        <ListItemIcon>
          <ReopenIcon />
        </ListItemIcon>
        <ListItemText>Reopen Task</ListItemText>
      </MenuItem>
      <MenuItem onClick={onArchive}>
        <ListItemIcon>
          <ArchiveIcon />
        </ListItemIcon>
        <ListItemText>Archive</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={onDelete} sx={{ color: 'error.main' }}>
        <ListItemIcon sx={{ color: 'error.main' }}>
          <DeleteIcon />
        </ListItemIcon>
        <ListItemText>Delete Permanently</ListItemText>
      </MenuItem>
    </Menu>
  );
};

// =============================================
// COMPLETED TASK CARD COMPONENT
// =============================================

interface CompletedTaskCardProps {
  task: Task;
  users?: User[];
  onTaskClick?: (task: Task) => void;
  onReopen: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const CompletedTaskCard: React.FC<CompletedTaskCardProps> = ({
  task,
  users,
  onTaskClick,
  onReopen,
  onArchive,
  onDelete,
}) => {
  const theme = useTheme();
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<HTMLElement | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleReopen = () => {
    onReopen(task);
    handleMenuClose();
  };

  const handleArchive = () => {
    onArchive(task.id);
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    onDelete(task.id);
    setDeleteConfirmOpen(false);
  };

  const formatCompletionDate = (): string => {
    if (!task.completed_at) return '';
    return new Date(task.completed_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const assignee = users?.find(user => user.id === task.assigned_to_user_id);

  return (
    <>
      <Card
        elevation={1}
        sx={{
          mb: 2,
          borderRadius: designTokens.borderRadius.md,
          transition: designTokens.animation.fast,
          opacity: 0.8,
          '&:hover': {
            opacity: 1,
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between">
            <Box 
              flexGrow={1} 
              onClick={() => onTaskClick?.(task)}
              sx={{ cursor: onTaskClick ? 'pointer' : 'default' }}
            >
              {/* Title and Status */}
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CompletedIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    textDecoration: 'line-through', 
                    color: theme.palette.text.secondary,
                    fontSize: '1rem',
                  }}
                >
                  {task.title}
                </Typography>
                <Chip
                  label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  size="small"
                  sx={{
                    fontSize: '0.75rem',
                    height: '20px',
                    backgroundColor: task.priority === 'high' ? '#f44336' : task.priority === 'medium' ? '#ff9800' : '#4caf50',
                    color: '#ffffff',
                  }}
                />
              </Box>

              {/* Description */}
              {task.description && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 1, opacity: 0.7 }}
                >
                  {task.description}
                </Typography>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  {task.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        mr: 0.5, 
                        mb: 0.5, 
                        fontSize: '0.7rem',
                        height: '18px',
                        opacity: 0.6,
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Metadata */}
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Completed {formatCompletionDate()}
                </Typography>
                
                {assignee && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Avatar
                      src={assignee.avatar_url}
                      sx={{
                        width: 16,
                        height: 16,
                        fontSize: '0.7rem',
                      }}
                    >
                      {assignee.name.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      {assignee.name}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Action Menu Button */}
            <Tooltip title="Task actions">
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
              >
                <MoreIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <TaskActionsMenu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onReopen={handleReopen}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Task Permanently?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete &ldquo;<strong>{task.title}</strong>&rdquo;? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// =============================================
// FILTER AND SEARCH SECTION COMPONENT
// =============================================

interface FilterSearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPriorities: TaskPriority[];
  onTogglePriority: (priority: TaskPriority) => void;
  selectedAssignees: string[];
  onToggleAssignee: (userId: string) => void;
  dateRangeFilter: string;
  onDateRangeChange: (range: any) => void;
  sortField: string;
  sortDirection: string;
  onSortChange: (field: any, direction: any) => void;
  users?: any[];
  onClearFilters: () => void;
  isFiltered: boolean;
}

const FilterSearchSection: React.FC<FilterSearchSectionProps> = ({
  searchQuery,
  onSearchChange,
  selectedPriorities,
  onTogglePriority,
  selectedAssignees,
  onToggleAssignee,
  dateRangeFilter,
  onDateRangeChange,
  sortField,
  sortDirection,
  onSortChange,
  users = [],
  onClearFilters,
  isFiltered,
}) => {
  const theme = useTheme();

  const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: designTokens.borderRadius.md }}>
      <Stack spacing={2}>
        {/* Search and Actions Row */}
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search completed tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={`${sortField}_${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('_');
                onSortChange(field, direction);
              }}
              label="Sort by"
            >
              <MenuItem value="completed_at_desc">Latest First</MenuItem>
              <MenuItem value="completed_at_asc">Oldest First</MenuItem>
              <MenuItem value="title_asc">Title A-Z</MenuItem>
              <MenuItem value="title_desc">Title Z-A</MenuItem>
              <MenuItem value="priority_desc">Priority High-Low</MenuItem>
              <MenuItem value="priority_asc">Priority Low-High</MenuItem>
            </Select>
          </FormControl>

          {isFiltered && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={onClearFilters}
              sx={{ textTransform: 'none' }}
            >
              Clear
            </Button>
          )}
        </Stack>

        {/* Filters Row */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {/* Date Range Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Completed</InputLabel>
            <Select
              value={dateRangeFilter}
              onChange={(e) => onDateRangeChange(e.target.value)}
              label="Completed"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>

          {/* Priority Filters */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Priority:
            </Typography>
            {priorities.map((priority) => (
              <Chip
                key={priority}
                label={priority.charAt(0).toUpperCase() + priority.slice(1)}
                onClick={() => onTogglePriority(priority)}
                variant={selectedPriorities.includes(priority) ? 'filled' : 'outlined'}
                size="small"
                sx={{
                  fontSize: '0.75rem',
                  height: '24px',
                  backgroundColor: selectedPriorities.includes(priority) 
                    ? (priority === 'high' ? '#f44336' : priority === 'medium' ? '#ff9800' : '#4caf50') 
                    : 'transparent',
                  borderColor: priority === 'high' ? '#f44336' : priority === 'medium' ? '#ff9800' : '#4caf50',
                  color: selectedPriorities.includes(priority) 
                    ? '#ffffff'
                    : (priority === 'high' ? '#f44336' : priority === 'medium' ? '#ff9800' : '#4caf50'),
                }}
              />
            ))}
          </Box>

          {/* Assignee Filters */}
          {users.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                Assignee:
              </Typography>
              {users.map((user) => (
                <Chip
                  key={user.id}
                  avatar={<Avatar src={user.avatar_url} sx={{ width: 18, height: 18 }}>{user.name.charAt(0)}</Avatar>}
                  label={user.name}
                  onClick={() => onToggleAssignee(user.id)}
                  variant={selectedAssignees.includes(user.id) ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ fontSize: '0.75rem', height: '24px' }}
                />
              ))}
            </Box>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

// =============================================
// COMPLETION STATS COMPONENT
// =============================================

interface CompletionStatsProps {
  stats: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

const CompletionStats: React.FC<CompletionStatsProps> = ({ stats }) => {
  const theme = useTheme();

  const statItems = [
    {
      label: 'Total Completed',
      value: stats.total,
      icon: <CompletedIcon />,
      color: theme.palette.success.main,
    },
    {
      label: 'Today',
      value: stats.today,
      icon: <TodayIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: 'This Week',
      value: stats.thisWeek,
      icon: <DateRangeIcon />,
      color: theme.palette.secondary.main,
    },
    {
      label: 'This Month',
      value: stats.thisMonth,
      icon: <CalendarIcon />,
      color: theme.palette.info.main,
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {statItems.map((stat) => (
        <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
          <Card 
            elevation={1}
            sx={{
              textAlign: 'center',
              borderRadius: designTokens.borderRadius.md,
              border: `1px solid ${stat.color}30`,
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
// TASK GROUP SECTION COMPONENT
// =============================================

interface TaskGroupSectionProps {
  title: string;
  tasks: Task[];
  users?: any[];
  onTaskClick?: (task: Task) => void;
  onReopen: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const TaskGroupSection: React.FC<TaskGroupSectionProps> = ({
  title,
  tasks,
  users,
  onTaskClick,
  onReopen,
  onArchive,
  onDelete,
}) => {
  const theme = useTheme();

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography 
        variant="h6" 
        fontWeight={600} 
        sx={{ 
          mb: 2, 
          color: theme.palette.text.primary,
          borderBottom: `2px solid ${theme.palette.divider}`,
          pb: 1,
        }}
      >
        {title} ({tasks.length})
      </Typography>
      
      <Box>
        {tasks.map((task) => (
          <CompletedTaskCard
            key={task.id}
            task={task}
            users={users}
            onTaskClick={onTaskClick}
            onReopen={onReopen}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))}
      </Box>
    </Box>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

export const CompletedTasksView: React.FC<CompletedTasksViewComponentProps> = (props) => {
  const theme = useTheme();
  const { state, actions, computed } = useCompletedTasksView(props);

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
            Failed to load completed tasks
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
            Completed Tasks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage your completed tasks
          </Typography>
        </Box>
        
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
      </Box>

      {/* Completion Stats */}
      <CompletionStats stats={computed.completionStats} />

      {/* Filters and Search */}
      <FilterSearchSection
        searchQuery={state.searchQuery}
        onSearchChange={actions.setSearchQuery}
        selectedPriorities={state.selectedPriorities}
        onTogglePriority={actions.togglePriorityFilter}
        selectedAssignees={state.selectedAssignees}
        onToggleAssignee={actions.toggleAssigneeFilter}
        dateRangeFilter={state.dateRangeFilter}
        onDateRangeChange={actions.setDateRangeFilter}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortChange={actions.setSorting}
        users={props.users}
        onClearFilters={actions.clearFilters}
        isFiltered={computed.isFiltered}
      />

      {/* Task Groups */}
      <Box>
        <TaskGroupSection
          title="Today"
          tasks={computed.groupedTasks.today}
          users={props.users}
          onTaskClick={props.onTaskClick}
          onReopen={actions.reopenTask}
          onArchive={actions.archiveTask}
          onDelete={actions.permanentlyDeleteTask}
        />
        
        <TaskGroupSection
          title="Yesterday"
          tasks={computed.groupedTasks.yesterday}
          users={props.users}
          onTaskClick={props.onTaskClick}
          onReopen={actions.reopenTask}
          onArchive={actions.archiveTask}
          onDelete={actions.permanentlyDeleteTask}
        />
        
        <TaskGroupSection
          title="Earlier This Week"
          tasks={computed.groupedTasks.thisWeek}
          users={props.users}
          onTaskClick={props.onTaskClick}
          onReopen={actions.reopenTask}
          onArchive={actions.archiveTask}
          onDelete={actions.permanentlyDeleteTask}
        />
        
        <TaskGroupSection
          title="Earlier This Month"
          tasks={computed.groupedTasks.thisMonth}
          users={props.users}
          onTaskClick={props.onTaskClick}
          onReopen={actions.reopenTask}
          onArchive={actions.archiveTask}
          onDelete={actions.permanentlyDeleteTask}
        />
        
        <TaskGroupSection
          title="Older"
          tasks={computed.groupedTasks.older}
          users={props.users}
          onTaskClick={props.onTaskClick}
          onReopen={actions.reopenTask}
          onArchive={actions.archiveTask}
          onDelete={actions.permanentlyDeleteTask}
        />
      </Box>

      {/* Empty State */}
      {computed.isEmpty && props.showEmptyState !== false && (
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: designTokens.borderRadius.lg,
          }}
        >
          <Typography variant="h2" sx={{ mb: 2, opacity: 0.5 }}>
            📝
          </Typography>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {computed.isFiltered ? 'No completed tasks match your filters' : 'No completed tasks yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {computed.isFiltered 
              ? 'Try adjusting your filters to see completed tasks.'
              : 'Completed tasks will appear here once you finish them.'}
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