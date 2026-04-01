---
name: typescript-type-safety
description: TypeScript type safety patterns including branded/nominal types, Input/Output type separation, and API response types. Use in TypeScript (.ts, .tsx) projects when defining entity types, creating type-safe IDs, designing API request/response contracts, or structuring form data types.
user-invocable: false
---

# TypeScript Type Safety Patterns

## Branded Types (Nominal Typing)

Prevent accidental ID mixing at compile time. A `UserId` can never be passed where `ItemId` is expected.

```tsx
// types/branded.ts
declare const brand: unique symbol;
type Brand<T, B> = T & { [brand]: B };

// Define branded types
export type UserId = Brand<string, 'UserId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type TeamId = Brand<string, 'TeamId'>;

// Factory functions for runtime conversion
export const UserId = (id: string): UserId => id as UserId;
export const ItemId = (id: string): ItemId => id as ItemId;
export const TeamId = (id: string): TeamId => id as TeamId;

// Type guards for validation
export const isUserId = (id: unknown): id is UserId =>
  typeof id === 'string' && id.length > 0;
```

**Usage in route containers:**
```tsx
export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = ItemId(id || '');  // Convert string → branded type
  const { data } = useItem(itemId); // Type-safe: only accepts ItemId
}
```

**Compile-time safety:**
```tsx
function getUser(id: UserId): Promise<User> { ... }
function getItem(id: ItemId): Promise<Item> { ... }

const userId = UserId('abc');
const itemId = ItemId('xyz');

getUser(userId);  // OK
getUser(itemId);  // COMPILE ERROR: ItemId not assignable to UserId
```

## Input/Output Type Separation

Maintain separate types for different data lifecycle stages:

```tsx
// Domain entity (from API response)
interface Item {
  id: ItemId;
  userId: UserId;
  title: string;
  status: ItemStatus;
  createdAt: string;     // ISO string from API
  updatedAt: string;
}

// Create input (only required fields for creation)
interface CreateItemInput {
  title: string;
  status?: ItemStatus;   // Optional with server default
}

// Update input (all fields optional)
interface UpdateItemInput {
  title?: string;
  status?: ItemStatus;
}

// Extended view type (domain + computed fields)
interface ItemWithDetails extends Item {
  comments: Comment[];
  author: User;
  commentCount: number;  // Computed
}

// Form data type (uses native types, not API types)
interface ItemFormData {
  title: string;
  dueDate: Date;         // Date object (not ISO string)
  priority: number;
}
```

**Data flow**: `FormData (Date)` → convert → `CreateInput (string)` → API → `Item (string)` → display

## API Response Wrapper Types

```tsx
// Generic API response envelope
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Paginated response
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Typed API error
interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, string[]>;
}
```

## Union Types for Categories

Use string literal unions instead of enums for better tree-shaking and type inference:

```tsx
// Prefer union types
export type ItemStatus = 'draft' | 'active' | 'archived';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Category type with exhaustive handling
function getStatusLabel(status: ItemStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'active': return 'Active';
    case 'archived': return 'Archived';
    // TypeScript ensures exhaustiveness - no default needed
  }
}
```

## RBAC Permission Types

```tsx
type MemberRole = 'owner' | 'editor' | 'viewer';

type Permission =
  | 'edit' | 'delete' | 'invite' | 'manage';

const PERMISSION_MAP: Record<Permission, MemberRole[]> = {
  edit: ['owner', 'editor'],
  delete: ['owner'],
  invite: ['owner', 'editor'],
  manage: ['owner'],
};

function hasPermission(role: MemberRole, perm: Permission): boolean {
  return PERMISSION_MAP[perm].includes(role);
}

function canEdit(role: MemberRole): boolean {
  return role === 'owner' || role === 'editor';
}
```

## Server-Derived Types (서버 데이터 기반 타입)

### 원칙: 서버가 타입의 Single Source of Truth

클라이언트 타입은 서버 응답에서 파생한다. 컴포넌트 간 데이터 전달 시 불필요한 가공/재정의를 금지한다.

> **TkDodo (TanStack Query maintainer)**: "`queryFn` 리턴 타입을 지정하면 React Query가 나머지를 추론한다. 수동으로 제네릭을 지정하지 마라."
>
> **tRPC 철학**: "서버가 타입의 원천(source of truth)이다."

### 타입 계층 (허용)

```
서버 응답 타입 (Domain)
├── 그대로 사용 (기본)
├── Pick<Domain, 'field1' | 'field2'> (축소)
├── Omit<Domain, 'internalField'> (필드 제거)
├── select() 변환 (React Query select 옵션)
└── Input 타입 (Create/Update — API 요청 전용)
```

