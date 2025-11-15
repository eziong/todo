// =============================================
// TASK DETAIL MODAL PRESENTER COMPONENT
// =============================================
// Comprehensive task detail modal with Material UI components and macOS aesthetics

'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Collapse,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  Autocomplete,
  useTheme,
  Slide,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTaskDetailModal, type TaskDetailModalProps } from './useTaskDetailModal';

// =============================================
// CUSTOM COMPONENTS
// =============================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
  </div>
);

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'warning' | 'error';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  severity = 'warning',
  isLoading = false,
}) => {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color={severity} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={severity}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =============================================
// PRESENTER COMPONENT
// =============================================

export const TaskDetailModal: React.FC<TaskDetailModalProps> = (props) => {
  const theme = useTheme();
  const container = useTaskDetailModal(props);
  const { state } = container;

  // File input ref for upload
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Tab index mapping
  const tabMapping = {
    details: 0,
    comments: 1,
    attachments: 2,
    history: 3,
  };

  // =============================================
  // COMPUTED PROPERTIES
  // =============================================

  const statusOptions = container.getStatusOptions();
  const priorityOptions = container.getPriorityOptions();
  const userOptions = container.getUserOptions();
  const activeTabIndex = tabMapping[state.activeTab];

  // =============================================
  // FORM FIELDS COMPONENTS
  // =============================================

  const renderBasicFields = (): React.ReactNode => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Title */}
      <TextField
        fullWidth
        label="Title"
        value={state.formData.title}
        onChange={(e) => container.updateField('title', e.target.value)}
        error={Boolean(state.validationErrors.title)}
        helperText={state.validationErrors.title}
        required
        autoFocus
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.background.paper,
          },
        }}
      />

      {/* Status and Priority */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={state.formData.status}
            onChange={(e) => container.updateField('status', e.target.value)}
            label="Status"
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: option.color,
                    }}
                  />
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Priority</InputLabel>
          <Select
            value={state.formData.priority}
            onChange={(e) => container.updateField('priority', e.target.value)}
            label="Priority"
          >
            {priorityOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FlagIcon sx={{ color: option.color }} />
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Assignee */}
      <FormControl fullWidth>
        <InputLabel>Assignee</InputLabel>
        <Select
          value={state.formData.assigned_to_user_id || ''}
          onChange={(e) => container.updateField('assigned_to_user_id', e.target.value || null)}
          label="Assignee"
        >
          {userOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {option.avatar ? (
                  <Avatar src={option.avatar} sx={{ width: 20, height: 20 }} />
                ) : (
                  <PersonIcon sx={{ fontSize: 20 }} />
                )}
                {option.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Description */}
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Description"
        value={state.formData.description}
        onChange={(e) => container.updateField('description', e.target.value)}
        error={Boolean(state.validationErrors.description)}
        helperText={state.validationErrors.description}
        placeholder="Add task description..."
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.background.paper,
          },
        }}
      />
    </Box>
  );

  const renderDateFields = (): React.ReactNode => (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 2 }}>
        <DatePicker
          label="Start Date"
          value={state.formData.start_date ? new Date(state.formData.start_date) : null}
          onChange={(date) => container.updateField('start_date', date?.toISOString().split('T')[0] || '')}
          slotProps={{
            textField: {
              fullWidth: true,
              error: Boolean(state.validationErrors.start_date),
              helperText: state.validationErrors.start_date,
            },
          }}
        />
        
        <DatePicker
          label="End Date"
          value={state.formData.end_date ? new Date(state.formData.end_date) : null}
          onChange={(date) => container.updateField('end_date', date?.toISOString().split('T')[0] || '')}
          slotProps={{
            textField: {
              fullWidth: true,
              error: Boolean(state.validationErrors.end_date),
              helperText: state.validationErrors.end_date,
            },
          }}
        />
        
        <DatePicker
          label="Due Date"
          value={state.formData.due_date ? new Date(state.formData.due_date) : null}
          onChange={(date) => container.updateField('due_date', date?.toISOString().split('T')[0] || '')}
          slotProps={{
            textField: {
              fullWidth: true,
              error: Boolean(state.validationErrors.due_date),
              helperText: state.validationErrors.due_date,
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );

  const renderTagsField = (): React.ReactNode => (
    <Box sx={{ mt: 2 }}>
      <Autocomplete
        multiple
        freeSolo
        options={props.availableTags || []}
        value={state.formData.tags}
        onChange={(_, newValue) => {
          const tags = newValue.map(tag => typeof tag === 'string' ? tag : '').filter(Boolean);
          container.updateField('tags', tags);
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              label={option}
              size="small"
              {...getTagProps({ index })}
              sx={{ margin: 0.5 }}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Tags"
            placeholder="Add tags..."
            error={Boolean(state.validationErrors.tags)}
            helperText={state.validationErrors.tags || 'Press Enter to add a tag'}
          />
        )}
      />
    </Box>
  );

  const renderEstimatedHours = (): React.ReactNode => (
    <Box sx={{ mt: 2 }}>
      <TextField
        fullWidth
        type="number"
        label="Estimated Hours"
        value={state.formData.estimated_hours || ''}
        onChange={(e) => {
          const value = e.target.value ? parseFloat(e.target.value) : null;
          container.updateField('estimated_hours', value);
        }}
        error={Boolean(state.validationErrors.estimated_hours)}
        helperText={state.validationErrors.estimated_hours}
        inputProps={{ min: 0, step: 0.5 }}
      />
    </Box>
  );

  // =============================================
  // TAB CONTENT COMPONENTS
  // =============================================

  const renderDetailsTab = (): React.ReactNode => (
    <Box>
      {renderBasicFields()}
      {renderDateFields()}
      {renderTagsField()}
      {renderEstimatedHours()}
    </Box>
  );

  const renderCommentsTab = (): React.ReactNode => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Comments & Activity</Typography>
      
      {/* Comment input */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Add a comment..."
          value={state.newComment}
          onChange={(e) => container.updateComment(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="small"
            onClick={container.submitComment}
            disabled={!state.newComment.trim() || state.isSubmittingComment}
            startIcon={state.isSubmittingComment ? <CircularProgress size={16} /> : <CommentIcon />}
          >
            Add Comment
          </Button>
        </Box>
      </Paper>

      {/* Comments list placeholder */}
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        Comments will be displayed here when implemented
      </Typography>
    </Box>
  );

  const renderAttachmentsTab = (): React.ReactNode => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Attachments</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AttachFileIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={state.isUploadingFile}
        >
          Upload Files
        </Button>
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) {
            void container.handleFileUpload(e.target.files);
          }
        }}
      />

      {/* Upload progress */}
      {state.isUploadingFile && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Uploading files... {Math.round(state.uploadProgress)}%
          </Typography>
          <LinearProgress variant="determinate" value={state.uploadProgress} />
        </Box>
      )}

      {/* Attachments list */}
      {props.task?.attachments && props.task.attachments.length > 0 ? (
        <List>
          {props.task.attachments.map((attachment) => (
            <ListItem key={attachment.id} divider>
              <ListItemIcon>
                <AttachFileIcon />
              </ListItemIcon>
              <ListItemText
                primary={attachment.name}
                secondary={`${(attachment.size / 1024).toFixed(1)} KB`}
              />
              <ListItemSecondaryAction>
                <Tooltip title="Download">
                  <IconButton size="small">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => container.handleFileDelete(attachment.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No attachments yet. Upload files using the button above.
        </Typography>
      )}
    </Box>
  );

  const renderHistoryTab = (): React.ReactNode => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Task History</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        Task history and audit log will be displayed here when implemented
      </Typography>
    </Box>
  );

  // =============================================
  // MAIN RENDER
  // =============================================

  if (!props.task) {
    return null;
  }

  return (
    <>
      <Dialog
        open={props.open}
        onClose={container.handleCancel}
        maxWidth="md"
        fullWidth
        onKeyDown={container.handleKeyDown}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' } as Record<string, unknown>}
        PaperProps={{
          sx: {
            borderRadius: theme.spacing(2),
            minHeight: '70vh',
            maxHeight: '90vh',
          },
        }}
      >
        {/* Dialog Title */}
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="h6">Task Details</Typography>
            {state.hasUnsavedChanges && (
              <Chip
                label="Unsaved Changes"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Save (Ctrl+S)">
              <span>
                <Button
                  variant="contained"
                  size="small"
                  onClick={container.handleSave}
                  disabled={!container.canSave()}
                  startIcon={state.isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
                >
                  Save
                </Button>
              </span>
            </Tooltip>
            
            <Tooltip title="Close (Esc)">
              <IconButton onClick={container.handleCancel} disabled={state.isSaving || state.isDeleting}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        {/* Loading Progress */}
        {(state.isSaving || state.isDeleting) && (
          <LinearProgress />
        )}

        {/* Error Alert */}
        <Collapse in={Boolean(state.error)}>
          <Box sx={{ p: 2 }}>
            <Alert 
              severity="error" 
              onClose={container.clearError}
              sx={{ fontSize: '0.875rem' }}
            >
              {state.error}
            </Alert>
          </Box>
        </Collapse>

        {/* Dialog Content */}
        <DialogContent sx={{ p: 0 }}>
          {/* Tabs */}
          <Tabs
            value={activeTabIndex}
            onChange={(_, newValue) => {
              const tabKey = Object.keys(tabMapping)[newValue] as keyof typeof tabMapping;
              container.setActiveTab(tabKey);
            }}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<InfoIcon />} 
              label="Details" 
              iconPosition="start"
            />
            <Tab 
              icon={<CommentIcon />} 
              label="Comments" 
              iconPosition="start"
            />
            <Tab 
              icon={<AttachFileIcon />} 
              label="Attachments" 
              iconPosition="start"
              disabled={!props.onUploadFile}
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="History" 
              iconPosition="start"
            />
          </Tabs>

          {/* Tab Panels */}
          <Box sx={{ p: 3 }}>
            <TabPanel value={activeTabIndex} index={0}>
              {renderDetailsTab()}
            </TabPanel>
            
            <TabPanel value={activeTabIndex} index={1}>
              {renderCommentsTab()}
            </TabPanel>
            
            <TabPanel value={activeTabIndex} index={2}>
              {renderAttachmentsTab()}
            </TabPanel>
            
            <TabPanel value={activeTabIndex} index={3}>
              {renderHistoryTab()}
            </TabPanel>
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions sx={{ 
          borderTop: 1, 
          borderColor: 'divider',
          p: 2,
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={container.showDeleteDialog}
              disabled={!container.canDelete()}
              startIcon={<DeleteIcon />}
            >
              Delete Task
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArchiveIcon />}
              disabled={!container.canDelete()}
            >
              Archive
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={container.handleCancel} disabled={state.isSaving || state.isDeleting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={container.handleSave}
              disabled={!container.canSave()}
              startIcon={state.isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {state.isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={state.showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${props.task?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        isLoading={state.isDeleting}
        onConfirm={container.handleDelete}
        onCancel={container.hideDeleteDialog}
      />

      {/* Unsaved Changes Warning Dialog */}
      <ConfirmDialog
        open={state.showUnsavedChangesWarning}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        severity="warning"
        onConfirm={container.handleClose}
        onCancel={() => container.updateField('title', state.formData.title)} // Just to clear the warning state
      />
    </>
  );
};