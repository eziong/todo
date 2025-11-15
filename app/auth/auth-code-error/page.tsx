// =============================================
// AUTH CODE ERROR PAGE
// =============================================
// Displays error when OAuth callback fails

'use client';

import React from 'react';
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
  Home as HomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

/**
 * Auth Code Error Page
 * Displayed when OAuth callback fails or encounters an error
 */
export default function AuthCodeError(): React.ReactElement {
  const router = useRouter();

  const handleGoHome = (): void => {
    router.push('/');
  };

  const handleTryAgain = (): void => {
    router.push('/login');
  };

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
            sx={{ mb: 4, lineHeight: 1.6 }}
          >
            Sorry, we encountered an error while trying to sign you in. This could be due to:
          </Typography>

          <Alert
            severity="info"
            sx={{
              mb: 4,
              textAlign: 'left',
              borderRadius: 2,
              '& .MuiAlert-message': { fontSize: '0.875rem' },
            }}
          >
            <Stack spacing={1}>
              <Typography variant="body2">
                • The authentication request expired or was invalid
              </Typography>
              <Typography variant="body2">
                • A temporary issue with the authentication service
              </Typography>
              <Typography variant="body2">
                • Network connectivity problems
              </Typography>
            </Stack>
          </Alert>

          {/* Action Buttons */}
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleTryAgain}
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
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
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
              Go Home
            </Button>
          </Stack>

          {/* Help Text */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 3, display: 'block', lineHeight: 1.4 }}
          >
            If this problem persists, please try refreshing the page or contact support.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}