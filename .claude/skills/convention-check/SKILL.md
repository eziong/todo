---
name: convention-check
description: Convention conformance checker that maps each .claude/rules/ and .claude/skills/ rule to actual code and reports violations. Use when user says "/convention-check", "/cc", "컨벤션 체크", "규칙 검사", "룰 체크", or after completing implementation to verify rule conformance. Systematically checks every rule defined in the project's .claude/ directory.
user-invocable: true
---

# /convention-check — Rules & Skills Conformance Checker

프로젝트의 `.claude/rules/`와 `.claude/skills/`에 정의된 규칙을 1:1 매핑하여 코드 준수 여부를 체계적으로 검사한다.

**기존 스킬과의 차이**:
| 스킬 | 비교 기준 | 대상 범위 | 파일 수정 |
|------|----------|----------|----------|
| `/verify` | 일반 품질 체크리스트 | 최근 변경 파일 | O |
| `/audit` | 프로젝트 패턴 일관성 | 전체 프로젝트 | O |
| `/review` | 외부 프로덕션 앱 벤치마크 | 지정 기능 | X |
| **`/cc`** | **`.claude/` 룰 파일 1:1 매핑** | **지정 범위 또는 전체** | **X (보고만)** |

---

## Execution Flow

### Step 0: 기술 스택 탐지 (Auto-Detection)

프로젝트 루트를 스캔하여 존재하는 기술 스택을 자동 판별한다.
**해당하는 스택의 룰만** 활성화하여 불필요한 검사를 방지한다.

```yaml
detection_rules:
  mobile:
    indicator: "mobile/package.json OR mobile/app.json"
    activates:
      - mobile-conventions.md        # R1
      - react-component-patterns.md  # R2 (mobile paths)
      - react-data-patterns.md       # R3 (mobile paths)
      - react-functional-patterns.md # R4
      - ui-patterns.md               # R5
      - skills/mobile-integration      # R8 (skill)

  server:
    indicator: "server/package.json OR server/src/main.ts"
    activates:
      - server-conventions.md        # R6
      - skills/rbac-patterns           # R7 (skill)

  web:
    indicator: "web/package.json OR web/next.config.*"
    activates:
      - skills/web-ui-patterns         # R9 (skill)
      - skills/nextjs-patterns        # R10 (skill)
      - react-component-patterns.md  # R2 (web paths)
      - react-data-patterns.md       # R3 (web paths)

  shared:
    indicator: "always active"
    activates:
      - zustand-conventions.md        # Zustand Core rules
      - Skills checks (S1)           # i18n, Zustand, TypeScript, Clean Code, QueryKey, Callback, React19, Analytics, TokenRefresh
```

### Step 1: 범위 결정

| 요청 | 대상 |
|------|------|
| `/cc` (인자 없음) | 현재 세션에서 변경된 파일 |
| `/cc mobile` | `mobile/` 전체 (모바일 룰만 활성) |
| `/cc server` | `server/` 전체 (서버 룰만 활성) |
| `/cc web` | `web/` 전체 (웹 룰만 활성) |
| `/cc [파일/디렉토리 경로]` | 지정된 경로 |
| `/cc all` | 프로젝트 전체 (탐지된 모든 스택) |
| `/cc rules` | 룰 파일 목록만 출력 (코드 검사 안 함) |

### Step 2: 룰 파일 로드 & 체크 항목 추출

`.claude/rules/` 및 `.claude/skills/`에서 검사 가능한 규칙을 추출한다.
각 룰 파일의 `paths:` 필드를 확인하여 대상 범위와 교차하는 룰만 실행한다.

---

## Rule-by-Rule Check Matrix

---

## MOBILE STACK

### R1: `mobile-conventions.md` — 모바일 핵심 컨벤션

```yaml
checks:
  R1.1_container_presenter_separation:
    name: "Container-Presenter 분리"
    grep: "useQuery|useMutation|useRouter"
    target: "mobile/src/components/features/**/*.presenter.tsx"
    expect: "no matches"
    severity: CRITICAL

  R1.2_branded_types:
    name: "Branded Type 사용"
    grep: "tripId:\\s*string|userId:\\s*string|scheduleId:\\s*string"
    target: "mobile/src/**/*.ts,mobile/src/**/*.tsx"
    exclude: "*.test.*, *.spec.*, types/"
    expect: "no matches (string 대신 TripId, UserId 등 사용)"
    severity: HIGH

  R1.3_query_key_factory:
    name: "쿼리 키 팩토리 사용"
    grep: "queryKey:\\s*\\['"
    target: "mobile/src/**/*.ts"
    expect: "no matches (인라인 문자열 배열 대신 queryKeys.* 사용)"
    severity: HIGH

  R1.4_nativewind_darkmode:
    name: "NativeWind darkMode 설정 금지"
    grep: "darkMode.*class"
    target: "mobile/tailwind.config.*"
    expect: "no matches"
    severity: CRITICAL

  R1.5_gap_flex_row:
    name: "flex-row에서 gap-* 사용 금지"
    grep: "flex-row.*gap-|gap-.*flex-row"
    target: "mobile/src/**/*.tsx"
    expect: "no matches (style={{ columnGap: N }} 사용)"
    severity: MEDIUM

  R1.6_onclose_toggle:
    name: "onClose에 toggle 함수 사용 금지"
    description: "onClose prop에 toggle/toggling 함수 전달 여부 수동 확인"
    manual_check: true
    severity: HIGH

  R1.7_presentation_modal:
    name: "presentation: 'modal' 사용 금지"
    grep: "presentation.*['\"]modal['\"]"
    target: "mobile/app/**/*.tsx"
    expect: "no matches (fullScreenModal 사용)"
    severity: HIGH

  R1.8_store_subscription_render:
    name: "Container에서 불필요한 store 구독"
    description: "이벤트 핸들러에서만 사용하는 store 값을 useScreenStore로 구독하는 경우 수동 확인"
    manual_check: true
    severity: MEDIUM
```

