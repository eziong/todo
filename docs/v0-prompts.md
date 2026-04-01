# v0.dev Prompts — Personal Command Center

> 각 프롬프트를 v0.dev에 순서대로 입력하여 화면별 디자인을 생성합니다.
> 생성 후 Figma로 export하거나 직접 코드로 활용 가능.

---

## Prompt 0: Design System Foundation

```
Create a design system foundation for a dark-mode-first personal productivity app inspired by Linear and Raycast.

Requirements:
- Color palette: Dark background (#0A0A0B primary, #111113 secondary, #1A1A1E tertiary), text (#EDEDEF primary, #8B8B8E secondary), accent blue (#4C8BF5), purple (#8B5CF6), green (#22C55E), yellow (#EAB308), red (#EF4444), orange (#F97316)
- Typography: Inter font, sizes 12/13/14/16/20/24px
- Show examples of: buttons (primary, secondary, ghost, destructive), input fields, badges/tags in 8 colors (red, orange, yellow, green, blue, purple, pink, gray), checkboxes, dropdown, and a card component
- All on dark background
- Minimal, clean, developer-tool aesthetic
- Use Lucide icons
- Border radius: 8px cards, 6px buttons, 4px badges
- Borders: #2A2A2E
```

---

## Prompt 1: App Shell + Sidebar

```
Create a full-page app shell layout for a personal productivity app called "Command". Dark mode only, Linear/Raycast inspired aesthetic.

Layout structure:
- LEFT: Collapsible sidebar (240px expanded, 48px collapsed)
- RIGHT: Main content area (flex-1, centered max-width 960px)

Sidebar contains (top to bottom):
1. App logo area: "Command" text logo + collapse button (appears on hover)
2. Quick capture input: Always-visible text input with placeholder "New task... (Cmd+N)", subtle border, on Enter it clears
3. Navigation section with these items (each with Lucide icon):
   - Dashboard (LayoutDashboard icon)
   - Inbox (Inbox icon) with a blue count badge showing "5"
   - Today (CalendarCheck icon) with count "3"
   - All Tasks (CheckSquare icon)
4. "Projects" section header (collapsible) with items:
   - Blue dot + "Command Center"
   - Purple dot + "YouTube Channel"
   - Green dot + "Server API"
   - "+ New Project" link at bottom
5. Bottom area: Settings gear icon + theme toggle (moon/sun icon)

Active item has subtle bg highlight (#1A1A1E) with accent-blue left border.
Hover state: bg #1A1A1E.

The main content area should show a placeholder "Dashboard content here" with the page header pattern: left-aligned title "Dashboard" with optional right-side action buttons.

Colors: bg #0A0A0B (app), sidebar bg #111113, borders #2A2A2E, text #EDEDEF primary / #8B8B8E secondary.
Font: Inter. Icons: Lucide React.
```

---

## Prompt 2: Command Bar (Cmd+K)

```
Create a command palette / command bar overlay component, inspired by Linear's command menu and Raycast.

Trigger: Opens centered on screen with a backdrop blur overlay (bg black/50).

Structure:
- Floating panel: max-width 640px, centered, rounded-lg, bg #111113, border #2A2A2E, shadow-2xl
- Search input at top: Large text input with search icon, placeholder "Type a command or search...", right-side "Esc" hint badge
- Below search: Scrollable results area

Default state (no query):
- "Recent" section header (#8B8B8E text):
  - "Buy groceries" with Todo tag
  - "Command Center" with Project tag
- "Actions" section header:
  - "+ New Task" with "Cmd+N" shortcut badge
  - "+ New Project" with "Cmd+Shift+N" badge
  - "Go to Inbox" with "Cmd+2" badge
  - "Go to Dashboard" with "Cmd+1" badge
- "Quick Filters" section:
  - "High Priority Tasks" with red dot
  - "Due Today" with calendar icon
  - "Completed Today" with check icon

Each item: hover bg #1A1A1E, selected item has blue-tinted bg.
Keyboard navigation: show selected state on one item.
Shortcut badges: bg #222226, rounded, text-xs, monospace font.

Animation: Scale 0.98 to 1.0 + opacity fade on open.
Dark mode: bg #111113, text #EDEDEF.
```

---

## Prompt 3: Dashboard

