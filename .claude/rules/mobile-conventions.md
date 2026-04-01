---
globs:
  - "mobile/**/*.tsx"
  - "mobile/**/*.jsx"
alwaysApply: false
---
> **Module: `react-native`** — CLAUDE.md Active Modules에서 `react-native`가 `[x]`일 때만 적용

## Container-Presenter Pattern
> 핵심 원칙은 `react-component-patterns.md` §0에 정의. 이 섹션은 RN 전용 파일 위치 규칙.
- Route files (`app/`) = Container (state, hooks, logic)
- `src/components/features/` = Presenter (pure UI, props only)
- Presenter > 200 lines → split into nested Container-Presenter
- No `useQuery`, `useMutation`, `useRouter` in Presenters
- Callbacks: `on` prefix in props (onPress, onDelete, onSubmit)

## Branded Types
> 핵심 원칙은 `typescript-conventions.md` §1에 정의. 이 섹션은 RN 전용 팩토리 예시.
- All entity IDs use `Brand<string, 'TypeName'>` from `src/types/branded.ts`
- Factory: `TripId(id)`, `UserId(id)`, `ScheduleId(id)` etc.
- Convert string params to branded types immediately at route boundary

## Type System
> 핵심 원칙은 `typescript-conventions.md` §2에 정의.
- Input types: `CreateTripInput` (minimal fields for creation)
- Domain types: `Trip` (full entity from API)
- View types: `TripWithDetails` (domain + computed fields)
- Form types: `TripFormData` (uses `Date` objects, convert at API boundary)
- Union types over enums: `'owner' | 'editor' | 'viewer'`

## Query Key Factory
> 핵심 원칙은 `react-data-patterns.md` §0.5에 정의.
- All keys in `queryKeys` object at `src/lib/queryClient.ts`
- Pattern: `queryKeys.domain.scope(params)` — never inline strings
- Batch invalidation: `invalidateTripQueries()`, `invalidateTripLists()`

## Zustand Rules
> 핵심 원칙은 `zustand-conventions.md`에 정의. 이 섹션은 RN 전용 참조.
→ `zustand-best-practices` 스킬 참조 (Singleton Store, Screen Store Factory, screenKeys 규칙 포함)

## Styling (NativeWind v2)
- NEVER set `darkMode: 'class'` in tailwind.config.js (NativeWind v2 breaks)
- `gap-*` className does NOT work on `flex-row` → use inline `style={{ columnGap: N }}`
- Semantic colors: `primary-500`, `secondary-500`, `success`, `error`, `ocean`
- 44pt minimum touch targets for accessibility
- `headerShown: false` globally → custom ScreenHeader per screen

## Loading States (Skeleton-First Strategy)
- 최초 로딩 (캐시 없음): 화면별 전용 **Skeleton** 컴포넌트 (`TripDetailSkeleton`, `FeedSkeleton` 등)
- 리패칭 (캐시 있음): 스켈레톤 없이 **캐시 데이터 유지** + 백그라운드 리패칭 (stale-while-revalidate)
- `<EmptyState />` with icon + title + description + action
- `<ErrorState />` with error classification (network/timeout/generic) + retry
- 세부 패턴: `react-data-patterns.md` §7 참조

## Offline Support
- `assertOnline()` guard in mutation `onMutate`
- SyncAction queue processes FIFO on reconnect
- `<OfflineBanner />` with pending action count

## Bottom Sheet / Modal Callback Rules
> 핵심 원칙은 `react-component-patterns.md` §8, §9에 정의. 이 섹션은 RN BottomSheet 전용.
- **onClose must be explicit close**: `() => setVisible(false)` — NEVER a toggle function
- **Modal-to-Modal transitions**: `pendingActionRef` + `useEffect` 패턴 사용 (`ui-patterns.md` 참조)
- **Toggle functions**: Only for open/close trigger buttons, NEVER as `onClose` prop

## Render Performance Rules
- Container에서 렌더링에 불필요한 store 값 구독 금지 → `getOrCreate().getState()` 사용
- Presenter 본체에서 store 구독 금지 (일부 자식만 필요할 때) → 자체 구독 memo 컴포넌트로 추출
- 가벼운 UI 업데이트 + 무거운 마운트를 동기 핸들러에서 동시 호출 금지 → `useDeferredValue` 사용
- hooks 20개 이상 컴포넌트 방치 금지 → 하위 컴포넌트로 분리
→ 상세: `react-component-patterns` 규칙 Section 4, `react-functional-patterns` 규칙

## What NOT to Do

> 아래 목록 일부는 Core 규칙(`vibe-coding.md`, `react-data-patterns.md`, `react-component-patterns.md`)과 중복되나, 모바일 개발자 퀵 레퍼런스로 유지한다.

- No `useQuery`/`useMutation`/`useRouter` in Presenter components
- No whole-store Zustand destructuring
- No inline `[]` fallbacks in Zustand selectors
- No `darkMode: 'class'` in tailwind.config.js
- No barrel exports (index.ts re-export files) anywhere — import directly from source
- No enums — use string literal union types
- No inline ActivityIndicator for full-screen loading (화면별 Skeleton 사용)
- No Skeleton when cached data exists (캐시 데이터 유지 + 백그라운드 리패칭)
- No custom emoji error UI (use `ErrorState`)
- No custom empty state UI (use `EmptyState`)
- No touch targets smaller than 44pt
- No toggle functions as `onClose` prop (causes double-fire on BottomSheet unmount)
- No `presentation: 'modal'` for create/edit screens (use `fullScreenModal`)
- No `ScreenHeader` on form modals (use `FormModalHeader`)
- No bottom save buttons on `fullScreenModal` screens (save goes in header)
- No store 구독 in Container for event-handler-only references (use `getState()`)
- No store 구독 in Presenter body when only some children need the value (extract memo wrapper)
- No `InteractionManager.runAfterInteractions()` for Modal transitions (use pendingAction + useEffect)

## Token Refresh (Queue-Based Concurrency Control)
> 핵심 원칙은 `frontend-conventions.md` §1에 정의.
- `isRefreshing` 플래그 — 동시 갱신 방지
- `failedQueue` 배열 — 갱신 중 다른 401 요청 대기
- `_retry` 플래그 — 무한 루프 방지 (한 번만 재시도)
- PUBLIC_ENDPOINTS 제외 — 로그인/회원가입은 토큰 불필요
- 토큰 갱신 로직 수정 시 반드시 동시성 테스트
- `_retry` 플래그 제거 금지 — 무한 루프 위험
- `processQueue` 호출 누락 금지 — 대기 요청 영원히 블로킹

## Analytics (분석 이벤트)
> 핵심 원칙은 `frontend-conventions.md` §5에 정의. 이 섹션은 RN/Firebase 전용.
- Firebase import를 top-level에서 직접 하기 금지 — lazy loading 사용
- 이벤트 네이밍: `{action}_{entity}` (예: `create_trip`, `toggle_checklist`)
- `__DEV__`에서 Crashlytics 활성화 금지
- 에러 기록 시 context 문자열 누락 금지 — 디버깅 불가
