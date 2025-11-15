# Todo App - Hierarchical Workspace Task Manager

A modern, collaborative task management application built with Next.js 14, TypeScript, and Supabase. Features hierarchical organization with workspaces, sections, and tasks, designed for teams and individuals who need powerful task organization.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/todo-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

## ✨ Features

### 🚀 Core Functionality
- **Hierarchical Organization**: Workspaces → Sections → Tasks
- **Real-time Collaboration**: Live updates across team members
- **Advanced Search**: Full-text search with filtering and faceting
- **Task Management**: Priority levels, due dates, assignments, tags
- **Activity Tracking**: Comprehensive audit trail and activity feeds
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### 🎨 User Experience
- **Material Design**: Clean, modern interface with macOS-inspired aesthetics
- **Dark/Light Theme**: Automatic system detection with manual override
- **Keyboard Navigation**: Full keyboard accessibility support
- **Performance Optimized**: Code splitting, lazy loading, and image optimization
- **Progressive Web App**: Install as native app on any device

### ♿ Accessibility
- **WCAG 2.1 AA Compliant**: Full accessibility support
- **Screen Reader Optimized**: Semantic HTML and ARIA labels
- **Keyboard Navigation**: Complete keyboard-only operation
- **High Contrast Mode**: Enhanced visibility options
- **Focus Management**: Proper focus flow and indicators

