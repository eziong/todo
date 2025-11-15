# Design System Foundation

A comprehensive macOS-inspired design system built on Material-UI with full dark mode support, todo app specific tokens, and accessibility compliance.

## Features

- **🌓 Dark/Light Mode**: Automatic system theme detection with manual override
- **🎨 macOS Design Language**: Apple-inspired colors, typography, and animations
- **📱 Responsive Design**: Mobile-first approach with optimized breakpoints
- **♿ Accessibility**: WCAG 2.1 AA compliant with proper contrast ratios
- **🔧 Developer Experience**: Type-safe theme tokens and utilities
- **📦 Component Variants**: Pre-built variants for todo app components
- **💾 Persistence**: Theme preference storage in localStorage

## Quick Start

### Basic Setup

```tsx
import { ThemeProvider } from '@/components/ThemeProvider/ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultMode="light" enableSystemTheme>
      <YourApp />
    </ThemeProvider>
  );
}
```

### Using Theme Context

```tsx
import { useThemeContext } from '@/components/ThemeProvider/ThemeProvider';

function MyComponent() {
  const { mode, toggleMode, isSystemTheme } = useThemeContext();
  
  return (
    <div>
      <p>Current theme: {mode}</p>
      <button onClick={toggleMode}>Toggle Theme</button>
      {isSystemTheme && <span>Following system theme</span>}
    </div>
  );
}
```

### Theme Toggle Component

```tsx
import { ThemeToggle } from '@/components/ThemeProvider/ThemeProvider';

function Header() {
  return (
    <header>
      <h1>My Todo App</h1>
      <ThemeToggle size="medium" showSystemIndicator />
    </header>
  );
}
```

## Design Tokens

### Colors

#### Workspace Colors
```tsx
import { designTokens } from '@/theme/utils';

const colors = designTokens.colors.workspace;
// ['#007AFF', '#34C759', '#FF9500', '#5856D6', ...]
```

#### Task Status Colors
```tsx
import { getTaskStatusColor } from '@/theme/utils';

const statusColor = getTaskStatusColor('completed', 'dark');
// '#34C759'
```

#### Task Priority Colors
```tsx
import { getTaskPriorityColor } from '@/theme/utils';

const priorityColor = getTaskPriorityColor('urgent', 'light');
// '#AF52DE'
```

### Typography

Apple-inspired font hierarchy using San Francisco fonts:

- **h1**: Large Title (34px, 700 weight)
- **h2**: Title 1 (28px, 700 weight)
- **h3**: Title 2 (22px, 600 weight)
- **h4**: Title 3 (20px, 600 weight)
- **h5**: Headline (17px, 600 weight)
- **h6**: Body (16px, 600 weight)
- **body1**: Body (16px, 400 weight)
- **body2**: Callout (15px, 400 weight)

### Spacing

8px base unit system:
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px

### Border Radius

macOS-style rounded corners:
- **small**: 4px
- **medium**: 8px
- **large**: 12px
- **xlarge**: 16px

### Shadows

Depth-aware shadow system:
- **subtle**: Light depth
- **medium**: Card depth
- **strong**: Modal depth
- **card**: Component-specific card shadow
- **modal**: Overlay shadow

## Component Variants

### Card Variants

```tsx
import { Card } from '@mui/material';

// Task card variant
<Card variant="task">Task content</Card>

// Workspace card variant
<Card variant="workspace">Workspace content</Card>
```

### Button Variants

```tsx
import { Button } from '@mui/material';

// Workspace button variant
<Button variant="workspace">Workspace</Button>
```

## Theme Utilities

### Using Theme Utils

```tsx
import { themeUtils } from '@/theme/utils';

function MyComponent() {
  return (
    <div
      style={{
        padding: themeUtils.layout.getSpacing('md'),
        borderRadius: themeUtils.layout.getBorderRadius('large'),
        boxShadow: themeUtils.layout.getShadow('card'),
        color: themeUtils.colors.getTaskStatusColor('completed'),
      }}
    >
      Content
    </div>
  );
}
```

### Using with MUI sx prop

