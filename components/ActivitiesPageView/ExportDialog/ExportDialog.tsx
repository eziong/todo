// =============================================
// EXPORT DIALOG PRESENTER COMPONENT
// =============================================
// Pure UI component for export dialog with Material UI and macOS aesthetics

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Download as ExportIcon } from '@mui/icons-material';

// =============================================
// INTERFACES
// =============================================

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'json') => void;
  isExporting: boolean;
  activityCount: number;
}

// =============================================
// PRESENTER COMPONENT
// =============================================

export const ExportDialog: React.FC<ExportDialogProps> = React.memo(({
  open,
  onClose,
  onExport,
  isExporting,
  activityCount,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Activities</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Export {activityCount} activities matching your current filters.
        </Typography>
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Choose format:
        </Typography>
        
        <Stack spacing={1}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => onExport('csv')}
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={16} /> : <ExportIcon />}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            CSV (Excel compatible)
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={() => onExport('json')}
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={16} /> : <ExportIcon />}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            JSON (Raw data)
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
});