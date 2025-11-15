// =============================================
// ACTIVITY STATS PRESENTER COMPONENT
// =============================================
// Pure UI component for displaying activity statistics with Material UI and macOS aesthetics

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Paper,
  useTheme,
} from '@mui/material';
import type { 
  EventCategory, 
  EventSeverity 
} from '@/types/database';
import { designTokens } from '@/theme/utils';

// =============================================
// INTERFACES
// =============================================

export interface ActivityStatsProps {
  stats: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byCategory: Record<EventCategory, number>;
    bySeverity: Record<EventSeverity, number>;
  };
}

// =============================================
// PRESENTER COMPONENT
// =============================================

export const ActivityStats: React.FC<ActivityStatsProps> = React.memo(({ stats }) => {
  const theme = useTheme();

  const statItems = [
    {
      label: 'Total Activities',
      value: stats.total,
      color: theme.palette.primary.main,
    },
    {
      label: 'Today',
      value: stats.today,
      color: theme.palette.success.main,
    },
    {
      label: 'This Week',
      value: stats.thisWeek,
      color: theme.palette.info.main,
    },
    {
      label: 'This Month',
      value: stats.thisMonth,
      color: theme.palette.secondary.main,
    },
  ];

  const categoryItems = Object.entries(stats.byCategory).map(([category, count]) => ({
    label: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    category: category as EventCategory,
  }));

  const severityItems = Object.entries(stats.bySeverity).map(([severity, count]) => ({
    label: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: count,
    severity: severity as EventSeverity,
  }));

  const getSeverityColor = (severity: EventSeverity): string => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'error': return theme.palette.error.light;
      case 'warning': return theme.palette.warning.main;
      case 'info': return theme.palette.info.main;
      case 'debug': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: designTokens.borderRadius.md }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Activity Overview
      </Typography>
      
      {/* Main Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statItems.map((stat) => (
          <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
            <Card 
              elevation={0}
              sx={{
                textAlign: 'center',
                backgroundColor: `${stat.color}10`,
                border: `1px solid ${stat.color}30`,
                borderRadius: designTokens.borderRadius.sm,
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" fontWeight={700} color={stat.color}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Category and Severity Breakdown */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            By Category
          </Typography>
          <Stack spacing={0.5}>
            {categoryItems.map((item) => (
              item.value > 0 && (
                <Box key={item.category} display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={item.label}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {item.value}
                  </Typography>
                </Box>
              )
            ))}
          </Stack>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            By Severity
          </Typography>
          <Stack spacing={0.5}>
            {severityItems.map((item) => (
              item.value > 0 && (
                <Box key={item.severity} display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={item.label}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.75rem',
                      borderColor: getSeverityColor(item.severity),
                      color: getSeverityColor(item.severity),
                    }}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {item.value}
                  </Typography>
                </Box>
              )
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
});