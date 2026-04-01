import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/services/notifications'
import type { NotificationId } from '@/types/branded'
import type { Notification, NotificationFilters } from '@/types/domain'

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => fetchNotifications(filters),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: fetchUnreadCount,
    staleTime: 60_000, // 1 minute — sidebar badge, light query
    refetchInterval: 5000, // Poll every 5s (replaces Supabase Realtime)
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: NotificationId) => markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.lists() })
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount() })

      const previousLists = queryClient.getQueriesData<Notification[]>({
        queryKey: queryKeys.notifications.lists(),
      })

      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount()
      )

      // Optimistic: mark as read in all lists
      queryClient.setQueriesData<Notification[]>(
        { queryKey: queryKeys.notifications.lists() },
        (old) => old?.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )

      // Optimistic: decrement unread count
      queryClient.setQueryData<number>(
        queryKeys.notifications.unreadCount(),
        (old) => Math.max(0, (old ?? 1) - 1),
      )

      return { previousLists, previousCount }
    },
    onError: (error, _id, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data)
        }
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), context.previousCount)
      }
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.lists() })
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount() })

      const previousLists = queryClient.getQueriesData<Notification[]>({
        queryKey: queryKeys.notifications.lists(),
      })

      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount()
      )

      // Optimistic: mark all as read
      queryClient.setQueriesData<Notification[]>(
        { queryKey: queryKeys.notifications.lists() },
        (old) => old?.map((n) => ({ ...n, read: true })),
      )

      // Optimistic: set count to 0
      queryClient.setQueryData<number>(queryKeys.notifications.unreadCount(), 0)

      return { previousLists, previousCount }
    },
    onError: (error, _void, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data)
        }
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), context.previousCount)
      }
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: NotificationId) => deleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.lists() })
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount() })

      const previousLists = queryClient.getQueriesData<Notification[]>({
        queryKey: queryKeys.notifications.lists(),
      })

      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount()
      )

      // Check if deleted notification was unread
      let wasUnread = false
      queryClient.setQueriesData<Notification[]>(
        { queryKey: queryKeys.notifications.lists() },
        (old) => {
          const target = old?.find((n) => n.id === id)
          if (target && !target.read) wasUnread = true
          return old?.filter((n) => n.id !== id)
        },
      )

      if (wasUnread) {
        queryClient.setQueryData<number>(
          queryKeys.notifications.unreadCount(),
          (old) => Math.max(0, (old ?? 1) - 1),
        )
      }

      return { previousLists, previousCount }
    },
    onError: (error, _id, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data)
        }
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), context.previousCount)
      }
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}
