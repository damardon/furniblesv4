// frontend/src/lib/orders-api.ts

import { ApiResponse } from '@/types/additional'

interface Order {
  id: string
  orderNumber: string
  buyerId: string
  subtotal: number
  subtotalAmount: number
  platformFeeRate: number
  platformFee: number
  totalAmount: number
  sellerAmount: number
  transferGroup: string
  applicationFee: number
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED'
  paymentIntentId?: string
  paymentStatus?: string
  buyerEmail: string
  billingData?: Record<string, unknown>
  metadata?: Record<string, unknown>
  feeBreakdown?: Record<string, unknown>
  createdAt: string
  paidAt?: string
  completedAt?: string
  cancelledAt?: string
  updatedAt: string
  items: OrderItem[]
  buyer: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface OrderItem {
  id: string
  orderId: string
  productId: string
  sellerId: string
  productTitle: string
  productSlug: string
  price: number
  quantity: number
  sellerName: string
  storeName: string
  createdAt: string
  product: {
    id: string
    title: string
    slug: string
    thumbnailFileIds: string
    pdfFileId: string
  }
}

interface OrdersResponse {
  data: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface OrderFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  search?: string
  sortBy?: 'createdAt' | 'totalAmount' | 'status'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Helper function to get auth token
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

// ✅ Obtener pedidos del usuario comprador
export async function getBuyerOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/my?${queryParams}`, {
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
    
    return data
  } catch (error) {
    console.error('❌ [ORDERS-API] Error fetching buyer orders:', error)
    throw error
  }
}

// ✅ Obtener pedido específico por número
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderNumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    return data
  } catch (error) {
    console.error('❌ [ORDERS-API] Error fetching order:', error)
    return null
  }
}

// ✅ Crear nuevo pedido
export async function createOrder(orderData: {
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  totalAmount: number
  billingData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}): Promise<ApiResponse<Order>> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ [ORDERS-API] Create order failed:', result)
      return { success: false, error: result.message || 'Error creating order' }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('❌ [ORDERS-API] Error creating order:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// ✅ Cancelar pedido
export async function cancelOrder(orderNumber: string, reason?: string): Promise<ApiResponse> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderNumber}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ [ORDERS-API] Cancel order failed:', result)
      return { success: false, error: result.message || 'Error cancelling order' }
    }

    return { success: true }
  } catch (error) {
    console.error('❌ [ORDERS-API] Error cancelling order:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// ✅ Obtener ventas del vendedor
export async function getSellerSales(filters: OrderFilters = {}): Promise<OrdersResponse> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/sales?${queryParams}`, {
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
    
    return data
  } catch (error) {
    console.error('❌ [ORDERS-API] Error fetching seller sales:', error)
    throw error
  }
}

// ✅ Obtener estadísticas de pedidos
export async function getOrderStats(period = '30d'): Promise<{
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  completionRate: number
  ordersByStatus: Array<{ status: string; count: number }>
  revenueByMonth: Array<{ month: string; revenue: number; orders: number }>
}> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/stats?period=${period}`, {
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
    
    return data
  } catch (error) {
    console.error('❌ [ORDERS-API] Error fetching order stats:', error)
    throw error
  }
}

// ✅ Validar que el usuario puede acceder a un pedido
export async function canAccessOrder(orderNumber: string): Promise<boolean> {
  try {
    const token = getAuthToken()
    if (!token) return false

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderNumber}/access`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error('❌ [ORDERS-API] Error checking order access:', error)
    return false
  }
}

// ✅ Exportar tipos para uso en componentes
export type { 
  Order, 
  OrderItem, 
  OrdersResponse, 
  OrderFilters 
}