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
import { useNotificationStore } from '@/lib/stores/notification-store'
import { useAuthStore } from '@/lib/stores/auth-store'

// Mock notification types and data
enum NotificationType {
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  PAYOUT_RECEIVED = 'PAYOUT_RECEIVED',
  PRODUCT_APPROVED = 'PRODUCT_APPROVED',
  PRODUCT_REJECTED = 'PRODUCT_REJECTED',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  PROMOTION = 'PROMOTION'
}

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
  metadata?: any
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: 'notif_001',
    type: NotificationType.ORDER_COMPLETED,
    title: 'Pedido Completado',
    message: 'Tu pedido ORD-20241201-001 ha sido completado exitosamente. Ya puedes descargar tus archivos.',
    isRead: false,
    createdAt: '2024-12-07T10:30:00Z',
    actionUrl: '/pedidos/ORD-20241201-001'
  },
  {
    id: 'notif_002',
    type: NotificationType.REVIEW_RECEIVED,
    title: 'Nueva Review Recibida',
    message: 'Has recibido una nueva review de 5 estrellas en "Mesa de Comedor Moderna Roble".',
    isRead: false,
    createdAt: '2024-12-06T15:45:00Z',
    actionUrl: '/reviews'
  },
  {
    id: 'notif_003',
    type: NotificationType.PAYOUT_RECEIVED,
    title: 'Pago Recibido',
    message: 'Has recibido un pago de $25.64 USD por tus ventas del período anterior.',
    isRead: true,
    createdAt: '2024-12-05T09:15:00Z',
    actionUrl: '/vendedor/dashboard'
  },
  {
    id: 'notif_004',
    type: NotificationType.PRODUCT_APPROVED,
    title: 'Producto Aprobado',
    message: 'Tu producto "Estantería Industrial" ha sido aprobado y ya está disponible en el marketplace.',
    isRead: true,
    createdAt: '2024-12-04T14:20:00Z',
    actionUrl: '/vendedor/productos'
  },
  {
    id: 'notif_005',
    type: NotificationType.PROMOTION,
    title: 'Oferta Especial',
    message: '¡50% de descuento en productos premium! Válido hasta el 15 de diciembre.',
    isRead: false,
    createdAt: '2024-12-03T08:00:00Z',
    actionUrl: '/productos?featured=true'
  }
]

export function NotificationPanel() {
  const t = useTranslations('notifications')
  
  // Stores
  const { 
    isNotificationPanelOpen, 
    setNotificationPanelOpen, 
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification 
  } = useNotificationStore()
  
  const { isAuthenticated } = useAuthStore()

  // Local states
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all')

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_COMPLETED:
      case NotificationType.ORDER_SHIPPED:
        return <Package className="w-5 h-5 text-green-600" />
      case NotificationType.REVIEW_RECEIVED:
        return <Star className="w-5 h-5 text-yellow-600" />
      case NotificationType.PAYOUT_RECEIVED:
        return <DollarSign className="w-5 h-5 text-green-600" />
      case NotificationType.PRODUCT_APPROVED:
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case NotificationType.PRODUCT_REJECTED:
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case NotificationType.PROMOTION:
        return <ShoppingCart className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-blue-600" />
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_COMPLETED:
      case NotificationType.ORDER_SHIPPED:
        return 'bg-green-100 border-green-500'
      case NotificationType.REVIEW_RECEIVED:
        return 'bg-yellow-100 border-yellow-500'
      case NotificationType.PAYOUT_RECEIVED:
      case NotificationType.PRODUCT_APPROVED:
        return 'bg-green-100 border-green-500'
      case NotificationType.PRODUCT_REJECTED:
        return 'bg-red-100 border-red-500'
      case NotificationType.PROMOTION:
        return 'bg-orange-100 border-orange-500'
      default:
        return 'bg-blue-100 border-blue-500'
    }
  }

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

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    )
    markAsRead(notificationId)
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    )
    markAllAsRead()
  }

  const handleDelete = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    )
    deleteNotification(notificationId)
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread' && notif.isRead) return false
    if (selectedType !== 'all' && notif.type !== selectedType) return false
    return true
  })

  const handleClose = () => {
    setNotificationPanelOpen(false)
  }

  if (!isNotificationPanelOpen || !isAuthenticated) return null

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
                {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="p-2 bg-white border-3 border-black hover:bg-green-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              title="Marcar todo como leído"
            >
              <CheckCircle className="w-5 h-5 text-black" />
            </button>
            
            <button
              onClick={handleClose}
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
              onChange={(e) => setSelectedType(e.target.value as NotificationType | 'all')}
              className="px-3 py-2 bg-white border-2 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <option value="all">Todos los tipos</option>
              <option value={NotificationType.ORDER_COMPLETED}>Pedidos</option>
              <option value={NotificationType.REVIEW_RECEIVED}>Reviews</option>
              <option value={NotificationType.PAYOUT_RECEIVED}>Pagos</option>
              <option value={NotificationType.PRODUCT_APPROVED}>Productos</option>
              <option value={NotificationType.PROMOTION}>Promociones</option>
            </select>

            <button
              onClick={() => {
                // Simulate refresh
                console.log('Refreshing notifications...')
              }}
              className="p-2 bg-white border-2 border-black hover:bg-blue-400 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {filteredNotifications.length === 0 ? (
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
                        <h4 className={`font-black text-black text-sm uppercase ${
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
                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            onClick={() => {
                              handleMarkAsRead(notification.id)
                              handleClose()
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
              onClick={handleClose}
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