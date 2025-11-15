// =============================================
// ACTIVITY EVENT DETAILS CONTAINER HOOK
// =============================================
// Container logic for detailed activity event display

import { useState, useCallback, useMemo } from 'react';
import type { 
  ActivityFeedItem, 
  EntityActivityTimelineItem, 
  EventType,
  EventCategory,
  EventSeverity 
} from '@/types/database';

export interface UseActivityEventDetailsProps {
  event: ActivityFeedItem | EntityActivityTimelineItem;
  autoExpand?: boolean;
  showRawData?: boolean;
  showMetadata?: boolean;
  showRelatedEvents?: boolean;
}

export interface EventDetailSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode | string;
  collapsible: boolean;
  defaultExpanded: boolean;
}

export interface EventMetadata {
  id: string;
  timestamp: string;
  category: EventCategory;
  severity: EventSeverity;
  source?: string;
  correlationId?: string;
  userId?: string;
  workspaceId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface EventChanges {
  hasChanges: boolean;
  changedFields: string[];
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  delta: Record<string, unknown>;
}

export interface UseActivityEventDetailsReturn {
  // Event data
  eventTitle: string;
  eventDescription: string;
  eventIcon: string;
  eventColor: string;
  metadata: EventMetadata;
  changes: EventChanges;
  
  // Display state
  expandedSections: Set<string>;
  setExpandedSections: (sections: Set<string>) => void;
  toggleSection: (sectionId: string) => void;
  expandAllSections: () => void;
  collapseAllSections: () => void;
  
  // Content sections
  sections: EventDetailSection[];
  
  // Actions
  copyToClipboard: (content: string) => Promise<void>;
  exportEvent: (format: 'json' | 'csv') => void;
  
  // Computed values
  hasExpandableSections: boolean;
  totalSections: number;
  expandedSectionCount: number;
  
  // Formatting helpers
  formatTimestamp: (timestamp: string) => string;
  formatValue: (value: unknown) => string;
  formatFieldName: (field: string) => string;
}

export const useActivityEventDetails = ({
  event,
  autoExpand = false,
  showRawData = true,
  showMetadata = true,
  showRelatedEvents = false
}: UseActivityEventDetailsProps): UseActivityEventDetailsReturn => {
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    autoExpand ? new Set(['overview', 'changes', 'metadata']) : new Set(['overview'])
  );

  // Extract event metadata
  const metadata: EventMetadata = useMemo(() => ({
    id: event.id,
    timestamp: event.created_at,
    category: 'category' in event ? event.category : 'user_action',
    severity: 'severity' in event ? event.severity : 'info',
    correlationId: 'correlation_id' in event ? event.correlation_id : undefined,
    // Add other metadata fields as available
  }), [event]);

  // Analyze event changes
  const changes: EventChanges = useMemo(() => {
    if ('old_values' in event || 'new_values' in event || 'delta' in event) {
      const oldValues = event.old_values || {};
      const newValues = event.new_values || {};
      const delta = event.delta || {};
      
      const changedFields = [
        ...Object.keys(oldValues),
        ...Object.keys(newValues),
        ...Object.keys(delta)
      ].filter((field, index, array) => array.indexOf(field) === index);

      return {
        hasChanges: changedFields.length > 0,
        changedFields,
        oldValues,
        newValues,
        delta
      };
    }
    
    return {
      hasChanges: false,
      changedFields: [],
      oldValues: {},
      newValues: {},
      delta: {}
    };
  }, [event]);

  // Format event title and description
  const eventTitle = useMemo(() => {
    const eventType = event.event_type;
    const userName = 'user_name' in event ? event.user_name : 'Unknown User';
    
    const titleMap: Record<EventType, string> = {
      created: `${userName} created an item`,
      updated: `${userName} made updates`,
      deleted: `${userName} deleted an item`,
      completed: `${userName} marked as complete`,
      assigned: `${userName} was assigned`,
      moved: `${userName} moved an item`,
      status_changed: `${userName} changed status`,
      archived: `${userName} archived an item`,
      restored: `${userName} restored an item`,
      login: `${userName} signed in`,
      logout: `${userName} signed out`,
      search_performed: `${userName} performed a search`,
      viewed: `${userName} viewed an item`,
      commented: `${userName} added a comment`,
      member_added: `${userName} joined`,
      member_removed: `${userName} left`,
      role_changed: `${userName}'s role changed`,
      unassigned: `${userName} was unassigned`,
      reassigned: `${userName} was reassigned`,
      duplicated: `${userName} duplicated an item`,
      merged: `${userName} merged items`,
      unarchived: `${userName} unarchived an item`,
      ownership_transferred: `Ownership transferred to ${userName}`,
      reordered: `${userName} reordered items`,
      member_invited: `${userName} was invited`,
      invitation_accepted: `${userName} accepted invitation`,
      invitation_declined: `${userName} declined invitation`,
      permission_changed: `${userName}'s permissions changed`,
      access_granted: `${userName} was granted access`,
      access_revoked: `${userName}'s access was revoked`,
      login_failed: `${userName} failed to sign in`,
      password_changed: `${userName} changed password`,
      mfa_enabled: `${userName} enabled MFA`,
      mfa_disabled: `${userName} disabled MFA`,
      api_key_created: `${userName} created API key`,
      api_key_revoked: `${userName} revoked API key`,
      suspicious_activity: `Suspicious activity detected for ${userName}`,
      export_generated: `${userName} generated export`,
      import_completed: `${userName} completed import`,
      backup_created: `${userName} created backup`,
      settings_changed: `${userName} changed settings`,
      integration_connected: `${userName} connected integration`,
      integration_disconnected: `${userName} disconnected integration`,
      mentioned: `${userName} was mentioned`,
      watched: `${userName} started watching`,
      unwatched: `${userName} stopped watching`,
      notification_sent: `Notification sent to ${userName}`,
      email_sent: `Email sent to ${userName}`,
      reminder_triggered: `Reminder triggered for ${userName}`,
      reopened: `${userName} reopened an item`
    };

    return titleMap[eventType] || `${userName} ${eventType.replace('_', ' ')}`;
  }, [event]);

