---
name: implementation-guard
description: Automatic quality gate that activates when creating new screens, components, features, or making significant code changes. Enforces design-before-code workflow and post-implementation verification. Triggers on keywords like "make", "create", "build", "add", "implement", "new screen", "new component", "new feature", and file creation in app/ or components/ directories.
user-invocable: false
---

# Implementation Guard

Automatic quality gate for all non-trivial implementations.
Enforces: Scope → Analyze → Design → Impact → Approve → Type → Implement → Verify workflow.

## Phase -1: Active Modules Gate (프레임워크/기술 검증)

**모든 Phase보다 먼저 실행. 프로젝트 생성, 프레임워크 선택, 새 기술 도입 시 필수.**

1. CLAUDE.md `Active Modules` 섹션 읽기
2. 사용할 프레임워크/기술의 체크박스 상태 확인:
   - `[x]` → 사용 가능, 다음 Phase로 진행
   - `[ ]` → **사용 금지**, 사용자에게 충돌 보고 후 확인 요청
3. 계획(plan)이 비활성 모듈을 사용하는 경우:
   - "계획에서 {framework}를 사용하지만, Active Modules에서 비활성(`[ ]`)입니다. 활성화할까요?" 로 확인
   - 사용자 승인 시 → CLAUDE.md에서 `[ ]`를 `[x]`로 변경 후 진행
   - 사용자 거부 시 → 활성화된 대안 프레임워크로 계획 수정

**계획 승인 ≠ Active Modules 자동 오버라이드. 별도 확인 필수.**

## Phase 0: Scope Assessment (대규모 변경 판단)

수정 범위가 큰 경우(3+ 파일 또는 다단계 작업) Phase 1 진행 **전에** 먼저 수행.

### Step Plan File
1. 전체 작업을 논리적 스텝으로 분해
2. 임시 계획 파일 작성: `/tmp/plan-{feature}.md`
3. 형식:
```markdown
# {Feature} Implementation Plan

## Steps
- [ ] Step 1: {description}
- [ ] Step 2: {description}
- [ ] Step 3: {description}

## Current: Step 1
```
4. 각 스텝 완료 시 `[x]`로 체크 + `Current` 업데이트
5. 전체 완료 후 파일 삭제

### 소규모 변경 (1-2 파일)
- 계획 파일 없이 Phase 1부터 바로 진행

## Phase 1: Pre-Implementation

### Step 1. Analysis (외부 근거 기반 분석)

**MANDATORY**: 모든 비사소한 구현은 외부 근거를 참고하여 접근 방식을 결정.

- **유사 앱 조사**: 동종/유사 앱 최소 2개에서 해당 기능/패턴 처리 방식 조사
  - 여행: TripIt, Google Travel, Wanderlog, Airbnb, Booking.com
  - 일정: Google Calendar, Notion, Todoist
  - 소셜: Instagram, Pinterest
  - 일반 UX: Apple HIG, Material Design Guidelines
- **과학적/UX 근거**: 해당 패턴 선택의 이유 (접근성, 인지 부하, 사용성 연구 등)
- 근거를 명시적으로 정리하여 Proposal에 포함

**근거 없이 "이게 나을 것 같다"는 판단 금지** — 반드시 외부 참조를 제시.

### Step 2. Discovery (기존 코드 조사)

**2a. Type Discovery**
- `src/types/` 디렉토리에서 관련 도메인 타입 확인
- 관련 서비스(`src/services/`), 훅(`src/hooks/`) 타입 확인
- 서버 응답 타입 그대로 사용 — `Enhanced*`/`Extended*` 생성 금지
- 모든 ID는 branded type (`TripId`, `UserId` 등)

**2b. Hook/Service Discovery (CRITICAL)**
- Grep: `src/hooks/use<Domain>` — 기존 훅 확인
- Grep: `src/services/<domain>` — 기존 서비스 확인
- Grep: `queryKeys.<domain>` — 기존 쿼리 키 확인
- **존재하면 재사용** — 중복 생성 금지
- **없으면** 생성 계획을 Proposal에 명시

