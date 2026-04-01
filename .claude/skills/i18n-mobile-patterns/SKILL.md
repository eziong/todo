---
name: i18n-mobile-patterns
description: i18next and react-i18next internationalization patterns for React Native mobile apps. Use when implementing useTranslation, adding translation keys to locale files, formatting dates with date-fns locales, formatting currencies with Intl.NumberFormat, or setting up LanguageProvider in projects using i18next.
user-invocable: false
---

# i18n Mobile Patterns (i18next + React Native)

## Setup

```tsx
// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/constants/locales/en';
import ko from '@/constants/locales/ko';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  lng: 'ko',              // Default language
  fallbackLng: 'en',      // Fallback if key missing
  interpolation: {
    escapeValue: false,    // React already escapes
  },
});

export default i18n;
```

## Translation File Structure

Organize by domain with flat keys within each domain:

```tsx
// constants/locales/ko.ts (source of truth)
export default {
  common: {
    cancel: '취소',
    confirm: '확인',
    delete: '삭제',
    save: '저장',
    edit: '수정',
    loading: '로딩 중...',
    retry: '다시 시도',
    noData: '데이터가 없습니다',
  },
  errors: {
    generic: '오류가 발생했습니다.',
    network: '네트워크 연결을 확인해주세요.',
    timeout: '요청 시간이 초과되었습니다.',
    unauthorized: '로그인이 필요합니다.',
  },
  auth: {
    login: '로그인',
    logout: '로그아웃',
    logoutMessage: '정말 로그아웃 하시겠습니까?',
  },
  items: {
    title: '아이템',
    create: '새 아이템',
    empty: '아이템이 없습니다.',
    deleteConfirm: '이 아이템을 삭제하시겠습니까?',
  },
  // ... more domains
};

// constants/locales/en.ts (MUST mirror exact same structure)
export default {
  common: {
    cancel: 'Cancel',
    confirm: 'OK',
    delete: 'Delete',
    // ... same keys, different values
  },
  // ... same structure
};
```

## Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('items.title')}</Text>
      <Button title={t('common.save')} />

      {/* With interpolation */}
      <Text>{t('items.count', { count: 5 })}</Text>
      {/* ko: "5개의 아이템" / en: "5 items" */}

      {/* With pluralization */}
      <Text>{t('items.remaining', { count })}</Text>
    </View>
  );
}
```

## Locale-Aware Date Formatting

```tsx
import { format } from 'date-fns';
import { ko, enUS, ja } from 'date-fns/locale';
import i18n from '@/lib/i18n';

function getDateLocale(): Locale {
  switch (i18n.language) {
    case 'ko': return ko;
    case 'ja': return ja;
    default: return enUS;
  }
}

export function formatDate(date: string | Date): string {
  const isKorean = i18n.language === 'ko';
  const pattern = isKorean ? 'yyyy년 M월 d일' : 'MMM d, yyyy';
  return format(new Date(date), pattern, { locale: getDateLocale() });
}

export function formatDateRange(start: string, end: string): string {
  const isKorean = i18n.language === 'ko';
  const sameYear = isSameYear(new Date(start), new Date(end));

  if (sameYear) {
    const fmt = isKorean ? 'M월 d일' : 'MMM d';
    return `${format(new Date(start), fmt)} - ${format(new Date(end), fmt)}`;
  }
  // Different year: include year in both
  const fmt = isKorean ? 'yyyy년 M월 d일' : 'MMM d, yyyy';
  return `${format(new Date(start), fmt)} - ${format(new Date(end), fmt)}`;
}
```

## Locale-Aware Currency Formatting

```tsx
const ZERO_DECIMAL = new Set(['KRW', 'JPY', 'VND', 'IDR']);

function getLocaleString(): string {
  switch (i18n.language) {
    case 'ko': return 'ko-KR';
    case 'ja': return 'ja-JP';
    default: return 'en-US';
  }
}

export function formatCurrency(amount: number, currency = 'KRW'): string {
  const decimals = ZERO_DECIMAL.has(currency) ? 0 : 2;
  return new Intl.NumberFormat(getLocaleString(), {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
```

## Language Provider

```tsx
// providers/LanguageProvider.tsx
export function LanguageProvider({ children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('language').then((lang) => {
      if (lang) i18n.changeLanguage(lang);
      setIsReady(true);
    });
  }, []);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('language', lang);
  };

  if (!isReady) return null;

  return (
    <LanguageContext.Provider value={{ changeLanguage, currentLanguage: i18n.language }}>
      {children}
    </LanguageContext.Provider>
  );
}
```

## Rules

1. **Never hardcode user-facing strings** → Always use `t('key')`
2. **Source language file is truth** → Other languages mirror its structure exactly
3. **Domain-grouped keys** → `domain.camelCaseKey` format (e.g., `trip.createTitle`)
4. **Locale-aware formatting** → Dates, currencies, numbers respect current language
5. **Persist language preference** → Save to AsyncStorage, restore on app start
6. **`useTranslation` in Presenters OK** → It's a pure rendering concern
7. **Interpolation for dynamic values** → `t('key', { count, name })` not string concat

---

## Key Naming Convention

### 키 형식

- **기본 형식**: `domain.camelCaseKey` (예: `trip.createTitle`, `budget.totalAmount`)
- **계층 구분**: `.`으로 도메인/서브도메인 구분 (최대 3단계)

### 키 계층 구조

| 계층 | 패턴 | 예시 | 용도 |
|------|------|------|------|
| 공통 | `common.*` | `common.save`, `common.cancel`, `common.delete` | 앱 전체 공통 텍스트 |
| 도메인 | `{domain}.*` | `trip.title`, `budget.total` | 도메인별 텍스트 |
| 서브도메인 | `{domain}.{sub}.*` | `trip.member.inviteTitle` | 하위 기능 텍스트 |
| 에러 | `errors.*` | `errors.network`, `errors.required` | 에러 메시지 |
| 권한 | `permission.*` | `permission.locationTitle` | 권한 요청 |

### 키 접미사 규칙

| 접미사 | 용도 | 예시 |
|--------|------|------|
| `*Title` | 화면/섹션/모달 제목 | `trip.createTitle`, `budget.deleteTitle` |
| `*Message` | 설명/확인 메시지 본문 | `trip.deleteMessage`, `errors.networkMessage` |
| `*Label` | 입력 필드/버튼 라벨 | `trip.titleLabel`, `budget.amountLabel` |
| `*Placeholder` | 입력 플레이스홀더 | `trip.titlePlaceholder`, `budget.notePlaceholder` |

### ALL Locale 동시 업데이트 (CRITICAL)

- 새 i18n 키 추가 시 **반드시 모든 locale 파일을 동시에 업데이트**
- 프로젝트 locale 파일: `ko.ts`, `en.ts`, `ja.ts` (3개)
- 한 locale만 업데이트하고 나머지를 누락하면 런타임 fallback 발생 → 금지

```typescript
// ✅ 3개 locale 동시 추가
// ko.ts: trip: { shareTitle: '여행 공유' }
// en.ts: trip: { shareTitle: 'Share Trip' }
// ja.ts: trip: { shareTitle: '旅行を共有' }

// ❌ ko.ts에만 추가하고 en.ts, ja.ts 누락 → 금지
```
