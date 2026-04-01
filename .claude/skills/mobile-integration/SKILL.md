---
name: mobile-integration
description: "React Native/Expo mobile integration patterns: route params validation, push notifications, deep links, file upload with image optimization, Supabase realtime sync, AppState handling, platform-specific patterns, location permissions. Use when implementing mobile-specific integrations."
user-invocable: false
---

# Mobile Integration Patterns

React Native / Expo 전용 패턴.
Notification, Deep Link, File Upload, Real-time, Route Params 등.


## 1. Route Params Validation (라우트 파라미터 검증)

### 모든 동적 라우트에 MANDATORY

```tsx
export default function TripDetailScreen(): React.ReactElement {
  const { tripId: tripIdParam } = useLocalSearchParams<{ tripId: string }>();

  // Step 1: 타입 가드
  if (!tripIdParam || typeof tripIdParam !== 'string') {
    return <LoadingState />;
  }

  // Step 2: Branded Type 변환 (검증 후에만)
  const tripId = TripId(tripIdParam);

  // Step 3: 데이터 fetch
  const { data, isLoading, error } = useTrip(tripId);
  // ...
}
```

### 검증 순서

```
1. useLocalSearchParams<{ param: string }>() — 타입 힌트
2. if (!param || typeof param !== 'string') → early return
3. BrandedType(param) — 검증 통과 후 변환
4. useQuery(brandedId) — 안전한 fetch
```

### 복수 파라미터

```tsx
const { tripId, id, dayNumber } = useLocalSearchParams<{
  tripId: string;
  id: string;
  dayNumber: string;
}>();

// 필수 파라미터는 모두 검증
if (!tripId || typeof tripId !== 'string' || !id || typeof id !== 'string') {
  return <LoadingState />;
}

// 선택 파라미터는 기본값
const day = dayNumber ? parseInt(dayNumber, 10) : 1;
```

### 금지 사항
- 검증 없이 `useLocalSearchParams` 결과를 직접 사용 금지
- `as string` 타입 단언 금지 — 런타임 가드 사용
- Branded Type 변환을 검증 전에 하기 금지


## 2. Notification (알림)

### NotificationProvider 구조 (5개 리스너)

```
1. Initialize: 채널 설정 + 권한 상태 확인
2. Permission Request: 사용자 권한 요청 (모달 or 시스템)
3. Received Listener: 앱 포그라운드에서 알림 수신
4. Response Listener: 알림 탭 → 딥링크 네비게이션
5. Cold Start: 앱 종료 상태에서 알림 탭으로 시작
```

### 알림 탭 → 딥링크 패턴

```tsx
// Response Listener (앱 실행 중 알림 탭)
Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;

  if (data?.tripId && data.type === 'trip-reminder') {
    setTimeout(() => {
      router.push(`/trip/${data.tripId}`);
    }, 100);  // 네비게이션 준비 대기
  }
});

// Cold Start (앱 종료 → 알림으로 시작)
const response = await Notifications.getLastNotificationResponseAsync();
if (response?.notification.request.content.data?.tripId) {
  setTimeout(() => {
    router.push(`/trip/${data.tripId}`);
  }, 500);  // 더 긴 대기 — 앱 초기화 필요
}
```

### 알림 스케줄링

```tsx
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Trip Reminder",
    body: `${tripTitle} starts in ${daysBefore} days`,
    data: { tripId, type: 'trip-reminder', daysBefore },
  },
  trigger: {
    date: reminderDate,
    channelId: 'trip-reminders',  // Android 필수
  },
});
```

### 새 알림 타입 추가 시 체크리스트
- [ ] `NotificationData` 타입에 새 `type` 추가
- [ ] Response Listener에 새 type 분기 추가
- [ ] Cold Start 핸들러에도 같은 분기 추가
- [ ] Android 채널 필요 시 `setupNotificationChannel()`에 추가
- [ ] 알림 탭 딥링크 경로 테스트


