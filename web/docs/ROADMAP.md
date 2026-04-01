# Personal Command Center - Implementation Roadmap

> 솔로 크리에이터+개발자를 위한 통합 커맨드 센터.
> YouTube 채널 관리, 개인 앱 프로젝트, 콘텐츠 파이프라인, 생산성을 한 곳에서.

**Tech Stack**: Next.js 16 + NestJS 11 API (port 4000) + Supabase (Auth + PostgreSQL + Storage) + Prisma 6 + React Query 5 + Zustand + shadcn/ui + Tailwind CSS v4

**External APIs**: YouTube Data API v3, YouTube Analytics API, Google Drive API

## Design Philosophy

```
Surface  — 각 도메인의 핵심 정보를 한 화면에
Act      — 빠른 액션 (답글, 태스크 생성, 상태 변경)
Link out — 복잡한 작업은 전문 도구로 (YouTube Studio, GitHub, AdSense)
Track    — 전체 히스토리와 진행 상황 기록
```

YouTube Studio를 **대체**하는 것이 아니라, 흩어진 정보를 **내 워크플로우에 통합**하는 것.

## Domain Map (9개 도메인)

| # | Domain | 핵심 가치 | Phase |
|---|--------|----------|-------|
| 1 | Productivity | 할 일, 인박스, 대시보드 | 0-4 ✅ |
| 2 | Projects | 개인 앱 관리, 빌드/배포, 아이디어 | 2,5 ✅ |
| 3 | Notes | 리서치, 기획, 지식 베이스 | 6 |
| 4 | Content Pipeline | 영상 기획 → 제작 → 업로드 전 과정 추적 | 7 |
| 5 | YouTube | 채널 요약, 영상 관리, 댓글, 예약 공개 | 8 |
| 6 | Assets | 썸네일/사진 (Supabase Storage) + 영상 (Google Drive) | 9 |
| 7 | Links | 제휴 링크, 설명 템플릿, link-in-bio | 10 |
| 8 | Revenue | 월별 수익 요약 + 스폰서십 계약 | 11 |
| 9 | Notifications | 통합 알림 허브 (YouTube, GitHub, Builds) | 12 |

## Architecture Evolution

```
Phase 0-5 (초기):
  Browser → Supabase (직접, 서버 없음)

Phase 6+ (마이그레이션 완료 — 현재):
  Browser → NestJS API (port 4000) → Prisma → Supabase PostgreSQL
  Auth: Supabase Auth (client-side only)
  Storage: Supabase Storage (소형) + Google Drive (대형)
  Google APIs: NestJS에서 직접 호출 (YouTube, Drive, Analytics)
  Webhooks: NestJS에서 수신 (YouTube, GitHub, CI/CD)
```

> **Note**: NestJS 마이그레이션 Phase 1-6 완료 (server/docs/ROADMAP.md 참조).
> 프론트엔드의 모든 Supabase 직접 DB 호출이 NestJS API로 전환됨.
> Next.js API Routes는 더 이상 사용하지 않음 (삭제 완료).

### 인프라 현황

| 항목 | 상태 |
|------|------|
| Server | NestJS 11 (port 4000, global prefix `/api`) |
| Auth | Supabase Auth (JWT) → NestJS Passport JWT 검증 |
| Google OAuth scope | `email`, `profile`, `youtube`, `youtube.upload`, `youtube.readonly`, `drive.file`, `yt-analytics.readonly` |
| Storage | Supabase Storage (소형) + Google Drive (대형) |
| Webhooks | YouTube, GitHub, CI/CD (NestJS에서 수신) |
| DB Tables | ~24개 (Prisma schema) |

### Route Structure (Phase 12 완료 — 현재)

```
app/
  (auth)/login/page.tsx
  (app)/
    page.tsx                      # Dashboard (/)
    inbox/page.tsx                # Inbox
    tasks/page.tsx                # All Tasks
    projects/page.tsx             # Projects list
    projects/[id]/page.tsx        # Project detail
    builds/page.tsx               # Builds & Ideas
    notes/page.tsx                # Notes list
    notes/[id]/page.tsx           # Note editor
    content/page.tsx              # Content pipeline
    content/[id]/page.tsx         # Content detail
    content/calendar/page.tsx     # Content calendar
    youtube/page.tsx              # YouTube dashboard
    youtube/videos/page.tsx       # Video management
    youtube/comments/page.tsx     # Comment management
    assets/page.tsx               # Asset browser
    links/page.tsx                # Link management
    revenue/page.tsx              # Revenue dashboard
    notifications/page.tsx        # Notification hub
    sns/page.tsx                  # SNS accounts & reminders
    settings/page.tsx             # Settings
  api/                            # (비어있음 — NestJS로 전환 완료)
```

