// =============================================
// ACTIVITY TIMELINE PRESENTER COMPONENT
// =============================================
// Displays entity-specific activity timeline with Material UI styling

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Collapse,
  Skeleton,
  Alert,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Stack,
  Button
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineConnector,
  TimelineDot,
  TimelineContent,
} from '@mui/lab';
import { styled, useTheme } from '@mui/material/styles';
import { useActivityTimeline, UseActivityTimelineProps } from './useActivityTimeline';
import type { EntityActivityTimelineItem, EventType } from '@/types/database';
import { designTokens } from '@/theme/utils';

// =============================================
// STYLED COMPONENTS
// =============================================

const StyledTimelineDot = styled(TimelineDot)(({ theme }) => ({
  borderWidth: 2,
  padding: theme.spacing(0.75),
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
}));

const EventCard = styled(Card)(({ theme }) => ({
  borderRadius: designTokens.borderRadius.md,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  border: theme.palette.mode === 'light' ? 'none' : `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-1px)',
    transition: designTokens.animation.fast,
  },
}));

const DeltaChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.75rem',
  height: '20px',
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
}));

// =============================================
// HELPER COMPONENTS
// =============================================

interface EventIconProps {
  eventType: EventType;
  size?: 'small' | 'medium' | 'large';
}

const EventIcon: React.FC<EventIconProps> = ({ eventType, size = 'medium' }) => {
  const theme = useTheme();
  
  const getIcon = (type: EventType) => {
    const iconMap: Record<string, string> = {
      created: '➕',
      updated: '✏️',
      deleted: '🗑️',
      completed: '✅',
      assigned: '👤',
      moved: '📁',
      status_changed: '🔄',
      archived: '📦',
      restored: '♻️',
      commented: '💬',
      viewed: '👁️',
      login: '🔐',
      search_performed: '🔍'
    };
    return iconMap[type] || '📝';
  };

  const getColor = (type: EventType) => {
    switch (type) {
      case 'created': return theme.palette.success.main;
      case 'completed': return theme.palette.success.main;
      case 'updated': return theme.palette.primary.main;
      case 'deleted': return theme.palette.error.main;
      case 'assigned': return theme.palette.info.main;
      case 'status_changed': return theme.palette.warning.main;
      case 'archived': return theme.palette.text.secondary;
      default: return theme.palette.text.primary;
    }
  };

  return (
    <StyledTimelineDot sx={{ bgcolor: getColor(eventType) }}>
      <Typography fontSize={size === 'small' ? '0.8rem' : '1rem'}>
        {getIcon(eventType)}
      </Typography>
    </StyledTimelineDot>
  );
};

interface EventDetailsProps {
  event: EntityActivityTimelineItem;
  showDeltas: boolean;
  onToggleDetails: (eventId: string) => void;
  isExpanded: boolean;
}

const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  showDeltas,
  onToggleDetails,
  isExpanded
}) => {
  const theme = useTheme();
  const hasDetails = !!(event.old_values || event.new_values || event.delta);

  return (
    <EventCard>
      <CardContent sx={{ pb: hasDetails ? 1 : 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="body1" fontWeight={500} gutterBottom>
              {formatEventTitle(event)}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {event.user_name && (
                <Chip
                  icon={<PersonIcon />}
                  label={event.user_name}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              
              <Chip
                icon={<ScheduleIcon />}
                label={formatEventTime(event.created_at)}
                size="small"
                variant="outlined"
              />

              {event.correlation_id && (
                <Tooltip title={`Correlation ID: ${event.correlation_id}`}>
                  <Chip
                    label="Batch"
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </Box>
          </Box>

          {hasDetails && (
            <IconButton 
              size="small" 
              onClick={() => onToggleDetails(event.id)}
              sx={{ ml: 1 }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>

        {/* Event Changes */}
        <Collapse in={isExpanded && hasDetails}>
          <Divider sx={{ my: 1 }} />
          
          {showDeltas && event.delta && Object.keys(event.delta).length > 0 && (
            <Box mb={2}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Changes:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {Object.entries(event.delta).map(([key, value]) => (
                  <DeltaChip
                    key={key}
                    label={`${key}: ${String(value)}`}
                    color="info"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}

          {event.old_values && Object.keys(event.old_values).length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Previous values:
              </Typography>
              <Box component="code" sx={{
                display: 'block',
                bgcolor: theme.palette.grey[100],
                color: theme.palette.text.primary,
                p: 1,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                border: `1px solid ${theme.palette.divider}`
              }}>
                {JSON.stringify(event.old_values, null, 2)}
              </Box>
            </Box>
          )}

          {event.new_values && Object.keys(event.new_values).length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                New values:
              </Typography>
              <Box component="code" sx={{
                display: 'block',
                bgcolor: theme.palette.success.light + '20',
                color: theme.palette.text.primary,
                p: 1,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                border: `1px solid ${theme.palette.success.main}40`
              }}>
                {JSON.stringify(event.new_values, null, 2)}
              </Box>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </EventCard>
  );
};

// =============================================
// TIMELINE CONTROLS COMPONENT
// =============================================

interface TimelineControlsProps {
  totalEvents: number;
  uniqueUsers: string[];
  dateRange: { start: string; end: string } | null;
  onRefresh: () => void;
  showDeltas: boolean;
  onToggleDeltas: (show: boolean) => void;
  loading: boolean;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  totalEvents,
  uniqueUsers,
  dateRange,
  onRefresh,
  showDeltas,
  onToggleDeltas,
  loading
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2" display="flex" alignItems="center" gap={1}>
          <TrendingUpIcon />
          Activity Timeline
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={loading}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={2}>
          <Chip
            icon={<TrendingUpIcon />}
            label={`${totalEvents} events`}
            color="primary"
            variant="outlined"
            size="small"
          />
          
          <Chip
            icon={<PersonIcon />}
            label={`${uniqueUsers.length} contributors`}
            color="secondary"
            variant="outlined"
            size="small"
          />
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={showDeltas}
              onChange={(e) => onToggleDeltas(e.target.checked)}
              size="small"
            />
          }
          label="Show changes"
          sx={{ ml: 2 }}
        />
      </Box>

      {dateRange && (
        <Typography variant="caption" color="text.secondary">
          Activity from {new Date(dateRange.start).toLocaleDateString()} 
          to {new Date(dateRange.end).toLocaleDateString()}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// =============================================
// MAIN COMPONENT
// =============================================

export interface ActivityTimelineProps extends UseActivityTimelineProps {
  className?: string;
  maxHeight?: number | string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  entityType,
  entityId,
  autoRefresh = true,
  groupByDate = true,
  limit = 100,
  className,
  maxHeight = 600
}) => {
  const [expandedEvents, setExpandedEvents] = React.useState<Set<string>>(new Set());
  
  const {
    timeline,
    groupedTimeline,
    loading,
    error,
    selectedEventTypes,
    setSelectedEventTypes,
    showDeltas,
    setShowDeltas,
    refresh,
    totalEvents,
    uniqueUsers,
    dateRange
  } = useActivityTimeline({
    entityType,
    entityId,
    autoRefresh,
    groupByDate,
    limit
  });

  const handleToggleEventDetails = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  if (loading && timeline.length === 0) {
    return (
      <Box className={className}>
        <Card>
          <CardContent>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
            <Skeleton variant="text" height={40} />
            <Skeleton variant="text" height={40} />
            <Skeleton variant="text" height={40} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={className}>
        <Alert severity="error" action={
          <Button onClick={refresh} size="small">
            Try Again
          </Button>
        }>
          Failed to load activity timeline: {error}
        </Alert>
      </Box>
    );
  }

  if (timeline.length === 0) {
    return (
      <Box className={className}>
        <TimelineControls
          totalEvents={totalEvents}
          uniqueUsers={uniqueUsers}
          dateRange={dateRange}
          onRefresh={refresh}
          showDeltas={showDeltas}
          onToggleDeltas={setShowDeltas}
          loading={loading}
        />
        
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No activity found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This {entityType} has no recorded activity yet.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box className={className}>
      <TimelineControls
        totalEvents={totalEvents}
        uniqueUsers={uniqueUsers}
        dateRange={dateRange}
        onRefresh={refresh}
        showDeltas={showDeltas}
        onToggleDeltas={setShowDeltas}
        loading={loading}
      />

      <Box sx={{ maxHeight, overflow: 'auto' }}>
        {groupByDate ? (
          // Grouped timeline
          groupedTimeline.map((group) => (
            <Box key={group.date} mb={3}>
              <Typography 
                variant="h6" 
                color="primary" 
                gutterBottom 
                sx={{ 
                  position: 'sticky', 
                  top: 0, 
                  bgcolor: 'background.default', 
                  zIndex: 1,
                  py: 1
                }}
              >
                {group.displayDate}
              </Typography>
              
              <Timeline>
                {group.events.map((event, index) => (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent sx={{ flex: 0.2, pt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </Typography>
                    </TimelineOppositeContent>
                    
                    <TimelineSeparator>
                      <EventIcon eventType={event.event_type} />
                      {index < group.events.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    
                    <TimelineContent sx={{ pb: 3 }}>
                      <EventDetails
                        event={event}
                        showDeltas={showDeltas}
                        onToggleDetails={handleToggleEventDetails}
                        isExpanded={expandedEvents.has(event.id)}
                      />
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Box>
          ))
        ) : (
          // Linear timeline
          <Timeline>
            {timeline.map((event, index) => (
              <TimelineItem key={event.id}>
                <TimelineOppositeContent sx={{ flex: 0.2, pt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(event.created_at).toLocaleString()}
                  </Typography>
                </TimelineOppositeContent>
                
                <TimelineSeparator>
                  <EventIcon eventType={event.event_type} />
                  {index < timeline.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                
                <TimelineContent sx={{ pb: 3 }}>
                  <EventDetails
                    event={event}
                    showDeltas={showDeltas}
                    onToggleDetails={handleToggleEventDetails}
                    isExpanded={expandedEvents.has(event.id)}
                  />
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Box>
    </Box>
  );
};

// =============================================
// HELPER FUNCTIONS
// =============================================

function formatEventTitle(event: EntityActivityTimelineItem): string {
  const { event_type, user_name } = event;
  const userName = user_name || 'Someone';
  
  const eventTitleMap: Record<EventType, string> = {
    created: `${userName} created this item`,
    updated: `${userName} made updates`,
    deleted: `${userName} deleted this item`,
    completed: `${userName} marked as complete`,
    assigned: `${userName} was assigned`,
    moved: `${userName} moved this item`,
    status_changed: `${userName} changed the status`,
    archived: `${userName} archived this item`,
    restored: `${userName} restored this item`,
    commented: `${userName} added a comment`,
    viewed: `${userName} viewed this item`,
    login: `${userName} signed in`,
    search_performed: `${userName} performed a search`,
    reopened: `${userName} reopened this item`,
    unassigned: `${userName} was unassigned`,
    reassigned: `${userName} was reassigned`,
    duplicated: `${userName} duplicated this item`,
    merged: `${userName} merged this item`,
    member_added: `${userName} joined`,
    member_removed: `${userName} left`,
    role_changed: `${userName}'s role was changed`,
    unarchived: `${userName} unarchived this item`,
    ownership_transferred: `Ownership transferred to ${userName}`,
    reordered: `${userName} changed the order`,
    member_invited: `${userName} was invited`,
    invitation_accepted: `${userName} accepted invitation`,
    invitation_declined: `${userName} declined invitation`,
    permission_changed: `${userName}'s permissions changed`,
    access_granted: `${userName} was granted access`,
    access_revoked: `${userName}'s access was revoked`,
    logout: `${userName} signed out`,
    login_failed: `${userName} failed to sign in`,
    password_changed: `${userName} changed password`,
    mfa_enabled: `${userName} enabled MFA`,
    mfa_disabled: `${userName} disabled MFA`,
    api_key_created: `${userName} created API key`,
    api_key_revoked: `${userName} revoked API key`,
    suspicious_activity: `Suspicious activity detected for ${userName}`,
    export_generated: `${userName} generated export`,
    import_completed: `${userName} completed import`,
    backup_created: `${userName} created backup`,
    settings_changed: `${userName} changed settings`,
    integration_connected: `${userName} connected integration`,
    integration_disconnected: `${userName} disconnected integration`,
    mentioned: `${userName} was mentioned`,
    watched: `${userName} started watching`,
    unwatched: `${userName} stopped watching`,
    notification_sent: `Notification sent to ${userName}`,
    email_sent: `Email sent to ${userName}`,
    reminder_triggered: `Reminder triggered for ${userName}`
  };
  
  return eventTitleMap[event_type] || `${userName} ${event_type.replace('_', ' ')}`;
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleString();
}

export default ActivityTimeline;