### 허용되는 타입 패턴

```tsx
// ✅ 서버 응답 타입 그대로 사용
interface Trip {
  id: TripId;
  title: string;
  destination: string;
  startDate: string;
  members: TripMember[];
}

// ✅ Pick으로 필요한 필드만 축소 (Presenter props)
type TripCardProps = Pick<Trip, 'id' | 'title' | 'destination' | 'startDate'>;

// ✅ 서버가 JOIN으로 내려준 확장 타입
interface TripWithDetails extends Trip {
  scheduleCount: number;  // 서버에서 계산하여 내려줌
  memberNames: string[];  // 서버에서 JOIN하여 내려줌
}

// ✅ API 요청 전용 Input 타입
interface CreateTripInput {
  title: string;
  destination: string;
  startDate: string;
}

// ✅ React Query select로 가공
const { data: tripNames } = useQuery({
  queryKey: queryKeys.trips.lists(),
  queryFn: getTrips,
  select: (trips) => trips.map((t) => t.title), // 타입 자동 추론
});
```

### 금지되는 타입 패턴

```tsx
// ❌ 클라이언트에서 임의 가공 타입 생성
interface EnhancedTrip extends Trip {
  formattedDate: string;     // 클라이언트에서 가공
  isExpired: boolean;        // 클라이언트에서 계산
  displayTitle: string;      // 클라이언트에서 조합
}

// ❌ 컴포넌트 간 전달 시 새 타입 정의
interface TripListItemData {
  tripId: string;            // branded type도 아님
  name: string;              // title을 rename
  date: string;              // startDate를 rename
}

// ❌ 여러 소스를 클라이언트에서 합성
interface TripDashboard {
  trip: Trip;
  budget: Budget;
  weather: Weather;          // 별도 API 데이터를 클라이언트에서 합침
}
```

### 가공이 필요한 경우의 올바른 패턴

```tsx
// ✅ 파생값 직접 계산 — 새 타입 정의 없이 (Compiler가 자동 캐싱)
const formattedDate = format(parseISO(trip.startDate), 'PPP', { locale: ko });
const isExpired = isPast(parseISO(trip.endDate));

// Presenter에 원본 데이터 + 파생값 각각 전달
<TripCard trip={trip} formattedDate={formattedDate} isExpired={isExpired} />

// ✅ 또는 Presenter 내부에서 직접 계산 (순수 함수)
function TripCard({ trip }: { trip: Trip }) {
  const formattedDate = format(parseISO(trip.startDate), 'PPP');
  return <Text>{formattedDate}</Text>;
}
```

### 컴포넌트 간 데이터 전달 규칙

```
Container → Presenter 전달 시:
  ✅ trip={trip}                    (서버 타입 그대로)
  ✅ trip={trip} isExpired={true}   (원본 + 파생값 별도)
  ✅ trips={trips}                  (서버 배열 그대로)
  ❌ data={enhancedTrip}            (가공된 새 타입)
  ❌ items={trips.map(transform)}   (변환된 새 배열)
```

### 판단 기준

| 상황 | 올바른 방법 | 잘못된 방법 |
|------|-----------|-----------|
| 날짜 포맷팅 | 직접 계산 + 별도 prop | `EnhancedTrip.formattedDate` |
| 필드 축소 | `Pick<Trip, ...>` | 새 interface 정의 |
| 필드 제거 | `Omit<Trip, ...>` | 수동 복사 interface |
| 서버 JOIN 데이터 | `TripWithDetails extends Trip` | 클라이언트에서 합성 |
| 리스트 필터링 | 직접 `filter()` 호출 | `FilteredTrip[]` 타입 |
| 쿼리 데이터 변환 | `select` 옵션 | 커스텀 transform 함수 + 새 타입 |

## Rules

1. **Branded types for all entity IDs** → Never use plain `string` for IDs
2. **Separate Input/Output/Form types** → Never reuse domain types for mutations
3. **Union types over enums** → Better type inference and tree-shaking
4. **Explicit return types** → On exported functions and hook returns
5. **No `any`** → Use `unknown` and narrow with type guards
6. **Form types use native types** → `Date` not `string`, convert at API boundary
7. **서버 타입이 Single Source of Truth** → 클라이언트에서 `Enhanced*`, `Extended*`, `*WithExtra` 타입 생성 금지
8. **컴포넌트 간 불필요한 데이터 가공 금지** → 서버 데이터 그대로 전달, 파생값은 직접 계산/`select`
9. **타입 축소는 `Pick`/`Omit`** → 새 interface 정의 대신 TypeScript 유틸리티 타입 사용
