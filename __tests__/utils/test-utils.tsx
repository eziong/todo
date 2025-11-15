import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { SpotlightSearchProvider } from '@/components/SpotlightSearch/SpotlightSearchProvider'
import { theme } from '@/theme/utils'
import { User } from '@supabase/supabase-js'

// Mock user data
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    firstName: 'Test',
    lastName: 'User',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
  role: 'authenticated',
}

// Mock workspace data
export const mockWorkspace = {
  id: 'test-workspace-id',
  name: 'Test Workspace',
  description: 'A test workspace',
  color: '#2563eb',
  iconType: 'emoji' as const,
  iconValue: '🏢',
  ownerId: 'test-user-id',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

// Mock section data
export const mockSection = {
  id: 'test-section-id',
  workspaceId: 'test-workspace-id',
  name: 'Test Section',
  description: 'A test section',
  position: 0,
  color: '#10b981',
  isArchived: false,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

// Mock task data
export const mockTask = {
  id: 'test-task-id',
  sectionId: 'test-section-id',
  title: 'Test Task',
  description: 'A test task description',
  status: 'todo' as const,
  priority: 'medium' as const,
  assigneeId: null,
  dueDate: null,
  position: 0,
  isArchived: false,
  tags: [],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  createdBy: 'test-user-id',
}

// Create a test query client
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  })
}

// Test wrapper component
interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
  user?: User | null
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  queryClient = createTestQueryClient(),
  user = mockUser,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SpotlightSearchProvider>
            {children}
          </SpotlightSearchProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  user?: User | null
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, user, ...renderOptions } = options
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders queryClient={queryClient} user={user}>
      {children}
    </AllTheProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { renderWithProviders as render }