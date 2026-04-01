# Project

## Build & Run
```
mobile/  : npm start | npm run ios | npm run typecheck | npm test
server/  : npm run start:dev | npm run build | npm run prisma:studio
```

## Folder Convention (필수)

| 플랫폼 | 폴더 | 예시 |
|--------|------|------|
| 모바일 (Expo/RN) | `mobile/` | `mobile/src/components/`, `mobile/app/` |
| 웹 (Next.js, Vite) | `web/` | `web/src/components/`, `web/app/` |
| 서버 (NestJS) | `server/` | `server/src/modules/` |

- 새 프로젝트 생성 시 반드시 해당 폴더 아래에 생성
- `.claude/rules/` 글로브가 이 폴더 구조에 의존하므로 변경 금지

## Architecture
- **Monorepo**: `mobile/` (Expo SDK 54 + React Native) + `server/` (NestJS 10.3)
- **DB**: PostgreSQL via Supabase, Prisma ORM 5.8
- **Auth**: Supabase Auth (Apple, Google, Kakao OAuth) + Passport JWT
- **State**: TanStack React Query 5 (server) + Zustand 4 (client)
- **Styling**: NativeWind 2 (Tailwind CSS for RN), Pretendard font
- **Navigation**: Expo Router 6 (file-based routing)
- **i18n**: i18next — Korean (default), English, Japanese

## Key Paths
- Shared UI: `mobile/src/components/ui/`
- Feature components: `mobile/src/components/features/<domain>/`
- Hooks: `mobile/src/hooks/use<Domain>.ts`
- Services: `mobile/src/services/<domain>.ts`
- Types: `mobile/src/types/` (branded.ts, index.ts, budget.ts)
- Locales: `mobile/src/constants/locales/{ko,en,ja}.ts`
- Server modules: `server/src/modules/<domain>/`
- Migrations: `server/migrations/`

## Naming Conventions
- Components: PascalCase (`TripCard.tsx`)
- Hooks: camelCase with `use` prefix (`useTrips.ts`)
- Services: camelCase (`trips.ts`)
- Types: PascalCase for types, camelCase for properties
- Files: Container = route name, Presenter = `Feature.presenter.tsx`
- Callbacks: `on` prefix in props (`onPress`, `onDelete`)

## Project Creation

새 프로젝트(하위 폴더) 생성 시 반드시 공식 CLI 템플릿을 사용한다. 처음부터 수동으로 scaffolding 금지.

```bash
nvm use v24  # 모든 프로젝트 생성 전 실행
```

| 프로젝트 유형 | 명령어 |
|-------------|--------|
| React (Vite) | `npm create vite@latest {name} -- --template react-ts` |
| Next.js | `npx create-next-app@latest {name}` |
| Expo (React Native) | `npx create-expo-app@latest {name}` |
| NestJS | `npx @nestjs/cli new {name}` |
| Node.js (plain) | `npm init -y` |

- 템플릿 생성 후 프로젝트 컨벤션에 맞게 설정 조정 (ESLint, Prettier, tsconfig 등)
- CRA(`create-react-app`)는 deprecated — Vite 또는 Next.js 사용

## Active Modules

> `.claude/rules/` 내 조건부 규칙의 활성화 여부를 제어합니다.
> `[x]` 체크된 모듈만 적용. `[ ]` 모듈은 규칙 파일이 로딩되어도 무시.
> 활성화 변경: 아래 체크박스를 `[x]`/`[ ]`로 토글.
>
> **⛔ HARD RULE**: `[ ]` 비활성 모듈의 프레임워크/기술로 프로젝트 생성·구현 절대 금지.
> 계획(plan) 승인은 이 설정을 오버라이드하지 않음. 충돌 시 반드시 사용자에게 먼저 확인.

### Core (체크 불필요 — `.ts`/`.tsx`/`.jsx` 편집 시 항상 자동 로딩)
- `quality-protocol` — 품질 프로토콜, Structured Workflow, Zero Tolerance (`vibe-coding.md`)
- `react` — React 공통: Container-Presenter, useEffect, onClose, 컴포넌트 분리 (`react-component-patterns.md`, `react-functional-patterns.md`)
- `react-data` — React 공통: React Query, Query Key Factory, 4-Layer State, Error Handling (`react-data-patterns.md`)
- `zustand` — Zustand 공통: Selective Subscription, Screen Store Factory (`zustand-conventions.md`)
- `typescript` — TypeScript 공통: Branded Types, 4-Tier Type System, Union over Enums (`typescript-conventions.md`)
- `frontend` — 프론트엔드 공통: Token Refresh, Destructive Actions, Toast/Dialog, Form, i18n (`frontend-conventions.md`)
- `backend` — 백엔드 공통: Thin Controller, DB Mapping, Input Validation (`backend-conventions.md`)

### Frontend Framework (프로젝트에 해당하는 프레임워크만 `[x]`)
- [x] `react-native` — Expo/RN 모바일 컨벤션, UI 패턴 (`mobile-conventions.md`, `ui-patterns.md`) + 통합 스킬 (딥링크, 푸시, 업로드, 실시간)
- [x] `nextjs` — Next.js App Router, Server/Client Components, Server Actions
- [x] `web-ui` — 웹 UI 패턴: shadcn/ui, Radix, Dialog, Toast, Dark Mode

### Backend (프로젝트에 해당하는 프레임워크만 `[x]`)
- [x] `nestjs` — NestJS 모듈 아키텍처 (`server-conventions.md`)
- [ ] `rbac` — Role-Based Access Control 가드 패턴

## Conventions
Detailed conventions are in `.claude/rules/` (module-scoped, controlled by Active Modules above).
Workflow skills are in `.claude/skills/` (auto-activated or user-invocable).

### User-Invocable Skills
- `/verify` — 구현 후 품질 검증
- `/audit` — 프로젝트 전체 일관성 검사
- `/convention-check` — 컨벤션 규칙 준수 검사
- `/review` — 외부 벤치마크 기반 리뷰 (read-only)
- `/v0-import` — v0.dev 코드 임포트 + 컨벤션 변환 (비주얼 100% 보존)
