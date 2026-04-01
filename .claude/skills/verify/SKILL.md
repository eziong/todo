---
name: verify
description: Post-implementation quality verification. Use when user says "/verify", "verify this", "check quality", "검증해줘", "확인해줘", or after completing a significant implementation. Runs comprehensive checks against project conventions, UI consistency, state handling, i18n, performance, and accessibility.
user-invocable: true
---

# /verify — Post-Implementation Quality Verification

Run a comprehensive quality check on recently implemented or specified code.

## Execution Steps

### Step 1: Identify Scope
Determine what to verify:
- If user specifies files → verify those files
- If no specification → verify files changed in the current session
- If ambiguous → ask user which files/features to check

### Step 2: Convention Compliance
Read the project's CLAUDE.md and CODING_CONVENTIONS.md, then check:

```
□ Container-Presenter separation enforced
  - Route files contain only hooks/logic + single Presenter render
  - Presenter files have no useQuery, useMutation, useRouter
□ Type system
  - Branded types used for all entity IDs
  - Input/Output/Form type separation
  - Union types, not enums
□ Naming conventions
  - Components: PascalCase
  - Hooks: use* prefix
  - Callbacks: on* prefix in props
  - Files: *.presenter.tsx for Presenters
□ Import patterns
  - Query keys from factory, not inline strings
  - Direct imports (no barrel export index.ts)
  - No circular dependencies
□ Route registration
  - 새 라우트 파일 → 부모 _layout.tsx에 Stack.Screen 등록 확인
  - Screen presentation: create/edit → fullScreenModal 사용 확인
□ Component responsibility
  - God Container 안티패턴: Presenter에 10개+ props 전달 안 함
  - 독립 데이터 필요 섹션 → 별도 Container로 분리
```

### Step 3: UI Consistency
Find the most similar existing screen and compare:

```
□ Same screen type (Tab / Normal / Form Modal / Fullscreen)
□ Same layout pattern (spacing, sections, cards)
□ Same interaction patterns (swipe, tap, long-press)
□ Same create/edit/delete patterns as similar screens
□ Consistent use of shared UI components
□ Horizontal padding: consistent with project standard
```

### Step 4: State Handling

**Detail Screen 템플릿**:
```
□ isLoading (캐시 없음) → 화면별 전용 Skeleton (ActivityIndicator 금지)
□ error && !data → ErrorState with retry
□ !data → EmptyState with icon + message + action
□ data → Presenter 렌더 (리패칭 중이어도 캐시 데이터 유지)
```

**List Screen 템플릿**:
```
□ isLoading → 화면별 전용 Skeleton
□ FlatList + refreshControl (isRefetching 연결)
□ ListEmptyComponent → EmptyState
```

**Mutation 템플릿**:
```
□ onError: handleMutationError() — 사용자 에러 피드백 (필수)
□ onSettled — 성공/실패 공통 캐시 무효화 (필수)
□ Offline: assertOnline() guard on mutations (if applicable)
```

### Step 5: Internationalization
```
□ All user-facing strings use translation keys: t('key')
□ Keys added to ALL locale files (check which locales exist)
□ Date/time formatting uses locale-aware functions
□ Number/currency formatting uses Intl.NumberFormat
□ No hardcoded Korean/English/Japanese strings in components
□ Key naming: domain.camelCaseKey 패턴 준수 (예: trip.createTitle)
□ ALL locales synced: ko, en, ja 모두에 동일한 키 존재
□ Locale 키 수 일치: locale 파일 간 키 diff 없음
```

### Step 6: Performance
```
□ No useMemo/useCallback/React.memo (React Compiler handles memoization)
□ Structural solutions used for performance (component splitting, key props)
□ No forwardRef (React 19: ref is a regular prop)
□ Query cache invalidation configured correctly after mutations
□ Images: appropriate resizing/caching
□ Lists: FlatList/FlashList with keyExtractor, not ScrollView for long lists
□ No unnecessary re-renders from Zustand (selective subscription)
```

### Step 7: Accessibility & Dark Mode
```
□ All interactive elements ≥ 44pt touch target
□ accessibilityRole / accessibilityLabel where needed
□ Every bg-* class has corresponding dark:bg-* class
□ Every text-* color has corresponding dark:text-* color
□ Contrast ratios are sufficient in both modes
□ Safe Area: useSafeAreaInsets() 적용 (Tab=top / Detail=bottom / Form Modal=withSafeArea+bottom)
□ NativeWind gap: flex-row에서 gap-* className 미사용 확인 (style={{ columnGap: N }} 사용)
```

### Step 8: Clean Code
```
□ No console.log statements
□ No TODO comments for core functionality
□ No commented-out code blocks
□ No hardcoded values (magic numbers, color hex codes, URLs)
□ No unused imports or variables
```

### Step 9: Query & Cache Validation
```
□ Query Key Factory: 모든 쿼리가 queryKeys.* factory 사용 (인라인 문자열 배열 금지)
□ Dependent queries: 파라미터 의존 쿼리에 enabled: Boolean(param) 존재
□ Mutation onSettled: 모든 mutation에 onSettled 캐시 무효화 존재
□ Mutation onError: 모든 mutation에 onError: handleMutationError() 존재
□ Infinite Query: 무효화 시 refetchType: 'none' 사용 여부 확인
□ onClose: 모달/시트의 onClose가 명시적 close (toggle 함수 금지)
```

## Output Format

```markdown
## Verification Report

### Summary
- **Files checked**: [list]
- **Reference screen**: [most similar existing screen]
- **Overall**: ✅ Pass / ⚠️ Issues Found / ❌ Fail

### Results
| Category | Status | Details |
|----------|--------|---------|
| Conventions | ✅ | Container-Presenter, types, naming OK |
| UI Consistency | ⚠️ | Spacing differs from EditTripScreen (16pt vs 12pt) |
| State Handling | ✅ | All 4 states covered |
| i18n | ❌ | 3 hardcoded strings found |
| Performance | ✅ | Memo, callbacks, cache OK |
| Accessibility | ⚠️ | 2 buttons below 44pt minimum |
| Dark Mode | ✅ | All classes have dark variants |
| Clean Code | ✅ | No issues |
| Query & Cache | ✅ | queryKeys factory, mutations complete |

### Action Items
1. **[MUST FIX]** Add i18n keys for: "Save", "Cancel", "Delete" in lines 45, 67, 89
2. **[MUST FIX]** Increase button size to 44pt minimum at lines 23, 34
3. **[SHOULD FIX]** Align padding with EditTripScreen pattern (px-4)
```

## Auto-Fix
If issues are found, offer to fix them:
- "3 issues found. Fix them now?" → Apply fixes immediately
- Report fixes applied after completion