> API Routes (`app/api/`)는 NestJS 서버(`server/`)로 완전 마이그레이션되어 삭제됨.

## Architecture Decision: SPA → App Router Routes (완료)

SPA 패턴 (`useState<ViewType>`) → **Next.js App Router 라우트**로 전환 완료.

**이유**: 딥 링킹(`/tasks` 북마크), 자동 코드 스플리팅, 브라우저 뒤로가기/앞으로가기, `/projects/[id]` 동적 라우트 필요.

---

## Phase 0: Foundation

> Auth, Supabase, React Query, Zustand, route conversion

- [x] Install dependencies (`@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`, `zustand`)
- [x] Create Supabase clients (`client.ts`, `server.ts`, `middleware.ts`)
- [x] Create type system (`branded.ts`, `database.ts`, `domain.ts`)
- [x] Create React Query infra (`queryClient.ts`, `queryKeys.ts`, `errors.ts`)
- [x] Create Zustand app store (`app-store.ts`)
- [x] Create providers (`query-provider.tsx`, `auth-provider.tsx`)
- [x] Convert SPA → App Router routes (route group structure)
- [x] Update sidebar (`<Link>` + `usePathname()`)
- [x] Update command palette (`router.push()`)
- [x] Update root layout (providers wrapping)
- [x] Build verification (`npm run build` pass)

### New Files (19)

| # | File | Role |
|---|------|------|
| 1 | `src/lib/supabase/client.ts` | Browser Supabase client (`createBrowserClient`) |
| 2 | `src/lib/supabase/server.ts` | Server-side client (RSC) |
| 3 | `src/lib/supabase/middleware.ts` | Session refresh helper |
| 4 | `src/types/branded.ts` | Branded type factories (`TodoId`, `ProjectId`, etc.) |
| 5 | `src/types/database.ts` | Raw DB row types (snake_case) |
| 6 | `src/types/domain.ts` | Domain types (camelCase, branded IDs) |
| 7 | `src/lib/queryClient.ts` | QueryClient config |
| 8 | `src/lib/queryKeys.ts` | Query key factory |
| 9 | `src/lib/errors.ts` | `classifyError()`, `handleMutationError()` |
| 10 | `src/stores/app-store.ts` | Global Zustand: sidebarCollapsed, commandOpen |
| 11 | `src/components/providers/query-provider.tsx` | QueryClientProvider wrapper |
| 12 | `src/components/providers/auth-provider.tsx` | Auth context |
| 13 | `app/(auth)/login/page.tsx` | Login page |
| 14 | `app/(app)/layout.tsx` | App Shell: auth guard + sidebar + command palette |
| 15 | `app/(app)/page.tsx` | Dashboard route (placeholder) |
| 16 | `app/(app)/inbox/page.tsx` | Inbox route container |
| 17 | `app/(app)/tasks/page.tsx` | Tasks route container |
| 18 | `app/(app)/builds/page.tsx` | Builds route container |
| 19 | `app/(app)/settings/page.tsx` | Settings route container |

### Modified Files (6)

| # | File | Change |
|---|------|--------|
| 1 | `package.json` | Add 4 dependencies |
| 2 | `app/layout.tsx` | Wrap with QueryProvider, ThemeProvider, Toaster |
| 3 | `app/page.tsx` | Redirect to `/(app)` |
| 4 | `src/types/index.ts` | Re-export new type files |
| 5 | `src/components/layout/app-sidebar.tsx` | `<Link>` + `usePathname()` |
| 6 | `src/components/layout/command-palette.tsx` | `router.push()` navigation |

---

## Phase 1: Tasks -- Core Feature ✅

> **Depends on**: Phase 0

