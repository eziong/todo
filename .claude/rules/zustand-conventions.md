---
alwaysApply: false
globs:
  - "**/*.tsx"
  - "**/*.jsx"
  - "mobile/**/*.ts"
  - "web/**/*.ts"
---

# Zustand Conventions

핵심 원칙과 금지 사항. 코드 예시와 상세 패턴은 `zustand-best-practices` 스킬 참조.

> **4-Layer State Architecture**: `react-data-patterns.md` §0 참조.

---

## 1. Selective Subscription (선택적 구독)

항상 개별 값을 구독: `store((s) => s.field)`. 전체 store destructuring 금지.

---

## 2. External Constants for Fallback (외부 상수 폴백)

셀렉터 폴백에 인라인 `[]`/`{}` 금지 → 외부 상수 사용 (매 렌더마다 새 참조 방지).

---

## 3. Singleton vs Screen Store 판단

| 질문 | Yes → | No → |
|------|-------|------|
| 모든 화면에서 동일한 값? | Singleton | Screen Store |
| 특정 화면/라우트에 종속? | Screen Store | Singleton |
| 라우트 파라미터별 다른 인스턴스? | Screen Store | Singleton |
| 앱 재시작 후에도 유지? | Singleton + persist | Screen Store |

예시: `auth`, `theme` → Singleton / `activeTab`, `selectedDay` → Screen Store

---

## 4. Screen Store Factory 패턴

`createScreenStoreFactory`로 화면별 독립 store 인스턴스 생성.
`screenKeys`는 REST URL 패턴 (`/trips/{id}/budget`), 복수형, 소문자.

> 구현 코드: `zustand-best-practices` 스킬 참조.

---

## 5. Subscription Isolation (구독 격리)

부모에서 store 구독 → **모든 자식** 리렌더. 구독이 필요한 영역만 별도 컴포넌트로 추출.

**격리 기준**: store 값을 형제 일부만 사용 + 무거운 자식 포함 + 값이 자주 변경

> 코드 예시: `zustand-best-practices` 스킬 참조.

---

## 6. Non-Reactive 읽기 (getState)

이벤트 핸들러에서 store 값을 **참조만** → `getOrCreate(sk).getState()` (구독 아닌 직접 읽기).

**판단**: JSX/렌더링에 사용 → `useScreenStore()` / 이벤트 핸들러만 → `getState()`

---

## 금지 사항 요약

- 전체 store destructuring 금지 — `store((s) => s.field)` (§1)
- 셀렉터에서 인라인 `[]`/`{}` 폴백 금지 — 외부 상수 사용 (§2)
- Presenter 본체에서 store 구독 금지 (일부 자식만 필요할 때) — 구독 래퍼 추출 (§5)
- Container에서 이벤트 핸들러 전용 store 값 구독 금지 — `getState()` 사용 (§6)
- Store에 shadow state 추가 금지 — `useDeferredValue` 사용
- 서버 데이터를 Zustand에 저장 금지 → React Query 사용
- 파생 값을 store에 저장 금지 → 컴포넌트에서 직접 계산
- 유틸리티 함수를 store에 넣기 금지 → 별도 유틸 파일
- Screen Store에 persist 사용 금지 → 일시적 UI 상태
