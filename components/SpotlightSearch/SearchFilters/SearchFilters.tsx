// =============================================
// SEARCH FILTERS PRESENTER COMPONENT
// =============================================
// Pure UI component for advanced search filters with Material Design and macOS aesthetics

'use client';

import React from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Button,
  Divider,
  Paper,
  Stack,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Tune as TuneIcon,
  DateRange as DateRangeIcon,
  Business as WorkspaceIcon,
  Folder as SectionIcon,
  Assignment as TaskIcon,
  Person as PersonIcon,
  Label as TagIcon,
} from '@mui/icons-material';
import { useSearchFilters } from './useSearchFilters';
import type { SearchFiltersProps } from './useSearchFilters';
import type { TaskStatus, TaskPriority } from '@/database/types';
import type { SearchFilters as BaseSearchFilters } from '@/hooks/useTaskSearch';

// =============================================
// SUB-COMPONENTS
// =============================================

interface FilterChipProps {
  label: string;
  onDelete: () => void;
  icon?: React.ReactElement;
  color?: string;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, onDelete, icon, color }) => {
  const theme = useTheme();
  
  return (
    <Chip
      label={label}
      onDelete={onDelete}
      deleteIcon={<ClearIcon />}
      {...(icon && { icon })}
      size="small"
      sx={{
        height: 28,
        borderRadius: 1,
        backgroundColor: color ? alpha(color, 0.1) : 'action.hover',
        color: color || 'text.primary',
        border: color ? `1px solid ${alpha(color, 0.3)}` : '1px solid transparent',
        '& .MuiChip-deleteIcon': {
          color: color ? alpha(color, 0.7) : 'text.secondary',
          '&:hover': {
            color: color || 'text.primary',
          },
        },
        '& .MuiChip-icon': {
          color: color || 'text.secondary',
        },
      }}
    />
  );
};

interface QuickFilterButtonsProps {
  onPresetSelect: (preset: string) => void;
}

const QuickFilterButtons: React.FC<QuickFilterButtonsProps> = ({ onPresetSelect }): React.ReactElement => {
  const theme = useTheme();

  const presets = [
    { id: 'my-tasks', label: 'My Tasks', icon: <PersonIcon fontSize="small" /> },
    { id: 'urgent', label: 'Urgent', icon: '🔴' },
    { id: 'this-week', label: 'This Week', icon: <DateRangeIcon fontSize="small" /> },
    { id: 'completed', label: 'Completed', icon: '✅' },
  ];

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {presets.map((preset) => (
        <Button
          key={preset.id}
          variant="outlined"
          size="small"
          startIcon={typeof preset.icon === 'string' ? (
            <Typography sx={{ fontSize: '0.875rem' }}>{preset.icon}</Typography>
          ) : preset.icon}
          onClick={() => onPresetSelect(preset.id)}
          sx={{
            minHeight: 32,
            borderRadius: 1,
            textTransform: 'none',
            fontSize: '0.875rem',
            border: '1px solid',
            borderColor: 'divider',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              borderColor: 'primary.main',
              color: 'primary.main',
            },
          }}
        >
          {preset.label}
        </Button>
      ))}
    </Stack>
  );
};

interface EntityTypeToggleProps {
  value: Array<'workspace' | 'section' | 'task'>;
  onChange: (types: Array<'workspace' | 'section' | 'task'>) => void;
}

