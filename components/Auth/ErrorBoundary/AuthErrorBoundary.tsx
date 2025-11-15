// =============================================
// AUTH ERROR BOUNDARY COMPONENT
// =============================================
// Error boundary for authentication-related errors

'use client';

import React, { Component, ReactNode } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

/**
 * Auth Error Boundary Component
 * Catches and handles authentication-related errors gracefully
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Log to external service (Sentry, LogRocket, etc.)
    } else {
      // Development logging
      console.error('Auth Error Boundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 2,
            bgcolor: 'background.default',
          }}
        >
          <Card
            elevation={0}
            sx={{
              maxWidth: 500,
              width: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              bgcolor: 'background.paper',
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              {/* Error Icon */}
              <Box sx={{ mb: 3 }}>
                <ErrorIcon
                  sx={{
                    fontSize: 64,
                    color: 'error.main',
                    opacity: 0.8,
                  }}
                />
              </Box>

              {/* Error Message */}
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 2,
                }}
              >
                Authentication Error
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.6 }}
              >
                Something went wrong with the authentication system. This might be a temporary issue.
              </Typography>

              {/* Error Details */}
              {this.state.errorInfo && process.env.NODE_ENV === 'development' && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    textAlign: 'left',
                    borderRadius: 2,
                    '& .MuiAlert-message': { fontSize: '0.875rem' },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Error Details:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {this.state.errorInfo}
                  </Typography>
                </Alert>
              )}

              {/* Action Buttons */}
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  Try Again
                </Button>

                <Button
                  variant="outlined"
                  onClick={this.handleReload}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  Reload Page
                </Button>
              </Stack>

              {/* Help Text */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 3, display: 'block', lineHeight: 1.4 }}
              >
                If this problem persists, please try clearing your browser cache or contact support.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}