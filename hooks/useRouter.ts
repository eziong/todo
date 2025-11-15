// =============================================
// ROUTER HOOK
// =============================================
// Container hook for Next.js router with URL state management

import { useCallback } from 'react';
import { useRouter as useNextRouter, useSearchParams, usePathname } from 'next/navigation';

// =============================================
// TYPES
// =============================================

export interface UseRouterReturn {
  // Current route information
  pathname: string;
  searchParams: URLSearchParams;
  
  // Navigation methods
  push: (href: string, options?: { scroll?: boolean }) => void;
  replace: (href: string, options?: { scroll?: boolean }) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  
  // URL state management
  updateSearchParams: (params: Record<string, string | string[] | undefined>) => void;
  removeSearchParam: (key: string) => void;
  getSearchParam: (key: string) => string | null;
  getSearchParams: () => Record<string, string>;
  
  // Route matching
  isCurrentRoute: (route: string) => boolean;
  isRouteActive: (route: string) => boolean;
  
  // Modal and overlay state
  openModal: (modalType: string, id?: string, returnUrl?: string) => void;
  closeModal: (returnUrl?: string) => void;
  getModalState: () => { type: string | null; id: string | null; returnUrl: string | null };
  
  // Breadcrumb generation
  getBreadcrumbs: () => Array<{ label: string; href: string; active: boolean }>;
}

export interface ModalState {
  type: string | null;
  id: string | null;
  returnUrl: string | null;
}

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useRouter = (): UseRouterReturn => {
  const router = useNextRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Navigation methods
  const push = useCallback((href: string, options?: { scroll?: boolean }) => {
    router.push(href, options);
  }, [router]);

  const replace = useCallback((href: string, options?: { scroll?: boolean }) => {
    router.replace(href, options);
  }, [router]);

  const back = useCallback(() => {
    router.back();
  }, [router]);

  const forward = useCallback(() => {
    router.forward();
  }, [router]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // URL state management
  const updateSearchParams = useCallback((params: Record<string, string | string[] | undefined>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        newSearchParams.delete(key);
      } else if (Array.isArray(value)) {
        newSearchParams.delete(key);
        value.forEach(v => newSearchParams.append(key, v));
      } else {
        newSearchParams.set(key, value);
      }
    });
    
    const newUrl = `${pathname}?${newSearchParams.toString()}`;
    router.push(newUrl);
  }, [pathname, searchParams, router]);

  const removeSearchParam = useCallback((key: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete(key);
    
    const newUrl = newSearchParams.toString() 
      ? `${pathname}?${newSearchParams.toString()}`
      : pathname;
    router.push(newUrl);
  }, [pathname, searchParams, router]);

  const getSearchParam = useCallback((key: string): string | null => {
    return searchParams.get(key);
  }, [searchParams]);

  const getSearchParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  // Route matching
  const isCurrentRoute = useCallback((route: string): boolean => {
    return pathname === route;
  }, [pathname]);

  const isRouteActive = useCallback((route: string): boolean => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  }, [pathname]);

  // Modal state management
  const openModal = useCallback((modalType: string, id?: string, returnUrl?: string) => {
    const params: Record<string, string> = {
      modal: modalType,
    };
    
    if (id) {
      params.modalId = id;
    }
    
    if (returnUrl) {
      params.returnUrl = returnUrl;
    } else {
      // Use current path as return URL if none specified
      params.returnUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    }
    
    updateSearchParams(params);
  }, [updateSearchParams, pathname, searchParams]);

  const closeModal = useCallback((returnUrl?: string) => {
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      const currentReturnUrl = getSearchParam('returnUrl');
      if (currentReturnUrl) {
        router.push(currentReturnUrl);
      } else {
        // Remove modal params and stay on current page
        updateSearchParams({
          modal: undefined,
          modalId: undefined,
          returnUrl: undefined,
        });
      }
    }
  }, [router, getSearchParam, updateSearchParams]);

  const getModalState = useCallback((): ModalState => {
    return {
      type: getSearchParam('modal'),
      id: getSearchParam('modalId'),
      returnUrl: getSearchParam('returnUrl'),
    };
  }, [getSearchParam]);

  // Breadcrumb generation based on current path
  const getBreadcrumbs = useCallback((): Array<{ label: string; href: string; active: boolean }> => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{ label: string; href: string; active: boolean }> = [];
    
    // Home
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
      active: pathname === '/dashboard',
    });
    
    // Build breadcrumbs based on path segments
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Custom labels for known routes
      switch (segment) {
        case 'workspace':
          label = 'Workspace';
          break;
        case 'section':
          label = 'Section';
          break;
        case 'today':
          label = "Today's Tasks";
          break;
        case 'completed':
          label = 'Completed Tasks';
          break;
        case 'activities':
          label = 'Activities';
          break;
        default:
          // If it looks like an ID (UUID), skip it or get name from data
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
            // This would ideally get the name from cached data
            label = 'Item';
          }
          break;
      }
      
      breadcrumbs.push({
        label,
        href: currentPath,
        active: isLast,
      });
    });
    
    return breadcrumbs;
  }, [pathname]);

  return {
    // Current route information
    pathname,
    searchParams,
    
    // Navigation methods
    push,
    replace,
    back,
    forward,
    refresh,
    
    // URL state management
    updateSearchParams,
    removeSearchParam,
    getSearchParam,
    getSearchParams,
    
    // Route matching
    isCurrentRoute,
    isRouteActive,
    
    // Modal and overlay state
    openModal,
    closeModal,
    getModalState,
    
    // Breadcrumb generation
    getBreadcrumbs,
  };
};