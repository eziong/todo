// =============================================
// ACTIVITY FEED COMPONENT
// =============================================
// Displays recent activity and events in a user-friendly format

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
  Button,
  Alert,
  Skeleton,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CompletedIcon,
  Person as AssignedIcon,
  Edit as UpdatedIcon,
  Delete as DeletedIcon,
  Archive as ArchivedIcon,
  Group as MemberIcon,
  Search as SearchIcon,
  Login as LoginIcon,
  Task as TaskIcon,
  Folder as FolderIcon,
  Business as WorkspaceIcon,
  SwapHoriz as MovedIcon,
  Autorenew as StatusIcon,
  Person,
  Settings,
  Security,
  Link,
  SmartToy,
  Error
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useActivityFeed } from '@/hooks/useActivity';
import type { ActivityFeedItem, EventCategory } from '@/types/database';

// =============================================
// STYLED COMPONENTS
// =============================================

const ActivityItemPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(0.5),
  transition: 'all 0.2s ease-in-out',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1.5),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[2]
  }
}));

const TimeChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.75rem',
  height: 20,
  borderRadius: theme.spacing(2.5),
  fontWeight: 500
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.75rem',
  height: 24,
  borderRadius: theme.spacing(1),
  fontWeight: 500
}));

// =============================================
// ACTIVITY FEED ITEM COMPONENT
// =============================================

interface ActivityFeedItemProps {
  item: ActivityFeedItem;
}

