import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Notification } from '@/types/additional'
import { NotificationType } from '@/types/additional'
import { NotificationPriority } from '@/types/additional'
import { ApiResponse } from '@/types/additional'

// NOTIFICATION STATE INTERFACE
interface NotificationState {
  // Notificaciones
  notifications: Notification[]
  unreadCount: number
  
  // Estado de carga
  isLoading: boolean
  isFetching: boolean
  
  // Filtros y paginación
  filter: 'all' | 'unread' | 'read'
  page: number
  hasMore: boolean
  
  // Estado de UI
  isNotificationPanelOpen: boolean
  
  // Configuraciones de usuario
  preferences: {
    emailEnabled: boolean
    webPushEnabled: boolean
    inAppEnabled: boolean
    orderNotifications: boolean
    paymentNotifications: boolean
    reviewNotifications: boolean
    marketingEmails: boolean
    systemNotifications: boolean
  }
  
  // WebSocket
  isConnected: boolean
  
  // Timestamps
  lastFetchedAt: number | null
  lastSeenAt: number | null
}

// NOTIFICATION ACTIONS INTERFACE
interface NotificationActions {
  // Gestión de notificaciones
  fetchNotifications: (reset?: boolean) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  
  // Notificaciones en tiempo real
  addNotification: (notification: Notification) => void
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void
  
  // Filtros
  setFilter: (filter: 'all' | 'unread' | 'read') => void
  loadMore: () => Promise<void>
  
  // Preferencias
  updatePreferences: (preferences: Partial<NotificationState['preferences']>) => Promise<void>
  
  // UI State
  setNotificationPanelOpen: (open: boolean) => void
  updateLastSeen: () => void
  
  // WebSocket
  setConnected: (connected: boolean) => void
  
  // Utilidades
  getUnreadNotifications: () => Notification[]
  getNotificationsByType: (type: NotificationType) => Notification[]
  hasUnreadNotifications: () => boolean
  getHighPriorityNotifications: () => Notification[]
}

// INITIAL STATE
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isFetching: false,
  filter: 'all',
  page: 1,
  hasMore: true,
  isNotificationPanelOpen: false,
  preferences: {
    emailEnabled: true,
    webPushEnabled: true,
    inAppEnabled: true,
    orderNotifications: true,
    paymentNotifications: true,
    reviewNotifications: true,
    marketingEmails: false,
    systemNotifications: true,
  },
  isConnected: false,
  lastFetchedAt: null,
  lastSeenAt: null,
}

