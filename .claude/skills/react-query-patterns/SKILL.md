---
name: react-query-patterns
description: TanStack React Query (@tanstack/react-query) patterns for projects using useQuery, useMutation, and QueryClient. Use when implementing data fetching hooks, query key factories, optimistic updates, cache invalidation, or server state management with React Query.
user-invocable: false
---

# TanStack React Query Patterns

> **Error Handling, Optimistic Update, Cache Invalidation, Dependent Queries, Loading Strategy** 등
> 아키텍처 원칙은 `react-data-patterns.md` 참조. 이 스킬은 코드 템플릿에 집중.

## Query Key Factory

Centralize ALL query keys in a single factory object. Never use inline string arrays.

```tsx
// lib/queryClient.ts
export const queryKeys = {
  items: {
    all: ["items"] as const,
    lists: () => [...queryKeys.items.all, "list"] as const,
    list: (filters: ItemFilters) => [...queryKeys.items.lists(), filters] as const,
    details: () => [...queryKeys.items.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.items.details(), id] as const,
  },
  comments: {
    all: ["comments"] as const,
    byItem: (itemId: string) => [...queryKeys.comments.all, "item", itemId] as const,
  },
  // ... add per domain
} as const;
```

## Query Hook Pattern

```tsx
// hooks/useItems.ts
export function useItem(
  id: string,
  options?: Omit<UseQueryOptions<Item, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: () => getItem(id),
    enabled: Boolean(id),        // Prevent empty ID fetches
    ...options,
  });
}

export function useItemList(
  filters: ItemFilters,
  options?: Omit<UseQueryOptions<Item[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.items.list(filters),
    queryFn: () => getItems(filters),
    ...options,
  });
}
```

## Mutation Hook Pattern

```tsx
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.lists(),
      });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
    },
  });
}
```

## Optimistic Update / Cache Invalidation / QueryClient Config

> 상세 패턴 (4-step optimistic update, targeted invalidation, infinite query 주의사항,
> batch helpers, query defaults)은 `react-data-patterns.md` §2, §3, §6 참조.
