---
name: consistency-audit
description: Project-wide consistency audit. Use when user says "/audit", "/consistency-audit", "audit the project", "check consistency", "일관성 검사", "전체 검사", or when investigating widespread pattern violations. Scans the entire project for convention violations, UI inconsistencies, and missing standard patterns.
user-invocable: true
---

# /audit — Project-Wide Consistency Audit

Scan the entire project for pattern violations, UI inconsistencies, and missing standards.

## Execution Flow

### Phase 1: Project Understanding
1. Read CLAUDE.md and CODING_CONVENTIONS.md for project rules
2. Identify the tech stack and applicable conventions
3. Map the project structure (directories, key files)

### Phase 2: Pattern Scanning

Run these scans in parallel where possible:

#### 2a. Architecture Patterns
```
Scan: All route files in app/ directory
Check:
  □ Every screen has Container + Presenter separation
  □ No business logic (useQuery, useMutation) in Presenter files
  □ No useRouter in Presenter files
  □ Presenter files are in the correct directory
Report: List any violations with file:line
```

#### 2b. UI Pattern Consistency
```
Scan: All Presenter files
Check:
  □ Edit screens: all use same pattern (Form Modal vs Normal page)
  □ Create screens: all use same pattern
  □ Delete interactions: all use same pattern (swipe+undo vs alert)
  □ Loading states: all use the project's LoadingState component
  □ Error states: all use the project's ErrorState component
  □ Empty states: all use the project's EmptyState component
Report: Group by pattern type, show inconsistencies
```

#### 2c. State Handling Completeness
```
Scan: All Container (route) files
Check:
  □ Every data-fetching screen handles: isLoading, error, empty data
  □ Consistent pattern for passing states to Presenters
  □ Mutations have error handling
Report: List screens missing state handling
```

#### 2d. Internationalization Coverage
```
Scan: All .tsx files in app/ and components/
Check:
  □ No hardcoded user-facing strings (Korean, English, Japanese)
  □ All t() keys exist in ALL locale files
  □ No orphaned translation keys (keys in locale but not in code)
Report: List hardcoded strings with file:line
```

#### 2e. Performance Patterns
```
Scan: All hook files and components
Check:
  □ Query keys all use the factory pattern (no inline strings)
  □ Zustand subscriptions are selective (no whole-store destructuring)
  □ No useMemo/useCallback/React.memo (React Compiler handles memoization)
  □ FlatList/FlashList used for lists (not ScrollView with .map)
Report: List performance anti-patterns
```

#### 2f. Styling Consistency
```
Scan: All .tsx files with className
Check:
  □ Dark mode: every bg-/text- class has dark: variant
  □ Touch targets: all Pressable/TouchableOpacity ≥ 44pt
  □ Consistent spacing patterns across similar screens
  □ Semantic color tokens used (not raw hex values)
Report: List missing dark mode pairs, undersized targets
```

#### 2g. Clean Code
```
Scan: All source files
Check:
  □ No console.log statements
  □ No TODO/FIXME comments for shipped features
  □ No commented-out code blocks
  □ No unused imports
  □ No hardcoded API URLs or secrets
Report: List violations with file:line
```

### Phase 3: Severity Classification

Classify each finding:

| Severity | Criteria | Action |
|----------|----------|--------|
| **CRITICAL** | Security risk, data loss potential, crash | Fix immediately |
| **HIGH** | Convention violation, broken pattern | Fix before next feature |
| **MEDIUM** | Inconsistency, missing optimization | Fix in next cleanup |
| **LOW** | Style preference, minor improvement | Track for later |

### Phase 4: Report

```markdown
## Project Consistency Audit Report

**Project**: [name]
**Date**: [date]
**Files scanned**: [count]

### Executive Summary
- Critical: [n] issues
- High: [n] issues
- Medium: [n] issues
- Low: [n] issues

### Critical Issues
| # | File | Line | Issue | Fix |
|---|------|------|-------|-----|
| 1 | path/file.tsx | 45 | useQuery in Presenter | Move to Container |

### High Issues
| # | File | Line | Issue | Fix |
|---|------|------|-------|-----|
| 1 | path/file.tsx | 23 | Hardcoded "저장" string | Use t('common.save') |

### Pattern Inconsistency Map
| Pattern | Expected | Actual Files | Violating Files |
|---------|----------|-------------|-----------------|
| Edit screen type | Form Modal | 5 screens | 2 screens (Normal page) |
| Delete pattern | Swipe+Undo | 8 screens | 1 screen (immediate delete) |
| Loading state | LoadingState | 12 screens | 3 screens (inline spinner) |

### Recommendations
1. **[Priority 1]**: Fix [n] critical and high issues
2. **[Priority 2]**: Standardize edit screens to Form Modal pattern
3. **[Priority 3]**: Add missing dark mode variants ([n] files)

### Auto-Fix Available
The following [n] issues can be auto-fixed. Proceed? (y/n)
- Replace [n] hardcoded strings with i18n keys
- Add missing dark mode classes to [n] elements
- Remove [n] console.log statements
```

## Scope Options
- `/audit` — Full project audit
- `/audit screens` — Only screen/route files
- `/audit i18n` — Only internationalization check
- `/audit styles` — Only styling consistency
- `/audit performance` — Only performance patterns
- `/audit [path]` — Audit specific directory or file
