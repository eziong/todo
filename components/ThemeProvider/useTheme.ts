'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createAppTheme, type ThemeMode, type AppTheme } from '../../theme/utils';

// Theme Storage Key
const THEME_STORAGE_KEY = 'todo-app-theme-mode';

// Media Query for System Theme Detection
const DARK_THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

interface UseThemeOptions {
  defaultMode?: ThemeMode;
  enableSystemTheme?: boolean;
}

interface UseThemeReturn {
  mode: ThemeMode;
  theme: AppTheme;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  isSystemTheme: boolean;
  systemMode: ThemeMode | null;
}

/**
 * Custom hook for managing application theme state and persistence
 * Supports light/dark mode with system preference detection and localStorage persistence
 */
export const useTheme = ({ 
  defaultMode = 'light', 
  enableSystemTheme = true 
}: UseThemeOptions = {}): UseThemeReturn => {
  // System theme detection
  const [systemMode, setSystemMode] = useState<ThemeMode | null>(null);
  const [isSystemTheme, setIsSystemTheme] = useState(enableSystemTheme);
  const [userMode, setUserMode] = useState<ThemeMode>(defaultMode);

  // Initialize system theme detection
  useEffect(() => {
    if (!enableSystemTheme || typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(DARK_THEME_MEDIA_QUERY);
    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList): void => {
      setSystemMode(e.matches ? 'dark' : 'light');
    };

    // Set initial system theme
    updateSystemTheme(mediaQuery);

    // Listen for system theme changes
    const handleChange = (e: MediaQueryListEvent): void => updateSystemTheme(e);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return (): void => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [enableSystemTheme]);

  // Load saved theme preference from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Use a timeout to avoid synchronous state updates in useEffect
    const loadStoredTheme = (): void => {
      try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          const parsedTheme = JSON.parse(savedTheme);
          if (parsedTheme.mode === 'light' || parsedTheme.mode === 'dark') {
            setUserMode(parsedTheme.mode);
            setIsSystemTheme(parsedTheme.useSystem ?? enableSystemTheme);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load theme from localStorage:', error);
        // Use defaults if localStorage is corrupted
        setUserMode(defaultMode);
        setIsSystemTheme(enableSystemTheme);
      }
    };

    // Use setTimeout to defer state updates and avoid synchronous setState warning
    setTimeout(loadStoredTheme, 0);
  }, [defaultMode, enableSystemTheme]);

  // Determine effective theme mode
  const effectiveMode = useMemo(() => {
    if (isSystemTheme && systemMode) {
      return systemMode;
    }
    return userMode;
  }, [isSystemTheme, systemMode, userMode]);

  // Create theme instance
  const theme = useMemo(() => {
    return createAppTheme(effectiveMode);
  }, [effectiveMode]);

  // Save theme preference to localStorage
  const saveThemePreference = useCallback((mode: ThemeMode, useSystem: boolean) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const themeData = {
        mode,
        useSystem,
        timestamp: Date.now(),
      };
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeData));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, []);

  // Toggle between light and dark modes
  const toggleMode = useCallback(() => {
    const newMode = effectiveMode === 'light' ? 'dark' : 'light';
    setUserMode(newMode);
    setIsSystemTheme(false); // Disable system theme when manually toggling
    saveThemePreference(newMode, false);
  }, [effectiveMode, saveThemePreference]);

  // Set specific theme mode
  const setMode = useCallback((mode: ThemeMode) => {
    setUserMode(mode);
    setIsSystemTheme(false); // Disable system theme when manually setting
    saveThemePreference(mode, false);
  }, [saveThemePreference]);

  // Enable system theme following
  const enableSystemThemeMode = useCallback(() => {
    setIsSystemTheme(true);
    if (systemMode) {
      saveThemePreference(systemMode, true);
    }
  }, [systemMode, saveThemePreference]);

  // Expose additional utilities for advanced use cases
  const themeUtils = useMemo(() => ({
    enableSystemTheme: enableSystemThemeMode,
    getStoredPreference: (): object | null => {
      if (typeof window === 'undefined') return null;
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    },
    clearStoredPreference: (): void => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(THEME_STORAGE_KEY);
      }
    },
  }), [enableSystemThemeMode]);

  return {
    mode: effectiveMode,
    theme,
    toggleMode,
    setMode,
    isSystemTheme,
    systemMode,
    // Additional utilities for advanced theme management
    ...themeUtils,
  };
};

export default useTheme;