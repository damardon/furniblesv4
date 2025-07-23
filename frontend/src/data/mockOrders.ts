import { Order, OrderStatus, OrderItem } from '@/types'
import { mockProducts } from './mockProducts'

export const mockOrders: Order[] = [
  {
    id: 'ord_clx1a2b3c4d5e6f7g8h9i0j1',
    orderNumber: 'ORD-20241201-001',
    buyerId: 'buyer_001',
    subtotal: 28.49,
    subtotalAmount: 28.49,
    platformFeeRate: 0.10,
    platformFee: 2.85,
    totalAmount: 31.34,
    sellerAmount: 25.64,
    transferGroup: 'po_1234567890',
    applicationFee: 2.85,
    status: OrderStatus.COMPLETED,
    paymentIntentId: 'pi_3O4Z5L2eZvKYlo2C1234567',
    paymentStatus: 'succeeded',
    buyerEmail: 'juan@example.com',
    billingData: {                         // ← Primer campo obligatorio
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+56 9 8765 4321',
      country: 'Chile',
      city: 'Santiago',
      address: 'Av. Providencia 123',
      zipCode: '7500000'
    },
    billingAddress: {                      // ← Segundo campo obligatorio
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
        sellerId: 'seller_001',
        sellerName: 'Carpintería Artesanal',
        storeName: 'Muebles Premium',
        createdAt: '2024-12-01T14:30:00Z',
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
        sellerId: 'seller_002',
        sellerName: 'Nordic Design',
        storeName: 'Estilo Nórdico',
        createdAt: '2024-12-01T14:30:00Z',
        product: mockProducts[1]
      }
    ],
    createdAt: '2024-12-01T14:30:00Z',
    paidAt: '2024-12-01T14:32:15Z',
    completedAt: '2024-12-01T14:35:00Z',
    updatedAt: '2024-12-01T14:35:00Z'
  },
  {
    id: 'ord_clx2b3c4d5e6f7g8h9i0j1k2',
    orderNumber: 'ORD-20241128-002',
    buyerId: 'buyer_001',
    subtotal: 22.00,
    subtotalAmount: 22.00,
    platformFeeRate: 0.10,
    platformFee: 2.20,
    totalAmount: 24.20,
    sellerAmount: 19.80,
    transferGroup: 'po_1234567891',
    applicationFee: 2.20,
    status: OrderStatus.PAID,
    paymentIntentId: 'pi_3O4Z5L2eZvKYlo2C7654321',
    paymentStatus: 'succeeded',
    buyerEmail: 'juan@example.com',
    billingData: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+56 9 8765 4321',
      country: 'Chile',
      city: 'Santiago',
      address: 'Av. Providencia 123',
      zipCode: '7500000'
    },
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
        sellerId: 'seller_003',
        sellerName: 'Industrial Designs',
        storeName: 'Mobiliario Industrial',
        createdAt: '2024-11-28T10:15:00Z',
        product: mockProducts[2]
      }
    ],
    createdAt: '2024-11-28T10:15:00Z',
    paidAt: '2024-11-28T10:17:30Z',
    updatedAt: '2024-11-28T10:17:30Z'
  },
  {
    id: 'ord_clx3c4d5e6f7g8h9i0j1k2l3',
    orderNumber: 'ORD-20241125-003',
    buyerId: 'buyer_001',
    subtotal: 35.00,
    subtotalAmount: 35.00,
    platformFeeRate: 0.10,
    platformFee: 3.50,
    totalAmount: 38.50,
    sellerAmount: 31.50,
    transferGroup: 'po_1234567892',
    applicationFee: 3.50,
    status: OrderStatus.PROCESSING,
    paymentIntentId: 'pi_3O4Z5L2eZvKYlo2C9876543',
    paymentStatus: 'processing',
    buyerEmail: 'juan@example.com',
    billingData: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+56 9 8765 4321',
      country: 'Chile',
      city: 'Santiago',
      address: 'Av. Providencia 123',
      zipCode: '7500000'
    },
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
        sellerId: 'seller_004',
        sellerName: 'Dormitorios Modernos',
        storeName: 'Diseño Contemporáneo',
        createdAt: '2024-11-25T16:45:00Z',
        product: mockProducts[3]
      }
    ],
    createdAt: '2024-11-25T16:45:00Z',
    paidAt: '2024-11-25T16:47:12Z',
    updatedAt: '2024-11-25T16:47:12Z'
  },
  {
    id: 'ord_clx4d5e6f7g8h9i0j1k2l3m4',
    orderNumber: 'ORD-20241120-004',
    buyerId: 'buyer_001',
    subtotal: 25.00,
    subtotalAmount: 25.00,
    platformFeeRate: 0.10,
    platformFee: 2.50,
    totalAmount: 27.50,
    sellerAmount: 22.50,
    status: OrderStatus.PENDING,
    buyerEmail: 'juan@example.com',
    billingData: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+56 9 8765 4321',
      country: 'Chile',
      city: 'Santiago',
      address: 'Av. Providencia 123',
      zipCode: '7500000'
    },
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
        sellerId: 'seller_002',
        sellerName: 'Nordic Design',
        storeName: 'Estilo Nórdico',
        createdAt: '2024-11-20T09:20:00Z',
        product: mockProducts[1]
      }
    ],
    createdAt: '2024-11-20T09:20:00Z',
    updatedAt: '2024-11-20T09:20:00Z'
  },
  {
    id: 'ord_clx5e6f7g8h9i0j1k2l3m4n5',
    orderNumber: 'ORD-20241115-005',
    buyerId: 'buyer_001',
    subtotal: 28.99,
    subtotalAmount: 28.99,
    platformFeeRate: 0.10,
    platformFee: 2.90,
    totalAmount: 31.89,
    sellerAmount: 26.09,
    status: OrderStatus.CANCELLED,
    paymentIntentId: 'pi_3O4Z5L2eZvKYlo2C1122334',
    paymentStatus: 'failed',
    buyerEmail: 'juan@example.com',
    billingData: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+56 9 8765 4321',
      country: 'Chile',
      city: 'Santiago',
      address: 'Av. Providencia 123',
      zipCode: '7500000'
    },
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
        sellerId: 'seller_005',
        sellerName: 'Oficina Moderna',
        storeName: 'Espacios de Trabajo',
        createdAt: '2024-11-15T13:10:00Z',
        product: mockProducts[4]
      }
    ],
    createdAt: '2024-11-15T13:10:00Z',
    updatedAt: '2024-11-15T13:10:00Z'
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