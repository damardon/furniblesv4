// frontend/src/lib/api.ts - Configuración central de APIs

import { ApiResponse } from '@/types/additional'

// ✅ Configuración base
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
} as const

// ✅ Helper para obtener token de autenticación
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  
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

// ✅ Headers por defecto
export const getDefaultHeaders = (includeAuth = true): Record<string, string> => {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }

  if (includeAuth) {
    const token = getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  return headers
}

// ✅ Clase de error personalizada
export class APIError extends Error {
  public status: number
  public code?: string
  public details?: any

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: any
  ) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// ✅ Cliente HTTP principal
export class APIClient {
  private baseURL: string
  private timeout: number
  private retries: number
  private retryDelay: number

  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout
    this.retries = config.retries
    this.retryDelay = config.retryDelay
  }

  // Método base para hacer requests
  private async request<T = any>(
    endpoint: string,
    options: RequestInit & {
      includeAuth?: boolean
      retries?: number
      timeout?: number
    } = {}
  ): Promise<T> {
    const {
      includeAuth = true,
      retries = this.retries,
      timeout = this.timeout,
      ...fetchOptions
    } = options

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    
    const headers = {
      ...getDefaultHeaders(includeAuth),
      ...fetchOptions.headers,
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 [API] ${fetchOptions.method || 'GET'} ${url} (attempt ${attempt + 1}/${retries + 1})`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log(`📡 [API] Response: ${response.status} ${response.statusText}`)

        // Si la response no es ok, intentar leer el error
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          let errorDetails: any = null

          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
            errorDetails = errorData
          } catch {
            // Si no se puede parsear JSON, usar el status text
          }

          throw new APIError(errorMessage, response.status, response.statusText, errorDetails)
        }

        // Intentar parsear la respuesta
        const data = await response.json()
        console.log(`✅ [API] Success:`, data)
        
        return data
      } catch (error) {
        lastError = error as Error
        console.error(`❌ [API] Attempt ${attempt + 1} failed:`, (error as Error).message)

        // Si es el último intento o es un error que no debe reintentar
        if (
          attempt === retries ||
          (error instanceof APIError && error.status < 500) ||
          (error as Error).name === 'AbortError'
        ) {
          throw error
        }

        // Esperar antes del siguiente intento
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)))
        }
      }
    }

    throw lastError || new Error('Request failed after all retries')
  }

  // ✅ Métodos HTTP
  async get<T = any>(endpoint: string, options?: Omit<RequestInit, 'method'> & { includeAuth?: boolean }): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'> & { includeAuth?: boolean }): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'> & { includeAuth?: boolean }): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'> & { includeAuth?: boolean }): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, options?: Omit<RequestInit, 'method'> & { includeAuth?: boolean }): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // ✅ Método especial para upload de archivos
  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    options?: Omit<RequestInit, 'method' | 'body'> & {
      includeAuth?: boolean
      onProgress?: (progress: number) => void
    }
  ): Promise<T> {
    const { includeAuth = true, onProgress, ...fetchOptions } = options || {}
    
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      // No incluir Content-Type para FormData, el browser lo hace automáticamente
    }

    if (includeAuth) {
      const token = getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    console.log(`🔍 [API] UPLOAD ${url}`)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        method: 'POST',
        headers: {
          ...headers,
          ...fetchOptions.headers,
        },
        body: formData,
      })

      console.log(`📡 [API] Upload Response: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorDetails: any = null

        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          errorDetails = errorData
        } catch {
          // Si no se puede parsear JSON, usar el status text
        }

        throw new APIError(errorMessage, response.status, response.statusText, errorDetails)
      }

      const data = await response.json()
      console.log(`✅ [API] Upload Success:`, data)
      
      return data
    } catch (error) {
      console.error(`❌ [API] Upload failed:`, error)
      throw error
    }
  }
}

// ✅ Instancia global del cliente
export const apiClient = new APIClient()

// ✅ Helpers para responses consistentes
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
})

export const createErrorResponse = (error: string): ApiResponse => ({
  success: false,
  error,
})

// ✅ Helper para manejar errores de API
export const handleAPIError = (error: unknown): ApiResponse => {
  if (error instanceof APIError) {
    return createErrorResponse(error.message)
  }
  
  if (error instanceof Error) {
    return createErrorResponse(error.message)
  }
  
  return createErrorResponse('Error desconocido')
}

// ✅ Helper para construir query params
export const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()))
      } else {
        searchParams.append(key, value.toString())
      }
    }
  })
  
  return searchParams.toString()
}

// ✅ Types para endpoints comunes
export interface PaginatedParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ✅ Interceptor para manejar tokens expirados
export const setupAuthInterceptor = () => {
  // Esta función puede ser llamada en el layout principal
  // para configurar manejo automático de tokens expirados
  
  const originalFetch = window.fetch
  
  window.fetch = async (...args) => {
    const response = await originalFetch(...args)
    
    // Si recibimos 401, limpiar auth y redirigir
    if (response.status === 401) {
      const authStore = (window as any).authStore
      if (authStore) {
        authStore.getState().logout()
      }
      
      // Redirigir a login si no estamos ya ahí
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/productos?login=required'
      }
    }
    
    return response
  }
}
