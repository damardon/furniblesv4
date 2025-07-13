import { mockOrders } from './mockOrders'
import { OrderStatus } from '@/types'

// Tipos para el sistema de reviews
export enum ReviewStatus {
  PENDING_MODERATION = 'PENDING_MODERATION',
  PUBLISHED = 'PUBLISHED',
  FLAGGED = 'FLAGGED',
  REMOVED = 'REMOVED'
}

export interface Review {
  id: string
  orderId: string
  orderNumber: string
  productId: string
  productTitle: string
  productSlug: string
  buyerId: string
  sellerId: string
  rating: number // 1-5 stars
  title?: string
  comment: string
  pros?: string
  cons?: string
  status: ReviewStatus
  isVerified: boolean // Always true for purchases
  helpfulCount: number
  notHelpfulCount: number
  moderatedBy?: string
  moderatedAt?: string
  moderationReason?: string
  createdAt: string
  updatedAt: string
  // Images of the built result (optional)
  imageUrls?: string[]
  // Seller response (if any)
  sellerResponse?: ReviewResponse
  // Product info for easy access
  product: {
    title: string
    slug: string
    category: string
    difficulty: string
    sellerName: string
    storeName: string
    price: number
  }
}

export interface ReviewResponse {
  id: string
  reviewId: string
  sellerId: string
  sellerName: string
  storeName: string
  comment: string
  createdAt: string
  updatedAt: string
}

// Mock reviews basadas en órdenes completadas
export const mockReviews: Review[] = (() => {
  const reviews: Review[] = []
  
  // Solo crear reviews para órdenes completadas
  const completedOrders = mockOrders.filter(order => 
    order.status === OrderStatus.COMPLETED || order.status === OrderStatus.PAID
  )

  // Review 1 - Mesa de Comedor (muy positiva con respuesta del seller)
  const order1 = completedOrders[0]
  if (order1 && order1.items[0]) {
    const item = order1.items[0]
    reviews.push({
      id: 'rev_001',
      orderId: order1.id,
      orderNumber: order1.orderNumber,
      productId: item.productId,
      productTitle: item.productTitle,
      productSlug: item.productSlug,
      buyerId: order1.buyerId!,
      sellerId: item.product.seller.id,
      rating: 5,
      title: 'Excelente plano, muy detallado',
      comment: 'Increíble nivel de detalle en los planos. Las instrucciones son claras y los diagramas muy precisos. Logré construir la mesa sin problemas y quedó exactamente como esperaba. Definitivamente recomiendo este vendedor.',
      pros: 'Instrucciones claras, diagramas precisos, lista de materiales completa',
      cons: 'Ninguno, todo perfecto',
      status: ReviewStatus.PUBLISHED,
      isVerified: true,
      helpfulCount: 8,
      notHelpfulCount: 0,
      createdAt: '2024-12-05T16:30:00Z',
      updatedAt: '2024-12-05T16:30:00Z',
      imageUrls: [
        'https://picsum.photos/400/300?random=101',
        'https://picsum.photos/400/300?random=102'
      ],
      sellerResponse: {
        id: 'resp_001',
        reviewId: 'rev_001',
        sellerId: item.product.seller.id,
        sellerName: item.product.seller.sellerProfile?.storeName || 'Maderas Mendoza',
        storeName: 'Maderas Mendoza',
        comment: '¡Muchas gracias por tu review! Me alegra mucho saber que lograste construir la mesa sin problemas. Las fotos quedaron espectaculares. Si necesitas ayuda con futuros proyectos, no dudes en contactarme.',
        createdAt: '2024-12-06T09:15:00Z',
        updatedAt: '2024-12-06T09:15:00Z'
      },
      product: {
        title: item.productTitle,
        slug: item.productSlug,
        category: item.product.category,
        difficulty: item.product.difficulty,
        sellerName: `${item.product.seller.firstName} ${item.product.seller.lastName}`,
        storeName: item.product.seller.sellerProfile?.storeName || 'Tienda Personal',
        price: item.price
      }
    })
  }

  // Review 2 - Silla Escandinava (positiva, sin respuesta aún)
  if (order1 && order1.items[1]) {
    const item = order1.items[1]
    reviews.push({
      id: 'rev_002',
      orderId: order1.id,
      orderNumber: order1.orderNumber,
      productId: item.productId,
      productTitle: item.productTitle,
      productSlug: item.productSlug,
      buyerId: order1.buyerId!,
      sellerId: item.product.seller.id,
      rating: 4,
      title: 'Buen diseño, algunas mejoras necesarias',
      comment: 'El diseño es muy elegante y las medidas están bien especificadas. Sin embargo, algunos pasos de ensamblaje podrían estar más detallados. Tuve que improvisar en un par de partes, pero el resultado final es muy bueno.',
      pros: 'Diseño elegante, medidas precisas, ergonomía excelente',
      cons: 'Algunos pasos de ensamblaje poco claros',
      status: ReviewStatus.PUBLISHED,
      isVerified: true,
      helpfulCount: 3,
      notHelpfulCount: 1,
      createdAt: '2024-12-04T11:20:00Z',
      updatedAt: '2024-12-04T11:20:00Z',
      imageUrls: [
        'https://picsum.photos/400/300?random=103'
      ],
      product: {
        title: item.productTitle,
        slug: item.productSlug,
        category: item.product.category,
        difficulty: item.product.difficulty,
        sellerName: `${item.product.seller.firstName} ${item.product.seller.lastName}`,
        storeName: item.product.seller.sellerProfile?.storeName || 'Tienda Personal',
        price: item.price
      }
    })
  }

  // Review 3 - Estantería Industrial (neutral, con respuesta del seller)
  const order2 = completedOrders[1]
  if (order2 && order2.items[0]) {
    const item = order2.items[0]
    reviews.push({
      id: 'rev_003',
      orderId: order2.id,
      orderNumber: order2.orderNumber,
      productId: item.productId,
      productTitle: item.productTitle,
      productSlug: item.productSlug,
      buyerId: order2.buyerId!,
      sellerId: item.product.seller.id,
      rating: 3,
      title: 'Proyecto ambicioso, requiere experiencia',
      comment: 'El plano está bien diseñado pero definitivamente no es para principiantes. Requiere soldadura y herramientas especializadas que no estaban claramente especificadas en la descripción. El resultado es bueno pero fue más complejo de lo esperado.',
      pros: 'Diseño robusto, resultado final sólido',
      cons: 'Requiere más herramientas de las especificadas, no apto para principiantes',
      status: ReviewStatus.PUBLISHED,
      isVerified: true,
      helpfulCount: 5,
      notHelpfulCount: 2,
      createdAt: '2024-11-30T14:45:00Z',
      updatedAt: '2024-11-30T14:45:00Z',
      sellerResponse: {
        id: 'resp_002',
        reviewId: 'rev_003',
        sellerId: item.product.seller.id,
        sellerName: item.product.seller.sellerProfile?.storeName || 'Industrial Craft',
        storeName: 'Industrial Craft',
        comment: 'Gracias por tu feedback. Tienes razón, voy a actualizar la descripción para ser más claro sobre las herramientas requeridas. He agregado un video tutorial que puede ayudar con los pasos más complejos.',
        createdAt: '2024-12-01T10:30:00Z',
        updatedAt: '2024-12-01T10:30:00Z'
      },
      product: {
        title: item.productTitle,
        slug: item.productSlug,
        category: item.product.category,
        difficulty: item.product.difficulty,
        sellerName: `${item.product.seller.firstName} ${item.product.seller.lastName}`,
        storeName: item.product.seller.sellerProfile?.storeName || 'Tienda Personal',
        price: item.price
      }
    })
  }

  return reviews
})()

