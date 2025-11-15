'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Alert, 
  AlertTitle,
  Collapse,
  IconButton
} from '@mui/material';
import { 
  ErrorOutline, 
  Refresh, 
  BugReport, 
  ExpandMore, 
  ExpandLess 
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  errorId: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    if (!this.props.enableReporting) return;

    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(), // Implement based on your auth system
      buildVersion: process.env.NEXT_PUBLIC_APP_VERSION,
    };

    try {
      // Send to error reporting service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private getUserId = (): string | null => {
    // Implement based on your authentication system
    // For now, return a session-based ID or null
    return sessionStorage.getItem('userId') || null;
  };

  private handleRetry = () => {
    // Reset error state and attempt to recover
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: ''
    });

    // Reload the page as a last resort
    window.location.reload();
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const issueBody = `
**Error ID:** ${errorId}
**Error Message:** ${error?.message}
**URL:** ${window.location.href}
**Browser:** ${navigator.userAgent}
**Timestamp:** ${new Date().toISOString()}

**Stack Trace:**
\`\`\`
${error?.stack}
\`\`\`

**Component Stack:**
\`\`\`
${errorInfo?.componentStack}
\`\`\`

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**

    `.trim();

    const githubUrl = `https://github.com/your-repo/issues/new?title=${encodeURIComponent(
      `Bug Report: ${error?.message}`
    )}&body=${encodeURIComponent(issueBody)}`;

    window.open(githubUrl, '_blank');
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: 'background.default'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center'
            }}
          >
            {/* Error Icon */}
            <ErrorOutline 
              sx={{ 
                fontSize: 64, 
                color: 'error.main', 
                mb: 2 
              }} 
            />

            {/* Error Title */}
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Something went wrong
            </Typography>

            {/* Error Description */}
            <Typography 
              variant="body1" 
              color="text.secondary" 
              paragraph
            >
              We're sorry, but something unexpected happened. This error has been 
              automatically reported to our team.
            </Typography>

            {/* Error ID */}
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontFamily: 'monospace',
                backgroundColor: 'grey.100',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                display: 'inline-block',
                mb: 3
              }}
            >
              Error ID: {this.state.errorId}
            </Typography>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
                size="large"
              >
                Try Again
              </Button>

              {this.props.enableReporting && (
                <Button
                  variant="outlined"
                  startIcon={<BugReport />}
                  onClick={this.handleReportBug}
                  size="large"
                >
                  Report Bug
                </Button>
              )}
            </Box>

            {/* Error Details (Development/Debug) */}
            {(process.env.NODE_ENV === 'development' || this.props.showDetails) && (
              <Box sx={{ mt: 3 }}>
                <Button
                  onClick={this.toggleDetails}
                  startIcon={this.state.showDetails ? <ExpandLess /> : <ExpandMore />}
                  size="small"
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                </Button>
                
                <Collapse in={this.state.showDetails}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mt: 2, 
                      textAlign: 'left',
                      '& .MuiAlert-message': {
                        width: '100%'
                      }
                    }}
                  >
                    <AlertTitle>Error Details</AlertTitle>
                    
                    <Typography 
                      variant="subtitle2" 
                      sx={{ fontWeight: 600, mt: 1 }}
                    >
                      Message:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        p: 1,
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      {this.state.error?.message}
                    </Typography>

                    <Typography 
                      variant="subtitle2" 
                      sx={{ fontWeight: 600, mt: 2 }}
                    >
                      Stack Trace:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        p: 1,
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                        mb: 1
                      }}
                    >
                      {this.state.error?.stack}
                    </Typography>

                    {this.state.errorInfo && (
                      <>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ fontWeight: 600, mt: 2 }}
                        >
                          Component Stack:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            whiteSpace: 'pre-wrap',
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            p: 1,
                            borderRadius: 1,
                            maxHeight: 200,
                            overflow: 'auto'
                          }}
                        >
                          {this.state.errorInfo.componentStack}
                        </Typography>
                      </>
                    )}
                  </Alert>
                </Collapse>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}