---
name: mobile-ui-patterns
description: "React Native mobile UI reference patterns: Navigation configs, Header usage, Bottom Sheet architecture, Safe Area code, Animation, Form, Keyboard, FlatList optimization, Pull-to-Refresh. Use when implementing RN screens or UI components."
user-invocable: false
---

# Mobile UI Patterns — Reference

> 핵심 규칙/판단 테이블은 `ui-patterns.md` 규칙 참조. 이 스킬은 코드 예시와 상세 구현 패턴을 제공.

---

## Navigation Config Examples

### fullScreenModal (Create/Edit)
```tsx
<Stack.Screen
  name="trip/create"
  options={{
    headerShown: false,
    presentation: 'fullScreenModal',
    animation: 'slide_from_bottom',
    gestureEnabled: true,
    gestureDirection: 'vertical',
  }}
/>
```

fullScreenModal 대상: `trip/create`, `trip/edit/[id]`, `schedule/map-create`, `reservation/add`, `reservation/[id]/edit`, `budget/add-expense`, `budget/expense/[id]/edit`, `community/review/write`, `community/experience/share`, `profile` (edit), 모든 새 create/edit 화면.

### Default Push (Detail)
```tsx
<Stack.Screen
  name="trip/[tripId]"
  options={{ headerShown: false, animation: 'default' }}
/>
```

---

## Header Examples

### FormModalHeader
```tsx
<FormModalHeader
  title={t('trip.editTitle')}
  onCancel={onCancel}
  onSave={onSubmit}
  isSaveDisabled={isLoading || !hasChanges}
  isSaving={isLoading}
  withSafeArea
/>
```

### ScreenHeader
```tsx
<ScreenHeader title={t('settings.title')} onBack={router.back} />
```

---

## Bottom Sheet Architecture

### Standard Wrapper (필수)
```tsx
<Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
  <GestureHandlerRootView style={{ flex: 1 }}>
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView>{/* Content */}</BottomSheetView>
    </BottomSheet>
  </GestureHandlerRootView>
</Modal>
```

### onClose Example
```tsx
const [showMenu, setShowMenu] = useState(false);
const handleCloseMenu = () => setShowMenu(false); // Explicit false
<HeaderMenuSheet visible={showMenu} onClose={handleCloseMenu} />
```

### Pending Action (Modal-to-Modal)
```tsx
const pendingActionRef = useRef<(() => void) | null>(null);

useEffect(() => {
  if (!showMenu && pendingActionRef.current) {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action();
  }
}, [showMenu]);

const handleOptionPress = (option: MenuOption) => {
  pendingActionRef.current = option.onPress;
  onClose();
};
```

---

## Confirm Examples

### ConfirmSheet
```tsx
<ConfirmSheet
  visible={showConfirm}
  title={t('trip.deleteTitle')}
  message={t('trip.deleteMessage')}
  confirmLabel={t('common.delete')}
  destructive
  isLoading={deleteMutation.isPending}
  onConfirm={handleDelete}
  onClose={() => setShowConfirm(false)}
/>
```

### Alert.alert
```tsx
Alert.alert(
  t('common.confirm'),
  t('trip.discardChanges'),
  [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.discard'), style: 'destructive', onPress: handleDiscard },
  ]
);
```

---

## Animation Patterns (react-native-reanimated)

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

// List items: Staggered
<Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
  <Card />
</Animated.View>

// Form fields: Sequential
<Animated.View entering={FadeInDown.delay(0).duration(300)}><TitleField /></Animated.View>
<Animated.View entering={FadeInDown.delay(50).duration(300)}><DateField /></Animated.View>
```

| Type | Delay Pattern |
|------|--------------|
| List items | `index * 40-80ms` (cap at 5 items) |
| Form fields | `0, 50, 100, 150ms` sequential |
| Hero elements | `100-400ms` emphasis |

---

## Form Pattern (react-hook-form)

```tsx
const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
  defaultValues: { title: '' },
});

<Controller
  control={control}
  name="title"
  rules={{ required: t('errors.required') }}
  render={({ field: { onChange, value } }) => (
    <FloatingLabelInput
      label={t('form.title')}
      value={value}
      onChangeText={onChange}
      error={errors.title?.message}
    />
  )}
/>
```

---

## Keyboard Handling

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  className="flex-1 bg-white dark:bg-secondary-950"
>
  <ScrollView keyboardShouldPersistTaps="handled">
    {/* Form content */}
    <View className="h-24" />
  </ScrollView>
</KeyboardAvoidingView>
```

---

## Safe Area Code Examples

### Standard Screen
```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        {/* 콘텐츠 */}
      </ScrollView>
    </View>
  );
}
```

### Floating Elements
```tsx
// FAB
<Pressable style={{ position: 'absolute', bottom: insets.bottom + 16, right: 16 }} />

// Fixed Bottom Button
<View style={{ paddingBottom: insets.bottom + 16, paddingHorizontal: 16 }}>
  <Button title={t('common.save')} onPress={onSave} />
</View>
```

---

## Pull-to-Refresh

```tsx
<FlatList
  data={data}
  refreshControl={
    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary[500]} />
  }
  ListEmptyComponent={!isLoading ? <EmptyState ... /> : null}
/>
```

---

## FlatList Optimization

### 필수 Props
```tsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}               // 외부 정의
  getItemLayout={(_, index) => ({       // 고정 높이 시 필수
    length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
  })}
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={5}
  removeClippedSubviews={Platform.OS === 'android'}
/>
```

### renderItem
```tsx
// ❌ 인라인 — 매 렌더마다 전체 리스트 리렌더
<FlatList renderItem={({ item }) => <Card item={item} />} />

// ✅ 외부 정의 — Compiler 자동 최적화
function renderItem({ item }: { item: Item }) {
  return <Card item={item} onPress={handlePress} />;
}
<FlatList renderItem={renderItem} />
```

### 성능 튜닝

| Prop | 기본값 | 권장값 | 효과 |
|------|--------|--------|------|
| `windowSize` | 21 | 5-11 | 메모리 절약 |
| `maxToRenderPerBatch` | 10 | 3-5 | JS 스레드 부하 감소 |
| `initialNumToRender` | 10 | 화면 보이는 수 | 마운트 속도 향상 |
| `getItemLayout` | 없음 | 고정 높이 필수 | 스크롤 점프 방지 |
