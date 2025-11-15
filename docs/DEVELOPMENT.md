# Development Setup Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Code Style & Guidelines](#code-style--guidelines)
7. [Deployment](#deployment)
8. [Architecture Overview](#architecture-overview)
9. [Contributing](#contributing)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher (or yarn v3.0+)
- **Git**: Latest version
- **VS Code**: Recommended editor

### Recommended VS Code Extensions

Install these extensions for the best development experience:

```bash
# Install via command palette (Cmd/Ctrl + Shift + P) → "Extensions: Install Extensions"
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- GitLens
- Thunder Client (for API testing)
- Jest Runner
- Tailwind CSS IntelliSense
```

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/todo-app.git
cd todo-app
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

```env
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_NAME=Todo App
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional: Analytics & Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_WEB_VITALS_TRACKING=true

# Optional: Development Features
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### 4. Start Development Server

```bash
npm run dev
```

Your application will be available at [http://localhost:3000](http://localhost:3000).

---

## Database Setup

### Supabase Setup

1. **Create a Supabase Project**
   - Visit [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Migrations**
   ```bash
   cd database
   # Apply migrations in order
   psql -h your-host -U postgres -d your-db -f migrations/001_initial_schema.sql
   psql -h your-host -U postgres -d your-db -f migrations/002_indexes_and_functions.sql
   # ... continue with all migration files
   ```

3. **Set Up Row Level Security (RLS)**
   The migrations include RLS policies. Verify they're enabled in the Supabase dashboard.

4. **Configure Authentication**
   - Go to Authentication → Settings
   - Configure your authentication providers
   - Set up email templates

### Local Database (Alternative)

For local development, you can use Supabase CLI:

```bash
# Install Supabase CLI
npm install supabase -g

# Initialize local project
supabase init

# Start local development setup
supabase start

# Apply migrations
supabase db reset
```

---

## Development Workflow

### Project Structure

```
todo-app/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Auth/              # Authentication components
│   ├── TaskCard/          # Task-related components
│   └── ...                # Other feature components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase configuration
│   ├── auth/              # Authentication utilities
│   └── validation/        # Form validation schemas
├── types/                 # TypeScript type definitions
├── database/              # Database schema and migrations
├── docs/                  # Documentation
└── __tests__/             # Test files
```

### Container-Presenter Pattern

This project follows a strict container-presenter architecture:

**Container (Custom Hook)**:
```typescript
// useTaskCard.ts
export const useTaskCard = (taskId: string): UseTaskCardReturn => {
  // All business logic, state management, and side effects
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  
  // API calls, event handlers, etc.
  const handleStatusChange = useCallback(async (status: TaskStatus) => {
    // Implementation
  }, []);

  return {
    task,
    loading,
    handleStatusChange
  };
};
```

**Presenter (React Component)**:
```typescript
// TaskCard.tsx
interface TaskCardProps {
  taskId: string;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ taskId, className }) => {
  const { task, loading, handleStatusChange } = useTaskCard(taskId);
  
  // Pure UI rendering only - no business logic
  return (
    <Card className={className}>
      {/* UI implementation */}
    </Card>
  );
};
```

### Creating New Components

1. **Create the directory structure**:
   ```bash
   mkdir components/NewComponent
   cd components/NewComponent
   ```

2. **Create the container hook**:
   ```bash
   touch useNewComponent.ts
   ```

3. **Create the presenter component**:
   ```bash
   touch NewComponent.tsx
   ```

4. **Create the index file**:
   ```bash
   touch index.ts
   ```

5. **Follow TypeScript strict mode**:
   - Define interfaces for all props, state, and return types
   - Never use `any` type
   - Use explicit typing throughout

### Code Generation Snippets

Add these to your VS Code snippets for faster development:

```json
{
  "Container Hook": {
    "prefix": "hook-container",
    "body": [
      "interface Use${1:ComponentName}Return {",
      "  // Define return interface",
      "}",
      "",
      "export const use${1:ComponentName} = (): Use${1:ComponentName}Return => {",
      "  // All business logic, state, and side effects here",
      "  return {",
      "    // Return values",
      "  };",
      "};"
    ]
  },
  "Presenter Component": {
    "prefix": "component-presenter",
    "body": [
      "interface ${1:ComponentName}Props {",
      "  className?: string;",
      "}",
      "",
      "export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ className }) => {",
      "  const containerProps = use${1:ComponentName}();",
      "  ",
      "  return (",
      "    <div className={className}>",
      "      {/* UI implementation */}",
      "    </div>",
      "  );",
      "};"
    ]
  }
}
```

---

## Testing

### Testing Strategy

The project uses multiple testing layers:

1. **Unit Tests**: Jest + React Testing Library
2. **Integration Tests**: API route testing
3. **E2E Tests**: Cypress
4. **Performance Tests**: Lighthouse CI

### Running Tests

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# Test coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests in dev mode
npm run test:e2e:open

# All tests (CI)
npm run test:all
```

### Writing Tests

**Component Testing Example**:
```typescript
// __tests__/components/TaskCard/TaskCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/TaskCard';

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard taskId="123" />);
    expect(screen.getByText('Sample Task')).toBeInTheDocument();
  });

  it('handles status change', async () => {
    render(<TaskCard taskId="123" />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    // Add assertions
  });
});
```

**Hook Testing Example**:
```typescript
// __tests__/hooks/useTaskCard.test.ts
import { renderHook } from '@testing-library/react';
import { useTaskCard } from '@/components/TaskCard/useTaskCard';

describe('useTaskCard', () => {
  it('loads task data', async () => {
    const { result, waitFor } = renderHook(() => useTaskCard('123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.task).toBeDefined();
    });
  });
});
```

### Test Coverage Requirements

Maintain minimum coverage thresholds:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 85%
- **Lines**: 80%

Coverage is enforced in CI and can be checked with:
```bash
npm run test:coverage
```

---

## Code Style & Guidelines

### TypeScript Guidelines

1. **Strict Mode**: Always use TypeScript strict mode
2. **No Any**: Never use `any` type - define proper interfaces
3. **Explicit Typing**: Always specify return types for functions
4. **Interface Naming**: Use descriptive interface names

**Good Examples**:
```typescript
// Interface definitions
interface TaskData {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: Date;
}

// Function with explicit typing
const processTask = (task: TaskData): Promise<TaskData> => {
  // Implementation
};

// Hook return interface
interface UseTaskReturn {
  task: TaskData | null;
  loading: boolean;
  error: string | null;
  updateTask: (updates: Partial<TaskData>) => Promise<void>;
}
```

### Component Guidelines

1. **Functional Components**: Never use class components
2. **Container-Presenter**: Strict separation of concerns
3. **Props Interface**: Always define props interfaces
4. **Default Props**: Use default parameters instead of defaultProps

### ESLint & Prettier

The project uses ESLint and Prettier for code quality:

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix

# Format code with Prettier
npm run format
```

### Pre-commit Hooks

Git hooks automatically run before commits:
- ESLint check
- Type checking
- Test runner
- Prettier formatting

To bypass hooks (not recommended):
```bash
git commit --no-verify
```

---

## Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Configure Environment Variables**:
   Set production environment variables in Vercel dashboard.

3. **Automatic Deployments**:
   - Push to `main` branch triggers production deployment
   - Pull requests create preview deployments
   - Environment-specific configurations

### Build Process

```bash
# Production build
npm run build

# Start production server
npm run start

# Analyze bundle size
npm run build:analyze
```

### Performance Monitoring

- **Lighthouse CI**: Runs on every deployment
- **Web Vitals**: Automatically tracked in production
- **Error Monitoring**: Sentry integration (optional)

---

## Architecture Overview

### Technology Stack

**Frontend**:
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Material-UI**: Component library with macOS styling
- **React Query**: Server state management

**Backend**:
- **Next.js API Routes**: Server-side endpoints
- **Supabase**: PostgreSQL database with real-time features
- **Authentication**: Supabase Auth

**Development**:
- **Jest**: Unit testing framework
- **Cypress**: E2E testing
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Design Patterns

1. **Container-Presenter**: Separation of business logic and UI
2. **Custom Hooks**: Reusable stateful logic
3. **Compound Components**: Complex component composition
4. **Error Boundaries**: Graceful error handling

### State Management

- **Server State**: React Query for API data
- **Client State**: React hooks for local state
- **Form State**: React Hook Form for complex forms
- **Global State**: Context API for app-wide state

### Authentication Flow

1. User logs in via Supabase Auth
2. JWT token stored in HTTP-only cookie
3. Middleware validates token on protected routes
4. Client-side auth state managed via Context

---

## Contributing

### Contribution Workflow

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```
3. **Make your changes**
4. **Write tests**
5. **Run the test suite**:
   ```bash
   npm run test:all
   ```
6. **Commit your changes**:
   ```bash
   git commit -m "feat: add new feature"
   ```
7. **Push to your fork**
8. **Create a Pull Request**

### Commit Message Convention

Use conventional commits:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation updates
- `style:` code formatting
- `refactor:` code restructuring
- `test:` test additions
- `chore:` maintenance tasks

### Pull Request Guidelines

- Include a clear description of changes
- Add screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed
- Link related issues

---

## Troubleshooting

### Common Issues

**Node.js Version Issues**:
```bash
# Use Node Version Manager
nvm use 18
nvm install 18.17.0
```

**Dependency Issues**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Database Connection Issues**:
- Verify environment variables
- Check Supabase project status
- Confirm network connectivity

**Build Failures**:
- Check TypeScript errors: `npx tsc --noEmit`
- Verify ESLint: `npm run lint`
- Clear Next.js cache: `rm -rf .next`

### Development Tools

**Database Tools**:
- Supabase Dashboard
- pgAdmin (for direct database access)
- DBeaver (cross-platform DB client)

**API Testing**:
- Thunder Client (VS Code extension)
- Postman
- curl commands

**Debugging**:
- React Developer Tools
- Redux DevTools (if using Redux)
- Network tab in browser DevTools

### Getting Help

**Internal Resources**:
- Team Slack channel
- Internal documentation wiki
- Code review feedback

**External Resources**:
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Material-UI Documentation](https://mui.com)

---

## Performance Guidelines

### Optimization Checklist

- [ ] Use Next.js Image optimization
- [ ] Implement proper code splitting
- [ ] Minimize bundle size
- [ ] Use React.memo for expensive components
- [ ] Implement proper error boundaries
- [ ] Add loading states for async operations
- [ ] Optimize database queries
- [ ] Use proper caching strategies

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# Check for unused dependencies
npx depcheck
```

---

*Last updated: [Current Date]*
*For questions, contact the development team or create an issue.*