### R2: `react-component-patterns.md` — 컴포넌트 패턴 (Mobile + Web 공통)

```yaml
scope: "mobile/app/**, mobile/src/components/**, web/app/**, web/src/components/**"
checks:
  R2.1_useeffect_object_dep:
    name: "useEffect 의존성에 객체/배열 사용 금지"
    description: "useEffect 의존성 배열에 객체/배열 참조가 있는지 수동 확인 (5개 샘플링)"
    manual_check: true
    severity: HIGH

  R2.2_useeffect_data_fetching:
    name: "useEffect로 데이터 페칭 금지"
    grep: "useEffect.*fetch\\(|useEffect.*axios|useEffect.*\\.get\\("
    target: "{mobile,web}/src/**/*.tsx"
    expect: "no matches (TanStack Query 또는 Server Component 사용)"
    severity: HIGH

  R2.3_component_line_count:
    name: "200줄 이상 컴포넌트"
    description: "200줄 이상인 .tsx 파일 식별 (wc -l로 확인)"
    threshold: 200
    severity: MEDIUM

  R2.4_no_manual_memo:
    name: "수동 메모이제이션 금지 (React Compiler 자동 처리)"
    grep: "\\b(useMemo|useCallback|React\\.memo|memo\\()\\b"
    target: "{mobile,web}/src/**/*.tsx"
    expect: "no matches"
    severity: HIGH

  R2.5_useref_render_value:
    name: "렌더링 값을 useRef에 저장 금지"
    description: "useRef로 렌더링에 필요한 값을 저장하는 경우 수동 확인"
    manual_check: true
    severity: MEDIUM

  R2.6_error_boundary:
    name: "Error Boundary 적용"
    grep: "ErrorBoundary|export function ErrorBoundary"
    target: "{mobile,web}/app/**/*.tsx"
    description: "주요 라우트에 ErrorBoundary가 있는지 확인"
    severity: MEDIUM
```

### R3: `react-data-patterns.md` — 데이터 & 로직 패턴 (Mobile + Web 공통)

```yaml
scope: "mobile/src/hooks/**, mobile/src/services/**, web/src/hooks/**, web/src/lib/**"
checks:
  R3.1_mutation_onerror:
    name: "Mutation에 onError 핸들러 필수"
    grep: "useMutation"
    follow_up_grep: "onError"
    description: "useMutation 호출에 onError가 포함되어 있는지 확인"
    severity: CRITICAL

  R3.2_mutation_assertonline:
    name: "Mutation에 assertOnline() 가드 (모바일만)"
    grep: "useMutation"
    follow_up_grep: "assertOnline"
    description: "모바일 useMutation의 onMutate에 assertOnline()이 있는지 확인"
    target: "mobile/src/hooks/**/*.ts"
    severity: HIGH

  R3.3_invalidate_onsettled:
    name: "캐시 무효화는 onSettled에서"
    grep: "onSuccess.*invalidate"
    target: "{mobile,web}/src/**/*.ts"
    expect: "no matches (onSettled에서 무효화)"
    severity: MEDIUM

  R3.4_infinite_query_refetchtype:
    name: "Infinite Query 무효화 시 refetchType"
    description: "useInfiniteQuery 대상 쿼리를 무효화할 때 refetchType: 'none' 사용 여부 수동 확인"
    manual_check: true
    severity: HIGH

  R3.5_search_debounce:
    name: "검색에 debounce 적용"
    description: "검색 기능에 useDebounce 또는 useDeferredValue가 적용되어 있는지 확인"
    manual_check: true
    severity: MEDIUM

  R3.6_role_hardcoding:
    name: "역할 하드코딩 금지"
    grep: "role\\s*===\\s*['\"]owner['\"]|role\\s*===\\s*['\"]editor['\"]"
    target: "{mobile,web}/src/**/*.tsx"
    expect: "no matches (hasPermission/canEdit/canManage 유틸 사용)"
    severity: MEDIUM

  R3.7_role_in_presenter:
    name: "Presenter에 role 전달 금지"
    grep: "role.*TripRole|myRole"
    target: "{mobile,web}/src/components/features/**/*.presenter.tsx"
    expect: "no matches (Container에서 boolean으로 변환 후 전달)"
    severity: MEDIUM
```

