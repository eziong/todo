// =============================================
// AUTHENTICATION COMPONENTS EXPORTS
// =============================================
// Central export file for all authentication components

// Context and Provider
export { AuthProvider, useAuthContext } from './AuthProvider';

// Authentication Hooks
export { useAuth } from './useAuth';

// Login Components
export { Login } from './Login/Login';
export { useLogin } from './Login/useLogin';

// User Menu Components
export { UserMenu } from './UserMenu/UserMenu';
export { useUserMenu } from './UserMenu/useUserMenu';

// User Profile Components
export { UserProfile } from './UserProfile/UserProfile';
export { useUserProfile } from './UserProfile/useUserProfile';

// Protected Route Components
export { ProtectedRoute } from './ProtectedRoute/ProtectedRoute';
export { useProtectedRoute } from './ProtectedRoute/useProtectedRoute';

// Higher-Order Components
export {
  withAuth,
  withRequiredAuth,
  withAdminAuth,
  withOwnerAuth,
} from './withAuth';

// Types (re-export from types package)
export type { UseAuthReturn } from '@/types';