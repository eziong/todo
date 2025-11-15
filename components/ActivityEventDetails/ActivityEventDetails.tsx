// =============================================
// ACTIVITY EVENT DETAILS PRESENTER COMPONENT
// =============================================
// Displays detailed information about activity events with Material UI styling

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Button,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Alert,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Security as SecurityIcon,
  Code as CodeIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  useActivityEventDetails, 
  UseActivityEventDetailsProps 
} from './useActivityEventDetails';
import type { ActivityFeedItem, EntityActivityTimelineItem } from '@/types/database';

// =============================================
// STYLED COMPONENTS
// =============================================

const EventCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.macOS.borderRadius.large,
  boxShadow: theme.macOS.shadows.card,
  border: theme.palette.mode === 'light' ? 'none' : `1px solid ${theme.palette.divider}`,
  overflow: 'visible',
}));

const SectionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.macOS.borderRadius.medium,
  backgroundColor: theme.palette.mode === 'light' 
    ? theme.palette.grey[50] 
    : theme.palette.grey[900],
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(1),
}));

const CodeBlock = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' 
    ? theme.palette.grey[100] 
    : theme.palette.grey[800],
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.macOS.borderRadius.small,
  padding: theme.spacing(2),
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  overflow: 'auto',
  maxHeight: 300,
  position: 'relative',
}));

const SeverityChip = styled(Chip)<{ severity: string }>(({ theme, severity }) => {
  const getColor = () => {
    switch (severity) {
      case 'critical': return { bg: theme.palette.error.main, color: theme.palette.error.contrastText };
      case 'error': return { bg: theme.palette.error.main, color: theme.palette.error.contrastText };
      case 'warning': return { bg: theme.palette.warning.main, color: theme.palette.warning.contrastText };
      case 'info': return { bg: theme.palette.info.main, color: theme.palette.info.contrastText };
      case 'debug': return { bg: theme.palette.text.secondary, color: theme.palette.background.paper };
      default: return { bg: theme.palette.primary.main, color: theme.palette.primary.contrastText };
    }
  };
  
  const colors = getColor();
  
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    fontWeight: 500,
  };
});

// =============================================
// HELPER COMPONENTS
// =============================================

interface EventHeaderProps {
  title: string;
  icon: string;
  color: string;
  timestamp: string;
  category: string;
  severity: string;
  onExpand: () => void;
  onCollapse: () => void;
  onExport: (format: 'json' | 'csv') => void;
  hasExpandableSections: boolean;
  expandedCount: number;
  totalSections: number;
}

const EventHeader: React.FC<EventHeaderProps> = ({
  title,
  icon,
  color,
  timestamp,
  category,
  severity,
  onExpand,
  onCollapse,
  onExport,
  hasExpandableSections,
  expandedCount,
  totalSections
}) => {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleExport = (format: 'json' | 'csv') => {
    onExport(format);
    handleMenuClose();
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
      <Box display="flex" alignItems="center" gap={2} flex={1}>
        <Avatar
          sx={{ 
            bgcolor: color,
            width: 48, 
            height: 48,
            fontSize: '1.5rem'
          }}
        >
          {icon}
        </Avatar>
        
        <Box flex={1}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {title}
          </Typography>
          
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              icon={<ScheduleIcon />}
              label={new Date(timestamp).toLocaleString()}
              size="small"
              variant="outlined"
            />
            
            <Chip
              icon={<CategoryIcon />}
              label={category.replace('_', ' ')}
              size="small"
              color="primary"
              variant="outlined"
            />
            
            <SeverityChip
              severity={severity}
              label={severity}
              size="small"
            />
          </Stack>
        </Box>
      </Box>

      <Stack direction="row" spacing={1}>
        {hasExpandableSections && (
          <>
            <Tooltip title="Expand all sections">
              <IconButton onClick={onExpand} size="small">
                <UnfoldMoreIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Collapse all sections">
              <IconButton onClick={onCollapse} size="small">
                <UnfoldLessIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
        
        <Tooltip title="More options">
          <IconButton onClick={handleMenuOpen} size="small">
            <MoreIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleExport('json')}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export as JSON
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export as CSV
        </MenuItem>
      </Menu>

      {hasExpandableSections && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          {expandedCount} of {totalSections} sections expanded
        </Typography>
      )}
    </Box>
  );
};

interface ChangesTableProps {
  changes: {
    oldValues: Record<string, unknown>;
    newValues: Record<string, unknown>;
    delta: Record<string, unknown>;
  };
  formatFieldName: (field: string) => string;
  formatValue: (value: unknown) => string;
}

