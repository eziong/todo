// =============================================
// ACTIVITY SEARCH PRESENTER COMPONENT
// =============================================
// Search interface for activity events with Material UI styling

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Chip,
  Button,
  Collapse,
  Divider,
  Stack,
  Grid,
  Paper,
  Badge,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  Popper,
  ClickAwayListener
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Tag as TagIcon,
  Category as CategoryIcon,
  AutoAwesome as SuggestionIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import { 
  useActivitySearch, 
  UseActivitySearchProps,
  SearchSuggestion,
  SearchHistory 
} from './useActivitySearch';
import { ActivityFilters } from '@/components/ActivityFilters/ActivityFilters';
import { designTokens } from '@/theme/utils';
import type { ActivityFeedItem } from '@/types/database';

// =============================================
// STYLED COMPONENTS
// =============================================

const SearchCard = styled(Card)(({ theme }) => ({
  borderRadius: designTokens.borderRadius.lg,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  border: theme.palette.mode === 'light' ? 'none' : `1px solid ${theme.palette.divider}`,
  overflow: 'visible',
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: theme.palette.mode === 'light' 
      ? alpha(theme.palette.common.white, 0.8) 
      : alpha(theme.palette.grey[900], 0.8),
    transition: designTokens.animation.fast,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'light' 
        ? theme.palette.common.white 
        : theme.palette.grey[800],
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.common.white,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  },
}));

const SuggestionPopper = styled(Popper)(({ theme }) => ({
  zIndex: theme.zIndex.modal + 1,
  '& .MuiPaper-root': {
    borderRadius: designTokens.borderRadius.md,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    border: `1px solid ${theme.palette.divider}`,
    maxHeight: 400,
    overflow: 'auto',
  },
}));

const ResultCard = styled(Card)(({ theme }) => ({
  borderRadius: designTokens.borderRadius.md,
  border: `1px solid ${theme.palette.divider}`,
  transition: designTokens.animation.fast,
  cursor: 'pointer',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-1px)',
  },
}));

