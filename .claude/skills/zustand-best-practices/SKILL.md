---
name: zustand-best-practices
description: Zustand state management best practices for projects using the zustand library. Use when creating zustand stores with create(), using persist middleware, managing client-side state, fixing re-render issues from store subscriptions, or choosing between Zustand vs React Query.
user-invocable: false
---

# Zustand Best Practices

> **4-Layer State Architecture** (Server data / Screen UI / App-global / Component-local)와 판단 기준은
> `react-data-patterns.md` §0 참조. 이 스킬은 Zustand 구현 패턴에 집중.

## Singleton Store Creation

```tsx
// stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({
        user,
        isAuthenticated: Boolean(user),
      }),

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const user = await fetchCurrentUser();
          set({ user, isAuthenticated: Boolean(user), isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      logout: () => set({
        user: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist what's needed for rehydration
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

## Selective Subscriptions (CRITICAL)

Always subscribe to individual values. Never destructure the whole store.

```tsx
// CORRECT: Selective subscription - re-renders only when `user` changes
const user = useAuthStore((s) => s.user);
const isLoading = useAuthStore((s) => s.isLoading);
const logout = useAuthStore((s) => s.logout);

// WRONG: Whole-store subscription - re-renders on ANY state change
const { user, isLoading, logout } = useAuthStore(); // NEVER DO THIS
```

## Convenience Hooks

Export focused hooks for common access patterns:

```tsx
// In the store file
export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);

// Named selectors for external use
export const selectUser = (s: AuthState) => s.user;
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
```

## External Constants for Fallback Values

Never create new references in selectors:

```tsx
// CORRECT: Stable reference, no unnecessary re-renders
const EMPTY_LIST: Item[] = [];
const items = useItemStore((s) => s.items ?? EMPTY_LIST);

// WRONG: Creates new array every render → infinite re-render loop
const items = useItemStore((s) => s.items ?? []); // NEVER DO THIS
```

## Singleton vs Screen Store — 판단 기준

| 질문 | Yes → | No → |
|------|-------|------|
| 모든 화면에서 동일한 값? | Singleton | Screen Store |
| 특정 화면/라우트에 종속? | Screen Store | Singleton |
| 라우트 파라미터(tripId 등)별로 다른 인스턴스? | Screen Store | Singleton |
| 앱 재시작 후에도 유지? | Singleton + persist | Screen Store (no persist) |

예시:
- `auth`, `theme`, `recentTrips` → **Singleton** (앱 전역)
- `activeTab`, `selectedDay`, `filters` → **Screen Store** (화면별)

## Anti-Patterns

```tsx
// BAD: Storing server data in Zustand
const useItemStore = create((set) => ({
  items: [],
  fetchItems: async () => {
    const data = await api.get('/items');
    set({ items: data }); // Use React Query instead!
  },
}));

// BAD: Derived state in store (compute in component instead)
const useStore = create((set) => ({
  items: [],
  filteredItems: [], // Compute this directly in component (Compiler auto-caches)
}));