- [x] Create `src/services/todos.ts` — Todo CRUD + `mapTodoRow()`, `mapTodoRowWithProject()`
- [x] Create `src/hooks/useTodos.ts` — `useTodos(filters)`, create/update/delete with optimistic updates
- [x] Create `src/hooks/useTodo.ts` — `useTodo(id)` with placeholderData + subtasks + tags
- [x] Create `src/components/features/tasks/tasks-skeleton.tsx` — Task list skeleton
- [x] Create `src/components/features/tasks/task-empty-state.tsx` — Empty state
- [x] Create `src/services/tags.ts` — Tag CRUD + fetchTodoTags
- [x] Modify `app/(app)/tasks/page.tsx` — Container: useTodos() → loading/error/empty → Presenter
- [x] Modify `src/components/features/tasks/tasks-content.tsx` — Props-based, date grouping, remove hardcoded data
- [x] Modify `src/components/features/tasks/task-detail-panel.tsx` — useTodo() query, edit mutations, key-based reset
- [x] Modify `src/types/domain.ts` — TodoWithProject view type
- [x] Build verification (`npm run build` pass)

**Key Patterns**: Optimistic update (checkbox, status), Container-Presenter, key prop for task switch, Subtask via parent_id, date grouping (Overdue/Today/Tomorrow/This Week/Later/No Date/Completed)

---

## Phase 2: Projects ✅

> **Depends on**: Phase 1

- [x] Create `src/services/projects.ts` — Project CRUD + `mapProjectRow()` + todo count join
- [x] Create `src/hooks/useProjects.ts` — `useProjects()`, create/update/delete with optimistic updates
- [x] Create `src/hooks/useProject.ts` — `useProject(id)` with placeholderData from list cache
- [x] Create `app/(app)/projects/page.tsx` — Container: useProjects → loading/error/empty → ProjectsContent
- [x] Create `app/(app)/projects/[id]/page.tsx` — Container: useProject + useTodos(projectId) → ProjectDetailContent
- [x] Create `src/components/features/projects/projects-content.tsx` — Project card grid with menu (edit/archive/delete)
- [x] Create `src/components/features/projects/project-detail-content.tsx` — Project header + filtered task list + TaskDetailPanel
- [x] Create `src/components/features/projects/project-form-dialog.tsx` — Create/edit dialog (shadcn Dialog + color picker)
- [x] Create `src/components/features/projects/projects-skeleton.tsx` — Grid skeleton
- [x] Modify `src/components/layout/app-sidebar.tsx` — `useProjects(false)` + `<Link>` for real project data
- [x] Modify `src/types/domain.ts` — `ProjectWithStats` view type
- [x] Build verification (`npm run build` pass — 9 routes including /projects, /projects/[id])

**Key Patterns**: ProjectWithStats (todo count join), Card grid layout, Project form dialog (shadcn Dialog + color picker), Project detail reuses TaskDetailPanel, Sidebar real data via useProjects()

---

## Phase 3: Inbox ✅

> **Depends on**: Phase 1, 2

- [x] Create `src/services/inbox.ts` — Inbox CRUD + `processInboxItem()` (creates todo + marks processed)
- [x] Create `src/hooks/useInbox.ts` — `useInbox()`, create/process/delete with optimistic updates
- [x] Create `src/components/features/inbox/inbox-skeleton.tsx` — List skeleton
- [x] Modify `app/(app)/inbox/page.tsx` — Container: useInbox → loading/error → InboxContent
- [x] Modify `src/components/features/inbox/inbox-content.tsx` — Props-based Presenter, remove hardcoded mock data
- [x] domain.ts types already existed (InboxItem, CreateInboxItemInput, ProcessInboxItemInput)
- [x] Build verification (`npm run build` pass — 9 routes)

**Key Patterns**: Process to Todo (create todo + mark processed in 2-step), Textarea quick capture (Enter to add, Shift+Enter newline), Optimistic process/delete, formatTimeAgo relative time

---

## Phase 4: Dashboard ✅

> **Depends on**: Phase 1, 2, 3

- [x] Create `src/services/activity.ts` — `mapActivityLogRow()` + `fetchRecentActivity(limit)`
- [x] Create `src/hooks/useDashboard.ts` — Parallel queries (useTodos + useInbox + useProjects + activity) + date-based derivation
- [x] Create `src/components/features/dashboard/dashboard-skeleton.tsx` — Dashboard skeleton
- [x] Modify `app/(app)/page.tsx` — Container: useDashboard() → loading/error → DashboardContent
- [x] Modify `src/components/features/dashboard/dashboard-content.tsx` — Props-based Presenter, real data, Link navigation
- [x] Build verification (`npm run build` pass — 9 routes)