// =============================================
// HELPER COMPONENTS
// =============================================

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  onSelect: (suggestion: SearchSuggestion) => void;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  onSelect,
  anchorEl,
  open,
  onClose
}) => {
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'user': return <PersonIcon fontSize="small" />;
      case 'event_type': return <CategoryIcon fontSize="small" />;
      case 'entity': return <CategoryIcon fontSize="small" />;
      case 'tag': return <TagIcon fontSize="small" />;
      case 'recent': return <HistoryIcon fontSize="small" />;
      default: return <SuggestionIcon fontSize="small" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'user': return 'primary';
      case 'event_type': return 'secondary';
      case 'entity': return 'success';
      case 'tag': return 'warning';
      case 'recent': return 'info';
      default: return 'default';
    }
  };

  if (!open || suggestions.length === 0) return null;

  return (
    <SuggestionPopper 
      anchorEl={anchorEl} 
      open={open} 
      placement="bottom-start"
      style={{ width: anchorEl?.clientWidth }}
    >
      <Paper>
        <List dense>
          {suggestions.map((suggestion, index) => (
            <ListItemButton
              key={`${suggestion.type}-${suggestion.value}-${index}`}
              onClick={() => onSelect(suggestion)}
            >
              <ListItemIcon>
                {suggestion.icon ? (
                  <Typography fontSize="1rem">{suggestion.icon}</Typography>
                ) : (
                  getSuggestionIcon(suggestion.type)
                )}
              </ListItemIcon>
              
              <ListItemText
                primary={suggestion.label}
                secondary={suggestion.type.replace('_', ' ')}
              />
              
              {suggestion.count && (
                <ListItemSecondaryAction>
                  <Chip
                    label={suggestion.count}
                    size="small"
                    color={getSuggestionColor(suggestion.type) as any}
                    variant="outlined"
                  />
                </ListItemSecondaryAction>
              )}
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </SuggestionPopper>
  );
};

interface SearchResultsProps {
  results: ActivityFeedItem[];
  loading: boolean;
  error: string | null;
  onResultClick?: (result: ActivityFeedItem) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  error,
  onResultClick
}) => {
  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" py={4}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Searching...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (results.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No results found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search query or filters
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2} mt={2}>
      <Typography variant="subtitle2" color="text.secondary">
        {results.length} result{results.length !== 1 ? 's' : ''} found
      </Typography>
      
      {results.map((result) => (
        <ResultCard key={result.id} onClick={() => onResultClick?.(result)}>
          <CardContent sx={{ py: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography component="span" fontSize="1.2rem">
                {getEventIcon(result.event_type)}
              </Typography>
              
              <Box flex={1}>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {formatEventTitle(result)}
                </Typography>
                
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip 
                    icon={<ScheduleIcon />}
                    label={formatTimeAgo(result.created_at)} 
                    size="small" 
                    variant="outlined" 
                  />
                  
                  {result.user_name && (
                    <Chip 
                      icon={<PersonIcon />}
                      label={result.user_name} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  )}
                  
                  {result.workspace_name && (
                    <Chip 
                      label={result.workspace_name} 
                      size="small" 
                      color="secondary" 
                      variant="outlined" 
                    />
                  )}
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </ResultCard>
      ))}
    </Stack>
  );
};

interface SearchHistoryProps {
  history: SearchHistory[];
  onApply: (item: SearchHistory) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  open: boolean;
  onToggle: () => void;
}

const SearchHistoryPanel: React.FC<SearchHistoryProps> = ({
  history,
  onApply,
  onDelete,
  onClear,
  open,
  onToggle
}) => (
  <Accordion expanded={open} onChange={onToggle} elevation={0}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Box display="flex" alignItems="center" gap={1}>
        <HistoryIcon color="action" />
        <Typography variant="subtitle2">
          Search History
        </Typography>
        <Badge badgeContent={history.length} color="primary" />
      </Box>
    </AccordionSummary>
    
    <AccordionDetails>
      {history.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No search history
        </Typography>
      ) : (
        <>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="caption" color="text.secondary">
              Recent searches
            </Typography>
            <Button size="small" onClick={onClear} color="error">
              Clear All
            </Button>
          </Box>
          
          <List dense>
            {history.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton onClick={() => onApply(item)}>
                  <ListItemIcon>
                    <SearchIcon fontSize="small" />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={item.query || 'Advanced search'}
                    secondary={`${item.resultCount} results • ${new Date(item.timestamp).toLocaleDateString()}`}
                  />
                  
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </AccordionDetails>
  </Accordion>
);

// =============================================
// MAIN COMPONENT
// =============================================

export interface ActivitySearchProps extends UseActivitySearchProps {
  className?: string;
  placeholder?: string;
  showFilters?: boolean;
  showHistory?: boolean;
  showStats?: boolean;
  onResultClick?: (result: ActivityFeedItem) => void;
  compact?: boolean;
}

export const ActivitySearch: React.FC<ActivitySearchProps> = ({
  workspaceId,
  onSearch,
  debounceMs = 300,
  minQueryLength = 2,
  maxResults = 100,
  className,
  placeholder = "Search activity events...",
  showFilters = true,
  showHistory = true,
  showStats = true,
  onResultClick,
  compact = false
}) => {
  const [searchFieldRef, setSearchFieldRef] = React.useState<HTMLElement | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = React.useState(false);

  const {
    query,
    setQuery,
    results,
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    executeSearch,
    clearSearch,
    searchHistory,
    clearHistory,
    deleteHistoryItem,
    applyHistoryItem,
    searchStats,
    hasQuery,
    hasFilters,
    hasResults,
    resultCount
  } = useActivitySearch({
    workspaceId,
    onSearch,
    debounceMs,
    minQueryLength,
    maxResults
  });

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'recent') {
      setQuery(suggestion.value);
    } else {
      setQuery(suggestion.label);
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      executeSearch();
      setShowSuggestions(false);
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  return (
    <SearchCard className={className}>
      <CardContent sx={{ pb: compact ? 2 : 3 }}>
        {/* Search Input */}
        <Box position="relative" mb={showAdvancedFilters || showHistoryPanel ? 2 : 0}>
          <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
            <Box>
              <SearchField
                fullWidth
                ref={setSearchFieldRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder={placeholder}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Stack direction="row" spacing={0.5}>
                        {showFilters && (
                          <Tooltip title="Advanced filters">
                            <IconButton
                              size="small"
                              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                              color={hasFilters ? 'primary' : 'default'}
                            >
                              <Badge variant="dot" color="primary" invisible={!hasFilters}>
                                <FilterIcon />
                              </Badge>
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {showHistory && (
                          <Tooltip title="Search history">
                            <IconButton
                              size="small"
                              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {(hasQuery || hasFilters) && (
                          <Tooltip title="Clear search">
                            <IconButton size="small" onClick={clearSearch}>
                              <ClearIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Search Suggestions */}
              <SearchSuggestions
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
                anchorEl={searchFieldRef}
                open={showSuggestions && suggestions.length > 0}
                onClose={() => setShowSuggestions(false)}
              />
            </Box>
          </ClickAwayListener>
        </Box>

        {/* Advanced Filters */}
        {showFilters && (
          <Collapse in={showAdvancedFilters}>
            <Box mb={2}>
              <ActivityFilters
                initialFilters={filters}
                onFiltersChange={handleFiltersChange}
                compact={true}
                showQuickFilters={true}
                showPresets={false}
              />
            </Box>
          </Collapse>
        )}

        {/* Search History */}
        {showHistory && (
          <SearchHistoryPanel
            history={searchHistory}
            onApply={applyHistoryItem}
            onDelete={deleteHistoryItem}
            onClear={clearHistory}
            open={showHistoryPanel}
            onToggle={() => setShowHistoryPanel(!showHistoryPanel)}
          />
        )}

        {/* Search Stats */}
        {showStats && searchStats && (hasQuery || hasResults) && !compact && (
          <Box mt={2} mb={2}>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {searchStats.totalQueries}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Searches
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">
                    {searchStats.averageResults}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg Results
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Popular searches:
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {searchStats.mostSearchedTerms.slice(0, 3).map((term, index) => (
                      <Chip
                        key={term.term}
                        label={`${term.term} (${term.count})`}
                        size="small"
                        variant="outlined"
                        onClick={() => setQuery(term.term)}
                        clickable
                      />
                    ))}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ mt: 2 }} />
          </Box>
        )}

        {/* Search Results */}
        <SearchResults
          results={results}
          loading={loading}
          error={error}
          onResultClick={onResultClick}
        />
      </CardContent>
    </SearchCard>
  );
};

// =============================================
// HELPER FUNCTIONS
// =============================================

function getEventIcon(eventType: string): string {
  const iconMap: Record<string, string> = {
    created: '➕',
    updated: '✏️',
    deleted: '🗑️',
    completed: '✅',
    assigned: '👤',
    moved: '📁',
    status_changed: '🔄',
    archived: '📦',
    login: '🔐',
    search_performed: '🔍',
    viewed: '👁️',
    commented: '💬'
  };
  return iconMap[eventType] || '📝';
}

function formatEventTitle(event: ActivityFeedItem): string {
  const userName = event.user_name || 'Someone';
  const description = event.description || `${event.entity_type}`;
  
  switch (event.event_type) {
    case 'created':
      return `${userName} created ${description}`;
    case 'updated':
      return `${userName} updated ${description}`;
    case 'completed':
      return `${userName} completed ${description}`;
    case 'assigned':
      return `${userName} was assigned to ${description}`;
    default:
      return `${userName} ${event.event_type.replace('_', ' ')} ${description}`;
  }
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export default ActivitySearch;