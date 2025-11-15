// =============================================
// ACTIVITY FILTERS PRESENTER COMPONENT
// =============================================
// Advanced filtering interface for activity events with Material UI styling

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Collapse,
  Grid,
  Stack,
  Divider,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Bookmarks as BookmarksIcon,
  DateRange as DateRangeIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { styled, useTheme } from '@mui/material/styles';
import { 
  useActivityFilters, 
  UseActivityFiltersProps,
  FilterPreset 
} from './useActivityFilters';
import type { 
  EventType, 
  EventCategory, 
  EventSeverity, 
  EventSource, 
  EntityType 
} from '@/types/database';
import { designTokens } from '@/theme/utils';

// =============================================
// STYLED COMPONENTS
// =============================================

const FilterCard = styled(Card)(({ theme }) => ({
  borderRadius: designTokens.borderRadius.lg,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  border: theme.palette.mode === 'light' ? 'none' : `1px solid ${theme.palette.divider}`,
}));

const FilterChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  borderRadius: designTokens.borderRadius.sm,
}));

const QuickFilterButton = styled(Button)(({ theme }) => ({
  borderRadius: designTokens.borderRadius.md,
  textTransform: 'none',
  fontSize: '0.8125rem',
  fontWeight: 500,
}));

// =============================================
// HELPER COMPONENTS
// =============================================

interface MultiSelectProps<T extends string> {
  label: string;
  value: T[];
  onChange: (value: T[]) => void;
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  icon?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}

function MultiSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  icon,
  placeholder = `Select ${label.toLowerCase()}`,
  disabled = false
}: MultiSelectProps<T>) {
  const theme = useTheme();

  const handleChange = (event: any) => {
    const selected = event.target.value as T[];
    onChange(selected);
  };

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((val) => {
              const option = options.find(opt => opt.value === val);
              return (
                <FilterChip 
                  key={val} 
                  label={option?.label || val}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              );
            })}
          </Box>
        )}
        startAdornment={icon}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 250,
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            <Checkbox checked={value.includes(option.value)} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label: string;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  label,
  placeholder = "Add tags..."
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      event.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const handleTagDelete = (tagToDelete: string) => {
    onChange(value.filter(tag => tag !== tagToDelete));
  };

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        helperText="Press Enter to add tags"
      />
      
      {value.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {value.map((tag) => (
            <FilterChip
              key={tag}
              label={tag}
              size="small"
              color="secondary"
              onDelete={() => handleTagDelete(tag)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

interface DateRangePickerProps {
  from: string | null;
  to: string | null;
  onChange: (range: { from: string | null; to: string | null }) => void;
  label?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  from,
  to,
  onChange,
  label = "Date Range"
}) => {
  const handleFromChange = (date: Date | null) => {
    onChange({
      from: date ? date.toISOString().split('T')[0] : null,
      to
    });
  };

  const handleToChange = (date: Date | null) => {
    onChange({
      from,
      to: date ? date.toISOString().split('T')[0] : null
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <DatePicker
              label="From"
              value={from ? new Date(from) : null}
              onChange={handleFromChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small'
                }
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 6 }}>
            <DatePicker
              label="To"
              value={to ? new Date(to) : null}
              onChange={handleToChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small'
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

interface PresetSelectorProps {
  onApplyPreset: (preset: FilterPreset) => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ onApplyPreset }) => {
  const [open, setOpen] = React.useState(false);
  
  const presets: FilterPreset[] = [
    {
      id: 'user_actions',
      name: 'User Actions',
      description: 'Show only user-initiated actions',
      filters: {} as any,
      createdAt: new Date().toISOString()
    },
    {
      id: 'security_events',
      name: 'Security Events',
      description: 'Show security-related events',
      filters: {} as any,
      createdAt: new Date().toISOString()
    },
    {
      id: 'errors_only',
      name: 'Errors & Critical',
      description: 'Show only errors and critical events',
      filters: {} as any,
      createdAt: new Date().toISOString()
    },
    {
      id: 'recent_activity',
      name: 'Recent Activity',
      description: 'Show activity from the last 24 hours',
      filters: {} as any,
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <>
      <Tooltip title="Quick filter presets">
        <IconButton onClick={() => setOpen(true)}>
          <BookmarksIcon />
        </IconButton>
      </Tooltip>
      
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Presets</DialogTitle>
        <DialogContent>
          <List>
            {presets.map((preset) => (
              <ListItem key={preset.id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    onApplyPreset(preset);
                    setOpen(false);
                  }}
                >
                  <ListItemText
                    primary={preset.name}
                    secondary={preset.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// =============================================
// QUICK FILTERS
// =============================================

interface QuickFiltersProps {
  onQuickFilter: (type: 'today' | 'week' | 'errors' | 'security' | 'user_actions') => void;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({ onQuickFilter }) => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
    <QuickFilterButton
      variant="outlined"
      size="small"
      startIcon={<DateRangeIcon />}
      onClick={() => onQuickFilter('today')}
    >
      Today
    </QuickFilterButton>
    
    <QuickFilterButton
      variant="outlined"
      size="small"
      startIcon={<DateRangeIcon />}
      onClick={() => onQuickFilter('week')}
    >
      This Week
    </QuickFilterButton>
    
    <QuickFilterButton
      variant="outlined"
      size="small"
      startIcon={<WarningIcon />}
      onClick={() => onQuickFilter('errors')}
    >
      Errors
    </QuickFilterButton>
    
    <QuickFilterButton
      variant="outlined"
      size="small"
      startIcon={<SecurityIcon />}
      onClick={() => onQuickFilter('security')}
    >
      Security
    </QuickFilterButton>
    
    <QuickFilterButton
      variant="outlined"
      size="small"
      startIcon={<PersonIcon />}
      onClick={() => onQuickFilter('user_actions')}
    >
      User Actions
    </QuickFilterButton>
  </Stack>
);

// =============================================
// MAIN COMPONENT
// =============================================

export interface ActivityFiltersProps extends UseActivityFiltersProps {
  className?: string;
  compact?: boolean;
  showQuickFilters?: boolean;
  showPresets?: boolean;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  initialFilters,
  onFiltersChange,
  availableUsers = [],
  availableWorkspaces = [],
  className,
  compact = false,
  showQuickFilters = true,
  showPresets = true
}) => {
  const [expanded, setExpanded] = React.useState(!compact);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [presetName, setPresetName] = React.useState('');

  const {
    filters,
    eventTypes,
    setEventTypes,
    categories,
    setCategories,
    severities,
    setSeverities,
    sources,
    setSources,
    entityTypes,
    setEntityTypes,
    userId,
    setUserId,
    workspaceId,
    setWorkspaceId,
    dateRange,
    setDateRange,
    tags,
    setTags,
    correlationId,
    setCorrelationId,
    eventTypeOptions,
    categoryOptions,
    severityOptions,
    sourceOptions,
    entityTypeOptions,
    applyFilters,
    resetFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    isValid,
    applyPreset,
    saveAsPreset
  } = useActivityFilters({
    initialFilters,
    onFiltersChange,
    availableUsers,
    availableWorkspaces
  });

  // Quick filter handlers
  const handleQuickFilter = (type: 'today' | 'week' | 'errors' | 'security' | 'user_actions') => {
    const now = new Date();
    
    switch (type) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        setDateRange({
          from: today.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        });
        break;
        
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        setDateRange({
          from: weekAgo.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        });
        break;
        
      case 'errors':
        setSeverities(['error', 'critical']);
        break;
        
      case 'security':
        setCategories(['security']);
        setEventTypes(['login', 'logout', 'login_failed', 'suspicious_activity']);
        break;
        
      case 'user_actions':
        setCategories(['user_action']);
        break;
    }
  };

  const handleSavePreset = () => {
    if (presetName.trim()) {
      saveAsPreset(presetName.trim());
      setPresetName('');
      setShowSaveDialog(false);
    }
  };

  const userOptions = availableUsers.map(user => ({
    value: user.id,
    label: `${user.name} (${user.email})`
  }));

  const workspaceOptions = availableWorkspaces.map(workspace => ({
    value: workspace.id,
    label: workspace.name
  }));

  return (
    <FilterCard className={className}>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterIcon color="primary" />
            <Typography variant="h6">
              Activity Filters
            </Typography>
            
            {hasActiveFilters && (
              <Badge badgeContent={activeFilterCount} color="primary">
                <Box />
              </Badge>
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            {showPresets && <PresetSelector onApplyPreset={applyPreset} />}
            
            <Tooltip title="Save as preset">
              <IconButton onClick={() => setShowSaveDialog(true)} disabled={!hasActiveFilters}>
                <SaveIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Reset filters">
              <IconButton onClick={resetFilters} disabled={!hasActiveFilters}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Clear all filters">
              <IconButton onClick={clearFilters} disabled={!hasActiveFilters}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
            
            {compact && (
              <IconButton onClick={() => setExpanded(!expanded)}>
                <ExpandMoreIcon
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}
                />
              </IconButton>
            )}
          </Stack>
        </Box>

        {/* Quick Filters */}
        {showQuickFilters && (
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Quick Filters
            </Typography>
            <QuickFilters onQuickFilter={handleQuickFilter} />
          </Box>
        )}

        <Collapse in={expanded} timeout="auto">
          <Grid container spacing={3}>
            {/* Event Types */}
            <Grid size={{ xs: 12, md: 6 }}>
              <MultiSelect
                label="Event Types"
                value={eventTypes}
                onChange={setEventTypes}
                options={eventTypeOptions}
                icon={<EventIcon />}
              />
            </Grid>

            {/* Categories */}
            <Grid size={{ xs: 12, md: 6 }}>
              <MultiSelect
                label="Categories"
                value={categories}
                onChange={setCategories}
                options={categoryOptions}
                icon={<CategoryIcon />}
              />
            </Grid>

            {/* Severity */}
            <Grid size={{ xs: 12, md: 4 }}>
              <MultiSelect
                label="Severity"
                value={severities}
                onChange={setSeverities}
                options={severityOptions}
                icon={<WarningIcon />}
              />
            </Grid>

            {/* Sources */}
            <Grid size={{ xs: 12, md: 4 }}>
              <MultiSelect
                label="Sources"
                value={sources}
                onChange={setSources}
                options={sourceOptions}
                icon={<SpeedIcon />}
              />
            </Grid>

            {/* Entity Types */}
            <Grid size={{ xs: 12, md: 4 }}>
              <MultiSelect
                label="Entity Types"
                value={entityTypes}
                onChange={setEntityTypes}
                options={entityTypeOptions}
              />
            </Grid>

            {/* Users */}
            {/* Users */}
            {userOptions.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>User</InputLabel>
                  <Select
                    value={userId || ''}
                    onChange={(e) => setUserId(e.target.value || undefined)}
                    label="User"
                    startAdornment={<PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    <MenuItem value="">
                      <em>All Users</em>
                    </MenuItem>
                    {userOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Workspaces */}
            {workspaceOptions.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Workspace</InputLabel>
                  <Select
                    value={workspaceId || ''}
                    onChange={(e) => setWorkspaceId(e.target.value || undefined)}
                    label="Workspace"
                  >
                    <MenuItem value="">
                      <em>All Workspaces</em>
                    </MenuItem>
                    {workspaceOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Date Range */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onChange={setDateRange}
              />
            </Grid>

            {/* Correlation ID */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Correlation ID"
                value={correlationId}
                onChange={(e) => setCorrelationId(e.target.value)}
                placeholder="Enter correlation ID"
                helperText="Filter events by correlation ID"
              />
            </Grid>

            {/* Tags */}
            <Grid size={{ xs: 12 }}>
              <TagInput
                value={tags}
                onChange={setTags}
                label="Tags"
                placeholder="Add tags to filter by..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Actions */}
          <Box display="flex" justifyContent="between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
              {!isValid && ' • Invalid date range'}
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                Reset
              </Button>
              
              <Button
                variant="contained"
                onClick={applyFilters}
                disabled={!isValid}
              >
                Apply Filters
              </Button>
            </Stack>
          </Box>
        </Collapse>
      </CardContent>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Filter Preset</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Preset Name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Enter a name for this filter preset"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </FilterCard>
  );
};

export default ActivityFilters;