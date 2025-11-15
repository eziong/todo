// =============================================
// ACTIVITY REAL-TIME HOOK
// =============================================
// Hook for real-time activity monitoring and updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/Auth/useAuth';
import type { ActivityFeedItem, EventType, EventCategory } from '@/types/database';

export interface RealTimeEvent extends ActivityFeedItem {
  isNew?: boolean;
  timestamp: number;
}

export interface RealTimeMetrics {
  activeConnections: number;
  eventsPerSecond: number;
  averageLatency: number;
  totalEventsSinceStart: number;
  peakEventsPerSecond: number;
  connectionUptime: number;
  lastEventTimestamp: number;
}

export interface RealTimeAlerts {
  highActivity: boolean;
  connectionIssues: boolean;
  dataAnomalies: boolean;
  performanceIssues: boolean;
}

export interface UseActivityRealTimeProps {
  workspaceId?: string;
  userId?: string;
  maxEvents?: number;
  autoConnect?: boolean;
  reconnectInterval?: number;
  eventFilters?: {
    categories?: EventCategory[];
    eventTypes?: EventType[];
  };
  onEvent?: (event: RealTimeEvent) => void;
  onMetricsUpdate?: (metrics: RealTimeMetrics) => void;
  onAlert?: (alert: keyof RealTimeAlerts, active: boolean) => void;
}

export interface UseActivityRealTimeReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Real-time data
  events: RealTimeEvent[];
  metrics: RealTimeMetrics | null;
  alerts: RealTimeAlerts;
  
  // Controls
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  clearEvents: () => void;
  
  // Event management
  markEventAsRead: (eventId: string) => void;
  removeEvent: (eventId: string) => void;
  pauseUpdates: () => void;
  resumeUpdates: () => void;
  
  // State
  isPaused: boolean;
  unreadCount: number;
  
  // Performance
  latestLatency: number;
  connectionUptime: number;
  eventRate: number; // events per second
}