### R4: `react-functional-patterns.md` — React 18+ 선언적 패턴 (Mobile + Web 공통)

```yaml
checks:
  R4.1_shadow_state:
    name: "Shadow State (이중 상태) 금지"
    grep: "mountedTab|mountedSegment|mounted[A-Z]"
    target: "{mobile,web}/src/**/*.ts,{mobile,web}/src/**/*.tsx"
    expect: "no matches (useDeferredValue 사용)"
    severity: HIGH

  R4.2_raf_scheduling:
    name: "requestAnimationFrame으로 상태 업데이트 금지"
    grep: "requestAnimationFrame.*set[A-Z]"
    target: "{mobile,web}/src/**/*.tsx"
    expect: "no matches (useDeferredValue 사용)"
    severity: HIGH

  R4.3_settimeout_debounce:
    name: "setTimeout + useRef 수동 디바운스 금지"
    grep: "debounceRef|setTimeout.*set[A-Z].*Ref"
    target: "{mobile,web}/src/**/*.tsx"
    expect: "no matches (useDeferredValue 또는 useDebounce 사용)"
    severity: MEDIUM

  R4.4_settimeout_polling:
    name: "setTimeout으로 서버 폴링 금지"
    grep: "setTimeout.*invalidateQueries|setTimeout.*refetch"
    target: "{mobile,web}/src/**/*.ts"
    expect: "no matches (refetchInterval 사용)"
    severity: MEDIUM

  R4.5_unnecessary_cache_guard:
    name: "불필요한 캐시 가드 (if previous)"
    grep: "if\\s*\\(previous\\)\\s*\\{.*setQueryData"
    target: "{mobile,web}/src/**/*.ts"
    expect: "no matches (updater 함수 직접 호출)"
    severity: LOW

  R4.6_shadow_state_in_store:
    name: "Store에 shadow state 필드 금지"
    grep: "mountedTab|mountedSegment|setMounted"
    target: "{mobile,web}/src/stores/**/*.ts"
    expect: "no matches (컴포넌트 레벨 useDeferredValue 사용)"
    severity: HIGH
```

### R5: `ui-patterns.md` — 모바일 UI 패턴

```yaml
checks:
  R5.1_form_modal_header:
    name: "Form Modal에 FormModalHeader 사용"
    description: "fullScreenModal 화면에 FormModalHeader가 사용되는지 확인"
    manual_check: true
    severity: HIGH

  R5.2_screenheader_formmodal:
    name: "Form Modal에 ScreenHeader 사용 금지"
    description: "fullScreenModal presentation인 화면에서 ScreenHeader 사용 여부 수동 확인"
    manual_check: true
    severity: HIGH

  R5.3_bottom_save_formmodal:
    name: "Form Modal에 하단 저장 버튼 금지"
    description: "fullScreenModal 화면에 하단 고정 저장 버튼이 있는지 수동 확인"
    manual_check: true
    severity: MEDIUM

  R5.4_safe_area:
    name: "Safe Area 적용 여부"
    grep: "useSafeAreaInsets|SafeAreaView"
    target: "mobile/app/**/*.tsx"
    description: "모든 화면에 Safe Area가 적용되어 있는지 확인"
    severity: HIGH

  R5.5_bottomsheet_modal_wrap:
    name: "BottomSheet에 Modal 래핑"
    description: "BottomSheet가 Modal + GestureHandlerRootView로 래핑되어 있는지 확인"
    manual_check: true
    severity: HIGH

  R5.6_touch_target:
    name: "44pt 최소 터치 타겟"
    description: "Pressable/TouchableOpacity 요소가 44pt 미만인지 수동 확인"
    manual_check: true
    severity: MEDIUM

  R5.7_dark_mode_variants:
    name: "Dark Mode 클래스 쌍"
    description: "bg-* 클래스에 dark:bg-* 가 있는지 확인"
    manual_check: true
    severity: MEDIUM

  R5.8_flatlist_keyextractor:
    name: "FlatList keyExtractor에 index 사용 금지"
    grep: "keyExtractor.*index"
    target: "mobile/src/**/*.tsx"
    expect: "no matches"
    severity: HIGH

  R5.9_inline_renderitem:
    name: "FlatList 인라인 renderItem 금지"
    grep: "renderItem=\\{\\(\\{\\s*item"
    target: "mobile/src/**/*.tsx"
    expect: "no matches (외부 정의)"
    severity: MEDIUM
```

### R8: `skills/mobile-integration` — 모바일 통합 패턴 (skill)

