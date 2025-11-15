'use client';

import { Suspense, lazy, ComponentType, ReactNode, useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Skeleton } from '@mui/material';

interface LazyComponentProps {
  fallback?: ReactNode;
  skeletonHeight?: number | string;
  skeletonVariant?: 'circular' | 'rectangular' | 'rounded' | 'text';
  children?: ReactNode;
}

interface LazyWrapperConfig {
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  skeletonHeight?: number | string;
}

// Default loading component
const DefaultLoadingFallback = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 200,
      p: 3 
    }}
  >
    <CircularProgress size={40} />
  </Box>
);

// Skeleton loading component
const SkeletonFallback: React.FC<{ 
  height?: number | string; 
  variant?: 'circular' | 'rectangular' | 'rounded' | 'text';
}> = ({ 
  height = 200, 
  variant = 'rectangular' 
}) => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant={variant} height={height} animation="wave" />
  </Box>
);

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  config: LazyWrapperConfig = {}
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: P) {
    const fallback = config.fallback || 
      (config.skeletonHeight ? 
        <SkeletonFallback height={config.skeletonHeight} /> : 
        <DefaultLoadingFallback />
      );

    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Generic lazy component wrapper
export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback,
  skeletonHeight,
  skeletonVariant = 'rectangular'
}) => {
  const loadingFallback = fallback || 
    (skeletonHeight ? 
      <SkeletonFallback height={skeletonHeight} variant={skeletonVariant} /> : 
      <DefaultLoadingFallback />
    );

  return (
    <Suspense fallback={loadingFallback}>
      {children}
    </Suspense>
  );
};

// Intersection Observer based lazy loading hook
export function useIntersectionObserver(
  targetRef: React.RefObject<Element | null>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyIntersecting = entry.isIntersecting;
        setIsIntersecting(isCurrentlyIntersecting);
        
        // Once intersected, keep it loaded
        if (isCurrentlyIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [targetRef, hasIntersected, options]);

  return { isIntersecting, hasIntersected };
}

// Viewport-based lazy component
interface ViewportLazyComponentProps extends LazyComponentProps {
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
  render: (isVisible: boolean) => ReactNode;
}

export const ViewportLazyComponent: React.FC<ViewportLazyComponentProps> = ({
  fallback,
  skeletonHeight,
  skeletonVariant = 'rectangular',
  once = true,
  threshold = 0.1,
  rootMargin = '50px',
  render
}) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { isIntersecting, hasIntersected } = useIntersectionObserver(targetRef, {
    threshold,
    rootMargin
  });

  const shouldRender = once ? hasIntersected : isIntersecting;
  
  const loadingFallback = fallback || 
    (skeletonHeight ? 
      <SkeletonFallback height={skeletonHeight} variant={skeletonVariant} /> : 
      <DefaultLoadingFallback />
    );

  return (
    <div ref={targetRef}>
      {shouldRender ? render(isIntersecting) : loadingFallback}
    </div>
  );
};