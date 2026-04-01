---
name: nativewind-patterns
description: NativeWind v2 (Tailwind CSS for React Native) styling patterns for projects using nativewind with tailwind.config.js. Use when styling React Native components with className, configuring dark mode in NativeWind, setting up design tokens, or debugging NativeWind/Tailwind issues in Expo or React Native.
user-invocable: false
---

# NativeWind Patterns

## Critical Dark Mode Rule

**NEVER set `darkMode: 'class'` in tailwind.config.js with NativeWind v2.**

NativeWind v2 uses its own dark variant internally: `addVariant("dark", "&::dark")` pseudo-element.
The native plugin sets `darkMode: "off"` internally. User config must NOT override this.

```js
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{tsx,ts}', './src/**/*.{tsx,ts}'],
  // darkMode: 'class',  ← NEVER ADD THIS LINE
  theme: { extend: { /* ... */ } },
  plugins: [],
};
```

**Symptom if violated**: All `dark:` classes silently ignored at runtime.
**Fix**: Remove `darkMode` line, then clear cache (`npx expo start --clear`).

## Design Token System

Define semantic colors with full shade scales:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#FDF5F0',
        100: '#FAE8DC',
        500: '#D97340',  // Main brand color
        600: '#C45C2A',
        700: '#A34820',
        900: '#5C2410',
      },
      secondary: { /* neutral grays */ },
      success: { /* greens */ },
      warning: { /* ambers */ },
      error: { /* reds */ },
    },
    fontFamily: {
      'sans': ['YourFont-Regular', 'System'],
      'medium': ['YourFont-Medium', 'System'],
      'semibold': ['YourFont-SemiBold', 'System'],
      'bold': ['YourFont-Bold', 'System'],
    },
  },
},
```

## Common Styling Patterns

### Safe Area Handling
```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Screen() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-white dark:bg-gray-900"
          style={{ paddingTop: insets.top }}>
      {/* Content */}
    </View>
  );
}
```

### Platform-Specific Styling
```tsx
import { Platform } from 'react-native';

// Platform-specific values
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 68;

// In className (shadow differs per platform)
<View className="bg-white shadow-sm ios:shadow-md android:elevation-2" />
```

### Touch Target Minimum (44pt)
```tsx
<Pressable
  className="min-h-[44px] min-w-[44px] items-center justify-center"
  accessibilityRole="button"
>
  <Icon size={24} />
</Pressable>
```

### Card Component Pattern
```tsx
<View className="mx-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
  <Text className="text-lg font-semibold text-gray-900 dark:text-white">
    {title}
  </Text>
  <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
    {description}
  </Text>
</View>
```

### Loading State
```tsx
<View className="flex-1 items-center justify-center">
  <ActivityIndicator size="large" color={colors.primary[500]} />
</View>
```

### Empty State
```tsx
<View className="flex-1 items-center justify-center px-8">
  <Icon name="inbox" size={64} className="text-gray-300" />
  <Text className="mt-4 text-center text-lg font-medium text-gray-500">
    {t('empty.title')}
  </Text>
  <Text className="mt-2 text-center text-sm text-gray-400">
    {t('empty.description')}
  </Text>
  <Button className="mt-6" onPress={onAction}>
    {t('empty.action')}
  </Button>
</View>
```

## Rules

1. **Never override darkMode** in tailwind.config.js with NativeWind v2
2. **Use semantic color tokens** → `text-primary-500` not `text-[#D97340]`
3. **className over style** → Prefer Tailwind classes, use `style` only for dynamic values
4. **44pt touch targets** → All interactive elements minimum 44x44 points
5. **Dark mode pairs** → Every `bg-white` needs `dark:bg-gray-900` etc.
6. **Cache clear after config changes** → `npx expo start --clear`
