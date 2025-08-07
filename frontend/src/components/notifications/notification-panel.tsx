'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  X, 
  Bell, 
  CheckCircle, 
  Package, 
  Star, 
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'

// ✅ Tipos coherentes con backend
interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: any
  isRead: boolean
  readAt?: string
  sentAt: string
  emailSent: boolean
  orderId?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  channel: 'EMAIL' | 'WEB_PUSH' | 'IN_APP' | 'SMS'
  groupKey?: string
  expiresAt?: string
  clickedAt?: string
  clickCount: number
  createdAt: string
}

interface NotificationsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface NotificationsData {
  data: Notification[]
  pagination: NotificationsPagination
  unreadCount: number
}

// ✅ Helper para obtener token de autenticación
const getAuthToken = (): string | null => {
  try {
    const authData = localStorage.getItem('furnibles-auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed.state?.token || parsed.token
    }
  } catch (error) {
    console.error('Error parsing auth token:', error)
  }
  return null
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const t = useTranslations('notifications')
  
  const { isAuthenticated, user } = useAuthStore()

  // ✅ Estados locales para manejar datos
  const [notificationsData, setNotificationsData] = useState<NotificationsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // ✅ Cargar notificaciones desde API
  const loadNotifications = async (page: number = 1) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const token = getAuthToken()
      if (!token) {
        setError('No autorizado')
        return
      }

      console.log('🔍 [NOTIFICATIONS] Loading notifications')
      
      // Construir query params
      const queryParams = new URLSearchParams()
      queryParams.append('page', page.toString())
      queryParams.append('limit', '20')
      queryParams.append('sortBy', 'createdAt')
      queryParams.append('sortOrder', 'desc')
      
      if (filter === 'unread') queryParams.append('isRead', 'false')
      if (selectedType !== 'all') queryParams.append('type', selectedType)
      
      // ✅ API call para notificaciones
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ [NOTIFICATIONS] Notifications loaded:', data.data?.length || 0)
      
      // Calcular unreadCount desde los datos
      const unreadCount = data.data?.filter((n: Notification) => !n.isRead).length || 0
      
      setNotificationsData({
        data: data.data || [],
        pagination: {
          page: data.page || 1,
          limit: data.limit || 20,
          total: data.total || 0,
          totalPages: data.totalPages || 0,
        },
        unreadCount
      })

    } catch (err) {
      console.error('❌ [NOTIFICATIONS] Error loading notifications:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      const token = getAuthToken()
      if (!token) return

      console.log('🔍 [NOTIFICATIONS] Marking as read:', notificationId)
      
      // ✅ API call para marcar como leída
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        console.log('✅ [NOTIFICATIONS] Marked as read successfully')
        
        // Actualizar estado local
        setNotificationsData(prev => {
          if (!prev) return prev
          
          const updatedNotifications = prev.data.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
          
          const unreadCount = updatedNotifications.filter(n => !n.isRead).length
          
          return {
            ...prev,
            data: updatedNotifications,
            unreadCount
          }
        })
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error marking as read:', error)
    }
  }

  // ✅ Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      console.log('🔍 [NOTIFICATIONS] Marking all as read')
      
      // ✅ API call para marcar todas como leídas
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        console.log('✅ [NOTIFICATIONS] All marked as read successfully')
        
        // Actualizar estado local
        setNotificationsData(prev => {
          if (!prev) return prev
          
          const updatedNotifications = prev.data.map(notif => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString()
          }))
          
          return {
            ...prev,
            data: updatedNotifications,
            unreadCount: 0
          }
        })
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error marking all as read:', error)
    }
  }

  // ✅ Eliminar notificación
  const deleteNotification = async (notificationId: string) => {
    try {
      const token = getAuthToken()
      if (!token) return

      console.log('🔍 [NOTIFICATIONS] Deleting notification:', notificationId)
      
      // ✅ API call para eliminar notificación
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        console.log('✅ [NOTIFICATIONS] Deleted successfully')
        
        // Actualizar estado local
        setNotificationsData(prev => {
          if (!prev) return prev
          
          const filteredNotifications = prev.data.filter(notif => notif.id !== notificationId)
          const unreadCount = filteredNotifications.filter(n => !n.isRead).length
          
          return {
            ...prev,
            data: filteredNotifications,
            unreadCount,
            pagination: {
              ...prev.pagination,
              total: prev.pagination.total - 1
            }
          }
        })
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error deleting notification:', error)
    }
  }

  // ✅ Cargar datos cuando se abre el panel
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadNotifications()
    }
  }, [isOpen, isAuthenticated])

  // ✅ Recargar cuando cambian los filtros
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadNotifications()
    }
  }, [filter, selectedType])

  // ✅ Obtener ícono según tipo de notificación
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_COMPLETED':
      case 'ORDER_SHIPPED':
      case 'ORDER_DELIVERED':
        return <Package className="w-5 h-5 text-green-600" />
      case 'REVIEW_RECEIVED':
      case 'REVIEW_RESPONSE':
        return <Star className="w-5 h-5 text-yellow-600" />
      case 'PAYOUT_RECEIVED':
      case 'PAYMENT_RECEIVED':
        return <DollarSign className="w-5 h-5 text-green-600" />
      case 'PRODUCT_APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'PRODUCT_REJECTED':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'PROMOTION':
      case 'MARKETING':
        return <ShoppingCart className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-blue-600" />
    }
  }

  // ✅ Obtener color según tipo
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_COMPLETED':
      case 'ORDER_SHIPPED':
      case 'PRODUCT_APPROVED':
      case 'PAYOUT_RECEIVED':
        return 'bg-green-100 border-green-500'
      case 'REVIEW_RECEIVED':
      case 'REVIEW_RESPONSE':
        return 'bg-yellow-100 border-yellow-500'
      case 'PRODUCT_REJECTED':
        return 'bg-red-100 border-red-500'
      case 'PROMOTION':
      case 'MARKETING':
        return 'bg-orange-100 border-orange-500'
      default:
        return 'bg-blue-100 border-blue-500'
    }
  }

  // ✅ Formatear fecha relativa
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Hace un momento'
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffHours < 48) return 'Ayer'
    
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    })
  }

  // ✅ Manejar acciones locales
  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleDelete = (notificationId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      deleteNotification(notificationId)
    }
  }

  const handleRefresh = () => {
    loadNotifications()
  }

  // ✅ Filtrar notificaciones
  const filteredNotifications = notificationsData?.data.filter(notif => {
    if (filter === 'unread' && notif.isRead) return false
    if (selectedType !== 'all' && notif.type !== selectedType) return false
    return true
  }) || []

  if (!isOpen || !isAuthenticated) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white border-[5px] border-black w-full max-w-2xl max-h-[80vh] overflow-hidden"
        style={{ boxShadow: '12px 12px 0 #000000' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 border-3 border-black flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-black uppercase">
                Notificaciones
              </h2>
              <p className="text-gray-600 font-bold text-sm">
                {notificationsData?.unreadCount || 0} {(notificationsData?.unreadCount || 0) === 1 ? 'nueva' : 'nuevas'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllAsRead}
              disabled={(notificationsData?.unreadCount || 0) === 0}
              className="p-2 bg-white border-3 border-black hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              title="Marcar todo como leído"
            >
              <CheckCircle className="w-5 h-5 text-black" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 bg-white border-3 border-black hover:bg-red-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b-2 border-black bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-black" />
              <span className="font-black text-black text-sm uppercase">Filtros:</span>
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
              className="px-3 py-2 bg-white border-2 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <option value="all">Todas</option>
              <option value="unread">No leídas</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-white border-2 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <option value="all">Todos los tipos</option>
              <option value="ORDER_COMPLETED">Pedidos</option>
              <option value="REVIEW_RECEIVED">Reviews</option>
              <option value="PAYOUT_RECEIVED">Pagos</option>
              <option value="PRODUCT_APPROVED">Productos</option>
              <option value="PROMOTION">Promociones</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 bg-white border-2 border-black hover:bg-blue-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '2px 2px 0 #000000' }}
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 text-black ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600 font-bold">Cargando notificaciones...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-black text-black uppercase mb-2">Error</h3>
              <p className="text-gray-600 font-bold mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="bg-orange-500 border-2 border-black text-black font-black py-2 px-4 uppercase hover:bg-orange-400 transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                Reintentar
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-black text-black uppercase mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-600 font-bold">
                {filter === 'unread' 
                  ? 'Todas las notificaciones están leídas'
                  : 'No tienes notificaciones en este momento'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 transition-all hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-yellow-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 border-2 border-black ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-black text-sm uppercase ${
                          !notification.isRead ? 'text-black' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                          <span className="text-xs text-gray-600 font-bold whitespace-nowrap">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm leading-relaxed mb-3 ${
                        !notification.isRead ? 'text-black font-medium' : 'text-gray-600 font-medium'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {notification.orderId && (
                          <Link
                            href={`/pedidos/${notification.orderId}`}
                            onClick={() => {
                              handleMarkAsRead(notification.id)
                              onClose()
                            }}
                            className="flex items-center gap-1 text-xs bg-blue-400 border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                            style={{ boxShadow: '2px 2px 0 #000000' }}
                          >
                            <Eye className="w-3 h-3" />
                            Ver
                          </Link>
                        )}
                        
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="flex items-center gap-1 text-xs bg-green-400 border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                            style={{ boxShadow: '2px 2px 0 #000000' }}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Marcar Leída
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="flex items-center gap-1 text-xs bg-red-400 border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                          style={{ boxShadow: '2px 2px 0 #000000' }}
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-4 border-black bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 font-bold">
              Mostrando {filteredNotifications.length} notificaciones
            </div>
            
            <Link
              href="/configuracion/notificaciones"
              onClick={onClose}
              className="flex items-center gap-2 text-sm bg-white border-2 border-black px-3 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <Settings className="w-4 h-4" />
              Configurar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}