### 🔧 Technical Excellence
- **TypeScript Strict Mode**: Type-safe development
- **Container-Presenter Pattern**: Clean architecture separation
- **Comprehensive Testing**: Unit, integration, and E2E tests
- **Error Monitoring**: Global error handling and reporting
- **Performance Monitoring**: Web Vitals and real-time metrics

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **UI Library**: [Material-UI](https://mui.com/) with custom theming
- **State Management**: [React Query](https://tanstack.com/query) + React Context
- **Styling**: CSS-in-JS with Material-UI's emotion

### Backend
- **API**: Next.js API Routes
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage

### Development & Deployment
- **Build Tool**: Next.js built-in bundler with SWC
- **Testing**: Jest, React Testing Library, Cypress
- **Linting**: ESLint with TypeScript integration
- **Formatting**: Prettier
- **CI/CD**: GitHub Actions
- **Deployment**: [Vercel](https://vercel.com/)
- **Monitoring**: Built-in analytics and error tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/todo-app.git
   cd todo-app
   ```

2. **Install dependencies**:
   ```bash
   npm ci
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up the database**:
   ```bash
   # Apply database migrations
   cd database
   # Run migrations in order (see DEVELOPMENT.md for details)
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[User Guide](./docs/USER_GUIDE.md)** - Complete user manual with screenshots
- **[API Documentation](./docs/API.md)** - REST API reference and examples
- **[Development Guide](./docs/DEVELOPMENT.md)** - Setup, architecture, and contribution guidelines
- **[Component Storybook](./docs/STORYBOOK.md)** - Component catalog and usage patterns

## 🏗 Architecture

### Container-Presenter Pattern

Every component follows a strict separation of concerns:

```typescript
// Container (Business Logic)
export const useTaskCard = (taskId: string): UseTaskCardReturn => {
  // All state management, API calls, and side effects
  const [task, setTask] = useState<Task | null>(null);
  
  const handleStatusChange = useCallback(async (status: TaskStatus) => {
    // API interaction logic
  }, []);

  return { task, loading, handleStatusChange };
};

// Presenter (Pure UI)
export const TaskCard: React.FC<TaskCardProps> = ({ taskId, className }) => {
  const { task, loading, handleStatusChange } = useTaskCard(taskId);
  
  return (
    <Card className={className}>
      {/* Pure UI rendering */}
    </Card>
  );
};
```

### Project Structure

```
todo-app/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Main application pages
│   └── globals.css        # Global styles
├── components/            # React components (Container-Presenter)
│   ├── Auth/              # Authentication components
│   ├── TaskCard/          # Task-related components
│   └── ...                # Feature-based organization
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── supabase/          # Database configuration
│   ├── auth/              # Authentication utilities
│   └── validation/        # Schema validation
├── types/                 # TypeScript definitions
├── database/              # Database schema and migrations
├── docs/                  # Comprehensive documentation
└── __tests__/             # Test files
```

## 🧪 Testing

The project includes comprehensive testing at multiple levels:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# All tests (CI)
npm run test:all
```

**Testing Stack**:
- **Unit Testing**: Jest + React Testing Library
- **Integration Testing**: API route testing with supertest
- **E2E Testing**: Cypress with real browser automation
- **Performance Testing**: Lighthouse CI

**Coverage Requirements**:
- Statements: 80%
- Branches: 75%  
- Functions: 85%
- Lines: 80%

## 🚀 Deployment

### Production Deployment (Vercel)

1. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Configure environment variables** in the Vercel dashboard

3. **Set up database migrations** for production

### Self-Hosted Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed deployment instructions.

## 🔧 Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run start           # Start production server

# Testing
npm run test            # Run unit tests
npm run test:watch      # Unit tests in watch mode
npm run test:e2e        # E2E tests
npm run test:all        # All tests

# Quality Assurance
npm run lint            # ESLint check
npm run type-check      # TypeScript check
npm run format          # Prettier format

# Analysis
npm run build:analyze   # Bundle size analysis
npm run lighthouse      # Performance audit
npm run security:audit  # Security vulnerability check

# Database
npm run migrate:prod    # Production migrations
npm run health-check    # Application health check
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./docs/DEVELOPMENT.md#contributing) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following our coding standards
4. Add tests for your changes
5. Run the test suite: `npm run test:all`
6. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
7. Push to your branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Coding Standards

- **TypeScript**: Strict mode, no `any` types
- **Testing**: Maintain 80%+ coverage
- **Commits**: Use [Conventional Commits](https://conventionalcommits.org/)
- **Architecture**: Follow Container-Presenter pattern
- **Accessibility**: WCAG 2.1 AA compliance

## 📊 Performance

The application is optimized for performance with:

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: All metrics in "Good" range
- **Bundle Size**: <500KB initial load
- **Time to Interactive**: <3 seconds on 3G

Performance is continuously monitored in production with automatic alerts for regressions.

## 🔒 Security

- **Authentication**: Secure JWT-based authentication via Supabase
- **Authorization**: Row-level security policies
- **Data Protection**: HTTPS everywhere, secure headers
- **Input Validation**: Server-side validation for all inputs
- **Dependency Monitoring**: Automated security updates via Dependabot

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

The application gracefully degrades in older browsers while maintaining core functionality.

## 📱 Mobile Support

- **Responsive Design**: Optimized for all screen sizes
- **Touch Interactions**: Native touch gestures
- **PWA Features**: Install as native app
- **Offline Support**: Basic offline functionality
- **Performance**: Optimized for mobile networks

## 🎯 Accessibility

This application is designed to be accessible to everyone:

- **WCAG 2.1 AA Compliant**: Meets international accessibility standards
- **Screen Reader Support**: Tested with NVDA, JAWS, and VoiceOver
- **Keyboard Navigation**: Full functionality without mouse
- **Color Contrast**: 4.5:1 minimum contrast ratio
- **Focus Management**: Logical focus flow and visible indicators

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

### Getting Help

- **Documentation**: Check our comprehensive docs in `/docs`
- **Issues**: [Create an issue](https://github.com/your-username/todo-app/issues) for bugs or feature requests
- **Discussions**: [Start a discussion](https://github.com/your-username/todo-app/discussions) for questions

### Community

- **Twitter**: [@todoapp](https://twitter.com/todoapp)
- **Discord**: [Join our community](https://discord.gg/todoapp)
- **Blog**: [todo-app.dev/blog](https://todo-app.dev/blog)

## 🔮 Roadmap

### Planned Features

- **Calendar Integration**: Google Calendar and Outlook sync
- **Time Tracking**: Built-in time tracking with reporting
- **Gantt Charts**: Project timeline visualization
- **Custom Fields**: User-defined task properties
- **Advanced Automation**: Workflow automation and triggers
- **Mobile Apps**: Native iOS and Android applications
- **API Webhooks**: Real-time event notifications
- **Advanced Analytics**: Team productivity insights

### Version 2.0 Goals

- **Multi-tenant Architecture**: Support for organizations
- **Advanced Permissions**: Fine-grained access control
- **White-label Solution**: Customizable branding
- **Enterprise Features**: SSO, audit logs, compliance tools

## 🎉 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [Material-UI](https://mui.com/) for the component library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Vercel](https://vercel.com/) for seamless deployment
- The open-source community for inspiration and contributions

---

**Made with ❤️ by the Todo App Team**

*Start organizing your work better today!*