const EntityTypeToggle: React.FC<EntityTypeToggleProps> = ({ value, onChange }) => {
  const theme = useTheme();

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTypes: Array<'workspace' | 'section' | 'task'>
  ) => {
    if (newTypes.length > 0) {
      onChange(newTypes);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      onChange={handleChange}
      size="small"
      sx={{
        '& .MuiToggleButton-root': {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 0.5,
          px: 2,
          py: 0.5,
          textTransform: 'none',
          fontSize: '0.875rem',
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            color: 'primary.main',
            borderColor: 'primary.main',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.16),
            },
          },
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.hover, 0.04),
          },
        },
      }}
    >
      <ToggleButton value="workspace">
        <WorkspaceIcon fontSize="small" sx={{ mr: 0.5 }} />
        Workspaces
      </ToggleButton>
      <ToggleButton value="section">
        <SectionIcon fontSize="small" sx={{ mr: 0.5 }} />
        Sections
      </ToggleButton>
      <ToggleButton value="task">
        <TaskIcon fontSize="small" sx={{ mr: 0.5 }} />
        Tasks
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  className,
  onFiltersChange,
  initialFilters,
  compact = false,
}) => {
  const theme = useTheme();
  const {
    filters,
    activeFiltersCount,
    hasActiveFilters,
    selectedWorkspace,
    selectedSections,
    selectedStatuses,
    selectedPriorities,
    selectedAssignees,
    selectedTags,
    dueDateRange,
    entityTypes,
    statusOptions,
    priorityOptions,
    workspaceOptions,
    sectionOptions,
    assigneeOptions,
    tagOptions,
    setWorkspaceFilter,
    setSectionFilter,
    setStatusFilter,
    setPriorityFilter,
    setAssigneeFilter,
    setTagFilter,
    setDueDateRange,
    setEntityTypes,
    clearAllFilters,
    applyPreset,
    isExpanded,
    toggleExpanded,
  } = useSearchFilters(initialFilters, onFiltersChange);

  if (compact) {
    return (
      <Box className={className} sx={{ width: '100%' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<TuneIcon />}
          onClick={toggleExpanded}
          sx={{
            justifyContent: 'space-between',
            width: '100%',
            textTransform: 'none',
            borderRadius: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Filters</Typography>
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.75rem',
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              />
            )}
          </Box>
          <ExpandMoreIcon
            sx={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: theme.transitions.create('transform'),
            }}
          />
        </Button>

        <Collapse in={isExpanded}>
          <Paper
            sx={{
              mt: 1,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <SearchFiltersContent
              filters={filters}
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
              workspaceOptions={workspaceOptions}
              sectionOptions={sectionOptions}
              assigneeOptions={assigneeOptions}
              tagOptions={tagOptions}
              selectedWorkspace={selectedWorkspace}
              selectedSections={selectedSections}
              selectedStatuses={selectedStatuses}
              selectedPriorities={selectedPriorities}
              selectedAssignees={selectedAssignees}
              selectedTags={selectedTags}
              dueDateRange={dueDateRange}
              entityTypes={entityTypes}
              hasActiveFilters={hasActiveFilters}
              setWorkspaceFilter={setWorkspaceFilter}
              setSectionFilter={setSectionFilter}
              setStatusFilter={setStatusFilter}
              setPriorityFilter={setPriorityFilter}
              setAssigneeFilter={setAssigneeFilter}
              setTagFilter={setTagFilter}
              setDueDateRange={setDueDateRange}
              setEntityTypes={setEntityTypes}
              clearAllFilters={clearAllFilters}
              applyPreset={applyPreset}
            />
          </Paper>
        </Collapse>
      </Box>
    );
  }

  return (
    <Paper
      className={className}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Search Filters
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              label={`${activeFiltersCount} active`}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              }}
            />
          )}
        </Box>

        {hasActiveFilters && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={clearAllFilters}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
            }}
          >
            Clear All
          </Button>
        )}
      </Box>

      <SearchFiltersContent
        filters={filters}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        workspaceOptions={workspaceOptions}
        sectionOptions={sectionOptions}
        assigneeOptions={assigneeOptions}
        tagOptions={tagOptions}
        selectedWorkspace={selectedWorkspace}
        selectedSections={selectedSections}
        selectedStatuses={selectedStatuses}
        selectedPriorities={selectedPriorities}
        selectedAssignees={selectedAssignees}
        selectedTags={selectedTags}
        dueDateRange={dueDateRange}
        entityTypes={entityTypes}
        hasActiveFilters={hasActiveFilters}
        setWorkspaceFilter={setWorkspaceFilter}
        setSectionFilter={setSectionFilter}
        setStatusFilter={setStatusFilter}
        setPriorityFilter={setPriorityFilter}
        setAssigneeFilter={setAssigneeFilter}
        setTagFilter={setTagFilter}
        setDueDateRange={setDueDateRange}
        setEntityTypes={setEntityTypes}
        clearAllFilters={clearAllFilters}
        applyPreset={applyPreset}
      />
    </Paper>
  );
};