```yaml
checks:
  R8.1_route_param_validation:
    name: "라우트 파라미터 검증"
    grep: "useLocalSearchParams"
    follow_up_grep: "typeof.*!==.*string|!.*Param"
    description: "useLocalSearchParams 사용 시 타입 가드 + branded type 변환이 있는지 확인"
    target: "mobile/app/**/*.tsx"
    severity: CRITICAL

  R8.2_route_param_as_assertion:
    name: "라우트 파라미터 as string 단언 금지"
    grep: "as string"
    target: "mobile/app/**/*.tsx"
    description: "useLocalSearchParams 결과에 `as string` 단언이 있는지 확인"
    severity: HIGH

  R8.3_image_permission:
    name: "ImagePicker 권한 확인"
    grep: "launchImageLibraryAsync|launchCameraAsync"
    follow_up_grep: "requestPermissionsAsync|requestMediaLibraryPermissionsAsync"
    description: "이미지 선택 전에 권한 확인이 있는지 확인"
    target: "mobile/src/**/*.ts,mobile/src/**/*.tsx"
    severity: HIGH

  R8.4_image_optimization:
    name: "이미지 업로드 전 최적화"
    grep: "upload|supabase.*storage.*upload"
    follow_up_grep: "manipulateAsync|resize|compress|quality"
    description: "이미지 업로드 전에 리사이즈/압축이 있는지 확인"
    target: "mobile/src/**/*.ts"
    severity: MEDIUM

  R8.5_realtime_cleanup:
    name: "Realtime 구독 cleanup"
    grep: "supabase.*channel|subscribe\\("
    follow_up_grep: "unsubscribe|removeChannel|return.*remove"
    description: "Supabase Realtime 구독에 cleanup이 있는지 확인"
    target: "mobile/src/**/*.ts,mobile/src/**/*.tsx"
    severity: HIGH

  R8.6_deep_link_validation:
    name: "딥링크 파라미터 검증"
    description: "딥링크로 진입하는 라우트에서 파라미터 검증이 있는지 수동 확인"
    manual_check: true
    severity: HIGH

  R8.7_exif_removal:
    name: "이미지 EXIF 데이터 제거"
    grep: "exif.*false|exif.*true"
    target: "mobile/src/**/*.ts"
    description: "ImagePicker에서 exif: false가 설정되어 있는지 확인"
    severity: MEDIUM
```

---

## SERVER STACK

### R6: `server-conventions.md` — 서버 컨벤션

```yaml
checks:
  R6.1_module_structure:
    name: "NestJS 모듈 구조 (Module→Controller→Service→DTO)"
    description: "각 모듈 디렉토리에 module, controller, service, dto 파일이 있는지 확인"
    target: "server/src/modules/*/"
    severity: HIGH

  R6.2_controller_thin:
    name: "Controller가 thin인지 (비즈니스 로직 없음)"
    grep: "prisma\\.|findMany|findUnique|create\\(|update\\(|delete\\("
    target: "server/src/modules/**/*.controller.ts"
    expect: "no matches (Prisma 직접 호출은 Service에서만)"
    severity: HIGH

  R6.3_raw_sql:
    name: "Raw SQL 사용 금지"
    grep: "\\$queryRaw|\\$executeRaw|raw\\s*\\("
    target: "server/src/**/*.ts"
    expect: "no matches (Prisma 쿼리 빌더 사용)"
    severity: HIGH

  R6.4_dto_validation:
    name: "DTO에 class-validator 데코레이터"
    grep: "@IsString|@IsNumber|@IsOptional|@IsArray|@IsEnum|@IsNotEmpty|@IsUUID|@IsDate"
    target: "server/src/modules/**/dto/*.ts"
    description: "DTO 파일에 class-validator 데코레이터가 사용되는지 확인"
    severity: HIGH

  R6.5_db_mapping:
    name: "DB→Domain 매핑 함수 사용"
    grep: "mapDb|mapToResponse"
    target: "server/src/modules/**/*.service.ts"
    description: "서비스에서 DB 매핑 함수를 사용하는지 확인"
    severity: MEDIUM

  R6.6_controller_business_logic:
    name: "Controller에 비즈니스 로직 금지"
    grep: "if.*\\(.*\\.length|for\\s*\\(|while\\s*\\(|\\.map\\(|\\.filter\\(|\\.reduce\\("
    target: "server/src/modules/**/*.controller.ts"
    description: "Controller에 반복문/조건부 비즈니스 로직이 있는지 확인"
    severity: MEDIUM
```

### R7: `skills/rbac-patterns` — RBAC 패턴 (skill)

