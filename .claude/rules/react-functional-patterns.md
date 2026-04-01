---
alwaysApply: false
globs:
  - "**/*.tsx"
  - "**/*.jsx"
---

# React 19 Functional Patterns

React 19 + React Compiler 기반 선언적 패턴. 명령형 스케줄링과 섀도 상태를 대체.

> React Compiler가 메모이제이션/의존성 배열을 자동 처리. `useMemo`/`useCallback` 금지.

---

## 1. Shadow State → `useDeferredValue`

이중 상태(`activeTab` + `mountedTab`) + `requestAnimationFrame` 동기화 금지.
→ 단일 상태 + `useDeferredValue`로 React가 렌더 우선순위 자동 관리.

```tsx
const deferredTab = useDeferredValue(activeTab);
const isPending = activeTab !== deferredTab;
```

**적용**: 탭 전환, 세그먼트 컨트롤, 필터 적용, 검색 입력
**Store 원칙**: shadow state 필드(`mountedTab`) store에 추가 금지 → 컴포넌트 레벨 `useDeferredValue`

---

## 2. Imperative Scheduling → Declarative

### 2A. `useDeferredValue` vs `useDebounce` 선택

| 상황 | 선택 | 이유 |
|------|------|------|
| UI 렌더링 지연 (필터, 뷰포트) | `useDeferredValue` | React 적응적 스케줄링 |
| API 호출 빈도 제한 (검색) | `useDebounce(value, 400)` | 서버 부하 제어 |
| `useRef` + `setTimeout` 디바운스 | 금지 | 위 둘 중 하나로 대체 |

### 2B. Polling → `refetchInterval`

`setTimeout` + `invalidateQueries` 금지 → TanStack Query `refetchInterval` (조건부 폴링, 자동 중지/정리)

---

## 3. Cache Guard → Functional Updater

외부 `if(previous)` 가드로 `setQueryData` 감싸기 금지 → updater 함수가 자체적으로 no-op 처리.
- `getQueryData` → rollback context 필요 시 유지
- updater 내부 `old` 체크 → 유지 (타입 안전)
- 외부 `if(previous)` → 제거

---

## 4. Ref Shadow State → Direct State Access

상태를 ref로 미러링 금지 → Compiler의 자동 최적화가 깨짐. 상태는 항상 직접 읽기.

**Ref 적절한 경우**: 타이머 ID / DOM 참조 / 애니메이션 상태 (Reanimated) / 이전 값 추적 / pendingActionRef

---

## 5. useTransition — 비긴급 상태 업데이트

| 상황 | 선택 | 이유 |
|------|------|------|
| 외부 값(store, props) 소비 지연 | `useDeferredValue` | setter 제어 불가 |
| 직접 setState가 무거운 렌더 유발 | `useTransition` | setter 위치에서 isPending 필요 |
| 여러 상태를 한 번에 비긴급 처리 | `useTransition` | 여러 setter 묶기 |
| isPending 불필요한 비긴급 업데이트 | `startTransition` (훅 없이) | fire-and-forget |

---

## 판단 매트릭스

| 상황 | 명령형 (금지) | 선언적 (사용) |
|------|-------------|-------------|
| 탭/세그먼트 전환 | `active` + `mounted` 이중 상태 | `useDeferredValue(active)` |
| 고빈도 이벤트 디바운스 | `useRef` + `setTimeout` | `useDeferredValue(state)` |
| 서버 비동기 작업 대기 | `setTimeout` + `invalidateQueries` | `refetchInterval` (조건부) |
| 캐시 Optimistic Update | `if(prev) { setQueryData(...) }` | `setQueryData(updater)` 직접 |
| 콜백에서 상태 참조 | `useRef`로 상태 미러링 | 상태 직접 읽기 |
| 무거운 상태 업데이트 | 수동 debounce/split | `useTransition` / `startTransition` |

---

## 금지 사항

- `requestAnimationFrame`으로 상태 업데이트 지연 금지 → `useDeferredValue`
- `mountedTab`, `mountedSegment` 등 shadow state 변수 금지 → `useDeferredValue`
- `setTimeout` + `useRef`로 디바운스 금지 → `useDeferredValue` (UI) / `useDebounce` (API)
- `setTimeout`으로 서버 폴링 금지 → `refetchInterval`
- `if(previousData)` 가드로 `setQueryData` 감싸기 금지 → updater 직접 호출
- `useRef`로 상태 미러링 금지 → 상태 직접 읽기 (Compiler 자동 최적화)
- Store에 shadow state 필드 추가 금지 → 컴포넌트 레벨 `useDeferredValue`
