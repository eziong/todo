// =============================================
// SPOTLIGHT SEARCH PRESENTER COMPONENT
// =============================================
// Pure UI component for spotlight search modal with Material Design and macOS aesthetics

'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Button,
  Collapse,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  KeyboardCommandKey as CmdIcon,
  Folder as FolderIcon,
  Label as LabelIcon,
  AccessTime as ClockIcon,
  Tune as FilterIcon,
  ExpandMore as ExpandIcon,
} from '@mui/icons-material';
import { useSpotlightSearch } from './useSpotlightSearch';
import { SearchResultsList } from './SearchResultsList/SearchResultsList';
import { SearchFilters } from './SearchFilters/SearchFilters';
import { SearchSuggestions } from './SearchSuggestions/SearchSuggestions';
import { useTaskSearch } from '@/hooks/useTaskSearch';
import { get_search_suggestions } from '@/database/search-examples';
import type { SearchCategory, SearchResultItem, QuickAction } from './useSpotlightSearch';
import type { SearchFilters as SearchFiltersType } from './SearchFilters/useSearchFilters';

// =============================================
// TYPES
// =============================================

export interface SpotlightSearchProps {
  className?: string;
  onResultSelect?: (result: SearchResultItem) => void;
  onActionSelect?: (action: QuickAction) => void;
  showEnhancedFeatures?: boolean;
  defaultFilters?: SearchFiltersType;
}

// =============================================
// SUB-COMPONENTS
// =============================================

interface SearchInputProps {
  query: string;
  isLoading: boolean;
  onQueryChange: (query: string) => void;
  onClear: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const SearchInput: React.FC<SearchInputProps> = ({
  query,
  isLoading,
  onQueryChange,
  onClear,
  onKeyDown,
  inputRef,
}) => {
  const theme = useTheme();

  return (
    <TextField
      inputRef={inputRef}
      fullWidth
      placeholder="Search workspaces, tasks, people..."
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      onKeyDown={onKeyDown}
      autoFocus
      variant="outlined"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {isLoading ? (
              <CircularProgress size={20} thickness={4} />
            ) : (
              <SearchIcon sx={{ color: 'text.secondary' }} />
            )}
          </InputAdornment>
        ),
        endAdornment: query && (
          <InputAdornment position="end">
            <IconButton onClick={onClear} size="small" edge="end">
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ),
        sx: {
          fontSize: '1.125rem',
          '& .MuiOutlinedInput-input': {
            padding: theme.spacing(1.5, 0),
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
          },
        },
      }}
      sx={{
        '& .MuiInputBase-root': {
          backgroundColor: 'transparent',
        },
      }}
    />
  );
};