const ChangesTable: React.FC<ChangesTableProps> = ({
  changes,
  formatFieldName,
  formatValue
}) => {
  const { oldValues, newValues, delta } = changes;
  const allFields = Array.from(new Set([
    ...Object.keys(oldValues),
    ...Object.keys(newValues),
    ...Object.keys(delta)
  ]));

  if (allFields.length === 0) {
    return (
      <Alert severity="info">
        No detailed change information available
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableBody>
          {allFields.map((field) => (
            <TableRow key={field}>
              <TableCell component="th" scope="row" sx={{ fontWeight: 500, minWidth: 120 }}>
                {formatFieldName(field)}
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    From:
                  </Typography>
                  <Chip
                    label={formatValue(oldValues[field] ?? 'N/A')}
                    size="small"
                    variant="outlined"
                    color="error"
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    To:
                  </Typography>
                  <Chip
                    label={formatValue(newValues[field] ?? delta[field] ?? 'N/A')}
                    size="small"
                    variant="outlined"
                    color="success"
                  />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface MetadataGridProps {
  metadata: {
    id: string;
    timestamp: string;
    category: string;
    severity: string;
    correlationId?: string;
  };
  formatTimestamp: (timestamp: string) => string;
}

const MetadataGrid: React.FC<MetadataGridProps> = ({
  metadata,
  formatTimestamp
}) => (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">
        Event ID
      </Typography>
      <Typography variant="body2" fontFamily="monospace">
        {metadata.id}
      </Typography>
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">
        Timestamp
      </Typography>
      <Typography variant="body2">
        {formatTimestamp(metadata.timestamp)}
      </Typography>
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">
        Category
      </Typography>
      <Typography variant="body2">
        {metadata.category}
      </Typography>
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">
        Severity Level
      </Typography>
      <Typography variant="body2">
        {metadata.severity}
      </Typography>
    </Grid>
    
    {metadata.correlationId && (
      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary">
          Correlation ID
        </Typography>
        <Typography variant="body2" fontFamily="monospace">
          {metadata.correlationId}
        </Typography>
      </Grid>
    )}
  </Grid>
);

interface SectionProps {
  id: string;
  title: string;
  icon: string;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  collapsible: boolean;
  copyContent?: string;
}

const Section: React.FC<SectionProps> = ({
  id,
  title,
  icon,
  children,
  expanded,
  onToggle,
  collapsible,
  copyContent
}) => {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = async () => {
    if (copyContent) {
      try {
        await navigator.clipboard.writeText(copyContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  return (
    <SectionCard>
      <CardContent sx={{ pb: collapsible ? 1 : 2 }}>
        <Box display="flex" alignItems="center" justifyContent="between" mb={collapsible ? 1 : 0}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography component="span" sx={{ fontSize: '1.2rem' }}>
              {icon}
            </Typography>
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            {copyContent && (
              <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                <IconButton size="small" onClick={handleCopy}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {collapsible && (
              <IconButton size="small" onClick={onToggle}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Stack>
        </Box>
        
        <Collapse in={expanded} timeout="auto">
          {children}
        </Collapse>
      </CardContent>
    </SectionCard>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

export interface ActivityEventDetailsProps extends UseActivityEventDetailsProps {
  className?: string;
  onClose?: () => void;
  modal?: boolean;
}

export const ActivityEventDetails: React.FC<ActivityEventDetailsProps> = ({
  event,
  autoExpand = false,
  showRawData = true,
  showMetadata = true,
  showRelatedEvents = false,
  className,
  onClose,
  modal = false
}) => {
  const {
    eventTitle,
    eventDescription,
    eventIcon,
    eventColor,
    metadata,
    changes,
    expandedSections,
    toggleSection,
    expandAllSections,
    collapseAllSections,
    sections,
    copyToClipboard,
    exportEvent,
    hasExpandableSections,
    totalSections,
    expandedSectionCount,
    formatTimestamp,
    formatValue,
    formatFieldName
  } = useActivityEventDetails({
    event,
    autoExpand,
    showRawData,
    showMetadata,
    showRelatedEvents
  });

  const content = (
    <Box className={className}>
      <EventHeader
        title={eventTitle}
        icon={eventIcon}
        color={eventColor}
        timestamp={metadata.timestamp}
        category={metadata.category}
        severity={metadata.severity}
        onExpand={expandAllSections}
        onCollapse={collapseAllSections}
        onExport={exportEvent}
        hasExpandableSections={hasExpandableSections}
        expandedCount={expandedSectionCount}
        totalSections={totalSections}
      />

      {eventDescription && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {eventDescription}
        </Alert>
      )}

      <Stack spacing={2}>
        {sections.map((section) => (
          <Section
            key={section.id}
            id={section.id}
            title={section.title}
            icon={section.icon}
            expanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            collapsible={section.collapsible}
            copyContent={typeof section.content === 'string' ? section.content : undefined}
          >
            {/* Overview section */}
            {section.id === 'overview' && (
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {section.content}
              </Typography>
            )}

            {/* Changes section */}
            {section.id === 'changes' && (
              <ChangesTable
                changes={changes}
                formatFieldName={formatFieldName}
                formatValue={formatValue}
              />
            )}

            {/* Metadata section */}
            {section.id === 'metadata' && (
              <MetadataGrid
                metadata={metadata}
                formatTimestamp={formatTimestamp}
              />
            )}

            {/* Raw data section */}
            {section.id === 'raw' && (
              <CodeBlock>
                <pre style={{ margin: 0 }}>
                  {section.content}
                </pre>
              </CodeBlock>
            )}
          </Section>
        ))}
      </Stack>
    </Box>
  );

  if (modal) {
    return (
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Event Details</DialogTitle>
        <DialogContent>
          {content}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <EventCard>
      <CardContent sx={{ p: 3 }}>
        {content}
      </CardContent>
    </EventCard>
  );
};

export default ActivityEventDetails;