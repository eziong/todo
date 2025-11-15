// =============================================
// PROTECTED ROUTE PRESENTER COMPONENT
// =============================================
// Pure UI component for route protection

'use client';

import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { useProtectedRoute, type UseProtectedRouteOptions } from './useProtectedRoute';
export interface ProtectedRouteProps extends UseProtectedRouteOptions {
  className?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

/**
 * Protected Route Presenter Component
 * Wraps content that requires authentication or authorization
 * 
 * @param props - The protected route component props
 * @returns The protected route component
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  className,
  fallback,
  loadingComponent,
  errorComponent,
  ...options
}) => {
  const {
    loading,
    error,
    isAuthenticated,
    isAuthorized,
  } = useProtectedRoute(options);

  // Show loading state
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          p: 2,
        }}
      >
        <Card
          elevation={0}
          sx={{
            maxWidth: 500,
            width: '100%',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'error.main',
            bgcolor: 'error.50',
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
              <BlockIcon
                sx={{
                  fontSize: 48,
                  color: 'error.main',
                }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'error.dark',
                mb: 2,
              }}
            >
              Access Denied
            </Typography>
            <Typography variant="body1" color="error.dark">
              {error}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Show fallback if not authenticated/authorized
  if (!isAuthenticated || !isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          p: 2,
        }}
      >
        <Card
          elevation={0}
          sx={{
            maxWidth: 500,
            width: '100%',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'warning.main',
            bgcolor: 'warning.50',
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
              <SecurityIcon
                sx={{
                  fontSize: 48,
                  color: 'warning.main',
                }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'warning.dark',
                mb: 2,
              }}
            >
              Authentication Required
            </Typography>
            <Typography variant="body1" color="warning.dark">
              Please sign in to access this page.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Render protected content
  return (
    <Box className={className}>
      {children}
    </Box>
  );
};