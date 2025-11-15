// =============================================
// BREADCRUMB NAVIGATION PRESENTER COMPONENT
// =============================================
// Pure functional component for breadcrumb navigation with Material UI design

import React from 'react';
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useBreadcrumbNavigation } from './useBreadcrumbNavigation';
import type { BaseComponentProps } from '@/types';

// =============================================
// TYPES
// =============================================

export interface BreadcrumbNavigationProps extends BaseComponentProps {
  showBackButton?: boolean;
  showHomeButton?: boolean;
  maxItems?: number;
}

// =============================================
// PRESENTER COMPONENT
// =============================================

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  className,
  showBackButton = true,
  showHomeButton = false,
  maxItems = 8,
}) => {
  const theme = useTheme();
  const {
    breadcrumbs,
    currentPage,
    loading,
    error,
    navigateTo,
    goBack,
  } = useBreadcrumbNavigation();

  if (loading) {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1,
          px: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1,
          px: 2,
        }}
      >
        <Typography variant="body2" color="error">
          Navigation error
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        px: 2,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Back button */}
      {showBackButton && (
        <IconButton
          size="small"
          onClick={goBack}
          sx={{
            mr: 1,
            width: 32,
            height: 32,
            borderRadius: theme.macOS.borderRadius.medium,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      )}

      {/* Home button */}
      {showHomeButton && (
        <IconButton
          size="small"
          onClick={() => navigateTo('/dashboard')}
          sx={{
            mr: 1,
            width: 32,
            height: 32,
            borderRadius: theme.macOS.borderRadius.medium,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <HomeIcon fontSize="small" />
        </IconButton>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        maxItems={maxItems}
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.disabled',
          },
        }}
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          if (isLast || breadcrumb.active) {
            return (
              <Typography
                key={breadcrumb.href}
                variant="body2"
                color="text.primary"
                fontWeight={500}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {breadcrumb.label}
              </Typography>
            );
          }

          return (
            <Link
              key={breadcrumb.href}
              component="button"
              variant="body2"
              color="text.secondary"
              onClick={() => navigateTo(breadcrumb.href)}
              sx={{
                textDecoration: 'none',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                padding: 0,
                fontFamily: 'inherit',
                fontSize: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                borderRadius: theme.macOS.borderRadius.small,
                px: 0.5,
                py: 0.25,
                transition: theme.transitions.create(['color', 'background-color'], {
                  duration: theme.transitions.duration.short,
                }),
                '&:hover': {
                  color: 'text.primary',
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  textDecoration: 'none',
                },
                '&:focus': {
                  outline: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                  outlineOffset: 1,
                },
              }}
            >
              {breadcrumb.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};