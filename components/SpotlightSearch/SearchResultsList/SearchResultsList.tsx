// =============================================
// SEARCH RESULTS LIST PRESENTER COMPONENT
// =============================================
// Pure UI component for search results with relevance indicators, highlighting, and multiple view modes

'use client';

import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  Stack,
  alpha,
  useTheme,
  Badge,
  Avatar,
  Skeleton,
} from '@mui/material';
import {
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  ViewComfy as CompactViewIcon,
  Sort as SortIcon,
  TrendingUp as RelevanceIcon,
  Schedule as TimeIcon,
  Person as PersonIcon,
  Business as WorkspaceIcon,
  Folder as SectionIcon,
  Assignment as TaskIcon,
  KeyboardArrowRight as ArrowIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSearchResultsList } from './useSearchResultsList';
import type { SearchResultsListProps, ResultGroup } from './useSearchResultsList';
import type { SearchResultItem } from '../useSpotlightSearch';

// =============================================
// SUB-COMPONENTS
// =============================================

interface SearchResultItemProps {
  result: SearchResultItem;
  query: string;
  isSelected: boolean;
  showRelevanceScore: boolean;
  showContextSnippet: boolean;
  viewMode: 'list' | 'grid' | 'compact';
  onClick: () => void;
  onHover?: () => void;
  highlightText: (text: string, query: string) => React.ReactNode;
  getRelevanceLabel: (score: number) => string;
  getRelevanceColor: (score: number) => string;
}

