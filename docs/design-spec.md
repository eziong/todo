# Personal Command Center — Design Specification

> Phase 1 MVP: Todo + Inbox + Dashboard + Projects + Command Bar
> Platform: Web (Next.js 15) → later Desktop (Tauri) + Mobile (Expo)
> Backend: Supabase direct

---

## 1. Design System

### 1.1 Design References

| 요소 | 참고 앱 | 이유 |
|------|---------|------|
| 전체 미감/레이아웃 | **Linear** | 개발자 타겟, 다크 퍼스트, 키보드 중심, 미니멀 |
| Todo/Inbox 플로우 | **Things 3** | Inbox → Today → Projects 자연스러운 흐름 |
| 대시보드 | **Linear Home** | 오늘의 할 일 + 진행 상황 한눈에 |
| Command Bar | **Raycast / Linear** | 빠른 액션, 검색, 네비게이션 통합 |
| 사이드바 | **Linear / Notion** | 접을 수 있는 사이드바, 아이콘+텍스트 |

### 1.2 Color Palette (Dark-First)

```
Background:
  --bg-primary:     #0A0A0B    (앱 배경)
  --bg-secondary:   #111113    (카드/패널 배경)
  --bg-tertiary:    #1A1A1E    (호버/선택 상태)
  --bg-elevated:    #222226    (모달/드롭다운)

Border:
  --border-default: #2A2A2E    (기본 구분선)
  --border-subtle:  #1F1F23    (미묘한 구분)

Text:
  --text-primary:   #EDEDEF    (주요 텍스트)
  --text-secondary: #8B8B8E    (보조 텍스트)
  --text-tertiary:  #5C5C5F    (비활성 텍스트)
  --text-placeholder: #4A4A4D  (플레이스홀더)

Accent:
  --accent-blue:    #4C8BF5    (주 강조, 링크, 선택)
  --accent-purple:  #8B5CF6    (프로젝트/특별 항목)
  --accent-green:   #22C55E    (성공, 완료)
  --accent-yellow:  #EAB308    (경고, 진행중)
  --accent-red:     #EF4444    (에러, 삭제, 긴급)
  --accent-orange:  #F97316    (높은 우선순위)

Priority Colors:
  --priority-urgent:  #EF4444  (긴급)
  --priority-high:    #F97316  (높음)
  --priority-medium:  #EAB308  (보통)
  --priority-low:     #8B8B8E  (낮음)
  --priority-none:    #4A4A4D  (없음)

Tag Colors (프로젝트/태그용, 8가지):
  --tag-red:        #F87171
  --tag-orange:     #FB923C
  --tag-yellow:     #FACC15
  --tag-green:      #4ADE80
  --tag-blue:       #60A5FA
  --tag-purple:     #A78BFA
  --tag-pink:       #F472B6
  --tag-gray:       #9CA3AF
```

### 1.3 Typography

```
Font Family: Inter (기본), JetBrains Mono (코드/숫자)
Font Weights: 400 (Regular), 500 (Medium), 600 (Semibold)

Scale:
  --text-xs:    12px / 16px    (메타정보, 타임스탬프)
  --text-sm:    13px / 18px    (보조 텍스트, 라벨)
  --text-base:  14px / 20px    (본문, 리스트 아이템)
  --text-lg:    16px / 24px    (섹션 제목)
  --text-xl:    20px / 28px    (페이지 제목)
  --text-2xl:   24px / 32px    (대시보드 숫자)
```

### 1.4 Spacing & Layout

```
Sidebar Width:     240px (expanded) / 48px (collapsed)
Content Max Width: 960px (centered in main area)
Page Padding:      24px
Card Padding:      16px
Item Gap:          8px (리스트 아이템 간격)
Section Gap:       24px (섹션 간격)
Border Radius:     8px (카드) / 6px (버튼) / 4px (태그/뱃지)
```

### 1.5 Icons

- **Lucide Icons** (일관된 스타일, shadcn/ui 기본)
- Size: 16px (인라인) / 20px (버튼/네비게이션) / 24px (빈 상태)
- Stroke Width: 1.5px

### 1.6 Animations

```
Transition Default:  150ms ease
Transition Slow:     300ms ease
Sidebar Collapse:    200ms ease
Command Bar:         150ms ease (scale 0.98 → 1.0 + fade)
Toast:               slide-in-from-bottom 200ms
```

