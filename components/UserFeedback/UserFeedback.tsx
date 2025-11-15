'use client';

import React, { useState, useCallback } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertTitle,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Rating,
  Chip,
  Stack,
  LinearProgress
} from '@mui/material';
import { 
  Close, 
  Send, 
  ThumbUp, 
  ThumbDown,
  BugReport,
  Lightbulb,
  QuestionAnswer
} from '@mui/icons-material';

export interface FeedbackMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  autoHide?: boolean;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface UserFeedbackProps {
  messages: FeedbackMessage[];
  onDismiss: (id: string) => void;
  onFeedbackSubmit?: (feedback: UserFeedbackData) => Promise<void>;
  enableFeedbackDialog?: boolean;
}

interface UserFeedbackData {
  type: 'bug' | 'improvement' | 'question' | 'other';
  rating?: number;
  title: string;
  description: string;
  email?: string;
  category: string;
  metadata: {
    url: string;
    userAgent: string;
    timestamp: string;
  };
}

export const UserFeedback: React.FC<UserFeedbackProps> = ({
  messages,
  onDismiss,
  onFeedbackSubmit,
  enableFeedbackDialog = true
}) => {
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [feedbackForm, setFeedbackForm] = useState<Partial<UserFeedbackData>>({
    type: 'improvement',
    title: '',
    description: '',
    email: '',
    category: '',
    rating: 5
  });

  const handleFeedbackSubmit = useCallback(async () => {
    if (!onFeedbackSubmit || !feedbackForm.title || !feedbackForm.description) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('idle');

    try {
      const feedbackData: UserFeedbackData = {
        type: feedbackForm.type || 'improvement',
        rating: feedbackForm.rating,
        title: feedbackForm.title,
        description: feedbackForm.description,
        email: feedbackForm.email,
        category: feedbackForm.category || 'general',
        metadata: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };

      await onFeedbackSubmit(feedbackData);
      setSubmissionStatus('success');
      
      // Reset form and close dialog after success
      setTimeout(() => {
        setFeedbackDialog(false);
        setFeedbackForm({
          type: 'improvement',
          title: '',
          description: '',
          email: '',
          category: '',
          rating: 5
        });
        setSubmissionStatus('idle');
      }, 2000);

    } catch (error) {
      setSubmissionStatus('error');
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackForm, onFeedbackSubmit]);

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: <BugReport />, color: '#f44336' },
    { value: 'improvement', label: 'Improvement', icon: <Lightbulb />, color: '#ff9800' },
    { value: 'question', label: 'Question', icon: <QuestionAnswer />, color: '#2196f3' },
    { value: 'other', label: 'Other', icon: <ThumbUp />, color: '#4caf50' }
  ];

  return (
    <>
      {/* Snackbar Messages */}
      {messages.map((message) => (
        <Snackbar
          key={message.id}
          open={true}
          autoHideDuration={message.autoHide !== false ? (message.duration || 6000) : null}
          onClose={() => onDismiss(message.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            position: 'fixed',
            zIndex: (theme) => theme.zIndex.snackbar + 1
          }}
        >
          <Alert
            severity={message.type}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {message.action && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={message.action.onClick}
                  >
                    {message.action.label}
                  </Button>
                )}
                {!message.persistent && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => onDismiss(message.id)}
                    aria-label="Close"
                  >
                    <Close fontSize="small" />
                  </Button>
                )}
              </Box>
            }
            sx={{ alignItems: 'center' }}
          >
            {message.title && <AlertTitle>{message.title}</AlertTitle>}
            {message.message}
          </Alert>
        </Snackbar>
      ))}

      {/* Feedback Floating Action Button */}
      {enableFeedbackDialog && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setFeedbackDialog(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: (theme) => theme.zIndex.fab,
            borderRadius: '50%',
            minWidth: 56,
            height: 56,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6
            }
          }}
          aria-label="Send feedback"
        >
          <Send />
        </Button>
      )}

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog}
        onClose={() => setFeedbackDialog(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="feedback-dialog-title"
      >
        <DialogTitle id="feedback-dialog-title">
          Send Feedback
          <Typography variant="body2" color="text.secondary">
            Help us improve by sharing your thoughts, reporting bugs, or asking questions.
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {submissionStatus === 'success' ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ThumbUp sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Thank you for your feedback!
              </Typography>
              <Typography color="text.secondary">
                We appreciate your input and will review it soon.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Loading indicator */}
              {isSubmitting && <LinearProgress />}

              {/* Error message */}
              {submissionStatus === 'error' && (
                <Alert severity="error">
                  Failed to submit feedback. Please try again.
                </Alert>
              )}

              {/* Feedback type selection */}
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  What type of feedback is this?
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {feedbackTypes.map((type) => (
                    <Chip
                      key={type.value}
                      icon={type.icon}
                      label={type.label}
                      clickable
                      variant={feedbackForm.type === type.value ? 'filled' : 'outlined'}
                      onClick={() => setFeedbackForm(prev => ({ ...prev, type: type.value as any }))}
                      sx={{
                        ...(feedbackForm.type === type.value && {
                          backgroundColor: type.color,
                          color: 'white',
                          '& .MuiChip-icon': { color: 'white' }
                        })
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Rating (for improvement and bug types) */}
              {(feedbackForm.type === 'improvement' || feedbackForm.type === 'bug') && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    How would you rate this feature/experience?
                  </Typography>
                  <Rating
                    value={feedbackForm.rating || 5}
                    onChange={(_, value) => setFeedbackForm(prev => ({ ...prev, rating: value || 5 }))}
                    size="large"
                  />
                </Box>
              )}

              {/* Title */}
              <TextField
                label="Title"
                value={feedbackForm.title || ''}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, title: e.target.value }))}
                required
                disabled={isSubmitting}
                placeholder="Brief summary of your feedback"
                fullWidth
              />

              {/* Description */}
              <TextField
                label="Description"
                value={feedbackForm.description || ''}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, description: e.target.value }))}
                required
                disabled={isSubmitting}
                multiline
                rows={4}
                placeholder="Please provide details about your feedback..."
                fullWidth
                helperText={`${feedbackForm.description?.length || 0}/1000 characters`}
                inputProps={{ maxLength: 1000 }}
              />

              {/* Category */}
              <TextField
                label="Category (Optional)"
                value={feedbackForm.category || ''}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))}
                disabled={isSubmitting}
                placeholder="e.g., Navigation, Performance, Design"
                fullWidth
              />

              {/* Email */}
              <TextField
                label="Email (Optional)"
                type="email"
                value={feedbackForm.email || ''}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, email: e.target.value }))}
                disabled={isSubmitting}
                placeholder="your@email.com"
                helperText="We'll only use this to follow up on your feedback"
                fullWidth
              />
            </Box>
          )}
        </DialogContent>

        {submissionStatus !== 'success' && (
          <DialogActions>
            <Button
              onClick={() => setFeedbackDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFeedbackSubmit}
              variant="contained"
              disabled={
                isSubmitting ||
                !feedbackForm.title?.trim() ||
                !feedbackForm.description?.trim()
              }
              startIcon={isSubmitting ? undefined : <Send />}
            >
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};