**Key Patterns**: Parallel queries via multiple hooks, client-side date filtering (today/tomorrow/this week), time-based greeting, activity log with icon mapping, Container-Presenter with `useUpdateTodo` for task toggle

---

## Phase 5: Builds & Ideas ✅

> **Depends on**: Phase 2

- [x] Create `src/services/builds.ts` — Build CRUD + junction table join for ideas + auto-increment build_number
- [x] Create `src/services/ideas.ts` — Ideas CRUD + project join
- [x] Create `src/services/build-commands.ts` — Build commands fetch per project
- [x] Create `src/hooks/useBuilds.ts` — `useBuilds()`, create/delete with optimistic updates
- [x] Create `src/hooks/useIdeas.ts` — `useIdeas()`, create/update/delete with optimistic updates
- [x] Create `src/components/features/ideas/ideas-content.tsx` — Ideas list with status filter + CRUD
- [x] Create `src/components/features/builds/builds-skeleton.tsx` — Skeleton
- [x] Modify `app/(app)/builds/page.tsx` — Container: useBuilds + useIdeas + useProjects → BuildsContent
- [x] Modify `src/components/features/builds/builds-content.tsx` — Props-based Presenter with Builds/Ideas tabs
- [x] Modify `src/components/features/builds/new-build-modal.tsx` — Real project/ideas data, form reset
- [x] Modify `src/types/domain.ts` — BuildWithIdeas, IdeaWithProject, CreateBuildInput, CreateIdeaInput, UpdateIdeaInput
- [x] Build verification (`npm run build` pass — 9 routes)

**Key Patterns**: Supabase junction table joins (build_ideas), auto-increment build_number, idea-build linking (status update to 'planned'), Builds/Ideas tabs, status filter (all/new/considering/planned/implemented/rejected), expandable build cards with terminal log

---

---
---

# Phase 6~12: 확장 로드맵

> Phase 0~5 완료 기반 위에 9개 도메인 확장

---

## Phase 6: Notes & Links (지식 베이스 + 링크 관리)

> **Depends on**: Phase 0 | **External API**: 없음 (Supabase only)

Inbox가 "빠른 캡처"라면, Notes는 "정리된 지식". 리서치, 기획, 레퍼런스를 구조화.
Links는 크리에이터 필수 — 제휴 링크 세트, 영상 설명 템플릿 관리.

### DB Tables (4개 신규)

