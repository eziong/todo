// =============================================
// LOGIN PRESENTER COMPONENT
// =============================================
// Pure UI component for login functionality

'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  TextField,
  Typography,
  Alert,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useLogin } from './useLogin';
export interface LoginProps {
  className?: string;
  showEmailLogin?: boolean;
  onToggleSignUp?: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * Login Presenter Component
 * Displays login form with Google OAuth and optional email/password
 * 
 * @param props - The login component props
 * @returns The login component
 */
export const Login: React.FC<LoginProps> = React.memo(({
  className,
  showEmailLogin = false,
  onToggleSignUp,
  title = 'Welcome Back',
  subtitle = 'Sign in to your account to continue',
}) => {
  const {
    // Authentication state
    loading,
    error,
    
    // Form state
    email,
    password,
    showPassword,
    formErrors,
    
    // Form actions
    setEmail,
    setPassword,
    toggleShowPassword,
    
    // Authentication actions
    handleGoogleSignIn,
    handleEmailSignIn,
    clearError,
  } = useLogin();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (showEmailLogin) {
      await handleEmailSignIn();
    }
  };

  return (
    <Box className={className} sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      p: 3,
    }}>
      <Card sx={{ 
        maxWidth: 400, 
        width: '100%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        borderRadius: 2,
      }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              {title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Google Sign In */}
            <Button
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ ml: 1 }} />
              ) : (
                'Continue with Google'
              )}
            </Button>

            {/* Divider */}
            {showEmailLogin && (
              <Divider>
                <Typography variant="body2" color="text.secondary">
                  or
                </Typography>
              </Divider>
            )}

            {/* Email/Password Form */}
            {showEmailLogin && (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={toggleShowPassword}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      }
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || !email || !password}
                    sx={{
                      py: 1.5,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      mt: 1,
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Sign Up Link */}
            {onToggleSignUp && (
              <Box sx={{ textAlign: 'center', pt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Don&apos;t have an account?{' '}
                  <Button
                    variant="text"
                    onClick={onToggleSignUp}
                    disabled={loading}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      minWidth: 'auto',
                      p: 0,
                      ml: 0.5,
                    }}
                  >
                    Sign up
                  </Button>
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
});