// Content component to avoid duplication
interface FilterOption {
  id: string;
  label: string;
  value: string;
  icon?: string;
  color?: string;
}

interface SearchFiltersContentProps {
  filters: BaseSearchFilters;
  statusOptions: FilterOption[];
  priorityOptions: FilterOption[];
  workspaceOptions: FilterOption[];
  sectionOptions: FilterOption[];
  assigneeOptions: FilterOption[];
  tagOptions: FilterOption[];
  selectedWorkspace: string | null;
  selectedSections: string[];
  selectedStatuses: TaskStatus[];
  selectedPriorities: TaskPriority[];
  selectedAssignees: string[];
  selectedTags: string[];
  dueDateRange: { from: Date | null; to: Date | null };
  entityTypes: Array<'workspace' | 'section' | 'task'>;
  hasActiveFilters: boolean;
  setWorkspaceFilter: (workspaceId: string | null) => void;
  setSectionFilter: (sectionIds: string[]) => void;
  setStatusFilter: (statuses: TaskStatus[]) => void;
  setPriorityFilter: (priorities: TaskPriority[]) => void;
  setAssigneeFilter: (assigneeIds: string[]) => void;
  setTagFilter: (tags: string[]) => void;
  setDueDateRange: (range: { from: Date | null; to: Date | null }) => void;
  setEntityTypes: (types: Array<'workspace' | 'section' | 'task'>) => void;
  clearAllFilters: () => void;
  applyPreset: (preset: string) => void;
}

