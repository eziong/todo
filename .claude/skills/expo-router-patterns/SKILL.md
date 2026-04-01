---
name: expo-router-patterns
description: Expo Router (expo-router) file-based routing patterns for Expo and React Native projects. Use when creating new screens in app/ directory, setting up _layout.tsx files, configuring tab navigation, implementing auth redirects, or working with useLocalSearchParams and useRouter in Expo Router.
user-invocable: false
---

# Expo Router Patterns

## File-Based Routing Structure

```
app/
├── _layout.tsx              # Root layout (providers, global config)
├── index.tsx                # Entry redirect (auth check)
├── (auth)/
│   ├── _layout.tsx          # Auth group layout
│   └── login.tsx            # Login screen
├── (tabs)/
│   ├── _layout.tsx          # Tab navigator
│   ├── home.tsx             # Tab 1
│   ├── search.tsx           # Tab 2
│   └── profile.tsx          # Tab 3
├── item/
│   ├── [id].tsx             # Dynamic route: /item/123
│   └── [itemId]/
│       ├── _layout.tsx      # Nested layout
│       ├── edit.tsx         # /item/123/edit
│       └── comments.tsx     # /item/123/comments
└── settings/
    └── index.tsx            # /settings
```

## Root Layout (Provider Hierarchy)

```tsx
// app/_layout.tsx
export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
              <BottomSheetModalProvider>
                <ErrorBoundary>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="item/[id]"
                      options={{ presentation: 'card' }} />
                  </Stack>
                </ErrorBoundary>
              </BottomSheetModalProvider>
            </QueryClientProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
```

**Key**: `headerShown: false` globally → each screen provides its own custom header.

## Tab Layout

```tsx
// app/(tabs)/_layout.tsx
export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        lazy: true,  // Lazy-load tab content
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      {/* More tabs */}
    </Tabs>
  );
}
```

## Dynamic Route Screen (Container)

```tsx
// app/item/[id].tsx
export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const itemId = ItemId(id || '');  // Branded type conversion
  const { data, isLoading, error, refetch } = useItem(itemId);

  return (
    <ItemDetailPresenter
      item={data}
      isLoading={isLoading}
      error={error}
      insets={insets}
      onBack={() => router.back()}
      onRefresh={refetch}
    />
  );
}
```

## Auth-Protected Redirect

```tsx
// app/index.tsx
export default function Index() {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  return <LoadingState />;  // Brief loading while checking auth
}
```

## Custom Screen Header

Since `headerShown: false` globally, each screen renders its own header:

```tsx
function ScreenHeader({ title, onBack, rightAction }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top }}
          className="bg-white px-4 pb-3 dark:bg-gray-900">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onBack} className="min-h-[44px] min-w-[44px]">
          <ChevronLeft size={24} />
        </Pressable>
        <Text className="text-lg font-semibold">{title}</Text>
        {rightAction || <View className="w-[44px]" />}
      </View>
    </View>
  );
}
```

## Navigation Patterns

```tsx
// Push new screen
router.push(`/item/${id}`);

// Replace current screen (no back button)
router.replace('/(tabs)/home');

// Go back
router.back();

// Pass params via URL
router.push(`/item/${id}/edit?mode=quick`);

// Read params
const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
```

## Deep Linking

```tsx
// app.json
{
  "expo": {
    "scheme": "myapp",
    "web": { "bundler": "metro" }
  }
}

// Deep link: myapp://item/123
// Maps to: app/item/[id].tsx with id=123
```

## Rules

1. **Route files are Containers** → All logic here, delegate UI to Presenter
2. **`headerShown: false` globally** → Custom headers per screen
3. **Branded types at route boundary** → Convert `string` params to branded types immediately
4. **Lazy tabs** → Set `lazy: true` in tab screenOptions
5. **Platform-specific dimensions** → Tab bar height, safe area insets
6. **Auth redirect in index** → Check auth state, replace to appropriate screen
7. **No logic in layouts** → Layouts only configure navigation and providers
