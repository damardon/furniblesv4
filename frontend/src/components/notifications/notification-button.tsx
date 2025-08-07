'use client'

import { useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { useAuthStore } from '@/lib/stores/auth-store'

export function NotificationButton() {
  const { isAuthenticated } = useAuthStore()
  const { 
    unreadCount, 
    setNotificationPanelOpen,
    fetchNotifications 
  } = useNotificationStore()

  // ✅ Cargar notificaciones cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(true)
    }
  }, [isAuthenticated, fetchNotifications])

  // ✅ No mostrar si no está autenticado
  if (!isAuthenticated) {
    return null
  }

  const handleClick = () => {
    setNotificationPanelOpen(true)
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 bg-white border-3 border-black hover:bg-yellow-400 transition-all"
      style={{ boxShadow: '3px 3px 0 #000000' }}
      title="Notificaciones"
    >
      <Bell className="w-5 h-5 text-black" />
      {/* Badge de notificaciones no leídas */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black w-5 h-5 flex items-center justify-center border-2 border-black">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}