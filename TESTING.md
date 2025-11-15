# Testing Documentation

This document outlines the comprehensive testing strategy for the Todo application, including unit tests, integration tests, and end-to-end tests.

## Overview

Our testing suite includes:
- **Unit Tests**: Testing individual components, hooks, and utilities
- **Integration Tests**: Testing API routes and database operations
- **End-to-End Tests**: Testing complete user workflows
- **Performance Tests**: Testing application performance metrics
- **Accessibility Tests**: Testing WCAG compliance
- **Security Tests**: Testing for vulnerabilities

## Test Structure

```
__tests__/
├── components/          # Component unit tests
├── hooks/              # Hook unit tests
├── integration/        # Integration tests
│   └── api/           # API route tests
└── utils/             # Test utilities and mocks

cypress/
├── e2e/               # End-to-end tests
├── fixtures/          # Test data fixtures
└── support/           # Cypress support files
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### End-to-End Tests

```bash
# Open Cypress Test Runner
npm run test:e2e:open

# Run E2E tests headlessly
npm run test:e2e

# Run E2E tests with CI server
npm run test:e2e:ci

# Run all tests (unit + E2E)
npm run test:all
```

## Test Categories

### Unit Tests

#### Component Tests
- Test component rendering with various props
- Test user interactions and state changes
- Test error boundaries and loading states
- Test accessibility attributes
- Test responsive behavior

Example:
```typescript
describe('TaskCard Component', () => {
  it('should render task information correctly', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })
  
  it('should handle task completion', async () => {
    const onToggleComplete = jest.fn()
    render(<TaskCard task={mockTask} onToggleComplete={onToggleComplete} />)
    
    await user.click(screen.getByRole('checkbox'))
    expect(onToggleComplete).toHaveBeenCalledWith('task-1')
  })
})
```

#### Hook Tests
- Test state management and side effects
- Test error handling and edge cases
- Test API integration and data fetching
- Test custom hook behavior

Example:
```typescript
describe('useTaskCard', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTaskCard(mockProps))
    expect(result.current.state.isEditing).toBe(false)
  })
  
  it('should handle task updates', async () => {
    const { result } = renderHook(() => useTaskCard(mockProps))
    
    await act(async () => {
      await result.current.updateStatus('completed')
    })
    
    expect(mockOnUpdate).toHaveBeenCalledWith('task-1', { status: 'completed' })
  })
})
```

### Integration Tests

#### API Route Tests
- Test HTTP methods (GET, POST, PUT, DELETE)
- Test authentication and authorization
- Test request validation and error handling
- Test database operations
- Test concurrent operations and race conditions

Example:
```typescript
describe('/api/tasks/[id]', () => {
  it('should update task successfully', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      query: { id: 'task-1' },
      body: { title: 'Updated Task' }
    })
    
    await taskHandler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.data.title).toBe('Updated Task')
  })
})
```

#### Database Integration Tests
- Test data persistence and retrieval
- Test database constraints and validations
- Test transaction handling
- Test search functionality

### End-to-End Tests

#### Authentication Flow
- User login and logout
- OAuth integration
- Session persistence
- Protected route access
- Error handling

#### Task Management
- Task creation, editing, deletion
- Task status and priority changes
- Task assignment and due dates
- Drag and drop functionality
- Bulk operations

#### Search Functionality
- Spotlight search modal
- Search suggestions and filters
- Keyboard navigation
- Search performance

Example:
```typescript
describe('Task Management Flow', () => {
  it('should create a new task', () => {
    cy.login('test@example.com', 'password')
    cy.visit('/dashboard')
    
    cy.get('[data-testid="create-task-button"]').click()
    cy.get('[data-testid="task-title-input"]').type('New Task')
    cy.get('[data-testid="save-task-button"]').click()
    
    cy.contains('New Task').should('be.visible')
  })
})
```

## Test Utilities

### Test Helpers
- `renderWithProviders`: Renders components with necessary providers
- `createTestQueryClient`: Creates a configured React Query client for testing
- `mockHandlers`: MSW request handlers for API mocking
- `mockUser`, `mockWorkspace`, `mockTask`: Mock data objects

### Custom Commands (Cypress)
- `cy.login()`: Authenticate user
- `cy.createWorkspace()`: Create test workspace
- `cy.createSection()`: Create test section
- `cy.createTask()`: Create test task
- `cy.clearTestData()`: Clean up test data

## Coverage Requirements

### Coverage Thresholds
- **Global**: 80% lines, 80% statements, 75% branches, 80% functions
- **Components**: 85% lines, 85% statements, 80% branches, 85% functions
- **Hooks**: 90% lines, 90% statements, 85% branches, 90% functions
- **Library Code**: 85% lines, 85% statements, 80% branches, 85% functions
- **API Routes**: 80% lines, 80% statements, 75% branches, 80% functions

### Coverage Reports
- Terminal output with summary
- HTML report at `coverage/lcov-report/index.html`
- LCOV format for CI integration
- JSON summary for programmatic access

## Best Practices

### Unit Testing
- Follow the AAA pattern (Arrange, Act, Assert)
- Test behavior, not implementation details
- Use descriptive test names
- Test error conditions and edge cases
- Mock external dependencies appropriately

### Integration Testing
- Test API contracts and data flow
- Verify database operations and constraints
- Test error handling and status codes
- Use realistic test data
- Test concurrent operations

### E2E Testing
- Test critical user journeys
- Use page object model for reusability
- Implement proper waits and assertions
- Test on different viewport sizes
- Handle flaky tests with retries

### General Guidelines
- Write tests before or alongside code (TDD/BDD)
- Keep tests simple and focused
- Avoid testing third-party libraries
- Use factories for test data generation
- Maintain test independence and isolation

## CI/CD Integration

### GitHub Actions
- Automated test execution on push/PR
- Parallel test execution for performance
- Coverage reporting and enforcement
- Security vulnerability scanning
- Performance and accessibility testing

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No high/critical security vulnerabilities
- Performance budgets must be maintained
- Accessibility standards must be met

## Performance Testing

### Lighthouse CI
- Core Web Vitals monitoring
- Performance budget enforcement
- Accessibility score validation
- Best practices compliance
- SEO optimization checks

### Load Testing
- API endpoint stress testing
- Database performance monitoring
- Search functionality performance
- Large dataset handling

## Accessibility Testing

### Automated Testing
- axe-core integration for WCAG compliance
- Color contrast validation
- Keyboard navigation testing
- Screen reader compatibility
- ARIA attributes validation

### Manual Testing
- Screen reader testing
- Keyboard-only navigation
- High contrast mode testing
- Zoom level testing (up to 200%)
- Voice control testing

## Security Testing

### Vulnerability Scanning
- NPM audit for dependency vulnerabilities
- Trivy filesystem scanning
- OWASP security testing
- Input validation testing
- Authentication and authorization testing

### Static Analysis
- Code quality scanning
- Security linting rules
- Dependency vulnerability alerts
- License compliance checking

## Troubleshooting

### Common Issues

#### Test Failures
- Check mock data consistency
- Verify async operation handling
- Ensure proper cleanup between tests
- Check for timing issues in E2E tests

#### Coverage Issues
- Identify untested code paths
- Add missing test cases
- Remove dead code
- Update coverage thresholds if needed

#### E2E Test Flakiness
- Add proper wait conditions
- Use data-testid attributes consistently
- Avoid hardcoded timeouts
- Implement retry mechanisms

#### Performance Test Failures
- Check bundle size increases
- Monitor Core Web Vitals
- Optimize images and assets
- Review code splitting strategy

## Monitoring and Reporting

### Test Metrics
- Test execution time
- Test failure rates
- Coverage trends
- Flaky test identification

### Performance Metrics
- Core Web Vitals tracking
- Bundle size monitoring
- API response time tracking
- Database query performance

### Quality Metrics
- Code quality scores
- Security vulnerability counts
- Accessibility compliance scores
- Test coverage percentages

## Future Improvements

- Visual regression testing with Percy or Chromatic
- Contract testing with Pact
- Property-based testing with fast-check
- Mutation testing with Stryker
- Cross-browser testing with BrowserStack
- Mobile device testing
- Internationalization testing
- Database migration testing