```
Create a dashboard page for a personal productivity app. Dark mode, Linear-inspired minimal design.

Page header: "Good morning, Atom" left-aligned, "March 23, Mon" right-aligned, text-secondary color.

Layout: Single column, max-width 960px, centered.

Sections (top to bottom):

1. "Today's Focus" card:
   - Card with subtle border (#2A2A2E), bg #111113, rounded-lg
   - 3 todo items with checkboxes:
     - "Design todo app wireframes" with blue "@Cmd" project tag
     - "Record YouTube video" with purple "@YT" tag
     - "Deploy server hotfix" with green "@Svr" tag
   - "+ Add task" link at bottom (text-secondary, hover text-primary)

2. Two-column grid:
   Left: "Inbox" widget card:
   - Header: "Inbox" + "5 items to sort" badge
   - 2-3 preview items (just titles, text-secondary, compact)
   - "View all →" link at bottom

   Right: "Upcoming" widget card:
   - Header: "Upcoming"
   - "Tomorrow" sub-header with 2 tasks
   - "This Week" sub-header with 1 task
   - "View all →" link at bottom

3. "Projects" section:
   - Horizontal cards or compact list, each showing:
     - Color dot + project name + "3 active tasks" or "Build #42 ✓"
   - Show 3 projects in a row

4. "Recent Activity" section:
   - Compact timeline list:
     - "10:30 — Completed 'Fix auth bug'" (green check icon)
     - "09:15 — Added idea 'Dark mode toggle'" (lightbulb icon)
     - "Yesterday — Deployed Build #41" (rocket icon)
   - Each line: timestamp (text-tertiary), action text, icon

All cards: bg #111113, border #2A2A2E, p-4, rounded-lg.
Spacing between sections: 24px.
App background: #0A0A0B.
```

---

## Prompt 4: Inbox

```
Create an Inbox page for a personal productivity app. Think "GTD capture inbox" — a place to quickly dump thoughts and process them later. Dark mode, minimal.

Page header: "Inbox" left-aligned, "5 items" count badge right side.

Layout: max-width 960px, centered.

1. Quick Add section at top:
   - Large text input area, placeholder "What's on your mind?", right-aligned "Cmd+N" hint
   - On focus, should look expandable (taller, accepts multi-line)

2. Unprocessed items list:
   Each item is a row with:
   - Left: Subtle grip handle (drag indicator, 6 dots)
   - Checkbox (unchecked)
   - Title text: "Check out Tauri for desktop app"
   - Below title: "Added 2 hours ago" in text-tertiary, small
   - Right side (on hover): Two action buttons:
     - "→ Todo" button (converts to todo)
     - Folder icon button (move to project)

   Show 5 items with varying titles:
   - "Check out Tauri for desktop app" — 2 hours ago
   - "YouTube 썸네일 스타일 변경 아이디어" — yesterday
   - "API rate limiting 구현하기" — 2 days ago
   - "New mic recommendation from Reddit" — 3 days ago
   - "Read about WebSocket best practices" — 4 days ago

3. Divider with "Processed" label (collapsed by default, toggle to show):
   - 2 items in muted style:
     - "Server 모니터링 설정 → Moved to Server API" (strikethrough, text-tertiary)
     - "새 인트로 만들기 → Moved to YouTube Channel"

Styling:
- Items: hover bg #1A1A1E, border-bottom #1F1F23
- Action buttons: ghost style, appear on hover
- Background: #0A0A0B, cards: none (flat list)
```

---

## Prompt 5: All Tasks (Todo List)

```
Create a task list page for a personal productivity app. Dark mode, clean, Linear-inspired.

Page header: "All Tasks" left-aligned. Right side: "Filter" dropdown button + "Sort" dropdown button.

Layout: max-width 960px, centered.

1. Quick Add at top: Inline input "+ Add task..." with Cmd+N hint.

2. Task list grouped by date sections:

Section "Today" (3 items):
- Red dot + checkbox + "Fix production auth bug" + blue "@Svr" tag + calendar icon "Today"
- Yellow dot + checkbox + "Record video intro" + purple "@YT" tag
- No dot + checkbox + "Review pull request" + blue "@Cmd" tag

Section "Tomorrow" (2 items):
- No dot + "Edit video chapter 3" + "@YT" tag
- No dot + "Write changelog" + "@Cmd" tag

Section "This Week" (3 items):
- Yellow dot + "Migrate database" + "@Svr" tag
- No dot + "Design settings page" + "@Cmd" tag
- No dot + "Upload episode 15" + "@YT" tag

Section "No Date" (2 items, collapsed, show count):
- "6 tasks without due date" + expand toggle

Section "Completed" (collapsed):
- "Show completed" toggle link

Each task row:
- [Priority dot (colored)] [Checkbox] [Title text] ............ [Project tag] [Due date if any]
- Priority dots: Red=urgent, Orange=high, Yellow=medium, no dot=low/none
- Project tags: Small rounded badges with project color
- Hover: bg #1A1A1E, show drag handle on left
- Completed: strikethrough, text-tertiary

Section headers: text-secondary, uppercase text-xs, with count in parentheses, subtle top border.

Filter dropdown preview (show it open):
- Priority: All / Urgent / High / Medium / Low
- Project: All / [project list]
- Status: All / Todo / In Progress / Completed
- Due: All / Overdue / Today / This Week / No Date
```

---

