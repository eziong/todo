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
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Switch,
  FormControlLabel,
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
  ViewList as ListViewIcon,
  Timeline as TimelineViewIcon,
  ViewModule as GroupedViewIcon,
  Download as ExportIcon,
} from '@mui/icons-material';
import { useActivitiesPageView, type ActivitiesPageViewProps } from './useActivitiesPageView';
import { ActivityStats } from './ActivityStats/ActivityStats';
import { FiltersPanel } from './FiltersPanel/FiltersPanel';
import { ActivitiesList } from './ActivitiesList/ActivitiesList';
import { ExportDialog } from './ExportDialog/ExportDialog';
import type { 
  ActivityFeedItem, 
  EventCategory, 
  EntityType, 
  EventSeverity,
  User 
} from '@/types/database';
import type { ActivityFiltersState } from './useActivitiesPageView';
import { designTokens } from '@/theme/utils';

// =============================================
// INTERFACES
// =============================================

export type ActivitiesPageViewComponentProps = ActivitiesPageViewProps;

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
        <Alert severity="error" sx={{ borderRadius: designTokens.borderRadius.md }}>
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
                borderRadius: designTokens.borderRadius.md,
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
          
          {/* Refresh Button */}
          <Tooltip title="Refresh activities">
            <IconButton
              onClick={actions.refreshActivities}
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
            borderRadius: designTokens.borderRadius.lg,
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