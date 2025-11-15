// =============================================
// ACTIVITY EXPORT CONTAINER HOOK
// =============================================
// Container logic for exporting activity data

import { useState, useCallback, useMemo } from 'react';
import type { 
  ActivityFeedItem, 
  EventFilters,
  EventCategory,
  EventType,
  EntityType 
} from '@/types/database';

export interface UseActivityExportProps {
  workspaceId?: string;
  activityData?: ActivityFeedItem[];
  onExportStart?: (format: ExportFormat, options: ExportOptions) => void;
  onExportComplete?: (result: ExportResult) => void;
  onExportError?: (error: string) => void;
}

export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf' | 'txt';

export interface ExportOptions {
  format: ExportFormat;
  dateRange: {
    from: string | null;
    to: string | null;
  };
  filters: EventFilters;
  includeMetadata: boolean;
  includeChanges: boolean;
  includeContext: boolean;
  customFields: string[];
  compression: boolean;
  password?: string;
  groupBy?: 'date' | 'user' | 'event_type' | 'entity' | 'none';
  sortBy?: 'date' | 'user' | 'event_type' | 'entity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  template?: 'standard' | 'detailed' | 'summary' | 'audit';
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  exportTime: number; // milliseconds
  format: ExportFormat;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  options: Partial<ExportOptions>;
  fields: ExportField[];
}

export interface ExportField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  required: boolean;
  description?: string;
  format?: string; // For date formatting, number formatting, etc.
}

export interface ExportProgress {
  stage: 'preparing' | 'filtering' | 'formatting' | 'compressing' | 'uploading' | 'complete';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
}

export interface UseActivityExportReturn {
  // Export state
  isExporting: boolean;
  progress: ExportProgress | null;
  lastExport: ExportResult | null;
  
  // Export options
  options: ExportOptions;
  setOptions: (options: Partial<ExportOptions>) => void;
  resetOptions: () => void;
  
  // Export actions
  startExport: () => Promise<ExportResult>;
  cancelExport: () => void;
  
  // Templates
  templates: ExportTemplate[];
  applyTemplate: (template: ExportTemplate) => void;
  saveAsTemplate: (name: string, description: string) => ExportTemplate;
  
  // Field management
  availableFields: ExportField[];
  selectedFields: string[];
  setSelectedFields: (fields: string[]) => void;
  
  // Preview
  previewData: any[];
  generatePreview: () => Promise<any[]>;
  
  // Validation
  validateOptions: () => string[];
  canExport: boolean;
  
  // Formatting helpers
  formatDataForExport: (data: ActivityFeedItem[], format: ExportFormat) => string | Blob;
  generateFileName: (format: ExportFormat) => string;
  estimateFileSize: () => number;
}

const defaultOptions: ExportOptions = {
  format: 'json',
  dateRange: {
    from: null,
    to: null
  },
  filters: {
    event_type: [],
    entity_type: [],
    category: [],
    severity: [],
    source: [],
    user_id: undefined,
    workspace_id: undefined,
    date_from: undefined,
    date_to: undefined,
    tags: [],
    correlation_id: undefined
  },
  includeMetadata: true,
  includeChanges: true,
  includeContext: false,
  customFields: [],
  compression: false,
  groupBy: 'none',
  sortBy: 'date',
  sortOrder: 'desc',
  template: 'standard'
};

