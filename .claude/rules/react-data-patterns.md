---
alwaysApply: false
globs:
  - "**/*.tsx"
  - "**/*.jsx"
  - "mobile/**/*.ts"
  - "web/**/*.ts"
---

# React Data & Logic Patterns

공통 패턴 — React, Next.js, React Native 모두 적용 가능.

---

## 0. State Management Architecture (4계층)

| Layer | Tool | Key | 예시 |
|-------|------|-----|------|
| Server data | React Query | `queryKeys.*()` | API 응답, 목록 |
| Screen UI state | Screen Store (Zustand Factory) | `screenKeys.*()` | activeTab, filters |
| App-global state | Singleton Zustand | N/A | auth, theme |
| Component-local | useState | N/A | modal visible, input |

**판단**: API 데이터 → React Query / 화면 공유 UI → Screen Store / 앱 전역 → Singleton Zustand / 단일 컴포넌트 → useState

> Screen Store Factory: `zustand-best-practices` 스킬 참조.

### God Container Anti-Pattern (금지)

하나의 Container가 모든 탭/섹션 상태를 소유하고 15+ hooks, 70+ props 전달하는 패턴.
→ 각 탭이 자체 데이터 관리 + 공유 상태는 Screen Store로 분리.

---

## 0.5. Query Key Factory

모든 React Query 키를 중앙 `queryKeys` 객체에서 관리. 인라인 문자열 배열 금지.

- 패턴: `queryKeys.domain.scope(params)` (예: `queryKeys.trips.detail(tripId)`)
- 배치 무효화: `invalidateTripQueries(tripId)` 헬퍼 함수 작성

---

## 1. Error Handling (3-Layer)

```
Layer 1: API Interceptor → 네트워크/타임아웃/401 자동 감지 + 토큰 갱신
Layer 2: classifyError() → { type, title, message, retryable }
Layer 3: Mutation → handleMutationError() / Query → <ErrorState />
```

### Mutation (MANDATORY)

- `onError: handleMutationError()` — 사용자 에러 알림 (필수)
- `onSettled` — 성공/실패 공통 캐시 무효화 (필수)
- `onMutate: assertOnline()` — 오프라인 지원 시만 (선택)

| type | 원인 | retryable | UI |
|------|------|-----------|-----|
| `network` | 연결 없음 | true | WifiOff + 재시도 |
| `timeout` | 30초 초과 | true | WifiOff + 재시도 |
| `server` | 5xx | true | AlertCircle + 재시도 |
| `auth` | 401/403 | false | 로그아웃 유도 |
| `unknown` | 기타 | false | 일반 메시지 |

### Query Error: `<ErrorState error={error} onRetry={refetch} />` (Alert 아닌 컴포넌트)

**금지**: mutation `onError` 생략 / `try/catch`로 에러 삼키기 / 커스텀 Alert 직접 작성

---

## 2. Optimistic Update (4-Step)

UX-critical mutations에 MANDATORY:
1. `onMutate`: cancelQueries + snapshot + setQueryData (낙관적 쓰기)
2. `onError`: rollback (`context.previous`) + `handleMutationError`
3. `onSettled`: invalidateQueries (서버 동기화)

- Date 객체: 캐시에 직접 저장 금지 → ISO string 변환
- 이중 캐시: 두 쿼리가 같은 데이터 참조 시 둘 다 업데이트 + rollback
- Create: 임시 ID (`temp-${Date.now()}`) → `onSettled`에서 서버 ID로 교체

| 상황 | Optimistic | 이유 |
|------|-----------|------|
| 체크리스트 토글 / 순서 변경 / 트립 수정 | O | 즉각 반응 필수 |
| 트립 생성 | O (임시 ID) | 목록 즉시 표시 |
| 트립 삭제 / 파일 업로드 | X | 즉각 반응 불필요 |

---

## 3. Cache Invalidation

- **Targeted > Broad**: 영향받는 쿼리만 무효화 (`queryKeys.*.all` 범위 금지)
- **Batch Helper**: 대량 무효화 → `invalidateTripQueries(tripId)` 헬퍼
- **Infinite Query**: 반드시 `refetchType: 'none'` 사용 (전체 페이지 동시 refetch → 앱 프리징)
- **삭제된 엔티티**: `removeQueries` (invalidate 아닌 remove) + 목록은 invalidate
- **onSettled에서 무효화**: `onSuccess`에서만 하면 실패 시 캐시 불일치

---

## 4. Search + Debounce

`useDebounce(query, 400)` + `enabled: query.trim().length > 0`으로 검색.
- `useRef` + `setTimeout` 수동 디바운스 금지 → `useDebounce` 훅 사용
- 디바운스 없이 `onChangeText`마다 API 호출 금지

---

## 5. Dependent Queries

파라미터 의존 쿼리에 `enabled: Boolean(id)` 필수. 생략 시 undefined로 API 호출됨.
`enabled: id !== undefined` 대신 `Boolean(id)` → 빈 문자열도 방지.

---

## 6. Query Configuration Defaults

`staleTime: 5분` / `gcTime: 30분` / `retry: 2` / `refetchOnMount: true` / `refetchOnWindowFocus: false` / `refetchOnReconnect: true`

| Override 상황 | 값 |
|-------------|-----|
| 서명된 URL (만료 시간) | `staleTime: 14분` |
| 실시간 데이터 | `staleTime: 0` |
| 거의 안 바뀌는 데이터 | `staleTime: Infinity` |
| 민감한 데이터 | `gcTime: 0` |

---

## 7. Caching & Loading Strategy

**원칙**: Skeleton-First, Stale-While-Revalidate

| 상태 | 캐시 | UI |
|------|------|-----|
| `isLoading` | 없음 | **Skeleton** (화면별 전용) |
| `isFetching && !isLoading` | 있음 | **캐시 데이터 유지** (스켈레톤 없음) |
| `isError && !data` | 없음 | **ErrorState** |
| `isError && data` | 있음 | **캐시 데이터 + 에러 토스트** |

### Container 표준: `isLoading` → Skeleton / `error && !data` → ErrorState / `!data` → EmptyState / data → Presenter
### 리스트: `isLoading` → Skeleton / FlatList + `refreshControl={isRefetching}` + `ListEmptyComponent`

- Skeleton: 화면별 전용 (범용 ActivityIndicator 금지), 실제 레이아웃 반영, shimmer 애니메이션
- `placeholderData`: 목록 → 상세 전환 시 목록 캐시에서 즉시 표시
- Infinite Query: 최초만 Skeleton, 하단 `isFetchingNextPage` → ActivityIndicator

**금지**: isLoading 시 ActivityIndicator / 캐시 있는데 Skeleton / isFetching으로 전체 로딩 / 빈 화면 표시

