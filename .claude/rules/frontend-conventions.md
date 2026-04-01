---
alwaysApply: false
globs: ["**/*.tsx", "**/*.jsx"]
---

# Frontend Conventions

프레임워크/플랫폼 무관 프론트엔드 공통 패턴.
React Native, React Web, Next.js 등 모든 프론트엔드 프로젝트에 적용.

---

## 1. Token Refresh Queue (토큰 갱신 동시성 제어)

401 응답 시 토큰을 갱신하면서, 동시 요청을 큐에 대기시키는 패턴.

### 필수 구성요소

| 요소 | 역할 |
|------|------|
| `isRefreshing` 플래그 | 동시 갱신 방지 — 한 번에 하나만 갱신 |
| `failedQueue` 배열 | 갱신 중 발생한 다른 401 요청을 대기 |
| `_retry` 플래그 | 무한 루프 방지 — 한 번만 재시도 |
| `processQueue()` | 갱신 완료 후 대기 요청 일괄 처리 |
| `PUBLIC_ENDPOINTS` | 로그인/회원가입 등 토큰 불필요 경로 제외 |

### 핵심 흐름

```
401 응답 수신
├─ isRefreshing === true → failedQueue에 추가 (Promise 대기)
├─ _retry === true → reject (무한 루프 방지)
└─ isRefreshing === false
   ├─ isRefreshing = true
   ├─ 토큰 갱신 요청
   ├─ 성공 → processQueue(resolve) → 원래 요청 재시도
   └─ 실패 → processQueue(reject) → 로그아웃
```

### 금지 사항

- `_retry` 플래그 제거 금지 — 무한 루프 위험
- `processQueue` 호출 누락 금지 — 대기 요청 영원히 블로킹
- 토큰 갱신 로직 수정 시 반드시 동시성 테스트

---

## 2. Destructive Action Patterns (파괴적 동작 확인)

사용자 데이터를 삭제하거나 되돌릴 수 없는 작업 전에 반드시 확인을 거친다.

### 확인 패턴

| 동작 유형 | 확인 방식 | 예시 |
|----------|----------|------|
| 엔티티 삭제 (Trip, Budget 등) | Confirm Dialog/Sheet | 삭제 전 "정말 삭제하시겠습니까?" |
| 리스트 아이템 삭제 (Swipe) | Undo Toast | 삭제 후 5초간 되돌리기 가능 |
| 변경사항 폐기 (뒤로가기) | Confirm Dialog | "저장하지 않은 변경사항이 있습니다" |
| 로그아웃 | Confirm Dialog | "로그아웃 하시겠습니까?" |

### 규칙

- **즉시 삭제 금지**: 모든 삭제에 Confirm 또는 Undo 중 하나 필수
- **Confirm의 파괴적 옵션**: `destructive` 스타일 적용 (빨간색 등)
- **로딩 상태 표시**: 삭제 진행 중 버튼 비활성화 + 로딩 인디케이터

---

## 3. Toast vs Dialog Decision Matrix

사용자에게 피드백을 제공할 때 적절한 UI를 선택한다.

| 상황 | UI | 이유 |
|------|-----|------|
| 성공 피드백 (저장됨, 복사됨) | **Toast** | 비차단, 자동 사라짐 |
| 비차단 에러 | **Toast (error)** | 사용자 작업 방해 X |
| Undo 가능한 삭제 | **Toast + Action** | 사후 취소 |
| 확인이 필요한 삭제 | **Confirm Dialog/Sheet** | 사용자 결정 필요 |
| 치명적 에러/인증 만료 | **Alert Dialog** | 반드시 확인 필요 |
| 권한 요청 | **Alert Dialog** | 시스템 수준 결정 |

### 원칙

- **비차단 우선**: 가능하면 Toast (사용자 흐름 유지)
- **차단은 최소화**: Dialog는 사용자 결정이 필수인 경우에만
- **일관성**: 같은 유형의 피드백은 항상 같은 UI

---

## 4. Form Validation Strategy (폼 검증 전략)

### 스키마 기반 검증