## Prompt 6: Task Detail Panel

```
Create a task detail side panel that slides in from the right side of the screen, taking about 400px width. Dark mode, minimal design.

Panel structure (top to bottom):

1. Header bar:
   - Left: Large checkbox + editable task title "Fix production auth bug"
   - Right: Close button (X icon)

2. Properties section (form-like, each row is label + value):
   - Status: Dropdown showing "Todo" with circle icon (options: Todo, In Progress, Completed)
   - Priority: Dropdown showing "Urgent" with red dot (options: Urgent/red, High/orange, Medium/yellow, Low/gray, None)
   - Due Date: Date picker showing "March 23, 2026" with calendar icon
   - Project: Dropdown showing "Server API" with green dot
   - Tags: Tag input showing "#urgent" "#backend" as small badges + add button
   - Repeat: Dropdown showing "None" (options: None, Daily, Weekly, Monthly, Custom)

   Each row: left label (text-secondary, 100px width), right value (interactive).

3. Description section:
   - "Description" header
   - Rich text area with placeholder, showing: "Auth token refresh failing for users with expired sessions. See error logs from March 22."
   - Subtle border, bg #111113

4. Subtasks section:
   - "Subtasks" header
   - ☑ "Identify root cause" (checked, strikethrough)
   - ☐ "Write fix"
   - ☐ "Test & deploy"
   - "+ Add subtask" link

5. Activity footer:
   - "Created Mar 22 · Modified 2h ago" in text-tertiary, text-xs

Panel styling:
- bg #111113, left border #2A2A2E
- Shadow: large left shadow for depth
- Overlay: semi-transparent backdrop on the main content
```

---

## Prompt 7: Project Detail with Tabs

```
Create a project detail page with tabs for a personal productivity app. Dark mode, clean design.

Page header:
- Blue circle icon + "Command Center" (large title)
- Below: "Personal productivity app" (text-secondary)
- Right: Settings gear icon button

Tab bar below header:
- 4 tabs: Tasks | Ideas | Builds | Changelog
- Active tab: text-primary with blue underline
- Inactive: text-secondary

Show the "Ideas" tab content:

Ideas tab layout:
- Right-aligned "+ New Idea" button
- List of idea cards:

Card 1:
- Lightbulb icon + "Add dark mode toggle"
- "Added 3 days ago" text-tertiary
- Status badge: "Considering" (yellow bg/text)

Card 2:
- "Keyboard shortcuts guide"
- "Added 1 week ago"
- Status: "New" (gray badge)

Card 3:
- "Mobile companion app"
- "Added 2 weeks ago"
- Status: "Planned — Build #4" (blue badge)

Card 4:
- "Export to CSV"
- "Added 3 weeks ago"
- Status: "Implemented" (green badge)

Card 5:
- "Complex animations"
- "Added 1 month ago"
- Status: "Rejected" (dark/gray badge, muted)

Each card: bg #111113, border #2A2A2E, rounded-lg, p-4.
Idea status badges: New(gray), Considering(yellow), Planned(blue), Implemented(green), Rejected(dark gray muted).
Hover: slightly elevated shadow.
```

---

## Prompt 8: Project Builds Tab

```
Create the "Builds" tab content for a project detail page. Dark mode, developer-tool aesthetic, terminal-inspired build logs.

Top area:
- "▶ Run Build" primary button (blue, right-aligned)
- Dropdown next to it to select which build command

Build list (newest first):

Build #3 — In Progress:
- Card with yellow left border accent
- Header: "Build #3" + yellow "Running" badge + "Started 2 min ago"
- Terminal-style log area (dark bg #0A0A0B, monospace font, green text):
  ```
  > npm run build
  > Building pages...
  > Compiling /dashboard... ✓
  > Compiling /inbox... ✓
  > Compiling /tasks...
  ```
  With a blinking cursor at the end
- "Ideas included:" section below log:
  - ✅ "Dark mode toggle"
  - ✅ "Keyboard shortcuts"

Build #2 — Completed:
- Card with green left border
- Header: "Build #2" + green "Success" badge + "March 20, 2026 · 45 seconds"
- Collapsed log (click to expand)
- "3 ideas included" summary

Build #1 — Failed:
- Card with red left border
- Header: "Build #1" + red "Failed" badge + "March 18, 2026 · 12 seconds"
- Collapsed log

Cards: bg #111113, border #2A2A2E, rounded-lg. Terminal area: bg #0A0A0B, font JetBrains Mono, text-sm.
```

---

## Prompt 9: Build Creation Modal (Ideas Selection)