export const useActivityRealTime = ({
  workspaceId,
  userId,
  maxEvents = 100,
  autoConnect = true,
  reconnectInterval = 5000,
  eventFilters,
  onEvent,
  onMetricsUpdate,
  onAlert
}: UseActivityRealTimeProps): UseActivityRealTimeReturn => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [alerts, setAlerts] = useState<RealTimeAlerts>({
    highActivity: false,
    connectionIssues: false,
    dataAnomalies: false,
    performanceIssues: false
  });
  const [isPaused, setIsPaused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const connectionStartTime = useRef<number>(0);
  const lastEventTime = useRef<number>(0);
  const eventCount = useRef<number>(0);
  const latencyMeasurements = useRef<number[]>([]);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const eventGeneratorInterval = useRef<NodeJS.Timeout | null>(null);
  const metricsUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();

  // Mock event generator (in real app, this would be WebSocket/SSE)
  const generateMockEvent = useCallback((): RealTimeEvent | null => {
    const eventTypes: EventType[] = ['created', 'updated', 'completed', 'assigned', 'moved', 'deleted'];
    const categories: EventCategory[] = ['user_action', 'system', 'security'];
    const entityTypes = ['task', 'section', 'workspace', 'user'];
    
    const now = Date.now();
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Apply filters
    if (eventFilters?.categories && eventFilters.categories.length > 0) {
      const filteredCategories = categories.filter(cat => eventFilters.categories!.includes(cat));
      if (filteredCategories.length === 0) return null;
    }
    
    if (eventFilters?.eventTypes && eventFilters.eventTypes.length > 0) {
      if (!eventFilters.eventTypes.includes(eventType)) return null;
    }

    const mockUsers = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Tom Brown'];
    
    return {
      id: `realtime-${now}-${Math.random().toString(36).substr(2, 9)}`,
      event_type: eventType,
      entity_type: entityTypes[Math.floor(Math.random() * entityTypes.length)] as any,
      entity_id: `entity-${Math.random().toString(36).substr(2, 9)}`,
      user_name: mockUsers[Math.floor(Math.random() * mockUsers.length)],
      workspace_name: 'Live Workspace',
      description: `Real-time ${eventType} event`,
      created_at: new Date(now).toISOString(),
      category: categories[Math.floor(Math.random() * categories.length)],
      severity: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)] as any,
      context: {
        realTime: true,
        latency: Math.random() * 100 + 50
      },
      isNew: true,
      timestamp: now
    };
  }, [eventFilters]);

  // Start mock event generation
  const startEventGeneration = useCallback(() => {
    if (eventGeneratorInterval.current) {
      clearInterval(eventGeneratorInterval.current);
    }

    eventGeneratorInterval.current = setInterval(() => {
      if (!isPaused && isConnected) {
        // Generate events with varying frequency (1-10 seconds apart)
        if (Math.random() < 0.3) { // 30% chance each interval
          const newEvent = generateMockEvent();
          if (newEvent) {
            setEvents(prev => {
              const updated = [newEvent, ...prev].slice(0, maxEvents);
              return updated;
            });
            
            setUnreadCount(prev => prev + 1);
            eventCount.current += 1;
            lastEventTime.current = Date.now();
            
            onEvent?.(newEvent);
          }
        }
      }
    }, 2000); // Check every 2 seconds
  }, [isPaused, isConnected, generateMockEvent, maxEvents, onEvent]);

  // Update metrics
  const updateMetrics = useCallback(() => {
    if (!isConnected) return;

    const now = Date.now();
    const uptime = (now - connectionStartTime.current) / 1000;
    const eventsPerSecond = eventCount.current / Math.max(uptime, 1);
    
    const newMetrics: RealTimeMetrics = {
      activeConnections: 1,
      eventsPerSecond,
      averageLatency: latencyMeasurements.current.length > 0 
        ? latencyMeasurements.current.reduce((sum, val) => sum + val, 0) / latencyMeasurements.current.length
        : 0,
      totalEventsSinceStart: eventCount.current,
      peakEventsPerSecond: Math.max(eventsPerSecond, metrics?.peakEventsPerSecond || 0),
      connectionUptime: uptime,
      lastEventTimestamp: lastEventTime.current
    };

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);

    // Update alerts based on metrics
    const newAlerts: RealTimeAlerts = {
      highActivity: eventsPerSecond > 5, // More than 5 events per second
      connectionIssues: uptime < 30 || (now - lastEventTime.current > 30000), // No events for 30s
      dataAnomalies: eventCount.current > 1000, // Unusually high event count
      performanceIssues: newMetrics.averageLatency > 500 // High latency
    };

    // Trigger alert callbacks for changes
    Object.keys(newAlerts).forEach(alertKey => {
      const key = alertKey as keyof RealTimeAlerts;
      if (newAlerts[key] !== alerts[key]) {
        onAlert?.(key, newAlerts[key]);
      }
    });

    setAlerts(newAlerts);
  }, [isConnected, metrics, alerts, onMetricsUpdate, onAlert]);

  // Start metrics updates
  useEffect(() => {
    if (isConnected) {
      metricsUpdateInterval.current = setInterval(updateMetrics, 5000); // Update every 5 seconds
      return () => {
        if (metricsUpdateInterval.current) {
          clearInterval(metricsUpdateInterval.current);
        }
      };
    }
  }, [isConnected, updateMetrics]);

  // Connection management
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Random connection failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error('Connection failed');
      }

      setIsConnected(true);
      setConnectionError(null);
      connectionStartTime.current = Date.now();
      eventCount.current = 0;
      lastEventTime.current = Date.now();
      latencyMeasurements.current = [];

      startEventGeneration();

    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      
      // Auto-reconnect
      if (autoConnect) {
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, autoConnect, reconnectInterval, startEventGeneration]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    
    if (eventGeneratorInterval.current) {
      clearInterval(eventGeneratorInterval.current);
    }
    
    if (metricsUpdateInterval.current) {
      clearInterval(metricsUpdateInterval.current);
    }
    
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [disconnect, connect]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Event management
  const clearEvents = useCallback(() => {
    setEvents([]);
    setUnreadCount(0);
  }, []);

  const markEventAsRead = useCallback((eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, isNew: false }
        : event
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const removeEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    // Don't decrement unread count as this is a manual removal
  }, []);

  const pauseUpdates = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeUpdates = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Computed values
  const latestLatency = latencyMeasurements.current[latencyMeasurements.current.length - 1] || 0;
  const connectionUptime = isConnected ? (Date.now() - connectionStartTime.current) / 1000 : 0;
  const eventRate = metrics?.eventsPerSecond || 0;

  return {
    isConnected,
    isConnecting,
    connectionError,
    events,
    metrics,
    alerts,
    connect,
    disconnect,
    reconnect,
    clearEvents,
    markEventAsRead,
    removeEvent,
    pauseUpdates,
    resumeUpdates,
    isPaused,
    unreadCount,
    latestLatency,
    connectionUptime,
    eventRate
  };
};