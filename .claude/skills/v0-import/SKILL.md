---
name: v0-import
description: v0.dev 코드를 프로젝트에 임포트하고 컨벤션에 맞게 리팩토링. Use when user says "/v0-import", "v0 가져와", "v0 코드 적용", "v0 임포트", or when importing v0.dev generated code into the project.
user-invocable: true
---

# /v0-import — v0.dev Code Import & Convention Conversion

v0.dev에서 생성한 디자인 코드를 프로젝트에 가져오면서, **디자인은 100% 유지**하고 **코드 구조만 프로젝트 컨벤션에 맞게 변환**.

> 핵심 원칙: **비주얼 보존, 아키텍처만 변환** — v0 코드를 "참고"해서 새로 작성하면 디자인이 달라짐. v0 코드를 그대로 쓰면 컨벤션 위반. 이 스킬은 그 사이를 해결.

---

## Phase 0: 입력 수집

### Step 1. v0 레퍼런스 파일 위치 확인
- 사용자가 지정한 폴더 확인 (기본: `docs/v0-reference/`)
- 지정 없으면 사용자에게 질문: "v0 코드가 어디에 있나요?"
- Glob으로 해당 폴더 내 모든 `.tsx`/`.jsx` 파일 스캔

### Step 2. 대상 프로젝트 플랫폼 식별
- CLAUDE.md Active Modules 확인 → `web/` (Next.js) vs `mobile/` (Expo/RN) 판별
- v0 코드는 기본적으로 웹(React/Next.js)용 → 모바일 프로젝트에 적용 시 사용자에게 알림
- 프로젝트 구조 (`app/`, `src/components/`, `src/types/` 등) 파악

### Step 3. 기존 프로젝트 패턴 파악
- Glob: 기존 route 파일 구조 확인
- Glob: 기존 Presenter 파일 위치/네이밍 확인
- Read: 가장 유사한 기존 화면 1개를 레퍼런스로 선정

---

## Phase 1: 인벤토리 (빠짐없이)

**MANDATORY**: 변환 시작 전 전수 스캔 필수. 일부만 보고 진행 금지.

### Step 1. 전수 스캔
- Glob으로 v0 레퍼런스 폴더의 **모든** 파일 목록 생성
- 파일 수를 명시적으로 세기

### Step 2. 매핑 테이블 작성
각 v0 파일을 프로젝트의 어떤 페이지/컴포넌트로 매핑할지 결정:

```markdown
### v0 Inventory: N개 파일

| # | v0 파일 | → 대상 페이지/컴포넌트 | 타입 |
|---|---------|----------------------|------|
| 1 | dashboard.tsx | / (메인 페이지) | page |
| 2 | inbox.tsx | /inbox | page |
| 3 | sidebar.tsx | AppShell sidebar | shared component |
| 4 | task-card.tsx | TaskCard | feature component |
```

### Step 3. 사용자 확인
- 매핑 테이블을 사용자에게 제시
- "N개 v0 파일 → N개 프로젝트 대상으로 변환합니다. 맞나요?"
- **승인 전 변환 착수 금지**

---

## Phase 2: 비주얼 보존 규칙 (HARD RULE)

### 절대 수정 금지 (Visual Freeze)
| 항목 | 설명 |
|------|------|
| className / Tailwind 유틸리티 | `className="flex items-center gap-2 p-4 bg-zinc-900"` 그대로 유지 |
| JSX 레이아웃 구조 | div 계층, 순서, 중첩 구조 변경 금지 |
| 색상 값 | hex, rgb, Tailwind 색상 클래스 모두 보존 |
| 간격/사이징 | padding, margin, gap, width, height 값 보존 |
| 타이포그래피 | font-size, font-weight, line-height 보존 |
| 아이콘 | 아이콘 종류, 크기, 위치 보존 |
| 반응형 브레이크포인트 | sm:, md:, lg: 등 반응형 클래스 보존 |
| 시각적 계층 구조 | z-index, overflow, position 관계 보존 |

### 수정 허용 (Architecture Transform)
| 항목 | 변환 내용 |
|------|----------|
| 하드코딩 데이터 | → props 인터페이스 / hooks / services로 추출 |
| 파일 분리 | → Container (route) + Presenter (features/) 분리 |
| import 경로 | → 프로젝트 구조에 맞게 재매핑 (`@/components/ui/` 등) |
| 타입 적용 | → Branded Types, Input/Domain/View 4-Tier 타입 |
| 상태 처리 추가 | → Loading (Skeleton) / Error / Empty 상태 |
| shadcn/ui 경로 | → 프로젝트 내 shadcn/ui 컴포넌트 경로로 매핑 |
| "use client" 지시어 | → 프로젝트 컨벤션에 맞게 적용 (Next.js) |
| 이벤트 핸들러 | → `on` prefix 콜백 패턴 (`onPress`, `onDelete`) |
| 하드코딩 문자열 | → i18n 키로 전환 (해당되는 경우) |

---

## Phase 3: 페이지별 변환 (하나씩 순차)

각 v0 파일에 대해 아래 절차를 **순서대로** 수행.

### Step 1. v0 코드 읽기
- 전체 코드를 Read로 확인
- 하드코딩된 데이터, 인라인 상태, import 목록 파악
- 사용 중인 shadcn/ui 컴포넌트 목록 추출

### Step 2. shadcn/ui 컴포넌트 매핑
- v0 코드의 `@/components/ui/*` import를 프로젝트 내 실제 경로로 매핑
- 프로젝트에 없는 shadcn 컴포넌트가 있으면:
  - 이미 설치된 컴포넌트 목록 Glob으로 확인
  - 누락 컴포넌트를 사용자에게 보고 (설치 필요 여부)

