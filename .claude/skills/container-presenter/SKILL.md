---
name: container-presenter
description: Container-Presenter component architecture for React and React Native (Expo) projects. Use when creating new screens, components, or refactoring in projects that use React, React Native, or Expo with a Container (logic) + Presenter (UI) separation pattern.
user-invocable: false
---

# Container-Presenter Pattern

Split every screen/feature into two files for separation of concerns.

## Structure

```
app/feature/page.tsx                          ← Container (route file)
src/components/features/feature/Feature.presenter.tsx  ← Presenter
```

## Container (Route / Logic Layer)

- Lives in the routing directory (`app/`, `pages/`)
- **Orchestration layer**: 필요한 state를 각 소스(React Query, Screen Store, Singleton Zustand, useState)에서 가져옴
- 라우트 파라미터 검증 + branded type 변환
- 비즈니스 로직(mutation, navigation 등)을 선언
- Presenter에는 **필수 최소 props만** 전달 (ID 등 — URL에서 얻을 수 있는 값은 전달 불필요)
- Never contains JSX layout beyond the single Presenter render

### State 소스 결정 기준

| 데이터 종류 | 소스 | Container 역할 |
|------------|------|---------------|
| 서버 데이터 | React Query (`useQuery`) | 직접 호출 또는 자식이 직접 호출 |
| 화면 공유 UI 상태 | Screen Store (`screenKeys.*`) | screenKey 생성, 구독 |
| 앱 전역 상태 | Singleton Zustand | 구독 |
| 컴포넌트 로컬 상태 | `useState` | 해당 컴포넌트에서 직접 |

> Screen Store와 screenKeys 규칙은 `zustand-best-practices` 스킬 참조.

### 단순 화면 (탭 없음)

```tsx
// app/items/[id].tsx (Container)
export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id || typeof id !== 'string') return <LoadingState />;

  const router = useRouter();
  const { data: item, isLoading, error, refetch } = useItem(id);
  const deleteItem = useDeleteItem();

  const handleDelete = async () => {
    await deleteItem.mutateAsync(id);
    router.back();
  };

  return (
    <ItemDetailPresenter
      item={item}
      isLoading={isLoading}
      error={error}
      onRefresh={refetch}
      onDelete={handleDelete}
      onBack={() => router.back()}
    />
  );
}
```

### 복잡한 화면 (탭 있음) — Screen Store 사용

```tsx
// app/trip/[tripId]/index.tsx (Container)
export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  if (!tripId || typeof tripId !== 'string') return <LoadingState />;

  const key = screenKeys.tripDetail(tripId);
  const router = useRouter();

  // Screen Store — 화면 공유 상태만 구독
  const activeTab = tripDetailStore.useScreenStore(key, (s) => s.activeTab);
  const setActiveTab = tripDetailStore.useScreenStore(key, (s) => s.setActiveTab);

  // 화면 수준 데이터만 (전체 탭 공통)
  const { data: trip, isLoading, error } = useTrip(tripId);

  return (
    <TripDetailPresenter
      trip={trip}
      isLoading={isLoading}
      error={error}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBack={() => router.back()}
    />
  );
}

// 각 탭은 자체적으로 데이터를 가져옴 — Container에서 props drilling 하지 않음
function TripScheduleTab({ tripId }: { tripId: string }) {
  const key = screenKeys.tripDetail(tripId);
  const selectedDay = tripDetailStore.useScreenStore(key, (s) => s.selectedDay);
  const { data: schedules } = useSchedules(tripId);
  return <ScheduleList schedules={schedules} selectedDay={selectedDay} />;
}
```

### Props Drilling 금지

> God Container 안티패턴 상세 설명과 코드 예제는 `react-data-patterns.md` §0 참조.

각 탭/섹션이 자체적으로 React Query + Screen Store에서 직접 데이터를 가져오도록 설계.

## Presenter (UI Layer)

- Lives in `src/components/features/<feature>/`
- Pure rendering: 레이아웃과 UI 구성에 집중
- No `useRouter`, no business logic (API 호출, mutation 등)
- Allowed hooks: `useTranslation`, `useState` (local UI only), `useAnimatedStyle`, Screen Store 구독 (read-only UI 상태)
- React Compiler가 리렌더 자동 최적화 — `React.memo` 래핑 금지

```tsx
// src/components/features/item/ItemDetail.presenter.tsx
interface ItemDetailPresenterProps {
  item: Item | undefined;
  isLoading: boolean;
  error: unknown;
  onRefresh: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function ItemDetailPresenter({
  item,
  isLoading,
  error,
  onRefresh,
  onDelete,
  onBack,
}: ItemDetailPresenterProps) {
  const { t } = useTranslation();

  if (isLoading) return <LoadingState />;
  if (error || !item) return <ErrorState onRetry={onRefresh} />;

  return (
    <View className="flex-1">
      {/* Pure UI rendering */}
    </View>
  );
});
```

## Rules