function ActivityFeedItemComponent({ item }: ActivityFeedItemProps): React.ReactElement {
  const getEventIcon = (eventType: string, entityType: string): React.ReactElement => {
    switch (eventType) {
      case 'created':
        return entityType === 'task' ? <TaskIcon /> : entityType === 'section' ? <FolderIcon /> : <WorkspaceIcon />;
      case 'completed':
        return <CompletedIcon color="success" />;
      case 'assigned':
      case 'reassigned':
        return <AssignedIcon color="primary" />;
      case 'moved':
        return <MovedIcon color="action" />;
      case 'status_changed':
        return <StatusIcon color="action" />;
      case 'updated':
        return <UpdatedIcon color="action" />;
      case 'deleted':
        return <DeletedIcon color="error" />;
      case 'archived':
        return <ArchivedIcon color="action" />;
      case 'member_added':
        return <MemberIcon color="primary" />;
      case 'search_performed':
        return <SearchIcon color="action" />;
      case 'login':
        return <LoginIcon color="action" />;
      default:
        return <TaskIcon color="action" />;
    }
  };

  const formatEventDescription = (item: ActivityFeedItem): string => {
    const { event_type, entity_type, description, user_name } = item;
    
    const userName = user_name || 'Someone';
    const entityName = description || `${entity_type}`;

    switch (event_type) {
      case 'created':
        return `${userName} created ${entityName}`;
      case 'completed':
        return `${userName} completed ${entityName}`;
      case 'assigned':
        return `${userName} was assigned to ${entityName}`;
      case 'reassigned':
        return `${entityName} was reassigned`;
      case 'moved':
        return `${userName} moved ${entityName}`;
      case 'status_changed':
        return `${userName} changed status of ${entityName}`;
      case 'updated':
        return `${userName} updated ${entityName}`;
      case 'deleted':
        return `${userName} deleted ${entityName}`;
      case 'archived':
        return `${userName} archived ${entityName}`;
      case 'member_added':
        return `${userName} joined ${item.workspace_name || 'workspace'}`;
      case 'search_performed':
        return `${userName} searched for "${item.context?.query || 'items'}"`;
      case 'login':
        return `${userName} signed in`;
      default:
        return `${userName} ${event_type.replace('_', ' ')} ${entityName}`;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
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
  };

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' | 'success' | 'default' => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'debug':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAvatarColor = (eventType: string): string => {
    switch (eventType) {
      case 'completed':
        return '#4caf50';
      case 'created':
        return '#2196f3';
      case 'assigned':
      case 'reassigned':
        return '#9c27b0';
      case 'updated':
        return '#ff9800';
      case 'deleted':
        return '#f44336';
      case 'archived':
        return '#607d8b';
      default:
        return '#757575';
    }
  };

  return (
    <ActivityItemPaper elevation={0}>
      <ListItem alignItems="flex-start">
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: getAvatarColor(item.event_type), width: 32, height: 32 }}>
            {getEventIcon(item.event_type, item.entity_type)}
          </Avatar>
        </ListItemAvatar>
        
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.primary">
                {formatEventDescription(item)}
              </Typography>
              <TimeChip 
                label={formatTimeAgo(item.created_at)}
                color={getSeverityColor(item.severity)}
                variant="outlined"
                size="small"
              />
            </Box>
          }
          secondary={
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {/* Workspace name */}
              {item.workspace_name && item.entity_type !== 'workspace' && (
                <Typography variant="caption" color="text.secondary">
                  in {item.workspace_name}
                </Typography>
              )}
              
              {/* Status change context */}
              {item.event_type === 'status_changed' && item.context?.new_status && (
                <Box>
                  <StatusChip 
                    label={`${item.context.previous_status} → ${item.context.new_status}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>
              )}
              
              {/* Search results context */}
              {item.event_type === 'search_performed' && item.context?.results_count !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  {item.context.results_count} results found
                  {item.context.execution_time_ms && ` • ${item.context.execution_time_ms}ms`}
                </Typography>
              )}
            </Stack>
          }
        />
      </ListItem>
    </ActivityItemPaper>
  );
}

// =============================================
// ACTIVITY FILTER COMPONENT
// =============================================

interface ActivityFilterProps {
  selectedCategories: EventCategory[];
  onCategoriesChange: (categories: EventCategory[]) => void;
}

function ActivityFilter({ selectedCategories, onCategoriesChange }: ActivityFilterProps): React.ReactElement {
  const categories: { value: EventCategory; label: string; icon: React.ReactNode }[] = [
    { value: 'user_action', label: 'User Actions', icon: <Person /> },
    { value: 'system', label: 'System Events', icon: <Settings /> },
    { value: 'security', label: 'Security', icon: <Security /> },
    { value: 'integration', label: 'Integrations', icon: <Link /> },
    { value: 'automation', label: 'Automation', icon: <SmartToy /> },
    { value: 'error', label: 'Errors', icon: <Error /> }
  ];

  const handleCategoryToggle = (category: EventCategory): void => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {categories.map(({ value, label, icon }) => (
          <Chip
            key={value}
            icon={icon}
            label={label}
            color={selectedCategories.includes(value) ? 'primary' : 'default'}
            variant={selectedCategories.includes(value) ? 'filled' : 'outlined'}
            onClick={() => handleCategoryToggle(value)}
            clickable
            size="small"
            sx={{
              borderRadius: 3,
              fontWeight: 500,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: 1
              }
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

// =============================================
// MAIN ACTIVITY FEED COMPONENT
// =============================================

interface ActivityFeedProps {
  workspaceId?: string;
  className?: string;
  showFilters?: boolean;
  limit?: number;
}

export function ActivityFeed({ 
  workspaceId, 
  className = '',
  showFilters = true,
  limit = 20
}: ActivityFeedProps): React.ReactElement {
  const [selectedCategories, setSelectedCategories] = React.useState<EventCategory[]>([
    'user_action',
    'system'
  ]);

  const {
    activity,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  } = useActivityFeed({
    workspaceId,
    categories: selectedCategories,
    limit,
    autoRefresh: true
  });

  const sortedActivity = useMemo(() => {
    return [...activity].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activity]);

  if (loading && activity.length === 0) {
    return (
      <Box className={className}>
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Paper key={`loading-${index}`} sx={{ p: 2 }}>
              <Box display="flex" alignItems="flex-start" gap={1.5}>
                <Skeleton variant="circular" width={32} height={32} />
                <Box flexGrow={1}>
                  <Skeleton variant="text" width="75%" height={20} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={className} sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={refresh}
              startIcon={<RefreshIcon />}
            >
              Try Again
            </Button>
          }
        >
          <Typography variant="body2" gutterBottom>
            Failed to load activity
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box className={className}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" fontWeight={600}>
            Activity Feed
          </Typography>
          <IconButton
            onClick={refresh}
            size="small"
            disabled={loading}
            sx={{
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'rotate(180deg)' }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Stack>
        
        <Chip 
          label={`${activity.length} events`}
          variant="outlined"
          size="small"
          color="primary"
        />
      </Box>

      {/* Filters */}
      {showFilters && (
        <ActivityFilter
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
        />
      )}

      {/* Activity List */}
      <Box>
        {sortedActivity.length === 0 ? (
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h4" color="text.disabled" sx={{ mb: 1 }}>
              📭
            </Typography>
            <Typography variant="body1" color="text.primary" gutterBottom>
              No recent activity found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activity will appear here as users interact with the workspace
            </Typography>
          </Paper>
        ) : (
          <>
            <List disablePadding>
              {sortedActivity.map((item) => (
                <ActivityFeedItemComponent
                  key={`${item.id}-${item.created_at}`}
                  item={item}
                />
              ))}
            </List>

            {/* Load More Button */}
            {hasMore && (
              <Box sx={{ textAlign: 'center', pt: 2 }}>
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outlined"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={16} /> : undefined}
                  sx={{
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Auto-refresh indicator */}
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        sx={{ mt: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 8,
              height: 8,
              bgcolor: 'success.main',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Auto-updating
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

export default ActivityFeed;