const SearchFiltersContent: React.FC<SearchFiltersContentProps> = ({
  statusOptions,
  priorityOptions,
  workspaceOptions,
  sectionOptions,
  assigneeOptions,
  tagOptions,
  selectedWorkspace,
  selectedSections,
  selectedStatuses,
  selectedPriorities,
  selectedAssignees,
  selectedTags,
  dueDateRange,
  entityTypes,
  setWorkspaceFilter,
  setSectionFilter,
  setStatusFilter,
  setPriorityFilter,
  setAssigneeFilter,
  setTagFilter,
  setDueDateRange,
  setEntityTypes,
  applyPreset,
}) => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      {/* Quick Filters */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Quick Filters
        </Typography>
        <QuickFilterButtons onPresetSelect={applyPreset} />
      </Box>

      <Divider />

      {/* Entity Types */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Show Results From
        </Typography>
        <EntityTypeToggle value={entityTypes} onChange={setEntityTypes} />
      </Box>

      <Divider />

      {/* Workspace & Section Filters */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Location
        </Typography>
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Workspace</InputLabel>
            <Select
              value={selectedWorkspace || ''}
              onChange={(e) => setWorkspaceFilter(e.target.value || null)}
              label="Workspace"
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="">All Workspaces</MenuItem>
              {workspaceOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{option.icon}</Typography>
                    <Typography>{option.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            options={sectionOptions}
            value={sectionOptions.filter(option => selectedSections.includes(option.id))}
            onChange={(_, newValue) => setSectionFilter(newValue.map(v => v.id))}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Sections"
                placeholder="Select sections..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <FilterChip
                  key={option.id}
                  label={option.label}
                  onDelete={() => {
                    const tagProps = getTagProps({ index });
                    if (tagProps.onDelete) {
                      tagProps.onDelete({} as any);
                    }
                  }}
                  icon={<Typography sx={{ fontSize: '0.875rem' }}>{option.icon}</Typography>}
                />
              ))
            }
          />
        </Stack>
      </Box>

      <Divider />

      {/* Status & Priority Filters */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Status & Priority
        </Typography>
        <Stack spacing={2}>
          <Autocomplete
            multiple
            options={statusOptions}
            value={statusOptions.filter(option => selectedStatuses.includes(option.value as TaskStatus))}
            onChange={(_, newValue) => setStatusFilter(newValue.map(v => v.value as TaskStatus))}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Status"
                placeholder="Select status..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <FilterChip
                  key={option.id}
                  label={option.label}
                  onDelete={() => {
                    const tagProps = getTagProps({ index });
                    if (tagProps.onDelete) {
                      tagProps.onDelete({} as any);
                    }
                  }}
                  icon={<Typography sx={{ fontSize: '0.875rem' }}>{option.icon}</Typography>}
                  color={option.color}
                />
              ))
            }
          />

          <Autocomplete
            multiple
            options={priorityOptions}
            value={priorityOptions.filter(option => selectedPriorities.includes(option.value as TaskPriority))}
            onChange={(_, newValue) => setPriorityFilter(newValue.map(v => v.value as TaskPriority))}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Priority"
                placeholder="Select priority..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <FilterChip
                  key={option.id}
                  label={option.label}
                  onDelete={() => {
                    const tagProps = getTagProps({ index });
                    if (tagProps.onDelete) {
                      tagProps.onDelete({} as any);
                    }
                  }}
                  icon={<Typography sx={{ fontSize: '0.875rem' }}>{option.icon}</Typography>}
                  color={option.color}
                />
              ))
            }
          />
        </Stack>
      </Box>

      <Divider />

      {/* People & Tags Filters */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          People & Tags
        </Typography>
        <Stack spacing={2}>
          <Autocomplete
            multiple
            options={assigneeOptions}
            value={assigneeOptions.filter(option => selectedAssignees.includes(option.id))}
            onChange={(_, newValue) => setAssigneeFilter(newValue.map(v => v.id))}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Assignees"
                placeholder="Select people..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <FilterChip
                  key={option.id}
                  label={option.label}
                  onDelete={() => {
                    const tagProps = getTagProps({ index });
                    if (tagProps.onDelete) {
                      tagProps.onDelete({} as any);
                    }
                  }}
                  icon={<PersonIcon fontSize="small" />}
                />
              ))
            }
          />

          <Autocomplete
            multiple
            freeSolo
            options={tagOptions}
            value={tagOptions.filter(option => selectedTags.includes(option.value)).concat(
              selectedTags
                .filter(tag => !tagOptions.some(option => option.value === tag))
                .map(tag => ({ id: tag, label: tag, value: tag }))
            )}
            onChange={(_, newValue) => {
              const tags = newValue.map(v => 
                typeof v === 'string' ? v : v.value
              );
              setTagFilter(tags);
            }}
            getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Tags"
                placeholder="Add tags..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const tagOption = typeof option === 'string' 
                  ? { id: option, label: option, value: option }
                  : option;
                
                return (
                  <FilterChip
                    key={tagOption.id}
                    label={tagOption.label}
                    onDelete={() => {
                    const tagProps = getTagProps({ index });
                    if (tagProps.onDelete) {
                      tagProps.onDelete({} as any);
                    }
                  }}
                    icon={<TagIcon fontSize="small" />}
                    color={tagOption.color}
                  />
                );
              })
            }
          />
        </Stack>
      </Box>

      <Divider />

      {/* Date Range Filter */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Due Date Range
        </Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            type="date"
            label="From"
            size="small"
            value={dueDateRange.from?.toISOString().split('T')[0] || ''}
            onChange={(e) => setDueDateRange({
              ...dueDateRange,
              from: e.target.value ? new Date(e.target.value) : null,
            })}
            InputLabelProps={{ shrink: true }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              },
            }}
          />
          <TextField
            type="date"
            label="To"
            size="small"
            value={dueDateRange.to?.toISOString().split('T')[0] || ''}
            onChange={(e) => setDueDateRange({
              ...dueDateRange,
              to: e.target.value ? new Date(e.target.value) : null,
            })}
            InputLabelProps={{ shrink: true }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              },
            }}
          />
        </Stack>
      </Box>
    </Stack>
  );
};

export default SearchFilters;