```yaml
checks:
  R7.1_trip_role_guard:
    name: "Trip 리소스에 TripRoleGuard 적용"
    grep: "TripRoleGuard"
    target: "server/src/modules/**/*.controller.ts"
    description: "tripId를 사용하는 엔드포인트에 TripRoleGuard가 적용되어 있는지 확인"
    severity: CRITICAL

  R7.2_require_trip_role:
    name: "@RequireTripRole 데코레이터 사용"
    grep: "@RequireTripRole"
    target: "server/src/modules/**/*.controller.ts"
    description: "TripRoleGuard와 함께 @RequireTripRole이 사용되는지 확인"
    severity: HIGH

  R7.3_trips_userid_access:
    name: "trips.user_id로 접근 제어 금지"
    grep: "trips\\.user_id|trip\\.userId.*===|where.*userId.*tripId"
    target: "server/src/modules/**/*.service.ts"
    expect: "no matches (trip_members 테이블로만 접근 제어)"
    severity: CRITICAL

  R7.4_service_access_check:
    name: "Service에서 접근 제어 금지 (Guard가 처리)"
    grep: "verifyAccess|checkPermission|canAccess"
    target: "server/src/modules/**/*.service.ts"
    description: "Guard로 처리해야 할 접근 제어가 Service에 남아있는지 확인 (레거시 코드)"
    severity: MEDIUM
```

---

## WEB STACK

### R9: `skills/web-ui-patterns` — React 웹 UI 패턴 (skill)

```yaml
checks:
  R9.1_window_confirm:
    name: "window.confirm() 사용 금지"
    grep: "window\\.confirm|window\\.alert"
    target: "web/src/**/*.tsx,web/app/**/*.tsx"
    expect: "no matches (Dialog/AlertDialog 사용)"
    severity: HIGH

  R9.2_native_alert:
    name: "alert() 사용 금지"
    grep: "\\balert\\("
    target: "web/src/**/*.tsx,web/app/**/*.tsx"
    exclude: "*.test.*"
    expect: "no matches (toast 또는 AlertDialog 사용)"
    severity: HIGH

  R9.3_zod_validation:
    name: "Zod 스키마 기반 폼 검증"
    grep: "useForm"
    follow_up_grep: "zodResolver"
    description: "react-hook-form에 zodResolver가 연결되어 있는지 확인"
    target: "web/src/**/*.tsx,web/app/**/*.tsx"
    severity: HIGH

  R9.4_old_toast:
    name: "구 shadcn toast 사용 금지"
    grep: "from.*@/components/ui/toast|useToast\\("
    target: "web/src/**/*.tsx,web/app/**/*.tsx"
    expect: "no matches (sonner 사용)"
    severity: MEDIUM

  R9.5_suppress_hydration:
    name: "html에 suppressHydrationWarning"
    grep: "suppressHydrationWarning"
    target: "web/app/layout.tsx"
    description: "root layout의 <html>에 suppressHydrationWarning이 있는지 확인"
    severity: MEDIUM

  R9.6_semantic_colors:
    name: "하드코딩 색상 대신 시맨틱 색상"
    grep: "bg-white|bg-black|bg-gray|text-white|text-black|text-gray"
    target: "web/src/**/*.tsx,web/app/**/*.tsx"
    description: "bg-background, text-foreground 등 시맨틱 클래스 대신 하드코딩 색상이 있는지 확인"
    severity: LOW

  R9.7_focus_visible:
    name: "Focus visible 스타일 유지"
    grep: "outline.*none|outline-none"
    target: "web/src/**/*.tsx,web/src/**/*.css"
    description: "focus 관련 outline이 제거되어 있는지 확인 (접근성)"
    severity: MEDIUM

  R9.8_skip_link:
    name: "Skip Link (본문 바로가기)"
    grep: "sr-only.*focus:not-sr-only|skip.*main"
    target: "web/app/layout.tsx"
    description: "root layout에 skip link가 있는지 확인"
    severity: LOW

  R9.9_reduced_motion:
    name: "Reduced Motion 존중"
    grep: "motion-reduce|prefersReducedMotion"
    target: "web/src/**/*.tsx"
    description: "애니메이션이 있는 컴포넌트에서 reduced motion을 존중하는지 확인"
    severity: LOW
```

### R10: `skills/nextjs-patterns` — Next.js App Router 패턴 (skill)