export const useActivityExport = ({
  workspaceId,
  activityData = [],
  onExportStart,
  onExportComplete,
  onExportError
}: UseActivityExportProps): UseActivityExportReturn => {
  // State
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [lastExport, setLastExport] = useState<ExportResult | null>(null);
  const [options, setOptionsState] = useState<ExportOptions>(defaultOptions);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'id', 'event_type', 'entity_type', 'user_name', 'created_at', 'description'
  ]);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Available export fields
  const availableFields: ExportField[] = [
    { key: 'id', label: 'Event ID', type: 'string', required: true },
    { key: 'event_type', label: 'Event Type', type: 'string', required: false },
    { key: 'entity_type', label: 'Entity Type', type: 'string', required: false },
    { key: 'entity_id', label: 'Entity ID', type: 'string', required: false },
    { key: 'user_name', label: 'User Name', type: 'string', required: false },
    { key: 'workspace_name', label: 'Workspace Name', type: 'string', required: false },
    { key: 'description', label: 'Description', type: 'string', required: false },
    { key: 'created_at', label: 'Created At', type: 'date', required: false, format: 'ISO' },
    { key: 'category', label: 'Category', type: 'string', required: false },
    { key: 'severity', label: 'Severity', type: 'string', required: false },
    { key: 'context', label: 'Context', type: 'object', required: false, description: 'Event context data' }
  ];

  // Export templates
  const templates: ExportTemplate[] = [
    {
      id: 'standard',
      name: 'Standard Export',
      description: 'Basic event information for general use',
      format: 'json',
      options: {
        includeMetadata: true,
        includeChanges: false,
        includeContext: false,
        template: 'standard'
      },
      fields: [
        { key: 'id', label: 'Event ID', type: 'string', required: true },
        { key: 'event_type', label: 'Event Type', type: 'string', required: false },
        { key: 'user_name', label: 'User Name', type: 'string', required: false },
        { key: 'created_at', label: 'Created At', type: 'date', required: false },
        { key: 'description', label: 'Description', type: 'string', required: false }
      ]
    },
    {
      id: 'detailed',
      name: 'Detailed Export',
      description: 'Complete event data with metadata and context',
      format: 'json',
      options: {
        includeMetadata: true,
        includeChanges: true,
        includeContext: true,
        template: 'detailed'
      },
      fields: availableFields
    },
    {
      id: 'summary',
      name: 'Summary Report',
      description: 'Condensed view for reporting',
      format: 'csv',
      options: {
        includeMetadata: false,
        includeChanges: false,
        includeContext: false,
        groupBy: 'date',
        template: 'summary'
      },
      fields: [
        { key: 'event_type', label: 'Event Type', type: 'string', required: false },
        { key: 'user_name', label: 'User Name', type: 'string', required: false },
        { key: 'created_at', label: 'Date', type: 'date', required: false, format: 'YYYY-MM-DD' },
        { key: 'description', label: 'Description', type: 'string', required: false }
      ]
    },
    {
      id: 'audit',
      name: 'Audit Trail',
      description: 'Compliance-focused export with full traceability',
      format: 'pdf',
      options: {
        includeMetadata: true,
        includeChanges: true,
        includeContext: true,
        sortBy: 'date',
        sortOrder: 'asc',
        template: 'audit'
      },
      fields: availableFields
    }
  ];

  // Update options
  const setOptions = useCallback((newOptions: Partial<ExportOptions>) => {
    setOptionsState(prev => ({ ...prev, ...newOptions }));
  }, []);

  const resetOptions = useCallback(() => {
    setOptionsState(defaultOptions);
    setSelectedFields(['id', 'event_type', 'entity_type', 'user_name', 'created_at', 'description']);
  }, []);

  // Filter and sort data based on options
  const processedData = useMemo(() => {
    let filtered = [...activityData];

    // Apply date range filter
    if (options.dateRange.from) {
      const fromDate = new Date(options.dateRange.from);
      filtered = filtered.filter(item => new Date(item.created_at) >= fromDate);
    }
    
    if (options.dateRange.to) {
      const toDate = new Date(options.dateRange.to);
      filtered = filtered.filter(item => new Date(item.created_at) <= toDate);
    }

    // Apply filters
    const { filters } = options;
    
    if (filters.event_type && filters.event_type.length > 0) {
      filtered = filtered.filter(item => filters.event_type!.includes(item.event_type));
    }
    
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(item => filters.category!.includes(item.category));
    }

    if (filters.entity_type && filters.entity_type.length > 0) {
      filtered = filtered.filter(item => filters.entity_type!.includes(item.entity_type));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (options.sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'user':
          comparison = (a.user_name || '').localeCompare(b.user_name || '');
          break;
        case 'event_type':
          comparison = a.event_type.localeCompare(b.event_type);
          break;
        case 'entity':
          comparison = a.entity_type.localeCompare(b.entity_type);
          break;
        default:
          comparison = 0;
      }
      
      return options.sortOrder === 'desc' ? -comparison : comparison;
    });

    // Apply limit
    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }, [activityData, options]);

  // Validation
  const validateOptions = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (selectedFields.length === 0) {
      errors.push('At least one field must be selected');
    }
    
    if (options.dateRange.from && options.dateRange.to) {
      if (new Date(options.dateRange.from) > new Date(options.dateRange.to)) {
        errors.push('Start date must be before end date');
      }
    }
    
    if (options.password && options.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    return errors;
  }, [selectedFields, options]);

  const canExport = useMemo(() => {
    return validateOptions().length === 0 && !isExporting && processedData.length > 0;
  }, [validateOptions, isExporting, processedData]);

  // Generate preview
  const generatePreview = useCallback(async (): Promise<any[]> => {
    const preview = processedData.slice(0, 10).map(item => {
      const previewItem: any = {};
      
      selectedFields.forEach(fieldKey => {
        const field = availableFields.find(f => f.key === fieldKey);
        if (field) {
          let value = (item as any)[fieldKey];
          
          // Format value based on field type
          if (field.type === 'date' && value) {
            if (field.format === 'YYYY-MM-DD') {
              value = new Date(value).toISOString().split('T')[0];
            } else {
              value = new Date(value).toISOString();
            }
          } else if (field.type === 'object' && value) {
            value = JSON.stringify(value);
          }
          
          previewItem[field.label] = value || '';
        }
      });
      
      return previewItem;
    });
    
    setPreviewData(preview);
    return preview;
  }, [processedData, selectedFields, availableFields]);

  // Format data for export
  const formatDataForExport = useCallback((data: ActivityFeedItem[], format: ExportFormat): string | Blob => {
    const exportData = data.map(item => {
      const exportItem: any = {};
      
      selectedFields.forEach(fieldKey => {
        const field = availableFields.find(f => f.key === fieldKey);
        if (field) {
          let value = (item as any)[fieldKey];
          
          // Apply field formatting
          if (field.type === 'date' && value) {
            if (field.format === 'YYYY-MM-DD') {
              value = new Date(value).toISOString().split('T')[0];
            } else {
              value = new Date(value).toISOString();
            }
          } else if (field.type === 'object' && value) {
            if (format === 'json') {
              // Keep as object for JSON
            } else {
              value = JSON.stringify(value);
            }
          }
          
          exportItem[field.key] = value;
        }
      });
      
      return exportItem;
    });

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      
      case 'csv':
        if (exportData.length === 0) return '';
        
        const headers = selectedFields.map(fieldKey => {
          const field = availableFields.find(f => f.key === fieldKey);
          return field?.label || fieldKey;
        });
        
        const csvContent = [
          headers.join(','),
          ...exportData.map(row =>
            selectedFields.map(fieldKey => {
              const value = row[fieldKey];
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value || '';
            }).join(',')
          )
        ].join('\n');
        
        return csvContent;
      
      case 'txt':
        return exportData.map(item => 
          selectedFields.map(fieldKey => {
            const field = availableFields.find(f => f.key === fieldKey);
            const label = field?.label || fieldKey;
            const value = item[fieldKey] || 'N/A';
            return `${label}: ${value}`;
          }).join('\n')
        ).join('\n\n---\n\n');
      
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }, [selectedFields, availableFields]);

  // Generate filename
  const generateFileName = useCallback((format: ExportFormat): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const workspace = workspaceId ? `workspace-${workspaceId}` : 'activity';
    return `${workspace}-export-${timestamp}.${format}`;
  }, [workspaceId]);

  // Estimate file size
  const estimateFileSize = useCallback((): number => {
    const sampleData = formatDataForExport(processedData.slice(0, 10), options.format);
    const sampleSize = new Blob([sampleData]).size;
    return Math.round((sampleSize * processedData.length) / 10);
  }, [formatDataForExport, processedData, options.format]);

  // Start export
  const startExport = useCallback(async (): Promise<ExportResult> => {
    if (!canExport) {
      throw new Error('Export validation failed');
    }

    setIsExporting(true);
    setProgress({
      stage: 'preparing',
      progress: 0,
      message: 'Preparing export...'
    });

    try {
      const startTime = Date.now();
      onExportStart?.(options.format, options);

      // Simulate export progress
      setProgress({
        stage: 'filtering',
        progress: 20,
        message: 'Filtering data...'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress({
        stage: 'formatting',
        progress: 60,
        message: 'Formatting data...'
      });

      const exportContent = formatDataForExport(processedData, options.format);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress({
        stage: 'compressing',
        progress: 80,
        message: 'Finalizing...'
      });

      // Create download
      const fileName = generateFileName(options.format);
      const blob = new Blob([exportContent], {
        type: options.format === 'json' ? 'application/json' : 
              options.format === 'csv' ? 'text/csv' : 'text/plain'
      });
      
      const downloadUrl = URL.createObjectURL(blob);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Export complete!'
      });

      const result: ExportResult = {
        success: true,
        downloadUrl,
        fileName,
        fileSize: blob.size,
        recordCount: processedData.length,
        exportTime: Date.now() - startTime,
        format: options.format
      };

      setLastExport(result);
      onExportComplete?.(result);

      // Cleanup URL after a delay
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      onExportError?.(errorMessage);
      throw error;
    } finally {
      setIsExporting(false);
      setTimeout(() => setProgress(null), 2000);
    }
  }, [canExport, options, processedData, formatDataForExport, generateFileName, onExportStart, onExportComplete, onExportError]);

  // Cancel export
  const cancelExport = useCallback(() => {
    setIsExporting(false);
    setProgress(null);
  }, []);

  // Template management
  const applyTemplate = useCallback((template: ExportTemplate) => {
    setOptions({
      format: template.format,
      ...template.options
    });
    
    const templateFieldKeys = template.fields.map(f => f.key);
    setSelectedFields(templateFieldKeys);
  }, [setOptions]);

  const saveAsTemplate = useCallback((name: string, description: string): ExportTemplate => {
    const template: ExportTemplate = {
      id: `custom_${Date.now()}`,
      name,
      description,
      format: options.format,
      options: { ...options },
      fields: availableFields.filter(f => selectedFields.includes(f.key))
    };

    // In a real app, this would save to backend/localStorage
    console.log('Saving template:', template);
    
    return template;
  }, [options, availableFields, selectedFields]);

  return {
    isExporting,
    progress,
    lastExport,
    options,
    setOptions,
    resetOptions,
    startExport,
    cancelExport,
    templates,
    applyTemplate,
    saveAsTemplate,
    availableFields,
    selectedFields,
    setSelectedFields,
    previewData,
    generatePreview,
    validateOptions,
    canExport,
    formatDataForExport,
    generateFileName,
    estimateFileSize
  };
};