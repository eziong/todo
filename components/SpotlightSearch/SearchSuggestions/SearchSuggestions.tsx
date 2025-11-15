// =============================================
// SEARCH SUGGESTIONS PRESENTER COMPONENT
// =============================================
// Pure UI component for search suggestions with Material Design and macOS aesthetics

'use client';

import React, { useEffect } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  CircularProgress,
  Divider,
  Collapse,
  alpha,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingIcon,
  History as HistoryIcon,
  KeyboardArrowRight as ArrowIcon,
} from '@mui/icons-material';
import { useSearchSuggestions } from './useSearchSuggestions';
import type { SearchSuggestionsProps, SuggestionGroup } from './useSearchSuggestions';
import type { SearchSuggestion } from '@/database/types';

// =============================================
// SUB-COMPONENTS
// =============================================

interface SuggestionItemProps {
  suggestion: SearchSuggestion;
  isSelected: boolean;
  onClick: () => void;
  onHover?: () => void;
  compact?: boolean;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({
  suggestion,
  isSelected,
  onClick,
  onHover,
  compact = false,
}) => {
  const theme = useTheme();

  const getEntityIcon = (entityType: string): string => {
    switch (entityType) {
      case 'workspace': return '📁';
      case 'section': return '📂';
      case 'task': return '📝';
      case 'tag': return '🏷️';
      default: return '💡';
    }
  };

  const getEntityColor = (entityType: string): string => {
    switch (entityType) {
      case 'workspace': return theme.palette.primary.main;
      case 'section': return theme.palette.success.main;
      case 'task': return theme.palette.info.main;
      case 'tag': return theme.palette.warning.main;
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <ListItemButton
      selected={isSelected}
      onClick={onClick}
      onMouseEnter={onHover}
      sx={{
        px: theme.spacing(compact ? 2 : 3),
        py: theme.spacing(compact ? 1 : 1.5),
        borderRadius: 2,
        mx: theme.spacing(1),
        my: 0.5,
        transition: theme.transitions.create(['background-color', 'transform'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          transform: 'translateX(4px)',
        },
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
          },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: compact ? theme.spacing(4) : theme.spacing(5) }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: compact ? 24 : 32,
            height: compact ? 24 : 32,
            borderRadius: 1,
            backgroundColor: alpha(getEntityColor(suggestion.entity_type), 0.1),
            fontSize: compact ? '0.875rem' : '1rem',
          }}
        >
          {getEntityIcon(suggestion.entity_type)}
        </Box>
      </ListItemIcon>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant={compact ? 'body2' : 'body1'}
              sx={{
                fontWeight: 500,
                color: 'text.primary',
              }}
            >
              {suggestion.suggestion}
            </Typography>
            
            {suggestion.entity_count > 0 && (
              <Chip
                label={suggestion.entity_count}
                size="small"
                sx={{
                  height: compact ? 18 : 20,
                  fontSize: compact ? '0.7rem' : '0.75rem',
                  fontWeight: 600,
                  backgroundColor: alpha(getEntityColor(suggestion.entity_type), 0.1),
                  color: getEntityColor(suggestion.entity_type),
                  '& .MuiChip-label': {
                    px: 0.75,
                  },
                }}
              />
            )}
          </Box>
        }
        secondary={!compact && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'capitalize',
            }}
          >
            {suggestion.entity_type}
            {suggestion.entity_count > 1 && ` • ${suggestion.entity_count} items`}
          </Typography>
        )}
      />

      <ArrowIcon
        sx={{
          color: 'text.disabled',
          opacity: isSelected ? 1 : 0,
          transition: theme.transitions.create('opacity'),
          fontSize: compact ? '1rem' : '1.25rem',
        }}
      />
    </ListItemButton>
  );
};

interface SuggestionGroupProps {
  group: SuggestionGroup;
  selectedIndex: number;
  globalStartIndex: number;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  onSuggestionHover?: (suggestion: SearchSuggestion) => void;
  compact?: boolean;
}

const SuggestionGroupComponent: React.FC<SuggestionGroupProps> = ({
  group,
  selectedIndex,
  globalStartIndex,
  onSuggestionClick,
  onSuggestionHover,
  compact = false,
}) => {
  const theme = useTheme();

  return (
    <Box>
      {!compact && (
        <Box sx={{ px: 3, py: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: '0.875rem' }}>{group.icon}</Typography>
            {group.title}
          </Typography>
        </Box>
      )}

      <List sx={{ py: 0 }}>
        {group.suggestions.map((suggestion, index) => {
          const globalIndex = globalStartIndex + index;
          const isSelected = globalIndex === selectedIndex;
          
          return (
            <SuggestionItem
              key={`${suggestion.entity_type}-${suggestion.suggestion}`}
              suggestion={suggestion}
              isSelected={isSelected}
              onClick={() => onSuggestionClick(suggestion)}
              onHover={() => onSuggestionHover?.(suggestion)}
              compact={compact}
            />
          );
        })}
      </List>
    </Box>
  );
};

