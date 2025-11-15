// =============================================
// FILTERS PANEL PRESENTER COMPONENT
// =============================================
// Pure UI component for activity filtering with Material UI and macOS aesthetics

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
} from '@mui/material';
import { designTokens } from '@/theme/utils';
import {
  Clear as ClearIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import type { 
  EventCategory, 
  EventSeverity,
  EntityType,
  User 
} from '@/types/database';
import type { ActivityFiltersState } from '../useActivitiesPageView';

// =============================================
// INTERFACES
// =============================================

export interface FiltersPanelProps {
  filters: ActivityFiltersState;
  onUpdateFilters: (filters: Partial<ActivityFiltersState>) => void;
  onClearFilters: () => void;
  users?: User[];
  isFiltered: boolean;
}

// =============================================
// PRESENTER COMPONENT
// =============================================

export const FiltersPanel: React.FC<FiltersPanelProps> = React.memo(({
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
    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: designTokens.borderRadius.md }}>
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
});