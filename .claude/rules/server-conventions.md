---
globs:
  - "server/**/*.ts"
alwaysApply: false
---
> **Module: `nestjs`** — CLAUDE.md Active Modules에서 `nestjs`가 `[x]`일 때만 적용

## NestJS Module Structure
> 핵심 원칙 (Thin Controller, Fat Service)은 `backend-conventions.md` §1에 정의. 이 섹션은 NestJS 전용.
- Every feature: Module → Controller → Service → DTOs
- Controller = thin (routing, guards, delegation to service)
- Service = business logic (DB queries, validation, mapping)
- DTOs = validation boundary (class-validator on all inputs)

## DB Mapping (Three-Layer)
> 핵심 원칙은 `backend-conventions.md` §2에 정의.
- DB (snake_case) → `mapDbTrip()` → Domain (camelCase) → `mapToResponse()` → DTO

## Access Control (Three-Level RBAC)
- owner > editor > viewer
- `verifyAccess()` before read operations
- `verifyEditAccess()` before write operations

## Global Infrastructure
- ValidationPipe (whitelist, forbidNonWhitelisted, transform)
- TransformInterceptor (response envelope: `{ success, data, timestamp }`)
- HttpExceptionFilter for error formatting

## What NOT to Do
- No raw SQL — use Prisma query builder
- No enums — use string literal union types (`typescript-conventions.md` §3 참조)
- No business logic in controllers
- No direct DB access without mapping layer
