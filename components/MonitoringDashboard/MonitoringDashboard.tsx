'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Speed,
  Memory,
  Storage,
  NetworkWifi,
  ExpandMore,
  ExpandLess,
  Refresh,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

interface SystemMetrics {
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  health: {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    authentication: 'healthy' | 'warning' | 'error';
    external: 'healthy' | 'warning' | 'error';
  };
  errors: Array<{
    id: string;
    timestamp: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    count: number;
  }>;
  webVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
}

interface MonitoringDashboardProps {
  enabled?: boolean;
  refreshInterval?: number;
  showErrors?: boolean;
  showPerformance?: boolean;
  showHealth?: boolean;
  compact?: boolean;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  enabled = true,
  refreshInterval = 30000, // 30 seconds
  showErrors = true,
  showPerformance = true,
  showHealth = true,
  compact = false
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState({
    errors: false,
    performance: false,
    health: false
  });

  const fetchMetrics = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch('/api/monitoring/metrics');
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      console.error('Monitoring metrics fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Initial fetch and interval setup
  useEffect(() => {
    if (!enabled) return;

    fetchMetrics();

    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, fetchMetrics, refreshInterval]);

  const handleToggleExpanded = (section: keyof typeof expanded) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <Error />;
      default: return <Info />;
    }
  };

  const formatMetric = (value: number, unit: string, decimals: number = 1) => {
    return `${value.toFixed(decimals)}${unit}`;
  };

  const getPerformanceRating = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  };

  const getWebVitalsColor = (metric: string, value: number) => {
    const thresholds = {
      lcp: [2500, 4000], // ms
      fid: [100, 300], // ms
      cls: [0.1, 0.25], // score
      fcp: [1800, 3000], // ms
      ttfb: [800, 1800] // ms
    };

    const rating = getPerformanceRating(value, thresholds[metric as keyof typeof thresholds]);
    return rating === 'good' ? 'success' : rating === 'needs-improvement' ? 'warning' : 'error';
  };

  if (!enabled) {
    return null;
  }

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Speed color="primary" />
            <Typography variant="h6">System Monitoring</Typography>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Alert 
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchMetrics}>
                Retry
              </Button>
            }
          >
            {error || 'Failed to load monitoring data'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Speed color="primary" />
            <Typography variant="h6">System Monitoring</Typography>
          </Box>
          <Tooltip title="Refresh metrics">
            <IconButton size="small" onClick={fetchMetrics}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {/* System Health */}
          {showHealth && (
            <Grid item xs={12} md={compact ? 12 : 6}>
              <Box sx={{ mb: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer' 
                  }}
                  onClick={() => handleToggleExpanded('health')}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    System Health
                  </Typography>
                  {expanded.health ? <ExpandLess /> : <ExpandMore />}
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {Object.entries(metrics.health).map(([service, status]) => (
                    <Chip
                      key={service}
                      icon={getHealthIcon(status)}
                      label={service.charAt(0).toUpperCase() + service.slice(1)}
                      color={getHealthColor(status) as any}
                      size="small"
                      variant={status === 'healthy' ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>

                <Collapse in={expanded.health}>
                  <List dense sx={{ mt: 1 }}>
                    {Object.entries(metrics.health).map(([service, status]) => (
                      <ListItem key={service}>
                        <ListItemIcon>
                          {getHealthIcon(status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={service.charAt(0).toUpperCase() + service.slice(1)}
                          secondary={`Status: ${status}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            </Grid>
          )}

          {/* Performance Metrics */}
          {showPerformance && (
            <Grid item xs={12} md={compact ? 12 : 6}>
              <Box sx={{ mb: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer' 
                  }}
                  onClick={() => handleToggleExpanded('performance')}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Performance
                  </Typography>
                  {expanded.performance ? <ExpandLess /> : <ExpandMore />}
                </Box>

                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Response Time
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatMetric(metrics.performance.responseTime, 'ms')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Error Rate
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600,
                        color: metrics.performance.errorRate > 5 ? 'error.main' : 'text.primary'
                      }}
                    >
                      {formatMetric(metrics.performance.errorRate, '%')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Throughput
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatMetric(metrics.performance.throughput, ' req/s')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Uptime
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatMetric(metrics.performance.uptime, '%', 2)}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Web Vitals */}
                <Collapse in={expanded.performance}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Web Vitals
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(metrics.webVitals).map(([metric, value]) => (
                      <Grid item xs={6} sm={4} key={metric}>
                        <Box sx={{ textAlign: 'center', p: 1 }}>
                          <Chip
                            label={metric.toUpperCase()}
                            size="small"
                            color={getWebVitalsColor(metric, value) as any}
                          />
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {metric.includes('cl') ? 
                              value.toFixed(3) : 
                              `${Math.round(value)}ms`
                            }
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Collapse>
              </Box>
            </Grid>
          )}

          {/* Recent Errors */}
          {showErrors && metrics.errors.length > 0 && (
            <Grid item xs={12}>
              <Box>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer' 
                  }}
                  onClick={() => handleToggleExpanded('errors')}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Recent Errors ({metrics.errors.length})
                  </Typography>
                  {expanded.errors ? <ExpandLess /> : <ExpandMore />}
                </Box>

                <Collapse in={expanded.errors}>
                  <List dense sx={{ mt: 1 }}>
                    {metrics.errors.slice(0, 5).map((error) => (
                      <ListItem key={error.id}>
                        <ListItemIcon>
                          <Error 
                            color={
                              error.severity === 'critical' ? 'error' :
                              error.severity === 'high' ? 'warning' : 'action'
                            } 
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={error.message}
                          secondary={`${error.timestamp} • Count: ${error.count} • Severity: ${error.severity}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};