```tsx
import { Box } from '@mui/material';
import { designTokens } from '@/theme/utils';

function MyComponent() {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: designTokens.borderRadius.large / 8, // Convert to theme units
        boxShadow: designTokens.shadows.card,
        transition: designTokens.animation.fast,
      }}
    >
      Content
    </Box>
  );
}
```

## Accessibility

### Focus Management

```tsx
import { getFocusStyles } from '@/theme/utils';

const MyButton = styled(Button)(({ theme }) => ({
  '&:focus-visible': getFocusStyles(theme),
}));
```

### Color Contrast

The theme automatically ensures WCAG 2.1 AA compliance:

- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text
- Proper color adjustments in dark mode

## Advanced Usage

### Custom Theme Creation

```tsx
import { createAppTheme } from '@/theme/utils';

const customTheme = createAppTheme('dark');
// Use with MUIThemeProvider directly
```

### Theme Mode Detection

```tsx
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

function MyComponent() {
  const { mode, systemMode, isSystemTheme } = useTheme();
  
  // mode: current effective theme
  // systemMode: detected system preference
  // isSystemTheme: whether following system
}
```

### Responsive Design

```tsx
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

function ResponsiveComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {!isMobile && !isTablet && <DesktopLayout />}
    </div>
  );
}
```

## Best Practices

### 1. Use Theme Tokens

❌ **Don't** use hardcoded values:
```tsx
<div style={{ color: '#007AFF', borderRadius: '8px' }}>
```

✅ **Do** use design tokens:
```tsx
<div style={{ 
  color: theme.palette.primary.main,
  borderRadius: theme.macOS.borderRadius.medium 
}}>
```

### 2. Leverage Theme Context

❌ **Don't** manage theme state manually:
```tsx
const [isDark, setIsDark] = useState(false);
```

✅ **Do** use theme context:
```tsx
const { mode, toggleMode } = useThemeContext();
```

### 3. Follow Container-Presenter Pattern

❌ **Don't** mix theme logic with presentation:
```tsx
function MyComponent() {
  const theme = useTheme();
  const [mode, setMode] = useState('light');
  // ... presentation logic
}
```

✅ **Do** separate concerns:
```tsx
// useMyComponent.ts (container)
function useMyComponent() {
  const { mode, toggleMode } = useThemeContext();
  return { mode, toggleMode };
}

// MyComponent.tsx (presenter)
function MyComponent() {
  const { mode, toggleMode } = useMyComponent();
  // ... pure presentation
}
```

### 4. Use Semantic Colors

❌ **Don't** use generic color names:
```tsx
<Chip style={{ backgroundColor: 'red' }}>High Priority</Chip>
```

✅ **Do** use semantic naming:
```tsx
<Chip style={{ 
  backgroundColor: getTaskPriorityColor('high', mode) 
}}>High Priority</Chip>
```

## Migration Guide

If updating from a previous theme system:

1. **Update imports**:
   ```tsx
   // Old
   import theme from '@/theme/utils';
   
   // New
   import { theme, createAppTheme } from '@/theme/utils';
   ```

2. **Update theme provider**:
   ```tsx
   // Old
   <ThemeProvider theme={theme}>
   
   // New
   <ThemeProvider defaultMode="light" enableSystemTheme>
   ```

3. **Add theme toggle**:
   ```tsx
   import { ThemeToggle } from '@/components/ThemeProvider/ThemeProvider';
   <ThemeToggle />
   ```

## Performance

- **Theme creation**: Memoized for optimal performance
- **Context updates**: Minimal re-renders with optimized context structure
- **System theme detection**: Efficient media query listeners
- **Storage**: Debounced localStorage writes

## Browser Support

- **Modern browsers**: Full support
- **Safari**: Full support with optimized Apple fonts
- **Mobile browsers**: Responsive design optimized
- **Accessibility**: Screen reader compatible

## Contributing

When extending the theme system:

1. Follow the existing naming conventions
2. Add TypeScript types for new tokens
3. Update this documentation
4. Test in both light and dark modes
5. Verify accessibility compliance
6. Add component variants to the theme file
7. Include usage examples in comments