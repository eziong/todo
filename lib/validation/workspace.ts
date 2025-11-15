// =============================================
// WORKSPACE VALIDATION UTILITIES
// =============================================
// Validation functions for workspace-related data

import type { 
  WorkspaceInsert, 
  WorkspaceUpdate,
  WorkspaceMemberRole,
  WorkspacePermissions,
  WorkspaceSettings 
} from '@/database/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

/**
 * Validate workspace creation data
 */
export function validateWorkspaceCreate(data: any): ValidationResult & { sanitizedData?: WorkspaceInsert } {
  const errors: string[] = [];

  // Validate name (required)
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Workspace name is required');
  } else {
    const trimmedName = data.name.trim();
    if (trimmedName.length === 0) {
      errors.push('Workspace name cannot be empty');
    } else if (trimmedName.length > 100) {
      errors.push('Workspace name must be less than 100 characters');
    }
  }

  // Validate description (optional)
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
  }

  // Validate color (optional with default)
  let validColor = '#3B82F6'; // Default blue
  if (data.color) {
    if (typeof data.color !== 'string') {
      errors.push('Color must be a string');
    } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
      errors.push('Color must be a valid hex color (e.g., #3B82F6)');
    } else {
      validColor = data.color.toUpperCase();
    }
  }

  // Validate icon (optional)
  if (data.icon !== undefined && data.icon !== null) {
    if (typeof data.icon !== 'string') {
      errors.push('Icon must be a string');
    } else if (data.icon.length > 50) {
      errors.push('Icon identifier must be less than 50 characters');
    }
  }

  // Validate settings (optional with defaults)
  let validSettings: WorkspaceSettings = {
    features: {
      time_tracking: true,
      file_attachments: true,
      due_date_reminders: true,
      task_templates: false,
    },
    integrations: {
      calendar: false,
      slack: false,
      email: true,
    },
    security: {
      require_task_approval: false,
      restrict_member_invites: false,
    },
  };

  if (data.settings) {
    const settingsValidation = validateWorkspaceSettings(data.settings);
    if (!settingsValidation.isValid) {
      errors.push(...settingsValidation.errors);
    } else if (settingsValidation.sanitizedData) {
      validSettings = settingsValidation.sanitizedData;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const sanitizedData: WorkspaceInsert = {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    owner_id: data.owner_id, // Will be set by the API
    color: validColor,
    icon: data.icon || null,
    settings: validSettings,
  };

  return { isValid: true, errors: [], sanitizedData };
}

/**
 * Validate workspace update data
 */
export function validateWorkspaceUpdate(data: any): ValidationResult & { sanitizedData?: WorkspaceUpdate } {
  const errors: string[] = [];
  const sanitizedData: WorkspaceUpdate = {};

  // Validate name (optional for updates)
  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Workspace name cannot be empty');
    } else {
      const trimmedName = data.name.trim();
      if (trimmedName.length === 0) {
        errors.push('Workspace name cannot be empty');
      } else if (trimmedName.length > 100) {
        errors.push('Workspace name must be less than 100 characters');
      } else {
        sanitizedData.name = trimmedName;
      }
    }
  }

  // Validate description (optional)
  if (data.description !== undefined) {
    if (data.description === null) {
      sanitizedData.description = undefined;
    } else if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    } else {
      sanitizedData.description = data.description.trim() || undefined;
    }
  }

  // Validate color (optional)
  if (data.color !== undefined) {
    if (typeof data.color !== 'string') {
      errors.push('Color must be a string');
    } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
      errors.push('Color must be a valid hex color (e.g., #3B82F6)');
    } else {
      sanitizedData.color = data.color.toUpperCase();
    }
  }

  // Validate icon (optional)
  if (data.icon !== undefined) {
    if (data.icon === null) {
      sanitizedData.icon = undefined;
    } else if (typeof data.icon !== 'string') {
      errors.push('Icon must be a string');
    } else if (data.icon.length > 50) {
      errors.push('Icon identifier must be less than 50 characters');
    } else {
      sanitizedData.icon = data.icon;
    }
  }

  // Validate settings (optional)
  if (data.settings !== undefined) {
    const settingsValidation = validateWorkspaceSettings(data.settings);
    if (!settingsValidation.isValid) {
      errors.push(...settingsValidation.errors);
    } else if (settingsValidation.sanitizedData) {
      sanitizedData.settings = settingsValidation.sanitizedData;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Check if there's actually something to update
  if (Object.keys(sanitizedData).length === 0) {
    return { 
      isValid: false, 
      errors: ['No valid fields to update'] 
    };
  }

  return { isValid: true, errors: [], sanitizedData };
}

/**
 * Validate workspace settings
 */
export function validateWorkspaceSettings(settings: any): ValidationResult & { sanitizedData?: WorkspaceSettings } {
  const errors: string[] = [];

  if (typeof settings !== 'object' || settings === null) {
    return { 
      isValid: false, 
      errors: ['Settings must be an object'] 
    };
  }

  const sanitizedData: WorkspaceSettings = {};

  // Validate features
  if (settings.features !== undefined) {
    if (typeof settings.features !== 'object' || settings.features === null) {
      errors.push('Features must be an object');
    } else {
      sanitizedData.features = {};
      
      // Validate individual feature flags
      const featureFlags = ['time_tracking', 'file_attachments', 'due_date_reminders', 'task_templates'];
      for (const flag of featureFlags) {
        if (settings.features[flag] !== undefined) {
          if (typeof settings.features[flag] !== 'boolean') {
            errors.push(`Feature ${flag} must be a boolean`);
          } else {
            sanitizedData.features[flag as keyof typeof sanitizedData.features] = settings.features[flag];
          }
        }
      }
    }
  }

  // Validate integrations
  if (settings.integrations !== undefined) {
    if (typeof settings.integrations !== 'object' || settings.integrations === null) {
      errors.push('Integrations must be an object');
    } else {
      sanitizedData.integrations = {};
      
      // Validate individual integration flags
      const integrationFlags = ['calendar', 'slack', 'email'];
      for (const flag of integrationFlags) {
        if (settings.integrations[flag] !== undefined) {
          if (typeof settings.integrations[flag] !== 'boolean') {
            errors.push(`Integration ${flag} must be a boolean`);
          } else {
            sanitizedData.integrations[flag as keyof typeof sanitizedData.integrations] = settings.integrations[flag];
          }
        }
      }
    }
  }

  // Validate security
  if (settings.security !== undefined) {
    if (typeof settings.security !== 'object' || settings.security === null) {
      errors.push('Security must be an object');
    } else {
      sanitizedData.security = {};
      
      // Validate individual security flags
      const securityFlags = ['require_task_approval', 'restrict_member_invites'];
      for (const flag of securityFlags) {
        if (settings.security[flag] !== undefined) {
          if (typeof settings.security[flag] !== 'boolean') {
            errors.push(`Security setting ${flag} must be a boolean`);
          } else {
            sanitizedData.security[flag as keyof typeof sanitizedData.security] = settings.security[flag];
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
}

/**
 * Validate workspace member role
 */
export function validateMemberRole(role: any): ValidationResult & { sanitizedData?: WorkspaceMemberRole } {
  const validRoles: WorkspaceMemberRole[] = ['owner', 'admin', 'member', 'viewer'];
  
  if (typeof role !== 'string') {
    return { 
      isValid: false, 
      errors: ['Role must be a string'] 
    };
  }

  if (!validRoles.includes(role as WorkspaceMemberRole)) {
    return { 
      isValid: false, 
      errors: [`Invalid role. Must be one of: ${validRoles.join(', ')}`] 
    };
  }

  return { 
    isValid: true, 
    errors: [], 
    sanitizedData: role as WorkspaceMemberRole 
  };
}

/**
 * Validate workspace member permissions
 */
export function validateMemberPermissions(permissions: any): ValidationResult & { sanitizedData?: WorkspacePermissions } {
  const errors: string[] = [];

  if (typeof permissions !== 'object' || permissions === null) {
    return { 
      isValid: false, 
      errors: ['Permissions must be an object'] 
    };
  }

  const sanitizedData: WorkspacePermissions = {
    read: false,
    write: false,
    delete: false,
    admin: false,
  };

  // Validate required permission fields
  const permissionFields = ['read', 'write', 'delete', 'admin'] as const;
  for (const field of permissionFields) {
    if (permissions[field] === undefined) {
      errors.push(`Permission ${field} is required`);
    } else if (typeof permissions[field] !== 'boolean') {
      errors.push(`Permission ${field} must be a boolean`);
    } else {
      sanitizedData[field] = permissions[field];
    }
  }

  // Validate permission hierarchy
  if (sanitizedData.admin && !sanitizedData.read) {
    errors.push('Admin permission requires read permission');
  }
  if (sanitizedData.write && !sanitizedData.read) {
    errors.push('Write permission requires read permission');
  }
  if (sanitizedData.delete && !sanitizedData.write) {
    errors.push('Delete permission requires write permission');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: any): ValidationResult & { sanitizedData?: string } {
  if (typeof email !== 'string') {
    return { 
      isValid: false, 
      errors: ['Email must be a string'] 
    };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  if (trimmedEmail.length === 0) {
    return { 
      isValid: false, 
      errors: ['Email is required'] 
    };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { 
      isValid: false, 
      errors: ['Invalid email format'] 
    };
  }

  if (trimmedEmail.length > 254) {
    return { 
      isValid: false, 
      errors: ['Email address too long'] 
    };
  }

  return { 
    isValid: true, 
    errors: [], 
    sanitizedData: trimmedEmail 
  };
}