// BAD: Actions that don't need store
const useStore = create((set) => ({
  formatDate: (d) => d.toISOString(), // This is a utility, not state
}));
```

## Persist Middleware Rules

1. **partialize** → Only persist essential rehydration data
2. **Never persist** → Loading states, error states, derived values
3. **Version** → Use `version` field + `migrate` for schema changes
4. **Storage** → `AsyncStorage` for React Native, `localStorage` for web
5. **Screen Store는 persist 하지 않음** → 일시적 UI 상태이므로 앱 재시작 시 초기화

---

## Screen Store Factory (Route-Scoped Stores)

화면(라우트)별로 독립적인 Zustand store 인스턴스를 생성하는 패턴.
React Query의 `queryKey`처럼 `screenKey`로 store를 식별한다.

### Factory 구현

```tsx
// stores/createScreenStore.ts
import { createStore, type StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';

type StateCreator<T> = (
  set: StoreApi<T>['setState'],
  get: StoreApi<T>['getState'],
) => T;

export function createScreenStoreFactory<T>(creator: StateCreator<T>) {
  const stores = new Map<string, StoreApi<T>>();

  function getOrCreate(screenKey: string): StoreApi<T> {
    let store = stores.get(screenKey);
    if (!store) {
      store = createStore<T>((set, get) => creator(set, get));
      stores.set(screenKey, store);
    }
    return store;
  }

  function useScreenStore<R>(screenKey: string, selector: (state: T) => R): R {
    return useStore(getOrCreate(screenKey), selector);
  }

  return { useScreenStore, getOrCreate };
}
```

**설계 원칙**:
- `(set, get) => T` — 싱글톤 `create()`와 동일한 시그니처. Actions가 state와 함께 정의됨
- `zustand/vanilla`의 `createStore` 사용 — 동적 생성을 위한 vanilla API
- `useStore` hook으로 React 바인딩 — selective subscription 동일 적용
- GC 없음 — 인스턴스당 ~200-300B, 앱 세션 동안 영구 보관

### Screen Keys (URL-Pattern Key Factory)

`queryKeys`와 동일한 패턴. REST API URL 규칙을 따른다.

```tsx
// stores/screenKeys.ts
export const screenKeys = {
  // trips
  tripDetail:     (tripId: string) => `/trips/${tripId}`,
  tripBudget:     (tripId: string) => `/trips/${tripId}/budget`,
  tripMap:        (tripId: string) => `/trips/${tripId}/map`,
  tripPhotos:     (tripId: string) => `/trips/${tripId}/photos`,

  // community
  communityFeed:  ()               => '/community',
  communityTrip:  (tripId: string) => `/community/trips/${tripId}`,
  communityPlace: (placeId: string) => `/community/places/${placeId}`,

  // user
  profile:        ()               => '/profile',
  userProfile:    (userId: string)  => `/users/${userId}`,

  // top-level
  home:           ()               => '/',
  pinMap:         ()               => '/pin-map',
  trips:          ()               => '/trips',
} as const;
```

**URL 규칙**:

| 규칙 | 예시 | 설명 |
|------|------|------|
| 리소스 복수형 | `/trips`, `/users` | REST 표준 |
| 계층 구조 | `/trips/{id}/budget` | 부모/자식 관계 |
| 실제 값 포함 | `/trips/abc123` | placeholder 아님 |
| 소문자 | `/community/trips` | URL 표준 |
| leading `/` | `/trips/...` | 절대경로 |
| trailing `/` 없음 | `/trips/abc123` | 정규화 |
| query string 없음 | 경로만 사용 | 키 안정성 보장 |

> **Note**: Expo Router의 `usePathname()`과 의도적으로 분리.
> 라우팅 구조 변경이 store 키에 영향을 주지 않는다.

### Per-Screen Store 정의

```tsx
// stores/screenStores/tripDetail.ts
import { createScreenStoreFactory } from '../createScreenStore';

interface TripDetailStore {
  activeTab: 'schedule' | 'checklist' | 'reservation' | 'journal' | 'budget';
  selectedDay: number | null;
  setActiveTab: (tab: TripDetailStore['activeTab']) => void;
  setSelectedDay: (day: number | null) => void;
}

export const tripDetailStore = createScreenStoreFactory<TripDetailStore>(
  (set) => ({
    activeTab: 'schedule',
    selectedDay: null,
    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedDay: (day) => set({ selectedDay: day }),
  }),
);
```

### 컴포넌트에서 사용

```tsx
import { screenKeys } from '@/stores/screenKeys';
import { tripDetailStore } from '@/stores/screenStores/tripDetail';

function TripScheduleTab({ tripId }: { tripId: string }) {
  const key = screenKeys.tripDetail(tripId);

  // Screen Store — 화면 UI 상태
  const selectedDay = tripDetailStore.useScreenStore(key, (s) => s.selectedDay);
  const setSelectedDay = tripDetailStore.useScreenStore(key, (s) => s.setSelectedDay);

  // React Query — 서버 데이터
  const { data: schedules } = useSchedules(tripId);

  return <ScheduleList schedules={schedules} selectedDay={selectedDay} />;
}
```

### Screen Store 규칙

- **Selective subscription 동일 적용**: `useScreenStore(key, (s) => s.field)` — 전체 구독 금지
- **서버 데이터 저장 금지**: API 응답은 React Query에, Screen Store는 UI 상태만
- **Actions는 creator 내부**: `(set, get) => ({...})` 패턴, 외부 setState 호출 금지
- **screenKey = 인스턴스 ID**: 다른 key = 다른 store 인스턴스
- **persist 사용 안 함**: 화면 UI 상태는 앱 재시작 시 초기화

### 구독 격리 패턴 (Subscription Isolation)

부모 컴포넌트에서 store를 구독하면 **모든 자식**이 리렌더된다.
구독이 필요한 영역만 별도 memo 컴포넌트로 추출해서 리렌더 범위를 최소화.

```tsx
// ❌ Presenter 본체에서 구독 → Hero, Modals 등 무관한 자식까지 전부 리렌더
function TripDetailPresenter({ trip, sk, tripId }) {
  const activeTab = tripDetailStore.useScreenStore(sk, (s) => s.activeTab); // ← 여기서 구독
  return (
    <View>
      <HeroSection trip={trip} />      {/* 불필요 리렌더 */}
      <TabBar activeTab={activeTab} />
      <TabContent activeTab={activeTab} tripId={tripId} />
      <Modals />                       {/* 불필요 리렌더 */}
    </View>
  );
}

// ✅ 자체 구독 래퍼 컴포넌트로 추출 (Compiler가 리렌더 자동 최적화)
function TabBarSection({ sk, onTabChange }) {
  const activeTab = tripDetailStore.useScreenStore(sk, (s) => s.activeTab);
  return <TabBar activeTab={activeTab} onTabChange={onTabChange} />;
}

function TabContentSection({ sk, tripId }) {
  const activeTab = tripDetailStore.useScreenStore(sk, (s) => s.activeTab);
  const deferredTab = useDeferredValue(activeTab);
  const isPending = activeTab !== deferredTab;
  if (isPending) return <TabSkeleton activeTab={activeTab} />;
  return <TabContent activeTab={deferredTab} tripId={tripId} />;
}

// Presenter 본체 — store 구독 없음, activeTab 변경에 리렌더 안 됨
function TripDetailPresenter({ trip, sk, tripId, onTabChange }) {
  return (
    <View>
      <HeroSection trip={trip} />
      <TabBarSection sk={sk} onTabChange={onTabChange} />
      <TabContentSection sk={sk} tripId={tripId} />
      <Modals />
    </View>
  );
}
```

**격리 적용 기준**:
- store 값을 사용하는 컴포넌트가 **형제 컴포넌트 일부**일 때
- 부모가 **무거운 자식** (Hero, Modals 등)을 포함할 때
- 구독하는 값이 **자주 변경**될 때 (탭, 필터, 선택 상태)

### Non-Reactive 읽기 (getState)

이벤트 핸들러에서 store 값을 **참조만** 할 때는 구독 대신 `getState()` 사용.

```tsx
// ❌ Container에서 구독 → activeTab 변경마다 Container 전체 리렌더
const activeTab = tripDetailStore.useScreenStore(sk, (s) => s.activeTab);
const handleRefresh = () => invalidateTabQueries(activeTab, tripId);

// ✅ 이벤트 시점에 직접 읽기 → Container 리렌더 없음
const handleRefresh = () => {
  const currentTab = tripDetailStore.getOrCreate(sk).getState().activeTab;
  invalidateTabQueries(currentTab, tripId);
};
```

**판단 기준**:
- JSX/렌더링에 사용 → `useScreenStore()` (reactive 구독)
- 이벤트 핸들러/콜백에서만 참조 → `getOrCreate().getState()` (non-reactive)

### 디렉토리 구조

```
stores/
├── createScreenStore.ts      ← Factory 유틸 (범용)
├── screenKeys.ts             ← URL-pattern 키 빌더
├── screenStores/
│   ├── tripDetail.ts         ← 여행 상세 화면
│   ├── budget.ts             ← 예산 화면
│   └── community.ts          ← 커뮤니티 화면
├── authStore.ts              ← 기존 싱글톤 (변경 없음)
└── tripStore.ts              ← 기존 싱글톤 (변경 없음)
```