```yaml
checks:
  R10.1_use_client_boundary:
    name: "'use client' 경계 최소화"
    grep: "^'use client'"
    target: "web/app/**/page.tsx"
    description: "page.tsx 파일에 'use client'가 있는지 확인 (Server Component 우선)"
    severity: HIGH

  R10.2_server_action_auth:
    name: "Server Action에서 인증 확인"
    grep: "'use server'"
    follow_up_grep: "auth\\(\\)|getSession|getServerSession"
    description: "Server Action에 인증 확인이 있는지 확인"
    target: "web/app/**/*.ts,web/src/**/*.ts"
    severity: CRITICAL

  R10.3_server_action_validation:
    name: "Server Action에서 입력 검증"
    grep: "'use server'"
    follow_up_grep: "safeParse|parse\\(|schema\\."
    description: "Server Action에 Zod 등 입력 검증이 있는지 확인"
    target: "web/app/**/*.ts,web/src/**/*.ts"
    severity: CRITICAL

  R10.4_middleware_only_auth:
    name: "Middleware만으로 인증 보호 금지"
    description: "middleware.ts의 보호 경로에 대해 해당 page.tsx에서도 인증 확인이 있는지 수동 확인"
    manual_check: true
    severity: CRITICAL

  R10.5_error_tsx_use_client:
    name: "error.tsx에 'use client' 필수"
    grep: "^'use client'"
    target: "web/app/**/error.tsx"
    description: "모든 error.tsx 파일에 'use client'가 있는지 확인"
    severity: HIGH

  R10.6_metadata_export:
    name: "동적 페이지에 generateMetadata"
    grep: "generateMetadata|export const metadata"
    target: "web/app/**/page.tsx"
    description: "주요 페이지에 metadata 또는 generateMetadata가 있는지 확인"
    severity: MEDIUM

  R10.7_loading_tsx:
    name: "주요 라우트에 loading.tsx"
    glob: "web/app/**/loading.tsx"
    description: "주요 라우트 디렉토리에 loading.tsx가 있는지 확인"
    severity: MEDIUM

  R10.8_env_public_secret:
    name: "NEXT_PUBLIC_에 시크릿 노출 금지"
    grep: "NEXT_PUBLIC_.*SECRET|NEXT_PUBLIC_.*KEY(?!.*ANALYTICS|.*PUBLIC)"
    target: "web/.env*"
    expect: "no matches"
    severity: CRITICAL

  R10.9_serializable_props:
    name: "Server→Client 직렬화 가능 props만 전달"
    grep: "onFetch=|onClick=.*await|handler=.*async"
    target: "web/app/**/page.tsx"
    description: "Server Component에서 Client Component로 함수 props를 전달하는지 확인"
    severity: HIGH

  R10.10_default_tsx_parallel:
    name: "Parallel Route에 default.tsx 필수"
    glob: "web/app/@*/default.tsx"
    description: "Parallel route slot에 default.tsx가 있는지 확인"
    severity: HIGH
```

---

## SHARED / CROSS-STACK

### S1: Skills에서 추출한 패턴 체크

