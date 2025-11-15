// =============================================
// USER PROFILE CONTAINER HOOK
// =============================================
// Container logic for user profile management

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '../AuthProvider';
import type { UserUpdate, UserPreferences, User } from '@/database/types';

export interface ProfileFormData {
  name: string;
  email: string;
  timezone: string;
  avatar_url?: string;
  preferences: UserPreferences;
}

export interface UseUserProfileReturn {
  user: User | null; // User from auth context
  formData: ProfileFormData;
  loading: boolean;
  saving: boolean;
  error: string | null;
  isDirty: boolean;
  validationErrors: Record<string, string>;
  updateFormData: (field: keyof ProfileFormData, value: unknown) => void;
  updatePreference: (path: string, value: unknown) => void;
  handleSave: () => Promise<void>;
  handleReset: () => void;
  clearError: () => void;
}

/**
 * User profile container hook
 * Manages profile form state and update operations
 */
export const useUserProfile = (): UseUserProfileReturn => {
  const { user, updateProfile, loading: authLoading } = useAuthContext();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    timezone: 'UTC',
    avatar_url: '',
    preferences: {
      theme: 'auto',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        task_assignments: true,
        due_date_reminders: true,
      },
      ui: {
        compact_mode: false,
        show_completed_tasks: true,
        default_view: 'list',
      },
    },
  });

  const [originalData, setOriginalData] = useState<ProfileFormData>(formData);
  const [, /*setLoading*/] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      const userData: ProfileFormData = {
        name: user.name || '',
        email: user.email || '',
        timezone: user.timezone || 'UTC',
        avatar_url: user.avatar_url || '',
        preferences: user.preferences || {
          theme: 'auto',
          language: 'en',
          timezone: user.timezone || 'UTC',
          notifications: {
            email: true,
            push: true,
            task_assignments: true,
            due_date_reminders: true,
          },
          ui: {
            compact_mode: false,
            show_completed_tasks: true,
            default_view: 'list',
          },
        },
      };

      setFormData(userData);
      setOriginalData(userData);
    }
  }, [user]);

  // Check if form has changes
  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors({});
  }, []);

  // Update form data
  const updateFormData = useCallback((field: keyof ProfileFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  // Update nested preference
  const updatePreference = useCallback((path: string, value: unknown) => {
    const pathParts = path.split('.');
    
    setFormData(prev => {
      const newPreferences = { ...prev.preferences };
      let current: any = newPreferences;
      
      // Navigate to the parent of the target property
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        current[part] = { ...current[part] };
        current = current[part];
      }
      
      // Set the target property
      current[pathParts[pathParts.length - 1]] = value;
      
      return {
        ...prev,
        preferences: newPreferences,
      };
    });
  }, []);

  // Validate form data
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Save profile changes
  const handleSave = useCallback(async (): Promise<void> => {
    try {
      setSaving(true);
      clearError();

      // Validate form
      if (!validateForm()) {
        return;
      }

      // Prepare update data
      const updateData: UserUpdate = {
        name: formData.name.trim(),
        timezone: formData.timezone,
        avatar_url: formData.avatar_url || undefined,
        preferences: formData.preferences,
        last_active_at: new Date().toISOString(),
      };

      // Only include email if it's different (email updates may require special handling)
      if (formData.email !== user?.email) {
        // Note: Email updates in Supabase typically require email verification
        // Will need special handling and verification
      }

      await updateProfile(updateData);
      setOriginalData(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, updateProfile, clearError, user?.email]);

  // Reset form to original values
  const handleReset = useCallback(() => {
    setFormData(originalData);
    setValidationErrors({});
    clearError();
  }, [originalData, clearError]);

  return {
    user,
    formData,
    loading: authLoading,
    saving,
    error,
    isDirty,
    validationErrors,
    updateFormData,
    updatePreference,
    handleSave,
    handleReset,
    clearError,
  };
};