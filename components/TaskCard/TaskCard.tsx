// =============================================
// TASK CARD PRESENTER COMPONENT
// =============================================
// Pure UI component for displaying and interacting with tasks using Material UI with macOS aesthetics

'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  Avatar,
  Tooltip,
  Box,
  TextField,
  Collapse,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  MoreHoriz as MoreIcon,
  Launch as LaunchIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useTaskCard, type TaskCardProps } from './useTaskCard';
import type { TaskStatus } from '@/types';

// =============================================
// PRESENTER COMPONENT
// =============================================

export const TaskCard: React.FC<TaskCardProps> = (props) => {
  const theme = useTheme();
  const container = useTaskCard(props);
  const { state, isDragging } = container;
  
  // =============================================
  // CONSTANTS
  // =============================================
  
  const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  
  // Priority options for future priority selector
  // const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  //   { value: 'low', label: 'Low', color: container.getPriorityColor() },
  //   { value: 'medium', label: 'Medium', color: theme.macOS.todo.task.priority.medium },
  //   { value: 'high', label: 'High', color: theme.macOS.todo.task.priority.high },
  //   { value: 'urgent', label: 'Urgent', color: theme.macOS.todo.task.priority.urgent },
  // ];
  
  // =============================================
  // COMPUTED PROPERTIES
  // =============================================
  
  const dueDateStatus = container.getDueDateStatus();
  const isCompleted = state.task.status === 'completed';
  const canEdit = container.canEdit();
  const showActions = container.shouldShowActions();
  const assignee = props.users?.find(user => user.id === state.task.assigned_to_user_id);
  
  // =============================================
  // INLINE EDITING COMPONENTS
  // =============================================
  
  const renderTitleField = (): React.ReactNode => {
    if (state.inlineEdit.isEditing && state.inlineEdit.field === 'title') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={state.inlineEdit.value}
            onChange={(e) => container.updateEditValue(e.target.value)}
            onBlur={() => void container.saveEdit()}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '1rem',
                fontWeight: 600,
                backgroundColor: theme.palette.background.paper,
              },
            }}
          />
          <IconButton
            size="small"
            onClick={() => void container.saveEdit()}
            disabled={state.isUpdating || !state.inlineEdit.hasChanges}
            color="primary"
          >
            {state.isUpdating ? <CircularProgress size={16} /> : <CheckIcon />}
          </IconButton>
          <IconButton
            size="small"
            onClick={container.cancelEdit}
            disabled={state.isUpdating}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      );
    }
    
    return (
      <Typography
        variant="h6"
        component="h3"
        sx={{
          fontWeight: 600,
          fontSize: '1rem',
          lineHeight: 1.4,
          mb: 1,
          cursor: canEdit ? 'pointer' : 'default',
          textDecoration: isCompleted ? 'line-through' : 'none',
          opacity: isCompleted ? 0.7 : 1,
          transition: theme.macOS.animation.fast,
          '&:hover': canEdit ? {
            backgroundColor: theme.palette.action.hover,
            borderRadius: theme.macOS.borderRadius.small,
            px: 0.5,
            mx: -0.5,
          } : {},
        }}
        onClick={() => canEdit && container.startEdit('title')}
        title={canEdit ? 'Click to edit title' : undefined}
      >
        {state.task.title}
      </Typography>
    );
  };
  
  const renderDescriptionField = (): React.ReactNode => {
    if (!state.task.description && !state.inlineEdit.isEditing) {
      return null;
    }
    
    if (state.inlineEdit.isEditing && state.inlineEdit.field === 'description') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            size="small"
            value={state.inlineEdit.value}
            onChange={(e) => container.updateEditValue(e.target.value)}
            onBlur={() => void container.saveEdit()}
            placeholder="Add description..."
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
                backgroundColor: theme.palette.background.paper,
              },
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => void container.saveEdit()}
              disabled={state.isUpdating}
              color="primary"
            >
              {state.isUpdating ? <CircularProgress size={16} /> : <CheckIcon />}
            </IconButton>
            <IconButton
              size="small"
              onClick={container.cancelEdit}
              disabled={state.isUpdating}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      );
    }
    
    return (
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          fontSize: '0.875rem',
          lineHeight: 1.5,
          mb: 1.5,
          cursor: canEdit ? 'pointer' : 'default',
          opacity: isCompleted ? 0.7 : 1,
          transition: theme.macOS.animation.fast,
          '&:hover': canEdit ? {
            backgroundColor: theme.palette.action.hover,
            borderRadius: theme.macOS.borderRadius.small,
            px: 0.5,
            mx: -0.5,
          } : {},
        }}
        onClick={() => canEdit && container.startEdit('description')}
        title={canEdit ? 'Click to edit description' : undefined}
      >
        {state.task.description || (canEdit ? 'Add description...' : '')}
      </Typography>
    );
  };
  
  // =============================================
  // METADATA COMPONENTS
  // =============================================
  
  const renderTags = (): React.ReactNode => {
    if (!state.task.tags || state.task.tags.length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
        {state.task.tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            variant="filled"
            sx={{
              fontSize: '0.75rem',
              height: '20px',
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          />
        ))}
      </Box>
    );
  };
  
  const renderAssigneeAndDueDate = (): React.ReactNode => {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 1.5,
        minHeight: '24px',
      }}>
        {/* Assignee */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {assignee ? (
            <Tooltip title={`Assigned to ${assignee.name}`}>
              <Avatar
                src={assignee.avatar_url}
                sx={{
                  width: 20,
                  height: 20,
                  fontSize: '0.75rem',
                  backgroundColor: theme.palette.primary.main,
                }}
              >
                {assignee.name.charAt(0)}
              </Avatar>
            </Tooltip>
          ) : (
            <Tooltip title="Unassigned">
              <AssignmentIcon 
                sx={{ 
                  fontSize: 20, 
                  color: theme.palette.text.disabled 
                }} 
              />
            </Tooltip>
          )}
        </Box>
        
        {/* Due Date */}
        {state.task.due_date && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            color: dueDateStatus === 'overdue' ? theme.palette.error.main :
                   dueDateStatus === 'due-soon' ? theme.palette.warning.main :
                   theme.palette.text.secondary,
          }}>
            {dueDateStatus === 'overdue' && <WarningIcon sx={{ fontSize: 16 }} />}
            <TimeIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
              {container.formatDueDate()}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };
  
  // =============================================
  // ACTION COMPONENTS
  // =============================================
  
  const renderQuickActions = (): React.ReactNode => {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 1,
      }}>
        {/* Left side: Completion toggle and status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox
            checked={isCompleted}
            onChange={container.toggleComplete}
            disabled={state.isUpdating}
            size="small"
            sx={{
              color: container.getStatusColor(),
              '&.Mui-checked': {
                color: theme.palette.success.main,
              },
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={state.task.status}
              onChange={(e) => container.updateStatus(e.target.value as TaskStatus)}
              disabled={state.isUpdating}
              sx={{
                fontSize: '0.75rem',
                '& .MuiSelect-select': {
                  py: 0.5,
                  color: container.getStatusColor(),
                  fontWeight: 500,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: container.getStatusColor(),
                  borderWidth: 1,
                },
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* Right side: Priority and actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip
            label={state.task.priority.charAt(0).toUpperCase() + state.task.priority.slice(1)}
            size="small"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              height: '24px',
              backgroundColor: container.getPriorityColor(),
              color: theme.palette.getContrastText(container.getPriorityColor()),
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open priority selector
            }}
          />
          
          <Tooltip title="More options">
            <IconButton
              size="small"
              sx={{ 
                opacity: showActions ? 1 : 0,
                transition: theme.macOS.animation.fast,
              }}
            >
              <MoreIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Open task details">
            <IconButton
              size="small"
              onClick={container.openTaskModal}
              color="primary"
              sx={{ 
                opacity: showActions ? 1 : 0,
                transition: theme.macOS.animation.fast,
              }}
            >
              <LaunchIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  };
  
  // =============================================
  // MAIN RENDER
  // =============================================
  
  return (
    <Card
      variant="outlined"
      {...container.sortableProps}
      className={props.className}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        transition: `all ${theme.macOS.animation.fast}`,
        ...(container.sortableProps.style as Record<string, unknown>),
        '&:hover': {
          transform: isDragging ? undefined : 'translateY(-2px)',
          boxShadow: isDragging ? undefined : theme.macOS.shadows.medium,
        },
        '&:active': {
          transform: state.isPressed && !isDragging ? 'translateY(-1px)' : undefined,
        },
      }}
      onMouseEnter={container.handleMouseEnter}
      onMouseLeave={container.handleMouseLeave}
      onMouseDown={container.handleMouseDown}
      onMouseUp={container.handleMouseUp}
      onClick={!state.inlineEdit.isEditing ? container.openTaskModal : undefined}
    >
      {/* Drag Handle */}
      <Box
        {...container.dragHandleProps}
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          opacity: showActions ? 1 : 0,
          transition: theme.macOS.animation.fast,
          cursor: isDragging ? 'grabbing' : 'grab',
          color: theme.palette.text.secondary,
          '&:hover': {
            color: theme.palette.text.primary,
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <DragIcon sx={{ fontSize: 16 }} />
      </Box>
      
      {/* Priority Indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 4,
          height: '100%',
          backgroundColor: container.getPriorityColor(),
          borderTopRightRadius: theme.macOS.borderRadius.medium,
          borderBottomRightRadius: theme.macOS.borderRadius.medium,
        }}
      />
      
      <CardContent sx={{ pl: 4, pr: 2, pb: 1 }}>
        {/* Error Alert */}
        <Collapse in={Boolean(state.error)}>
          <Alert 
            severity="error" 
            sx={{ mb: 1, fontSize: '0.75rem' }}
            onClose={container.clearError}
          >
            {state.error}
          </Alert>
        </Collapse>
        
        {/* Title */}
        {renderTitleField()}
        
        {/* Description */}
        {renderDescriptionField()}
        
        {/* Tags */}
        {renderTags()}
        
        {/* Assignee and Due Date */}
        {renderAssigneeAndDueDate()}
      </CardContent>
      
      {/* Actions */}
      <CardActions sx={{ px: 2, py: 1, pt: 0 }}>
        {renderQuickActions()}
      </CardActions>
      
      {/* Loading Overlay */}
      {(state.isUpdating || state.isDeleting) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.macOS.borderRadius.medium,
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
    </Card>
  );
};