import { createTheme, ThemeOptions } from '@mui/material/styles';

// Type utilities for theme usage (must be defined early)
export type ThemeMode = 'light' | 'dark';
export type WorkspaceColor = string;
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Enhanced Theme Interface with Todo App Specific Extensions
declare module '@mui/material/styles' {
  interface Theme {
    macOS: {
      shadows: {
        subtle: string;
        medium: string;
        strong: string;
        card: string;
        modal: string;
      };
      borderRadius: {
        small: number;
        medium: number;
        large: number;
        xlarge: number;
      };
      spacing: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
      };
      animation: {
        fast: string;
        medium: string;
        slow: string;
      };
      todo: {
        workspace: {
          colors: string[];
          defaultColor: string;
        };
        task: {
          status: {
            todo: string;
            in_progress: string;
            completed: string;
            archived: string;
          };
          priority: {
            low: string;
            medium: string;
            high: string;
            urgent: string;
          };
        };
      };
    };
  }

  interface ThemeOptions {
    macOS?: {
      shadows?: {
        subtle?: string;
        medium?: string;
        strong?: string;
        card?: string;
        modal?: string;
      };
      borderRadius?: {
        small?: number;
        medium?: number;
        large?: number;
        xlarge?: number;
      };
      spacing?: {
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
      };
      animation?: {
        fast?: string;
        medium?: string;
        slow?: string;
      };
      todo?: {
        workspace?: {
          colors?: string[];
          defaultColor?: string;
        };
        task?: {
          status?: {
            todo?: string;
            in_progress?: string;
            completed?: string;
            archived?: string;
          };
          priority?: {
            low?: string;
            medium?: string;
            high?: string;
            urgent?: string;
          };
        };
      };
    };
  }

  interface Palette {
    neutral: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
  }

  interface PaletteOptions {
    neutral?: {
      50?: string;
      100?: string;
      200?: string;
      300?: string;
      400?: string;
      500?: string;
      600?: string;
      700?: string;
      800?: string;
      900?: string;
      950?: string;
    };
  }
}

// Enhanced Color System with Light/Dark Mode Support
const createPalette = (mode: 'light' | 'dark'): any => {
  const isLight = mode === 'light';

  return {
    mode,
    primary: {
      main: '#007AFF',
      light: '#5AC8FA',
      dark: '#0051D5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#5856D6',
      light: '#AF52DE',
      dark: '#3634A3',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF3B30',
      light: '#FF6961',
      dark: '#D70015',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FF9500',
      light: '#FFAD33',
      dark: '#CC7700',
      contrastText: isLight ? '#1D1D1F' : '#FFFFFF',
    },
    info: {
      main: '#5AC8FA',
      light: '#7BD3FB',
      dark: '#32ADF7',
      contrastText: isLight ? '#1D1D1F' : '#FFFFFF',
    },
    success: {
      main: '#34C759',
      light: '#63D77A',
      dark: '#28A745',
      contrastText: '#FFFFFF',
    },
    neutral: {
      50: isLight ? '#FAFAFA' : '#0A0A0A',
      100: isLight ? '#F5F5F5' : '#171717',
      200: isLight ? '#EEEEEE' : '#262626',
      300: isLight ? '#E0E0E0' : '#404040',
      400: isLight ? '#BDBDBD' : '#525252',
      500: isLight ? '#9E9E9E' : '#737373',
      600: isLight ? '#757575' : '#A3A3A3',
      700: isLight ? '#616161' : '#D4D4D4',
      800: isLight ? '#424242' : '#E5E5E5',
      900: isLight ? '#212121' : '#F5F5F5',
      950: isLight ? '#0F0F0F' : '#FAFAFA',
    },
    background: {
      default: isLight ? '#F2F2F7' : '#000000',
      paper: isLight ? '#FFFFFF' : '#1C1C1E',
    },
    text: {
      primary: isLight ? '#1D1D1F' : '#FFFFFF',
      secondary: isLight ? '#86868B' : '#8E8E93',
      disabled: isLight ? '#C7C7CC' : '#48484A',
    },
    divider: isLight ? 'rgba(60, 60, 67, 0.12)' : 'rgba(84, 84, 88, 0.24)',
    action: {
      active: isLight ? '#007AFF' : '#0A84FF',
      hover: isLight ? 'rgba(0, 122, 255, 0.04)' : 'rgba(10, 132, 255, 0.08)',
      selected: isLight ? 'rgba(0, 122, 255, 0.08)' : 'rgba(10, 132, 255, 0.16)',
      disabled: isLight ? 'rgba(60, 60, 67, 0.3)' : 'rgba(84, 84, 88, 0.3)',
      disabledBackground: isLight ? 'rgba(60, 60, 67, 0.12)' : 'rgba(84, 84, 88, 0.12)',
    },
  };
};

