describe('Task Management Flow', () => {
  beforeEach(() => {
    cy.clearTestData()
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
  })

  describe('Task Creation', () => {
    it('should create a new task', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      // Open task creation modal
      cy.get('[data-testid="create-task-button"]').click()
      cy.get('[data-testid="task-modal"]').should('be.visible')

      // Fill task details
      cy.get('[data-testid="task-title-input"]').type('New Test Task')
      cy.get('[data-testid="task-description-input"]').type('This is a test task description')
      
      // Set priority
      cy.get('[data-testid="task-priority-select"]').click()
      cy.get('[data-testid="priority-high"]').click()

      // Set due date
      cy.get('[data-testid="task-due-date-input"]').click()
      cy.get('[data-testid="date-picker-today"]').click()

      // Save task
      cy.get('[data-testid="save-task-button"]').click()

      // Verify task was created
      cy.get('[data-testid="task-modal"]').should('not.exist')
      cy.contains('New Test Task').should('be.visible')
      cy.get('[data-testid="task-priority-high"]').should('exist')
    })

    it('should validate required fields', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      cy.get('[data-testid="create-task-button"]').click()
      cy.get('[data-testid="save-task-button"]').click()

      // Should show validation errors
      cy.contains('Title is required').should('be.visible')
      cy.get('[data-testid="task-modal"]').should('be.visible')
    })

    it('should create task in specific section', () => {
      cy.createWorkspace('Test Workspace')
      cy.createSection('Test Section', 'workspace-1')

      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Click add task in specific section
      cy.get('[data-testid="section-test-section"] [data-testid="add-task-button"]').click()
      
      cy.get('[data-testid="task-title-input"]').type('Section-Specific Task')
      cy.get('[data-testid="save-task-button"]').click()

      // Verify task appears in correct section
      cy.get('[data-testid="section-test-section"]')
        .within(() => {
          cy.contains('Section-Specific Task').should('be.visible')
        })
    })

    it('should handle task creation errors', () => {
      cy.intercept('POST', '/api/sections/*/tasks', {
        statusCode: 500,
        body: { error: 'Failed to create task' }
      }).as('createTaskError')

      cy.visit('/dashboard')
      cy.waitForPageLoad()

      cy.get('[data-testid="create-task-button"]').click()
      cy.get('[data-testid="task-title-input"]').type('Failed Task')
      cy.get('[data-testid="save-task-button"]').click()

      cy.wait('@createTaskError')
      cy.contains('Failed to create task').should('be.visible')
    })
  })

  describe('Task Updates', () => {
    beforeEach(() => {
      cy.createWorkspace('Test Workspace')
      cy.createSection('Test Section', 'workspace-1')
      cy.createTask('Test Task', 'section-1')
    })

    it('should update task title inline', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Double-click to edit title inline
      cy.contains('Test Task').dblclick()
      cy.get('[data-testid="task-title-edit-input"]')
        .should('be.visible')
        .clear()
        .type('Updated Task Title')
        .type('{enter}')

      // Verify title was updated
      cy.contains('Updated Task Title').should('be.visible')
      cy.contains('Test Task').should('not.exist')
    })

    it('should update task status', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Click on task to open details
      cy.contains('Test Task').click()
      cy.get('[data-testid="task-modal"]').should('be.visible')

      // Change status
      cy.get('[data-testid="task-status-select"]').click()
      cy.get('[data-testid="status-in-progress"]').click()

      // Save changes
      cy.get('[data-testid="save-task-button"]').click()

      // Verify status changed
      cy.get('[data-testid="task-status-in-progress"]').should('exist')
    })

    it('should update task priority', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.contains('Test Task').click()
      cy.get('[data-testid="task-priority-select"]').click()
      cy.get('[data-testid="priority-urgent"]').click()
      cy.get('[data-testid="save-task-button"]').click()

      cy.get('[data-testid="task-priority-urgent"]').should('exist')
    })

    it('should assign task to user', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.contains('Test Task').click()
      cy.get('[data-testid="task-assignee-select"]').click()
      cy.get('[data-testid="assignee-current-user"]').click()
      cy.get('[data-testid="save-task-button"]').click()

      cy.get('[data-testid="task-assignee-avatar"]').should('be.visible')
    })

    it('should set due date', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.contains('Test Task').click()
      cy.get('[data-testid="task-due-date-input"]').click()
      cy.get('[data-testid="date-picker-tomorrow"]').click()
      cy.get('[data-testid="save-task-button"]').click()

      cy.get('[data-testid="task-due-date"]').should('be.visible')
    })

    it('should add task tags', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.contains('Test Task').click()
      cy.get('[data-testid="task-tags-input"]').type('urgent{enter}')
      cy.get('[data-testid="task-tags-input"]').type('frontend{enter}')
      cy.get('[data-testid="save-task-button"]').click()

      cy.get('[data-testid="task-tag-urgent"]').should('be.visible')
      cy.get('[data-testid="task-tag-frontend"]').should('be.visible')
    })

    it('should handle concurrent updates', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Simulate another user updating the task
      cy.intercept('PUT', '/api/tasks/*', {
        statusCode: 409,
        body: { error: 'Task was updated by another user' }
      }).as('concurrentUpdate')

      cy.contains('Test Task').click()
      cy.get('[data-testid="task-title-input"]').clear().type('My Update')
      cy.get('[data-testid="save-task-button"]').click()

      cy.wait('@concurrentUpdate')
      cy.contains('Task was updated by another user').should('be.visible')
      cy.get('[data-testid="reload-task-button"]').click()
    })
  })

  describe('Task Actions', () => {
    beforeEach(() => {
      cy.createWorkspace('Test Workspace')
      cy.createSection('Test Section', 'workspace-1')
      cy.createTask('Test Task', 'section-1')
    })

    it('should mark task as complete', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Click checkbox to complete task
      cy.get('[data-testid="task-checkbox"]').click()

      // Verify task is marked complete
      cy.get('[data-testid="task-checkbox"]').should('be.checked')
      cy.get('[data-testid="task-completed"]').should('exist')
    })

    it('should duplicate task', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Open task actions menu
      cy.get('[data-testid="task-actions-menu"]').click()
      cy.get('[data-testid="duplicate-task-action"]').click()

      // Verify duplicate was created
      cy.get('[data-testid="task-item"]').should('have.length', 2)
      cy.contains('Test Task (Copy)').should('be.visible')
    })

    it('should archive task', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-actions-menu"]').click()
      cy.get('[data-testid="archive-task-action"]').click()
      
      // Confirm archive
      cy.get('[data-testid="confirm-archive-button"]').click()

      // Verify task is archived
      cy.contains('Test Task').should('not.exist')
    })

    it('should delete task', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-actions-menu"]').click()
      cy.get('[data-testid="delete-task-action"]').click()
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click()

      // Verify task is deleted
      cy.contains('Test Task').should('not.exist')
    })

    it('should move task to different section', () => {
      cy.createSection('Another Section', 'workspace-1')
      
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-actions-menu"]').click()
      cy.get('[data-testid="move-task-action"]').click()
      
      // Select destination section
      cy.get('[data-testid="section-select"]').click()
      cy.get('[data-testid="section-another-section"]').click()
      cy.get('[data-testid="confirm-move-button"]').click()

      // Verify task moved
      cy.get('[data-testid="section-another-section"]')
        .within(() => {
          cy.contains('Test Task').should('be.visible')
        })
    })
  })

  describe('Task Drag and Drop', () => {
    beforeEach(() => {
      cy.createWorkspace('Test Workspace')
      cy.createSection('Section A', 'workspace-1')
      cy.createSection('Section B', 'workspace-1')
      cy.createTask('Task 1', 'section-a')
      cy.createTask('Task 2', 'section-a')
    })

    it('should reorder tasks within section', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Drag Task 2 above Task 1
      cy.get('[data-testid="task-2"] [data-testid="drag-handle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('dragstart')
        .trigger('drag', { clientY: -100 })

      cy.get('[data-testid="task-1"]')
        .trigger('dragover')
        .trigger('drop')

      // Verify order changed
      cy.get('[data-testid="section-a"] [data-testid="task-item"]').first()
        .should('contain', 'Task 2')
    })

    it('should move task between sections', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Drag Task 1 to Section B
      cy.get('[data-testid="task-1"] [data-testid="drag-handle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('dragstart')

      cy.get('[data-testid="section-b"]')
        .trigger('dragover')
        .trigger('drop')

      // Verify task moved
      cy.get('[data-testid="section-b"]')
        .within(() => {
          cy.contains('Task 1').should('be.visible')
        })

      cy.get('[data-testid="section-a"]')
        .within(() => {
          cy.contains('Task 1').should('not.exist')
        })
    })

    it('should provide visual feedback during drag', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-1"] [data-testid="drag-handle"]')
        .trigger('mousedown', { which: 1 })

      // Should show drag preview
      cy.get('[data-testid="drag-preview"]').should('be.visible')
      
      // Should highlight drop zones
      cy.get('[data-testid="drop-zone-active"]').should('exist')
    })

    it('should handle drag cancellation', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      const originalPosition = cy.get('[data-testid="task-1"]').invoke('index')

      cy.get('[data-testid="task-1"] [data-testid="drag-handle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('dragstart')
        .trigger('keydown', { key: 'Escape' })

      // Task should return to original position
      cy.get('[data-testid="task-1"]').invoke('index').should('equal', originalPosition)
    })
  })

  describe('Task Filtering and Sorting', () => {
    beforeEach(() => {
      cy.createWorkspace('Test Workspace')
      cy.createSection('Test Section', 'workspace-1')
      
      // Create tasks with different properties
      cy.createTask('High Priority Task', 'section-1', { priority: 'high', status: 'todo' })
      cy.createTask('Completed Task', 'section-1', { status: 'completed' })
      cy.createTask('In Progress Task', 'section-1', { status: 'in_progress', assignee: 'user-1' })
    })

    it('should filter tasks by status', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Open filters
      cy.get('[data-testid="task-filters-button"]').click()
      
      // Filter by completed status
      cy.get('[data-testid="filter-status-completed"]').click()
      cy.get('[data-testid="apply-filters-button"]').click()

      // Should only show completed tasks
      cy.contains('Completed Task').should('be.visible')
      cy.contains('High Priority Task').should('not.exist')
      cy.contains('In Progress Task').should('not.exist')
    })

    it('should filter tasks by priority', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-filters-button"]').click()
      cy.get('[data-testid="filter-priority-high"]').click()
      cy.get('[data-testid="apply-filters-button"]').click()

      cy.contains('High Priority Task').should('be.visible')
      cy.contains('Completed Task').should('not.exist')
    })

    it('should filter tasks by assignee', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-filters-button"]').click()
      cy.get('[data-testid="filter-assignee-me"]').click()
      cy.get('[data-testid="apply-filters-button"]').click()

      cy.contains('In Progress Task').should('be.visible')
    })

    it('should sort tasks by due date', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-sort-button"]').click()
      cy.get('[data-testid="sort-due-date-asc"]').click()

      // Verify sorting order
      cy.get('[data-testid="task-item"]').first().should('contain', 'High Priority Task')
    })

    it('should sort tasks by priority', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-sort-button"]').click()
      cy.get('[data-testid="sort-priority-desc"]').click()

      cy.get('[data-testid="task-item"]').first().should('contain', 'High Priority Task')
    })

    it('should combine multiple filters', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-filters-button"]').click()
      cy.get('[data-testid="filter-status-todo"]').click()
      cy.get('[data-testid="filter-priority-high"]').click()
      cy.get('[data-testid="apply-filters-button"]').click()

      // Should only show tasks matching all criteria
      cy.contains('High Priority Task').should('be.visible')
      cy.contains('Completed Task').should('not.exist')
      cy.contains('In Progress Task').should('not.exist')
    })

    it('should clear all filters', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Apply some filters
      cy.get('[data-testid="task-filters-button"]').click()
      cy.get('[data-testid="filter-status-completed"]').click()
      cy.get('[data-testid="apply-filters-button"]').click()

      // Clear filters
      cy.get('[data-testid="clear-filters-button"]').click()

      // Should show all tasks
      cy.contains('High Priority Task').should('be.visible')
      cy.contains('Completed Task').should('be.visible')
      cy.contains('In Progress Task').should('be.visible')
    })
  })

  describe('Task Bulk Operations', () => {
    beforeEach(() => {
      cy.createWorkspace('Test Workspace')
      cy.createSection('Test Section', 'workspace-1')
      cy.createTask('Task 1', 'section-1')
      cy.createTask('Task 2', 'section-1')
      cy.createTask('Task 3', 'section-1')
    })

    it('should select multiple tasks', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Enter selection mode
      cy.get('[data-testid="task-selection-mode"]').click()

      // Select multiple tasks
      cy.get('[data-testid="task-1"] [data-testid="task-select-checkbox"]').click()
      cy.get('[data-testid="task-2"] [data-testid="task-select-checkbox"]').click()

      // Should show bulk actions
      cy.get('[data-testid="bulk-actions-bar"]').should('be.visible')
      cy.contains('2 tasks selected').should('be.visible')
    })

    it('should bulk update status', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-selection-mode"]').click()
      cy.get('[data-testid="task-1"] [data-testid="task-select-checkbox"]').click()
      cy.get('[data-testid="task-2"] [data-testid="task-select-checkbox"]').click()

      cy.get('[data-testid="bulk-update-status"]').click()
      cy.get('[data-testid="status-completed"]').click()
      cy.get('[data-testid="confirm-bulk-update"]').click()

      // Verify both tasks are completed
      cy.get('[data-testid="task-1"] [data-testid="task-status-completed"]').should('exist')
      cy.get('[data-testid="task-2"] [data-testid="task-status-completed"]').should('exist')
    })

    it('should bulk delete tasks', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-selection-mode"]').click()
      cy.get('[data-testid="task-1"] [data-testid="task-select-checkbox"]').click()
      cy.get('[data-testid="task-2"] [data-testid="task-select-checkbox"]').click()

      cy.get('[data-testid="bulk-delete"]').click()
      cy.get('[data-testid="confirm-bulk-delete"]').click()

      // Verify tasks are deleted
      cy.contains('Task 1').should('not.exist')
      cy.contains('Task 2').should('not.exist')
      cy.contains('Task 3').should('be.visible')
    })

    it('should select all tasks', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-selection-mode"]').click()
      cy.get('[data-testid="select-all-tasks"]').click()

      cy.contains('3 tasks selected').should('be.visible')
      cy.get('[data-testid="task-select-checkbox"]:checked').should('have.length', 3)
    })

    it('should deselect all tasks', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      cy.get('[data-testid="task-selection-mode"]').click()
      cy.get('[data-testid="select-all-tasks"]').click()
      cy.get('[data-testid="deselect-all-tasks"]').click()

      cy.get('[data-testid="bulk-actions-bar"]').should('not.exist')
      cy.get('[data-testid="task-select-checkbox"]:checked').should('have.length', 0)
    })
  })

  describe('Performance and Loading', () => {
    it('should handle large task lists efficiently', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      // Mock API to return large number of tasks
      cy.intercept('GET', '/api/sections/*/tasks', {
        fixture: 'large-task-list.json'
      }).as('loadTasks')

      cy.visit('/workspace/workspace-1')
      cy.wait('@loadTasks')

      // Should implement virtualization for performance
      cy.get('[data-testid="task-list-container"]').should('be.visible')
      
      // Should not render all tasks at once (virtual scrolling)
      cy.get('[data-testid="task-item"]').should('have.length.lessThan', 100)
    })

    it('should show loading states', () => {
      // Delay API response to test loading state
      cy.intercept('GET', '/api/sections/*/tasks', (req) => {
        req.reply({ delay: 2000, fixture: 'tasks.json' })
      }).as('slowTasks')

      cy.visit('/workspace/workspace-1')
      
      // Should show loading skeleton
      cy.get('[data-testid="task-loading-skeleton"]').should('be.visible')
      
      cy.wait('@slowTasks')
      cy.get('[data-testid="task-loading-skeleton"]').should('not.exist')
    })

    it('should handle offline scenarios', () => {
      cy.visit('/workspace/workspace-1')
      cy.waitForPageLoad()

      // Simulate offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false)
      })

      // Try to create task while offline
      cy.get('[data-testid="create-task-button"]').click()
      cy.get('[data-testid="task-title-input"]').type('Offline Task')
      cy.get('[data-testid="save-task-button"]').click()

      // Should show offline indicator
      cy.contains('You are offline').should('be.visible')
      cy.contains('Changes will sync when connection is restored').should('be.visible')
    })
  })
})