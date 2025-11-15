// =============================================
// TEST AUTH PAGE
// =============================================
// Simple page to test authentication integration

'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuthContext, ProtectedRoute, UserProfile } from '@/components/Auth';
import { useRouter } from 'next/navigation';

/**
 * Test Auth Page Component
 * Simple page to test authentication functionality
 */
export default function TestAuthPage(): React.ReactElement {
  const { user, loading, error, signOut } = useAuthContext();
  const router = useRouter();

  const handleLogin = (): void => {
    router.push('/login');
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Loading authentication...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%)',
        padding: 2,
      }}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: 800,
          width: '100%',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          bgcolor: 'background.paper',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 3,
              textAlign: 'center',
            }}
          >
            Authentication Test
          </Typography>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Authentication Status */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon />
                  Authentication Status
                </Typography>
                
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip
                    label={user ? 'Authenticated' : 'Not Authenticated'}
                    color={user ? 'success' : 'default'}
                    variant={user ? 'filled' : 'outlined'}
                  />
                  {loading && <Chip label="Loading" color="info" />}
                </Stack>

                {user ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>User ID:</strong> {user.id}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Name:</strong> {user.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {user.email}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Timezone:</strong> {user.timezone}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Last Active:</strong> {user.last_active_at ? new Date(user.last_active_at).toLocaleString() : 'Unknown'}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Please sign in to view user details
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
              {user ? (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  disabled={loading}
                  sx={{
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<LoginIcon />}
                  onClick={handleLogin}
                  disabled={loading}
                  sx={{
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  Sign In
                </Button>
              )}

              <Button
                variant="outlined"
                onClick={() => router.push('/')}
                sx={{
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Back to Home
              </Button>
            </Stack>

            {/* Protected Content Test */}
            <ProtectedRoute
              requireAuth={true}
              fallback={
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Sign in to view protected content below
                </Alert>
              }
            >
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Protected Content
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    ✅ You can see this content because you are authenticated!
                  </Typography>
                </CardContent>
              </Card>
            </ProtectedRoute>

            {/* User Profile Component Test */}
            {user && (
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    User Profile Component
                  </Typography>
                  <UserProfile variant="compact" showPreferences={false} />
                </CardContent>
              </Card>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}