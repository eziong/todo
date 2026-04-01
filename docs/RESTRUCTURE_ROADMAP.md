# UI/UX Restructure Roadmap

프로젝트 중심 3-Zone 구조로 전환. 13개 플랫 탑레벨 → 7개 그룹 내비게이션.

## 핵심 변경 요약

| 변경 | Before | After |
|------|--------|-------|
| 사이드바 | 13개 플랫 항목 | Global(5) + Projects(동적) + Library(2) |
| 프로젝트 상세 | 단일 페이지 (todos만) | 탭 시스템 (features 기반 동적) |
| Notes/Links | 글로벌 전용 | 글로벌 + 프로젝트별 (optional project_id) |
| Builds/Content/Assets/YouTube/Revenue/SNS | 탑레벨 라우트 | 프로젝트 하위 라우트 |
| 프로젝트 생성 | 이름만 입력 | 템플릿 선택 + features 커스텀 |

## Feature Definitions

```
tasks        — 할 일 관리
builds       — 빌드/배포 이력
content      — 콘텐츠 파이프라인
ideas        — 아이디어 백로그
assets       — 파일/이미지 관리
youtube      — YouTube 채널 연동
revenue      — 수익 관리 (광고+스폰서)
distribution — SNS 배포 리마인더
notes        — 프로젝트 노트
links        — 프로젝트 링크
```

## Project Templates

| 템플릿 | features |
|--------|----------|
| 개발 프로젝트 | tasks, builds, ideas, assets, notes, links |
| 유튜브 채널 | tasks, content, ideas, assets, youtube, revenue, distribution, notes, links |
| 콘텐츠/블로그 | tasks, content, ideas, assets, distribution, notes, links |
| 일반 | tasks, ideas, notes, links |

생성 후 Settings 탭에서 features 토글 가능.

---

## Phase 1: DB 스키마 + Server 변경
> 데이터 모델 변경이 선행되어야 모든 후속 작업 가능

### Step 1.1: DB Migration — projects 테이블에 features 추가
- [x] `ALTER TABLE projects ADD COLUMN features text[] NOT NULL DEFAULT '{tasks,ideas,notes,links}'`
- [x] schema.sql 업데이트
- [x] Prisma schema 업데이트

### Step 1.2: DB Migration — notes 테이블에 project_id 추가
- [x] `ALTER TABLE notes ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL`
- [x] `CREATE INDEX notes_project_id_idx ON notes(project_id)`
- [x] schema.sql 업데이트
- [x] Prisma schema 업데이트

### Step 1.3: DB Migration — links 테이블에 project_id 추가
- [x] `ALTER TABLE links ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL`
- [x] `CREATE INDEX links_project_id_idx ON links(project_id)`
- [x] schema.sql 업데이트
- [x] Prisma schema 업데이트

### Step 1.4: Server — Projects 모듈 업데이트
- [x] Prisma schema: Project model에 features 필드 + notes/links 관계 추가
- [x] CreateProjectDto: features 필드 추가 (기본값: 템플릿별)
- [x] UpdateProjectDto: features 필드 추가
- [x] ProjectResponse: features 반환
- [x] 기존 프로젝트 마이그레이션: 기존 데이터에 features 기본값 할당

### Step 1.5: Server — Notes 모듈 업데이트
- [x] Prisma schema: Note model에 project 관계 추가
- [x] CreateNoteDto: projectId 추가 (optional)
- [x] UpdateNoteDto: projectId 추가 (optional, null 가능)
- [x] Notes Service: projectId 필터 지원
- [x] Notes Controller: GET query param에 projectId 추가
- [x] NoteResponse: projectId 반환

### Step 1.6: Server — Links 모듈 업데이트
- [x] Prisma schema: Link model에 project 관계 추가
- [x] CreateLinkDto: projectId 추가 (optional)
- [x] UpdateLinkDto: projectId 추가 (optional, null 가능)
- [x] Links Service: projectId 필터 지원
- [x] Links Controller: GET query param에 projectId 추가
- [x] LinkResponse: projectId 반환

