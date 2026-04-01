---
globs:
  - "mobile/**/*.tsx"
  - "mobile/**/*.jsx"
alwaysApply: false
---
> **Module: `react-native`** — CLAUDE.md Active Modules에서 `react-native`가 `[x]`일 때만 적용
> 상세 코드 예시와 참조 패턴은 `mobile-ui-patterns` 스킬 참조.

## Screen Types (5 types)
1. **Tab**: Tab screens in `(tabs)/`
2. **Detail**: `ScreenHeader` with back button
3. **Form Modal**: `FormModalHeader` (cancel/save) — `fullScreenModal` presentation
4. **Fullscreen Viewer**: Photo viewer, PDF viewer, fullscreen map
5. **Special**: Onboarding, splash, login

## Navigation Presentation Rules

| Screen Type | Presentation | Animation |
|-------------|-------------|-----------|
| Create/Edit (모든 생성·수정 화면) | `fullScreenModal` | `slide_from_bottom` |
| Detail/Settings/Sub-navigation | default push | `default` |
| `presentation: 'modal'` (card-style) | **금지** | iOS 상단 간격 |

## Header Patterns

| Screen Type | Header | Save 위치 |
|-------------|--------|----------|
| Form Modal | `FormModalHeader` (cancel/save) | 헤더 우측 (하단 버튼 금지) |
| Detail/List | `ScreenHeader` (back button) | N/A |

- FormModalHeader: `withSafeArea` for fullScreenModal
- NEVER mix: FormModalHeader 화면에 하단 저장 버튼 금지 / ScreenHeader 화면에 헤더 우측 저장 금지

## Bottom Sheet

- 모든 BottomSheet → `Modal` + `GestureHandlerRootView` 래핑 필수
- Conditional (`!visible → null`): 단기 — ConfirmSheet, HeaderMenuSheet
- Always-Mounted (`index={visible ? 0 : -1}`): 맵 오버레이 — PlaceDetailSheet
- **onClose**: 명시적 `() => setVisible(false)` 필수, toggle 함수 금지 (`react-component-patterns.md` §8)
- **Modal-to-Modal**: `pendingActionRef` + `useEffect` 패턴 (`react-component-patterns.md` §9)

## Confirm / Toast / CRUD Patterns

| 상황 | UI |
|------|-----|
| 엔티티 삭제 (trip, expense) | `ConfirmSheet` (loading 지원) |
| 변경사항 폐기 / 권한 요청 / 치명적 에러 | `Alert.alert` |
| 성공/비차단 에러 피드백 | `showToast()` |
| Undo 가능 삭제 (리스트 아이템) | `UndoToast` |

- Create: FAB(탭 리스트) / Header `+`(상세) / 인라인 입력(단일 필드)
- Edit: Form Modal + FormModalHeader
- Delete: SwipeableRow + UndoToast (리스트) / 헤더 메뉴 → ConfirmSheet (엔티티)

## State Components (mandatory)
- Loading (캐시 없음): 화면별 **Skeleton** (ActivityIndicator 금지)
- Loading (캐시 있음): 캐시 데이터 유지 + 백그라운드 리패칭
- Error: `ErrorState` / Empty: `EmptyState` (icon + title + description + action)
- 세부: `react-data-patterns.md` §7 참조

## Safe Area Rules

| Screen Type | Top | Bottom |
|-------------|-----|--------|
| Tab Screen | `paddingTop: insets.top` | Tab Bar 처리 (수동 금지) |
| Detail (ScreenHeader) | 헤더 내부 처리 (중복 금지) | `paddingBottom: insets.bottom` |
| Form Modal (FormModalHeader) | `withSafeArea` prop | `paddingBottom: insets.bottom` |
| Fullscreen Viewer | `insets.top` | `insets.bottom` |
| Bottom Sheet | N/A | `paddingBottom: insets.bottom` |

- `useSafeAreaInsets()` 사용 (SafeAreaView 단독 금지)
- 하드코딩 padding (`paddingTop: 44`) 금지

## Layout & Misc
- Padding: `px-4` (16pt) / Touch targets: min 44pt
- Dark mode: 모든 `bg-*`/`text-*`에 `dark:` variant 필수
- `gap-*` in `flex-row` 미동작 → `style={{ columnGap: N }}`
- Image Picker: 권한 확인 필수, `quality: 0.8`, `exif: false`
- FlatList: `keyExtractor`에 index 금지, `renderItem` 외부 정의, `windowSize: 5-11`

## 금지 사항 요약
- `presentation: 'modal'` (card-style) 사용 금지
- FormModalHeader/ScreenHeader 혼용 금지
- Form Modal에 하단 저장 버튼 금지
- toggle 함수를 onClose에 전달 금지
- Safe Area 미적용 화면 금지
- SafeAreaView 단독 / 하드코딩 padding 금지
- ActivityIndicator 전체화면 로딩 금지 (Skeleton 사용)
- FlatList keyExtractor에 index 금지
- FlatList renderItem 인라인 정의 금지
