'use client';

import React from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { type ThemeMode } from '../../theme';
import { useTheme } from './useTheme';
import { ThemeContextProvider } from './ThemeContext';
import type { BaseComponentProps } from '@/types';

interface ThemeProviderProps extends BaseComponentProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  enableSystemTheme?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  className,
  defaultMode = 'light',
  enableSystemTheme = true 
}) => {
  const themeState = useTheme({ 
    defaultMode, 
    enableSystemTheme 
  });

  const { mode, theme } = themeState;

  return (
    <ThemeContextProvider value={themeState}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <div className={className} data-theme={mode}>
          {children}
        </div>
      </MUIThemeProvider>
    </ThemeContextProvider>
  );
};