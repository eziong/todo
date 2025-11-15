// =============================================
// MAIN CONTENT PRESENTER COMPONENT
// =============================================
// Pure functional component for main content area with Material UI components and macOS design

import React from 'react';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Stack,
  CircularProgress,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Fade,
  useTheme,
  useMediaQuery,
  alpha,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { useMainContent } from './useMainContent';
import type { 
  TaskStatus, 
  TaskPriority,
  Task,
} from '@/types/database';
import { designTokens } from '@/theme/utils';

// =============================================
// TYPES
// =============================================

export interface MainContentProps {
  className?: string;
  onToggleSidebar?: () => void;
}

// =============================================
// SUB-COMPONENTS
// =============================================

interface ContentHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  lastRefresh: Date | null;
  onCreateTask: () => void;
  actions?: React.ReactNode[];
}

const ContentHeader: React.FC<ContentHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  onRefresh,
  isRefreshing,
  lastRefresh,
  onCreateTask,
  actions = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        backgroundColor: 'background.paper',
        borderRadius: designTokens.borderRadius.lg,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={`breadcrumb-${index}-${crumb.label}`}>
                {index > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    /
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  color={crumb.onClick ? 'primary' : 'text.secondary'}
                  sx={{
                    cursor: crumb.onClick ? 'pointer' : 'default',
                    '&:hover': crumb.onClick ? { textDecoration: 'underline' } : {},
                  }}
                  onClick={crumb.onClick}
                >
                  {crumb.label}
                </Typography>
              </React.Fragment>
            ))}
          </Box>
        )}

        {/* Header content */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                lineHeight: 1.2,
                mb: subtitle ? 0.5 : 0,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: '1rem', lineHeight: 1.4 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
            {/* Refresh button */}
            <Tooltip title={lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : 'Refresh'}>
              <IconButton
                onClick={onRefresh}
                disabled={isRefreshing}
                sx={{
                  borderRadius: designTokens.borderRadius.md,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <RefreshIcon
                  sx={{
                    transition: theme.transitions.create('transform'),
                    transform: isRefreshing ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </IconButton>
            </Tooltip>

            {/* Additional actions */}
            {actions.map((action, index) => (
              <Box key={`action-${index}`}>{action}</Box>
            ))}

            {/* Create task button */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateTask}
              sx={{
                borderRadius: designTokens.borderRadius.md,
                textTransform: 'none',
                fontWeight: 500,
                px: { xs: 2, sm: 3 },
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              {isMobile ? 'Add' : 'Create Task'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
};

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  statusFilters: TaskStatus[];
  priorityFilters: TaskPriority[];
  onUpdateFilters: (filters: { status?: TaskStatus[]; priority?: TaskPriority[] }) => void;
  sortField: keyof Task;
  sortDirection: 'asc' | 'desc';
  onUpdateSort: (field: keyof Task, direction?: 'asc' | 'desc') => void;
  viewMode: 'grid' | 'list';
  onToggleViewMode: () => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  statusFilters,
  priorityFilters,
  onUpdateFilters,
  sortField,
  sortDirection,
  onUpdateSort,
  viewMode,
  onToggleViewMode,
  hasFilters,
  onClearFilters,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'todo', label: 'To Do', color: theme.palette.grey[600] },
    { value: 'in_progress', label: 'In Progress', color: theme.palette.info.main },
    { value: 'completed', label: 'Completed', color: theme.palette.success.main },
    { value: 'cancelled', label: 'Cancelled', color: theme.palette.error.main },
    { value: 'on_hold', label: 'On Hold', color: theme.palette.warning.main },
  ];

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: theme.palette.success.main },
    { value: 'medium', label: 'Medium', color: theme.palette.warning.main },
    { value: 'high', label: 'High', color: theme.palette.error.main },
    { value: 'urgent', label: 'Urgent', color: theme.palette.error.dark },
  ];

  const sortOptions: Array<{ value: keyof Task; label: string }> = [
    { value: 'created_at', label: 'Created' },
    { value: 'updated_at', label: 'Modified' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Name' },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        backgroundColor: 'background.paper',
        borderRadius: designTokens.borderRadius.lg,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Stack 
        spacing={3} 
        direction={{ xs: 'column', md: 'row' }} 
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        {/* Search */}
        <Box sx={{ flex: { xs: '1', md: '0 0 33.33%' } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={onClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: designTokens.borderRadius.md,
                backgroundColor: alpha(theme.palette.text.primary, 0.02),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.text.primary, 0.04),
                },
                '&.Mui-focused': {
                  backgroundColor: 'background.paper',
                },
              },
            }}
          />
        </Box>

        {/* Filters */}
        {!isMobile && (
          <Stack direction="row" spacing={2} sx={{ flex: { md: '0 0 40%' } }}>
            <Box sx={{ minWidth: 140 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={statusFilters}
                  onChange={(e) => onUpdateFilters({ status: e.target.value as TaskStatus[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as TaskStatus[]).map((value) => {
                        const option = statusOptions.find(opt => opt.value === value);
                        return (
                          <Chip
                            key={value}
                            label={option?.label}
                            size="small"
                            sx={{
                              backgroundColor: alpha(option?.color || theme.palette.grey[500], 0.1),
                              color: option?.color,
                              height: 20,
                              fontSize: '0.6875rem',
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: option.color,
                          }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: 140 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  multiple
                  value={priorityFilters}
                  onChange={(e) => onUpdateFilters({ priority: e.target.value as TaskPriority[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as TaskPriority[]).map((value) => {
                        const option = priorityOptions.find(opt => opt.value === value);
                        return (
                          <Chip
                            key={value}
                            label={option?.label}
                            size="small"
                            sx={{
                              backgroundColor: alpha(option?.color || theme.palette.grey[500], 0.1),
                              color: option?.color,
                              height: 20,
                              fontSize: '0.6875rem',
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: option.color,
                          }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Stack>
        )}

        {/* Sort and View Controls */}
        <Box sx={{ flex: { xs: '1', md: '0 0 26.67%' } }}>
          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
            {/* Clear filters */}
            {hasFilters && (
              <Button
                size="small"
                variant="outlined"
                onClick={onClearFilters}
                sx={{
                  borderRadius: designTokens.borderRadius.md,
                  textTransform: 'none',
                }}
              >
                Clear
              </Button>
            )}

            {/* Sort */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={sortField}
                onChange={(e) => onUpdateSort(e.target.value)}
                displayEmpty
                startAdornment={<SortIcon fontSize="small" sx={{ mr: 1 }} />}
                endAdornment={
                  <IconButton
                    size="small"
                    onClick={() => onUpdateSort(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
                    sx={{ mr: 1 }}
                  >
                    {sortDirection === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
                  </IconButton>
                }
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* View toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && onToggleViewMode()}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: designTokens.borderRadius.md,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.16),
                    },
                  },
                },
              }}
            >
              <ToggleButton value="grid">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="list">
                <ListViewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        minHeight: 300,
      }}
    >
      {icon && (
        <Box
          sx={{
            mb: 3,
            p: 3,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            color: 'primary.main',
          }}
        >
          {icon}
        </Box>
      )}

      <Typography
        variant="h5"
        sx={{
          mb: 1,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mb: actionLabel && onAction ? 3 : 0,
          maxWidth: 400,
          lineHeight: 1.5,
        }}
      >
        {description}
      </Typography>

      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            borderRadius: designTokens.borderRadius.md,
            textTransform: 'none',
            fontWeight: 500,
            px: 4,
            py: 1.5,
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

interface LoadingStateProps {
  isLoading: boolean;
  message: string;
  viewMode: 'grid' | 'list';
}

const LoadingState: React.FC<LoadingStateProps> = ({ isLoading, message, viewMode }) => {
  const theme = useTheme();

  if (!isLoading) return null;

  const skeletonItems = Array.from({ length: viewMode === 'grid' ? 6 : 4 });

  return (
    <Fade in={isLoading}>
      <Box>
        {/* Loading message */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            py: 3,
            mb: 3,
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Box>

        {/* Skeleton content */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: viewMode === 'grid' ? 'repeat(2, 1fr)' : '1fr',
              md: viewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr',
            },
            gap: viewMode === 'grid' ? 3 : 2,
          }}
        >
          {skeletonItems.map((_, index) => (
            <Paper
              key={`skeleton-${index}`}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: designTokens.borderRadius.lg,
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                height: viewMode === 'grid' ? 160 : 80,
              }}
            >
              <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={16} sx={{ mb: 2 }} />
              {viewMode === 'grid' && (
                <>
                  <Skeleton variant="text" width="90%" height={16} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="60%" height={16} />
                </>
              )}
            </Paper>
          ))}
        </Box>
      </Box>
    </Fade>
  );
};

// =============================================
// MAIN PRESENTER COMPONENT
// =============================================

export const MainContent: React.FC<MainContentProps> = React.memo(({ className }) => {
  const theme = useTheme();
  
  const {
    // State
    state,
    
    // Data operations
    refreshContent,
    loadMoreTasks,
    
    // Filter operations
    updateFilters,
    clearFilters,
    
    // Sort operations
    updateSort,
    
    // View operations
    toggleViewMode,
    
    // Search
    handleSearchChange,
    clearSearch,
    
    // Task operations
    createTask,
    
    // Utility
    getEmptyStateProps,
    getLoadingStateProps,
  } = useMainContent();

  const hasFilters = React.useMemo((): boolean => {
    return Object.values(state.filters).some(filter => {
      if (Array.isArray(filter)) return filter.length > 0;
      if (typeof filter === 'string') return filter.trim() !== '';
      if (typeof filter === 'boolean') return filter !== true; // showCompleted defaults to true
      return false;
    });
  }, [state.filters]);

  const emptyStateProps = getEmptyStateProps();
  const loadingStateProps = getLoadingStateProps();

  // Generate header props
  const headerProps: ContentHeaderProps = {
    title: state.selectedSection?.name || state.activeWorkspace?.name || 'Tasks',
    subtitle: state.selectedSection 
      ? `${state.filteredTasks.length} task${state.filteredTasks.length !== 1 ? 's' : ''}`
      : state.activeWorkspace
      ? `Tasks in ${state.activeWorkspace.name}`
      : undefined,
    breadcrumbs: state.selectedSection && state.activeWorkspace ? [
      { label: state.activeWorkspace.name, onClick: () => {} },
      { label: state.selectedSection.name },
    ] : undefined,
    onRefresh: refreshContent,
    isRefreshing: state.isRefreshing,
    lastRefresh: state.lastRefresh,
    onCreateTask: createTask,
  };

  return (
    <Box className={className}>
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3, md: 4 },
          maxWidth: '1400px',
          mx: 'auto',
        }}
      >
        {/* Header */}
        <ContentHeader {...headerProps} />

        {/* Filter Bar */}
        <FilterBar
          searchQuery={state.filters.searchQuery}
          onSearchChange={handleSearchChange}
          onClearSearch={clearSearch}
          statusFilters={state.filters.status}
          priorityFilters={state.filters.priority}
          onUpdateFilters={updateFilters}
          sortField={state.sort.field as keyof Task}
          sortDirection={state.sort.direction}
          onUpdateSort={updateSort}
          viewMode={state.view.mode}
          onToggleViewMode={toggleViewMode}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
        />

        {/* Content Area */}
        <Box sx={{ mb: 4 }}>
          {/* Loading State */}
          <LoadingState 
            isLoading={loadingStateProps.isLoading}
            message={loadingStateProps.message}
            viewMode={state.view.mode}
          />

          {/* Empty State */}
          {!loadingStateProps.isLoading && state.filteredTasks.length === 0 && (
            <EmptyState
              title={emptyStateProps.title}
              description={emptyStateProps.description}
              actionLabel={emptyStateProps.actionLabel}
              onAction={emptyStateProps.onAction}
              icon={<AddIcon sx={{ fontSize: 48 }} />}
            />
          )}

          {/* Task Content Placeholder */}
          {!loadingStateProps.isLoading && state.filteredTasks.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: designTokens.borderRadius.lg,
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Task Cards Coming Soon
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Found {state.filteredTasks.length} task{state.filteredTasks.length !== 1 ? 's' : ''} ready to be displayed.
                Task card components will be implemented in the next phase.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current view mode: <strong>{state.view.mode}</strong> • 
                Sorted by: <strong>{String(state.sort.field)}</strong> ({state.sort.direction})
              </Typography>
            </Paper>
          )}

          {/* Load More Button */}
          {!loadingStateProps.isLoading && 
           state.filteredTasks.length > 0 && 
           state.pagination.hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={loadMoreTasks}
                disabled={state.pagination.isLoadingMore}
                startIcon={state.pagination.isLoadingMore && <CircularProgress size={16} />}
                sx={{
                  borderRadius: designTokens.borderRadius.md,
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                }}
              >
                {state.pagination.isLoadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
});