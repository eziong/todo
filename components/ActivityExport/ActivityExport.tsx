// =============================================
// ACTIVITY EXPORT PRESENTER COMPONENT
// =============================================
// Export interface for activity data with Material UI styling

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Switch,
  Grid,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  GetApp as ExportIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  DateRange as DateIcon,
  FilterList as FilterIcon,
  ViewColumn as ColumnsIcon,
  Description as FileIcon,
  Compress as CompressIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { styled, useTheme } from '@mui/material/styles';
import { 
  useActivityExport, 
  UseActivityExportProps,
  ExportFormat,
  ExportTemplate,
  ExportProgress 
} from './useActivityExport';
import { ActivityFilters } from '../ActivityFilters';
import type { ActivityFeedItem } from '@/types/database';

// =============================================
// STYLED COMPONENTS
// =============================================

const ExportCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.macOS.borderRadius.large,
  boxShadow: theme.macOS.shadows.card,
  border: theme.palette.mode === 'light' ? 'none' : `1px solid ${theme.palette.divider}`,
}));

const FormatCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.macOS.borderRadius.medium,
  border: `2px solid transparent`,
  cursor: 'pointer',
  transition: theme.macOS.animation.fast,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.macOS.shadows.medium,
  },
  '&.selected': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '10',
  },
}));

const ProgressCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.macOS.borderRadius.medium,
  backgroundColor: theme.palette.mode === 'light' 
    ? theme.palette.info.light + '20' 
    : theme.palette.info.dark + '20',
  border: `1px solid ${theme.palette.info.main}40`,
}));

// =============================================
// HELPER COMPONENTS
// =============================================

interface FormatSelectorProps {
  selectedFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onFormatChange
}) => {
  const formatOptions: Array<{
    format: ExportFormat;
    label: string;
    description: string;
    icon: string;
    features: string[];
  }> = [
    {
      format: 'json',
      label: 'JSON',
      description: 'Structured data format',
      icon: '📄',
      features: ['Preserves data structure', 'Machine readable', 'Nested objects']
    },
    {
      format: 'csv',
      label: 'CSV',
      description: 'Spreadsheet compatible',
      icon: '📊',
      features: ['Excel compatible', 'Lightweight', 'Wide compatibility']
    },
    {
      format: 'xlsx',
      label: 'Excel',
      description: 'Microsoft Excel format',
      icon: '📈',
      features: ['Native Excel format', 'Multiple sheets', 'Formatting']
    },
    {
      format: 'pdf',
      label: 'PDF',
      description: 'Document format',
      icon: '📋',
      features: ['Print ready', 'Fixed layout', 'Professional']
    },
    {
      format: 'txt',
      label: 'Text',
      description: 'Plain text format',
      icon: '📝',
      features: ['Human readable', 'Universal', 'Simple']
    }
  ];

  return (
    <Grid container spacing={2}>
      {formatOptions.map((option) => (
        <Grid item xs={12} sm={6} md={4} key={option.format}>
          <FormatCard
            className={selectedFormat === option.format ? 'selected' : ''}
            onClick={() => onFormatChange(option.format)}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography fontSize="2rem" sx={{ mb: 1 }}>
                {option.icon}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                {option.label}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {option.description}
              </Typography>
              
              <Stack spacing={0.5}>
                {option.features.map((feature, index) => (
                  <Typography key={index} variant="caption" color="text.secondary">
                    • {feature}
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </FormatCard>
        </Grid>
      ))}
    </Grid>
  );
};

interface FieldSelectorProps {
  availableFields: Array<{ key: string; label: string; type: string; required: boolean }>;
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

const FieldSelector: React.FC<FieldSelectorProps> = ({
  availableFields,
  selectedFields,
  onFieldsChange
}) => {
  const handleToggleField = (fieldKey: string, required: boolean) => {
    if (required) return; // Can't deselect required fields
    
    if (selectedFields.includes(fieldKey)) {
      onFieldsChange(selectedFields.filter(key => key !== fieldKey));
    } else {
      onFieldsChange([...selectedFields, fieldKey]);
    }
  };

  const handleSelectAll = () => {
    onFieldsChange(availableFields.map(f => f.key));
  };

  const handleSelectNone = () => {
    const requiredFields = availableFields.filter(f => f.required).map(f => f.key);
    onFieldsChange(requiredFields);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
        <Typography variant="subtitle1">Select Fields to Export</Typography>
        
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button size="small" onClick={handleSelectNone}>
            Select None
          </Button>
        </Stack>
      </Box>

      <FormGroup>
        <Grid container spacing={1}>
          {availableFields.map((field) => (
            <Grid item xs={12} sm={6} md={4} key={field.key}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFields.includes(field.key)}
                    onChange={() => handleToggleField(field.key, field.required)}
                    disabled={field.required}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      {field.label}
                      {field.required && <Chip label="Required" size="small" sx={{ ml: 1 }} />}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {field.type}
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          ))}
        </Grid>
      </FormGroup>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {selectedFields.length} of {availableFields.length} fields selected
      </Typography>
    </Box>
  );
};

interface TemplateManagerProps {
  templates: ExportTemplate[];
  onApplyTemplate: (template: ExportTemplate) => void;
  onSaveTemplate: (name: string, description: string) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  onApplyTemplate,
  onSaveTemplate
}) => {
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [templateName, setTemplateName] = React.useState('');
  const [templateDescription, setTemplateDescription] = React.useState('');

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      onSaveTemplate(templateName.trim(), templateDescription.trim());
      setTemplateName('');
      setTemplateDescription('');
      setSaveDialogOpen(false);
    }
  };

  return (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <SettingsIcon color="action" />
            <Typography variant="subtitle1">Export Templates</Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} key={template.id}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {template.name}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      {template.description}
                    </Typography>
                    
                    <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
                      <Chip label={template.format.toUpperCase()} size="small" />
                      <Chip label={`${template.fields.length} fields`} size="small" variant="outlined" />
                    </Stack>
                    
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onApplyTemplate(template)}
                      fullWidth
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box mt={2} textAlign="center">
            <Button
              startIcon={<SaveIcon />}
              onClick={() => setSaveDialogOpen(true)}
              variant="outlined"
            >
              Save Current Settings as Template
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Export Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Description"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