## 3. Deep Link (딥 링크)

### 지원 경로

| 패턴 | 용도 | 인증 필요 |
|------|------|----------|
| `pinny://auth-callback?code=xxx` | OAuth 콜백 | X (인증 과정) |
| `pinny://invite/{code}` | 초대 수락 | O |
| `https://pinny.app/invite/{code}` | Universal Link (iOS) | O |
| 알림 데이터 `{ tripId }` | 트립 이동 | O |

### OAuth 콜백 패턴

```tsx
// app/auth-callback.tsx
export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code: string }>();

  useEffect(() => {
    // 이미 인증됨 → 메인으로
    if (isAuthenticated) { router.replace('/(tabs)'); return; }
    // 코드 없음 → 로그인으로
    if (!code) { router.replace('/(auth)/login'); return; }
    // 중복 교환 방지
    if (isOAuthBrowserActive()) { /* 대기 후 상태 확인 */ return; }

    // 코드 교환
    exchangeOAuthCode(code).then(login).then(() => router.replace('/(tabs)'));
  }, [code, isAuthenticated]);
}
```

### 인증 필요 딥링크 패턴

```tsx
// app/invite/[code].tsx
// Expo Router가 자동으로 인증 확인 (app/index.tsx의 auth gate)
// 미인증 → /(auth)/login → 인증 후 딥링크 복원은 미구현
```

### 새 딥링크 추가 시 체크리스트
- [ ] `app.json`의 `scheme`, `associatedDomains`, `intentFilters` 업데이트
- [ ] `app/` 디렉토리에 라우트 파일 생성
- [ ] 인증 필요 여부 결정 → 미인증 시 리다이렉트 처리
- [ ] `_layout.tsx`에 Stack.Screen 등록
- [ ] Universal/App Links인 경우 서버에 `.well-known` 파일 배포


## 4. File Upload + Image Optimization (파일 업로드)

### 업로드 전 최적화 (MANDATORY)

```tsx
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_WIDTH = 2048;
const JPEG_QUALITY = 0.7;

async function optimizeImage(uri: string, width?: number) {
  if (!width || width <= MAX_WIDTH) return { uri };

  return ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
}
```

### 이미지 선택 → 검증 → 업로드 흐름

```
1. ImagePicker.requestPermissionsAsync() — 권한 확인
2. ImagePicker.launchImageLibraryAsync({
     quality: 0.7,
     allowsMultipleSelection: true,
     selectionLimit: remainingSlots,
   })
3. 각 이미지 리사이즈 (2048px max)
4. validateFile() — 크기/타입 검증
5. onFilesChange([...files, ...newFiles]) — 상태 업데이트
6. 업로드 (Container에서 처리)
```

### ActionSheet 옵션 (프로필/커버 이미지)

```tsx
Alert.alert(t('image.selectTitle'), undefined, [
  { text: t('image.takePhoto'), onPress: handleCamera },
  { text: t('image.chooseFromLibrary'), onPress: handleGallery },
  ...(hasExisting ? [{ text: t('image.remove'), style: 'destructive', onPress: handleRemove }] : []),
  { text: t('common.cancel'), style: 'cancel' },
]);
```

### 표준 파라미터

| 파라미터 | 값 | 이유 |
|---------|-----|------|
| maxWidth | 2048px | 고해상도 디스플레이 대응 |
| quality/compress | 0.7 (70%) | 품질/크기 균형 |
| format | JPEG | 호환성 + 압축률 |
| exif | false | 개인정보 제거 |

### 금지 사항
- 권한 확인 없이 ImagePicker 호출 금지
- 리사이즈/압축 없이 원본 업로드 금지
- EXIF 데이터 포함 업로드 금지 (위치 정보 노출)


## 5. Real-time Sync (실시간 동기화)

### Supabase Realtime + Query Invalidation 패턴

```tsx
// RealtimeProvider.tsx
const channel = supabase
  .channel(`trip:${tripId}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'schedules', filter: `trip_id=eq.${tripId}` },
    () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.byTrip(tripId) });
    }
  )
  .subscribe();