  const eventDescription = useMemo(() => {
    return 'description' in event ? event.description : '';
  }, [event]);

  // Get event icon and color
  const { eventIcon, eventColor } = useMemo(() => {
    const iconMap: Record<EventType, string> = {
      created: '➕',
      updated: '✏️',
      deleted: '🗑️',
      completed: '✅',
      assigned: '👤',
      moved: '📁',
      status_changed: '🔄',
      archived: '📦',
      restored: '♻️',
      login: '🔐',
      logout: '🚪',
      search_performed: '🔍',
      viewed: '👁️',
      commented: '💬',
      member_added: '👥',
      member_removed: '👤',
      role_changed: '🎭',
      unassigned: '👤',
      reassigned: '🔄',
      duplicated: '📄',
      merged: '🔗',
      unarchived: '📤',
      ownership_transferred: '🔄',
      reordered: '🔢',
      member_invited: '📧',
      invitation_accepted: '✅',
      invitation_declined: '❌',
      permission_changed: '🔐',
      access_granted: '🔓',
      access_revoked: '🔒',
      login_failed: '❌',
      password_changed: '🔑',
      mfa_enabled: '🛡️',
      mfa_disabled: '🔓',
      api_key_created: '🔑',
      api_key_revoked: '🗑️',
      suspicious_activity: '⚠️',
      export_generated: '📤',
      import_completed: '📥',
      backup_created: '💾',
      settings_changed: '⚙️',
      integration_connected: '🔗',
      integration_disconnected: '🔌',
      mentioned: '@',
      watched: '👁️',
      unwatched: '👁️‍🗨️',
      notification_sent: '📢',
      email_sent: '📧',
      reminder_triggered: '⏰',
      reopened: '🔄'
    };

    const colorMap: Record<EventType, string> = {
      created: '#4CAF50',
      completed: '#4CAF50',
      updated: '#2196F3',
      deleted: '#F44336',
      assigned: '#FF9800',
      status_changed: '#FF9800',
      archived: '#9E9E9E',
      login: '#4CAF50',
      login_failed: '#F44336',
      suspicious_activity: '#F44336',
      member_added: '#4CAF50',
      member_removed: '#F44336',
      // Add more mappings as needed
    } as any;

    return {
      eventIcon: iconMap[event.event_type] || '📝',
      eventColor: colorMap[event.event_type] || '#2196F3'
    };
  }, [event.event_type]);

  // Create content sections
  const sections: EventDetailSection[] = useMemo(() => {
    const sectionList: EventDetailSection[] = [
      {
        id: 'overview',
        title: 'Event Overview',
        icon: '📋',
        content: `${eventTitle}\n${eventDescription}`,
        collapsible: false,
        defaultExpanded: true
      }
    ];

    // Changes section
    if (changes.hasChanges) {
      sectionList.push({
        id: 'changes',
        title: 'Changes',
        icon: '🔄',
        content: '', // Will be rendered as component
        collapsible: true,
        defaultExpanded: autoExpand
      });
    }

    // Metadata section
    if (showMetadata) {
      sectionList.push({
        id: 'metadata',
        title: 'Event Metadata',
        icon: 'ℹ️',
        content: '', // Will be rendered as component
        collapsible: true,
        defaultExpanded: autoExpand
      });
    }

    // Raw data section
    if (showRawData) {
      sectionList.push({
        id: 'raw',
        title: 'Raw Event Data',
        icon: '🔧',
        content: JSON.stringify(event, null, 2),
        collapsible: true,
        defaultExpanded: false
      });
    }

    return sectionList;
  }, [event, eventTitle, eventDescription, changes, showMetadata, showRawData, autoExpand]);

  // Section management
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const expandAllSections = useCallback(() => {
    setExpandedSections(new Set(sections.map(s => s.id)));
  }, [sections]);

  const collapseAllSections = useCallback(() => {
    setExpandedSections(new Set(['overview'])); // Keep overview always expanded
  }, []);

  // Utility functions
  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  const exportEvent = useCallback((format: 'json' | 'csv') => {
    let content: string;
    let filename: string;
    
    if (format === 'json') {
      content = JSON.stringify(event, null, 2);
      filename = `event-${event.id}.json`;
    } else {
      // Simple CSV export
      const headers = Object.keys(event).join(',');
      const values = Object.values(event).map(v => 
        typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v)
      ).join(',');
      content = `${headers}\n${values}`;
      filename = `event-${event.id}.csv`;
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [event]);

  // Formatting helpers
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }, []);

  const formatValue = useCallback((value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }, []);

  const formatFieldName = useCallback((field: string): string => {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  // Computed values
  const hasExpandableSections = sections.some(s => s.collapsible);
  const totalSections = sections.length;
  const expandedSectionCount = expandedSections.size;

  return {
    eventTitle,
    eventDescription,
    eventIcon,
    eventColor,
    metadata,
    changes,
    expandedSections,
    setExpandedSections,
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
  };
};