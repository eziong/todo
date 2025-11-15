// =============================================
// USER MENU PRESENTER COMPONENT
// =============================================
// Pure UI component for user menu and profile dropdown

'use client';

import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useUserMenu } from './useUserMenu';
export interface UserMenuProps {
  className?: string;
  showFullProfile?: boolean;
  variant?: 'button' | 'avatar' | 'compact';
}

/**
 * User Menu Presenter Component
 * Displays user profile information and menu options
 * 
 * @param props - The user menu component props
 * @returns The user menu component
 */
export const UserMenu: React.FC<UserMenuProps> = ({
  className,
  showFullProfile = false,
  variant = 'avatar',
}) => {
  const {
    user,
    loading,
    error,
    isMenuOpen,
    anchorEl,
    handleMenuOpen,
    handleMenuClose,
    handleSignOut,
    handleProfileClick,
    clearError,
  } = useUserMenu();

  // If no user, don't render anything
  if (!user) {
    return null;
  }

  const userInitials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email[0].toUpperCase();

  const renderTrigger = (): React.ReactElement => {
    switch (variant) {
      case 'button':
        return (
          <Button
            onClick={handleMenuOpen}
            startIcon={
              <Avatar
                src={user.avatar_url}
                sx={{ width: 24, height: 24 }}
              >
                {userInitials}
              </Avatar>
            }
            sx={{
              textTransform: 'none',
              color: 'text.primary',
              borderRadius: 2,
              px: 2,
              py: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            {user.name || user.email}
          </Button>
        );

      case 'compact':
        return (
          <Tooltip title={`${user.name || user.email} - Click for menu`}>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Avatar
                src={user.avatar_url}
                sx={{ width: 32, height: 32 }}
              >
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>
        );

      case 'avatar':
      default:
        return (
          <Tooltip title={`${user.name || user.email} - Click for menu`}>
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                p: 0,
                '&:hover': {
                  '& .MuiAvatar-root': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s ease-in-out',
                  },
                },
              }}
            >
              <Avatar
                src={user.avatar_url}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  transition: 'transform 0.2s ease-in-out',
                }}
              >
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>
        );
    }
  };

  return (
    <Box className={className}>
      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 1, borderRadius: 2 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {/* Trigger Element */}
      {loading ? (
        <CircularProgress size={variant === 'compact' ? 24 : 32} />
      ) : (
        renderTrigger()
      )}

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          mt: 1,
          '& .MuiPaper-root': {
            borderRadius: 2,
            minWidth: 200,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {/* User Info Header */}
        {showFullProfile && (
          <>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={user.avatar_url}
                  sx={{ width: 48, height: 48 }}
                >
                  {userInitials}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.name || 'Unknown User'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Divider />
          </>
        )}

        {/* Menu Items */}
        <MenuItem
          onClick={handleProfileClick}
          sx={{
            py: 1.5,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Profile</Typography>
        </MenuItem>

        <MenuItem
          onClick={handleMenuClose}
          sx={{
            py: 1.5,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Settings</Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={handleSignOut}
          disabled={loading}
          sx={{
            py: 1.5,
            color: 'error.main',
            '&:hover': {
              bgcolor: 'error.50',
              color: 'error.dark',
            },
          }}
        >
          <ListItemIcon>
            {loading ? (
              <CircularProgress size={16} color="error" />
            ) : (
              <LogoutIcon fontSize="small" sx={{ color: 'inherit' }} />
            )}
          </ListItemIcon>
          <Typography variant="body2">
            {loading ? 'Signing out...' : 'Sign Out'}
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};