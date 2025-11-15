'use client';

import { useCallback } from 'react';
import { useThemeContext } from '../ThemeContext';
import type { ThemeMode } from '../../../theme';

interface UseThemeToggleReturn {
  mode: ThemeMode;
  isSystemTheme: boolean;
  systemMode: ThemeMode | null;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  isLight: boolean;
  getToggleAriaLabel: () => string;
  getToggleTooltip: () => string;
}

/**
 * Custom hook for theme toggle functionality
 * Provides state and handlers for theme switching components
 */
export const useThemeToggle = (): UseThemeToggleReturn => {
  const { 
    mode, 
    toggleMode, 
    setMode, 
    isSystemTheme, 
    systemMode 
  } = useThemeContext();

  const isDark = mode === 'dark';
  const isLight = mode === 'light';

  const getToggleAriaLabel = useCallback(() => {
    return isDark 
      ? 'Switch to light mode' 
      : 'Switch to dark mode';
  }, [isDark]);

  const getToggleTooltip = useCallback(() => {
    if (isSystemTheme && systemMode) {
      return `Following system theme (currently ${systemMode}). Click to override.`;
    }
    return isDark 
      ? 'Switch to light mode' 
      : 'Switch to dark mode';
  }, [isDark, isSystemTheme, systemMode]);

  return {
    mode,
    isSystemTheme,
    systemMode,
    toggleMode,
    setMode,
    isDark,
    isLight,
    getToggleAriaLabel,
    getToggleTooltip,
  };
};

export default useThemeToggle;