1. **Presenter > 200 lines** → Split into nested Container-Presenter pairs
2. **Props interface** → Always explicitly typed, exported for testing
3. **Callbacks** → All prefixed with `on` (onPress, onDelete, onSubmit)
4. **No router in Presenter** → Navigation is Container responsibility
5. **No business logic in Presenter** → API 호출, mutation은 Container에서 선언
6. **Local UI state OK** → `useState` for modals, animations within Presenter
7. **Props drilling 금지** → 자식 컴포넌트는 React Query, Screen Store에서 직접 구독
8. **Container props는 최소한** → ID처럼 필수 값만 전달, URL에서 얻을 수 있으면 전달 불필요
9. **Container 구독 최소화** → 렌더링에 불필요한 store 값은 `getState()`로 이벤트 시점에 읽기
10. **Presenter 구독 격리** → store 값이 일부 자식만 필요하면 자체 구독 memo 컴포넌트로 추출

## Container 구독 최소화

Container가 store 값을 구독하면 해당 값 변경마다 **Presenter 포함 전체 트리**가 리렌더된다.

```tsx
// ❌ Container에서 activeTab 구독 → 탭 전환마다 전체 리렌더
export default function TripDetailScreen() {
  const sk = screenKeys.tripDetail(tripId);
  const activeTab = tripDetailStore.useScreenStore(sk, (s) => s.activeTab);  // 구독
  const handleRefresh = () => invalidateTabQueries(activeTab, tripId);
  return <TripDetailPresenter {...props} />;  // activeTab 변경 → 여기부터 전부 리렌더
}

// ✅ getState()로 이벤트 시점에 읽기 → Container 리렌더 없음
export default function TripDetailScreen() {
  const sk = screenKeys.tripDetail(tripId);
  // activeTab 구독 제거 — Container는 탭 값이 렌더링에 불필요
  const handleRefresh = () => {
    const currentTab = tripDetailStore.getOrCreate(sk).getState().activeTab;
    invalidateTabQueries(currentTab, tripId);
  };
  return <TripDetailPresenter {...props} />;
}
```

**원칙**: Container에서 store 값을 `useScreenStore()`로 구독하기 전에 물어볼 것:
- 이 값이 **JSX 렌더링**에 필요한가? → `useScreenStore()` (구독)
- **이벤트 핸들러/콜백**에서만 참조하는가? → `getOrCreate().getState()` (non-reactive)

## Presenter 구독 격리

Presenter 본체에서 store를 구독하면 **형제 컴포넌트 전체**가 리렌더된다.
구독이 필요한 영역만 별도 memo 컴포넌트로 추출.

```tsx
// ❌ Presenter 본체에서 activeTab 구독 → HeroSection, Modals도 리렌더
export function TripDetailPresenter(props) {
  const activeTab = tripDetailStore.useScreenStore(sk, (s) => s.activeTab);
  return (
    <View>
      <HeroSection trip={trip} />           {/* 불필요 리렌더 */}
      <StickyTabBar activeTab={activeTab} />
      <TabContent activeTab={activeTab} />
      <Modals />                            {/* 불필요 리렌더 */}
    </View>
  );
}

// ✅ 구독을 소비하는 별도 컴포넌트 추출 (구조적 격리)
function StickyHeaderSection({ sk, onTabChange }) {
  const activeTab = tripDetailStore.useScreenStore(sk, (s) => s.activeTab);
  return <StickyTabBar activeTab={activeTab} onTabChange={onTabChange} />;
}

export function TripDetailPresenter(props) {
  return (
    <View>
      <HeroSection trip={trip} />             {/* 리렌더 없음 */}
      <StickyHeaderSection sk={sk} />          {/* activeTab 변경 시만 */}
      <TabContentSection sk={sk} tripId={tripId} /> {/* activeTab 변경 시만 */}
      <Modals />                               {/* 리렌더 없음 */}
    </View>
  );
}
```

> 상세 패턴은 `zustand-best-practices` 스킬의 "구독 격리 패턴" 참조.

## Nested Splitting Example

When a Presenter grows large, extract sections into their own components.
각 탭/섹션은 자체적으로 React Query + Screen Store를 사용한다.

```
features/item/
├── ItemDetail.presenter.tsx       ← Main Presenter (탭 전환 UI만)
├── tabs/
│   ├── OverviewTab.tsx            ← 자체 useQuery + Screen Store 구독
│   ├── DetailsTab.tsx             ← 자체 useQuery + Screen Store 구독
│   └── StickyTabBar.tsx           ← Shared tab UI
├── sections/
│   ├── HeroSection.tsx            ← UI section
│   └── InfoCard.tsx               ← UI section
└── states/
    └── ErrorState.tsx             ← Feature-specific states
```

## Anti-Patterns

```tsx
// BAD: Router in Presenter
function ItemPresenter() {
  const router = useRouter(); // NO!
  return <Button onPress={() => router.push('/next')} />;
}

// BAD: Business logic in Presenter
function ItemPresenter({ item }) {
  const handleDelete = async () => {
    await api.delete(`/items/${item.id}`); // NO!
  };
}

// BAD: God Container → react-data-patterns.md §0 참조
// BAD: Props drilling → 각 탭이 자체 React Query/Screen Store에서 직접 데이터 가져오기
```
