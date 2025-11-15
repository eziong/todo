describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearTestData()
  })

  describe('Login', () => {
    it('should display login page', () => {
      cy.visit('/login')
      cy.waitForPageLoad()

      cy.get('[data-testid="login-page"]').should('be.visible')
      cy.contains('Welcome Back').should('be.visible')
      cy.contains('Sign in to your account to continue').should('be.visible')
    })

    it('should show Google sign in button', () => {
      cy.visit('/login')
      cy.waitForPageLoad()

      cy.get('[data-testid="google-signin-button"]')
        .should('be.visible')
        .should('contain', 'Continue with Google')
        .should('not.be.disabled')
    })

    it('should redirect authenticated users to dashboard', () => {
      // Mock authenticated state
      cy.window().then((win) => {
        win.localStorage.setItem('supabase.auth.token', 'mock-token')
      })

      cy.visit('/login')
      cy.url().should('include', '/dashboard')
    })

    describe('Email/Password Login (if enabled)', () => {
      it('should validate email field', () => {
        cy.visit('/login?showEmailLogin=true')
        cy.waitForPageLoad()

        // Try to submit without email
        cy.get('[data-testid="email-input"]').should('be.visible')
        cy.get('[data-testid="login-submit"]').click()

        cy.contains('Email is required').should('be.visible')

        // Try invalid email format
        cy.get('[data-testid="email-input"]').type('invalid-email')
        cy.get('[data-testid="login-submit"]').click()

        cy.contains('Please enter a valid email address').should('be.visible')
      })

      it('should validate password field', () => {
        cy.visit('/login?showEmailLogin=true')
        cy.waitForPageLoad()

        cy.get('[data-testid="email-input"]').type('test@example.com')

        // Try to submit without password
        cy.get('[data-testid="login-submit"]').click()
        cy.contains('Password is required').should('be.visible')

        // Try short password
        cy.get('[data-testid="password-input"]').type('123')
        cy.get('[data-testid="login-submit"]').click()

        cy.contains('Password must be at least 6 characters').should('be.visible')
      })

      it('should toggle password visibility', () => {
        cy.visit('/login?showEmailLogin=true')
        cy.waitForPageLoad()

        const passwordInput = cy.get('[data-testid="password-input"]')
        const toggleButton = cy.get('[data-testid="password-toggle"]')

        // Initially password should be hidden
        passwordInput.should('have.attr', 'type', 'password')

        // Click toggle to show password
        toggleButton.click()
        passwordInput.should('have.attr', 'type', 'text')

        // Click toggle to hide password again
        toggleButton.click()
        passwordInput.should('have.attr', 'type', 'password')
      })

      it('should handle login errors', () => {
        cy.visit('/login?showEmailLogin=true')
        cy.waitForPageLoad()

        // Intercept login request and return error
        cy.intercept('POST', '/api/auth/login', {
          statusCode: 401,
          body: { error: 'Invalid credentials' }
        }).as('loginRequest')

        cy.get('[data-testid="email-input"]').type('test@example.com')
        cy.get('[data-testid="password-input"]').type('wrongpassword')
        cy.get('[data-testid="login-submit"]').click()

        cy.wait('@loginRequest')
        cy.contains('Invalid credentials').should('be.visible')
      })

      it('should successfully log in with valid credentials', () => {
        cy.visit('/login?showEmailLogin=true')
        cy.waitForPageLoad()

        // Intercept successful login
        cy.intercept('POST', '/api/auth/login', {
          statusCode: 200,
          body: { success: true, redirectTo: '/dashboard' }
        }).as('loginRequest')

        cy.get('[data-testid="email-input"]').type(Cypress.env('TEST_EMAIL'))
        cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_PASSWORD'))
        cy.get('[data-testid="login-submit"]').click()

        cy.wait('@loginRequest')
        cy.url().should('include', '/dashboard')
      })
    })

    describe('Google OAuth Flow', () => {
      it('should initiate Google OAuth', () => {
        cy.visit('/login')
        cy.waitForPageLoad()

        // Mock Google OAuth redirect
        cy.window().then((win) => {
          cy.stub(win, 'open').as('googleOAuth')
        })

        cy.get('[data-testid="google-signin-button"]').click()

        // Should initiate OAuth flow (in real app this would redirect to Google)
        cy.get('@googleOAuth').should('have.been.called')
      })

      it('should handle OAuth callback success', () => {
        // Simulate successful OAuth callback
        cy.visit('/auth/callback?access_token=mock-token&refresh_token=mock-refresh')
        
        // Should redirect to dashboard after successful auth
        cy.url().should('include', '/dashboard')
        cy.get('[data-testid="user-menu"]').should('exist')
      })

      it('should handle OAuth callback error', () => {
        // Simulate OAuth error
        cy.visit('/auth/callback?error=access_denied&error_description=User%20denied%20access')
        
        // Should redirect to login with error message
        cy.url().should('include', '/login')
        cy.contains('Authentication failed').should('be.visible')
      })
    })
  })

  describe('Authentication State', () => {
    it('should persist authentication across page refreshes', () => {
      // Log in user
      cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
      
      // Verify logged in state
      cy.get('[data-testid="user-menu"]').should('exist')
      
      // Refresh page
      cy.reload()
      cy.waitForPageLoad()
      
      // Should still be logged in
      cy.get('[data-testid="user-menu"]').should('exist')
      cy.url().should('not.include', '/login')
    })

    it('should redirect to login when accessing protected routes while unauthenticated', () => {
      // Try to access protected route
      cy.visit('/dashboard')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })

    it('should handle session expiry', () => {
      // Log in user
      cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
      
      // Mock expired session
      cy.window().then((win) => {
        win.localStorage.removeItem('supabase.auth.token')
      })
      
      // Try to access protected route
      cy.visit('/dashboard')
      
      // Should redirect to login
      cy.url().should('include', '/login')
      cy.contains('Session expired').should('be.visible')
    })
  })

  describe('User Menu and Logout', () => {
    beforeEach(() => {
      cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
    })

    it('should display user menu', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      cy.get('[data-testid="user-menu"]')
        .should('be.visible')
        .click()

      cy.get('[data-testid="user-menu-dropdown"]').should('be.visible')
      cy.contains('Profile').should('be.visible')
      cy.contains('Settings').should('be.visible')
      cy.contains('Sign Out').should('be.visible')
    })

    it('should navigate to profile page', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="profile-menu-item"]').click()

      cy.url().should('include', '/profile')
    })

    it('should navigate to settings page', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="settings-menu-item"]').click()

      cy.url().should('include', '/settings')
    })

    it('should sign out successfully', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      // Intercept sign out request
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: { success: true }
      }).as('logoutRequest')

      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="signout-menu-item"]').click()

      cy.wait('@logoutRequest')
      
      // Should redirect to login
      cy.url().should('include', '/login')
      cy.get('[data-testid="user-menu"]').should('not.exist')
    })

    it('should handle logout errors gracefully', () => {
      cy.visit('/dashboard')
      cy.waitForPageLoad()

      // Intercept sign out request with error
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 500,
        body: { error: 'Logout failed' }
      }).as('logoutRequest')

      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="signout-menu-item"]').click()

      cy.wait('@logoutRequest')
      
      // Should show error message but still clear local session
      cy.contains('Logout failed').should('be.visible')
      cy.url().should('include', '/login')
    })
  })

  describe('Protected Routes', () => {
    const protectedRoutes = [
      '/dashboard',
      '/today', 
      '/completed',
      '/activities',
      '/workspace/123',
      '/section/123'
    ]

    it('should redirect unauthenticated users to login', () => {
      protectedRoutes.forEach((route) => {
        cy.visit(route)
        cy.url().should('include', '/login')
        
        // Should preserve intended destination
        cy.url().should('include', `redirectTo=${encodeURIComponent(route)}`)
      })
    })

    it('should redirect to intended destination after login', () => {
      const intendedDestination = '/dashboard'
      
      // Visit protected route while unauthenticated
      cy.visit(intendedDestination)
      cy.url().should('include', '/login')
      cy.url().should('include', `redirectTo=${encodeURIComponent(intendedDestination)}`)
      
      // Log in
      cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
      
      // Should redirect to intended destination
      cy.url().should('include', intendedDestination)
    })
  })

  describe('Authentication Error Handling', () => {
    it('should handle network errors during login', () => {
      cy.visit('/login?showEmailLogin=true')
      cy.waitForPageLoad()

      // Simulate network error
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('loginRequest')

      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-submit"]').click()

      cy.wait('@loginRequest')
      cy.contains('Network error').should('be.visible')
    })

    it('should handle server errors during login', () => {
      cy.visit('/login?showEmailLogin=true')
      cy.waitForPageLoad()

      // Simulate server error
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('loginRequest')

      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-submit"]').click()

      cy.wait('@loginRequest')
      cy.contains('Server error').should('be.visible')
    })

    it('should clear error messages when retrying login', () => {
      cy.visit('/login?showEmailLogin=true')
      cy.waitForPageLoad()

      // First attempt with error
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid credentials' }
      }).as('loginErrorRequest')

      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      cy.get('[data-testid="login-submit"]').click()

      cy.wait('@loginErrorRequest')
      cy.contains('Invalid credentials').should('be.visible')

      // Second attempt with success
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: { success: true, redirectTo: '/dashboard' }
      }).as('loginSuccessRequest')

      cy.get('[data-testid="password-input"]').clear().type('correctpassword')
      cy.get('[data-testid="login-submit"]').click()

      cy.wait('@loginSuccessRequest')
      
      // Error message should be cleared
      cy.contains('Invalid credentials').should('not.exist')
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit('/login?showEmailLogin=true')
      cy.waitForPageLoad()

      // Tab through form elements
      cy.get('body').type('{tab}')
      cy.focused().should('have.attr', 'data-testid', 'google-signin-button')

      cy.focused().type('{tab}')
      cy.focused().should('have.attr', 'data-testid', 'email-input')

      cy.focused().type('{tab}')
      cy.focused().should('have.attr', 'data-testid', 'password-input')

      cy.focused().type('{tab}')
      cy.focused().should('have.attr', 'data-testid', 'password-toggle')

      cy.focused().type('{tab}')
      cy.focused().should('have.attr', 'data-testid', 'login-submit')
    })

    it('should have proper ARIA labels', () => {
      cy.visit('/login?showEmailLogin=true')
      cy.waitForPageLoad()

      cy.get('[data-testid="email-input"]')
        .should('have.attr', 'aria-label')
        .and('have.attr', 'type', 'email')

      cy.get('[data-testid="password-input"]')
        .should('have.attr', 'aria-label')

      cy.get('[data-testid="password-toggle"]')
        .should('have.attr', 'aria-label', 'toggle password visibility')

      cy.get('[data-testid="login-submit"]')
        .should('have.attr', 'type', 'submit')
    })

    it('should announce errors to screen readers', () => {
      cy.visit('/login?showEmailLogin=true')
      cy.waitForPageLoad()

      cy.get('[data-testid="login-submit"]').click()

      // Error messages should have proper ARIA attributes
      cy.contains('Email is required')
        .should('have.attr', 'role', 'alert')

      cy.contains('Password is required')
        .should('have.attr', 'role', 'alert')
    })
  })
})