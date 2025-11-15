// =============================================
// ACTIVITIES LIST PRESENTER COMPONENT
// =============================================
// Pure UI component for displaying activities list with Material UI and macOS aesthetics

import React from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { ActivityFeed } from '@/components/ActivityFeed/ActivityFeed';
import type { ActivityFeedItem } from '@/types/database';
import { designTokens } from '@/theme/utils';

// =============================================
// INTERFACES
// =============================================

export interface ActivitiesListProps {
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

// =============================================
// PRESENTER COMPONENT
// =============================================

export const ActivitiesList: React.FC<ActivitiesListProps> = React.memo(({
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
              borderRadius: designTokens.borderRadius.md,
              textTransform: 'none',
            }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
});