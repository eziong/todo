// =============================================
// LOGIN PAGE
// =============================================
// Public login page for user authentication

import { Login } from '@/components/Auth/Login/Login';

/**
 * Login Page Component
 * Renders the login form for user authentication
 */
export default function LoginPage(): React.ReactElement {
  return (
    <Login
      showEmailLogin={false} // Only show Google OAuth for now
      title="Welcome to Todo App"
      subtitle="Sign in with your Google account to get started"
    />
  );
}