**2c. Pattern Discovery**
- Glob/Grep: 유사 화면/컴포넌트 탐색
- Read: 가장 유사한 기존 구현 1-2개 리뷰
- 사용 중인 UI 패턴(modal/sheet/page), 레이아웃, 인터랙션 파악

**2d. Route Registration Check (CRITICAL)**
새 라우트 파일(`app/`) 생성 시:
- 부모 `_layout.tsx`의 `Stack.Screen` 등록 필요 여부 확인
- presentation, headerShown, animation 설정 결정
- Proposal에 `_layout.tsx` 수정 사항 포함

**2e. Screen Store Discovery**
새 화면에 UI 상태(탭, 필터 등) 필요 시:
- `src/lib/screenKeys.ts` 기존 screenKeys 확인
- 유사 화면의 Screen Store Factory 패턴 확인
- 새 screenKeys/store 필요 시 Proposal에 명시

### Step 3. Design (UI 변경 시만 — 앱 전체 일관성)

UI 변경이 포함된 경우에만 수행. 순수 로직 변경은 건너뜀.

- **앱 전체 디자인 일관성**: 기존 화면들과 시각적 통일 (spacing, typography, color, interaction)
- **UI 컨벤션 준수**: Screen Type(Tab/Detail/FormModal/Fullscreen), Header 패턴, Safe Area 등
- **기존 선례 우선**: 프로젝트 내 확립된 패턴이 있으면 그것을 따름
- **없으면 외부 근거**: Step 1의 유사 앱 조사 결과를 기반으로 결정

### Step 4. Code Impact Analysis (코드 영향도 분석)

- **수정 대상 파일 목록**: 생성/수정/삭제될 파일을 명시
- **영향 범위**: 변경으로 인해 간접적으로 영향받는 컴포넌트/화면
- **수정 방향**: 각 파일에서 무엇을 어떻게 바꿀지 한 줄 요약
- **입출력 타입 정의**: 새로 필요한 타입을 컨벤션(4-Tier: Input/Domain/View/Form)에 맞게 사전 설계

### Step 5. Proposal & Approval

아래 형식으로 사용자에게 제시. **승인 전 코딩 절대 금지.**

```markdown
## Implementation Plan

**분석 근거**:
- {앱 이름}: {해당 앱에서 이 패턴을 어떻게 처리하는지}
- {앱 이름}: {해당 앱에서 이 패턴을 어떻게 처리하는지}
- 선택 이유: {왜 이 접근이 적합한지}

**Reference**: `path/to/SimilarFeature.tsx` (기존 패턴)

**Screen Type**: [Tab / Detail / Form Modal / Fullscreen / Special]

**File Changes**:
| Action | File | Description |
|--------|------|-------------|
| CREATE | `app/feature/page.tsx` | Container |
| CREATE | `src/components/features/feature/Feature.presenter.tsx` | Presenter |
| MODIFY | `app/(tabs)/_layout.tsx` | Stack.Screen 등록 |

**Types** (사전 정의):
- Domain: `Feature` (from `src/types/`)
- Input: `CreateFeatureInput`
- IDs: `FeatureId` (branded type)

**Data Flow**:
- Hook: `useFeature()` → Service: `featureService` → Cache: `queryKeys.feature.detail(id)`

**States**: Loading(Skeleton) / Error(ErrorState) / Empty(EmptyState)

**Proceed?**
```

### When to Skip Phase 1
- Single-line fixes (typo, obvious bug, small tweak)
- Documentation-only changes
- User gave extremely detailed step-by-step instructions

## Phase 2: Implementation

### Type-First (타입 선행 정의)
코딩 착수 **전에** Proposal에서 설계한 타입을 먼저 작성:
1. `src/types/`에 도메인 타입 정의 (또는 기존 타입 확인)
2. `src/types/branded.ts`에 새 ID 타입 추가 (필요 시)
3. Input/Form 타입 정의
4. 타입이 확정된 후 구현 시작

### Consistency Rules
- Match spacing, typography, color patterns from the reference screen
- Reuse existing shared UI components — don't recreate what exists
- Follow the project's naming conventions exactly
- If choosing a different pattern than existing code, explain why to the user