### Step 1.7: Server 빌드 검증
- [x] `npm run build` 통과
- [x] Prisma generate 정상

---

## Phase 2: Web 타입 + 서비스 + 훅 업데이트
> UI 변경 전에 데이터 레이어 준비

### Step 2.1: 타입 업데이트
- [x] `Project` 타입에 `features: ProjectFeature[]` 추가
- [x] `Note` 타입에 `projectId: ProjectId | null` 추가
- [x] `Link` 타입에 `projectId: ProjectId | null` 추가
- [x] `CreateProjectInput`에 features 추가
- [x] `CreateNoteInput`에 projectId 추가
- [x] `CreateLinkInput`에 projectId 추가
- [x] `ProjectTemplate` 타입 정의 + 템플릿 상수 배열

### Step 2.2: 서비스 업데이트
- [x] `projects.ts`: features 매핑 (as ProjectFeature[] 캐스팅)
- [x] `notes.ts`: projectId 필터 파라미터, 응답 매핑
- [x] `links.ts`: projectId 필터 파라미터, 응답 매핑 (LinkFilters 객체 전환)

### Step 2.3: 훅 업데이트
- [x] `useProjects.ts`: features 포함 Project 반환 (자동 — 타입 변경으로)
- [x] `useNotes.ts`: `useNotes({ projectId? })` — 프로젝트 필터 지원 (기존 NoteFilters에 projectId 추가)
- [x] `useLinks.ts`: `useLinks({ projectId? })` — LinkFilters 기반 전환
- [x] Query key 업데이트: links 키가 LinkFilters 사용

### Step 2.4: Web 빌드 검증
- [x] `npm run build` 통과 (21 routes, 기존 페이지 정상)

---

## Phase 3: 사이드바 재구성
> 내비게이션 구조 변경 — 가장 가시적인 변화

### Step 3.1: 사이드바 리팩토링
- [x] Global Zone: Dashboard, Inbox, My Tasks, Notifications
- [x] Projects Zone: 프로젝트 목록 (색상 도트 + 이름), + New Project
- [x] Library Zone: Notes, Links (collapsible)
- [x] 하단: Settings, Theme, Logout
- [x] 제거할 항목: Builds, Content, YouTube, Assets, Revenue, SNS (탑레벨에서)

### Step 3.2: 프로젝트 생성 다이얼로그 개선
- [x] 템플릿 선택 UI (4개 카드: Dev, YouTube, Content, General)
- [x] 선택 후 features 체크박스로 커스텀 가능 (10개 features)
- [x] 기존 필드 유지 (name, description, color, githubRepo)
- [x] 편집 모드: 기존 features 표시 + 수정 가능

---

## Phase 4: 프로젝트 상세 탭 시스템
> 프로젝트 페이지를 허브로 전환

### Step 4.1: 프로젝트 상세 레이아웃
- [x] `/projects/[id]/layout.tsx` 생성 — 프로젝트 헤더 + 탭 바
- [x] 탭 바: project.features 기반 동적 렌더링
- [x] 탭 라우팅: `/projects/[id]/tasks`, `/projects/[id]/builds` 등

### Step 4.2: Overview 탭 (`/projects/[id]`)
- [x] 기존 프로젝트 상세 → Overview로 리팩토링
- [x] 태스크 요약, 최근 활동, 진행도

### Step 4.3: Tasks 탭 (`/projects/[id]/tasks`)
- [x] 기존 `/tasks` 페이지 로직을 프로젝트 스코프로 재사용
- [x] 프로젝트 필터 고정 + CRUD

### Step 4.4: Builds 탭 (`/projects/[id]/builds`)
- [x] 기존 `/builds` 페이지 컴포넌트를 프로젝트 스코프로 이동
- [x] 프로젝트별 빌드 커맨드 + 빌드 이력

