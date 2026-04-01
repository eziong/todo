---
alwaysApply: false
globs: ["server/**/*.ts"]
---

# Backend Conventions

프레임워크/스택 무관 백엔드 공통 패턴.
NestJS, Express, Fastify 등 모든 Node.js 백엔드에 적용.

---

## 1. Thin Controller / Fat Service

Controller는 라우팅, 가드, 위임만. 비즈니스 로직은 Service에 집중.

> 코드 예시: `nestjs-architecture` 스킬 참조.

| Controller에 허용 | Service에 집중 |
|------------------|---------------|
| 라우트 데코레이터 (`@Get`, `@Post`) | DB 쿼리 (`prisma.*`) |
| 가드/데코레이터 (`@UseGuards`) | 조건부 로직 (`if`, `for`, `.map`) |
| 파라미터 추출 (`@Param`, `@Body`) | 에러 처리 (NotFoundException 등) |
| 서비스 메서드 호출 | 데이터 매핑/변환 |

---

## 2. DB Mapping 3-Layer

`DB (snake_case) → mapDbEntity() → Domain (camelCase) → mapToResponse() → DTO`

> 코드 예시: `nestjs-architecture` 스킬 참조.

- DB 레코드를 직접 API 응답으로 반환 금지
- snake_case → camelCase 변환은 매핑 함수에서 수행
- 계산 필드 (dayCount 등)는 `mapToResponse`에서 추가

---

## 3. Input Validation Boundary (입력 검증 경계)

모든 외부 입력은 Controller/API 경계에서 DTO/스키마로 검증 후 Service에 전달한다.

- **Trust Boundary**: Controller가 외부 입력의 신뢰 경계
- **Service는 검증된 데이터만 수신**: 내부에서 입력 형식 검증 불필요
- **DTO에 검증 데코레이터**: `class-validator`, Zod 등으로 선언적 검증

> 코드 예시: `nestjs-architecture` 스킬 참조.

- Service에서 입력 형식 검증 금지 — DTO가 처리
- Controller에서 수동 `if (!body.title)` 검증 금지 — DTO 데코레이터 사용
- 검증 없이 외부 입력을 DB 쿼리에 직접 사용 금지

---

## 금지 사항 요약

- Controller에 DB 쿼리 (`prisma.*`) 직접 호출 금지
- Controller에 반복문/조건부 비즈니스 로직 금지
- Raw SQL (`$queryRaw`, `$executeRaw`) 사용 금지 — ORM 쿼리 빌더 사용
- DB 레코드를 매핑 없이 API 응답으로 직접 반환 금지
- Service에서 입력 형식 검증 금지 — DTO 경계에서 처리