---

## 2. App Shell (공통 레이아웃)

### 2.1 구조

```
┌──────────────────────────────────────────────┐
│ App Shell                                     │
├──────────┬───────────────────────────────────┤
│          │                                    │
│ Sidebar  │  Main Content Area                │
│ (240px)  │  (flex-1)                         │
│          │                                    │
│ ┌──────┐ │  ┌──────────────────────────────┐ │
│ │Logo  │ │  │ Page Header                  │ │
│ ├──────┤ │  │ (제목 + 액션 버튼)            │ │
│ │Quick │ │  ├──────────────────────────────┤ │
│ │Capture│ │  │                              │ │
│ ├──────┤ │  │ Page Content                 │ │
│ │Nav   │ │  │ (max-width: 960px, centered) │ │
│ │Items │ │  │                              │ │
│ │      │ │  │                              │ │
│ │      │ │  │                              │ │
│ ├──────┤ │  │                              │ │
│ │Bottom│ │  │                              │ │
│ │(설정)│ │  └──────────────────────────────┘ │
│ └──────┘ │                                    │
└──────────┴───────────────────────────────────┘
```

### 2.2 Sidebar 구성요소

**상단 영역:**
- 로고/앱 이름: "Command" 또는 이니셜 아이콘
- 사이드바 접기 버튼 (hover 시 표시)

**Quick Capture (빠른 입력):**
- 항상 보이는 입력 필드 (Inbox에 추가)
- 플레이스홀더: "New task... (⌘N)"
- Enter 시 Inbox에 즉시 추가

**네비게이션 (메인):**
```
📊 Dashboard        (⌘1)
📥 Inbox            (⌘2)  + 미분류 카운트 뱃지
✅ Today             (⌘3)  + 오늘 할 일 카운트
📋 All Tasks         (⌘4)
```

**네비게이션 (워크스페이스):**
```
Projects            (접을 수 있는 섹션)
  ├─ 🔵 Project A
  ├─ 🟣 Project B
  └─ + New Project
```

**하단:**
- 설정 아이콘 (⚙️)
- 테마 토글 (🌙/☀️)
- 사이드바 접기

### 2.3 Command Bar (⌘K)

**구조**: 화면 중앙 오버레이, 백드롭 블러

```
┌─────────────────────────────────────────┐
│ 🔍 Type a command or search...     ⌘K  │
├─────────────────────────────────────────┤
│ Recent                                   │
│   📋 Buy groceries              Todo    │
│   📁 Command Center          Project    │
│                                          │
│ Actions                                  │
│   ➕ New Task                    ⌘N     │
│   ➕ New Project                 ⌘⇧N    │
│   📥 Go to Inbox                ⌘2     │
│   📊 Go to Dashboard            ⌘1     │
│                                          │
│ Quick Filters                            │
│   🔴 High Priority Tasks               │
│   📅 Due Today                          │
│   ✅ Completed Today                    │
└─────────────────────────────────────────┘
```

**동작:**
- 빈 상태: Recent items + Quick actions 표시
- 타이핑 시: 실시간 검색 (todos, projects, ideas)
- 방향키/Enter: 키보드 네비게이션
- ESC: 닫기

---

## 3. Dashboard (📊)

### 3.1 레이아웃