### Step 4.5: Content 탭 (`/projects/[id]/content`)
- [x] 기존 `/content` 칸반 보드를 프로젝트 스코프로 이동
- [x] 콘텐츠 상세: `/projects/[id]/content/[contentId]`

### Step 4.6: Ideas 탭 (`/projects/[id]/ideas`)
- [x] 기존 Ideas 컴포넌트를 프로젝트 스코프로 (이미 프로젝트 소속)

### Step 4.7: Assets 탭 (`/projects/[id]/assets`)
- [x] 기존 `/assets` 컴포넌트를 프로젝트 스코프로 이동

### Step 4.8: YouTube 탭 (`/projects/[id]/youtube`)
- [x] 기존 `/youtube` 대시보드를 프로젝트 하위로 이동
- [x] 서브 라우트: videos, comments

### Step 4.9: Revenue 탭 (`/projects/[id]/revenue`)
- [x] 기존 `/revenue` 컴포넌트를 프로젝트 하위로 이동
- [x] 광고 수익 + 스폰서십 통합 뷰

### Step 4.10: Distribution 탭 (`/projects/[id]/distribution`)
- [x] 기존 `/sns` 컴포넌트를 프로젝트 하위로 이동

### Step 4.11: Notes 탭 (`/projects/[id]/notes`)
- [x] 프로젝트 스코프 노트 목록 (projectId 필터)
- [x] 생성 시 projectId 자동 연결
- [x] 노트 에디터: `/projects/[id]/notes/[noteId]`

### Step 4.12: Links 탭 (`/projects/[id]/links`)
- [x] 프로젝트 스코프 링크 목록 (projectId 필터)
- [x] 생성 시 projectId 자동 연결

### Step 4.13: Settings 탭 (`/projects/[id]/settings`)
- [x] features 토글 UI (체크박스)
- [x] 프로젝트 편집 (name, description, color, icon, githubRepo)
- [x] 프로젝트 삭제/아카이브

---

## Phase 5: 글로벌 크로스 프로젝트 뷰
> My Tasks, Calendar 등 프로젝트를 넘어서는 뷰

### Step 5.1: My Tasks (`/tasks`) 업데이트
- [x] 전체 프로젝트 태스크 크로스뷰 (기존 유지 — 이미 cross-project)
- [x] 프로젝트별 그루핑/필터 강화 (기존 동작 유지)

### Step 5.2: Calendar (`/calendar`) 생성
- [x] 기존 `/content/calendar` → `/calendar`로 이동
- [x] 전체 프로젝트의 콘텐츠 일정 통합 뷰

### Step 5.3: Library Notes (`/notes`) 업데이트
- [x] 프로젝트 필터 드롭다운 추가 (전체 / 프로젝트별)
- [x] 기존 기능 유지 + projectId 표시

### Step 5.4: Library Links (`/links`) 업데이트
- [x] 프로젝트 필터 드롭다운 추가
- [x] 기존 기능 유지 + projectId 표시

### Step 5.5: Dashboard (`/`) 업데이트
- [x] 기존 위젯 유지 (projects, tasks, inbox, activity)
- [ ] 수익 요약 위젯 — 후속 개선 (별도 enhancement)
- [ ] 콘텐츠 캘린더 미리보기 — 후속 개선 (별도 enhancement)

---

## Phase 6: 레거시 라우트 정리
> 이전 라우트 제거 + 리다이렉트

### Step 6.1: 리다이렉트 설정
- [x] `/builds` → `/projects` (server-side redirect)
- [x] `/content` → `/projects`
- [x] `/content/calendar` → `/calendar`
- [x] `/content/[id]` → `/projects`
- [x] `/youtube` → `/projects`
- [x] `/youtube/videos` → `/projects`
- [x] `/youtube/comments` → `/projects`
- [x] `/assets` → `/projects`
- [x] `/revenue` → `/projects`
- [x] `/sns` → `/projects`

