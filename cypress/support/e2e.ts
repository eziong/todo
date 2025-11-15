// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user
       * @example cy.login('user@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Custom command to create a test workspace
       * @example cy.createWorkspace('Test Workspace')
       */
      createWorkspace(name: string): Chainable<void>
      
      /**
       * Custom command to create a test section
       * @example cy.createSection('Test Section', workspaceId)
       */
      createSection(name: string, workspaceId: string): Chainable<void>
      
      /**
       * Custom command to create a test task
       * @example cy.createTask('Test Task', sectionId)
       */
      createTask(title: string, sectionId: string): Chainable<void>
      
      /**
       * Custom command to clear test data
       * @example cy.clearTestData()
       */
      clearTestData(): Chainable<void>
      
      /**
       * Custom command to wait for page load
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>
    }
  }
}