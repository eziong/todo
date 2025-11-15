# Todo App User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Workspaces](#workspaces)
3. [Sections](#sections)
4. [Tasks](#tasks)
5. [Collaboration](#collaboration)
6. [Search & Organization](#search--organization)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Mobile Usage](#mobile-usage)
9. [Accessibility](#accessibility)
10. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

Welcome to Todo App! This guide will help you get started with organizing your tasks and collaborating with your team.

### Creating an Account

1. Navigate to the [login page](https://your-app.vercel.app/login)
2. Click "Sign up" if you're new to Todo App
3. Enter your email address and create a secure password
4. Verify your email address through the confirmation link
5. Complete your profile setup

### Your First Workspace

When you first log in, you'll be prompted to create your first workspace:

1. Click "Create Workspace" on the dashboard
2. Enter a name for your workspace (e.g., "Personal Projects" or "Team Alpha")
3. Add an optional description
4. Choose a color theme
5. Click "Create" to set up your workspace

---

## Workspaces

Workspaces are the top-level organization structure in Todo App. Think of them as project containers where you can organize related work.

### Creating a Workspace

**From the Dashboard:**
1. Click the "+" button in the sidebar
2. Select "New Workspace"
3. Fill in the workspace details:
   - **Name**: Choose a descriptive name
   - **Description**: Optional context about the workspace
   - **Color**: Pick a color for easy identification
4. Click "Create Workspace"

### Workspace Settings

To access workspace settings:
1. Click on the workspace name in the sidebar
2. Select "Settings" from the dropdown menu

**Available settings:**
- Workspace name and description
- Color theme
- Member permissions
- Notification preferences
- Archive/delete workspace

### Managing Multiple Workspaces

You can switch between workspaces using:
- The workspace dropdown in the sidebar
- Keyboard shortcut: `Cmd/Ctrl + Shift + W`

---

## Sections

Sections help you organize tasks within a workspace. Common section names include "To Do," "In Progress," "Review," and "Done."

### Creating Sections

1. In your workspace, click "Add Section" or the "+" icon
2. Enter a section name
3. Choose a position (sections can be reordered later)
4. Select an optional color
5. Click "Create Section"

### Section Management

**Reordering Sections:**
- Drag and drop sections to reorder them
- Use the arrow buttons in section headers
- Keyboard navigation with arrow keys

**Section Actions:**
- **Edit**: Click the section name to rename
- **Archive**: Hide completed sections
- **Delete**: Remove empty sections

### Best Practices for Sections

- Keep section names short and clear
- Use a consistent workflow (e.g., To Do → In Progress → Review → Done)
- Limit to 3-6 sections for optimal productivity
- Archive completed sections periodically

---

## Tasks

Tasks are the core of Todo App. Each task represents a specific piece of work to be completed.

### Creating Tasks

**Quick Add:**
1. Click "Add Task" in any section
2. Enter the task title
3. Press Enter to create
4. Click the task to add more details

**Detailed Creation:**
1. Click "Add Task" and select "Add with Details"
2. Fill in the task form:
   - **Title**: Clear, actionable description
   - **Description**: Additional context and details
   - **Priority**: Low, Medium, High, or Critical
   - **Due Date**: Optional deadline
   - **Assignee**: Team member responsible
   - **Tags**: For categorization and filtering

### Task Properties

**Title and Description:**
- Keep titles concise but descriptive
- Use the description for detailed requirements
- Support for Markdown formatting in descriptions

**Priority Levels:**
- 🔴 **Critical**: Urgent, blocks other work
- 🟠 **High**: Important, significant impact
- 🟡 **Medium**: Standard priority
- 🔵 **Low**: Nice to have, non-urgent

**Due Dates:**
- Set realistic deadlines
- Tasks with approaching due dates are highlighted
- Overdue tasks appear in red

**Tags:**
- Use tags for categorization (#frontend, #bug, #enhancement)
- Filter tasks by tags
- Create custom tag categories

### Task Actions

**Moving Tasks:**
- Drag and drop between sections
- Use the "Move" option in the task menu
- Keyboard shortcuts: `Cmd/Ctrl + M`

**Editing Tasks:**
- Click on task title to edit inline
- Click anywhere else on the task for full editor
- Use `Cmd/Ctrl + Enter` to save quickly

**Task Status:**
- Mark complete with the checkbox
- Archive completed tasks
- Restore archived tasks if needed

**Other Actions:**
- **Duplicate**: Create a copy of the task
- **Archive**: Remove from active view
- **Delete**: Permanently remove
- **Share**: Get a shareable link

---

## Collaboration

Todo App is designed for team collaboration with powerful sharing and communication features.

### Adding Team Members

1. Go to Workspace Settings
2. Click "Members" tab
3. Click "Invite Member"
4. Enter email addresses (one per line)
5. Select permission level:
   - **Admin**: Full access including member management
   - **Member**: Can create/edit tasks and sections
   - **Viewer**: Read-only access
6. Click "Send Invitations"

### Member Roles

**Workspace Admin:**
- Add/remove members
- Modify workspace settings
- Archive/delete workspace
- All member permissions

**Member:**
- Create/edit/delete tasks
- Create/edit sections
- Assign tasks
- Comment on tasks

**Viewer:**
- View tasks and sections
- Add comments
- Cannot modify content

### Task Assignment

1. Open the task you want to assign
2. Click on the "Assignee" field
3. Select a team member from the dropdown
4. The assignee will receive a notification

### Activity and Notifications

**Activity Feed:**
- View all workspace activity in the right panel
- See who did what and when
- Filter by activity type or team member

**Notification Settings:**
- Configure email notifications
- Real-time in-app notifications
- Mobile push notifications (if app installed)

---

## Search & Organization

Todo App provides powerful search and filtering capabilities to help you find and organize your work.

### Search Functionality

**Global Search:**
- Press `Cmd/Ctrl + K` to open search
- Search across all workspaces
- Results include tasks, sections, and workspaces

**Advanced Search:**
- Use filters to narrow results:
  - `assignee:john` - Tasks assigned to John
  - `priority:high` - High priority tasks
  - `due:today` - Tasks due today
  - `status:pending` - Incomplete tasks
  - `tag:frontend` - Tasks with frontend tag

### Filters and Views

**Quick Filters:**
- All Tasks
- My Tasks
- Due Today
- Overdue
- High Priority
- Recently Completed

**Custom Views:**
1. Apply filters to create a custom view
2. Click "Save View" to preserve the filter set
3. Access saved views from the sidebar

### Sorting Options

Sort tasks by:
- **Created Date**: Newest or oldest first
- **Due Date**: Soonest deadlines first
- **Priority**: Critical to low
- **Alphabetical**: A-Z or Z-A
- **Last Updated**: Recently modified first

---

## Keyboard Shortcuts

Master these shortcuts to work more efficiently:

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search |
| `Cmd/Ctrl + /` | Show keyboard shortcuts |
| `Cmd/Ctrl + Shift + W` | Switch workspaces |
| `Cmd/Ctrl + Shift + S` | Quick section jump |
| `Esc` | Close modals/cancel actions |

### Task Management

| Shortcut | Action |
|----------|--------|
| `T` | Create new task |
| `Enter` | Save task (when editing) |
| `Cmd/Ctrl + Enter` | Quick save and close |
| `Cmd/Ctrl + E` | Edit selected task |
| `Space` | Toggle task completion |
| `Del/Backspace` | Delete selected task |
| `Cmd/Ctrl + D` | Duplicate task |
| `Cmd/Ctrl + M` | Move task |

### Navigation

| Shortcut | Action |
|----------|--------|
| `↑/↓` | Navigate between tasks |
| `←/→` | Navigate between sections |
| `Tab` | Focus next element |
| `Shift + Tab` | Focus previous element |
| `Cmd/Ctrl + ↑` | Jump to workspace |
| `Cmd/Ctrl + ↓` | Jump to first task |

### Text Editing

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Bold text |
| `Cmd/Ctrl + I` | Italic text |
| `Cmd/Ctrl + U` | Underline text |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Y` | Redo |

---

## Mobile Usage

Todo App is optimized for mobile devices with a responsive design and touch-friendly interface.

### Mobile App Features

**Installation:**
- Install as a Progressive Web App (PWA)
- Add to home screen on iOS/Android
- Works offline with sync when connected

**Touch Gestures:**
- **Swipe left** on task: Quick actions menu
- **Swipe right** on task: Mark complete
- **Long press**: Context menu
- **Pull to refresh**: Update content

**Mobile-Specific Features:**
- Push notifications
- Camera integration for attachments
- Location-based reminders
- Voice input for task creation

### Offline Usage

- View and edit tasks offline
- Changes sync when connection restored
- Offline indicator shows sync status
- Conflict resolution for simultaneous edits

---

## Accessibility

Todo App is designed to be accessible to all users, including those using assistive technologies.

### Screen Reader Support

- Full screen reader compatibility
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support

### Visual Accessibility

- High contrast mode available
- Customizable text size
- Color-blind friendly design
- Focus indicators for keyboard navigation

### Keyboard Navigation

- Complete keyboard accessibility
- Tab order follows logical flow
- Skip links for main content
- Keyboard shortcuts for common actions

### Accessibility Settings

Access accessibility options in:
1. User Profile → Settings
2. Accessibility tab
3. Configure:
   - Reduced motion
   - High contrast
   - Large text
   - Screen reader optimizations

---

## Tips & Best Practices

### Task Management Best Practices

**Writing Good Tasks:**
- Use action verbs ("Complete," "Review," "Design")
- Be specific about outcomes
- Include acceptance criteria in descriptions
- Set realistic due dates

**Organization Strategies:**
- Use consistent naming conventions
- Batch similar tasks together
- Review and update priorities regularly
- Archive completed work periodically

### Team Collaboration Tips

**Communication:**
- Use task comments for context-specific discussions
- @mention team members for notifications
- Keep status updates in task descriptions
- Use workspace activity feed for team awareness

**Workflow Optimization:**
- Establish clear section meanings
- Define "done" criteria for each section
- Regular team reviews of workflow efficiency
- Use tags consistently across the team

### Productivity Tips

**Daily Workflow:**
1. Review "My Tasks" view each morning
2. Update task status as work progresses
3. Add new tasks as they arise
4. End day by reviewing completed work

**Weekly Reviews:**
- Review completed tasks for insights
- Update project timelines and priorities
- Archive old completed tasks
- Plan upcoming week's priorities

**Avoiding Overwhelm:**
- Limit work-in-progress tasks
- Break large tasks into smaller ones
- Use priority levels effectively
- Don't over-assign team members

---

## Getting Help

### Support Resources

**Documentation:**
- User Guide (this document)
- API Documentation
- Video tutorials
- FAQ section

**Community:**
- User forum
- Feature requests
- Tips and tricks sharing
- Community templates

**Direct Support:**
- Email support: support@todoapp.com
- Live chat during business hours
- Submit bug reports
- Feature request portal

### Troubleshooting

**Common Issues:**
- Login problems: Check email verification
- Sync issues: Refresh browser/app
- Permission errors: Contact workspace admin
- Missing data: Check archived items

**Performance Tips:**
- Close unused browser tabs
- Clear browser cache occasionally
- Update to latest app version
- Check internet connection stability

---

## What's Next?

**Advanced Features to Explore:**
- Custom templates for recurring projects
- Integration with external tools
- Advanced reporting and analytics
- Automation workflows

**Stay Updated:**
- Follow our blog for new features
- Join our newsletter for tips and updates
- Participate in user research sessions
- Provide feedback to help us improve

---

*Last updated: [Current Date]*
*Version: 2.0*

For the most up-to-date information, visit our [online documentation](https://docs.todoapp.com).