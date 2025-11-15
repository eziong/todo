// =============================================
// BREADCRUMB NAVIGATION CONTAINER HOOK
// =============================================
// Container hook for breadcrumb navigation with route state management

import { useMemo } from 'react';
import { useRouter } from '@/hooks/useRouter';

// =============================================
// TYPES
// =============================================

export interface Breadcrumb {
  label: string;
  href: string;
  active: boolean;
  icon?: React.ComponentType;
}

export interface UseBreadcrumbNavigationReturn {
  breadcrumbs: Breadcrumb[];
  currentPage: string;
  loading: boolean;
  error: string | null;
  
  // Actions
  navigateTo: (href: string) => void;
  goBack: () => void;
}

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useBreadcrumbNavigation = (): UseBreadcrumbNavigationReturn => {
  const { pathname, getBreadcrumbs, push, back } = useRouter();

  // Generate breadcrumbs from current route
  const breadcrumbs = useMemo(() => {
    return getBreadcrumbs();
  }, [getBreadcrumbs]);

  // Get current page title
  const currentPage = useMemo(() => {
    const activeBreadcrumb = breadcrumbs.find(b => b.active);
    return activeBreadcrumb?.label || 'Page';
  }, [breadcrumbs]);

  // Navigation actions
  const navigateTo = (href: string): void => {
    push(href);
  };

  const goBack = (): void => {
    back();
  };

  return {
    breadcrumbs,
    currentPage,
    loading: false,
    error: null,
    
    // Actions
    navigateTo,
    goBack,
  };
};