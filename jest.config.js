const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Module name mapping for path aliases
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/**/?(*.)(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/index.ts', // barrel exports
    '!**/demo.tsx', // demo files
  ],
  
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: 'coverage',
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './components/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './hooks/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './lib/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './app/api/': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Transform configuration for CSS and other assets
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)