```

### 구독 관리

```tsx
// Container에서 구독/해제
useEffect(() => {
  subscribeTripChanges(tripId, handleTripDeleted);
  return () => unsubscribeTripChanges();
}, [tripId]);
```

### 현재 구독 테이블

| 테이블 | 이벤트 | 무효화 대상 |
|--------|--------|------------|
| trips | DELETE | trips.detail + trips.lists |
| schedules | * | schedules.byTrip |
| checklist_items | * | checklist.byTrip |
| journals | * | journals.byTrip |
| trip_members | * | members.byTrip |
| trip_invites | * | invites.byTrip |

### 핵심 원칙
- **Invalidation only**: 실시간 이벤트 → `invalidateQueries()` (캐시 직접 수정 X)
- **Per-trip channel**: 각 trip마다 독립 채널 → 불필요한 이벤트 수신 방지
- **Cleanup on unmount**: 화면 이탈 시 반드시 unsubscribe

### 새 테이블 구독 추가 시 체크리스트
- [ ] `RealtimeProvider`에 `.on('postgres_changes', ...)` 추가
- [ ] 적절한 `queryKey` 무효화 대상 설정
- [ ] Supabase RLS 정책 확인 (realtime은 RLS 통과한 이벤트만 수신)
- [ ] 클린업 로직에 새 채널 해제 포함 확인


## 6. AppState Handling (앱 상태 관리)

### 포그라운드 복귀 시 처리

```tsx
useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      // 권한 상태 리프레시
      refreshPermissionStatus();
      // 토큰 유효성 재확인 (선택)
      checkAuth();
    }
  });
  return () => subscription.remove();
}, []);
```

### 사용 사례

| 포그라운드 복귀 시 | 처리 |
|------------------|------|
| 알림 권한 상태 | 시스템 설정에서 변경했을 수 있음 → 리프레시 |
| 위치 권한 상태 | 시스템 설정에서 변경했을 수 있음 → 리프레시 |
| 인증 상태 | 토큰 만료 확인 (선택적) |
| 네트워크 상태 | NetInfo가 자동 처리 |


## 7. Platform-Specific Patterns (플랫폼 분기)

### KeyboardAvoidingView

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  // iOS: padding으로 키보드 위 여백 확보
  // Android: undefined (시스템이 자동 처리)
>
```

### SecureStore vs AsyncStorage

```tsx
// 민감한 데이터 (토큰)
if (Platform.OS === 'web') {
  await AsyncStorage.setItem(key, token);
} else {
  await SecureStore.setItemAsync(key, token);  // 암호화 저장
}

// 비민감 데이터 (설정, 캐시)
await AsyncStorage.setItem(key, value);  // 모든 플랫폼 동일
```

### StatusBar

```tsx
<StatusBar style={isDark ? 'light' : 'dark'} />
// iOS: 상태바 텍스트 색상
// Android: expo-status-bar가 자동 처리
```


## 8. Location Permission (위치 권한)

### 최초 요청 (앱 시작 시)

```tsx
// _layout.tsx — 비동기 lazy import
useEffect(() => {
  import('expo-location')
    .then((Location) => Location.requestForegroundPermissionsAsync())
    .catch(() => {});  // 실패해도 앱 동작에 영향 없음
}, []);
```

### 지도 사용 시 확인

```tsx
const { status } = await Location.getForegroundPermissionsAsync();

if (status !== 'granted') {
  Alert.alert(
    t('permission.locationTitle'),
    t('permission.locationMessage'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('permission.openSettings'), onPress: () => Linking.openSettings() },
    ]
  );
  return;
}
```

### 원칙
- 첫 요청은 앱 시작 시 (비차단적)
- 거부 후 재요청은 `Linking.openSettings()`로 시스템 설정 유도
- 위치 없이도 앱 기본 기능은 동작해야 함