### Step 6.2: 레거시 페이지 파일 → 리다이렉트 컴포넌트로 교체
- [x] `web/app/(app)/builds/page.tsx` → redirect('/projects')
- [x] `web/app/(app)/content/page.tsx` → redirect('/projects')
- [x] `web/app/(app)/content/[id]/page.tsx` → redirect('/projects')
- [x] `web/app/(app)/content/calendar/page.tsx` → redirect('/calendar')
- [x] `web/app/(app)/youtube/page.tsx` → redirect('/projects')
- [x] `web/app/(app)/youtube/videos/page.tsx` → redirect('/projects')
- [x] `web/app/(app)/youtube/comments/page.tsx` → redirect('/projects')
- [x] `web/app/(app)/assets/page.tsx` → redirect('/projects')
- [x] `web/app/(app)/revenue/page.tsx` → redirect('/projects')
- [x] `web/app/(app)/sns/page.tsx` → redirect('/projects')

### Step 6.3: 최종 빌드 검증
- [x] `npm run build` 통과 (36 routes)
- [x] 모든 라우트 접근 가능
- [x] 리다이렉트 동작 확인

---

## 라우트 매핑 (Before → After)

| Before | After | 비고 |
|--------|-------|------|
| `/` | `/` | 유지 |
| `/inbox` | `/inbox` | 유지 |
| `/tasks` | `/tasks` | 유지 (크로스 프로젝트) |
| `/projects` | `/projects` | 유지 |
| `/projects/[id]` | `/projects/[id]` | 탭 시스템 추가 |
| `/builds` | `/projects/[id]/builds` | 프로젝트 하위 |
| `/content` | `/projects/[id]/content` | 프로젝트 하위 |
| `/content/[id]` | `/projects/[id]/content/[cid]` | 프로젝트 하위 |
| `/content/calendar` | `/calendar` | 글로벌 캘린더 |
| `/youtube` | `/projects/[id]/youtube` | 프로젝트 하위 |
| `/youtube/videos` | `/projects/[id]/youtube/videos` | 프로젝트 하위 |
| `/youtube/comments` | `/projects/[id]/youtube/comments` | 프로젝트 하위 |
| `/assets` | `/projects/[id]/assets` | 프로젝트 하위 |
| `/revenue` | `/projects/[id]/revenue` | 프로젝트 하위 |
| `/sns` | `/projects/[id]/distribution` | 프로젝트 하위 |
| `/notes` | `/notes` | 유지 (글로벌 Library) |
| `/notes/[id]` | `/notes/[id]` | 유지 |
| — | `/projects/[id]/notes` | 신규 (프로젝트 노트) |
| — | `/projects/[id]/notes/[nid]` | 신규 (프로젝트 노트 에디터) |
| `/links` | `/links` | 유지 (글로벌 Library) |
| — | `/projects/[id]/links` | 신규 (프로젝트 링크) |
| — | `/projects/[id]/settings` | 신규 (features 토글) |
| — | `/calendar` | 신규 (크로스 프로젝트 캘린더) |
| `/notifications` | `/notifications` | 유지 |
| `/settings` | `/settings` | 유지 |

## 영향 받는 파일 수 (추정)

| Phase | 파일 수 | 신규 | 수정 | 삭제 |
|-------|--------|------|------|------|
| Phase 1 (Server) | ~15 | 3 (migration) | 12 | 0 |
| Phase 2 (Web 데이터) | ~10 | 1 | 9 | 0 |
| Phase 3 (사이드바) | ~3 | 0 | 3 | 0 |
| Phase 4 (프로젝트 탭) | ~25 | 15 | 10 | 0 |
| Phase 5 (글로벌 뷰) | ~8 | 2 | 6 | 0 |
| Phase 6 (정리) | ~12 | 0 | 2 | 10 |
| **합계** | **~73** | **21** | **42** | **10** |
