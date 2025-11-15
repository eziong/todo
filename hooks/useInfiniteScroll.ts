// =============================================
// INFINITE SCROLL HOOK
// =============================================
// Container hook for infinite scroll functionality with performance optimization

import { useEffect, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

// =============================================
// TYPES
// =============================================

export interface InfiniteScrollOptions<TData> {
  queryKey: readonly unknown[];
  queryFn: (params: { pageParam: number }) => Promise<{
    data: TData[];
    nextCursor: number | null;
    hasNextPage: boolean;
    totalCount: number;
  }>;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  initialPageParam?: number;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export interface UseInfiniteScrollReturn<TData> {
  // Data
  data: TData[];
  flatData: TData[];
  totalCount: number;
  
  // Loading states
  loading: boolean;
  loadingMore: boolean;
  isInitialLoading: boolean;
  isFetching: boolean;
  
  // Pagination
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
  
  // Error handling
  error: Error | null;
  
  // Intersection observer
  ref: React.RefCallback<Element>;
  inView: boolean;
  
  // Manual control
  refetch: () => void;
  
  // Performance metrics
  itemCount: number;
  pageCount: number;
  
  // Status
  status: 'pending' | 'error' | 'success';
  fetchStatus: 'fetching' | 'paused' | 'idle';
}

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export const useInfiniteScroll = <TData = unknown>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  gcTime = 10 * 60 * 1000, // 10 minutes
  initialPageParam = 0,
  rootMargin = '100px',
  threshold = 0.1,
  triggerOnce = false,
}: InfiniteScrollOptions<TData>): UseInfiniteScrollReturn<TData> => {
  
  // Intersection observer for auto-loading
  const { ref, inView } = useInView({
    rootMargin,
    threshold,
    triggerOnce,
  });

  // Infinite query
  const {
    data: queryData,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    status,
    fetchStatus,
    error,
    refetch,
    isInitialLoading,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => queryFn({ pageParam }),
    initialPageParam,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage, allPages) => {
      if (allPages.length <= 1) return undefined;
      return Math.max(0, allPages.length - 2);
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false, // Disable for performance
    refetchOnReconnect: true,
  });

  // Flatten data from all pages
  const flatData = useMemo(() => {
    if (!queryData?.pages) return [];
    return queryData.pages.flatMap((page) => page.data);
  }, [queryData?.pages]);

  // Get total count from the first page response
  const totalCount = useMemo(() => {
    if (!queryData?.pages?.length) return 0;
    return queryData.pages[0]?.totalCount || 0;
  }, [queryData?.pages]);

  // Performance metrics
  const itemCount = flatData.length;
  const pageCount = queryData?.pages?.length || 0;

  // Auto-fetch when in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && enabled) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, enabled]);

  // Memoized fetch handlers
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleFetchPreviousPage = useCallback(() => {
    if (hasPreviousPage && !isFetchingPreviousPage) {
      fetchPreviousPage();
    }
  }, [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

  // Loading states
  const loading = status === 'pending';
  const loadingMore = isFetchingNextPage || isFetchingPreviousPage;

  return {
    // Data
    data: flatData,
    flatData,
    totalCount,
    
    // Loading states
    loading,
    loadingMore,
    isInitialLoading,
    isFetching,
    
    // Pagination
    hasNextPage: hasNextPage || false,
    hasPreviousPage: hasPreviousPage || false,
    fetchNextPage: handleFetchNextPage,
    fetchPreviousPage: handleFetchPreviousPage,
    
    // Error handling
    error: error as Error | null,
    
    // Intersection observer
    ref,
    inView,
    
    // Manual control
    refetch,
    
    // Performance metrics
    itemCount,
    pageCount,
    
    // Status
    status,
    fetchStatus,
  };
};

// =============================================
// VIRTUAL SCROLL HOOK
// =============================================
// Enhanced hook with virtual scrolling for large lists

export interface VirtualScrollOptions<TData> extends InfiniteScrollOptions<TData> {
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
  enableVirtualization?: boolean;
}

export interface UseVirtualInfiniteScrollReturn<TData> extends UseInfiniteScrollReturn<TData> {
  // Virtual scroll specific
  virtualItems: Array<{
    index: number;
    start: number;
    size: number;
    data: TData;
  }>;
  totalSize: number;
  scrollElement: HTMLElement | null;
  setScrollElement: (element: HTMLElement | null) => void;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  
  // Performance
  visibleRange: { start: number; end: number };
  renderRange: { start: number; end: number };
}

export const useVirtualInfiniteScroll = <TData = unknown>({
  itemHeight,
  containerHeight,
  overscan = 5,
  enableVirtualization = true,
  ...infiniteOptions
}: VirtualScrollOptions<TData>): UseVirtualInfiniteScrollReturn<TData> => {
  
  const infiniteScroll = useInfiniteScroll<TData>(infiniteOptions);
  
  // For now, return the basic infinite scroll with virtual scroll placeholders
  // This would be enhanced with a virtual scrolling library like @tanstack/react-virtual
  // in a production implementation
  
  const virtualItems = useMemo(() => {
    if (!enableVirtualization) {
      return infiniteScroll.flatData.map((data, index) => ({
        index,
        start: typeof itemHeight === 'number' ? index * itemHeight : 0,
        size: typeof itemHeight === 'number' ? itemHeight : 50,
        data,
      }));
    }
    
    // Simplified virtual items calculation
    return infiniteScroll.flatData.slice(0, Math.ceil(containerHeight / 50) + overscan * 2).map((data, index) => ({
      index,
      start: index * 50,
      size: 50,
      data,
    }));
  }, [infiniteScroll.flatData, enableVirtualization, itemHeight, containerHeight, overscan]);

  const totalSize = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return infiniteScroll.itemCount * itemHeight;
    }
    return infiniteScroll.itemCount * 50; // Fallback height
  }, [infiniteScroll.itemCount, itemHeight]);

  return {
    ...infiniteScroll,
    
    // Virtual scroll specific (simplified implementation)
    virtualItems,
    totalSize,
    scrollElement: null,
    setScrollElement: (): void => {},
    scrollToIndex: (): void => {},
    
    // Performance (simplified)
    visibleRange: { start: 0, end: virtualItems.length },
    renderRange: { start: 0, end: virtualItems.length },
  };
};