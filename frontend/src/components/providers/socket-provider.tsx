'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { storeManager } from '@/lib/stores/store-manager'
import { Notification, Order } from '@/types/additional'
import * as React from 'react'


// SOCKET CONTEXT TYPE
interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connectionError: string | null
  reconnectAttempts: number
}

// SOCKET CONTEXT
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
  reconnectAttempts: 0,
})

// SOCKET PROVIDER PROPS
interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

const user = storeManager.getCurrentUser()
const token = storeManager.getToken()
const isAuthenticated = storeManager.isAuthenticated()


const setConnected = (connected: boolean) => {
  try {
    if (typeof window !== 'undefined') {
      const { useNotificationStore } = require('@/lib/stores/notification-store')
      const store = useNotificationStore.getState()
      if (store.setConnected) {
        store.setConnected(connected)
      }
    }
  } catch (error) {
    console.warn('No se pudo actualizar estado de conexión:', error)
  }
}

const addNotification = (notification: any) => {
  // Para agregar notificaciones, necesitamos acceso directo al store
  try {
    if (typeof window !== 'undefined') {
      const { useNotificationStore } = require('@/lib/stores/notification-store')
      const store = useNotificationStore.getState()
      if (store.addNotification) {
        store.addNotification(notification)
      }
    }
  } catch (error) {
    console.warn('No se pudo agregar notificación:', error)
  }
}
const syncWithServer = () => {
  const cartStore = storeManager.getCartState()
  // Implementar lógica específica
}

  useEffect(() => {
    // Solo conectar si el usuario está autenticado
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
        setConnected(false)
      }
      return
    }

    // Crear conexión Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    // EVENT LISTENERS

    // Conexión exitosa
    newSocket.on('connect', () => {
      console.log('🔌 Socket conectado:', newSocket.id)
      setIsConnected(true)
      setConnected(true)
      setConnectionError(null)
      setReconnectAttempts(0)
      
      // Unirse a room de usuario
      if (user?.id) {
        newSocket.emit('join:user', user.id)
      }
    })

    // Desconexión
    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket desconectado:', reason)
      setIsConnected(false)
      setConnected(false)
      
      if (reason === 'io server disconnect') {
        // El servidor forzó la desconexión, reconectar manualmente
        newSocket.connect()
      }
    })

    // Error de conexión
    newSocket.on('connect_error', (error) => {
      console.error('🔌 Error de conexión socket:', error)
      setConnectionError(error.message)
      setReconnectAttempts(prev => prev + 1)
    })

    // Evento de reconexión
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Socket reconectado después de', attemptNumber, 'intentos')
      setReconnectAttempts(0)
      setConnectionError(null)
    })

    // EVENTOS DE NEGOCIO

    // Nueva notificación
    newSocket.on('notification:new', (notification: Notification) => {
      console.log('🔔 Nueva notificación:', notification)
      addNotification(notification)
    })

    // Actualización de orden
    newSocket.on('order:status-changed', (data: { order: Order; status: string }) => {
      console.log('📦 Estado de orden actualizado:', data)
      
      // Crear notificación local para cambios de orden
      const notification: Notification = {
        id: `order-${data.order.id}-${Date.now()}`,
        userId: user?.id || '',
        type: 'ORDER_STATUS_CHANGED' as any,
        title: 'Estado de orden actualizado',
        message: `Tu orden ${data.order.orderNumber} ha cambiado a: ${data.status}`,
        data: { orderId: data.order.id, newStatus: data.status },
        isRead: false,
        emailSent: false,
        priority: 'NORMAL' as any,
        channel: 'IN_APP' as any,
        clickCount: 0,
        createdAt: new Date().toISOString(),
      }
      
      addNotification(notification)
    })

    // Producto aprobado/rechazado
    newSocket.on('product:moderated', (data: { productId: string; status: string; reason?: string }) => {
      console.log('📋 Producto moderado:', data)
      
      const notification: Notification = {
        id: `product-${data.productId}-${Date.now()}`,
        userId: user?.id || '',
        type: data.status === 'APPROVED' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED' as any,
        title: data.status === 'APPROVED' ? 'Producto Aprobado' : 'Producto Rechazado',
        message: data.status === 'APPROVED' 
          ? 'Tu producto ha sido aprobado y ya está visible en el marketplace'
          : `Tu producto fue rechazado. Razón: ${data.reason || 'No especificada'}`,
        data: { productId: data.productId, status: data.status, reason: data.reason },
        isRead: false,
        emailSent: false,
        priority: 'NORMAL' as any,
        channel: 'IN_APP' as any,
        clickCount: 0,
        createdAt: new Date().toISOString(),
      }
      
      addNotification(notification)
    })

    // Nueva reseña recibida
    newSocket.on('review:received', (data: { productId: string; rating: number; reviewId: string }) => {
      console.log('⭐ Nueva reseña recibida:', data)
      
      const notification: Notification = {
        id: `review-${data.reviewId}-${Date.now()}`,
        userId: user?.id || '',
        type: 'REVIEW_RECEIVED' as any,
        title: 'Nueva Reseña Recibida',
        message: `Has recibido una nueva reseña de ${data.rating} estrellas`,
        data: { productId: data.productId, rating: data.rating, reviewId: data.reviewId },
        isRead: false,
        emailSent: false,
        priority: 'NORMAL' as any,
        channel: 'IN_APP' as any,
        clickCount: 0,
        createdAt: new Date().toISOString(),
      }
      
      addNotification(notification)
    })

    // Pago recibido
    newSocket.on('payment:received', (data: { amount: number; orderId: string; currency: string }) => {
      console.log('💰 Pago recibido:', data)
      
      const notification: Notification = {
        id: `payment-${data.orderId}-${Date.now()}`,
        userId: user?.id || '',
        type: 'PAYMENT_RECEIVED' as any,
        title: 'Pago Recibido',
        message: `Has recibido un pago de ${data.currency.toUpperCase()} ${data.amount}`,
        data: { amount: data.amount, orderId: data.orderId, currency: data.currency },
        isRead: false,
        emailSent: false,
        priority: 'HIGH' as any,
        channel: 'IN_APP' as any,
        clickCount: 0,
        createdAt: new Date().toISOString(),
      }
      
      addNotification(notification)
    })

    // Carrito sincronizado (para múltiples dispositivos)
    newSocket.on('cart:updated', () => {
      console.log('🛒 Carrito actualizado desde otro dispositivo')
      syncWithServer()
    })

    // Evento de sistema (mantenimiento, actualizaciones, etc.)
    newSocket.on('system:announcement', (data: { title: string; message: string; priority: string }) => {
      console.log('📢 Anuncio del sistema:', data)
      
      const notification: Notification = {
        id: `system-${Date.now()}`,
        userId: user?.id || '',
        type: 'SYSTEM_MAINTENANCE' as any,
        title: data.title,
        message: data.message,
        data: {},
        isRead: false,
        emailSent: false,
        priority: (data.priority as any) || 'NORMAL',
        channel: 'IN_APP' as any,
        clickCount: 0,
        createdAt: new Date().toISOString(),
      }
      
      addNotification(notification)
    })

    // Establecer socket
    setSocket(newSocket)

    // Cleanup
    return () => {
      console.log('🔌 Limpiando conexión socket')
      newSocket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setConnected(false)
    }
  }, [isAuthenticated, token, user?.id, addNotification, setConnected, syncWithServer])

  // Limpiar socket al desmontar
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    connectionError,
    reconnectAttempts,
  }

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
      
      {/* Indicador de conexión en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-1 right-1 z-50 flex items-center space-x-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
          <div 
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} 
          />
          <span>
            {isConnected ? 'Socket OK' : `Socket OFF${reconnectAttempts > 0 ? ` (${reconnectAttempts})` : ''}`}
          </span>
        </div>
      )}
    </SocketContext.Provider>
  )
}

// HOOK PARA USAR SOCKET
export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de SocketProvider')
  }
  return context
}

// HOOK PARA EMITIR EVENTOS
export function useSocketEmit() {
  const { socket, isConnected } = useSocket()
  
  return {
    emit: (event: string, data?: any) => {
      if (socket && isConnected) {
        socket.emit(event, data)
      } else {
        console.warn('Socket no conectado, no se puede emitir evento:', event)
      }
    },
    isConnected,
  }
}