// Reviews pendientes de escribir (productos comprados sin review)
export const getPendingReviews = (userId: string) => {
  const userOrders = mockOrders.filter(order => 
    order.buyerId === userId && 
    (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.PAID)
  )

  const reviewedProductIds = mockReviews
    .filter(review => review.buyerId === userId)
    .map(review => review.productId)

  const pendingItems = []
  
  for (const order of userOrders) {
    for (const item of order.items) {
      if (!reviewedProductIds.includes(item.productId)) {
        pendingItems.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          productId: item.productId,
          productTitle: item.productTitle,
          productSlug: item.productSlug,
          purchaseDate: order.createdAt,
          product: item.product
        })
      }
    }
  }

  return pendingItems
}

// Funciones auxiliares
export const getReviewsByUserId = (userId: string): Review[] => {
  return mockReviews.filter(review => review.buyerId === userId)
}

export const getReviewById = (reviewId: string): Review | undefined => {
  return mockReviews.find(review => review.id === reviewId)
}

export const getReviewByOrderAndProduct = (orderId: string, productId: string): Review | undefined => {
  return mockReviews.find(review => 
    review.orderId === orderId && review.productId === productId
  )
}

export const getReviewStats = (userId: string) => {
  const userReviews = getReviewsByUserId(userId)
  const pendingReviews = getPendingReviews(userId)
  
  const totalReviews = userReviews.length
  const averageRating = userReviews.length > 0 
    ? userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length 
    : 0
  const helpfulVotes = userReviews.reduce((sum, review) => sum + review.helpfulCount, 0)
  const withImages = userReviews.filter(review => review.imageUrls && review.imageUrls.length > 0).length
  const withSellerResponse = userReviews.filter(review => review.sellerResponse).length
  const pendingCount = pendingReviews.length

  return {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    helpfulVotes,
    withImages,
    withSellerResponse,
    pendingCount,
    ratingDistribution: {
      5: userReviews.filter(r => r.rating === 5).length,
      4: userReviews.filter(r => r.rating === 4).length,
      3: userReviews.filter(r => r.rating === 3).length,
      2: userReviews.filter(r => r.rating === 2).length,
      1: userReviews.filter(r => r.rating === 1).length,
    }
  }
}

// Simular envío de review
export const submitReview = async (reviewData: {
  orderId: string
  productId: string
  rating: number
  title?: string
  comment: string
  pros?: string
  cons?: string
  imageFiles?: File[]
}): Promise<{success: boolean, reviewId?: string, message: string}> => {
  
  // Simular validaciones
  if (reviewData.rating < 1 || reviewData.rating > 5) {
    return { success: false, message: 'Rating debe estar entre 1 y 5 estrellas' }
  }

  if (reviewData.comment.trim().length < 10) {
    return { success: false, message: 'El comentario debe tener al menos 10 caracteres' }
  }

  // Simular verificación de compra
  const order = mockOrders.find(o => o.id === reviewData.orderId)
  if (!order || (order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.PAID)) {
    return { success: false, message: 'Solo puedes escribir reviews de productos que has comprado' }
  }

  // Verificar que no existe ya una review
  const existingReview = getReviewByOrderAndProduct(reviewData.orderId, reviewData.productId)
  if (existingReview) {
    return { success: false, message: 'Ya has escrito una review para este producto' }
  }

  // Simular tiempo de procesamiento
  await new Promise(resolve => setTimeout(resolve, 2000))

  // En una implementación real, aquí se subirían las imágenes y se guardaría en base de datos
  const newReviewId = `rev_${Date.now()}`
  
  return { 
    success: true, 
    reviewId: newReviewId,
    message: 'Review enviada exitosamente. Será visible una vez aprobada.' 
  }
}