### Step 3. Container-Presenter 분리
- **Presenter** (`src/components/features/{domain}/{name}-content.tsx`):
  - v0의 JSX 레이아웃을 **그대로** 이동 (className 변경 없음)
  - 하드코딩 데이터 → props 인터페이스로 추출
  - Props 타입 정의 (PropsType)
  - 콜백은 `on` prefix (`onCreateTask`, `onToggleComplete`)
- **Container** (route file `app/(app)/*/page.tsx`):
  - hooks, services, React Query 연결
  - Loading/Error/Empty 상태 처리
  - Presenter에 props 전달

### Step 4. 타입 적용
- 엔티티 ID → Branded Types (`TodoId`, `ProjectId` 등)
- 하드코딩 객체 배열 → Domain 타입 정의
- Props 인터페이스 정의
- 기존 `src/types/`의 타입 재사용 (중복 생성 금지)

### Step 5. 데이터 연결
- 하드코딩 데이터 → React Query hooks / services로 교체
- 기존 hooks/services 검색하여 재사용
- 없으면 새로 생성 (queryKeys factory 포함)
- Mutation 연결 시 `onError` + `onSettled` 필수

### Step 6. 상태 처리 추가
- `isLoading` → Skeleton (화면별 전용, ActivityIndicator 금지)
- `error && !data` → ErrorState with retry
- `!data` or empty → EmptyState with icon + message + action
- 리패칭 → 캐시 데이터 유지 + 백그라운드 리패칭

### Step 7. import 경로 정리
- v0 기본 경로 → 프로젝트 실제 경로로 변환
- `@/components/ui/button` → 프로젝트 내 shadcn/ui 경로
- `@/lib/utils` → 프로젝트 내 유틸 경로
- Lucide 아이콘 import 확인 및 정리

### Step 8. 변환 완료 기록
```markdown
✅ {파일명}: Container + Presenter 분리 / 타입 적용 / 데이터 연결 / 상태 처리
```

---

## Phase 4: 완료 검증

### 4a. 완전성 검증 (Completeness)
```
□ 변환 전 v0 파일 수: N개
□ 변환 완료 파일 수: N개
□ 누락 파일: 0개 (100% 일치 필수)
□ 누락 페이지 없는지 인벤토리 테이블과 대조 확인
```

### 4b. 비주얼 보존 검증 (Visual Preservation)
```
□ className / Tailwind 유틸리티: 변경 없음
□ JSX 레이아웃 구조 (div 계층, 순서): 변경 없음
□ 색상, 간격, 타이포그래피: 변경 없음
□ 아이콘 종류/크기/위치: 변경 없음
□ 반응형 브레이크포인트: 변경 없음
```

### 4c. 컨벤션 준수 검증 (Convention Compliance)
```
□ Container-Presenter 분리 완료
□ Branded Types 적용 (엔티티 ID)
□ hooks/services 연결 (하드코딩 데이터 제거)
□ Loading/Error/Empty 상태 처리
□ import 경로 프로젝트 구조 준수
□ shadcn/ui 컴포넌트 경로 매핑
□ "use client" 지시어 적절히 적용 (Next.js)
□ 콜백 on prefix 패턴
```

### 4d. 빌드 검증
- `npm run build` 또는 `npm run typecheck` 실행하여 타입 에러 없음 확인
- 에러 발생 시 수정 후 재검증

---

## Output Format

```markdown
## v0 Import Report

### Inventory
- v0 레퍼런스 파일: N개
- 변환 대상 컴포넌트: N개
- 플랫폼: web (Next.js) / mobile (Expo)

### Conversion Map
| # | v0 파일 | → Container | → Presenter | 상태 |
|---|---------|-------------|-------------|------|
| 1 | dashboard.tsx | app/(app)/page.tsx | components/features/dashboard/dashboard-content.tsx | ✅ |
| 2 | inbox.tsx | app/(app)/inbox/page.tsx | components/features/inbox/inbox-content.tsx | ✅ |
| 3 | sidebar.tsx | — (shared) | components/layout/sidebar.tsx | ✅ |

### Visual Preservation
✅ className 유지 / ✅ 레이아웃 유지 / ✅ 색상 유지 / ✅ 아이콘 유지

### Convention Compliance
✅ Container-Presenter / ✅ Branded Types / ✅ Hooks/Services / ✅ States / ✅ Imports

### Completeness
N/N (100%) — 누락 파일 없음

### New Dependencies (설치 필요)
- [ ] shadcn/ui 컴포넌트: {누락 목록} (있는 경우)
- [ ] 기타 패키지: {누락 목록} (있는 경우)
```

---

## Zero Tolerance

- NEVER: className이나 Tailwind 유틸리티 수정
- NEVER: JSX 레이아웃 구조(div 계층, 순서) 변경
- NEVER: 색상, 간격, 타이포그래피, 아이콘 변경
- NEVER: 반응형 브레이크포인트 제거 또는 변경
- NEVER: v0 파일 목록에서 일부 누락하고 진행
- NEVER: Phase 1 인벤토리 없이 변환 시작
- NEVER: 사용자 승인 없이 변환 착수
- NEVER: 변환 전후 파일 수 불일치 상태로 완료 보고
- NEVER: 기존 프로젝트 hooks/services/types 확인 없이 중복 생성
- NEVER: Loading/Error/Empty 상태 처리 누락

## Scope Options

- `/v0-import` — 기본 (전체 v0 레퍼런스 폴더)
- `/v0-import {path}` — 특정 파일/폴더만 변환
- `/v0-import --dry-run` — 인벤토리 + 매핑만 출력 (변환 미실행)
