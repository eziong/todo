'use client';

import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { 
  LightMode as LightModeIcon, 
  DarkMode as DarkModeIcon,
  Brightness6 as SystemIcon 
} from '@mui/icons-material';
import { useThemeToggle } from './useThemeToggle';


interface ThemeToggleProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showSystemIndicator?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  size = 'medium',
  showSystemIndicator = false,
}) => {
  const theme = useTheme();
  const {
    isDark,
    isSystemTheme,
    toggleMode,
    getToggleAriaLabel,
    getToggleTooltip,
  } = useThemeToggle();

  const getIcon = (): React.ReactElement => {
    if (showSystemIndicator && isSystemTheme) {
      return <SystemIcon />;
    }
    return isDark ? <LightModeIcon /> : <DarkModeIcon />;
  };

  const iconColor = isDark ? '#FFCC00' : '#FF9500'; // Sun/Moon colors

  return (
    <Tooltip title={getToggleTooltip()} placement="bottom">
      <IconButton
        onClick={toggleMode}
        size={size}
        className={className}
        aria-label={getToggleAriaLabel()}
        sx={{
          color: isSystemTheme ? theme.palette.text.secondary : iconColor,
          transition: theme.transitions.create(['color', 'transform'], {
            duration: theme.transitions.duration.short,
          }),
          '&:hover': {
            color: isSystemTheme 
              ? theme.palette.text.primary 
              : isDark ? '#FFDD44' : '#FFB333',
            transform: 'scale(1.1)',
          },
          ...(isSystemTheme && {
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.main,
              opacity: 0.7,
            },
          }),
        }}
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;