```
┌──────────────────────────────────────────┐
│ Good morning, Atom         March 23, Mon │
├──────────────────────────────────────────┤
│                                           │
│ ┌─ Today's Focus ──────────────────────┐ │
│ │ ☐ Design todo app wireframes    @Cmd │ │
│ │ ☐ Record YouTube video         @YT   │ │
│ │ ☐ Deploy server hotfix        @Svr   │ │
│ │                    + Add task         │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ ┌─ Inbox ──────────┐ ┌─ Upcoming ──────┐ │
│ │ 5 items to sort  │ │ Tomorrow        │ │
│ │                  │ │ ☐ Edit video    │ │
│ │ Latest:          │ │ ☐ Review PR #42 │ │
│ │ "Check new lib"  │ │                 │ │
│ │ "API 아이디어"     │ │ This Week      │ │
│ │                  │ │ ☐ Upload EP.15  │ │
│ │ → View all       │ │ → View all      │ │
│ └──────────────────┘ └─────────────────┘ │
│                                           │
│ ┌─ Projects ───────────────────────────┐ │
│ │ Command Center    3 active tasks     │ │
│ │ YouTube Channel   1 video in edit    │ │
│ │ Server API        Build #42 ✅       │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ ┌─ Recent Activity ────────────────────┐ │
│ │ 10:30  Completed "Fix auth bug"      │ │
│ │ 09:15  Added idea "Dark mode toggle" │ │
│ │ Yesterday  Deployed Build #41        │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### 3.2 섹션 상세

**인사 + 날짜**: 시간대별 인사 (Good morning/afternoon/evening) + 날짜

**Today's Focus**:
- 오늘 마감이거나 "Today"로 설정된 태스크
- 드래그앤드롭으로 순서 변경
- 인라인 완료 체크
- 프로젝트 태그 표시

**Inbox 위젯**:
- 미분류 아이템 수 + 최근 추가된 항목 2-3개 미리보기
- "View all" 클릭 시 Inbox 페이지로 이동

**Upcoming 위젯**:
- 내일/이번 주 마감 태스크
- 날짜별 그룹핑

**Projects 위젯**:
- 각 프로젝트의 활성 태스크 수 / 최근 빌드 상태
- 프로젝트 색상 아이콘 표시

**Recent Activity**:
- 최근 완료/추가/변경 내역 타임라인
- 컴팩트 리스트 (아이콘 + 시간 + 설명)

---

## 4. Inbox (📥)

### 4.1 개념

GTD의 "Capture everything, process later" 패턴.
모든 빠른 생각/아이디어/할 일이 먼저 여기로 → 나중에 프로젝트/Todo로 분류.

### 4.2 레이아웃

```
┌──────────────────────────────────────────┐
│ Inbox                        5 items     │
├──────────────────────────────────────────┤
│                                           │
│ ┌─ Quick Add ──────────────────────────┐ │
│ │ What's on your mind?          ⌘N     │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ ┌──────────────────────────────────────┐ │
│ │ ☐ Check out Tauri for desktop app    │ │
│ │   Added 2 hours ago                  │ │
│ │                         → Todo  📁   │ │
│ ├──────────────────────────────────────┤ │
│ │ ☐ YouTube 썸네일 스타일 변경 아이디어  │ │
│ │   Added yesterday                    │ │
│ │                         → Todo  📁   │ │
│ ├──────────────────────────────────────┤ │
│ │ ☐ API rate limiting 구현하기          │ │
│ │   Added 2 days ago                   │ │
│ │                         → Todo  📁   │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ ─── Processed ────────────────────────── │
│   ✅ Server 모니터링 설정 → Moved to Svr │
│   ✅ 새 인트로 만들기 → Moved to YT      │
└──────────────────────────────────────────┘
```

### 4.3 인터랙션

**Quick Add**:
- 포커스 시 확장 (여러 줄 입력 가능)
- Enter: 추가 후 입력 초기화
- Shift+Enter: 줄바꿈
- 태그 지원: `#project-name` 입력 시 자동 분류

**각 아이템**:
- 호버 시 액션 버튼 표시:
  - → Todo: 해당 아이템을 Todo로 변환 (마감일, 우선순위 설정)
  - 📁: 프로젝트에 아이디어로 추가
  - 🗑️: 삭제
- 클릭: 인라인 편집
- 드래그: 순서 변경
- 키보드: ↑↓ 이동, Enter 편집, ⌘→ Todo로 변환, ⌘⇧→ 프로젝트로 이동

**Processed 섹션**:
- 이미 분류된 아이템 (회색, 접힌 상태)
- 어디로 갔는지 표시 (→ Moved to [Project])

---

## 5. Todo (✅)

### 5.1 레이아웃 — All Tasks

