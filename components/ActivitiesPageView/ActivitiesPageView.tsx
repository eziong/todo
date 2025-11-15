// =============================================
// ACTIVITIES PAGE VIEW PRESENTER COMPONENT
// =============================================
// Pure UI component for displaying activity history with Material UI and macOS aesthetics

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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Switch,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ViewList as ListViewIcon,
  Timeline as TimelineViewIcon,
  ViewModule as GroupedViewIcon,
  Download as ExportIcon,
} from '@mui/icons-material';
import { useActivitiesPageView, type ActivitiesPageViewProps } from './useActivitiesPageView';
import { ActivityFeed } from '@/components/ActivityFeed';
import type { 
  ActivityFeedItem, 
  EventCategory, 
  EntityType, 
  EventSeverity,
  User 
} from '@/types/database';
import type { ActivityFiltersState } from './useActivitiesPageView';

// =============================================
// INTERFACES
// =============================================

export type ActivitiesPageViewComponentProps = ActivitiesPageViewProps;

// =============================================
// ACTIVITY STATS COMPONENT
// =============================================

interface ActivityStatsProps {
  stats: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byCategory: Record<EventCategory, number>;
    bySeverity: Record<EventSeverity, number>;
  };
}

const ActivityStats: React.FC<ActivityStatsProps> = ({ stats }) => {
  const theme = useTheme();

  const statItems = [
    {
      label: 'Total Activities',
      value: stats.total,
      color: theme.palette.primary.main,
    },
    {
      label: 'Today',
      value: stats.today,
      color: theme.palette.success.main,
    },
    {
      label: 'This Week',
      value: stats.thisWeek,
      color: theme.palette.info.main,
    },
    {
      label: 'This Month',
      value: stats.thisMonth,
      color: theme.palette.secondary.main,
    },
  ];

  const categoryItems = Object.entries(stats.byCategory).map(([category, count]) => ({
    label: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    category: category as EventCategory,
  }));

  const severityItems = Object.entries(stats.bySeverity).map(([severity, count]) => ({
    label: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: count,
    severity: severity as EventSeverity,
  }));

  const getSeverityColor = (severity: EventSeverity): string => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'error': return theme.palette.error.light;
      case 'warning': return theme.palette.warning.main;
      case 'info': return theme.palette.info.main;
      case 'debug': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: theme.macOS.borderRadius.medium }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Activity Overview
      </Typography>
      
      {/* Main Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statItems.map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card 
              elevation={0}
              sx={{
                textAlign: 'center',
                backgroundColor: `${stat.color}10`,
                border: `1px solid ${stat.color}30`,
                borderRadius: theme.macOS.borderRadius.small,
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" fontWeight={700} color={stat.color}>
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

      {/* Category and Severity Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            By Category
          </Typography>
          <Stack spacing={0.5}>
            {categoryItems.map((item) => (
              item.value > 0 && (
                <Box key={item.category} display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={item.label}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {item.value}
                  </Typography>
                </Box>
              )
            ))}
          </Stack>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            By Severity
          </Typography>
          <Stack spacing={0.5}>
            {severityItems.map((item) => (
              item.value > 0 && (
                <Box key={item.severity} display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={item.label}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.75rem',
                      borderColor: getSeverityColor(item.severity),
                      color: getSeverityColor(item.severity),
                    }}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {item.value}
                  </Typography>
                </Box>
              )
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};

// =============================================
// FILTERS PANEL COMPONENT
// =============================================

interface FiltersPanelProps {
  filters: ActivityFiltersState;
  onUpdateFilters: (filters: Partial<ActivityFiltersState>) => void;
  onClearFilters: () => void;
  users?: User[];
  isFiltered: boolean;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filters,
  onUpdateFilters,
  onClearFilters,
  users = [],
  isFiltered,
}) => {
  const theme = useTheme();

  const categories: EventCategory[] = ['user_action', 'system', 'security', 'integration', 'automation', 'error'];
  const severities: EventSeverity[] = ['critical', 'error', 'warning', 'info', 'debug'];
  const entityTypes: EntityType[] = ['task', 'section', 'workspace', 'user'];

  const getSeverityColor = (severity: EventSeverity): string => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'error': return theme.palette.error.light;
      case 'warning': return theme.palette.warning.main;
      case 'info': return theme.palette.info.main;
      case 'debug': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: theme.macOS.borderRadius.medium }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Filters
        </Typography>
        {isFiltered && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            sx={{ textTransform: 'none' }}
          >
            Clear All
          </Button>
        )}
      </Box>

      <Stack spacing={3}>
        {/* Search */}
        <TextField
          placeholder="Search activities..."
          value={filters.searchQuery}
          onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
        />

        {/* Date Range */}
        <FormControl size="small" fullWidth>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={filters.dateRange}
            onChange={(e) => onUpdateFilters({ dateRange: e.target.value })}
            label="Date Range"
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
          </Select>
        </FormControl>

        {/* Categories */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Categories
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                onClick={() => {
                  const newCategories = filters.categories.includes(category)
                    ? filters.categories.filter((c: EventCategory) => c !== category)
                    : [...filters.categories, category];
                  onUpdateFilters({ categories: newCategories });
                }}
                variant={filters.categories.includes(category) ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontSize: '0.75rem', mb: 0.5 }}
              />
            ))}
          </Stack>
        </Box>

        {/* Severities */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Severities
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {severities.map((severity) => (
              <Chip
                key={severity}
                label={severity.charAt(0).toUpperCase() + severity.slice(1)}
                onClick={() => {
                  const newSeverities = filters.severities.includes(severity)
                    ? filters.severities.filter((s: EventSeverity) => s !== severity)
                    : [...filters.severities, severity];
                  onUpdateFilters({ severities: newSeverities });
                }}
                variant={filters.severities.includes(severity) ? 'filled' : 'outlined'}
                size="small"
                sx={{
                  fontSize: '0.75rem',
                  mb: 0.5,
                  backgroundColor: filters.severities.includes(severity) ? getSeverityColor(severity) : 'transparent',
                  borderColor: getSeverityColor(severity),
                  color: filters.severities.includes(severity)
                    ? theme.palette.getContrastText(getSeverityColor(severity))
                    : getSeverityColor(severity),
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Entity Types */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Entity Types
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {entityTypes.map((entityType) => (
              <Chip
                key={entityType}
                label={entityType.charAt(0).toUpperCase() + entityType.slice(1)}
                onClick={() => {
                  const newEntityTypes = filters.entityTypes.includes(entityType)
                    ? filters.entityTypes.filter((et: EntityType) => et !== entityType)
                    : [...filters.entityTypes, entityType];
                  onUpdateFilters({ entityTypes: newEntityTypes });
                }}
                variant={filters.entityTypes.includes(entityType) ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontSize: '0.75rem', mb: 0.5 }}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

// =============================================
// ACTIVITIES LIST COMPONENT
// =============================================

interface ActivitiesListProps {
  activities: ActivityFeedItem[];
  viewMode: 'list' | 'timeline' | 'grouped';
  groupedActivities?: {
    today: ActivityFeedItem[];
    yesterday: ActivityFeedItem[];
    thisWeek: ActivityFeedItem[];
    thisMonth: ActivityFeedItem[];
    older: ActivityFeedItem[];
  };
  loading?: boolean;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
}

const ActivitiesList: React.FC<ActivitiesListProps> = ({
  activities,
  viewMode,
  groupedActivities,
  loading,
  onLoadMore,
  canLoadMore,
}) => {
  const theme = useTheme();

  if (viewMode === 'grouped' && groupedActivities) {
    const groups = [
      { title: 'Today', activities: groupedActivities.today },
      { title: 'Yesterday', activities: groupedActivities.yesterday },
      { title: 'Earlier This Week', activities: groupedActivities.thisWeek },
      { title: 'Earlier This Month', activities: groupedActivities.thisMonth },
      { title: 'Older', activities: groupedActivities.older },
    ];

    return (
      <Box>
        {groups.map((group) => (
          group.activities.length > 0 && (
            <Box key={group.title} sx={{ mb: 4 }}>
              <Typography 
                variant="h6" 
                fontWeight={600} 
                sx={{ 
                  mb: 2, 
                  borderBottom: `2px solid ${theme.palette.divider}`,
                  pb: 1,
                }}
              >
                {group.title} ({group.activities.length})
              </Typography>
              <ActivityFeed 
                workspaceId={undefined}
                showFilters={false}
                limit={group.activities.length}
              />
            </Box>
          )
        ))}
        
        {canLoadMore && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              onClick={onLoadMore}
              disabled={loading}
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <ActivityFeed 
        workspaceId={undefined}
        showFilters={false}
        limit={activities.length}
      />
      
      {canLoadMore && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            onClick={onLoadMore}
            disabled={loading}
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
            sx={{
              borderRadius: theme.macOS.borderRadius.medium,
              textTransform: 'none',
            }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

// =============================================
// EXPORT DIALOG COMPONENT
// =============================================

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'json') => void;
  isExporting: boolean;
  activityCount: number;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  onExport,
  isExporting,
  activityCount,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Activities</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Export {activityCount} activities matching your current filters.
        </Typography>
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Choose format:
        </Typography>
        
        <Stack spacing={1}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => onExport('csv')}
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={16} /> : <ExportIcon />}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            CSV (Excel compatible)
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={() => onExport('json')}
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={16} /> : <ExportIcon />}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            JSON (Raw data)
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

export const ActivitiesPageView: React.FC<ActivitiesPageViewComponentProps> = (props) => {
  const theme = useTheme();
  const { state, actions, computed } = useActivitiesPageView(props);
  
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);

  const handleExport = async (format: 'csv' | 'json'): Promise<void> => {
    try {
      await actions.exportActivities(format);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Loading state
  if (state.loading && state.activities.length === 0) {
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
        <Alert severity="error" sx={{ borderRadius: theme.macOS.borderRadius.medium }}>
          <Typography variant="body2" gutterBottom>
            Failed to load activities
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {state.error}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button 
              size="small" 
              onClick={actions.refreshActivities}
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
            Activities
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and analyze workspace activity history
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={state.viewMode}
            exclusive
            onChange={(_, value) => value && actions.setViewMode(value)}
            size="small"
          >
            <ToggleButton value="list">
              <Tooltip title="List view">
                <ListViewIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="timeline">
              <Tooltip title="Timeline view">
                <TimelineViewIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="grouped">
              <Tooltip title="Grouped view">
                <GroupedViewIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Export Button */}
          <Tooltip title="Export activities">
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => setExportDialogOpen(true)}
              disabled={computed.isEmpty}
              sx={{
                borderRadius: theme.macOS.borderRadius.medium,
                textTransform: 'none',
              }}
            >
              Export
            </Button>
          </Tooltip>
          
          {/* Filters Button */}
          <Tooltip title="Toggle filters">
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => actions.setShowFilters(!state.showFilters)}
              sx={{
                borderRadius: theme.macOS.borderRadius.medium,
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
          
          {/* Refresh Button */}
          <Tooltip title="Refresh activities">
            <IconButton
              onClick={actions.refreshActivities}
              disabled={state.isRefreshing}
              sx={{ borderRadius: theme.macOS.borderRadius.medium }}
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

      {/* Auto-refresh Toggle */}
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={state.autoRefresh}
              onChange={(e) => actions.setAutoRefresh(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Auto-refresh activities
            </Typography>
          }
        />
      </Box>

      {/* Activity Stats */}
      <ActivityStats stats={computed.activityStats} />

      {/* Filters */}
      <Collapse in={state.showFilters}>
        <FiltersPanel
          filters={state.filters}
          onUpdateFilters={actions.updateFilters}
          onClearFilters={actions.clearFilters}
          users={props.users}
          isFiltered={computed.isFiltered}
        />
      </Collapse>

      {/* Activities List */}
      <ActivitiesList
        activities={computed.filteredActivities}
        viewMode={state.viewMode}
        groupedActivities={computed.groupedActivities}
        loading={state.isLoadingMore}
        onLoadMore={actions.loadMoreActivities}
        canLoadMore={computed.canLoadMore}
      />

      {/* Empty State */}
      {computed.isEmpty && (
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: theme.macOS.borderRadius.large,
          }}
        >
          <Typography variant="h2" sx={{ mb: 2, opacity: 0.5 }}>
            📊
          </Typography>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {computed.isFiltered ? 'No activities match your filters' : 'No activities found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {computed.isFiltered 
              ? 'Try adjusting your filters to see more activities.'
              : 'Activities will appear here as users interact with the workspace.'}
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

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        isExporting={state.isExporting}
        activityCount={computed.filteredActivities.length}
      />
    </Box>
  );
};