```sql
-- Notes
create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  folder_id   uuid references note_folders(id) on delete set null,
  title       text not null,
  content     text,                    -- Markdown
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table note_folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  parent_id   uuid references note_folders(id) on delete cascade,
  position    integer,
  created_at  timestamptz not null default now()
);

-- Links
create table links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  url         text not null,
  category    text,                    -- 'affiliate' | 'social' | 'resource' | 'other'
  click_count integer not null default 0,
  position    integer,
  created_at  timestamptz not null default now()
);

create table description_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  content     text not null,           -- Markdown with {{link}} placeholders
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

### Features

| Feature | 설명 |
|---------|------|
| Notes CRUD | 마크다운 에디터, 폴더 구조, 핀 고정 |
| Note Folders | 계층형 폴더, 드래그 정렬 |
| Links CRUD | 제휴/소셜/리소스 카테고리별 관리 |
| Description Templates | 영상 설명용 템플릿 (링크 플레이스홀더 지원) |
| Link-in-bio 뷰 | 공개 링크 페이지 (선택적) |

### Routes & Files

```
app/(app)/notes/page.tsx              # Notes list + folder sidebar
app/(app)/notes/[id]/page.tsx         # Note editor
app/(app)/links/page.tsx              # Links + templates
src/services/notes.ts
src/services/links.ts
src/hooks/useNotes.ts
src/hooks/useLinks.ts
src/components/features/notes/        # notes-content, note-editor, notes-skeleton
src/components/features/links/        # links-content, template-editor, links-skeleton
```

### Checklist

- [x] DB migration (notes, note_folders, links, description_templates + RLS)
- [x] Types (domain.ts, database.ts, branded.ts)
- [x] Services (notes.ts, links.ts)
- [x] Hooks (useNotes.ts, useNoteFolders.ts, useLinks.ts, useDescriptionTemplates.ts)
- [x] UI: Notes list + markdown editor (react-markdown + remark-gfm)
- [x] UI: Links management + template editor
- [x] Sidebar navigation 업데이트 (FileText, Link2 icons)
- [x] Build verification (11 routes: +/notes, /notes/[id], /links)

---

## Phase 7: Content Pipeline (콘텐츠 파이프라인)

> **Depends on**: Phase 2 (Projects), Phase 6 (Notes) | **External API**: 없음

영상 하나의 전체 라이프사이클을 추적: 아이디어 → 리서치 → 대본 → 촬영 → 편집 → 썸네일 → 업로드 → 홍보.
Phase 8 (YouTube)에서 업로드 연동, Phase 9 (Assets)에서 파일 연결.

### DB Tables (2개 신규)

```sql
create table contents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  project_id      uuid references projects(id) on delete set null,
  title           text not null,
  description     text,
  type            text not null default 'video'
    check (type in ('video', 'short', 'post', 'blog')),
  stage           text not null default 'idea'
    check (stage in ('idea', 'research', 'script', 'filming', 'editing', 'thumbnail', 'upload_ready', 'published', 'promoting')),
  platform        text not null default 'youtube'
    check (platform in ('youtube', 'instagram', 'twitter', 'blog', 'other')),
  note_id         uuid references notes(id) on delete set null,     -- 연결된 스크립트/리서치 노트
  youtube_video_id text,                                             -- Phase 8에서 연결
  scheduled_at    timestamptz,                                       -- 예약 공개 시각
  published_at    timestamptz,
  template_id     uuid references description_templates(id) on delete set null,
  tags            text[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table content_checklists (
  id          uuid primary key default gen_random_uuid(),
  content_id  uuid not null references contents(id) on delete cascade,
  label       text not null,
  checked     boolean not null default false,
  position    integer
);
```

### Features

| Feature | 설명 |
|---------|------|
| Content CRUD | 콘텐츠 카드 생성, 스테이지 전환 (칸반 or 리스트) |
| Pipeline Board | 스테이지별 칸반 뷰 (idea → ... → published) |
| Content Calendar | 월간/주간 캘린더에 콘텐츠 배치 |
| Stage Checklist | 스테이지별 체크리스트 (예: 편집 단계 → "색보정", "자막", "BGM") |
| Note 연결 | 콘텐츠에 스크립트/리서치 노트 연결 |
| Template 연결 | 업로드 시 사용할 설명 템플릿 선택 |

### Routes & Files

```
app/(app)/content/page.tsx            # Pipeline board (kanban)
app/(app)/content/[id]/page.tsx       # Content detail
app/(app)/content/calendar/page.tsx   # Calendar view
src/services/contents.ts
src/hooks/useContents.ts
src/components/features/content/      # pipeline-board, content-detail, content-calendar, content-skeleton
```

### Checklist

- [x] DB migration (contents, content_checklists + RLS)
- [x] Types
- [x] Services + Hooks
- [x] UI: Pipeline kanban board (DropdownMenu stage transitions)
- [x] UI: Content detail (checklist, linked note, metadata)
- [x] UI: Content calendar (month view)
- [x] Sidebar navigation 업데이트
- [x] Build verification

---

## Phase 8: YouTube Integration (서버 + Google API)

> **Depends on**: Phase 7 (Content Pipeline) | **External API**: YouTube Data API v3, YouTube Analytics API

이 Phase에서 **서버 사이드 코드가 처음 도입**됨. Next.js API Routes로 Google API 호출.
YouTube Studio를 대체하지 않고, 핵심 액션(업로드, 댓글 답글, 통계 확인)을 커맨드 센터 안에서 수행.

### 인프라 변경

```
1. Google OAuth scope 확장 (Supabase Auth 설정)
2. Next.js API Routes 생성 (토큰 관리 + YouTube API 프록시)
3. Provider token 서버사이드 관리
```

### DB Tables (1개 신규)

```sql
-- YouTube 채널 정보 캐시 (API 호출 최소화)
create table youtube_channels (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade unique,
  channel_id      text not null,           -- YouTube channel ID
  channel_title   text,
  subscriber_count integer,
  video_count     integer,
  view_count      bigint,
  thumbnail_url   text,
  synced_at       timestamptz not null default now()
);
```

### API Routes

```
app/api/google/callback/route.ts     # OAuth 콜백 + 토큰 저장
app/api/google/refresh/route.ts      # Access token 갱신
app/api/youtube/channel/route.ts     # GET: 채널 통계
app/api/youtube/videos/route.ts      # GET: 영상 목록 / POST: 메타데이터 수정
app/api/youtube/upload/route.ts      # POST: Resumable upload 시작
app/api/youtube/comments/route.ts    # GET: 댓글 / POST: 답글
app/api/youtube/schedule/route.ts    # POST: 예약 공개 설정
app/api/webhooks/youtube/route.ts    # YouTube push notification 수신
src/lib/google/                      # Google API 헬퍼 (token, youtube-client)
```

### Features

| Feature | 설명 | 서버? |
|---------|------|------|
| 채널 대시보드 | 구독자, 총 조회수, 최근 영상 성과 | API Route |
| 영상 목록 | 내 채널 영상 조회/검색 | API Route |
| 영상 업로드 | Resumable upload (대용량 지원) | API Route |
| 메타데이터 편집 | 제목, 설명, 태그, 카테고리 수정 | API Route |
| 썸네일 설정 | 커스텀 썸네일 업로드 | API Route |
| 예약 공개 | 특정 시간에 공개 (privacyStatus → scheduled) | API Route + Cron |
| 댓글 알림 | 미답변 댓글 표시 + 빠른 답글 | API Route |
| Content 연결 | 업로드된 영상 → Content Pipeline의 youtube_video_id | Client |

### Routes & Files

```
app/(app)/youtube/page.tsx            # YouTube dashboard (channel stats)
app/(app)/youtube/videos/page.tsx     # Video list + upload
app/(app)/youtube/comments/page.tsx   # Comment management
src/services/youtube.ts               # YouTube API 클라이언트 (API Routes 호출)
src/hooks/useYouTube.ts
src/components/features/youtube/      # youtube-dashboard, video-list, comment-list, upload-dialog
```

### Checklist

- [ ] Google Cloud Console: YouTube Data API v3 + Analytics API 활성화
- [ ] Supabase Auth: Google provider OAuth scope 확장
- [x] DB migration (google_tokens, youtube_channels + RLS) — `docs/phase8-migration.sql`
- [x] API Routes: OAuth 토큰 관리 (auth-url, callback, disconnect)
- [x] API Routes: YouTube API 프록시 (channel, videos, videos/[id], comments, comments/reply, upload)
- [x] Types + Services + Hooks
- [x] UI: YouTube dashboard
- [x] UI: Video list + upload dialog
- [x] UI: Comment management (미답변 필터 + 빠른 답글)
- [x] Content Pipeline 연동 (youtube_video_id 연결)
- [x] Sidebar navigation 업데이트
- [x] Build verification

---

## Phase 9: Assets & Storage (에셋 관리)

> **Depends on**: Phase 8 (YouTube/Google OAuth) | **External API**: Google Drive API

썸네일/사진은 Supabase Storage (빠름, 간단), 영상 원본은 Google Drive (대용량, 무료 15GB).

### DB Tables (1개 신규)

```sql
create table assets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content_id    uuid references contents(id) on delete set null,
  project_id    uuid references projects(id) on delete set null,
  filename      text not null,
  mime_type     text not null,
  size_bytes    bigint not null,
  storage_type  text not null check (storage_type in ('supabase', 'google_drive')),
  storage_path  text not null,           -- Supabase: bucket/path, Drive: fileId
  thumbnail_url text,                    -- 프리뷰 URL
  tags          text[],
  created_at    timestamptz not null default now()
);
```

### API Routes

```
app/api/drive/files/route.ts         # GET: 파일 목록 / POST: 업로드
app/api/drive/files/[id]/route.ts    # GET: 다운로드 / DELETE
```

### Features

| Feature | 설명 |
|---------|------|
| 에셋 브라우저 | 그리드/리스트 뷰, 타입별 필터 (image/video/document) |
| Supabase 업로드 | 썸네일, 사진, 소형 파일 드래그앤드롭 |
| Google Drive 업로드 | 영상 원본, 대용량 파일 |
| Content 연결 | 에셋 → 콘텐츠에 연결 (썸네일, 소스 파일) |
| Project 연결 | 에셋 → 프로젝트에 연결 (앱 스크린샷 등) |

### Routes & Files

```
app/(app)/assets/page.tsx
src/services/assets.ts
src/services/drive.ts                 # Google Drive API 클라이언트
src/hooks/useAssets.ts
src/components/features/assets/       # asset-browser, upload-zone, asset-detail
```

### Checklist

- [ ] Supabase Storage: 버킷 생성 (thumbnails, images)
- [ ] Google Cloud Console: Drive API 활성화
- [x] DB migration (assets + RLS) — `docs/phase9-migration.sql` + `docs/schema.sql`
- [x] Infrastructure: OAuth scope + next.config.mjs 이미지 도메인 추가
- [x] API Routes: Google Drive 프록시 (files, files/[id])
- [x] Types (AssetId, AssetRow, Asset, DriveFile, filters)
- [x] Services (assets.ts, drive.ts) + Query keys
- [x] Hooks (useAssets, useUploadToSupabase, useUploadToDrive, useDriveFiles)
- [x] UI: Asset browser (grid/list, type filter, storage filter, search)
- [x] UI: Upload zone (drag & drop, Supabase/Drive 자동 라우팅)
- [x] UI: Asset detail dialog (preview, metadata, tags, delete)
- [x] Sidebar navigation 업데이트 (Image icon)
- [x] Build verification

---

## Phase 10: Revenue (수익 관리)

> **Depends on**: Phase 8 (YouTube Analytics API) | **External API**: YouTube Analytics API

전체 수익 시스템이 아닌 **요약 대시보드**. AdSense 상세는 Google AdSense에 위임.

### DB Tables (1개 신규)

```sql
create table sponsorships (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content_id    uuid references contents(id) on delete set null,
  brand         text not null,
  amount        decimal(10,2) not null,
  currency      text not null default 'KRW',
  status        text not null default 'negotiating'
    check (status in ('negotiating', 'confirmed', 'delivered', 'paid', 'cancelled')),
  contact_info  text,
  notes         text,
  due_date      date,
  paid_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

### API Routes

```
app/api/youtube/analytics/route.ts   # GET: 월별 수익/조회수 요약
app/api/cron/analytics-sync/route.ts # Cron: 주기적 분석 데이터 동기화
```

### Features

| Feature | 설명 |
|---------|------|
| YouTube 수익 요약 | 월별 광고 수익, 조회수, 시청 시간 (Analytics API) |
| 스폰서십 관리 | 브랜드, 금액, 상태, 콘텐츠 연결 (CRUD) |
| 수익 대시보드 | 월별 총 수익 (광고 + 스폰서), 트렌드 차트 |

### Routes & Files

```
app/(app)/revenue/page.tsx
src/services/revenue.ts
src/services/sponsorships.ts
src/hooks/useRevenue.ts
src/components/features/revenue/     # revenue-dashboard, sponsorship-list, revenue-chart
```

### Checklist

- [x] DB migration (sponsorships + RLS)
- [x] API Routes: YouTube Analytics 프록시
- [x] Types + Services + Hooks
- [x] UI: Revenue dashboard (chart + summary)
- [x] UI: Sponsorship CRUD
- [x] Build verification

---

## Phase 11: Notifications Hub (통합 알림)

> **Depends on**: Phase 8 (YouTube webhooks), Phase 5 (Builds) | **External API**: YouTube Push, GitHub Webhooks

외부에서 들어오는 모든 알림을 한 곳에서. Inbox(내가 만든 것)와 다름 — 알림은 **외부에서 오는 것**.

### DB Tables (1개 신규)

```sql
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  source      text not null check (source in ('youtube', 'github', 'build', 'system')),
  type        text not null,             -- 'new_comment', 'subscriber_milestone', 'build_success', etc.
  title       text not null,
  body        text,
  url         text,                      -- 딥링크 (YouTube 댓글 URL, GitHub PR URL 등)
  entity_id   text,                      -- 관련 엔티티 ID
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
```

### Webhook Routes

```
app/api/webhooks/youtube/route.ts    # YouTube push notifications (댓글, 구독자)
app/api/webhooks/github/route.ts     # GitHub events (PR, issue, push)
app/api/webhooks/builds/route.ts     # CI/CD 빌드 상태 (GitHub Actions)
```

### Features

| Feature | 설명 |
|---------|------|
| 알림 센터 | 전체/읽지 않은 알림 리스트, 소스별 필터 |
| 실시간 알림 | Supabase Realtime으로 새 알림 수신 |
| 빠른 액션 | 알림에서 바로 댓글 답글, PR 확인 등 |
| 알림 배지 | 사이드바/헤더에 읽지 않은 알림 수 표시 |
| Build webhook | CI/CD에서 빌드 결과 수신 → builds 테이블 업데이트 |

### Routes & Files

```
app/(app)/notifications/page.tsx
src/services/notifications.ts
src/hooks/useNotifications.ts
src/components/features/notifications/  # notification-list, notification-item, notification-skeleton
```

### Checklist

- [x] DB migration (notifications + RLS)
- [x] Webhook Routes: YouTube, GitHub, Builds
- [x] Supabase Realtime: notifications 테이블 구독
- [x] Types + Services + Hooks
- [x] UI: Notification center (list + filter)
- [x] UI: Sidebar 알림 배지
- [x] Builds 테이블 webhook 연동 (status 업데이트)
- [x] Build verification

---

## Phase 12: SNS Reminders (SNS 리마인더)

> **Depends on**: Phase 7 (Content Pipeline) | **External API**: 없음

자동 포스팅이 아닌 **리마인더 + 템플릿** 방식. 자동 게시는 Buffer 등 전문 도구에 위임.

### DB Tables (2개 신규)

```sql
create table sns_accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  platform    text not null check (platform in ('twitter', 'instagram', 'threads', 'tiktok', 'other')),
  handle      text not null,
  profile_url text,
  created_at  timestamptz not null default now()
);

create table sns_reminders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content_id    uuid references contents(id) on delete cascade,
  platform      text not null,
  scheduled_at  timestamptz not null,
  template_text text,                    -- 미리 작성한 포스팅 텍스트
  status        text not null default 'pending'
    check (status in ('pending', 'reminded', 'done', 'skipped')),
  created_at    timestamptz not null default now()
);
```

### Features

| Feature | 설명 |
|---------|------|
| SNS 계정 관리 | 플랫폼별 계정/핸들 등록 |
| 포스팅 리마인더 | "YouTube 업로드 완료 → Twitter에 공유하세요" |
| 템플릿 텍스트 | 복사해서 붙여넣기할 포스팅 텍스트 미리 작성 |
| Content 연동 | 콘텐츠 'published' 스테이지 → 자동 리마인더 생성 |

### Checklist

- [x] DB migration (sns_accounts, sns_reminders + RLS)
- [x] Types + Services + Hooks
- [x] UI: SNS accounts management (Settings > Integrations에 통합)
- [x] UI: Reminder list with template copy + filter chips
- [x] Content Pipeline 연동 (published → auto-create reminders)
- [x] Sidebar navigation 업데이트 (Share2 icon)
- [x] Build verification

---
---

## Summary

| Phase | Domain | New Tables | Key Outcome | External API |
|-------|--------|-----------|-------------|-------------|
| 0 Foundation | Infra | 0 | Auth, Supabase, routing | - |
| 1 Tasks | Productivity | 0 | Task CRUD | - |
| 2 Projects | Projects | 0 | Project CRUD | - |
| 3 Inbox | Productivity | 0 | Quick capture | - |
| 4 Dashboard | Productivity | 0 | Aggregated view | - |
| 5 Builds & Ideas | Projects | 0 | Build tracking | - |
| **6 Notes & Links** | **Notes, Links** | **4** | **Knowledge base + link management** | **-** |
| **7 Content Pipeline** | **Content** | **2** | **Video lifecycle tracking** | **-** |
| **8 YouTube** | **YouTube** | **1** | **Channel management + upload** | **YouTube Data v3, Analytics** |
| **9 Assets** | **Assets** | **1** | **File management (Supabase + Drive)** | **Google Drive** |
| **10 Revenue** | **Revenue** | **1** | **Income tracking** | **YouTube Analytics** |
| **11 Notifications** | **Notifications** | **1** | **Unified alert hub** | **YouTube/GitHub Webhooks** |
| **12 SNS Reminders** | **SNS** | **2** | **Cross-platform reminders** | **-** |
| **Total** | **9 Domains** | **~23 tables** | | |

## Verification (per Phase)

1. `npm run build` -- TypeScript error-free
2. `npm run dev` -- Browser functional
3. Supabase Dashboard -- RLS data isolation
4. Login/Logout -- Auth flow
5. CRUD -- Create/Read/Update/Delete tested
6. API Routes -- Google API 연동 검증 (Phase 8+)