// HELPER FUNCTIONS
const sortNotificationsByPriority = (notifications: Notification[]): Notification[] => {
  const priorityOrder = {
    [NotificationPriority.URGENT]: 0,
    [NotificationPriority.HIGH]: 1,
    [NotificationPriority.NORMAL]: 2,
    [NotificationPriority.LOW]: 3,
  }

  return [...notifications].sort((a, b) => {
    // Primero por prioridad
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    
    // Luego por fecha (más recientes primero)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

// NOTIFICATION STORE
export const useNotificationStore = create<NotificationState & NotificationActions>()(
  persist(
    (set, get) => ({
      // ESTADO INICIAL
      ...initialState,

      // GESTIÓN DE NOTIFICACIONES
      fetchNotifications: async (reset = false) => {
        const { getStores } = await import('./index')
        const stores = getStores()
        const authToken = stores.authStore?.token
        
        if (!authToken) return

        const { page, filter, isFetching } = get()
        if (isFetching) return

        set({ isFetching: true })

        try {
          const currentPage = reset ? 1 : page
          const queryParams = new URLSearchParams({
            page: currentPage.toString(),
            limit: '20',
            filter,
          })

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications?${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          })

          if (response.ok) {
            const result: ApiResponse<{
              notifications: Notification[]
              total: number
              unreadCount: number
              hasMore: boolean
            }> = await response.json()

            if (result.success && result.data) {
              const { notifications, unreadCount, hasMore } = result.data
              const sortedNotifications = sortNotificationsByPriority(notifications)

              set({
                notifications: reset ? sortedNotifications : [...get().notifications, ...sortedNotifications],
                unreadCount,
                hasMore,
                page: currentPage,
                lastFetchedAt: Date.now(),
                isFetching: false,
              })
            }
          }
        } catch (error) {
          console.error('Fetch notifications error:', error)
        } finally {
          set({ isFetching: false })
        }
      },

      markAsRead: async (notificationId: string) => {
        const authStore = useAuthStore?.getState?.()
        if (!authStore?.token) return

        // Actualizar localmente primero
        const { notifications, unreadCount } = get()
        const updatedNotifications = notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )

        const wasUnread = notifications.find(n => n.id === notificationId && !n.isRead)
        const newUnreadCount = wasUnread ? Math.max(0, unreadCount - 1) : unreadCount

        set({
          notifications: updatedNotifications,
          unreadCount: newUnreadCount,
        })

        // Sincronizar con servidor
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${authStore.token}`,
            },
          })
        } catch (error) {
          console.error('Mark as read error:', error)
          // Revertir cambio local si falla
          set({ notifications, unreadCount })
        }
      },

      markAllAsRead: async () => {
        const authStore = useAuthStore?.getState?.()
        if (!authStore?.token) return

        // Actualizar localmente
        const { notifications } = get()
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))

        set({
          notifications: updatedNotifications,
          unreadCount: 0,
        })

        // Sincronizar con servidor
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-all-read`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${authStore.token}`,
            },
          })
        } catch (error) {
          console.error('Mark all as read error:', error)
        }
      },

      deleteNotification: async (notificationId: string) => {
        const authStore = useAuthStore?.getState?.()
        if (!authStore?.token) return

        // Actualizar localmente
        const { notifications, unreadCount } = get()
        const notificationToDelete = notifications.find(n => n.id === notificationId)
        const updatedNotifications = notifications.filter(n => n.id !== notificationId)
        const newUnreadCount = notificationToDelete && !notificationToDelete.isRead 
          ? Math.max(0, unreadCount - 1) 
          : unreadCount

        set({
          notifications: updatedNotifications,
          unreadCount: newUnreadCount,
        })

        // Sincronizar con servidor
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authStore.token}`,
            },
          })
        } catch (error) {
          console.error('Delete notification error:', error)
        }
      },

      clearAllNotifications: async () => {
        const authStore = useAuthStore?.getState?.()
        if (!authStore?.token) return

        set({
          notifications: [],
          unreadCount: 0,
        })

        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/clear`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authStore.token}`,
            },
          })
        } catch (error) {
          console.error('Clear notifications error:', error)
        }
      },

      // NOTIFICACIONES EN TIEMPO REAL
      addNotification: (notification: Notification) => {
        const { notifications, unreadCount, preferences } = get()
        
        // Verificar preferencias del usuario
        const shouldShow = preferences.inAppEnabled && (
          (notification.type.includes('ORDER') && preferences.orderNotifications) ||
          (notification.type.includes('PAYMENT') && preferences.paymentNotifications) ||
          (notification.type.includes('REVIEW') && preferences.reviewNotifications) ||
          (notification.type.includes('SYSTEM') && preferences.systemNotifications)
        )

        if (!shouldShow) return

        const newNotifications = sortNotificationsByPriority([notification, ...notifications])
        const newUnreadCount = notification.isRead ? unreadCount : unreadCount + 1

        set({
          notifications: newNotifications,
          unreadCount: newUnreadCount,
        })

        // Mostrar notificación del navegador si está habilitado
        if (preferences.webPushEnabled && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icons/icon-192x192.png',
            tag: notification.id,
          })
        }
      },

      updateNotification: (notificationId: string, updates: Partial<Notification>) => {
        const { notifications } = get()
        const updatedNotifications = notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, ...updates }
            : notification
        )

        set({ notifications: updatedNotifications })
      },

      // FILTROS
      setFilter: (filter: 'all' | 'unread' | 'read') => {
        set({ filter, page: 1, notifications: [], hasMore: true })
        get().fetchNotifications(true)
      },

      loadMore: async () => {
        const { hasMore, page } = get()
        if (!hasMore) return

        set({ page: page + 1 })
        await get().fetchNotifications()
      },

      // PREFERENCIAS
      updatePreferences: async (newPreferences: Partial<NotificationState['preferences']>) => {
        const authStore = useAuthStore?.getState?.()
        if (!authStore?.token) return

        const { preferences } = get()
        const updatedPreferences = { ...preferences, ...newPreferences }

        set({ preferences: updatedPreferences })

        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/preferences`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authStore.token}`,
            },
            body: JSON.stringify(updatedPreferences),
          })
        } catch (error) {
          console.error('Update preferences error:', error)
          // Revertir cambios si falla
          set({ preferences })
        }
      },

      // UI STATE
      setNotificationPanelOpen: (open: boolean) => {
        set({ isNotificationPanelOpen: open })
        
        if (open) {
          get().updateLastSeen()
        }
      },

      updateLastSeen: () => {
        set({ lastSeenAt: Date.now() })
      },

      // WEBSOCKET
      setConnected: (connected: boolean) => {
        set({ isConnected: connected })
      },

      // UTILIDADES
      getUnreadNotifications: () => {
        const { notifications } = get()
        return notifications.filter(n => !n.isRead)
      },

      getNotificationsByType: (type: NotificationType) => {
        const { notifications } = get()
        return notifications.filter(n => n.type === type)
      },

      hasUnreadNotifications: () => {
        const { unreadCount } = get()
        return unreadCount > 0
      },

      getHighPriorityNotifications: () => {
        const { notifications } = get()
        return notifications.filter(n => 
          n.priority === NotificationPriority.HIGH || 
          n.priority === NotificationPriority.URGENT
        )
      },
    }),
    {
      name: 'furnibles-notification-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        lastSeenAt: state.lastSeenAt,
        // No persistir notificaciones para mantener sincronización con servidor
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Solicitar permisos de notificación si están habilitados
          if (state.preferences.webPushEnabled && 'Notification' in window) {
            if (Notification.permission === 'default') {
              Notification.requestPermission()
            }
          }
        }
      },
    }
  )
)

// Hook auxiliar para acceder al auth store
let useAuthStore: any
if (typeof window !== 'undefined') {
  import('./auth-store').then(module => {
    useAuthStore = module.useAuthStore
  })
}