const SearchResultItemComponent: React.FC<SearchResultItemProps> = ({
  result,
  query,
  isSelected,
  showRelevanceScore,
  showContextSnippet,
  viewMode,
  onClick,
  onHover,
  highlightText,
  getRelevanceLabel,
  getRelevanceColor,
}) => {
  const theme = useTheme();

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'in_progress': return theme.palette.info.main;
      case 'todo': return theme.palette.warning.main;
      case 'cancelled': return theme.palette.error.main;
      case 'on_hold': return theme.palette.grey[500];
      default: return theme.palette.text.secondary;
    }
  };

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'urgent': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.text.secondary;
    }
  };

  const formatDate = (date?: string): string => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 0) return `In ${days} days`;
    if (days < 0) return `${Math.abs(days)} days ago`;
    return d.toLocaleDateString();
  };

  const renderMetadata = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {result.workspaceName && (
        <Typography variant="caption" color="text.secondary">
          {result.workspaceName}
        </Typography>
      )}
      
      {result.sectionName && result.workspaceName && (
        <>
          <Typography variant="caption" color="text.disabled">•</Typography>
          <Typography variant="caption" color="text.secondary">
            {result.sectionName}
          </Typography>
        </>
      )}

      {result.assigneeName && (
        <>
          <Typography variant="caption" color="text.disabled">•</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: '0.75rem' }} />
            <Typography variant="caption" color="text.secondary">
              {result.assigneeName}
            </Typography>
          </Box>
        </>
      )}

      {result.dueDate && (
        <>
          <Typography variant="caption" color="text.disabled">•</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimeIcon sx={{ fontSize: '0.75rem' }} />
            <Typography variant="caption" color="text.secondary">
              {formatDate(result.dueDate)}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );

  if (viewMode === 'grid') {
    return (
      <Grid item xs={12} sm={6} md={4}>
        <Card
          sx={{
            cursor: 'pointer',
            transition: theme.transitions.create(['transform', 'box-shadow'], {
              duration: theme.transitions.duration.shorter,
            }),
            border: isSelected ? 2 : 1,
            borderColor: isSelected ? 'primary.main' : 'divider',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.macOS.shadows.medium,
            },
          }}
          onClick={onClick}
          onMouseEnter={onHover}
        >
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
              <Typography sx={{ fontSize: '1.25rem' }}>{result.icon}</Typography>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {highlightText(result.title, query)}
                </Typography>
              </Box>

              {showRelevanceScore && (
                <Chip
                  label={Math.round(result.relevanceScore * 100)}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: alpha(getRelevanceColor(result.relevanceScore), 0.1),
                    color: getRelevanceColor(result.relevanceScore),
                  }}
                />
              )}
            </Box>

            {result.subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {highlightText(result.subtitle, query)}
              </Typography>
            )}

            {result.status && (
              <Chip
                label={result.status.replace('_', ' ')}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: alpha(getStatusColor(result.status), 0.1),
                  color: getStatusColor(result.status),
                  textTransform: 'capitalize',
                  mb: 1,
                }}
              />
            )}

            {result.priority && (
              <Chip
                label={result.priority}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: alpha(getPriorityColor(result.priority), 0.1),
                  color: getPriorityColor(result.priority),
                  textTransform: 'capitalize',
                  ml: result.status ? 1 : 0,
                  mb: 1,
                }}
              />
            )}

            <Box sx={{ mt: 'auto' }}>
              {renderMetadata()}
            </Box>

            {showContextSnippet && result.contextSnippet && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{
                  mt: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontStyle: 'italic',
                }}
              >
                {highlightText(result.contextSnippet, query)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  }

  if (viewMode === 'compact') {
    return (
      <ListItemButton
        selected={isSelected}
        onClick={onClick}
        onMouseEnter={onHover}
        sx={{
          py: 1,
          px: 2,
          borderRadius: theme.macOS.borderRadius.small,
          mx: 0.5,
          my: 0.25,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <Typography sx={{ fontSize: '1rem' }}>{result.icon}</Typography>
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {highlightText(result.title, query)}
              </Typography>
              
              {showRelevanceScore && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    backgroundColor: alpha(getRelevanceColor(result.relevanceScore), 0.1),
                    color: getRelevanceColor(result.relevanceScore),
                    fontWeight: 600,
                  }}
                >
                  {Math.round(result.relevanceScore * 100)}%
                </Typography>
              )}
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {result.workspaceName}
              </Typography>
              {result.sectionName && (
                <>
                  <Typography variant="caption" color="text.disabled">•</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {result.sectionName}
                  </Typography>
                </>
              )}
            </Box>
          }
        />

        <ArrowIcon sx={{ color: 'text.disabled', opacity: isSelected ? 1 : 0 }} />
      </ListItemButton>
    );
  }

  // List view (default)
  return (
    <ListItemButton
      selected={isSelected}
      onClick={onClick}
      onMouseEnter={onHover}
      sx={{
        py: 1.5,
        px: 2,
        borderRadius: theme.macOS.borderRadius.medium,
        mx: 1,
        my: 0.5,
        transition: theme.transitions.create(['background-color', 'transform']),
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          transform: 'translateX(4px)',
        },
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 48 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: 'transparent',
            fontSize: '1.25rem',
          }}
        >
          {result.icon}
        </Avatar>
      </ListItemIcon>
      
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {highlightText(result.title, query)}
            </Typography>
            
            {showRelevanceScore && (
              <Chip
                label={`${Math.round(result.relevanceScore * 100)}% match`}
                size="small"
                icon={<RelevanceIcon fontSize="small" />}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: alpha(getRelevanceColor(result.relevanceScore), 0.1),
                  color: getRelevanceColor(result.relevanceScore),
                }}
              />
            )}

            {result.status && (
              <Chip
                label={result.status.replace('_', ' ')}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: alpha(getStatusColor(result.status), 0.1),
                  color: getStatusColor(result.status),
                  textTransform: 'capitalize',
                }}
              />
            )}

            {result.priority && (
              <Chip
                label={result.priority}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: alpha(getPriorityColor(result.priority), 0.1),
                  color: getPriorityColor(result.priority),
                  textTransform: 'capitalize',
                }}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            {result.subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                {highlightText(result.subtitle, query)}
              </Typography>
            )}
            
            {renderMetadata()}

            {showContextSnippet && result.contextSnippet && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{
                  mt: 0.5,
                  display: 'block',
                  fontStyle: 'italic',
                }}
              >
                {highlightText(result.contextSnippet, query)}
              </Typography>
            )}

            {result.tags && result.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                {result.tags.slice(0, 3).map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      borderRadius: 0.5,
                    }}
                  />
                ))}
                {result.tags.length > 3 && (
                  <Typography variant="caption" color="text.disabled" sx={{ alignSelf: 'center' }}>
                    +{result.tags.length - 3}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        }
      />

      <ArrowIcon sx={{ color: 'text.disabled', opacity: isSelected ? 1 : 0 }} />
    </ListItemButton>
  );
};

