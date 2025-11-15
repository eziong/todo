describe('Search Functionality', () => {
  beforeEach(() => {
    cy.clearTestData()
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
    
    // Set up test data
    cy.createWorkspace('Work Projects')
    cy.createWorkspace('Personal Tasks')
    cy.createSection('Development', 'work-projects')
    cy.createSection('Meetings', 'work-projects')
    cy.createSection('Shopping', 'personal-tasks')
    
    cy.createTask('Fix authentication bug', 'development', { 
      description: 'Fix OAuth login issues',
      priority: 'high',
      tags: ['bug', 'frontend']
    })
    cy.createTask('Implement user dashboard', 'development', {
      description: 'Create dashboard with analytics',
      priority: 'medium',
      tags: ['feature', 'frontend']
    })
    cy.createTask('Team standup', 'meetings', {
      description: 'Daily team standup meeting',
      priority: 'low'
    })
    cy.createTask('Buy groceries', 'shopping', {
      description: 'Milk, bread, eggs',
      priority: 'medium',
      tags: ['personal']
    })
  })

  describe('Spotlight Search Modal', () => {
    it('should open spotlight search with keyboard shortcut', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      // Press Cmd/Ctrl + K to open search
      cy.get('body').type('{cmd}k')
      
      cy.get('[data-testid="spotlight-search-modal"]').should('be.visible')
      cy.get('[data-testid="search-input"]').should('be.focused')
    })

    it('should open spotlight search with button click', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      cy.get('[data-testid="search-button"]').click()
      
      cy.get('[data-testid="spotlight-search-modal"]').should('be.visible')
      cy.get('[data-testid="search-input"]').should('be.focused')
    })

    it('should close spotlight search with escape key', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      cy.get('body').type('{cmd}k')
      cy.get('[data-testid="spotlight-search-modal"]').should('be.visible')
      
      cy.get('body').type('{esc}')
      cy.get('[data-testid="spotlight-search-modal"]').should('not.exist')
    })

    it('should close spotlight search by clicking outside', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      cy.get('body').type('{cmd}k')
      cy.get('[data-testid="spotlight-search-modal"]').should('be.visible')
      
      cy.get('[data-testid="search-overlay"]').click({ force: true })
      cy.get('[data-testid="spotlight-search-modal"]').should('not.exist')
    })
  })

  describe('Search Results', () => {
    beforeEach(() => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')
    })

    it('should search tasks by title', () => {
      cy.get('[data-testid="search-input"]').type('authentication')
      
      cy.get('[data-testid="search-results"]').should('be.visible')
      cy.contains('Fix authentication bug').should('be.visible')
      cy.get('[data-testid="search-result-item"]').should('have.length', 1)
    })

    it('should search tasks by description', () => {
      cy.get('[data-testid="search-input"]').type('OAuth login')
      
      cy.contains('Fix authentication bug').should('be.visible')
      cy.get('[data-testid="search-highlight"]').should('contain', 'OAuth')
    })

    it('should search tasks by tags', () => {
      cy.get('[data-testid="search-input"]').type('frontend')
      
      cy.get('[data-testid="search-result-item"]').should('have.length', 2)
      cy.contains('Fix authentication bug').should('be.visible')
      cy.contains('Implement user dashboard').should('be.visible')
    })

    it('should search across workspaces and sections', () => {
      cy.get('[data-testid="search-input"]').type('team')
      
      cy.contains('Team standup').should('be.visible')
      cy.get('[data-testid="result-context"]').should('contain', 'Work Projects > Meetings')
    })

    it('should show no results message', () => {
      cy.get('[data-testid="search-input"]').type('nonexistent query')
      
      cy.get('[data-testid="no-results"]').should('be.visible')
      cy.contains('No results found').should('be.visible')
      cy.contains('Try different keywords').should('be.visible')
    })

    it('should highlight search terms in results', () => {
      cy.get('[data-testid="search-input"]').type('bug')
      
      cy.get('[data-testid="search-highlight"]')
        .should('be.visible')
        .should('contain', 'bug')
        .should('have.css', 'background-color')
    })

    it('should show task metadata in results', () => {
      cy.get('[data-testid="search-input"]').type('authentication')
      
      cy.get('[data-testid="search-result-item"]').within(() => {
        cy.get('[data-testid="task-priority-high"]').should('be.visible')
        cy.get('[data-testid="task-tag-bug"]').should('be.visible')
        cy.get('[data-testid="task-tag-frontend"]').should('be.visible')
        cy.contains('Work Projects > Development').should('be.visible')
      })
    })

    it('should show relevance score order', () => {
      cy.get('[data-testid="search-input"]').type('frontend')
      
      // Results should be ordered by relevance
      cy.get('[data-testid="search-result-item"]').first()
        .should('contain', 'authentication') // Should rank higher due to title match
    })
  })

  describe('Search Categories', () => {
    beforeEach(() => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')
    })

    it('should filter by task category', () => {
      cy.get('[data-testid="search-input"]').type('team')
      
      cy.get('[data-testid="category-tasks"]').click()
      
      cy.get('[data-testid="search-result-item"]').should('have.length', 1)
      cy.contains('Team standup').should('be.visible')
    })

    it('should filter by workspace category', () => {
      cy.get('[data-testid="search-input"]').type('work')
      
      cy.get('[data-testid="category-workspaces"]').click()
      
      cy.contains('Work Projects').should('be.visible')
      cy.get('[data-testid="workspace-result"]').should('be.visible')
    })

    it('should filter by section category', () => {
      cy.get('[data-testid="search-input"]').type('development')
      
      cy.get('[data-testid="category-sections"]').click()
      
      cy.contains('Development').should('be.visible')
      cy.get('[data-testid="section-result"]').should('be.visible')
    })

    it('should show category counts', () => {
      cy.get('[data-testid="search-input"]').type('team')
      
      cy.get('[data-testid="category-all"]').should('contain', '1')
      cy.get('[data-testid="category-tasks"]').should('contain', '1')
      cy.get('[data-testid="category-workspaces"]').should('contain', '0')
    })

    it('should reset to all categories', () => {
      cy.get('[data-testid="search-input"]').type('frontend')
      cy.get('[data-testid="category-tasks"]').click()
      
      cy.get('[data-testid="category-all"]').click()
      
      // Should show all results again
      cy.get('[data-testid="search-result-item"]').should('have.length', 2)
    })
  })

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')
      cy.get('[data-testid="search-input"]').type('bug')
    })

    it('should navigate results with arrow keys', () => {
      cy.get('[data-testid="search-input"]').type('{downArrow}')
      
      cy.get('[data-testid="search-result-item"]').first()
        .should('have.class', 'selected')
      
      cy.get('[data-testid="search-input"]').type('{downArrow}')
      
      // Should move to quick actions if available
      cy.get('[data-testid="quick-action-item"]').first()
        .should('have.class', 'selected')
      
      cy.get('[data-testid="search-input"]').type('{upArrow}')
      
      cy.get('[data-testid="search-result-item"]').first()
        .should('have.class', 'selected')
    })

    it('should select result with enter key', () => {
      cy.get('[data-testid="search-input"]').type('{downArrow}{enter}')
      
      // Should navigate to task detail or close modal
      cy.get('[data-testid="spotlight-search-modal"]').should('not.exist')
      cy.get('[data-testid="task-detail-modal"]').should('be.visible')
      cy.contains('Fix authentication bug').should('be.visible')
    })

    it('should handle keyboard shortcuts in results', () => {
      cy.get('[data-testid="search-input"]').type('{downArrow}')
      
      // Press 'e' to edit task
      cy.get('body').type('e')
      
      cy.get('[data-testid="task-detail-modal"]').should('be.visible')
      cy.get('[data-testid="task-title-input"]').should('be.focused')
    })

    it('should wrap navigation at boundaries', () => {
      cy.get('[data-testid="search-input"]').type('{upArrow}')
      
      // Should wrap to last result
      cy.get('[data-testid="quick-action-item"]').last()
        .should('have.class', 'selected')
      
      cy.get('[data-testid="search-input"]').type('{downArrow}')
      
      // Should wrap to first result
      cy.get('[data-testid="search-result-item"]').first()
        .should('have.class', 'selected')
    })
  })

  describe('Quick Actions', () => {
    beforeEach(() => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')
    })

    it('should show quick actions when no search query', () => {
      cy.get('[data-testid="quick-actions"]').should('be.visible')
      cy.contains('New Task').should('be.visible')
      cy.contains('New Workspace').should('be.visible')
      cy.contains('New Section').should('be.visible')
    })

    it('should show quick actions with search query', () => {
      cy.get('[data-testid="search-input"]').type('test')
      
      cy.get('[data-testid="quick-actions"]').should('be.visible')
      cy.contains('Create task "test"').should('be.visible')
    })

    it('should execute new task quick action', () => {
      cy.get('[data-testid="quick-action-new-task"]').click()
      
      cy.get('[data-testid="task-detail-modal"]').should('be.visible')
      cy.get('[data-testid="task-title-input"]').should('be.focused')
    })

    it('should execute new workspace quick action', () => {
      cy.get('[data-testid="quick-action-new-workspace"]').click()
      
      cy.get('[data-testid="workspace-modal"]').should('be.visible')
      cy.get('[data-testid="workspace-name-input"]').should('be.focused')
    })

    it('should show contextual quick actions', () => {
      cy.get('[data-testid="search-input"]').type('urgent task')
      
      cy.contains('Create urgent task "urgent task"').should('be.visible')
      cy.get('[data-testid="quick-action-high-priority"]').should('be.visible')
    })
  })

  describe('Search Suggestions', () => {
    beforeEach(() => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')
    })

    it('should show search suggestions', () => {
      cy.get('[data-testid="search-input"]').type('bug')
      
      cy.get('[data-testid="search-suggestions"]').should('be.visible')
      cy.contains('in:development').should('be.visible')
      cy.contains('priority:high').should('be.visible')
      cy.contains('tag:bug').should('be.visible')
    })

    it('should apply suggestion on click', () => {
      cy.get('[data-testid="search-input"]').type('bug')
      cy.get('[data-testid="suggestion-priority-high"]').click()
      
      cy.get('[data-testid="search-input"]').should('have.value', 'bug priority:high')
    })

    it('should show recent searches', () => {
      // Perform a search first
      cy.get('[data-testid="search-input"]').type('authentication{enter}')
      cy.get('[data-testid="spotlight-search-modal"]').should('not.exist')
      
      // Open search again
      cy.get('body').type('{cmd}k')
      
      cy.get('[data-testid="recent-searches"]').should('be.visible')
      cy.contains('authentication').should('be.visible')
    })

    it('should clear recent searches', () => {
      // Add some recent searches
      cy.get('[data-testid="search-input"]').type('test search{enter}')
      cy.get('body').type('{cmd}k')
      
      cy.get('[data-testid="clear-recent-searches"]').click()
      
      cy.get('[data-testid="recent-searches"]').should('not.exist')
    })
  })

  describe('Advanced Search Filters', () => {
    beforeEach(() => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')
    })

    it('should search by status', () => {
      cy.get('[data-testid="search-input"]').type('status:todo')
      
      // Should show only todo tasks
      cy.get('[data-testid="search-result-item"]').should('have.length.greaterThan', 0)
      cy.get('[data-testid="task-status-todo"]').should('exist')
    })

    it('should search by priority', () => {
      cy.get('[data-testid="search-input"]').type('priority:high')
      
      cy.contains('Fix authentication bug').should('be.visible')
      cy.get('[data-testid="task-priority-high"]').should('be.visible')
    })

    it('should search by workspace', () => {
      cy.get('[data-testid="search-input"]').type('in:work-projects')
      
      cy.contains('Fix authentication bug').should('be.visible')
      cy.contains('Team standup').should('be.visible')
      cy.contains('Buy groceries').should('not.exist')
    })

    it('should search by assignee', () => {
      cy.get('[data-testid="search-input"]').type('assigned:me')
      
      // Should show tasks assigned to current user
      cy.get('[data-testid="search-result-item"]').should('exist')
    })

    it('should search by tag', () => {
      cy.get('[data-testid="search-input"]').type('tag:frontend')
      
      cy.get('[data-testid="search-result-item"]').should('have.length', 2)
      cy.contains('Fix authentication bug').should('be.visible')
      cy.contains('Implement user dashboard').should('be.visible')
    })

    it('should search by due date', () => {
      cy.get('[data-testid="search-input"]').type('due:today')
      
      // Should show tasks due today
      cy.get('[data-testid="search-result-item"]').should('exist')
    })

    it('should combine multiple filters', () => {
      cy.get('[data-testid="search-input"]').type('tag:frontend priority:high')
      
      cy.get('[data-testid="search-result-item"]').should('have.length', 1)
      cy.contains('Fix authentication bug').should('be.visible')
    })

    it('should show filter syntax help', () => {
      cy.get('[data-testid="search-input"]').type('help:filters')
      
      cy.get('[data-testid="filter-help"]').should('be.visible')
      cy.contains('status:todo').should('be.visible')
      cy.contains('priority:high').should('be.visible')
      cy.contains('assigned:me').should('be.visible')
    })
  })

  describe('Search Performance', () => {
    it('should handle large result sets', () => {
      // Mock large result set
      cy.intercept('GET', '/api/tasks/search*', {
        fixture: 'large-search-results.json'
      }).as('searchResults')

      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')
      cy.get('[data-testid="search-input"]').type('test')

      cy.wait('@searchResults')

      // Should implement virtualization
      cy.get('[data-testid="search-results-container"]').should('be.visible')
      cy.get('[data-testid="search-result-item"]').should('have.length.lessThan', 50)
      
      // Should show total count
      cy.contains('Showing 50 of 1000+ results').should('be.visible')
    })

    it('should debounce search requests', () => {
      let requestCount = 0
      cy.intercept('GET', '/api/tasks/search*', (req) => {
        requestCount++
        req.reply({ fixture: 'search-results.json' })
      }).as('searchRequest')

      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')

      // Type rapidly
      cy.get('[data-testid="search-input"]')
        .type('a')
        .type('b')
        .type('c')
        .type('d')

      cy.wait(500) // Wait for debounce

      // Should have made only one request after debounce
      cy.wait('@searchRequest')
      cy.then(() => {
        expect(requestCount).to.equal(1)
      })
    })

    it('should show loading state during search', () => {
      cy.intercept('GET', '/api/tasks/search*', (req) => {
        req.reply({ delay: 1000, fixture: 'search-results.json' })
      }).as('slowSearch')

      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')
      cy.get('[data-testid="search-input"]').type('slow search')

      cy.get('[data-testid="search-loading"]').should('be.visible')
      
      cy.wait('@slowSearch')
      cy.get('[data-testid="search-loading"]').should('not.exist')
    })
  })

  describe('Search Analytics', () => {
    it('should track search queries', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')

      cy.intercept('POST', '/api/analytics/search', {
        statusCode: 200,
        body: { success: true }
      }).as('trackSearch')

      cy.get('[data-testid="search-input"]').type('authentication{enter}')

      cy.wait('@trackSearch')
      cy.get('@trackSearch').should((interception) => {
        expect(interception.request.body).to.deep.include({
          query: 'authentication',
          resultsCount: 1,
          category: 'all'
        })
      })
    })

    it('should track result clicks', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()
      cy.get('body').type('{cmd}k')
      cy.get('[data-testid="search-input"]').type('authentication')

      cy.intercept('POST', '/api/analytics/search-click', {
        statusCode: 200,
        body: { success: true }
      }).as('trackClick')

      cy.contains('Fix authentication bug').click()

      cy.wait('@trackClick')
      cy.get('@trackClick').should((interception) => {
        expect(interception.request.body).to.deep.include({
          query: 'authentication',
          resultId: 'task-1',
          resultType: 'task',
          position: 0
        })
      })
    })
  })
})