```
Create a modal dialog for creating/starting a new build in a project. Dark mode.

Modal: centered, max-width 560px, bg #111113, border #2A2A2E, rounded-xl, shadow-2xl.
Backdrop: black/50 blur.

Content:

1. Header: "New Build — Command Center" + close X button

2. Build Command selector:
   - Label: "Command"
   - Dropdown: "npm run build" selected (options: "npm run build", "npm run build:prod", custom)
   - Working directory shown below: "~/projects/command-center"

3. "Include Ideas" section:
   - Description: "Select ideas to include in this build"
   - Scrollable checklist of project ideas:
     - ☑ "Dark mode toggle" (Considering status)
     - ☑ "Keyboard shortcuts guide" (New status)
     - ☐ "Mobile companion app" (Planned)
     - ☐ "Export to CSV" (New)
   - Drag & drop hint: "Or drag ideas from the Ideas tab"

4. "Notes" section:
   - Optional text area: "Add release notes..."

5. Footer:
   - Left: "Cancel" ghost button
   - Right: "▶ Start Build" primary blue button

Checkbox items: hover bg #1A1A1E, checkmark blue accent.
```

---

## Prompt 10: Settings Page

```
Create a settings page for a personal productivity app. Dark mode, clean form layout.

Page header: "Settings"

Layout: max-width 640px, centered. Sections separated by subtle dividers.

Section 1: "Profile"
- Name input: "Atom"
- Email: "atom@example.com" (read-only, from Supabase auth)

Section 2: "Appearance"
- Theme: Radio group — "Dark" (selected) / "Light" / "System"
- Sidebar: Toggle — "Collapse by default" (off)

Section 3: "Keyboard Shortcuts"
- Table showing shortcuts:
  | Action | Shortcut |
  | Command bar | Cmd+K |
  | New task | Cmd+N |
  | New project | Cmd+Shift+N |
  | Toggle sidebar | Cmd+[ |
- Each row: hover highlight, "Edit" link on hover (for future customization)

Section 4: "Integrations" (placeholders for future)
- GitHub: "Connect" button
- Google Drive: "Connect" button
- YouTube: "Connect" button
- Each with icon, name, status (Connected/Not connected)

Section 5: "Data"
- "Export all data" button (secondary)
- "Delete account" button (destructive/red)

Form styling: labels text-secondary, inputs bg #111113 border #2A2A2E, section headers text-lg font-medium.
```

---

## Prompt 11: Mobile Quick View (Responsive)

```
Create a mobile responsive version (375px width) of the personal productivity dashboard. Dark mode.

Layout: Full screen, no sidebar.

Top bar:
- Hamburger menu (left)
- "Command" app name (center)
- Search icon (right, opens command bar)

Content (scrollable):

1. Greeting: "Good morning" + date

2. Quick Add: Full-width input "New task..." with + icon

3. "Today" section:
   - 3 todo items with checkboxes and priority dots
   - Compact, no project tags (save space)

4. "Inbox" card:
   - "5 items" with "→" arrow to navigate

5. "Projects" horizontal scroll:
   - Small cards: color dot + name + task count
   - Scrollable horizontally

Bottom tab bar:
- 4 tabs: Dashboard / Inbox / Tasks / Projects
- Active tab: blue icon + text
- Inactive: gray icon

Compact design, touch-friendly (44pt minimum targets).
Everything in dark mode (#0A0A0B bg, #111113 cards).
```

---

## Usage Instructions

### v0.dev에서 사용하는 방법

1. **v0.dev** (https://v0.dev) 에 접속
2. 각 프롬프트를 순서대로 입력
3. 생성된 결과가 마음에 들 때까지 "refine" 요청
4. 마음에 드는 결과를 다음 방법으로 활용:
   - **코드로 직접 사용**: v0가 생성한 React + Tailwind 코드를 프로젝트에 복사
   - **Figma로 변환**: 스크린샷을 Figma에 임포트하여 디자인 시스템 구축
   - **참고 자료로 활용**: 실제 구현 시 비주얼 가이드로 참조

### 프롬프트 순서 권장

```
0. Design System → 색상/타이포/기본 컴포넌트 확립
1. App Shell → 전체 레이아웃 뼈대
2. Command Bar → 글로벌 오버레이
3. Dashboard → 메인 페이지
4. Inbox → 두 번째 핵심 페이지
5. All Tasks → 세 번째 핵심 페이지
6. Task Detail → 사이드 패널
7. Project Detail (Ideas) → 프로젝트 핵심 탭
8. Project Builds → 개발자 전용 기능
9. Build Modal → 빌드 생성 플로우
10. Settings → 설정 페이지
11. Mobile View → 반응형 확인
```

### 커스터마이징 팁

- v0가 생성한 결과가 너무 밝으면: "Make it darker, use #0A0A0B as the main background"
- 너무 복잡하면: "Simplify, reduce visual elements, more whitespace"
- Linear 느낌이 부족하면: "More Linear-app inspired, minimal borders, subtle gradients"
- 한글이 필요하면: "Use Korean text for labels and sample data"
