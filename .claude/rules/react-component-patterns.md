---
alwaysApply: false
globs:
  - "**/*.tsx"
  - "**/*.jsx"
---

# React Component Patterns

React 19 + React Compiler 기반. 수동 메모이제이션 금지, 구조적 솔루션 전용.

> **React Compiler**: `useMemo`, `useCallback`, `React.memo` 사용 금지. 성능은 구조적 솔루션(컴포넌트 분리, key prop)으로만.

---

## 0. Container-Presenter 분리

| 역할 | 위치 | 포함 | 금지 |
|------|------|------|------|
| Container | 라우트 파일 (`app/`) | `useQuery`, `useMutation`, `useRouter`, 상태 관리 | 복잡한 JSX 트리 |
| Presenter | `components/features/` | props, 이벤트 핸들러, 순수 렌더링 | `useQuery`, `useMutation`, `useRouter` |

- Presenter > 200줄 → 내부 Container-Presenter 재분리
- Callbacks: `on` prefix (`onPress`, `onDelete`)
- Presenter에서 라우터 직접 접근 금지 → Container에서 콜백으로 전달
- 독립적 데이터 필요 섹션 → 자체 Container로 분리

## 1. useEffect 규칙

**허용 패턴 3가지만**:
1. 마운트 초기화 (`[]`)
2. 구독 + 클린업 (subscription + return cleanup)
3. 단일 스칼라 의존성 (`[itemId]` — string/number/boolean만)

**의존성 배열**: 객체/배열 직접 사용 금지 → 스칼라 추출 (`item.id`, `items.length`)

**복잡해지면?**: 객체 의존 → 스칼라 추출 / ID 변경 → key prop (§2) / Props→State → 파생값 직접 계산 / 독립 데이터 → 컴포넌트 분리 (§4)

## 2. key Prop으로 컴포넌트 초기화

ID 변경 시 useEffect로 상태 리셋 금지 → `<DetailContent key={itemId} />` 사용.

| 상황 | key | useEffect |
|------|:---:|:---------:|
| ID 변경 시 모든 상태 초기화 | O | X |
| ID 변경 시 일부 상태만 변경 | X | O (스칼라 의존성) |
| 탭/페이지 전환 시 폼 초기화 | O | X |

## 3. 구조적 솔루션 전용 (Performance)

Compiler가 자동 처리하므로 수동 최적화 금지. 성능 해결 우선순위:
1. 컴포넌트 분리 (Atomic Splitting)
2. key prop으로 리셋/재생성
3. Zustand 구독 격리

- 파생값: 그냥 계산 (Compiler 자동 캐싱)
- 핸들러: 그냥 정의 (Compiler 자동 처리)

## 4. 컴포넌트 분리 기준

**분리 필수**: hooks 20개+ (마운트 비용) / store 구독 격리 필요 (부모 구독 → 모든 자식 리렌더) / 복수 책임 (SRP) / 독립 데이터 필요 (자체 Container) / 200줄+

**분리 권장**: 재사용 가능 / 시각적 경계 / 변경 빈도 차이 / 150줄+

> Store 구독 격리 상세: `zustand-conventions.md` §5 참조

## 5. useRef — DOM 참조, 타이머 ID, 이전 값 추적만 허용. 렌더링 값 저장 금지.

## 6. Error Boundary

| 레벨 | 방법 | 보호 범위 |
|------|------|----------|
| 라우트 전체 | `export function ErrorBoundary` (Expo Router) | 해당 화면 |
| 섹션/탭 | `<ErrorBoundary>` 래핑 (react-error-boundary) | 감싼 영역 |
| 데이터 에러 | `if (error) <ErrorState />` | 쿼리 에러 |

## 7. Suspense — `useSuspenseQuery` + `<Suspense fallback>` 선언적 로딩. 조건부 fetch는 `skipToken` (v5.28+). 기존 `useQuery` + `isLoading` 패턴도 유효.

## 8. onClose 명시적 닫기

`onClose`/`onDismiss`는 반드시 `() => setVisible(false)`. toggle 함수 금지 (BottomSheet/Modal double-fire 위험).

## 9. Modal-to-Modal 전환 (pendingAction)

`pendingActionRef` + `useEffect`로 현재 모달 닫힌 후 다음 모달 열기.
흐름: `onClose()` → `visible=false` → Modal unmount → `useEffect` → `action()`
직접 다른 모달 열기 / `InteractionManager` / `setTimeout` 금지.

---

## 금지 사항 요약

### 수동 메모이제이션
- `useMemo`, `useCallback`, `React.memo`, `memo()` 사용 금지

### useEffect
- 의존성에 객체/배열 직접 사용 금지
- 데이터 페칭 금지 (TanStack Query 사용)
- Props→State 동기화 금지 (파생값 직접 계산 또는 key)
- ID 변경 시 수동 상태 리셋 금지 (key prop)

### 구조
- 렌더링 값을 useRef에 저장 금지
- 200줄+ 컴포넌트 방치 금지
- `forwardRef` 금지 — React 19: ref는 일반 prop

### Container-Presenter
- Presenter에서 `useQuery`/`useMutation`/`useRouter` 금지
- Presenter에서 라우터 직접 접근 금지

### 콜백/모달
- toggle 함수를 onClose/onDismiss prop으로 전달 금지
- `InteractionManager`로 Modal 전환 금지 — pendingAction 사용