### Convention Adherence
- Container: All hooks, queries, mutations, router, business logic
- Presenter: Pure UI rendering, only receives props (no useQuery/useMutation/useRouter)
- Callbacks: `on` prefix in props (onPress, onDelete, onSubmit)
- Types: Branded IDs, Input/Output separation, union types over enums, 서버 타입 그대로 사용
- i18n: ALL user-facing text uses translation keys, added to all locale files
- States: loading (Skeleton), error (ErrorState), empty (EmptyState) components
- Performance: 구조적 솔루션 (컴포넌트 분리, key prop) — useMemo/useCallback/memo 금지
- Cache: queryKey factory, proper invalidation after mutations
- Locale sync: 새 i18n 키는 ALL locale 파일(ko, en, ja)에 동시 추가
- Mutation guard: 모든 mutation에 `onError: handleMutationError()` + `onSettled` 필수
- NativeWind gap: `gap-*`는 `flex-row`에서 동작 안 함 → `style={{ columnGap: N }}` 사용

### Step Plan Tracking
Phase 0에서 계획 파일을 작성한 경우:
- 각 스텝 구현 완료 시 계획 파일에서 `[x]` 체크
- `Current` 필드를 다음 스텝으로 업데이트
- 전체 완료 후 계획 파일 삭제

## Phase 3: Post-Implementation (Self-Verification)

After completing implementation, silently verify ALL of the following.
If ANY check fails, fix it before presenting the result to the user.

```
□ Type safety: 서버 타입 그대로 사용 / Enhanced* 없음 / ID는 branded type / Pick/Omit으로 축소
□ Convention compliance: Container-Presenter / Types / Naming
□ UI consistency: Matches reference screen patterns (layout, spacing, interaction)
□ State handling: Loading / Error / Empty / Offline (where applicable)
□ i18n: All strings use translation keys, keys added to ALL locale files
□ Performance: 구조적 솔루션 적용, cache invalidation configured
□ Accessibility: Min touch targets, semantic labels
□ Dark mode: All color classes have dark: variants
□ Clean code: No console.log, no TODO, no hardcoded strings
□ Route registration: 새 라우트 → _layout.tsx에 Stack.Screen 등록 확인
□ Locale sync: 새 i18n 키가 ALL locale 파일(ko, en, ja)에 존재
□ Query keys: 인라인 queryKey 문자열 없음 → queryKeys.* factory 사용
□ Mutation completeness: 모든 mutation에 onError + onSettled 존재
□ Dependent queries: 파라미터 의존 쿼리에 enabled: Boolean(param) 존재
```

Report verification results to the user:
```markdown
## Verification
✅ Conventions | ✅ UI consistency | ✅ States | ✅ i18n
✅ Performance | ✅ Accessibility | ✅ Dark mode | ✅ Clean code
```

## Phase 4: Completeness (Batch Operations)

When changes span multiple files/screens:
1. Grep/Glob to build a **complete** list of affected files FIRST
2. Present the file list to the user for confirmation
3. After completion, report which files were changed
4. Compare before/after file counts to verify nothing was missed

## Zero Tolerance
- NEVER use a framework/technology that is `[ ]` (unchecked) in CLAUDE.md Active Modules
- NEVER assume plan approval overrides Active Modules configuration
- NEVER start coding without external evidence (similar apps / scientific basis)
- NEVER start coding before user approval
- NEVER skip step decomposition for large-scope changes
- NEVER start coding without defining input/output types first
- NEVER choose a UI pattern without checking existing precedent
- NEVER skip loading/error/empty state handling
- NEVER leave TODO comments for core functionality
- NEVER use hardcoded strings instead of i18n keys
- NEVER skip post-implementation verification
- NEVER miss files in "apply to all" requests
- NEVER create Enhanced*/Extended*/*WithExtra client-side types
- NEVER use plain `string` for entity IDs (branded type 필수)
- NEVER start coding without checking existing types first
- NEVER create hook/service without first searching for existing ones
- NEVER create route file without registering in parent _layout.tsx
- NEVER add i18n keys to only one locale — ALL locales simultaneously
