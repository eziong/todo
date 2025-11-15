// =============================================
// ACTIVITY NOTIFICATIONS HOOK
// =============================================
// Hook for managing activity-related notifications and alerts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/Auth/useAuth';
import type { 
  ActivityFeedItem, 
  EventType, 
  EventCategory, 
  EventSeverity,
  EntityType 
} from '@/types/database';

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    eventTypes?: EventType[];
    categories?: EventCategory[];
    severities?: EventSeverity[];
    entityTypes?: EntityType[];
    users?: string[];
    keywords?: string[];
    workspaces?: string[];
  };
  actions: {
    showToast: boolean;
    playSound: boolean;
    sendEmail: boolean;
    browserNotification: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    sound?: 'default' | 'success' | 'warning' | 'error';
    customMessage?: string;
  };
  throttle?: {
    enabled: boolean;
    maxNotifications: number;
    timeWindow: number; // minutes
  };
  schedule?: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    days: number[]; // 0-6, Sunday-Saturday
    timezone?: string;
  };
}

export interface ActivityNotification {
  id: string;
  ruleId: string;
  event: ActivityFeedItem;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
  expiresAt?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  browserPermission: NotificationPermission;
  soundEnabled: boolean;
  volume: number; // 0-1
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  maxNotifications: number;
  autoRead: boolean; // Mark as read after X seconds
  autoReadDelay: number; // seconds
  groupSimilar: boolean; // Group similar notifications
  showPreview: boolean; // Show notification content preview
}

export interface UseActivityNotificationsProps {
  workspaceId?: string;
  autoLoadRules?: boolean;
  defaultSettings?: Partial<NotificationSettings>;
}

export interface UseActivityNotificationsReturn {
  // Notifications
  notifications: ActivityNotification[];
  unreadCount: number;
  recentNotifications: ActivityNotification[];
  
  // Rules management
  rules: NotificationRule[];
  activeRules: NotificationRule[];
  addRule: (rule: Omit<NotificationRule, 'id'>) => void;
  updateRule: (id: string, updates: Partial<NotificationRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string, enabled: boolean) => void;
  
  // Settings
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Notification actions
  showNotification: (event: ActivityFeedItem, ruleId?: string) => ActivityNotification | null;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismiss: (notificationId: string) => void;
  dismissAll: () => void;
  clearExpired: () => void;
  
  // Browser notifications
  requestPermission: () => Promise<NotificationPermission>;
  checkPermission: () => NotificationPermission;
  
  // Testing
  testRule: (rule: NotificationRule) => void;
  testNotification: () => void;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Computed
  hasUnread: boolean;
  canShowBrowserNotifications: boolean;
  isQuietTime: boolean;
}

const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  browserPermission: 'default',
  soundEnabled: true,
  volume: 0.5,
  vibrationEnabled: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  maxNotifications: 50,
  autoRead: false,
  autoReadDelay: 5,
  groupSimilar: true,
  showPreview: true
};

const defaultRules: NotificationRule[] = [
  {
    id: 'task-assigned',
    name: 'Task Assigned',
    description: 'Notify when a task is assigned to me',
    enabled: true,
    conditions: {
      eventTypes: ['assigned'],
      entityTypes: ['task']
    },
    actions: {
      showToast: true,
      playSound: true,
      sendEmail: false,
      browserNotification: true,
      priority: 'medium',
      sound: 'default'
    }
  },
  {
    id: 'high-priority-completed',
    name: 'High Priority Task Completed',
    description: 'Notify when high priority tasks are completed',
    enabled: true,
    conditions: {
      eventTypes: ['completed'],
      entityTypes: ['task'],
      keywords: ['urgent', 'high', 'priority', 'critical']
    },
    actions: {
      showToast: true,
      playSound: true,
      sendEmail: true,
      browserNotification: true,
      priority: 'high',
      sound: 'success'
    }
  },
  {
    id: 'security-alerts',
    name: 'Security Alerts',
    description: 'Notify on security-related events',
    enabled: true,
    conditions: {
      categories: ['security'],
      severities: ['warning', 'error', 'critical']
    },
    actions: {
      showToast: true,
      playSound: true,
      sendEmail: true,
      browserNotification: true,
      priority: 'urgent',
      sound: 'error'
    }
  }
];

