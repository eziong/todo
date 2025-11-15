import { setupServer } from 'msw/node'
import { handlers } from './mock-handlers'

// Setup mock service worker server for testing
export const server = setupServer(...handlers)