```yaml
checks:
  S1.1_i18n_hardcoded_strings:
    name: "[i18n] 하드코딩된 한국어/일본어 문자열"
    grep: "[가-힣]{3,}|[ぁ-ん]{2,}|[ァ-ヶ]{2,}"
    target: "{mobile,web}/src/components/**/*.tsx,{mobile,web}/app/**/*.tsx"
    exclude: "*.test.*, locales/, constants/"
    expect: "no matches (t() 키 사용)"
    severity: HIGH

  S1.2_i18n_locale_sync:
    name: "[i18n] 로케일 파일 간 키 동기화"
    description: "ko.ts, en.ts, ja.ts의 최상위 키가 동일한지 확인"
    manual_check: true
    severity: HIGH

  S1.3_zustand_whole_store:
    name: "[Zustand] 전체 store destructuring 금지"
    grep: "useStore\\(\\)|use[A-Z].*Store\\(\\)(?!\\()"
    target: "{mobile,web}/src/**/*.tsx"
    expect: "no matches (선택적 구독: store((s) => s.field) 사용)"
    severity: HIGH

  S1.4_zustand_inline_fallback:
    name: "[Zustand] 셀렉터에서 인라인 [] 폴백 금지"
    grep: "\\|\\|\\s*\\[\\]|\\?\\?\\s*\\[\\]"
    target: "{mobile,web}/src/**/*.tsx"
    description: "Zustand 셀렉터 결과에 || [] 폴백이 있는지 확인"
    severity: MEDIUM

  S1.5_typescript_enhanced_types:
    name: "[TypeScript] Enhanced*/Extended* 클라이언트 타입 금지"
    grep: "Enhanced[A-Z]|Extended[A-Z]|WithExtra"
    target: "{mobile,web}/src/types/**/*.ts"
    expect: "no matches (서버 타입 그대로 사용, Pick/Omit으로 축소)"
    severity: HIGH

  S1.6_console_log:
    name: "[Clean Code] console.log 잔존"
    grep: "console\\.log\\("
    target: "{mobile,web}/src/**/*.ts,{mobile,web}/src/**/*.tsx,server/src/**/*.ts"
    exclude: "*.test.*, *.spec.*"
    expect: "no matches"
    severity: MEDIUM

  S1.7_todo_comments:
    name: "[Clean Code] TODO/FIXME 주석"
    grep: "//\\s*TODO|//\\s*FIXME|//\\s*HACK|//\\s*XXX"
    target: "{mobile,web}/src/**/*.ts,{mobile,web}/src/**/*.tsx,server/src/**/*.ts"
    expect: "minimal matches"
    severity: LOW

  S1.8_commented_code:
    name: "[Clean Code] 주석 처리된 코드 블록"
    grep: "^\\s*//\\s*(import|export|const|function|return|if|for|while)"
    target: "{mobile,web}/src/**/*.tsx,server/src/**/*.ts"
    expect: "minimal matches"
    severity: LOW

  S1.9_enum_all_stacks:
    name: "[TypeScript] 모든 스택에서 enum 사용 금지"
    grep: "^\\s*export\\s+enum\\s"
    target: "{mobile,web}/src/**/*.ts,server/src/**/*.ts"
    expect: "no matches (string literal union 사용)"
    severity: HIGH

  S1.10_skeleton_loading:
    name: "[Loading] Skeleton 로딩 전략"
    grep: "<LoadingState|<ActivityIndicator|<Spinner"
    target: "{mobile,web}/src/components/**/*.tsx,{mobile,web}/app/**/*.tsx"
    expect: "minimal matches (화면별 Skeleton 사용)"
    severity: MEDIUM

  S1.11_barrel_export:
    name: "[Clean Code] Barrel export (index.ts re-export) 금지"
    grep: "export.*from\\s+['\"]\\."
    glob: "{mobile,web,server}/**/index.ts"
    expect: "no re-export barrel files"
    severity: HIGH

  S1.12_branded_type_assertion:
    name: "[TypeSafety] as string 타입 단언 (Branded Type 우회)"
    grep: "as string\\b|as number\\b"
    target: "{mobile,web}/src/**/*.ts,{mobile,web}/src/**/*.tsx"
    expect: "minimal matches (Branded Type factory 사용)"
    severity: MEDIUM

  S1.13_query_key_inline:
    name: "[QueryKey] 인라인 쿼리 키 문자열"
    grep: "queryKey:\\s*\\[['\"]"
    target: "{mobile,web}/src/**/*.ts,{mobile,web}/src/**/*.tsx"
    expect: "no matches (queryKeys.* factory 사용)"
    severity: HIGH

  S1.14_onclose_toggle:
    name: "[Callback] onClose에 toggle 함수 전달"
    grep: "onClose=\\{toggle|onClose=\\{.*Toggle"
    target: "{mobile,web}/src/**/*.tsx"
    expect: "no matches (explicit close 함수 사용)"
    severity: HIGH

  S1.15_forwardref:
    name: "[React19] forwardRef 사용 금지"
    grep: "forwardRef\\("
    target: "{mobile,web}/src/**/*.tsx"
    expect: "no matches (React 19에서 ref는 일반 prop으로 전달)"
    severity: HIGH

  S1.16_broad_invalidation:
    name: "[QueryKey] queryKeys.*.all 범위 무효화 금지"
    grep: "queryKeys\\.[a-z]+\\.all\\b"
    target: "{mobile,web}/src/**/*.ts,{mobile,web}/src/**/*.tsx"
    expect: "no matches (영향받는 쿼리만 targeted 무효화)"
    severity: HIGH

  S1.17_playwright_mcp:
    name: "[Tooling] Playwright MCP 도구 사용 금지"
    grep: "browser_navigate|browser_click|browser_snapshot"
    target: ".claude/**/*.md"
    description: "규칙/스킬 파일에서 Playwright MCP 도구 사용을 권장하는 내용이 없는지 확인"
    severity: MEDIUM

  S1.18_firebase_toplevel:
    name: "[Analytics] Firebase top-level import 금지"
    grep: "^import.*firebase|^import.*@firebase"
    target: "{mobile,web}/src/**/*.ts,{mobile,web}/src/**/*.tsx"
    exclude: "*.config.*, firebase.ts, analytics.ts"
    expect: "no matches (lazy loading 사용)"
    severity: MEDIUM

  S1.19_retry_flag:
    name: "[TokenRefresh] _retry 플래그 존재 확인"
    grep: "_retry"
    target: "{mobile,web}/src/lib/api.ts,{mobile,web}/src/services/api.ts"
    description: "토큰 갱신 인터셉터에 _retry 플래그가 존재하는지 확인 (제거 금지)"
    severity: HIGH
```

---

## Step 3: 검사 실행

### 자동 검사 (Grep/Glob 기반)

각 `expect: "no matches"` 규칙에 대해 Grep 검색을 실행한다.
**가능한 한 병렬로 실행**하여 속도를 최적화한다.

실행 순서:
1. CRITICAL 규칙 먼저 (R1.1, R1.4, R3.1, R7.1, R7.3, R8.1, R10.2, R10.3, R10.8, S1.11, S1.19)
2. HIGH 규칙 (S1.9, S1.10 포함)
3. MEDIUM/LOW 규칙

### 수동 검사 (manual_check: true)

자동 Grep으로 확인 불가한 규칙은 **샘플링 검사**를 수행:
- 대상 파일 중 최대 5개를 Read로 열어서 수동 확인
- 위반 여부를 판단하여 보고

---

## Step 4: 결과 보고

### 출력 포맷