interface ExportPreviewProps {
  previewData: any[];
  onGeneratePreview: () => Promise<void>;
  loading: boolean;
}

const ExportPreview: React.FC<ExportPreviewProps> = ({
  previewData,
  onGeneratePreview,
  loading
}) => (
  <Box>
    <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
      <Typography variant="subtitle1">Export Preview</Typography>
      
      <Button
        startIcon={<PreviewIcon />}
        onClick={onGeneratePreview}
        disabled={loading}
        size="small"
      >
        {loading ? 'Generating...' : 'Generate Preview'}
      </Button>
    </Box>

    {previewData.length > 0 ? (
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {Object.keys(previewData[0]).map((key) => (
                <TableCell key={key} sx={{ fontWeight: 600 }}>
                  {key}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {previewData.map((row, index) => (
              <TableRow key={index}>
                {Object.values(row).map((value: any, cellIndex) => (
                  <TableCell key={cellIndex}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ) : (
      <Alert severity="info">
        Click "Generate Preview" to see a sample of your export data
      </Alert>
    )}
  </Box>
);

interface ExportProgressProps {
  progress: ExportProgress;
}

const ExportProgressDisplay: React.FC<ExportProgressProps> = ({ progress }) => {
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'complete': return <CheckIcon color="success" />;
      case 'filtering': return <FilterIcon color="primary" />;
      case 'formatting': return <FileIcon color="primary" />;
      case 'compressing': return <CompressIcon color="primary" />;
      default: return <InfoIcon color="primary" />;
    }
  };

  return (
    <ProgressCard>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          {getStageIcon(progress.stage)}
          <Typography variant="h6">
            {progress.stage === 'complete' ? 'Export Complete!' : 'Exporting...'}
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress.progress} 
          sx={{ mb: 2, height: 8, borderRadius: 4 }}
        />
        
        <Box display="flex" justifyContent="between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {progress.message}
          </Typography>
          
          <Typography variant="body2" fontWeight={500}>
            {progress.progress}%
          </Typography>
        </Box>
        
        {progress.estimatedTimeRemaining && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Estimated time remaining: {progress.estimatedTimeRemaining}s
          </Typography>
        )}
      </CardContent>
    </ProgressCard>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

export interface ActivityExportProps extends UseActivityExportProps {
  className?: string;
  onClose?: () => void;
  modal?: boolean;
  title?: string;
}

export const ActivityExport: React.FC<ActivityExportProps> = ({
  workspaceId,
  activityData = [],
  onExportStart,
  onExportComplete,
  onExportError,
  className,
  onClose,
  modal = false,
  title = "Export Activity Data"
}) => {
  const [activeStep, setActiveStep] = React.useState(0);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const {
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
    estimateFileSize
  } = useActivityExport({
    workspaceId,
    activityData,
    onExportStart,
    onExportComplete,
    onExportError
  });

  const handleGeneratePreview = async () => {
    setPreviewLoading(true);
    try {
      await generatePreview();
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleStartExport = async () => {
    try {
      await startExport();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const validationErrors = validateOptions();
  const estimatedSize = estimateFileSize();

  const steps = [
    {
      label: 'Select Format',
      content: (
        <FormatSelector
          selectedFormat={options.format}
          onFormatChange={(format) => setOptions({ format })}
        />
      )
    },
    {
      label: 'Configure Options',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>Date Range</Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <DatePicker
                        label="From"
                        value={options.dateRange.from ? new Date(options.dateRange.from) : null}
                        onChange={(date) => setOptions({
                          dateRange: {
                            ...options.dateRange,
                            from: date ? date.toISOString().split('T')[0] : null
                          }
                        })}
                        slotProps={{
                          textField: { fullWidth: true, size: 'small' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <DatePicker
                        label="To"
                        value={options.dateRange.to ? new Date(options.dateRange.to) : null}
                        onChange={(date) => setOptions({
                          dateRange: {
                            ...options.dateRange,
                            to: date ? date.toISOString().split('T')[0] : null
                          }
                        })}
                        slotProps={{
                          textField: { fullWidth: true, size: 'small' }
                        }}
                      />
                    </Grid>
                  </Grid>
                </LocalizationProvider>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Export Options</Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={options.includeMetadata}
                        onChange={(e) => setOptions({ includeMetadata: e.target.checked })}
                      />
                    }
                    label="Include metadata"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={options.includeChanges}
                        onChange={(e) => setOptions({ includeChanges: e.target.checked })}
                      />
                    }
                    label="Include change details"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={options.includeContext}
                        onChange={(e) => setOptions({ includeContext: e.target.checked })}
                      />
                    }
                    label="Include event context"
                  />
                </FormGroup>
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Group By</InputLabel>
                <Select
                  value={options.groupBy || 'none'}
                  label="Group By"
                  onChange={(e) => setOptions({ groupBy: e.target.value as any })}
                >
                  <MenuItem value="none">No grouping</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="event_type">Event Type</MenuItem>
                  <MenuItem value="entity">Entity Type</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={options.sortBy || 'date'}
                  label="Sort By"
                  onChange={(e) => setOptions({ sortBy: e.target.value as any })}
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="event_type">Event Type</MenuItem>
                  <MenuItem value="entity">Entity Type</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Limit (optional)"
                size="small"
                value={options.limit || ''}
                onChange={(e) => setOptions({ limit: e.target.value ? parseInt(e.target.value) : undefined })}
                helperText="Leave empty for no limit"
              />
            </Stack>
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Select Fields',
      content: (
        <FieldSelector
          availableFields={availableFields}
          selectedFields={selectedFields}
          onFieldsChange={setSelectedFields}
        />
      )
    },
    {
      label: 'Review & Export',
      content: (
        <Stack spacing={3}>
          <ExportPreview
            previewData={previewData}
            onGeneratePreview={handleGeneratePreview}
            loading={previewLoading}
          />
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>Export Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {activityData.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Records
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">
                    {selectedFields.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Selected Fields
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="info.main">
                    {options.format.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Export Format
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="warning.main">
                    {Math.round(estimatedSize / 1024)}KB
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Est. File Size
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {validationErrors.length > 0 && (
            <Alert severity="error">
              <Typography variant="subtitle2" gutterBottom>
                Please fix the following issues:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
        </Stack>
      )
    }
  ];

  const content = (
    <Box className={className}>
      {progress ? (
        <ExportProgressDisplay progress={progress} />
      ) : (
        <>
          <TemplateManager
            templates={templates}
            onApplyTemplate={applyTemplate}
            onSaveTemplate={saveAsTemplate}
          />
          
          <Divider sx={{ my: 3 }} />

          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  <Box sx={{ py: 2 }}>
                    {step.content}
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        onClick={() => {
                          if (index === steps.length - 1) {
                            handleStartExport();
                          } else {
                            setActiveStep(index + 1);
                          }
                        }}
                        disabled={index === steps.length - 1 && (!canExport || isExporting)}
                      >
                        {index === steps.length - 1 ? 'Start Export' : 'Continue'}
                      </Button>
                      
                      {index > 0 && (
                        <Button onClick={() => setActiveStep(index - 1)}>
                          Back
                        </Button>
                      )}
                      
                      {index === steps.length - 1 && (
                        <Button onClick={resetOptions} color="error">
                          Reset
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {lastExport && !isExporting && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Export completed successfully!
              </Typography>
              <Typography variant="body2">
                File: {lastExport.fileName} ({Math.round(lastExport.fileSize / 1024)}KB) • 
                {lastExport.recordCount} records • 
                {lastExport.exportTime}ms
              </Typography>
            </Alert>
          )}
        </>
      )}
    </Box>
  );

  if (modal) {
    return (
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="between">
            <Typography variant="h6">{title}</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ExportCard>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {content}
      </CardContent>
    </ExportCard>
  );
};

export default ActivityExport;