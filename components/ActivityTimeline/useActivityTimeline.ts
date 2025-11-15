// =============================================
// ACTIVITY TIMELINE CONTAINER HOOK
// =============================================
// Container logic for entity-specific activity timeline

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEntityActivityTimeline } from '@/hooks/useActivity';
import type { EntityType, EntityActivityTimelineItem, EventType, EventCategory } from '@/types/database';

export interface UseActivityTimelineProps {
  entityType: EntityType;
  entityId: string;
  autoRefresh?: boolean;
  groupByDate?: boolean;
  showUserAvatars?: boolean;
  limit?: number;
}

export interface ActivityTimelineGroup {
  date: string;
  displayDate: string;
  events: EntityActivityTimelineItem[];
}

export interface UseActivityTimelineReturn {
  // Data
  timeline: EntityActivityTimelineItem[];
  groupedTimeline: ActivityTimelineGroup[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Filtering
  selectedEventTypes: EventType[];
  setSelectedEventTypes: (types: EventType[]) => void;
  showDeltas: boolean;
  setShowDeltas: (show: boolean) => void;
  
  // Actions
  refresh: () => void;
  
  // Computed values
  totalEvents: number;
  uniqueUsers: string[];
  dateRange: { start: string; end: string } | null;
}

export const useActivityTimeline = ({
  entityType,
  entityId,
  autoRefresh = true,
  groupByDate = true,
  limit = 100
}: UseActivityTimelineProps): UseActivityTimelineReturn => {
  // Local state for filtering
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);
  const [showDeltas, setShowDeltas] = useState(false);

  // Fetch timeline data
  const {
    timeline: rawTimeline,
    loading,
    error,
    refresh
  } = useEntityActivityTimeline({
    entityType,
    entityId,
    limit,
    autoRefresh
  });

  // Filter timeline based on selected event types
  const timeline = useMemo(() => {
    if (selectedEventTypes.length === 0) {
      return rawTimeline;
    }
    return rawTimeline.filter(event => selectedEventTypes.includes(event.event_type));
  }, [rawTimeline, selectedEventTypes]);

  // Group timeline events by date
  const groupedTimeline = useMemo(() => {
    if (!groupByDate) return [];

    const groups = new Map<string, EntityActivityTimelineItem[]>();
    
    timeline.forEach(event => {
      const date = new Date(event.created_at).toDateString();
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(event);
    });

    // Convert to array and sort by date (newest first)
    return Array.from(groups.entries())
      .map(([date, events]) => ({
        date,
        displayDate: formatDisplayDate(date),
        events: events.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [timeline, groupByDate]);

  // Computed values
  const totalEvents = timeline.length;
  
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    timeline.forEach(event => {
      if (event.user_name) {
        users.add(event.user_name);
      }
    });
    return Array.from(users);
  }, [timeline]);

  const dateRange = useMemo(() => {
    if (timeline.length === 0) return null;
    
    const dates = timeline.map(event => new Date(event.created_at).getTime());
    const start = new Date(Math.min(...dates)).toISOString();
    const end = new Date(Math.max(...dates)).toISOString();
    
    return { start, end };
  }, [timeline]);

  return {
    timeline,
    groupedTimeline,
    loading,
    error,
    selectedEventTypes,
    setSelectedEventTypes,
    showDeltas,
    setShowDeltas,
    refresh,
    totalEvents,
    uniqueUsers,
    dateRange
  };
};

// Helper function to format display date
function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}