interface CategoryTabsProps {
  selectedCategory: SearchCategory;
  onCategorySelect: (category: SearchCategory) => void;
  getCategoryCount: (category: SearchCategory) => number;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onCategorySelect,
  getCategoryCount,
}) => {
  const theme = useTheme();

  const categories: Array<{
    key: SearchCategory;
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: 'all', label: 'All', icon: <SearchIcon /> },
    { key: 'workspaces', label: 'Workspaces', icon: <FolderIcon /> },
    { key: 'sections', label: 'Sections', icon: <LabelIcon /> },
    { key: 'tasks', label: 'Tasks', icon: <CmdIcon /> },
    { key: 'people', label: 'People', icon: '👤' },
  ];

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
      <Tabs
        value={selectedCategory}
        onChange={(_, newValue) => onCategorySelect(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 'auto',
          '& .MuiTab-root': {
            minHeight: theme.spacing(5),
            minWidth: 'auto',
            px: theme.spacing(2),
            py: theme.spacing(1),
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            opacity: 0.7,
            transition: theme.transitions.create(['opacity', 'color']),
            '&.Mui-selected': {
              opacity: 1,
              color: 'primary.main',
            },
          },
          '& .MuiTabs-indicator': {
            height: 2,
            borderRadius: 1,
          },
        }}
      >
        {categories.map(({ key, label, icon }) => {
          const count = getCategoryCount(key);
          const displayLabel = count > 0 ? `${label} (${count})` : label;

          return (
            <Tab
              key={key}
              value={key}
              label={displayLabel}
              icon={typeof icon === 'string' ? (
                <Typography sx={{ fontSize: '1rem' }}>{icon}</Typography>
              ) : icon}
              iconPosition="start"
              sx={{
                '& .MuiTab-iconWrapper': {
                  marginRight: 0.5,
                  marginBottom: 0,
                },
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

interface EnhancedSearchHeaderProps {
  query: string;
  showFilters: boolean;
  showSuggestions: boolean;
  onToggleFilters: () => void;
  onToggleSuggestions: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}

const EnhancedSearchHeader: React.FC<EnhancedSearchHeaderProps> = ({
  query,
  showFilters,
  showSuggestions,
  onToggleFilters,
  onToggleSuggestions,
  hasActiveFilters,
  activeFiltersCount,
}) => {
  const theme = useTheme();

  if (!query.trim()) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: alpha(theme.palette.background.default, 0.5),
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        Enhanced Search Results
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          variant={showFilters ? 'contained' : 'outlined'}
          startIcon={<FilterIcon />}
          onClick={onToggleFilters}
          sx={{
            textTransform: 'none',
            borderRadius: theme.macOS.borderRadius.medium,
            ...(hasActiveFilters && !showFilters && {
              borderColor: 'primary.main',
              color: 'primary.main',
            }),
          }}
        >
          Filters
          {activeFiltersCount > 0 && (
            <Chip
              label={activeFiltersCount}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.7rem',
                ml: 0.5,
                backgroundColor: showFilters ? 'primary.contrastText' : 'primary.main',
                color: showFilters ? 'primary.main' : 'primary.contrastText',
              }}
            />
          )}
        </Button>
        
        <Button
          size="small"
          variant={showSuggestions ? 'contained' : 'outlined'}
          startIcon={<Typography sx={{ fontSize: '0.875rem' }}>💡</Typography>}
          onClick={onToggleSuggestions}
          sx={{
            textTransform: 'none',
            borderRadius: theme.macOS.borderRadius.medium,
          }}
        >
          Suggestions
        </Button>
      </Box>
    </Box>
  );
};

interface QuickActionsProps {
  actions: QuickAction[];
  onActionSelect: (action: QuickAction) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions, onActionSelect }) => {
  const theme = useTheme();

  if (!actions.length) {
    return null;
  }

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
        Quick Actions
      </Typography>
      <List sx={{ py: 0 }}>
        {actions.map((action) => (
          <ListItem key={action.id} disablePadding>
            <ListItemButton
              onClick={() => onActionSelect(action)}
              sx={{
                py: theme.spacing(1),
                px: theme.spacing(1.5),
                borderRadius: theme.macOS.borderRadius.medium,
                transition: theme.transitions.create(['background-color']),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: theme.spacing(4) }}>
                <Typography sx={{ fontSize: '1rem' }}>{action.icon}</Typography>
              </ListItemIcon>
              <ListItemText
                primary={action.title}
                secondary={action.description}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500,
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.secondary',
                }}
              />
              {action.shortcut && (
                <Chip
                  label={action.shortcut}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: 'action.hover',
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

interface NoResultsProps {
  query: string;
}

const NoResults: React.FC<NoResultsProps> = ({ query }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: theme.spacing(6),
        px: theme.spacing(3),
        textAlign: 'center',
      }}
    >
      <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔍</Typography>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
        No results found
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300 }}>
        No matches for &quot;{query}&quot;. Try adjusting your search terms or browse categories above.
      </Typography>
    </Box>
  );
};

interface RecentSearchesProps {
  searches: Array<{ id: string; query: string; results: number }>;
  onSearchSelect: (query: string) => void;
  onClearRecent: () => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
  searches,
  onSearchSelect,
  onClearRecent,
}) => {
  const theme = useTheme();

  if (!searches.length) {
    return null;
  }

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Recent Searches
        </Typography>
        <IconButton size="small" onClick={onClearRecent}>
          <ClearIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {searches.slice(0, 5).map((search) => (
          <Chip
            key={search.id}
            label={`${search.query} (${search.results})`}
            size="small"
            onClick={() => onSearchSelect(search.query)}
            icon={<ClockIcon />}
            sx={{
              fontSize: '0.75rem',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({
  className,
  onResultSelect,
  onActionSelect,
  showEnhancedFeatures = true,
  defaultFilters,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    state,
    handleQueryChange,
    clearQuery,
    handleKeyDown,
    selectCategory,
    getCategoryCount,
    navigateToResult,
    executeQuickAction,
    getVisibleQuickActions,
    executeRecentSearch,
    clearRecentSearches,
    closeSearch,
  } = useSpotlightSearch();

  // Enhanced search features state
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType | undefined>(defaultFilters);

  // Enhanced search hook
  const {
    globalResults,
    taskResults,
    suggestions,
    loading: enhancedLoading,
    searchGlobal,
    searchTasks,
    getSuggestions,
    clearResults,
  } = useTaskSearch();

  // Determine which results to show
  const useEnhancedResults = showEnhancedFeatures && state.query.trim().length >= 2;
  const enhancedResults = [...globalResults, ...taskResults];
  const displayResults = useEnhancedResults ? enhancedResults : state.filteredResults;
  const isLoading = useEnhancedResults ? enhancedLoading : state.isLoading;

  // Handle enhanced search
  useEffect(() => {
    if (showEnhancedFeatures && state.query.trim().length >= 2) {
      searchGlobal(state.query, currentFilters);
      if (showSuggestions) {
        getSuggestions(state.query);
      }
    } else {
      clearResults();
    }
  }, [state.query, currentFilters, showEnhancedFeatures, searchGlobal, getSuggestions, clearResults, showSuggestions]);

  // Enhanced feature controls
  const toggleFilters = () => setShowFilters(prev => !prev);
  const toggleSuggestions = () => setShowSuggestions(prev => !prev);
  
  const handleFiltersChange = (filters: SearchFiltersType) => {
    setCurrentFilters(filters);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    handleQueryChange(suggestion.suggestion);
    setShowSuggestions(false);
  };

  // Count active filters
  const activeFiltersCount = currentFilters ? Object.values(currentFilters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  }).length : 0;
  
  const hasActiveFilters = activeFiltersCount > 0;

  // Auto-focus input when modal opens
  useEffect(() => {
    if (state.isOpen && inputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [state.isOpen]);

  const handleResultSelect = (result: SearchResultItem): void => {
    onResultSelect?.(result);
    navigateToResult(result);
  };

  const handleActionSelect = (action: QuickAction): void => {
    onActionSelect?.(action);
    executeQuickAction(action.id);
  };

  const handleResultHover = (): void => {
    // Update selected index on hover for keyboard navigation sync
  };

  const visibleQuickActions = getVisibleQuickActions();
  const hasResults = displayResults.length > 0;
  const showNoResults = (useEnhancedResults ? displayResults.length === 0 : state.showNoResults) && state.query.trim().length > 0;

  return (
    <Dialog
      open={state.isOpen}
      onClose={closeSearch}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      className={className}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : theme.macOS.borderRadius.xlarge,
          boxShadow: theme.macOS.shadows.modal,
          overflow: 'hidden',
          maxHeight: isMobile ? '100vh' : '80vh',
          ...(isMobile && {
            margin: 0,
            maxWidth: '100%',
            maxHeight: '100%',
          }),
          ...(!isMobile && {
            mt: theme.spacing(8),
            minHeight: 400,
          }),
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Search Input */}
        <Box sx={{ p: theme.spacing(2, 3, 1, 3) }}>
          <SearchInput
            query={state.query}
            isLoading={state.isLoading}
            onQueryChange={handleQueryChange}
            onClear={clearQuery}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
          />
        </Box>

        {/* Category Tabs */}
        {(hasResults || state.query.trim()) && (
          <CategoryTabs
            selectedCategory={state.selectedCategory}
            onCategorySelect={selectCategory}
            getCategoryCount={getCategoryCount}
          />
        )}

        {/* Content Area */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {/* Error State */}
          {state.error && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error" variant="body2">
                {state.error}
              </Typography>
            </Box>
          )}

          {/* Enhanced Search Header */}
          {showEnhancedFeatures && (
            <EnhancedSearchHeader
              query={state.query}
              showFilters={showFilters}
              showSuggestions={showSuggestions}
              onToggleFilters={toggleFilters}
              onToggleSuggestions={toggleSuggestions}
              hasActiveFilters={hasActiveFilters}
              activeFiltersCount={activeFiltersCount}
            />
          )}

          {/* Search Filters */}
          {showEnhancedFeatures && showFilters && (
            <Collapse in={showFilters}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <SearchFilters
                  compact
                  onFiltersChange={handleFiltersChange}
                  initialFilters={currentFilters}
                />
              </Box>
            </Collapse>
          )}

          {/* Search Suggestions */}
          {showEnhancedFeatures && showSuggestions && (
            <SearchSuggestions
              query={state.query}
              onSuggestionSelect={handleSuggestionSelect}
              getSuggestionsFunction={get_search_suggestions}
              compact
              maxSuggestions={6}
            />
          )}

          {/* Search Results */}
          {hasResults && (
            <>
              {useEnhancedResults ? (
                <SearchResultsList
                  results={displayResults}
                  query={state.query}
                  loading={isLoading}
                  onResultSelect={handleResultSelect}
                  onResultHover={handleResultHover}
                  compact
                  showGrouping
                  defaultViewMode="compact"
                  showRelevanceScores
                  showContextSnippets
                  maxResults={50}
                />
              ) : (
                <List sx={{ py: 0 }}>
                  {state.filteredResults.map((result, index) => {
                    const isSelected = index === state.selectedIndex;
                    
                    return (
                      <ListItem key={result.id} disablePadding>
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => handleResultSelect(result)}
                          onMouseEnter={() => handleResultHover()}
                          sx={{
                            py: theme.spacing(1.5),
                            px: theme.spacing(2),
                            borderRadius: theme.macOS.borderRadius.medium,
                            mx: theme.spacing(1),
                            my: 0.5,
                            transition: theme.transitions.create(['background-color', 'transform']),
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            },
                            '&.Mui-selected': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                              },
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: theme.spacing(5) }}>
                            <Typography sx={{ fontSize: '1.25rem' }}>
                              {result.icon}
                            </Typography>
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {result.title}
                                </Typography>
                                
                                {result.priority && result.type === 'task' && (
                                  <Chip
                                    label={result.priority}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                {result.subtitle && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                                    {result.subtitle}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {[result.workspaceName, result.sectionName].filter(Boolean).join(' • ')}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </>
          )}

          {/* No Results */}
          {showNoResults && <NoResults query={state.query} />}

          {/* Quick Actions */}
          {visibleQuickActions.length > 0 && (
            <>
              {hasResults && <Divider />}
              <QuickActions
                actions={visibleQuickActions}
                onActionSelect={handleActionSelect}
              />
            </>
          )}

          {/* Recent Searches */}
          {!state.query.trim() && state.recentSearches.length > 0 && (
            <>
              <Divider />
              <RecentSearches
                searches={state.recentSearches}
                onSearchSelect={executeRecentSearch}
                onClearRecent={clearRecentSearches}
              />
            </>
          )}
        </Box>

        {/* Footer with shortcuts */}
        {!isMobile && (
          <Box
            sx={{
              p: theme.spacing(1.5, 3),
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'text.secondary',
            }}
          >
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption">↑↓</Typography>
                <Typography variant="caption">to navigate</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption">↵</Typography>
                <Typography variant="caption">to select</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption">⇥</Typography>
                <Typography variant="caption">to filter</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption">esc</Typography>
              <Typography variant="caption">to close</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SpotlightSearch;