// =============================================
// ACTIVITY DASHBOARD PRESENTER COMPONENT
// =============================================
// Displays comprehensive activity statistics and metrics with Material UI styling

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Skeleton,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Avatar,
  Badge
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  EventNote as EventNoteIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { useActivityDashboard, UseActivityDashboardProps } from './useActivityDashboard';
import type { ActivityPeriodType, EventCategory } from '@/types/database';

// =============================================
// STYLED COMPONENTS
// =============================================

const MetricCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.macOS.borderRadius.large,
  boxShadow: theme.macOS.shadows.card,
  border: theme.palette.mode === 'light' ? 'none' : `1px solid ${theme.palette.divider}`,
  transition: theme.macOS.animation.fast,
  '&:hover': {
    boxShadow: theme.macOS.shadows.medium,
    transform: 'translateY(-2px)',
  },
}));

const StatBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.macOS.borderRadius.medium,
  background: theme.palette.mode === 'light' 
    ? theme.palette.grey[50] 
    : theme.palette.grey[900],
  border: `1px solid ${theme.palette.divider}`,
}));

// =============================================
// HELPER COMPONENTS
// =============================================

interface MetricDisplayProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: number;
    label?: string;
  };
  loading?: boolean;
}

const MetricDisplay: React.FC<MetricDisplayProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  loading = false
}) => {
  const theme = useTheme();

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return <TrendingUpIcon color="success" fontSize="small" />;
      case 'down': return <TrendingDownIcon color="error" fontSize="small" />;
      case 'stable': return <TrendingFlatIcon color="action" fontSize="small" />;
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return theme.palette.success.main;
      case 'down': return theme.palette.error.main;
      case 'stable': return theme.palette.text.secondary;
    }
  };

  if (loading) {
    return (
      <MetricCard>
        <CardContent>
          <Skeleton variant="text" height={20} width="60%" />
          <Skeleton variant="text" height={40} width="80%" />
          <Skeleton variant="text" height={16} width="40%" />
        </CardContent>
      </MetricCard>
    );
  }

  return (
    <MetricCard>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="between" mb={1}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {icon}
        </Box>
        
        <Typography variant="h4" color={color} fontWeight="bold" gutterBottom>
          {value}
        </Typography>
        
        <Box display="flex" alignItems="center" justifyContent="between">
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          
          {trend && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {getTrendIcon(trend.direction)}
              <Typography 
                variant="caption" 
                color={getTrendColor(trend.direction)}
                fontWeight={500}
              >
                {trend.value > 0 && trend.direction === 'up' ? '+' : ''}
                {trend.value}%
                {trend.label && ` ${trend.label}`}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </MetricCard>
  );
};

