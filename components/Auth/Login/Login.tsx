// =============================================
// LOGIN PRESENTER COMPONENT
// =============================================
// Pure UI component for login functionality

'use client';

import React, { useState } from 'react';
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
import type { BaseComponentProps } from '@/types';

export interface LoginProps extends BaseComponentProps {
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
export const Login: React.FC<LoginProps> = ({
  className,
  showEmailLogin = false,
  onToggleSignUp,
  title = 'Welcome Back',
  subtitle = 'Sign in to your account to continue',
}) => {
  const {
    loading,
    error,
    handleGoogleSignIn,
    handleEmailSignIn,
    clearError,
  } = useLogin();

  // Local form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!showEmailLogin) return;

    // Reset previous errors
    setFormErrors({});
    clearError();

    // Validate form
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    // Submit form
    await handleEmailSignIn(email, password);
  };

  return (
    <Box
      className={className}
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
          maxWidth: 400,
          width: '100%',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          bgcolor: 'background.paper',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 1,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '0.95rem' }}
            >
              {subtitle}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': { fontSize: '0.875rem' },
              }}
              onClose={clearError}
            >
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Google Sign In Button */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{
                py: 1.5,
                textTransform: 'none',
                borderColor: 'divider',
                color: 'text.primary',
                fontSize: '0.95rem',
                fontWeight: 500,
                borderRadius: 2,
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                },
              }}
            >
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            {/* Email/Password Form */}
            {showEmailLogin && (
              <>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    or
                  </Typography>
                </Divider>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2}>
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
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
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
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
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
                          borderRadius: 2,
                        },
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        borderRadius: 2,
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        },
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
              </>
            )}

            {/* Sign Up Link */}
            {onToggleSignUp && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Don&apos;t have an account?{' '}
                  <Button
                    variant="text"
                    size="small"
                    onClick={onToggleSignUp}
                    disabled={loading}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      p: 0,
                      minWidth: 'auto',
                      '&:hover': {
                        bgcolor: 'transparent',
                        textDecoration: 'underline',
                      },
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
};