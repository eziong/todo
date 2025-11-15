'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

interface AccessibilityConfig {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  focusVisible: boolean;
  screenReaderAnnouncements: boolean;
}

interface AccessibilityContextType {
  config: AccessibilityConfig;
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  focusManagement: {
    trapFocus: (container: HTMLElement) => () => void;
    moveFocus: (direction: 'next' | 'previous' | 'first' | 'last') => void;
    restoreFocus: () => void;
  };
}

const defaultConfig: AccessibilityConfig = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  focusVisible: true,
  screenReaderAnnouncements: true
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AccessibilityConfig>(defaultConfig);
  const announceRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Detect user preferences on mount
  useEffect(() => {
    const detectPreferences = () => {
      const preferences: Partial<AccessibilityConfig> = {};

      // Detect reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        preferences.reduceMotion = true;
      }

      // Detect high contrast preference
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        preferences.highContrast = true;
      }

      // Check for stored preferences
      const stored = localStorage.getItem('accessibility-config');
      if (stored) {
        try {
          const storedConfig = JSON.parse(stored);
          Object.assign(preferences, storedConfig);
        } catch (error) {
          console.warn('Failed to parse stored accessibility config:', error);
        }
      }

      if (Object.keys(preferences).length > 0) {
        setConfig(prev => ({ ...prev, ...preferences }));
      }
    };

    detectPreferences();

    // Listen for media query changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setConfig(prev => ({ ...prev, reduceMotion: e.matches }));
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setConfig(prev => ({ ...prev, highContrast: e.matches }));
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  // Update config and persist to localStorage
  const updateConfig = (updates: Partial<AccessibilityConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem('accessibility-config', JSON.stringify(newConfig));
      return newConfig;
    });
  };

  // Screen reader announcement function
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!config.screenReaderAnnouncements || !announceRef.current) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    announceRef.current.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      if (announceRef.current && announceRef.current.contains(announcement)) {
        announceRef.current.removeChild(announcement);
      }
    }, 1000);
  };

  // Focus management utilities
  const focusManagement = {
    // Trap focus within a container
    trapFocus: (container: HTMLElement) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      container.addEventListener('keydown', handleKeyDown);
      
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus first element
      firstElement?.focus();

      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    },

    // Move focus in a direction
    moveFocus: (direction: 'next' | 'previous' | 'first' | 'last') => {
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);

      let targetIndex: number;
      switch (direction) {
        case 'next':
          targetIndex = (currentIndex + 1) % focusableElements.length;
          break;
        case 'previous':
          targetIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
          break;
        case 'first':
          targetIndex = 0;
          break;
        case 'last':
          targetIndex = focusableElements.length - 1;
          break;
      }

      focusableElements[targetIndex]?.focus();
    },

    // Restore focus to previously focused element
    restoreFocus: () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  };

  // Apply accessibility styles based on config
  useEffect(() => {
    const root = document.documentElement;

    // Reduced motion
    if (config.reduceMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    // High contrast
    if (config.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (config.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Focus visible
    if (config.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  }, [config]);

  const contextValue: AccessibilityContextType = {
    config,
    updateConfig,
    announce,
    focusManagement
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      {/* Screen reader announcement region */}
      <div
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="accessibility-announcements"
      />
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Skip to content link component
export const SkipToContent: React.FC<{ targetId: string }> = ({ targetId }) => {
  return (
    <a
      href={`#${targetId}`}
      className="skip-to-content"
      style={{
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: '#000',
        color: '#fff',
        padding: '8px',
        textDecoration: 'none',
        zIndex: 9999,
        opacity: 0,
        transition: 'opacity 0.2s'
      }}
      onFocus={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.top = '6px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.opacity = '0';
        e.currentTarget.style.top = '-40px';
      }}
    >
      Skip to main content
    </a>
  );
};