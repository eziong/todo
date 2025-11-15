'use client';

import React, { useState, useRef, useEffect, ReactNode, FormEvent } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  FormHelperText, 
  FormLabel,
  Alert,
  Typography
} from '@mui/material';
import { useAccessibility } from '../AccessibilityProvider';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio';
  value: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  autoComplete?: string;
  'aria-describedby'?: string;
}

interface AccessibleFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => Promise<void> | void;
  title: string;
  description?: string;
  submitButtonText?: string;
  resetButtonText?: string;
  children?: ReactNode;
  className?: string;
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  fields,
  onSubmit,
  title,
  description,
  submitButtonText = 'Submit',
  resetButtonText = 'Reset',
  children,
  className
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  const firstErrorRef = useRef<HTMLElement>(null);
  const { announce } = useAccessibility();

  // Initialize form data
  useEffect(() => {
    const initialData: Record<string, string> = {};
    fields.forEach(field => {
      initialData[field.name] = field.value || '';
    });
    setFormData(initialData);
  }, [fields]);

  // Focus first error field when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0 && firstErrorRef.current) {
      firstErrorRef.current.focus();
      announce(`Form has ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''}`, 'assertive');
    }
  }, [errors, announce]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.name]?.trim() || '';

      // Required field validation
      if (field.required && !value) {
        newErrors[field.name] = `${field.label} is required`;
      }

      // Email validation
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field.name] = 'Please enter a valid email address';
      }

      // Password validation (basic)
      if (field.type === 'password' && value && value.length < 8) {
        newErrors[field.name] = 'Password must be at least 8 characters long';
      }

      // Custom field error
      if (field.error) {
        newErrors[field.name] = field.error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await onSubmit(formData);
      setSubmitStatus('success');
      announce('Form submitted successfully', 'assertive');
    } catch (error) {
      setSubmitStatus('error');
      announce('Form submission failed. Please try again.', 'assertive');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const resetData: Record<string, string> = {};
    fields.forEach(field => {
      resetData[field.name] = '';
    });
    setFormData(resetData);
    setErrors({});
    setSubmitStatus('idle');
    announce('Form has been reset', 'polite');
  };

  const renderField = (field: FormField, index: number) => {
    const isFirstError = Object.keys(errors).indexOf(field.name) === 0;
    const fieldId = `${field.id || field.name}`;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;
    
    const commonProps = {
      id: fieldId,
      name: field.name,
      value: formData[field.name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(field.name, e.target.value),
      error: Boolean(errors[field.name]),
      required: field.required,
      autoComplete: field.autoComplete,
      'aria-describedby': [
        errors[field.name] ? errorId : null,
        field.helperText ? helperId : null,
        field['aria-describedby']
      ].filter(Boolean).join(' ') || undefined,
      ref: isFirstError ? firstErrorRef : undefined
    };

    return (
      <FormControl key={field.name} fullWidth margin="normal" error={Boolean(errors[field.name])}>
        <FormLabel 
          htmlFor={fieldId}
          required={field.required}
          sx={{ 
            mb: 1,
            fontWeight: 600,
            color: errors[field.name] ? 'error.main' : 'text.primary'
          }}
        >
          {field.label}
          {field.required && (
            <span aria-label="required" style={{ color: 'red', marginLeft: 4 }}>
              *
            </span>
          )}
        </FormLabel>

        {field.type === 'textarea' ? (
          <TextField
            {...commonProps}
            multiline
            rows={4}
            placeholder={field.placeholder}
            helperText={errors[field.name] || field.helperText}
          />
        ) : (
          <TextField
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder}
            helperText={errors[field.name] || field.helperText}
          />
        )}

        {/* Screen reader error announcement */}
        {errors[field.name] && (
          <div
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="sr-only"
          >
            Error: {errors[field.name]}
          </div>
        )}

        {/* Helper text for screen readers */}
        {field.helperText && !errors[field.name] && (
          <FormHelperText id={helperId}>
            {field.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  };

  return (
    <Box className={className}>
      {/* Form heading and description */}
      <Typography 
        variant="h2" 
        component="h1" 
        sx={{ mb: 2, fontSize: '1.5rem', fontWeight: 600 }}
        id="form-title"
      >
        {title}
      </Typography>
      
      {description && (
        <Typography 
          variant="body1" 
          sx={{ mb: 3, color: 'text.secondary' }}
          id="form-description"
        >
          {description}
        </Typography>
      )}

      {/* Status messages */}
      {submitStatus === 'success' && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          role="status"
          aria-live="polite"
        >
          Form submitted successfully!
        </Alert>
      )}

      {submitStatus === 'error' && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          role="alert"
          aria-live="assertive"
        >
          There was an error submitting the form. Please try again.
        </Alert>
      )}

      {/* Form */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby="form-title"
        aria-describedby={description ? "form-description" : undefined}
      >
        <fieldset disabled={isSubmitting}>
          <legend className="sr-only">
            {title} {fields.filter(f => f.required).length > 0 && '(Required fields marked with asterisk)'}
          </legend>

          {/* Render form fields */}
          {fields.map(renderField)}

          {/* Custom children */}
          {children}

          {/* Form actions */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              aria-describedby={isSubmitting ? "submit-status" : undefined}
            >
              {isSubmitting ? 'Submitting...' : submitButtonText}
            </Button>

            <Button
              type="button"
              variant="outlined"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              {resetButtonText}
            </Button>
          </Box>

          {/* Submit status for screen readers */}
          {isSubmitting && (
            <div
              id="submit-status"
              role="status"
              aria-live="polite"
              className="sr-only"
            >
              Submitting form, please wait...
            </div>
          )}
        </fieldset>
      </form>
    </Box>
  );
};