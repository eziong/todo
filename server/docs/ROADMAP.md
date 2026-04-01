# NestJS Server — Migration Roadmap

> 모든 API 호출을 NestJS를 경유하도록 변경. Next.js는 순수 클라이언트로만 사용.
> 예외: Supabase Auth (login/signup)만 클라이언트에서 직접.

## Architecture

```
Browser → NestJS API (port 4000) → Supabase PostgreSQL (via Prisma)
Supabase Auth: Client-side only (login/signup)
```

## Phases

### Phase 1: Foundation (Scaffold + Auth + Prisma + Tags)
- [x] NestJS CLI scaffold (`server/`)
- [x] Dependencies: passport-jwt, prisma, class-validator, config
- [x] Prisma schema (all 23 tables from `docs/schema.sql`)
- [x] Common infra: guards, interceptors, filters, decorators
- [x] Auth module: Supabase JWT validation (HS256)
- [x] Prisma module: global PrismaClient lifecycle
- [x] Tags module: pattern validation CRUD (GET/POST/DELETE)
- [x] main.ts: global prefix, validation, CORS, port 4000
- [x] Build passes (`npm run build`)
- [x] Runtime DB connection (session pooler, IPv4)
- [x] Runtime verification: Auth guard (401), DTO validation (400), error handling (404/409/P2003)

### Phase 2: Core CRUD
- [x] Todos module (CRUD + status/priority + subtasks)
- [x] Projects module (CRUD + archive + todo stats)
- [x] Build Commands module (CRUD, nested under projects)
- [x] Inbox module (CRUD + process to todo/idea via transaction)
- [x] Activity log module (read-only)
- [x] Web HTTP client (`api-client.ts`, `api-error.ts`, `classifyError` ApiError support)
- [x] Web services migration: tags, todos, projects, inbox, activity, build-commands → NestJS API
- [x] Both builds pass (`server: npm run build`, `web: npm run build`)

### Phase 3: Feature Modules
- [x] Builds module (CRUD + auto build_number + idea linking via transaction)
- [x] Ideas module (CRUD + project join + build relation)
- [x] Notes module (CRUD + folders CRUD + search)
- [x] Links module (CRUD + description templates CRUD)
- [x] Contents module (CRUD + checklists CRUD + project/note joins + filters)
- [x] Web services migration: builds, ideas, notes, links, contents → NestJS API
- [x] Both builds pass (`server: npm run build`, `web: npm run build`)

### Phase 4: Integrations
- [x] Google OAuth module (auth-url, callback with state JWT, disconnect, status, save-tokens)
- [x] GoogleTokenService (shared token management: getValidAccessToken, saveTokens, revokeAccess)
- [x] GoogleConnectedGuard + @GoogleAccessToken() decorator
- [x] YouTube Data API module (channel stats with 30min cache, videos CRUD, comments, reply, resumable upload)
- [x] YouTube Analytics API module (monthly revenue)
- [x] Google Drive module (list, upload via Multer, get URL, delete)
- [x] Webhooks module (GitHub HMAC-SHA256, YouTube header secret, Build header secret → notifications)
- [x] Web services migration: google-auth, youtube, drive, revenue → NestJS API (`apiGet/apiPost/apiPatch`)
- [x] Web api-client.ts: added `apiUpload` for FormData (Drive file upload)
- [x] Web auth/callback: calls NestJS `/api/google/save-tokens` instead of direct Supabase
- [x] Deleted 18 old files: Next.js API routes (google/youtube/drive/webhooks) + lib/google
- [x] Both builds pass (`server: npm run build`, `web: npm run build`)

### Phase 5: Remaining Modules
- [x] Sponsorships module (CRUD + content relation + status/amount/dueDate)
- [x] Notifications module (list + unread-count + mark-read + mark-all-read + delete)
- [x] SNS module: accounts (CRUD + unique constraint) + reminders (CRUD + bulk create)
- [x] Assets module (CRUD + Supabase Storage upload/delete + Multer file upload)
- [x] Module registration (app.module.ts: 4 new modules)
- [x] Web services migration: sponsorships, notifications, sns-accounts, sns-reminders, assets → NestJS API
- [x] Web hook updated: useUploadToSupabase → uses server upload endpoint
- [x] Both builds pass (`server: npm run build`, `web: npm run build`)

### Phase 6: Frontend Migration — COMPLETE
- [x] Web HTTP client + ApiError classification
- [x] Core services migrated: tags, todos, projects, inbox, activity, build-commands
- [x] Feature services migrated: builds, ideas, notes, links, contents → NestJS API
- [x] Integration services migrated: google-auth, youtube, drive, revenue → NestJS API
- [x] Remaining services migrated: assets, sponsorships, notifications, sns → NestJS API
- [x] fetchTodoTags: server-side `GET /api/tags/todo/:todoId` endpoint added
- [x] All Supabase direct CRUD removed from frontend services (0 remaining)

## Key Patterns

### Auth Flow
```
Client → Bearer <supabase-jwt> → JwtAuthGuard
  → JwtStrategy validates (HS256, SUPABASE_JWT_SECRET)
  → payload.sub → AuthUser.id
  → @CurrentUser() injects into controller
  → Service: WHERE user_id = userId
```

### Module Structure
```
modules/{domain}/
  {domain}.module.ts
  {domain}.controller.ts    # thin: route + guard + delegate
  {domain}.service.ts       # fat: prisma + mapping + logic
  dto/
    create-{domain}.dto.ts  # class-validator
```

### DB Mapping (3-Layer)
```
Prisma (snake_case) → mapEntity() → Response (camelCase)
```

### Response Envelope
```json
{ "success": true, "data": {...}, "timestamp": "..." }
```

### Error Format
```json
{ "success": false, "error": { "statusCode": 404, "message": "..." }, "timestamp": "..." }
```
