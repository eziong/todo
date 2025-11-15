// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.waitForPageLoad()
  
  cy.get('[data-testid="email-input"]', { timeout: 10000 })
    .should('be.visible')
    .type(email)
    
  cy.get('[data-testid="password-input"]')
    .should('be.visible')
    .type(password)
    
  cy.get('[data-testid="login-submit"]')
    .should('be.visible')
    .click()
    
  // Wait for successful login redirect
  cy.url().should('not.include', '/login')
  cy.get('[data-testid="user-menu"]', { timeout: 15000 }).should('exist')
})

// Create workspace command
Cypress.Commands.add('createWorkspace', (name: string) => {
  cy.get('[data-testid="create-workspace-button"]')
    .should('be.visible')
    .click()
    
  cy.get('[data-testid="workspace-name-input"]')
    .should('be.visible')
    .type(name)
    
  cy.get('[data-testid="create-workspace-submit"]')
    .should('be.visible')
    .click()
    
  // Wait for workspace to be created
  cy.contains(name).should('be.visible')
})

// Create section command
Cypress.Commands.add('createSection', (name: string, workspaceId: string) => {
  cy.visit(`/workspace/${workspaceId}`)
  cy.waitForPageLoad()
  
  cy.get('[data-testid="create-section-button"]')
    .should('be.visible')
    .click()
    
  cy.get('[data-testid="section-name-input"]')
    .should('be.visible')
    .type(name)
    
  cy.get('[data-testid="create-section-submit"]')
    .should('be.visible')
    .click()
    
  // Wait for section to be created
  cy.contains(name).should('be.visible')
})

// Create task command
Cypress.Commands.add('createTask', (title: string, sectionId: string) => {
  cy.get(`[data-testid="section-${sectionId}"] [data-testid="add-task-button"]`)
    .should('be.visible')
    .click()
    
  cy.get('[data-testid="task-title-input"]')
    .should('be.visible')
    .type(title)
    
  cy.get('[data-testid="create-task-submit"]')
    .should('be.visible')
    .click()
    
  // Wait for task to be created
  cy.contains(title).should('be.visible')
})

// Clear test data command
Cypress.Commands.add('clearTestData', () => {
  // This would typically clear test database
  // For now, we'll just ensure we're logged out
  cy.visit('/login')
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
})

// Wait for page load command
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible')
  cy.get('[data-testid="loading"]').should('not.exist')
  
  // Wait for any initial queries to complete
  cy.wait(1000)
})

// Prevent TypeScript errors
export {}