```
┌──────────────────────────────────────────┐
│ All Tasks                    Filter ▾    │
│                              Sort ▾      │
├──────────────────────────────────────────┤
│                                           │
│ ┌─ Quick Add ──────────────────────────┐ │
│ │ + Add task...                   ⌘N   │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ ─── Today ───────────────────────── (3) │
│ │ 🔴 ☐ Fix production bug     @Svr  📅│ │
│ │ 🟡 ☐ Record video intro     @YT      │ │
│ │    ☐ Review pull request    @Cmd     │ │
│                                           │
│ ─── Tomorrow ────────────────────── (2) │
│ │    ☐ Edit video chapter 3   @YT      │ │
│ │    ☐ Write changelog        @Cmd     │ │
│                                           │
│ ─── This Week ───────────────────── (4) │
│ │ 🟡 ☐ Migrate database       @Svr     │ │
│ │    ☐ Design settings page   @Cmd     │ │
│ │    ☐ Upload episode 15      @YT      │ │
│ │    ☐ Buy new microphone              │ │
│                                           │
│ ─── No Date ─────────────────────── (6) │
│ │    ☐ Refactor auth module   @Svr     │ │
│ │    ☐ Learn Tauri basics              │ │
│ │    ...                               │ │
│                                           │
│ ─── Completed ─────────────── Show ▾ ── │
└──────────────────────────────────────────┘
```

### 5.2 Todo 아이템 구성요소

```
┌─────────────────────────────────────────────┐
│ 🔴 ☐ Fix production auth bug        @Svr  │
│        Due: Today  Tags: #urgent #backend  │
│        Repeat: none                         │
└─────────────────────────────────────────────┘

구성:
[우선순위 도트] [체크박스] [제목]              [프로젝트]
                         [마감일] [태그들]
                         [반복 표시]
```

**우선순위 도트**: 🔴 Urgent / 🟠 High / 🟡 Medium / ⚫ Low / (없음) None

### 5.3 Todo 상세 패널 (사이드 패널 또는 모달)

클릭 시 오른쪽에 슬라이드 패널 또는 모달로 상세 표시:

```
┌─────────────────────────────────┐
│ ☐ Fix production auth bug    ✕  │
├─────────────────────────────────┤
│ Status:    ⚪ Todo              │
│ Priority:  🔴 Urgent            │
│ Due Date:  📅 March 23, 2026    │
│ Project:   📁 Server API        │
│ Tags:      #urgent #backend     │
│ Repeat:    None                 │
├─────────────────────────────────┤
│ Description                     │
│ ┌─────────────────────────────┐ │
│ │ Auth token refresh failing  │ │
│ │ for users with expired...   │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Subtasks                        │
│ ☑ Identify root cause           │
│ ☐ Write fix                     │
│ ☐ Test & deploy                 │
│ + Add subtask                   │
├─────────────────────────────────┤
│ Notes                           │
│ See PR #142 for context         │
├─────────────────────────────────┤
│ Activity                        │
│ Created Mar 22 · Modified 2h ago│
└─────────────────────────────────┘
```

### 5.4 필터 & 정렬

**필터 옵션:**
- Priority: Urgent / High / Medium / Low / None
- Project: [프로젝트 목록]
- Tags: [태그 목록]
- Status: Todo / In Progress / Completed
- Due: Overdue / Today / This Week / No Date

**정렬 옵션:**
- Date (default): 마감일별 그룹핑
- Priority: 높은 우선순위 먼저
- Project: 프로젝트별 그룹핑
- Created: 생성일 순

**뷰 옵션:**
- List (default): 위 레이아웃
- Kanban: Status별 칼럼 (Todo / In Progress / Done)

### 5.5 반복 태스크

반복 설정:
- Daily / Weekly / Monthly / Custom
- 완료 시 자동으로 다음 인스턴스 생성
- 반복 아이콘 (🔄) 표시

---

## 6. Projects (📁)

### 6.1 프로젝트 목록