interface ResultsHeaderProps {
  resultSummary: string;
  viewMode: 'list' | 'grid' | 'compact';
  sortBy: any;
  availableViewModes: any[];
  availableSortOptions: any[];
  showRelevanceScores: boolean;
  showContextSnippets: boolean;
  onViewModeChange: (mode: 'list' | 'grid' | 'compact') => void;
  onSortChange: (sort: any) => void;
  onToggleRelevanceScores: () => void;
  onToggleContextSnippets: () => void;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  resultSummary,
  viewMode,
  sortBy,
  availableViewModes,
  availableSortOptions,
  showRelevanceScores,
  showContextSnippets,
  onViewModeChange,
  onSortChange,
  onToggleRelevanceScores,
  onToggleContextSnippets,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: alpha(theme.palette.background.default, 0.5),
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {resultSummary}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Sort Options */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={`${sortBy.field}-${sortBy.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              const option = availableSortOptions.find(
                opt => opt.field === field && opt.direction === direction
              );
              if (option) onSortChange(option);
            }}
            label="Sort by"
            sx={{ borderRadius: theme.macOS.borderRadius.small }}
          >
            {availableSortOptions.map((option) => (
              <MenuItem key={`${option.field}-${option.direction}`} value={`${option.field}-${option.direction}`}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* View Mode Toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
          size="small"
        >
          <ToggleButton value="list">
            <Tooltip title="List View">
              <ListViewIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="grid">
            <Tooltip title="Grid View">
              <GridViewIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="compact">
            <Tooltip title="Compact View">
              <CompactViewIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Display Options */}
        <Tooltip title="Toggle Relevance Scores">
          <IconButton
            size="small"
            onClick={onToggleRelevanceScores}
            color={showRelevanceScores ? 'primary' : 'default'}
          >
            <RelevanceIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Toggle Context Snippets">
          <IconButton
            size="small"
            onClick={onToggleContextSnippets}
            color={showContextSnippets ? 'primary' : 'default'}
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

interface LoadingStateProps {
  viewMode: 'list' | 'grid' | 'compact';
}

const LoadingState: React.FC<LoadingStateProps> = ({ viewMode }) => {
  const theme = useTheme();
  
  if (viewMode === 'grid') {
    return (
      <Grid container spacing={2} sx={{ p: 2 }}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item}>
            <Card>
              <CardContent>
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={20} />
                <Skeleton variant="text" width="60%" height={16} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <List sx={{ px: 2 }}>
      {[1, 2, 3, 4, 5].map((item) => (
        <ListItem key={item}>
          <ListItemIcon>
            <Skeleton variant="circular" width={32} height={32} />
          </ListItemIcon>
          <ListItemText
            primary={<Skeleton variant="text" height={20} />}
            secondary={<Skeleton variant="text" height={16} width="60%" />}
          />
        </ListItem>
      ))}
    </List>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  className,
  results: initialResults = [],
  query = '',
  loading = false,
  error = null,
  onResultSelect,
  onResultHover,
  showGrouping = true,
  defaultViewMode = 'list',
  defaultSortBy,
  showRelevanceScores: initialShowRelevanceScores = true,
  showContextSnippets: initialShowContextSnippets = true,
  compact = false,
  maxResults,
}) => {
  const theme = useTheme();
  
  const {
    results,
    groupedResults,
    selectedIndex,
    viewMode,
    sortBy,
    showRelevanceScores,
    showContextSnippets,
    availableSortOptions,
    availableViewModes,
    selectResult,
    navigateToResult,
    setSortBy,
    setViewMode,
    toggleRelevanceScores,
    toggleContextSnippets,
    highlightText,
    getRelevanceLabel,
    getRelevanceColor,
    getResultSummary,
    handleKeyDown,
  } = useSearchResultsList(
    initialResults.slice(0, maxResults),
    query,
    onResultSelect
  );

  // Initialize with default values
  React.useEffect(() => {
    if (defaultSortBy) setSortBy(defaultSortBy);
    setViewMode(defaultViewMode);
  }, [defaultSortBy, defaultViewMode, setSortBy, setViewMode]);

  const handleResultClick = (result: SearchResultItem, index: number) => {
    selectResult(index);
    navigateToResult(result);
  };

  const handleResultHover = (result: SearchResultItem, index: number) => {
    selectResult(index);
    onResultHover?.(result);
  };

  if (loading) {
    return (
      <Box className={className}>
        <LoadingState viewMode={viewMode} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" color="error" sx={{ mb: 1 }}>
          Search Error
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          No results found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search terms or filters
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={className} onKeyDown={handleKeyDown}>
      {!compact && (
        <ResultsHeader
          resultSummary={getResultSummary()}
          viewMode={viewMode}
          sortBy={sortBy}
          availableViewModes={availableViewModes}
          availableSortOptions={availableSortOptions}
          showRelevanceScores={showRelevanceScores}
          showContextSnippets={showContextSnippets}
          onViewModeChange={setViewMode}
          onSortChange={setSortBy}
          onToggleRelevanceScores={toggleRelevanceScores}
          onToggleContextSnippets={toggleContextSnippets}
        />
      )}

      <Box sx={{ maxHeight: compact ? 400 : 600, overflow: 'auto' }}>
        {showGrouping && groupedResults.length > 1 ? (
          // Grouped results
          groupedResults.map((group, groupIndex) => (
            <Box key={group.type}>
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  backgroundColor: alpha(group.color, 0.05),
                  borderLeft: 4,
                  borderLeftColor: group.color,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: group.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontSize: '1rem' }}>{group.icon}</Typography>
                  {group.label}
                  <Chip
                    label={group.count}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      backgroundColor: alpha(group.color, 0.1),
                      color: group.color,
                    }}
                  />
                </Typography>
              </Box>

              {viewMode === 'grid' ? (
                <Grid container spacing={2} sx={{ p: 2 }}>
                  {group.results.map((result, index) => {
                    const globalIndex = groupedResults
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.results.length, 0) + index;
                    
                    return (
                      <SearchResultItemComponent
                        key={result.id}
                        result={result}
                        query={query}
                        isSelected={globalIndex === selectedIndex}
                        showRelevanceScore={showRelevanceScores}
                        showContextSnippet={showContextSnippets}
                        viewMode={viewMode}
                        onClick={() => handleResultClick(result, globalIndex)}
                        onHover={() => handleResultHover(result, globalIndex)}
                        highlightText={highlightText}
                        getRelevanceLabel={getRelevanceLabel}
                        getRelevanceColor={getRelevanceColor}
                      />
                    );
                  })}
                </Grid>
              ) : (
                <List sx={{ py: 0 }}>
                  {group.results.map((result, index) => {
                    const globalIndex = groupedResults
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.results.length, 0) + index;
                    
                    return (
                      <SearchResultItemComponent
                        key={result.id}
                        result={result}
                        query={query}
                        isSelected={globalIndex === selectedIndex}
                        showRelevanceScore={showRelevanceScores}
                        showContextSnippet={showContextSnippets}
                        viewMode={viewMode}
                        onClick={() => handleResultClick(result, globalIndex)}
                        onHover={() => handleResultHover(result, globalIndex)}
                        highlightText={highlightText}
                        getRelevanceLabel={getRelevanceLabel}
                        getRelevanceColor={getRelevanceColor}
                      />
                    );
                  })}
                </List>
              )}

              {groupIndex < groupedResults.length - 1 && <Divider />}
            </Box>
          ))
        ) : (
          // Flat results
          <>
            {viewMode === 'grid' ? (
              <Grid container spacing={2} sx={{ p: 2 }}>
                {results.map((result, index) => (
                  <SearchResultItemComponent
                    key={result.id}
                    result={result}
                    query={query}
                    isSelected={index === selectedIndex}
                    showRelevanceScore={showRelevanceScores}
                    showContextSnippet={showContextSnippets}
                    viewMode={viewMode}
                    onClick={() => handleResultClick(result, index)}
                    onHover={() => handleResultHover(result, index)}
                    highlightText={highlightText}
                    getRelevanceLabel={getRelevanceLabel}
                    getRelevanceColor={getRelevanceColor}
                  />
                ))}
              </Grid>
            ) : (
              <List sx={{ py: 1 }}>
                {results.map((result, index) => (
                  <SearchResultItemComponent
                    key={result.id}
                    result={result}
                    query={query}
                    isSelected={index === selectedIndex}
                    showRelevanceScore={showRelevanceScores}
                    showContextSnippet={showContextSnippets}
                    viewMode={viewMode}
                    onClick={() => handleResultClick(result, index)}
                    onHover={() => handleResultHover(result, index)}
                    highlightText={highlightText}
                    getRelevanceLabel={getRelevanceLabel}
                    getRelevanceColor={getRelevanceColor}
                  />
                ))}
              </List>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default SearchResultsList;