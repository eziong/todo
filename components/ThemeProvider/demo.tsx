'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Stack,
  Chip 
} from '@mui/material';
import { ThemeToggle } from './ThemeToggle/ThemeToggle';
import { designTokens } from '@/theme/utils';
import { useTheme } from '@mui/material';

/**
 * Demo component to showcase the enhanced theme system
 * This file can be removed after testing
 */
export const ThemeDemo: React.FC = () => {
  const theme = useTheme();
  const mode = theme.palette.mode;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h2">Theme System Demo</Typography>
        <ThemeToggle showSystemIndicator />
      </Stack>

      {/* Current Theme Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Current Theme: {mode}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This demonstrates the enhanced macOS-style theme system with full dark mode support.
          </Typography>
        </CardContent>
      </Card>

      {/* Typography Showcase */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Typography Scale</Typography>
          <Typography variant="h1">Large Title (h1)</Typography>
          <Typography variant="h2">Title 1 (h2)</Typography>
          <Typography variant="h3">Title 2 (h3)</Typography>
          <Typography variant="h4">Title 3 (h4)</Typography>
          <Typography variant="h5">Headline (h5)</Typography>
          <Typography variant="h6">Body Bold (h6)</Typography>
          <Typography variant="body1">Body Regular (body1)</Typography>
          <Typography variant="body2">Callout (body2)</Typography>
          <Typography variant="subtitle1">Subheadline (subtitle1)</Typography>
          <Typography variant="subtitle2">Footnote (subtitle2)</Typography>
          <Typography variant="caption">Caption 1 (caption)</Typography>
          <Typography variant="overline">Caption 2 (overline)</Typography>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Button Variants</Typography>
          <Stack direction="row" spacing={2} mb={2}>
            <Button variant="contained">Contained</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text</Button>
          </Stack>
          <Stack direction="row" spacing={2} mb={2}>
            <Button variant="contained" size="small">Small</Button>
            <Button variant="contained" size="medium">Medium</Button>
            <Button variant="contained" size="large">Large</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Workspace Colors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Workspace Colors</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {Object.values(designTokens.colors.taskPriority).map((color, index) => (
              <Chip
                key={color}
                label={`Workspace ${index + 1}`}
                sx={{
                  backgroundColor: color,
                  color: 'white',
                  fontWeight: 500,
                }}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Task Status Colors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Task Status Colors</Typography>
          <Stack direction="row" spacing={2}>
            <Chip 
              label="Todo" 
              sx={{ backgroundColor: designTokens.colors.taskStatus.todo, color: 'white' }} 
            />
            <Chip 
              label="In Progress" 
              sx={{ backgroundColor: designTokens.colors.taskStatus.in_progress, color: 'white' }} 
            />
            <Chip 
              label="Completed" 
              sx={{ backgroundColor: designTokens.colors.taskStatus.completed, color: 'white' }} 
            />
            <Chip 
              label="Archived" 
              sx={{ backgroundColor: designTokens.colors.taskStatus.cancelled, color: 'white' }} 
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Task Priority Colors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Task Priority Colors</Typography>
          <Stack direction="row" spacing={2}>
            <Chip 
              label="Low" 
              sx={{ backgroundColor: designTokens.colors.taskPriority.low, color: 'white' }} 
            />
            <Chip 
              label="Medium" 
              sx={{ backgroundColor: designTokens.colors.taskPriority.medium, color: 'white' }} 
            />
            <Chip 
              label="High" 
              sx={{ backgroundColor: designTokens.colors.taskPriority.high, color: 'white' }} 
            />
            <Chip 
              label="Urgent" 
              sx={{ backgroundColor: designTokens.colors.taskPriority.urgent, color: 'white' }} 
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Card Variants */}
      <Box>
        <Typography variant="h5" gutterBottom>Card Variants</Typography>
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6">Default Card</Typography>
              <Typography variant="body2" color="text.secondary">
                Standard card with default styling
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <Typography variant="h6">Task Card</Typography>
            <Typography variant="body2" color="text.secondary">
              Task-specific card with hover effects
            </Typography>
          </Card>
          <Card>
            <Typography variant="h6">Workspace Card</Typography>
            <Typography variant="body2" color="text.secondary">
              Workspace-specific card with rounded corners
            </Typography>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
};

export default ThemeDemo;