---
alwaysApply: false
globs: ["**/*.ts", "**/*.tsx"]
---

# TypeScript Conventions

프레임워크/스택 무관 TypeScript 공통 패턴.

---

## 1. Branded Types (명목적 타입)

모든 엔티티 ID는 `Brand<string, 'TypeName'>` 패턴으로 타입 안전성 확보. 팩토리: `TripId(id)`, `UserId(id)`.

> 코드 예시: `typescript-type-safety` 스킬 참조.

### 변환 시점 (5-Step Conversion Pipeline)

| 단계 | 위치 | 타입 | 예시 |
|------|------|------|------|
| 1. 파라미터 수신 | Route (`useLocalSearchParams`) | `string` | `const { tripId: rawId } = useLocalSearchParams()` |
| 2. 타입 가드 | Route (early return) | `string` | `if (!rawId \|\| typeof rawId !== 'string') return <LoadingState />` |
| 3. 브랜드 변환 | Route (가드 직후) | `BrandedType` | `const tripId = TripId(rawId)` |
| 4. 훅/서비스 전달 | Hook/Service 인자 | `BrandedType` | `useTrip(tripId)`, `tripService.get(tripId)` |
| 5. API 응답 매핑 | Service map 함수 | `Domain Type` | `{ id: TripId(raw.id), title: raw.title }` |

- **라우트 경계에서 즉시 변환**: 단계 1→2→3을 라우트 파일 최상단에서 수행
- **내부 코드**: 항상 Branded Type으로 전달 (단계 4)
- **API 응답 ID**: 서비스 계층 map 함수에서 팩토리 적용 (단계 5)
- `as TripId` 단언 우회 금지 — 반드시 `TripId()` 팩토리 함수 사용

---

## 2. Type System 4-Tier

엔티티 관련 타입을 4계층으로 분리하여 각 용도에 맞게 사용한다.

| Tier | 이름 | 용도 | 예시 |
|------|------|------|------|
| Input | `CreateTripInput` | 생성 시 최소 필드 | `{ title, startDate }` |
| Domain | `Trip` | API 응답 전체 엔티티 | `{ id, title, startDate, createdAt, ... }` |
| View | `TripWithDetails` | Domain + 계산 필드 | `{ ...Trip, dayCount, memberNames }` |
| Form | `TripFormData` | 폼 전용 (Date 객체 등) | `{ title, startDate: Date }` |

### 규칙

- **Input → Domain**: API 호출 후 서버가 반환
- **Domain → View**: 클라이언트에서 계산 필드 추가
- **Form → Input**: 폼 제출 시 Date → ISO string 등 변환
- View 타입에서 서버 타입 확장 금지 (`Enhanced*`, `Extended*` 접두사 금지)
- 서버 타입 축소 시 `Pick`/`Omit` 사용

---

## 3. Union Types over Enums

`enum` 대신 `type TripRole = 'owner' | 'editor' | 'viewer'` 형태 사용.
이유: Tree-shaking 가능, 타입 추론 정확, JSON 직렬화 자연스러움.

---

## 금지 사항 요약

- `enum` 선언 금지 — string literal union 사용
- `as string` / `as number` 타입 단언으로 Branded Type 우회 금지 — 팩토리 함수 사용
- `Enhanced*` / `Extended*` 접두사 타입 생성 금지 — 서버 타입 + `Pick`/`Omit` 사용
- 엔티티 ID에 `string` 타입 직접 사용 금지 — Branded Type 사용
