// =============================================
// USER PROFILE PRESENTER COMPONENT
// =============================================
// Pure UI component for user profile management

'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  Alert,
  Stack,
  Avatar,
  IconButton,
  FormControl,
  FormLabel,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Notifications as NotificationIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useUserProfile } from './useUserProfile';
import type { BaseComponentProps } from '@/types';

export interface UserProfileProps extends BaseComponentProps {
  variant?: 'full' | 'compact';
  showPreferences?: boolean;
}

/**
 * User Profile Presenter Component
 * Displays and manages user profile information and preferences
 * 
 * @param props - The user profile component props
 * @returns The user profile component
 */
export const UserProfile: React.FC<UserProfileProps> = ({
  className,
  variant = 'full',
  showPreferences = true,
}) => {
  const {
    user,
    formData,
    loading,
    saving,
    error,
    isDirty,
    validationErrors,
    updateFormData,
    updatePreference,
    handleSave,
    handleReset,
    clearError,
  } = useUserProfile();

  if (loading && !user) {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading profile...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box className={className}>
        <Alert severity="error">
          No user data available. Please sign in again.
        </Alert>
      </Box>
    );
  }

  const userInitials = formData.name
    ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : formData.email[0].toUpperCase();

  return (
    <Box className={className}>
      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Basic Profile Information */}
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'visible',
          }}
        >
          <CardHeader
            avatar={<PersonIcon color="primary" />}
            title={
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Profile Information
              </Typography>
            }
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={3}>
              {/* Avatar Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={formData.avatar_url}
                  sx={{
                    width: variant === 'compact' ? 60 : 80,
                    height: variant === 'compact' ? 60 : 80,
                    fontSize: variant === 'compact' ? '1.5rem' : '2rem',
                    bgcolor: 'primary.main',
                  }}
                >
                  {userInitials}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formData.name || 'Unknown User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                  disabled={loading || saving}
                >
                  <EditIcon />
                </IconButton>
              </Box>

              {/* Basic Information Form */}
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  disabled={loading || saving}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  disabled // Email updates require special handling
                  helperText="Email updates require email verification"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 600 }}>
                    Timezone
                  </FormLabel>
                  <Select
                    value={formData.timezone}
                    onChange={(e) => updateFormData('timezone', e.target.value)}
                    disabled={loading || saving}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                    <MenuItem value="Asia/Seoul">Seoul</MenuItem>
                    <MenuItem value="Asia/Tokyo">Tokyo</MenuItem>
                    <MenuItem value="Europe/London">London</MenuItem>
                    <MenuItem value="Europe/Berlin">Berlin</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        {showPreferences && (
          <>
            {/* UI Preferences */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
              }}
            >
              <CardHeader
                avatar={<PaletteIcon color="primary" />}
                title={
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Interface Preferences
                  </Typography>
                }
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ mb: 1, fontWeight: 600 }}>
                      Theme
                    </FormLabel>
                    <Select
                      value={formData.preferences.theme}
                      onChange={(e) => updatePreference('theme', e.target.value)}
                      disabled={loading || saving}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="auto">Auto (System)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <FormLabel sx={{ mb: 1, fontWeight: 600 }}>
                      Default View
                    </FormLabel>
                    <Select
                      value={formData.preferences.ui?.default_view || 'list'}
                      onChange={(e) => updatePreference('ui.default_view', e.target.value)}
                      disabled={loading || saving}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="list">List View</MenuItem>
                      <MenuItem value="board">Board View</MenuItem>
                      <MenuItem value="calendar">Calendar View</MenuItem>
                    </Select>
                  </FormControl>

                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.preferences.ui?.compact_mode || false}
                          onChange={(e) => updatePreference('ui.compact_mode', e.target.checked)}
                          disabled={loading || saving}
                        />
                      }
                      label="Compact mode"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.preferences.ui?.show_completed_tasks !== false}
                          onChange={(e) => updatePreference('ui.show_completed_tasks', e.target.checked)}
                          disabled={loading || saving}
                        />
                      }
                      label="Show completed tasks"
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
              }}
            >
              <CardHeader
                avatar={<NotificationIcon color="primary" />}
                title={
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Notification Preferences
                  </Typography>
                }
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.preferences.notifications?.email !== false}
                        onChange={(e) => updatePreference('notifications.email', e.target.checked)}
                        disabled={loading || saving}
                      />
                    }
                    label="Email notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.preferences.notifications?.push !== false}
                        onChange={(e) => updatePreference('notifications.push', e.target.checked)}
                        disabled={loading || saving}
                      />
                    }
                    label="Push notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.preferences.notifications?.task_assignments !== false}
                        onChange={(e) => updatePreference('notifications.task_assignments', e.target.checked)}
                        disabled={loading || saving}
                      />
                    }
                    label="Task assignment notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.preferences.notifications?.due_date_reminders !== false}
                        onChange={(e) => updatePreference('notifications.due_date_reminders', e.target.checked)}
                        disabled={loading || saving}
                      />
                    }
                    label="Due date reminders"
                  />
                </Stack>
              </CardContent>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            disabled={loading || saving || !isDirty}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            Reset
          </Button>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading || saving || !isDirty}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};