// Enhanced Typography with Apple-Style Font Hierarchy
const createTypography = (): any => ({
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"San Francisco"',
    '"SF Pro Display"',
    '"SF Pro Text"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  // Large Titles
  h1: {
    fontSize: '2.125rem', // 34px
    fontWeight: 700,
    lineHeight: 1.18,
    letterSpacing: '-0.022em',
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Title 1
  h2: {
    fontSize: '1.75rem', // 28px
    fontWeight: 700,
    lineHeight: 1.21,
    letterSpacing: '-0.021em',
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Title 2
  h3: {
    fontSize: '1.375rem', // 22px
    fontWeight: 600,
    lineHeight: 1.27,
    letterSpacing: '-0.02em',
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Title 3
  h4: {
    fontSize: '1.25rem', // 20px
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.019em',
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Headline
  h5: {
    fontSize: '1.0625rem', // 17px
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '-0.017em',
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Body
  h6: {
    fontSize: '1rem', // 16px
    fontWeight: 600,
    lineHeight: 1.375,
    letterSpacing: '-0.016em',
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Body
  body1: {
    fontSize: '1rem', // 16px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '-0.011em',
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Callout
  body2: {
    fontSize: '0.9375rem', // 15px
    fontWeight: 400,
    lineHeight: 1.47,
    letterSpacing: '-0.009em',
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Subheadline
  subtitle1: {
    fontSize: '0.9375rem', // 15px
    fontWeight: 500,
    lineHeight: 1.47,
    letterSpacing: '-0.009em',
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Footnote
  subtitle2: {
    fontSize: '0.8125rem', // 13px
    fontWeight: 400,
    lineHeight: 1.38,
    letterSpacing: '-0.006em',
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Caption 1
  caption: {
    fontSize: '0.75rem', // 12px
    fontWeight: 400,
    lineHeight: 1.33,
    letterSpacing: '0em',
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Caption 2
  overline: {
    fontSize: '0.6875rem', // 11px
    fontWeight: 400,
    lineHeight: 1.27,
    letterSpacing: '0.006em',
    textTransform: 'uppercase' as const,
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  // Button
  button: {
    fontSize: '1rem', // 16px
    fontWeight: 500,
    lineHeight: 1.25,
    letterSpacing: '-0.011em',
    textTransform: 'none' as const,
    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },
});

// Enhanced macOS Design Tokens
const createMacOSTokens = (mode: 'light' | 'dark'): any => ({
  shadows: {
    subtle: mode === 'light' 
      ? '0 1px 3px rgba(0, 0, 0, 0.12)' 
      : '0 1px 3px rgba(0, 0, 0, 0.3)',
    medium: mode === 'light' 
      ? '0 4px 6px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)' 
      : '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.25)',
    strong: mode === 'light' 
      ? '0 10px 15px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.10)' 
      : '0 10px 15px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.3)',
    card: mode === 'light'
      ? '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)'
      : '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.25)',
    modal: mode === 'light'
      ? '0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04)'
      : '0 20px 25px rgba(0, 0, 0, 0.6), 0 10px 10px rgba(0, 0, 0, 0.25)',
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  animation: {
    fast: '150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    medium: '250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    slow: '400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  todo: {
    workspace: {
      colors: [
        '#007AFF', // Blue
        '#34C759', // Green
        '#FF9500', // Orange
        '#5856D6', // Purple
        '#FF3B30', // Red
        '#5AC8FA', // Light Blue
        '#AF52DE', // Pink
        '#FFCC00', // Yellow
        '#30D158', // Mint
        '#64D2FF', // Cyan
        '#BF5AF2', // Violet
        '#FF6961', // Salmon
      ],
      defaultColor: '#007AFF',
    },
    task: {
      status: {
        todo: mode === 'light' ? '#86868B' : '#8E8E93',
        in_progress: '#007AFF',
        completed: '#34C759',
        archived: mode === 'light' ? '#C7C7CC' : '#48484A',
      },
      priority: {
        low: mode === 'light' ? '#86868B' : '#8E8E93',
        medium: '#FF9500',
        high: '#FF3B30',
        urgent: '#AF52DE',
      },
    },
  },
});

// Enhanced Component Overrides for Todo App
const createComponentOverrides = (mode: 'light' | 'dark'): any => {
  const isLight = mode === 'light';
  const macOSTokens = createMacOSTokens(mode) as any;

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: isLight ? '#F2F2F7' : '#000000',
          transition: 'background-color 0.2s ease-in-out',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: macOSTokens.borderRadius.medium,
          textTransform: 'none' as const,
          fontWeight: 500,
          fontSize: '1rem',
          lineHeight: 1.25,
          letterSpacing: '-0.011em',
          boxShadow: 'none',
          transition: 'all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          '&:hover': {
            boxShadow: macOSTokens.shadows.subtle,
          },
        },
        contained: {
          '&:hover': {
            boxShadow: macOSTokens.shadows.medium,
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
        sizeSmall: {
          fontSize: '0.875rem',
          padding: '6px 12px',
        },
        sizeLarge: {
          fontSize: '1.125rem',
          padding: '12px 24px',
        },
      },
      variants: [
        {
          props: { variant: 'workspace' },
          style: {
            borderRadius: macOSTokens.borderRadius.small,
            padding: '4px 8px',
            fontSize: '0.8125rem',
            fontWeight: 500,
            minWidth: 'auto',
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: macOSTokens.borderRadius.large,
          boxShadow: macOSTokens.shadows.card,
          border: isLight ? 'none' : '1px solid rgba(84, 84, 88, 0.24)',
          transition: 'all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          '&:hover': {
            boxShadow: macOSTokens.shadows.medium,
            transform: 'translateY(-1px)',
          },
        },
      },
      variants: [
        {
          props: { variant: 'task' },
          style: {
            borderRadius: macOSTokens.borderRadius.medium,
            padding: '12px 16px',
            cursor: 'pointer',
          },
        },
        {
          props: { variant: 'workspace' },
          style: {
            borderRadius: macOSTokens.borderRadius.xlarge,
            padding: '20px 24px',
          },
        },
      ],
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: macOSTokens.borderRadius.medium,
          backgroundImage: 'none',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: macOSTokens.shadows.subtle,
        },
        elevation2: {
          boxShadow: macOSTokens.shadows.card,
        },
        elevation3: {
          boxShadow: macOSTokens.shadows.medium,
        },
        elevation4: {
          boxShadow: macOSTokens.shadows.strong,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: macOSTokens.borderRadius.medium,
            backgroundColor: isLight ? '#FFFFFF' : '#1C1C1E',
            transition: 'all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            '& fieldset': {
              borderColor: isLight ? 'rgba(60, 60, 67, 0.18)' : 'rgba(84, 84, 88, 0.48)',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: '#007AFF',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#007AFF',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: macOSTokens.borderRadius.medium,
          transition: 'all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          '&:hover': {
            backgroundColor: isLight ? 'rgba(0, 122, 255, 0.08)' : 'rgba(10, 132, 255, 0.16)',
          },
        },
        sizeSmall: {
          padding: '4px',
        },
        sizeLarge: {
          padding: '12px',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          paddingTop: macOSTokens.spacing.sm,
          paddingBottom: macOSTokens.spacing.sm,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: macOSTokens.borderRadius.medium,
          marginTop: 2,
          marginBottom: 2,
          transition: 'all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          '&:hover': {
            backgroundColor: isLight ? 'rgba(0, 122, 255, 0.04)' : 'rgba(10, 132, 255, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: isLight ? 'rgba(0, 122, 255, 0.08)' : 'rgba(10, 132, 255, 0.16)',
            '&:hover': {
              backgroundColor: isLight ? 'rgba(0, 122, 255, 0.12)' : 'rgba(10, 132, 255, 0.2)',
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: macOSTokens.borderRadius.medium,
          transition: 'all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          '&:hover': {
            backgroundColor: isLight ? 'rgba(0, 122, 255, 0.04)' : 'rgba(10, 132, 255, 0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: macOSTokens.borderRadius.xlarge,
          fontSize: '0.8125rem',
          fontWeight: 500,
          height: '28px',
        },
        filled: {
          '&.MuiChip-colorDefault': {
            backgroundColor: isLight ? '#F2F2F7' : '#2C2C2E',
            color: isLight ? '#1D1D1F' : '#FFFFFF',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: macOSTokens.borderRadius.xlarge,
          boxShadow: macOSTokens.shadows.modal,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: '-0.019em',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase': {
            '&.Mui-checked': {
              color: '#34C759',
              '& + .MuiSwitch-track': {
                backgroundColor: '#34C759',
                opacity: 1,
              },
            },
          },
          '& .MuiSwitch-track': {
            borderRadius: 22,
            backgroundColor: isLight ? '#E9E9EA' : '#39393D',
            opacity: 1,
          },
        },
      },
    },
  };
};

// Create Theme Function
export const createAppTheme = (mode: 'light' | 'dark' = 'light'): ReturnType<typeof createTheme> => {
  const palette = createPalette(mode);
  const typography = createTypography();
  const macOSTokens = createMacOSTokens(mode);
  const components = createComponentOverrides(mode);

  return createTheme({
    palette,
    typography,
    shape: {
      borderRadius: macOSTokens.borderRadius.medium,
    },
    spacing: 8, // 8px base unit
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
      easing: {
        easeInOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    macOS: macOSTokens,
    components,
  } as ThemeOptions);
};

// Default light theme export for backward compatibility
export const theme = createAppTheme('light');
export default theme;

// Design token utilities
export const designTokens = {
  colors: {
    workspace: [
      '#007AFF', '#34C759', '#FF9500', '#5856D6',
      '#FF3B30', '#5AC8FA', '#AF52DE', '#FFCC00',
      '#30D158', '#64D2FF', '#BF5AF2', '#FF6961',
    ],
    taskStatus: {
      todo: '#86868B',
      in_progress: '#007AFF',
      completed: '#34C759',
      archived: '#C7C7CC',
    },
    taskPriority: {
      low: '#86868B',
      medium: '#FF9500',
      high: '#FF3B30',
      urgent: '#AF52DE',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
  },
  shadows: {
    subtle: '0 1px 3px rgba(0, 0, 0, 0.12)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
    strong: '0 10px 15px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.10)',
    card: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    modal: '0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },
  animation: {
    fast: '150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    medium: '250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    slow: '400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
};

// AppTheme type declaration
export type AppTheme = ReturnType<typeof createTheme>;