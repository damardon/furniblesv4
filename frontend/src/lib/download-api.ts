// frontend/src/lib/downloads-api.ts

import { ApiResponse } from '@/types/additional'

interface DownloadToken {
  id: string
  token: string
  orderId: string
  productId: string
  buyerId: string
  downloadLimit: number
  downloadCount: number
  expiresAt: string
  isActive: boolean
  createdAt: string
  lastDownloadAt?: string
  lastIpAddress?: string
  lastUserAgent?: string
  product: {
    id: string
    title: string
    slug: string
    pdfFileId: string
    thumbnailFileIds: string
  }
  order: {
    id: string
    orderNumber: string
    createdAt: string
  }
}

interface Download {
  id: string
  downloadToken: string
  orderId: string
  productId: string
  buyerId: string
  expiresAt: string
  downloadCount: number
  maxDownloads: number
  isActive: boolean
  createdAt: string
  lastDownloadAt?: string
  ipAddress?: string
  userAgent?: string
  product: {
    id: string
    title: string
    slug: string
    pdfFileId: string
    thumbnailFileIds: string
    seller: {
      storeName: string
      slug: string
    }
  }
  order: {
    id: string
    orderNumber: string
    createdAt: string
    paidAt?: string
  }
}

interface DownloadsResponse {
  data: Download[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface DownloadFilters {
  productId?: string
  orderId?: string
  search?: string
  status?: 'active' | 'expired' | 'exhausted'
  sortBy?: 'createdAt' | 'lastDownloadAt' | 'expiresAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface DownloadStats {
  totalDownloads: number
  activeDownloads: number
  expiredDownloads: number
  totalProducts: number
  recentDownloads: Download[]
  topProducts: Array<{
    productId: string
    productTitle: string
    downloadCount: number
  }>
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

// ✅ Obtener descargas del usuario
export async function getUserDownloads(filters: DownloadFilters = {}): Promise<DownloadsResponse> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    console.log('🔍 [DOWNLOADS-API] Fetching user downloads with filters:', filters)
    
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/downloads?${queryParams}`, {
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
    console.log('✅ [DOWNLOADS-API] Downloads loaded:', data.data?.length || 0)
    
    return data
  } catch (error) {
    console.error('❌ [DOWNLOADS-API] Error fetching downloads:', error)
    throw error
  }
}

// ✅ Obtener download específico por token
export async function getDownloadByToken(token: string): Promise<Download | null> {
  try {
    const authToken = getAuthToken()
    if (!authToken) {
      throw new Error('No autorizado')
    }

    console.log('🔍 [DOWNLOADS-API] Fetching download by token:', token)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/downloads/${token}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
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
    console.log('✅ [DOWNLOADS-API] Download data received:', data)
    
    return data
  } catch (error) {
    console.error('❌ [DOWNLOADS-API] Error fetching download:', error)
    return null
  }
}

// ✅ Descargar archivo PDF
export async function downloadFile(downloadToken: string): Promise<ApiResponse<{ downloadUrl: string }>> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    console.log('🔍 [DOWNLOADS-API] Initiating file download:', downloadToken)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/downloads/${downloadToken}/download`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ [DOWNLOADS-API] Download failed:', result)
      return { success: false, error: result.message || 'Error downloading file' }
    }

    console.log('✅ [DOWNLOADS-API] Download initiated:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ [DOWNLOADS-API] Error downloading file:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// ✅ Obtener estadísticas de descargas
export async function getDownloadStats(): Promise<DownloadStats> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    console.log('🔍 [DOWNLOADS-API] Fetching download stats')
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/downloads/stats`, {
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
    console.log('✅ [DOWNLOADS-API] Download stats loaded:', data)
    
    return data
  } catch (error) {
    console.error('❌ [DOWNLOADS-API] Error fetching download stats:', error)
    throw error
  }
}

// ✅ Verificar si un download está disponible
export async function isDownloadAvailable(downloadToken: string): Promise<{
  available: boolean
  reason?: string
  remainingDownloads?: number
  expiresAt?: string
}> {
  try {
    const token = getAuthToken()
    if (!token) {
      return { available: false, reason: 'No autorizado' }
    }

    console.log('🔍 [DOWNLOADS-API] Checking download availability:', downloadToken)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/downloads/${downloadToken}/check`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const result = await response.json()
      return { available: false, reason: result.message || 'Download not available' }
    }

    const data = await response.json()
    console.log('✅ [DOWNLOADS-API] Download availability checked:', data)
    
    return data
  } catch (error) {
    console.error('❌ [DOWNLOADS-API] Error checking download availability:', error)
    return { available: false, reason: 'Error de conexión' }
  }
}

// ✅ Obtener downloads por pedido
export async function getDownloadsByOrder(orderNumber: string): Promise<Download[]> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    console.log('🔍 [DOWNLOADS-API] Fetching downloads for order:', orderNumber)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/downloads/order/${orderNumber}`, {
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
    console.log('✅ [DOWNLOADS-API] Order downloads loaded:', data.length || 0)
    
    return data
  } catch (error) {
    console.error('❌ [DOWNLOADS-API] Error fetching order downloads:', error)
    return []
  }
}

// ✅ Regenerar token de descarga (si está permitido)
export async function regenerateDownloadToken(downloadId: string): Promise<ApiResponse<{ newToken: string }>> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No autorizado')
    }

    console.log('🔍 [DOWNLOADS-API] Regenerating download token:', downloadId)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/downloads/${downloadId}/regenerate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ [DOWNLOADS-API] Token regeneration failed:', result)
      return { success: false, error: result.message || 'Error regenerating token' }
    }

    console.log('✅ [DOWNLOADS-API] Token regenerated:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ [DOWNLOADS-API] Error regenerating token:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// ✅ Utilidad para formatear tiempo restante
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()
  
  if (diff <= 0) {
    return 'Expirado'
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) {
    return `${days} día${days > 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`
  } else {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`
  }
}

// ✅ Utilidad para obtener el estado de un download
export function getDownloadStatus(download: Download): 'active' | 'expired' | 'exhausted' {
  const now = new Date()
  const expiry = new Date(download.expiresAt)
  
  if (!download.isActive) {
    return 'exhausted'
  }
  
  if (expiry <= now) {
    return 'expired'
  }
  
  if (download.downloadCount >= download.maxDownloads) {
    return 'exhausted'
  }
  
  return 'active'
}

// ✅ Exportar tipos para uso en componentes
export type { 
  Download, 
  DownloadToken, 
  DownloadsResponse, 
  DownloadFilters, 
  DownloadStats 
}