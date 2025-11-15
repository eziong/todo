// =============================================
// SECTION VALIDATION UTILITIES
// =============================================
// Validation functions for section-related data

import type { 
  SectionInsert, 
  SectionUpdate,
  SectionFormData 
} from '@/database/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

/**
 * Predefined color palette for sections
 */
export const SECTION_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
] as const;

/**
 * Validate section creation data
 */
export function validateSectionCreate(data: any): ValidationResult & { sanitizedData?: SectionInsert } {
  const errors: string[] = [];

  // Validate workspace_id (required)
  if (!data.workspace_id || typeof data.workspace_id !== 'string') {
    errors.push('Workspace ID is required');
  } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.workspace_id)) {
    errors.push('Invalid workspace ID format');
  }

  // Validate name (required)
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Section name is required');
  } else {
    const trimmedName = data.name.trim();
    if (trimmedName.length === 0) {
      errors.push('Section name cannot be empty');
    } else if (trimmedName.length > 100) {
      errors.push('Section name must be less than 100 characters');
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

  // Validate position (required)
  let validPosition = 0;
  if (data.position !== undefined) {
    if (typeof data.position !== 'number' || !Number.isInteger(data.position) || data.position < 0) {
      errors.push('Position must be a non-negative integer');
    } else {
      validPosition = data.position;
    }
  }

  // Validate color (optional with default)
  let validColor = SECTION_COLORS[0]; // Default to first color
  if (data.color) {
    if (typeof data.color !== 'string') {
      errors.push('Color must be a string');
    } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
      errors.push('Color must be a valid hex color (e.g., #3B82F6)');
    } else {
      validColor = data.color.toUpperCase();
    }
  }

  // Validate is_archived (optional with default)
  let validIsArchived = false;
  if (data.is_archived !== undefined) {
    if (typeof data.is_archived !== 'boolean') {
      errors.push('is_archived must be a boolean');
    } else {
      validIsArchived = data.is_archived;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const sanitizedData: SectionInsert = {
    workspace_id: data.workspace_id,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    position: validPosition,
    color: validColor,
    is_archived: validIsArchived,
  };

  return { isValid: true, errors: [], sanitizedData };
}

/**
 * Validate section update data
 */
export function validateSectionUpdate(data: any): ValidationResult & { sanitizedData?: SectionUpdate } {
  const errors: string[] = [];
  const sanitizedData: SectionUpdate = {};

  // Validate name (optional for updates)
  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Section name cannot be empty');
    } else {
      const trimmedName = data.name.trim();
      if (trimmedName.length === 0) {
        errors.push('Section name cannot be empty');
      } else if (trimmedName.length > 100) {
        errors.push('Section name must be less than 100 characters');
      } else {
        sanitizedData.name = trimmedName;
      }
    }
  }

  // Validate description (optional)
  if (data.description !== undefined) {
    if (data.description === null) {
      sanitizedData.description = null;
    } else if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    } else {
      sanitizedData.description = data.description.trim() || null;
    }
  }

  // Validate position (optional)
  if (data.position !== undefined) {
    if (typeof data.position !== 'number' || !Number.isInteger(data.position) || data.position < 0) {
      errors.push('Position must be a non-negative integer');
    } else {
      sanitizedData.position = data.position;
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

  // Validate is_archived (optional)
  if (data.is_archived !== undefined) {
    if (typeof data.is_archived !== 'boolean') {
      errors.push('is_archived must be a boolean');
    } else {
      sanitizedData.is_archived = data.is_archived;
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
 * Validate section form data (for UI forms)
 */
export function validateSectionForm(data: any): ValidationResult & { sanitizedData?: SectionFormData } {
  const errors: string[] = [];

  // Validate name (required)
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Section name is required');
  } else {
    const trimmedName = data.name.trim();
    if (trimmedName.length === 0) {
      errors.push('Section name cannot be empty');
    } else if (trimmedName.length > 100) {
      errors.push('Section name must be less than 100 characters');
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

  // Validate color (required for forms)
  let validColor = SECTION_COLORS[0]; // Default
  if (!data.color) {
    // Use default color if not provided
  } else if (typeof data.color !== 'string') {
    errors.push('Color must be a string');
  } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
    errors.push('Color must be a valid hex color (e.g., #3B82F6)');
  } else {
    validColor = data.color.toUpperCase();
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const sanitizedData: SectionFormData = {
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    color: validColor,
  };

  return { isValid: true, errors: [], sanitizedData };
}

/**
 * Validate section reorder data
 */
export function validateSectionReorder(data: any): ValidationResult & { 
  sanitizedData?: { sections: Array<{ id: string; position: number }> } 
} {
  const errors: string[] = [];

  if (!Array.isArray(data.sections)) {
    return { isValid: false, errors: ['Sections must be an array'] };
  }

  if (data.sections.length === 0) {
    return { isValid: false, errors: ['Sections array cannot be empty'] };
  }

  const sanitizedSections: Array<{ id: string; position: number }> = [];
  const seenIds = new Set<string>();
  const seenPositions = new Set<number>();

  for (let i = 0; i < data.sections.length; i++) {
    const section = data.sections[i];

    // Validate section structure
    if (typeof section !== 'object' || section === null) {
      errors.push(`Section at index ${i} must be an object`);
      continue;
    }

    // Validate section ID
    if (!section.id || typeof section.id !== 'string') {
      errors.push(`Section at index ${i} must have a valid ID`);
      continue;
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(section.id)) {
      errors.push(`Section at index ${i} has invalid ID format`);
      continue;
    }

    if (seenIds.has(section.id)) {
      errors.push(`Duplicate section ID: ${section.id}`);
      continue;
    }

    // Validate position
    if (typeof section.position !== 'number' || !Number.isInteger(section.position) || section.position < 0) {
      errors.push(`Section at index ${i} must have a valid position (non-negative integer)`);
      continue;
    }

    if (seenPositions.has(section.position)) {
      errors.push(`Duplicate position: ${section.position}`);
      continue;
    }

    seenIds.add(section.id);
    seenPositions.add(section.position);
    sanitizedSections.push({
      id: section.id,
      position: section.position,
    });
  }

  // Validate that positions are sequential starting from 0
  const positions = sanitizedSections.map(s => s.position).sort((a, b) => a - b);
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] !== i) {
      errors.push('Positions must be sequential starting from 0');
      break;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitizedData: { sections: sanitizedSections },
  };
}

/**
 * Check if a color is in the predefined palette
 */
export function isValidSectionColor(color: string): boolean {
  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    return false;
  }
  return SECTION_COLORS.includes(color.toUpperCase() as any);
}

/**
 * Get the next available color from the palette
 */
export function getNextSectionColor(usedColors: string[]): string {
  const normalizedUsedColors = usedColors.map(c => c.toUpperCase());
  
  for (const color of SECTION_COLORS) {
    if (!normalizedUsedColors.includes(color)) {
      return color;
    }
  }
  
  // If all colors are used, return the first one
  return SECTION_COLORS[0];
}