interface CategoryChartProps {
  data: Array<{ category: string; count: number; percentage: number }>;
  title: string;
  height?: number;
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  title,
  height = 300
}) => {
  const theme = useTheme();
  
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  const chartData = data.map(item => ({
    name: item.category.replace('_', ' '),
    value: item.count,
    percentage: item.percentage
  }));

  return (
    <MetricCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <Box mt={2}>
          {chartData.map((entry, index) => (
            <Box key={entry.name} display="flex" alignItems="center" gap={1} mb={0.5}>
              <Box
                width={12}
                height={12}
                borderRadius="50%"
                bgcolor={COLORS[index % COLORS.length]}
              />
              <Typography variant="caption" flex={1}>
                {entry.name}
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {entry.value} ({entry.percentage.toFixed(1)}%)
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </MetricCard>
  );
};

interface ActivityTimelineChartProps {
  data: Array<{ hour: number; count: number }>;
  title: string;
}

const ActivityTimelineChart: React.FC<ActivityTimelineChartProps> = ({
  data,
  title
}) => {
  const theme = useTheme();
  
  const chartData = data.map(item => ({
    hour: `${item.hour}:00`,
    count: item.count
  }));

  return (
    <MetricCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 12 }}
              stroke={theme.palette.text.secondary}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke={theme.palette.text.secondary}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </MetricCard>
  );
};

interface SecurityAlertsProps {
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
}

const SecurityAlerts: React.FC<SecurityAlertsProps> = ({ alerts }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon color="error" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'info': return <InfoIcon color="info" />;
      default: return <CheckCircleIcon color="success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'success';
    }
  };

  return (
    <MetricCard>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">
            Security Alerts
          </Typography>
          <Badge badgeContent={alerts.length} color="error">
            <Box />
          </Badge>
        </Box>
        
        {alerts.length === 0 ? (
          <Box textAlign="center" py={2}>
            <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No security alerts
            </Typography>
          </Box>
        ) : (
          <List dense>
            {alerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem>
                  <ListItemIcon>
                    {getSeverityIcon(alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.message}
                    secondary={`${alert.type} • ${new Date(alert.timestamp).toLocaleString()}`}
                  />
                  <Chip
                    label={alert.severity}
                    color={getSeverityColor(alert.severity) as any}
                    size="small"
                  />
                </ListItem>
                {index < alerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </MetricCard>
  );
};

// =============================================
// DASHBOARD CONTROLS
// =============================================

interface DashboardControlsProps {
  periodType: ActivityPeriodType;
  setPeriodType: (period: ActivityPeriodType) => void;
  days: number;
  setDays: (days: number) => void;
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
  isRealTime: boolean;
}

const DashboardControls: React.FC<DashboardControlsProps> = ({
  periodType,
  setPeriodType,
  days,
  setDays,
  onRefresh,
  loading,
  lastUpdated,
  isRealTime
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Box display="flex" justifyContent="between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <AnalyticsIcon color="primary" />
          <Typography variant="h5" component="h1">
            Activity Dashboard
          </Typography>
          {isRealTime && (
            <Chip 
              icon={<SpeedIcon />}
              label="Real-time" 
              color="success" 
              size="small" 
              variant="outlined"
            />
          )}
        </Box>

        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={periodType}
              label="Period"
              onChange={(e) => setPeriodType(e.target.value as ActivityPeriodType)}
            >
              <MenuItem value="hour">Hourly</MenuItem>
              <MenuItem value="day">Daily</MenuItem>
              <MenuItem value="week">Weekly</MenuItem>
              <MenuItem value="month">Monthly</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Days</InputLabel>
            <Select
              value={days}
              label="Days"
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={7}>7</MenuItem>
              <MenuItem value={14}>14</MenuItem>
              <MenuItem value={30}>30</MenuItem>
              <MenuItem value={90}>90</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {lastUpdated && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Last updated: {lastUpdated.toLocaleString()}
        </Typography>
      )}

      {loading && <LinearProgress sx={{ mt: 1 }} />}
    </CardContent>
  </Card>
);

// =============================================
// MAIN COMPONENT
// =============================================

export interface ActivityDashboardProps extends UseActivityDashboardProps {
  className?: string;
}

export const ActivityDashboard: React.FC<ActivityDashboardProps> = ({
  workspaceId,
  userId,
  periodType: initialPeriodType = 'day',
  days: initialDays = 7,
  autoRefresh = true,
  className
}) => {
  const {
    metrics,
    securitySummary,
    loading,
    error,
    periodType,
    setPeriodType,
    days,
    setDays,
    refresh,
    lastUpdated,
    isRealTime
  } = useActivityDashboard({
    workspaceId,
    userId,
    periodType: initialPeriodType,
    days: initialDays,
    autoRefresh
  });

  if (error) {
    return (
      <Box className={className}>
        <Alert 
          severity="error" 
          action={
            <Button onClick={refresh} size="small">
              Try Again
            </Button>
          }
        >
          Failed to load dashboard: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box className={className}>
      <DashboardControls
        periodType={periodType}
        setPeriodType={setPeriodType}
        days={days}
        setDays={setDays}
        onRefresh={refresh}
        loading={loading}
        lastUpdated={lastUpdated}
        isRealTime={isRealTime}
      />

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricDisplay
            title="Total Events"
            value={metrics?.totalEvents ?? 0}
            subtitle={`${metrics?.averageEventsPerDay.toFixed(1) ?? 0}/day avg`}
            icon={<EventNoteIcon color="primary" />}
            color="primary"
            trend={metrics?.trends && {
              direction: metrics.trends.growthRate > 0 ? 'up' : metrics.trends.growthRate < 0 ? 'down' : 'stable',
              value: Math.abs(metrics.trends.growthRate),
              label: 'vs prev period'
            }}
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricDisplay
            title="Today's Activity"
            value={metrics?.eventsToday ?? 0}
            subtitle="events today"
            icon={<ScheduleIcon color="info" />}
            color="info"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricDisplay
            title="Active Users"
            value={metrics?.userActivity.activeUsers ?? 0}
            subtitle={`${metrics?.userActivity.totalLogins ?? 0} logins`}
            icon={<PeopleIcon color="success" />}
            color="success"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricDisplay
            title="Security Events"
            value={securitySummary?.totalEvents ?? 0}
            subtitle={`${securitySummary?.criticalEvents ?? 0} critical`}
            icon={<SecurityIcon color="warning" />}
            color={securitySummary?.criticalEvents ? 'error' : 'success'}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts and Analysis */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          {metrics?.topCategories && (
            <CategoryChart
              data={metrics.topCategories}
              title="Activity by Category"
              height={300}
            />
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          {metrics?.trends.peakHours && (
            <ActivityTimelineChart
              data={metrics.trends.peakHours}
              title="Peak Activity Hours"
            />
          )}
        </Grid>
      </Grid>

      {/* Top Event Types */}
      {metrics?.topEventTypes && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12}>
            <MetricCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Event Types
                </Typography>
                
                <Grid container spacing={2}>
                  {metrics.topEventTypes.slice(0, 8).map((event, index) => (
                    <Grid item xs={6} sm={4} md={3} key={event.eventType}>
                      <StatBox>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {event.eventType.replace('_', ' ')}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {event.count}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.percentage.toFixed(1)}%
                        </Typography>
                      </StatBox>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>
      )}

      {/* Security Alerts */}
      {securitySummary && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <SecurityAlerts alerts={securitySummary.recentAlerts} />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <MetricCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Summary
                </Typography>
                
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="between" alignItems="center">
                    <Typography variant="body2">Failed Logins</Typography>
                    <Typography variant="h6" color="error">
                      {securitySummary.failedLogins}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="between" alignItems="center">
                    <Typography variant="body2">Suspicious Activity</Typography>
                    <Typography variant="h6" color="warning">
                      {securitySummary.suspiciousActivity}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="between" alignItems="center">
                    <Typography variant="body2">Critical Events</Typography>
                    <Typography variant="h6" color="error">
                      {securitySummary.criticalEvents}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ActivityDashboard;