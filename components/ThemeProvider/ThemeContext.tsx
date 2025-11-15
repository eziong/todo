'use client';

import React, { createContext, useContext } from 'react';
import type { ThemeMode, AppTheme } from '../../theme';

interface ThemeContextValue {
  mode: ThemeMode;
  theme: AppTheme;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  isSystemTheme: boolean;
  systemMode: ThemeMode | null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeContextProviderProps {
  children: React.ReactNode;
  value: ThemeContextValue;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({
  children,
  value,
}) => {
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;