```
┌──────────────────────────────────────────┐
│ Projects                    + New Project│
├──────────────────────────────────────────┤
│                                           │
│ ┌─ 🔵 Command Center ─────────────────┐ │
│ │ Personal productivity app            │ │
│ │ 5 tasks · 12 ideas · Build #3       │ │
│ │ Last activity: 2 hours ago           │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ ┌─ 🟣 YouTube Channel ────────────────┐ │
│ │ Dev tutorial & vlog                  │ │
│ │ 3 tasks · 8 ideas · 2 videos in WIP │ │
│ │ Last activity: yesterday             │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ ┌─ 🟢 Server API ─────────────────────┐ │
│ │ NestJS backend service               │ │
│ │ 2 tasks · 4 ideas · Build #42 ✅    │ │
│ │ Last activity: 3 days ago            │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ ┌─ ⚫ Archived ───────────────────────┐ │
│ │ 2 archived projects        Show ▾   │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### 6.2 프로젝트 상세

```
┌──────────────────────────────────────────┐
│ 🔵 Command Center                  ⚙️   │
│ Personal productivity app                │
├────────┬────────┬────────┬───────────────┤
│ Tasks  │ Ideas  │ Builds │ Changelog     │
├────────┴────────┴────────┴───────────────┤
```

#### Tab: Tasks

프로젝트에 속한 Todo 목록 (Todo 페이지와 동일한 리스트, 프로젝트 필터 적용됨)

#### Tab: Ideas (아이디어 풀)

```
│ Ideas                        + New Idea  │
│                                           │
│ ┌──────────────────────────────────────┐ │
│ │ 💡 Add dark mode toggle              │ │
│ │    Added 3 days ago                  │ │
│ │    Status: 🟡 Considering            │ │
│ ├──────────────────────────────────────┤ │
│ │ 💡 Keyboard shortcuts guide          │ │
│ │    Added 1 week ago                  │ │
│ │    Status: ⚪ New                    │ │
│ ├──────────────────────────────────────┤ │
│ │ 💡 Mobile companion app              │ │
│ │    Added 2 weeks ago                 │ │
│ │    Status: 🔵 Planned (Build #4)    │ │
│ └──────────────────────────────────────┘ │
```

아이디어 상태: ⚪ New → 🟡 Considering → 🔵 Planned → 🟢 Implemented → ⚫ Rejected

#### Tab: Builds

```
│ Builds                      ▶ Run Build  │
│                                           │
│ ┌─ Build #3 ─────────── In Progress 🟡 ┐ │
│ │ Started: 2 min ago                    │ │
│ │ Command: npm run build                │ │
│ │ ┌──────────────────────────────────┐  │ │
│ │ │ > Building pages...              │  │ │
│ │ │ > Compiling /dashboard...        │  │ │
│ │ │ > ✓ 12/15 pages compiled         │  │ │
│ │ └──────────────────────────────────┘  │ │
│ │                                       │ │
│ │ Ideas included:                       │ │
│ │  ✅ Dark mode toggle                  │ │
│ │  ✅ Keyboard shortcuts                │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ ┌─ Build #2 ─────────── Completed ✅ ──┐ │
│ │ March 20, 2026 · 45 seconds          │ │
│ │ Command: npm run build                │ │
│ │ Ideas included: 3 ideas              │ │
│ └───────────────────────────────────────┘ │
```

**"Run Build" 버튼 동작**:
1. 빌드 커맨드 실행 (프로젝트 설정에 저장된 셸 명령어)
2. 실시간 로그 출력 (터미널 스타일)
3. 완료/실패 시 상태 업데이트 + 알림

**아이디어 연결**:
- 빌드 생성 시 "이번 빌드에 포함된 아이디어" 선택
- Ideas 탭에서 드래그앤드롭으로 빌드에 연결
- 또는 빌드 생성 화면에서 체크리스트로 선택

#### Tab: Changelog

```
│ Changelog                                │
│                                           │
│ ─── Build #3 (March 23, 2026) ────────── │
│                                           │
│   ✨ New Features                         │
│   - Dark mode toggle                     │
│   - Keyboard shortcuts for navigation    │
│                                           │
│   🐛 Bug Fixes                            │
│   - Fixed auth token refresh             │
│                                           │
│   📝 Notes                                │
│   Manual entry for additional context    │
│                                           │
│ ─── Build #2 (March 20, 2026) ────────── │
│   ...                                    │
```

아이디어의 status로 자동 분류:
- 새 기능 아이디어 → ✨ New Features
- 버그 관련 → 🐛 Bug Fixes
- 수동 추가 메모 가능

### 6.3 프로젝트 설정 모달

```
┌─────────────────────────────────┐
│ Project Settings             ✕  │
├─────────────────────────────────┤
│ Name:     [Command Center    ]  │
│ Color:    🔵🟣🟢🟡🔴⚫          │
│ Icon:     [선택]                │
│                                 │
│ Build Commands:                 │
│ ┌─────────────────────────────┐ │
│ │ Label: [Web Build        ]  │ │
│ │ Command: [npm run build  ]  │ │
│ │ Directory: [~/projects/..]  │ │
│ │                 + Add More  │ │
│ └─────────────────────────────┘ │
│                                 │
│ GitHub Repo: [owner/repo     ]  │
│ Description: [             ]    │
│                                 │
│          [Archive]    [Save]    │
└─────────────────────────────────┘
```

---

## 7. Global Interactions

### 7.1 Keyboard Shortcuts

| 단축키 | 동작 |
|--------|------|
| `⌘K` | Command Bar 열기 |
| `⌘N` | 새 태스크/아이디어 빠른 추가 |
| `⌘⇧N` | 새 프로젝트 |
| `⌘1-4` | 네비게이션 (Dashboard, Inbox, Today, All Tasks) |
| `⌘[` | 사이드바 토글 |
| `↑↓` | 리스트 아이템 이동 |
| `Enter` | 아이템 열기/편집 |
| `⌘⌫` | 삭제 (확인 필요) |
| `Space` | 체크박스 토글 |
| `⌘.` | 우선순위 변경 |
| `⌘D` | 마감일 설정 |

### 7.2 Toast / Notification

| 이벤트 | 타입 | 내용 |
|--------|------|------|
| 태스크 완료 | Success | "Task completed" + Undo |
| 태스크 삭제 | Warning | "Task deleted" + Undo (5초) |
| 빌드 완료 | Success | "Build #3 completed in 45s" |
| 빌드 실패 | Error | "Build #3 failed" + View Log |
| Inbox 아이템 분류 | Info | "Moved to [Project]" |

### 7.3 Empty States

| 화면 | 메시지 | 액션 |
|------|--------|------|
| Dashboard (첫 사용) | "Start by adding your first task" | + Create Task |
| Inbox (비어있음) | "Inbox is clear. Nice!" | 아이콘: 📥 깨끗한 받은편지함 |
| Todo (필터 결과 없음) | "No tasks match your filters" | Clear Filters |
| Projects (없음) | "Create your first project" | + New Project |
| Ideas (없음) | "No ideas yet. Start brainstorming!" | + New Idea |
| Builds (없음) | "No builds yet. Set up build commands in project settings." | ⚙️ Settings |

### 7.4 Loading States

- 모든 데이터 로딩: Skeleton 컴포넌트 (실제 레이아웃과 동일한 형태)
- 리스트: 3-5개의 skeleton row
- 대시보드: 각 위젯별 skeleton
- 빌드 실행 중: 실시간 로그 + 진행 스피너

---

## 8. Responsive Behavior

### 8.1 Breakpoints

| 범위 | 동작 |
|------|------|
| > 1280px | 사이드바 + 메인 + (상세 패널 동시 표시 가능) |
| 1024-1280px | 사이드바 + 메인 (상세는 오버레이) |
| 768-1024px | 사이드바 접힌 상태 + 메인 |
| < 768px | 사이드바 오버레이 + 메인 풀스크린 |

---

## 9. Data Model (Supabase)

### 9.1 Tables

```sql
-- Users (Supabase Auth handles this)

-- Inbox Items
inbox_items:
  id          uuid PK
  user_id     uuid FK → auth.users
  content     text NOT NULL
  created_at  timestamptz
  processed   boolean DEFAULT false
  processed_to text  -- 'todo' | 'idea'
  processed_id uuid  -- linked todo or idea id

-- Todos
todos:
  id          uuid PK
  user_id     uuid FK → auth.users
  title       text NOT NULL
  description text
  status      text DEFAULT 'todo'     -- 'todo' | 'in_progress' | 'completed'
  priority    text DEFAULT 'none'     -- 'urgent' | 'high' | 'medium' | 'low' | 'none'
  due_date    date
  project_id  uuid FK → projects
  parent_id   uuid FK → todos (self, for subtasks)
  position    integer                 -- sort order
  completed_at timestamptz
  created_at  timestamptz
  updated_at  timestamptz

-- Todo Tags (many-to-many)
todo_tags:
  todo_id     uuid FK → todos
  tag_id      uuid FK → tags

-- Tags
tags:
  id          uuid PK
  user_id     uuid FK → auth.users
  name        text NOT NULL
  color       text

-- Recurring Rules
recurring_rules:
  id          uuid PK
  todo_id     uuid FK → todos
  frequency   text     -- 'daily' | 'weekly' | 'monthly' | 'custom'
  interval    integer  -- every N days/weeks/months
  days_of_week integer[] -- for weekly: [1,3,5] = Mon,Wed,Fri
  next_due    date
  created_at  timestamptz

-- Projects
projects:
  id          uuid PK
  user_id     uuid FK → auth.users
  name        text NOT NULL
  description text
  color       text
  icon        text
  archived    boolean DEFAULT false
  position    integer
  github_repo text
  created_at  timestamptz
  updated_at  timestamptz

-- Build Commands (per project)
build_commands:
  id          uuid PK
  project_id  uuid FK → projects
  label       text NOT NULL
  command     text NOT NULL
  directory   text
  position    integer

-- Ideas
ideas:
  id          uuid PK
  user_id     uuid FK → auth.users
  project_id  uuid FK → projects
  title       text NOT NULL
  description text
  status      text DEFAULT 'new'  -- 'new' | 'considering' | 'planned' | 'implemented' | 'rejected'
  build_id    uuid FK → builds (which build implemented this)
  position    integer
  created_at  timestamptz
  updated_at  timestamptz

-- Builds
builds:
  id          uuid PK
  project_id  uuid FK → projects
  build_number integer
  status      text DEFAULT 'pending' -- 'pending' | 'running' | 'success' | 'failed'
  command     text
  log         text                   -- build output
  started_at  timestamptz
  finished_at timestamptz
  notes       text                   -- manual changelog notes
  created_at  timestamptz

-- Build Ideas (many-to-many: which ideas are in which build)
build_ideas:
  build_id    uuid FK → builds
  idea_id     uuid FK → ideas

-- Activity Log
activity_log:
  id          uuid PK
  user_id     uuid FK → auth.users
  action      text     -- 'created' | 'completed' | 'moved' | 'built' | 'deleted'
  entity_type text     -- 'todo' | 'idea' | 'build' | 'project'
  entity_id   uuid
  metadata    jsonb    -- additional context
  created_at  timestamptz
```

### 9.2 RLS (Row Level Security)

모든 테이블: `user_id = auth.uid()` 필터 적용
→ 개인용 앱이므로 자기 데이터만 접근

---

## 10. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS 4 |
| State (Server) | TanStack React Query 5 |
| State (Client) | Zustand 5 |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime (build logs) |
| DnD | @dnd-kit |
| Icons | Lucide React |
| Date | date-fns |
| Forms | React Hook Form + Zod |
| Editor | Tiptap (rich text for descriptions) |
| Terminal | xterm.js (build log display) |

---

## 11. Page Structure (Next.js App Router)

```
app/
├── layout.tsx              (App Shell: Sidebar + Main)
├── page.tsx                (Dashboard)
├── inbox/
│   └── page.tsx            (Inbox)
├── tasks/
│   └── page.tsx            (All Tasks)
├── projects/
│   ├── page.tsx            (Project List)
│   └── [id]/
│       └── page.tsx        (Project Detail with tabs)
├── settings/
│   └── page.tsx            (Settings)
└── api/                    (API routes if needed)
```

---

## Future Phases Reference

> Phase 2-5 상세 스펙은 Phase 1 구현 완료 후 별도 문서로 작성.
> 여기서는 DB 스키마 확장 방향만 기록.

### Phase 2 추가 테이블
- `github_integrations` — GitHub 연동 설정
- `service_health` — 모니터링 대상 서비스
- `snippets` — 코드/커맨드 스니펫

### Phase 3 추가 테이블
- `videos` — YouTube 영상 파이프라인
- `video_stages` — 칸반 스테이지
- `content_calendar` — 콘텐츠 일정
- `drive_files` — Google Drive 연동 파일

### Phase 4 추가 테이블
- `pomodoro_sessions` — 집중 세션 기록
- `habits` — 습관 정의 + 스트릭
- `automation_rules` — 자동화 규칙
- `ai_conversations` — AI 대화 이력
- `weekly_reviews` — 주간 리뷰 데이터

### Phase 5 추가 테이블
- `expenses` — 비용 기록
- `bookmarks` — 북마크
- `notes` — 마크다운 노트