interface LoadingStateProps {
  compact?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ compact = false }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ p: theme.spacing(compact ? 2 : 3) }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <CircularProgress size={compact ? 16 : 20} thickness={4} />
        <Typography variant={compact ? 'body2' : 'body1'} color="text.secondary">
          Getting suggestions...
        </Typography>
      </Box>
      
      {/* Skeleton items */}
      {[1, 2, 3].map((item) => (
        <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <Skeleton variant="rounded" width={compact ? 24 : 32} height={compact ? 24 : 32} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={compact ? 16 : 20} />
            {!compact && (
              <Skeleton variant="text" width="40%" height={14} />
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

interface EmptyStateProps {
  query: string;
  compact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ query, compact = false }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: theme.spacing(compact ? 3 : 4),
        px: theme.spacing(3),
        textAlign: 'center',
      }}
    >
      <SearchIcon
        sx={{
          fontSize: compact ? '2rem' : '2.5rem',
          color: 'text.disabled',
          mb: 1,
        }}
      />
      <Typography
        variant={compact ? 'body2' : 'body1'}
        color="text.secondary"
        sx={{ fontWeight: 500, mb: 0.5 }}
      >
        No suggestions found
      </Typography>
      {!compact && (
        <Typography variant="caption" color="text.disabled">
          Try a different search term
        </Typography>
      )}
    </Box>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  className,
  query,
  onSuggestionSelect,
  onSuggestionHover,
  getSuggestionsFunction,
  maxSuggestions = 10,
  debounceMs = 200,
  workspaceId,
  showCategories = true,
  compact = false,
}) => {
  const theme = useTheme();
  
  const {
    suggestions,
    groupedSuggestions,
    loading,
    error,
    isVisible,
    selectedIndex,
    getSuggestions,
    selectSuggestion,
    handleKeyDown,
  } = useSearchSuggestions(
    getSuggestionsFunction,
    maxSuggestions,
    debounceMs,
    workspaceId
  );

  // Fetch suggestions when query changes
  useEffect(() => {
    if (query.trim().length >= 2) {
      getSuggestions(query);
    }
  }, [query, getSuggestions]);

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    selectSuggestion(suggestion);
    onSuggestionSelect?.(suggestion);
  };

  const handleSuggestionHover = (suggestion: SearchSuggestion) => {
    onSuggestionHover?.(suggestion);
  };

  // Don't render if not visible or no query
  if (!isVisible || !query.trim() || query.length < 2) {
    return null;
  }

  return (
    <Collapse in={isVisible}>
      <Paper
        className={className}
        sx={{
          mt: 1,
          maxHeight: compact ? 300 : 400,
          overflow: 'auto',
          borderRadius: 3,
          boxShadow: theme.shadows[8],
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(8px)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        {loading && <LoadingState compact={compact} />}

        {!loading && !error && suggestions.length === 0 && (
          <EmptyState query={query} compact={compact} />
        )}

        {!loading && !error && suggestions.length > 0 && (
          <Box>
            {showCategories && groupedSuggestions.length > 1 ? (
              // Grouped view
              groupedSuggestions.map((group, groupIndex) => {
                const globalStartIndex = groupedSuggestions
                  .slice(0, groupIndex)
                  .reduce((acc, g) => acc + g.suggestions.length, 0);
                
                return (
                  <React.Fragment key={group.title}>
                    <SuggestionGroupComponent
                      group={group}
                      selectedIndex={selectedIndex}
                      globalStartIndex={globalStartIndex}
                      onSuggestionClick={handleSuggestionSelect}
                      onSuggestionHover={handleSuggestionHover}
                      compact={compact}
                    />
                    {groupIndex < groupedSuggestions.length - 1 && (
                      <Divider sx={{ my: 1 }} />
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              // Flat view
              <List sx={{ py: 1 }}>
                {suggestions.map((suggestion, index) => (
                  <SuggestionItem
                    key={`${suggestion.entity_type}-${suggestion.suggestion}`}
                    suggestion={suggestion}
                    isSelected={index === selectedIndex}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    onHover={() => handleSuggestionHover(suggestion)}
                    compact={compact}
                  />
                ))}
              </List>
            )}

            {/* Footer with keyboard hints */}
            {!compact && (
              <Box
                sx={{
                  p: 1.5,
                  borderTop: 1,
                  borderColor: 'divider',
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>↑↓</Typography>
                    <Typography variant="caption" color="text.secondary">navigate</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>↵</Typography>
                    <Typography variant="caption" color="text.secondary">select</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>⇥</Typography>
                    <Typography variant="caption" color="text.secondary">use</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Collapse>
  );
};

export default SearchSuggestions;