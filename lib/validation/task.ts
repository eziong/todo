// =============================================
// TASK VALIDATION UTILITIES
// =============================================
// Validation schemas and utilities for task operations

import type { 
  TaskStatus, 
  TaskPriority, 
  TaskInsert, 
  TaskUpdate,
  TaskAttachment 
} from '@/database/types';

// Valid enum values for validation
export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'completed', 'cancelled', 'on_hold'];
export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate task title
 */
export function validateTitle(title: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!title || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (title.trim().length > 200) {
    errors.push({ field: 'title', message: 'Title must be 200 characters or less' });
  }

  return errors;
}

/**
 * Validate task description
 */
export function validateDescription(description?: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (description && description.length > 2000) {
    errors.push({ field: 'description', message: 'Description must be 2000 characters or less' });
  }

  return errors;
}

/**
 * Validate task status
 */
export function validateStatus(status: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!TASK_STATUSES.includes(status as TaskStatus)) {
    errors.push({ 
      field: 'status', 
      message: `Status must be one of: ${TASK_STATUSES.join(', ')}` 
    });
  }

  return errors;
}

/**
 * Validate task priority
 */
export function validatePriority(priority: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!TASK_PRIORITIES.includes(priority as TaskPriority)) {
    errors.push({ 
      field: 'priority', 
      message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}` 
    });
  }

  return errors;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(date)) {
    errors.push({ 
      field: fieldName, 
      message: `${fieldName} must be in YYYY-MM-DD format` 
    });
    return errors;
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    errors.push({ 
      field: fieldName, 
      message: `${fieldName} must be a valid date` 
    });
  }

  return errors;
}

/**
 * Validate date range (start_date <= end_date, etc.)
 */
export function validateDateRange(
  startDate?: string, 
  endDate?: string, 
  dueDate?: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.push({ 
        field: 'end_date', 
        message: 'End date must be on or after start date' 
      });
    }
  }

  if (dueDate) {
    const due = new Date(dueDate);
    
    if (startDate) {
      const start = new Date(startDate);
      if (due < start) {
        errors.push({ 
          field: 'due_date', 
          message: 'Due date must be on or after start date' 
        });
      }
    }
  }

  return errors;
}

/**
 * Validate estimated hours
 */
export function validateEstimatedHours(hours?: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (hours !== undefined) {
    if (hours < 0) {
      errors.push({ 
        field: 'estimated_hours', 
        message: 'Estimated hours cannot be negative' 
      });
    } else if (hours > 10000) {
      errors.push({ 
        field: 'estimated_hours', 
        message: 'Estimated hours cannot exceed 10,000' 
      });
    }
  }

  return errors;
}

/**
 * Validate actual hours
 */
export function validateActualHours(hours?: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (hours !== undefined) {
    if (hours < 0) {
      errors.push({ 
        field: 'actual_hours', 
        message: 'Actual hours cannot be negative' 
      });
    } else if (hours > 10000) {
      errors.push({ 
        field: 'actual_hours', 
        message: 'Actual hours cannot exceed 10,000' 
      });
    }
  }

  return errors;
}

/**
 * Validate task tags
 */
export function validateTags(tags: string[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (tags.length > 20) {
    errors.push({ 
      field: 'tags', 
      message: 'Maximum 20 tags allowed' 
    });
  }

  for (const tag of tags) {
    if (typeof tag !== 'string') {
      errors.push({ 
        field: 'tags', 
        message: 'All tags must be strings' 
      });
      break;
    }
    
    if (tag.length === 0) {
      errors.push({ 
        field: 'tags', 
        message: 'Tags cannot be empty' 
      });
      break;
    }
    
    if (tag.length > 50) {
      errors.push({ 
        field: 'tags', 
        message: 'Each tag must be 50 characters or less' 
      });
      break;
    }
  }

  return errors;
}

/**
 * Validate position value
 */
export function validatePosition(position: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Number.isInteger(position)) {
    errors.push({ 
      field: 'position', 
      message: 'Position must be an integer' 
    });
  } else if (position < 0) {
    errors.push({ 
      field: 'position', 
      message: 'Position cannot be negative' 
    });
  }

  return errors;
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    errors.push({ 
      field: fieldName, 
      message: `${fieldName} must be a valid UUID` 
    });
  }

  return errors;
}

/**
 * Validate task attachments
 */
export function validateAttachments(attachments: TaskAttachment[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (attachments.length > 50) {
    errors.push({ 
      field: 'attachments', 
      message: 'Maximum 50 attachments allowed' 
    });
  }

  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];
    
    if (!attachment.id || !attachment.name || !attachment.url) {
      errors.push({ 
        field: 'attachments', 
        message: `Attachment ${i + 1} is missing required fields` 
      });
      continue;
    }

    if (attachment.name.length > 255) {
      errors.push({ 
        field: 'attachments', 
        message: `Attachment ${i + 1} name must be 255 characters or less` 
      });
    }

    if (attachment.size < 0 || attachment.size > 100 * 1024 * 1024) { // 100MB limit
      errors.push({ 
        field: 'attachments', 
        message: `Attachment ${i + 1} size must be between 0 and 100MB` 
      });
    }

    const uuidErrors = validateUUID(attachment.id, `attachments[${i}].id`);
    errors.push(...uuidErrors);

    const uploaderErrors = validateUUID(attachment.uploaded_by_user_id, `attachments[${i}].uploaded_by_user_id`);
    errors.push(...uploaderErrors);
  }

  return errors;
}

/**
 * Validate task creation data
 */
export function validateTaskInsert(data: Partial<TaskInsert>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.title) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else {
    errors.push(...validateTitle(data.title));
  }

  if (!data.section_id) {
    errors.push({ field: 'section_id', message: 'Section ID is required' });
  } else {
    errors.push(...validateUUID(data.section_id, 'section_id'));
  }

  if (!data.workspace_id) {
    errors.push({ field: 'workspace_id', message: 'Workspace ID is required' });
  } else {
    errors.push(...validateUUID(data.workspace_id, 'workspace_id'));
  }

  if (!data.created_by_user_id) {
    errors.push({ field: 'created_by_user_id', message: 'Created by user ID is required' });
  } else {
    errors.push(...validateUUID(data.created_by_user_id, 'created_by_user_id'));
  }

  if (!data.status) {
    errors.push({ field: 'status', message: 'Status is required' });
  } else {
    errors.push(...validateStatus(data.status));
  }

  if (!data.priority) {
    errors.push({ field: 'priority', message: 'Priority is required' });
  } else {
    errors.push(...validatePriority(data.priority));
  }

  if (typeof data.position !== 'number') {
    errors.push({ field: 'position', message: 'Position is required' });
  } else {
    errors.push(...validatePosition(data.position));
  }

  // Optional fields validation
  if (data.description !== undefined) {
    errors.push(...validateDescription(data.description));
  }

  if (data.assigned_to_user_id !== undefined && data.assigned_to_user_id !== null) {
    errors.push(...validateUUID(data.assigned_to_user_id, 'assigned_to_user_id'));
  }

  if (data.start_date !== undefined && data.start_date !== null) {
    errors.push(...validateDate(data.start_date, 'start_date'));
  }

  if (data.end_date !== undefined && data.end_date !== null) {
    errors.push(...validateDate(data.end_date, 'end_date'));
  }

  if (data.due_date !== undefined && data.due_date !== null) {
    errors.push(...validateDate(data.due_date, 'due_date'));
  }

  // Date range validation
  errors.push(...validateDateRange(data.start_date, data.end_date, data.due_date));

  if (data.estimated_hours !== undefined) {
    errors.push(...validateEstimatedHours(data.estimated_hours));
  }

  if (data.actual_hours !== undefined) {
    errors.push(...validateActualHours(data.actual_hours));
  }

  if (!data.tags) {
    errors.push({ field: 'tags', message: 'Tags array is required (can be empty)' });
  } else if (Array.isArray(data.tags)) {
    errors.push(...validateTags(data.tags));
  } else {
    errors.push({ field: 'tags', message: 'Tags must be an array' });
  }

  if (!data.attachments) {
    errors.push({ field: 'attachments', message: 'Attachments array is required (can be empty)' });
  } else if (Array.isArray(data.attachments)) {
    errors.push(...validateAttachments(data.attachments));
  } else {
    errors.push({ field: 'attachments', message: 'Attachments must be an array' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate task update data
 */
export function validateTaskUpdate(data: TaskUpdate): ValidationResult {
  const errors: ValidationError[] = [];

  // All fields are optional for updates, but validate if present
  if (data.title !== undefined) {
    if (data.title === null) {
      errors.push({ field: 'title', message: 'Title cannot be null' });
    } else {
      errors.push(...validateTitle(data.title));
    }
  }

  if (data.description !== undefined) {
    errors.push(...validateDescription(data.description));
  }

  if (data.status !== undefined) {
    errors.push(...validateStatus(data.status));
  }

  if (data.priority !== undefined) {
    errors.push(...validatePriority(data.priority));
  }

  if (data.assigned_to_user_id !== undefined && data.assigned_to_user_id !== null) {
    errors.push(...validateUUID(data.assigned_to_user_id, 'assigned_to_user_id'));
  }

  if (data.start_date !== undefined && data.start_date !== null) {
    errors.push(...validateDate(data.start_date, 'start_date'));
  }

  if (data.end_date !== undefined && data.end_date !== null) {
    errors.push(...validateDate(data.end_date, 'end_date'));
  }

  if (data.due_date !== undefined && data.due_date !== null) {
    errors.push(...validateDate(data.due_date, 'due_date'));
  }

  // Only validate date ranges if all relevant dates are being updated
  if (data.start_date !== undefined || data.end_date !== undefined || data.due_date !== undefined) {
    errors.push(...validateDateRange(data.start_date, data.end_date, data.due_date));
  }

  if (data.position !== undefined) {
    errors.push(...validatePosition(data.position));
  }

  if (data.estimated_hours !== undefined) {
    errors.push(...validateEstimatedHours(data.estimated_hours));
  }

  if (data.actual_hours !== undefined) {
    errors.push(...validateActualHours(data.actual_hours));
  }

  if (data.tags !== undefined) {
    if (Array.isArray(data.tags)) {
      errors.push(...validateTags(data.tags));
    } else {
      errors.push({ field: 'tags', message: 'Tags must be an array' });
    }
  }

  if (data.attachments !== undefined) {
    if (Array.isArray(data.attachments)) {
      errors.push(...validateAttachments(data.attachments));
    } else {
      errors.push({ field: 'attachments', message: 'Attachments must be an array' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate task status transition
 */
export function validateStatusTransition(
  currentStatus: TaskStatus, 
  newStatus: TaskStatus
): ValidationResult {
  const errors: ValidationError[] = [];

  // Define valid status transitions
  const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    todo: ['in_progress', 'cancelled', 'on_hold'],
    in_progress: ['completed', 'cancelled', 'on_hold', 'todo'],
    completed: ['in_progress', 'todo'], // Allow reopening
    cancelled: ['todo', 'in_progress'], // Allow reactivating
    on_hold: ['todo', 'in_progress', 'cancelled'],
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    errors.push({ 
      field: 'status', 
      message: `Cannot transition from ${currentStatus} to ${newStatus}` 
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate search query
 */
export function validateSearchQuery(query?: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (query !== undefined) {
    if (typeof query !== 'string') {
      errors.push({ field: 'search', message: 'Search query must be a string' });
    } else if (query.length > 500) {
      errors.push({ field: 'search', message: 'Search query must be 500 characters or less' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: string, limit?: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    } else if (pageNum > 10000) {
      errors.push({ field: 'page', message: 'Page number too large' });
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push({ field: 'limit', message: 'Limit must be a positive integer' });
    } else if (limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit cannot exceed 100' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}