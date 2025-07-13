import { Order, OrderStatus, OrderItem } from '@/types'
import { mockProducts } from './mockProducts'

// Mock data de órdenes coherente con el backend
export const mockOrders: Order[] = [
  {
    id: 'ord_clx1a2b3c4d5e6f7g8h9i0j1',
    orderNumber: 'ORD-20241201-001',
    subtotal: 28.49,
    platformFee: 2.85,
    sellerAmount: 25.64,
    totalAmount: 31.34,
    status: OrderStatus.COMPLETED,
    paymentIntentId: 'pi_3O4Z5L2eZvKYlo2C1234567',
    paymentStatus: 'succeeded',
    isGuestOrder: false,
    buyerId: 'buyer_001',
    billingAddress: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+56 9 8765 4321',
      country: 'Chile',
      city: 'Santiago',
      address: 'Av. Providencia 123',
      zipCode: '7500000'
    },
    items: [
      {
        id: 'oit_001',
        orderId: 'ord_clx1a2b3c4d5e6f7g8h9i0j1',
        productId: 'clx1a2b3c4d5e6f7g8h9i0j1',
        productTitle: 'Mesa de Comedor Moderna Roble',
        productSlug: 'mesa-comedor-moderna-roble',
        price: 15.99,
        quantity: 1,
        product: mockProducts[0]
      },
      {
        id: 'oit_002',
        orderId: 'ord_clx1a2b3c4d5e6f7g8h9i0j1',
        productId: 'clx2b3c4d5e6f7g8h9i0j1k2',
        productTitle: 'Silla Escandinava Premium',
        productSlug: 'silla-escandinava-premium',
        price: 12.50,
        quantity: 1,
        product: mockProducts[1]
      }
    ],
    createdAt: '2024-12-01T14:30:00Z',
    paidAt: '2024-12-01T14:32:15Z',
    completedAt: '2024-12-01T14:35:00Z'
  },
  {
    id: 'ord_clx2b3c4d5e6f7g8h9i0j1k2',
    orderNumber: 'ORD-20241128-002',
    subtotal: 22.00,
    platformFee: 2.20,
    sellerAmount: 19.80,
    totalAmount: 24.20,
    status: OrderStatus.PAID,
    paymentIntentId: 'pi_3O4Z5L2eZvKYlo2C7654321',
    paymentStatus: 'succeeded',
    isGuestOrder: false,
    buyerId: 'buyer_001',
    billingAddress: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+56 9 8765 4321',
      country: 'Chile',
      city: 'Santiago',
      address: 'Av. Providencia 123',
      zipCode: '7500000'
    },
    items: [
      {
        id: 'oit_003',
        orderId: 'ord_clx2b3c4d5e6f7g8h9i0j1k2',
        productId: 'clx3c4d5e6f7g8h9i0j1k2l3',
        productTitle: 'Estantería Industrial Hierro y Madera',
        productSlug: 'estanteria-industrial-hierro-madera',
        price: 22.00,
        quantity: 1,
        product: mockProducts[2]
      }
    ],
    createdAt: '2024-11-28T10:15:00Z',
    paidAt: '2024-11-28T10:17:30Z'
  },
  {
    id: 'ord_clx3c4d5e6f7g8h9i0j1k2l3',
    orderNumber: 'ORD-20241125-003',
    subtotal: 35.00,
    platformFee: 3.50,
    sellerAmount: 31.50,
    totalAmount: 38.50,
    status: OrderStatus.PROCESSING,
    paymentIntentId: 'pi_3O4Z5L2eZvKYlo2C9876543',
    paymentStatus: 'processing',
    isGuestOrder: false,
    buyerId: 'buyer_001',
    billingAddress: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+56 9 8765 4321',
      country: 'Chile',
      city: 'Santiago',
      address: 'Av. Providencia 123',
      zipCode: '7500000'
    },
    items: [
      {
        id: 'oit_004',
        orderId: 'ord_clx3c4d5e6f7g8h9i0j1k2l3',
        productId: 'clx4d5e6f7g8h9i0j1k2l3m4',
        productTitle: 'Cama Matrimonial Flotante con Almacenamiento',
        productSlug: 'cama-matrimonial-flotante-almacenamiento',
        price: 35.00,
        quantity: 1,
        product: mockProducts[3]
      }
    ],
    createdAt: '2024-11-25T16:45:00Z',
    paidAt: '2024-11-25T16:47:12Z'
  },
  {
    id: 'ord_clx4d5e6f7g8h9i0j1k2l3m4',
    orderNumber: 'ORD-20241120-004',
    subtotal: 25.00,
    platformFee: 2.50,
    sellerAmount: 22.50,
    totalAmount: 27.50,
    status: OrderStatus.PENDING,
    isGuestOrder: false,
    buyerId: 'buyer_001',
    billingAddress: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+56 9 8765 4321',
      country: 'Chile',
      city: 'Santiago',
      address: 'Av. Providencia 123',
      zipCode: '7500000'
    },
    items: [
      {
        id: 'oit_005',
        orderId: 'ord_clx4d5e6f7g8h9i0j1k2l3m4',
        productId: 'clx2b3c4d5e6f7g8h9i0j1k2',
        productTitle: 'Silla Escandinava Premium',
        productSlug: 'silla-escandinava-premium',
        price: 12.50,
        quantity: 2,
        product: mockProducts[1]
      }
    ],
    createdAt: '2024-11-20T09:20:00Z'
  },
  {
    id: 'ord_clx5e6f7g8h9i0j1k2l3m4n5',
    orderNumber: 'ORD-20241115-005',
    subtotal: 28.99,
    platformFee: 2.90,
    sellerAmount: 26.09,
    totalAmount: 31.89,
    status: OrderStatus.FAILED,
    paymentIntentId: 'pi_3O4Z5L2eZvKYlo2C1122334',
    paymentStatus: 'failed',
    isGuestOrder: false,
    buyerId: 'buyer_001',
    billingAddress: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+56 9 8765 4321',
      country: 'Chile',
      city: 'Santiago',
      address: 'Av. Providencia 123',
      zipCode: '7500000'
    },
    items: [
      {
        id: 'oit_006',
        orderId: 'ord_clx5e6f7g8h9i0j1k2l3m4n5',
        productId: 'clx5e6f7g8h9i0j1k2l3m4n5',
        productTitle: 'Escritorio Ejecutivo con Cable Management',
        productSlug: 'escritorio-ejecutivo-cable-management',
        price: 28.99,
        quantity: 1,
        product: mockProducts[4]
      }
    ],
    createdAt: '2024-11-15T13:10:00Z'
  }
]

// Función para obtener órdenes por usuario
export const getOrdersByUserId = (userId: string): Order[] => {
  return mockOrders.filter(order => order.buyerId === userId)
}

// Función para obtener orden por ID
export const getOrderById = (orderId: string): Order | undefined => {
  return mockOrders.find(order => order.id === orderId)
}

// Función para obtener estadísticas de órdenes
export const getOrderStats = (userId: string) => {
  const userOrders = getOrdersByUserId(userId)
  
  const totalOrders = userOrders.length
  const totalSpent = userOrders
    .filter(order => order.status === OrderStatus.COMPLETED || order.status === OrderStatus.PAID)
    .reduce((sum, order) => sum + order.totalAmount, 0)
  
  const statusCounts = userOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<OrderStatus, number>)

  return {
    totalOrders,
    totalSpent,
    statusCounts,
    completedOrders: statusCounts[OrderStatus.COMPLETED] || 0,
    pendingOrders: statusCounts[OrderStatus.PENDING] || 0
  }
}