- **단일 스키마**: 클라이언트 검증 + 서버 검증에 동일한 스키마 사용
- **검증 라이브러리**: Zod, Yup 등 스키마 정의 도구 사용
- **검증 시점**: `onBlur` (blur 시 검증) 또는 `onSubmit` (제출 시 검증)
  - `onChange` 지양 — 매 타이핑마다 검증은 UX 저하

### 에러 표시

| 위치 | 용도 |
|------|------|
| 필드별 인라인 에러 | 각 입력 아래 빨간 텍스트 |
| 폼 상단 서머리 | 서버 에러 또는 다수 필드 에러 요약 |
| Submit 버튼 비활성화 | `isSubmitting` 동안 중복 제출 방지 |

### 규칙

- 수동 validation 코드 작성 금지 — 스키마 라이브러리 사용
- `disabled={!isValid}` 지양 — 사용자가 왜 비활성인지 모름, 제출 시 에러 표시가 더 나음
- 클라이언트/서버 스키마 불일치 금지 — 단일 스키마 공유

---

## 5. Analytics Conventions (분석 이벤트)

### 이벤트 네이밍

- **형식**: `{action}_{entity}` (예: `create_trip`, `toggle_checklist`, `delete_expense`)
- **동사는 과거형 아닌 현재형**: `create_trip` (O) / `created_trip` (X)

### 구현 규칙

| 규칙 | 이유 |
|------|------|
| Analytics SDK는 lazy import | 앱 시작 성능 보호 |
| `__DEV__` 환경에서 Crash reporting 비활성화 | 개발 중 노이즈 방지 |
| 에러 기록 시 context 문자열 필수 | 디버깅 가능성 확보 |
| 민감 정보 (PII) 이벤트에 포함 금지 | 개인정보 보호 |

### 금지 사항

- Analytics SDK를 top-level import 금지 — lazy loading 사용
- context 없는 에러 기록 금지 — 디버깅 불가
- 이벤트 네이밍 불일관 금지 — `{action}_{entity}` 형식 준수

---

## 6. i18n Key Naming Convention (번역 키 네이밍)

### 키 형식

- **패턴**: `domain.camelCaseKey` (예: `trip.createTitle`, `common.cancel`)
- **도메인 분리**: dot notation으로 계층 구조

### 계층 구조

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `common.*` | 공용 (확인, 취소, 삭제 등) | `common.save`, `common.delete` |
| `{domain}.*` | 도메인별 | `trip.editTitle`, `budget.addExpense` |
| `{domain}.{sub}.*` | 하위 기능 | `trip.checklist.addItem` |
| `errors.*` | 에러 메시지 | `errors.networkError`, `errors.required` |
| `permission.*` | 권한 요청 | `permission.locationTitle` |

### 접미사 규칙

| 접미사 | 용도 | 예시 |
|--------|------|------|
| `*Title` | 화면/섹션/다이얼로그 제목 | `trip.createTitle` |
| `*Message` | 설명/확인 메시지 | `trip.deleteMessage` |
| `*Label` | 필드 라벨, 버튼 텍스트 | `trip.titleLabel` |
| `*Placeholder` | 입력 플레이스홀더 | `trip.titlePlaceholder` |

### 규칙

- 새 i18n 키 추가 시 **ALL locale 파일 동시 업데이트** (ko, en, ja)
- 키 네이밍은 `domain.camelCaseKey` 패턴 일관 유지
- 한 locale에만 키 추가 금지 — 모든 locale 동시 추가

---

## 금지 사항 요약

- 토큰 갱신 시 `_retry` 플래그 제거 금지
- `processQueue` 호출 누락 금지
- 확인 없는 즉시 삭제 금지
- Toast/Dialog 혼용 금지 (Decision Matrix 준수)
- 수동 폼 검증 코드 금지 (스키마 라이브러리 사용)
- Analytics lazy import 미적용 금지
- i18n 키 네이밍 불일관 금지 — `domain.camelCaseKey` 형식 준수
- 새 i18n 키를 한 locale만 추가 금지 — ALL locales 동시