export const useActivityNotifications = ({
  workspaceId,
  autoLoadRules = true,
  defaultSettings = {}
}: UseActivityNotificationsProps): UseActivityNotificationsReturn => {
  // State
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    ...defaultNotificationSettings,
    ...defaultSettings
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Load rules on mount
  useEffect(() => {
    if (autoLoadRules) {
      setLoading(true);
      
      // Simulate loading from storage/API
      setTimeout(() => {
        try {
          const stored = localStorage.getItem(`notificationRules_${workspaceId || 'global'}`);
          const storedRules = stored ? JSON.parse(stored) : defaultRules;
          setRules(storedRules);
        } catch (error) {
          setRules(defaultRules);
        }
        setLoading(false);
      }, 500);
    }
  }, [autoLoadRules, workspaceId]);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notificationSettings');
      if (stored) {
        const storedSettings = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...storedSettings }));
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error);
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('notificationSettings', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save notification settings:', error);
      }
      return updated;
    });
  }, []);

  // Save rules to localStorage
  const saveRules = useCallback((newRules: NotificationRule[]) => {
    try {
      localStorage.setItem(
        `notificationRules_${workspaceId || 'global'}`, 
        JSON.stringify(newRules)
      );
    } catch (error) {
      console.warn('Failed to save notification rules:', error);
    }
  }, [workspaceId]);

  // Rule management
  const addRule = useCallback((rule: Omit<NotificationRule, 'id'>) => {
    const newRule: NotificationRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setRules(prev => {
      const updated = [...prev, newRule];
      saveRules(updated);
      return updated;
    });
  }, [saveRules]);

  const updateRule = useCallback((id: string, updates: Partial<NotificationRule>) => {
    setRules(prev => {
      const updated = prev.map(rule => 
        rule.id === id ? { ...rule, ...updates } : rule
      );
      saveRules(updated);
      return updated;
    });
  }, [saveRules]);

  const deleteRule = useCallback((id: string) => {
    setRules(prev => {
      const updated = prev.filter(rule => rule.id !== id);
      saveRules(updated);
      return updated;
    });
  }, [saveRules]);

  const toggleRule = useCallback((id: string, enabled: boolean) => {
    updateRule(id, { enabled });
  }, [updateRule]);

  // Check if event matches rule conditions
  const eventMatchesRule = useCallback((event: ActivityFeedItem, rule: NotificationRule): boolean => {
    const { conditions } = rule;
    
    // Check event types
    if (conditions.eventTypes && !conditions.eventTypes.includes(event.event_type)) {
      return false;
    }
    
    // Check categories
    if (conditions.categories && !conditions.categories.includes(event.category)) {
      return false;
    }
    
    // Check severities
    if (conditions.severities && !conditions.severities.includes(event.severity)) {
      return false;
    }
    
    // Check entity types
    if (conditions.entityTypes && !conditions.entityTypes.includes(event.entity_type)) {
      return false;
    }
    
    // Check users
    if (conditions.users && event.user_name && !conditions.users.includes(event.user_name)) {
      return false;
    }
    
    // Check keywords in description
    if (conditions.keywords && conditions.keywords.length > 0) {
      const eventText = `${event.description} ${event.event_type} ${event.entity_type}`.toLowerCase();
      const hasKeyword = conditions.keywords.some(keyword => 
        eventText.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }
    
    return true;
  }, []);

  // Check if it's quiet time
  const isQuietTime = useMemo(() => {
    if (!settings.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = settings.quietHours.start;
    const end = settings.quietHours.end;
    
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Spans midnight
      return currentTime >= start || currentTime <= end;
    }
  }, [settings.quietHours]);

  // Browser notification functions
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    
    const permission = await Notification.requestPermission();
    updateSettings({ browserPermission: permission });
    return permission;
  }, [updateSettings]);

  const checkPermission = useCallback((): NotificationPermission => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: ActivityNotification) => {
    if (!settings.enabled || isQuietTime || checkPermission() !== 'granted') {
      return;
    }

    const browserNotification = new Notification(notification.message, {
      body: notification.event.description,
      icon: '/favicon.ico',
      tag: notification.ruleId,
      requireInteraction: notification.priority === 'urgent'
    });

    browserNotification.onclick = () => {
      window.focus();
      markAsRead(notification.id);
      browserNotification.close();
    };

    // Auto-close after delay
    setTimeout(() => {
      browserNotification.close();
    }, notification.priority === 'urgent' ? 10000 : 5000);
  }, [settings.enabled, isQuietTime, checkPermission]);

  // Play notification sound
  const playNotificationSound = useCallback((sound: string = 'default') => {
    if (!settings.soundEnabled || isQuietTime) return;
    
    // In a real app, you would load and play actual sound files
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a simple beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different sounds
    const frequency = sound === 'success' ? 800 : 
                     sound === 'warning' ? 600 : 
                     sound === 'error' ? 400 : 700;
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(settings.volume * 0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [settings.soundEnabled, settings.volume, isQuietTime]);

  // Create notification
  const showNotification = useCallback((event: ActivityFeedItem, ruleId?: string): ActivityNotification | null => {
    if (!settings.enabled) return null;

    // Find matching rule
    const matchingRule = ruleId ? 
      rules.find(rule => rule.id === ruleId) :
      rules.find(rule => rule.enabled && eventMatchesRule(event, rule));

    if (!matchingRule) return null;

    // Check throttling
    if (matchingRule.throttle?.enabled) {
      const recentNotifications = notifications.filter(n => 
        n.ruleId === matchingRule.id &&
        Date.now() - new Date(n.timestamp).getTime() < matchingRule.throttle!.timeWindow * 60 * 1000
      );
      
      if (recentNotifications.length >= matchingRule.throttle.maxNotifications) {
        return null; // Throttled
      }
    }

    // Create notification
    const notification: ActivityNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: matchingRule.id,
      event,
      message: matchingRule.actions.customMessage || 
        `${event.event_type.replace('_', ' ')} - ${event.description}`,
      priority: matchingRule.actions.priority,
      timestamp: new Date().toISOString(),
      read: false,
      dismissed: false,
      expiresAt: matchingRule.actions.priority === 'low' ? 
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : // 24 hours for low priority
        undefined
    };

    // Add to notifications
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, settings.maxNotifications);
      return updated;
    });

    // Execute actions
    if (matchingRule.actions.playSound) {
      playNotificationSound(matchingRule.actions.sound);
    }

    if (matchingRule.actions.browserNotification) {
      showBrowserNotification(notification);
    }

    // Auto-read if enabled
    if (settings.autoRead) {
      setTimeout(() => {
        markAsRead(notification.id);
      }, settings.autoReadDelay * 1000);
    }

    return notification;
  }, [settings, rules, notifications, eventMatchesRule, playNotificationSound, showBrowserNotification]);

  // Notification actions
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
  }, []);

  const dismiss = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === notificationId 
        ? { ...notification, dismissed: true }
        : notification
    ));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      dismissed: true
    })));
  }, []);

  const clearExpired = useCallback(() => {
    const now = new Date();
    setNotifications(prev => prev.filter(notification => 
      !notification.expiresAt || new Date(notification.expiresAt) > now
    ));
  }, []);

  // Testing functions
  const testRule = useCallback((rule: NotificationRule) => {
    const mockEvent: ActivityFeedItem = {
      id: 'test-event',
      event_type: 'created',
      entity_type: 'task',
      user_name: 'Test User',
      workspace_name: 'Test Workspace',
      description: 'Test notification event',
      created_at: new Date().toISOString(),
      category: 'user_action',
      severity: 'info',
      context: {}
    };

    showNotification(mockEvent, rule.id);
  }, [showNotification]);

  const testNotification = useCallback(() => {
    const mockEvent: ActivityFeedItem = {
      id: 'test-notification',
      event_type: 'created',
      entity_type: 'task',
      user_name: user?.name || 'Test User',
      workspace_name: 'Test Workspace',
      description: 'This is a test notification',
      created_at: new Date().toISOString(),
      category: 'user_action',
      severity: 'info',
      context: {}
    };

    const testRule: NotificationRule = {
      id: 'test-rule',
      name: 'Test Notification',
      description: 'Testing notification system',
      enabled: true,
      conditions: {},
      actions: {
        showToast: true,
        playSound: true,
        sendEmail: false,
        browserNotification: true,
        priority: 'medium',
        sound: 'default'
      }
    };

    if (eventMatchesRule(mockEvent, testRule)) {
      showNotification(mockEvent, testRule.id);
    }
  }, [user, eventMatchesRule, showNotification]);

  // Clear expired notifications periodically
  useEffect(() => {
    const interval = setInterval(clearExpired, 60000); // Every minute
    return () => clearInterval(interval);
  }, [clearExpired]);

  // Computed values
  const activeRules = useMemo(() => rules.filter(rule => rule.enabled), [rules]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read && !n.dismissed).length, [notifications]);
  const hasUnread = unreadCount > 0;
  const canShowBrowserNotifications = checkPermission() === 'granted' && settings.enabled;
  const recentNotifications = useMemo(() => 
    notifications.filter(n => !n.dismissed).slice(0, 10), 
    [notifications]
  );

  return {
    notifications: notifications.filter(n => !n.dismissed),
    unreadCount,
    recentNotifications,
    rules,
    activeRules,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    settings,
    updateSettings,
    showNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    clearExpired,
    requestPermission,
    checkPermission,
    testRule,
    testNotification,
    loading,
    error,
    hasUnread,
    canShowBrowserNotifications,
    isQuietTime
  };
};