```markdown
## Convention Conformance Report

**프로젝트**: [name]
**검사 일시**: [date]
**검사 범위**: [scope]
**탐지된 스택**: Mobile ✅ | Server ✅ | Web ❌
**룰 파일 수**: [count]개 rules + [count]개 skills
**활성 체크**: [count]개 (스택 기반 필터링 후)

---

### Summary

| Severity | Pass | Fail | Manual | Total |
|----------|------|------|--------|-------|
| CRITICAL | 5 | 1 | 1 | 7 |
| HIGH | 15 | 3 | 4 | 22 |
| MEDIUM | 10 | 2 | 3 | 15 |
| LOW | 5 | 0 | 1 | 6 |
| **Total** | **35** | **6** | **9** | **50** |

**Conformance Rate**: 85% (35/41 auto-checked rules pass)

---

### Stack: MOBILE

#### CRITICAL Violations
| Rule | Check | File:Line | Details |
|------|-------|-----------|---------|
| R1.1 | Container-Presenter | `MapTab.presenter.tsx:45` | `useQuery` in Presenter |
| R8.1 | Route Param Validation | `trip/[tripId].tsx:12` | No type guard |

#### HIGH Violations
...

---

### Stack: SERVER

#### CRITICAL Violations
| Rule | Check | File:Line | Details |
|------|-------|-----------|---------|
| R7.3 | trips.user_id access | `trips.service.ts:89` | Direct userId check |

---

### Stack: WEB (not detected — skipped)

---

### Manual Check Results

| Rule | Check | Sample Files | Result | Notes |
|------|-------|-------------|--------|-------|
| R1.6 | onClose toggle | 5 files | ✅ Pass | All explicit close |
| R2.1 | useEffect deps | 5 files | ⚠️ 1 issue | `useSchedules.ts:67` |
| R10.4 | Middleware auth | 3 routes | ✅ Pass | All have server check |

---

### Rule File Conformance Map

| Rule File | Stack | Checks | Pass | Fail | Rate |
|-----------|-------|--------|------|------|------|
| `mobile-conventions.md` | Mobile | 8 | 7 | 1 | 88% |
| `react-component-patterns.md` | Shared | 6 | 5 | 1 | 83% |
| `react-data-patterns.md` | Shared | 7 | 6 | 1 | 86% |
| `react-functional-patterns.md` | Shared | 6 | 6 | 0 | 100% |
| `ui-patterns.md` | Mobile | 9 | 7 | 2 | 78% |
| `skills/mobile-integration` | Mobile | 7 | 5 | 2 | 71% |
| `server-conventions.md` | Server | 6 | 6 | 0 | 100% |
| `skills/rbac-patterns` | Server | 4 | 3 | 1 | 75% |
| `skills/web-ui-patterns` | Web | — | — | — | N/A |
| `skills/nextjs-patterns` | Web | — | — | — | N/A |
| `typescript-conventions.md` | Shared | — | — | — | N/A (new) |
| `frontend-conventions.md` | Shared | — | — | — | N/A (new) |
| `backend-conventions.md` | Shared | — | — | — | N/A (new) |
| `zustand-conventions.md` | Shared | — | — | — | N/A (new) |
| Skills (combined) | Shared | 19 | 9 | 2 | — |

---

### Recommendations

**[Priority 1 — CRITICAL]**: Fix [n] critical violations immediately
**[Priority 2 — HIGH]**: Address [n] high violations before next feature
**[Priority 3 — MEDIUM]**: Plan [n] medium violations for cleanup sprint
**[Priority 4 — LOW]**: Track [n] low violations for gradual improvement
```

---

## Step 5: 주의사항

### READ-ONLY 원칙
- 이 스킬은 **보고만** 한다. 코드 수정은 하지 않는다.
- 수정이 필요하면 사용자에게 `/audit`(자동 수정 포함) 또는 직접 수정을 안내한다.

### False Positive 처리
- Grep 패턴은 오탐이 발생할 수 있다.
- 각 결과에 대해 **실제 파일 내용을 확인**한 후 보고한다.
- 확실하지 않으면 `⚠️ 확인 필요`로 표시한다.

### 스택 미탐지 시
- 해당 스택의 룰은 `N/A (not detected)`로 표시한다.
- 사용자가 명시적으로 스택을 지정하면 (`/cc web`) 탐지 결과와 관계없이 해당 룰을 실행한다.

### 성능 최적화
- 가능한 모든 Grep 검색을 **병렬 실행**한다.
- 대규모 프로젝트에서는 범위를 좁혀서 실행하도록 안내한다.
- 결과가 50개 이상이면 상위 10개만 표시하고 나머지는 카운트만 보고한다.

---

## Scope Options

- `/cc` — 현재 세션 변경 파일 대상
- `/cc mobile` — 모바일 전체 (R1, R2, R3, R4, R5, R8, S1)
- `/cc server` — 서버 전체 (R6, R7, S1)
- `/cc web` — 웹 전체 (R2, R3, R4, R9, R10, S1)
- `/cc all` — 프로젝트 전체 (탐지된 모든 스택)
- `/cc [path]` — 특정 경로
- `/cc rules` — 등록된 룰 목록만 출력
- `/cc --severity critical` — CRITICAL만 검사
- `/cc --severity high` — HIGH 이상만 검사
