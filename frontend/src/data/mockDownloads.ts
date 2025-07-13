import { mockOrders } from './mockOrders'
import { OrderStatus } from '@/types'

// Tipos para el sistema de descargas
export interface DownloadToken {
  id: string
  token: string
  orderId: string
  orderNumber: string
  productId: string
  productTitle: string
  productSlug: string
  buyerId: string
  downloadLimit: number
  downloadCount: number
  expiresAt: string
  isActive: boolean
  createdAt: string
  lastDownloadAt?: string
  lastIpAddress?: string
  pdfUrl: string
  pdfFileSize: number // en MB
  sellerName: string
  storeName: string
  purchaseDate: string
  purchasePrice: number
}

export interface DownloadLog {
  id: string
  downloadTokenId: string
  downloadedAt: string
  ipAddress: string
  userAgent: string
  fileSize: number
  success: boolean
}

// Generar tokens de descarga basados en órdenes completadas/pagadas
export const mockDownloadTokens: DownloadToken[] = (() => {
  const tokens: DownloadToken[] = []
  
  // Solo generar tokens para órdenes pagadas o completadas
  const eligibleOrders = mockOrders.filter(order => 
    order.status === OrderStatus.COMPLETED || order.status === OrderStatus.PAID
  )

  eligibleOrders.forEach(order => {
    order.items.forEach((item, index) => {
      const tokenId = `dt_${order.id}_${item.id}`
      const isExpired = Math.random() > 0.8 // 20% de tokens expirados para variedad
      const downloadCount = Math.floor(Math.random() * 3) // 0-2 descargas usadas
      
      tokens.push({
        id: tokenId,
        token: `tok_${tokenId.slice(-8)}_${Date.now().toString().slice(-6)}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        productId: item.productId,
        productTitle: item.productTitle,
        productSlug: item.productSlug,
        buyerId: order.buyerId!,
        downloadLimit: 5, // Límite estándar de 5 descargas
        downloadCount: downloadCount,
        expiresAt: isExpired 
          ? '2024-11-20T23:59:59Z' // Expirado 
          : '2025-02-01T23:59:59Z', // Válido hasta febrero
        isActive: !isExpired && downloadCount < 5,
        createdAt: order.paidAt || order.createdAt,
        lastDownloadAt: downloadCount > 0 
          ? new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString() // Última semana
          : undefined,
        lastIpAddress: downloadCount > 0 ? '192.168.1.' + Math.floor(Math.random() * 254 + 1) : undefined,
        pdfUrl: item.product.pdfUrl,
        pdfFileSize: Math.round((Math.random() * 15 + 2) * 100) / 100, // 2-17 MB
        sellerName: item.product.seller.sellerProfile?.storeName || 
                   `${item.product.seller.firstName} ${item.product.seller.lastName}`,
        storeName: item.product.seller.sellerProfile?.storeName || 'Tienda Personal',
        purchaseDate: order.createdAt,
        purchasePrice: item.price * item.quantity
      })
    })
  })

  return tokens
})()

// Mock logs de descarga para historial
export const mockDownloadLogs: DownloadLog[] = (() => {
  const logs: DownloadLog[] = []
  
  mockDownloadTokens.forEach(token => {
    // Generar logs para tokens que han sido descargados
    for (let i = 0; i < token.downloadCount; i++) {
      logs.push({
        id: `log_${token.id}_${i + 1}`,
        downloadTokenId: token.id,
        downloadedAt: new Date(
          Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30 // Último mes
        ).toISOString(),
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        fileSize: token.pdfFileSize,
        success: Math.random() > 0.05 // 95% de descargas exitosas
      })
    }
  })

  return logs.sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())
})()

// Funciones auxiliares
export const getDownloadTokensByUserId = (userId: string): DownloadToken[] => {
  return mockDownloadTokens.filter(token => token.buyerId === userId)
}

export const getActiveDownloadTokensByUserId = (userId: string): DownloadToken[] => {
  return mockDownloadTokens.filter(token => 
    token.buyerId === userId && 
    token.isActive && 
    new Date(token.expiresAt) > new Date()
  )
}

export const getDownloadTokenById = (tokenId: string): DownloadToken | undefined => {
  return mockDownloadTokens.find(token => token.id === tokenId)
}

export const getDownloadLogsByTokenId = (tokenId: string): DownloadLog[] => {
  return mockDownloadLogs.filter(log => log.downloadTokenId === tokenId)
}

export const getDownloadStats = (userId: string) => {
  const userTokens = getDownloadTokensByUserId(userId)
  const userLogs = mockDownloadLogs.filter(log => {
    const token = mockDownloadTokens.find(t => t.id === log.downloadTokenId)
    return token?.buyerId === userId
  })

  const totalProducts = userTokens.length
  const activeTokens = userTokens.filter(token => 
    token.isActive && new Date(token.expiresAt) > new Date()
  ).length
  const expiredTokens = userTokens.filter(token => 
    !token.isActive || new Date(token.expiresAt) <= new Date()
  ).length
  const totalDownloads = userLogs.filter(log => log.success).length
  const downloadsThisMonth = userLogs.filter(log => 
    log.success && 
    new Date(log.downloadedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length

  return {
    totalProducts,
    activeTokens,
    expiredTokens,
    totalDownloads,
    downloadsThisMonth,
    totalFileSize: userTokens.reduce((sum, token) => sum + token.pdfFileSize, 0)
  }
}

// Simular descarga de archivo
export const simulateDownload = async (tokenId: string): Promise<{success: boolean, message: string, downloadUrl?: string}> => {
  const token = getDownloadTokenById(tokenId)
  
  if (!token) {
    return { success: false, message: 'Token de descarga no encontrado' }
  }

  if (!token.isActive) {
    return { success: false, message: 'Token de descarga no activo' }
  }

  if (new Date(token.expiresAt) <= new Date()) {
    return { success: false, message: 'Token de descarga expirado' }
  }

  if (token.downloadCount >= token.downloadLimit) {
    return { success: false, message: 'Límite de descargas alcanzado' }
  }

  // Simular tiempo de generación de URL segura
  await new Promise(resolve => setTimeout(resolve, 1000))

  // En una implementación real, aquí se generaría una URL firmada temporalmente
  const downloadUrl = `${token.pdfUrl}?token=${token.token}&t=${Date.now()}`

  // Actualizar contador (en una app real esto sería en el backend)
  token.downloadCount += 1
  token.lastDownloadAt = new Date().toISOString()
  
  if (token.downloadCount >= token.downloadLimit) {
    token.isActive = false
  }

  // Agregar log de descarga
  const newLog: DownloadLog = {
    id: `log_${tokenId}_${Date.now()}`,
    downloadTokenId: tokenId,
    downloadedAt: new Date().toISOString(),
    ipAddress: '192.168.1.100', // IP del cliente
    userAgent: navigator.userAgent,
    fileSize: token.pdfFileSize,
    success: true
  }
  mockDownloadLogs.unshift(newLog)

  return { 
    success: true, 
    message: 'Descarga iniciada correctamente',
    downloadUrl 
  }
}