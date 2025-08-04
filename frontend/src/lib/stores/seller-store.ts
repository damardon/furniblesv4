import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { registerStore } from './store-manager'

// Importar TODOS los tipos necesarios desde index.ts
import { 
  Product, 
  Order, 
  User, 
  SellerProfile, 
  ProductCategory, 
  Difficulty, 
  ProductStatus,
  OrderStatus
} from '@/types'

// Importar tipos adicionales
import { 
  ApiResponse, 
  PaginatedResponse, 
  Review, 
  ReviewStatus, 
  NotificationType 
} from '@/types/additional'

// SELLER STATE INTERFACE
interface SellerState {
  // Perfil del vendedor
  sellerProfile: SellerProfile | null
  isProfileLoading: boolean
  
  // Dashboard stats
  dashboardStats: SellerDashboardStats | null
  statsLoading: boolean
  
  // Productos del vendedor
  products: Product[]
  productsLoading: boolean
  productsPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  
  // Ventas del vendedor
  sales: SellerSale[]
  salesLoading: boolean
  salesPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  
  // Reviews del vendedor
  reviews: SellerReview[]
  reviewsLoading: boolean
  reviewsPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  
  // Filtros activos
  productFilters: ProductFilters
  salesFilters: SalesFilters
  reviewsFilters: ReviewsFilters
  
  // Estado de UI
  selectedProducts: string[]
  bulkActionLoading: boolean
}

// SELLER ACTIONS INTERFACE
interface SellerActions {
  // Perfil del vendedor
  loadSellerProfile: () => Promise<void>
  updateSellerProfile: (updates: Partial<SellerProfile>) => Promise<ApiResponse>
  clearSellerProfile: () => void
  
  // Dashboard stats
  loadDashboardStats: (period?: 'week' | 'month' | 'quarter' | 'year') => Promise<void>
  refreshDashboardStats: () => Promise<void>
  
  // Gestión de productos
  loadProducts: (page?: number, filters?: Partial<ProductFilters>) => Promise<void>
  createProduct: (productData: ProductFormData) => Promise<ApiResponse<Product>>
  updateProduct: (id: string, updates: Partial<ProductFormData>) => Promise<ApiResponse<Product>>
  deleteProduct: (id: string) => Promise<ApiResponse>
  duplicateProduct: (id: string) => Promise<ApiResponse<Product>>
  publishProduct: (id: string) => Promise<ApiResponse>
  
  // Gestión de ventas
  loadSales: (page?: number, filters?: Partial<SalesFilters>) => Promise<void>
  loadSaleDetails: (orderItemId: string) => Promise<SellerSale | null>
  
  // Gestión de reviews
  loadReviews: (page?: number, filters?: Partial<ReviewsFilters>) => Promise<void>
  respondToReview: (reviewId: string, response: string) => Promise<ApiResponse>
  
  // Filtros
  setProductFilters: (filters: Partial<ProductFilters>) => void
  setSalesFilters: (filters: Partial<SalesFilters>) => void
  setReviewsFilters: (filters: Partial<ReviewsFilters>) => void
  clearAllFilters: () => void
  
  // Selección y acciones en lote
  selectProduct: (productId: string) => void
  selectAllProducts: () => void
  clearProductSelection: () => void
  bulkUpdateProducts: (action: 'publish' | 'unpublish' | 'delete', productIds: string[]) => Promise<ApiResponse>
  
  // Analytics
  loadAnalytics: (period: string, metrics: string[]) => Promise<SellerAnalytics | null>
  exportData: (type: 'products' | 'sales' | 'reviews', format: 'csv' | 'xlsx' | 'pdf') => Promise<string>
  
  // Utilidades
  getProductById: (id: string) => Product | null
  getProductsCount: () => number
  getTotalRevenue: () => number
  getAverageRating: () => number
}

// TIPOS ADICIONALES CORREGIDOS
interface SellerDashboardStats {
  totalProducts: number
  publishedProducts: number
  draftProducts: number
  pendingProducts: number
  rejectedProducts: number
  
  totalSales: number
  totalRevenue: number
  platformFees: number
  netRevenue: number
  
  totalReviews: number
  averageRating: number
  ratingDistribution: {
    oneStar: number
    twoStar: number
    threeStar: number
    fourStar: number
    fiveStar: number
  }
  
  recentSales: SellerSale[]
  topProducts: Product[]
  pendingReviews: number
  
  periodStats: {
    period: string
    revenue: number
    sales: number
    newReviews: number
  }
}

interface SellerSale {
  id: string
  orderNumber: string
  productId: string
  productTitle: string
  productSlug: string
  price: number
  quantity: number
  buyerName: string
  buyerEmail: string
  saleAmount: number
  platformFee: number
  netAmount: number
  status: OrderStatus
  createdAt: string
  paidAt?: string
}

// Usar el tipo Review del additional.ts y extenderlo
interface SellerReview extends Review {
  productTitle: string
  buyerName: string
}

// FILTROS con tipos correctos
interface ProductFilters {
  status: ProductStatus | ''
  category: ProductCategory | ''
  difficulty: Difficulty | ''
  search: string
  sortBy: 'createdAt' | 'title' | 'price' | 'rating' | 'sales'
  sortOrder: 'asc' | 'desc'
}

interface SalesFilters {
  status: OrderStatus | ''
  dateFrom: string
  dateTo: string
  minAmount: number
  maxAmount: number
  search: string
  sortBy: 'createdAt' | 'amount' | 'buyerName'
  sortOrder: 'asc' | 'desc'
}

interface ReviewsFilters {
  rating: number
  status: ReviewStatus | ''
  hasResponse: boolean
  productId: string
  search: string
  sortBy: 'createdAt' | 'rating' | 'helpfulCount'
  sortOrder: 'asc' | 'desc'
}

interface ProductFormData {
  title: string
  description: string
  price: number
  category: ProductCategory
  difficulty: Difficulty
  tags: string[]
  estimatedTime?: string
  toolsRequired: string[]
  materials: string[]
  dimensions?: string
  pdfFile?: File
  images?: File[]
}

interface SellerAnalytics {
  revenue: {
    labels: string[]
    data: number[]
  }
  sales: {
    labels: string[]
    data: number[]
  }
  topProducts: Array<{
    id: string
    title: string
    sales: number
    revenue: number
  }>
  conversionRate: number
  repeatBuyerRate: number
}



// INITIAL STATE - con valores vacíos que corresponden a los enums
const initialState: SellerState = {
  sellerProfile: null,
  isProfileLoading: false,
  
  dashboardStats: null,
  statsLoading: false,
  
  products: [],
  productsLoading: false,
  productsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  
  sales: [],
  salesLoading: false,
  salesPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  
  reviews: [],
  reviewsLoading: false,
  reviewsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  
  productFilters: {
    status: '',
    category: '',
    difficulty: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  salesFilters: {
    status: '',
    dateFrom: '',
    dateTo: '',
    minAmount: 0,
    maxAmount: 0,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  reviewsFilters: {
    rating: 0,
    status: '',
    hasResponse: false,
    productId: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  selectedProducts: [],
  bulkActionLoading: false
}

// HELPER FUNCTIONS
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  let token = null
  
  try {
    const authData = localStorage.getItem('furnibles-auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      token = parsed.state?.token || parsed.token
    }
  } catch (error) {
    console.error('Error parsing auth token:', error)
  }
  
  console.log('🔍 API Request Debug:', {
    endpoint,
    hasToken: !!token,
    tokenLength: token?.length,
    apiUrl: process.env.NEXT_PUBLIC_API_URL
  })
  
  const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`
  
  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  })
  
  console.log('🔍 API Response Debug:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: fullUrl
  })
  
  // ✅ CORRECCIÓN: Leer la respuesta UNA SOLA VEZ
  const result = await response.json()
  
  if (!response.ok) {
    console.error('🚨 API Request Failed:', {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      fullUrl,
      hasAuthHeader: !!token,
      backendErrorMessage: result.message || result.error,
      backendFullResponse: result
    })
  }
  
  return result
}

// SELLER STORE
export const useSellerStore = create<SellerState & SellerActions>()(
  persist(
    (set, get) => ({
      // ESTADO INICIAL
      ...initialState,

      // PERFIL DEL VENDEDOR
      loadSellerProfile: async () => {
        set({ isProfileLoading: true })
        
        try {
          const result = await apiRequest('/sellers/profile')
          
          if (result.success && result.data) {
            set({ 
              sellerProfile: result.data,
              isProfileLoading: false 
            })
          } else {
            set({ isProfileLoading: false })
          }
        } catch (error) {
          console.error('Error loading seller profile:', error)
          set({ isProfileLoading: false })
        }
      },

      updateSellerProfile: async (updates: Partial<SellerProfile>) => {
        try {
          const result = await apiRequest('/sellers/profile', {
            method: 'PUT',
            body: JSON.stringify(updates),
          })

          if (result.success && result.data) {
            set(state => ({
              sellerProfile: state.sellerProfile 
                ? { ...state.sellerProfile, ...result.data }
                : result.data
            }))
          }

          return result
        } catch (error) {
          console.error('Error updating seller profile:', error)
          return { success: false, error: 'Error de conexión' }
        }
      },

      clearSellerProfile: () => {
        set({ sellerProfile: null })
      },

      // DASHBOARD STATS
      loadDashboardStats: async (groupBy = 'month') => {
        set({ statsLoading: true })
        
        try {
          const result = await apiRequest(`/analytics/seller/dashboard?groupBy=${groupBy}`)
          
          if (result.success && result.data) {
            set({ 
              dashboardStats: result.data,
              statsLoading: false 
            })
          } else {
            set({ statsLoading: false })
          }
        } catch (error) {
          console.error('Error loading dashboard stats:', error)
          set({ statsLoading: false })
        }
      },

      refreshDashboardStats: async () => {
        await get().loadDashboardStats()
      },

      // GESTIÓN DE PRODUCTOS
      loadProducts: async (page = 1, filters) => {
        set({ productsLoading: true })
        
        const currentFilters = filters || get().productFilters
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: get().productsPagination.limit.toString(),
          ...Object.entries(currentFilters).reduce((acc, [key, value]) => {
            if (value) acc[key] = value.toString()
            return acc
          }, {} as Record<string, string>)
        })
        
        try {
          const result = await apiRequest(`/products/my?${queryParams}`)
          
          if (result.success && result.data) {
            set({
              products: result.data.data || [],
              productsPagination: {
                page: result.data.page || 1,
                limit: result.data.limit || 20,
                total: result.data.total || 0,
                totalPages: result.data.totalPages || 0
              },
              productsLoading: false
            })
          } else {
            set({ productsLoading: false })
          }
        } catch (error) {
          console.error('Error loading products:', error)
          set({ productsLoading: false })
        }
      },

      createProduct: async (productData: ProductFormData) => {
        try {
          const formData = new FormData()
          
          // Agregar campos básicos
          Object.entries(productData).forEach(([key, value]) => {
            if (key === 'pdfFile' || key === 'images') return
            
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value))
            } else {
              formData.append(key, value?.toString() || '')
            }
          })
          
          // Agregar archivos
          if (productData.pdfFile) {
            formData.append('pdfFile', productData.pdfFile)
          }
          
          if (productData.images) {
            productData.images.forEach((image, index) => {
              formData.append(`images`, image)
            })
          }

          const result = await apiRequest('/products', {
            method: 'POST',
            body: formData,
            headers: {} // No Content-Type para FormData
          })

          if (result.success) {
            // Recargar productos
            await get().loadProducts()
          }

          return result
        } catch (error) {
          console.error('Error creating product:', error)
          return { success: false, error: 'Error de conexión' }
        }
      },

      updateProduct: async (id: string, updates: Partial<ProductFormData>) => {
        try {
          const result = await apiRequest(`/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
          })

          if (result.success && result.data) {
            // Actualizar producto en la lista
            set(state => ({
              products: state.products.map(product => 
                product.id === id 
                  ? { ...product, ...result.data }
                  : product
              )
            }))
          }

          return result
        } catch (error) {
          console.error('Error updating product:', error)
          return { success: false, error: 'Error de conexión' }
        }
      },

      deleteProduct: async (id: string) => {
        try {
          const result = await apiRequest(`/products/${id}`, {
            method: 'DELETE',
          })

          if (result.success) {
            // Remover producto de la lista
            set(state => ({
              products: state.products.filter(product => product.id !== id)
            }))
          }

          return result
        } catch (error) {
          console.error('Error deleting product:', error)
          return { success: false, error: 'Error de conexión' }
        }
      },

      duplicateProduct: async (id: string) => {
        try {
          const result = await apiRequest(`/products/${id}/duplicate`, {
            method: 'POST',
          })

          if (result.success) {
            // Recargar productos
            await get().loadProducts()
          }

          return result
        } catch (error) {
          console.error('Error duplicating product:', error)
          return { success: false, error: 'Error de conexión' }
        }
      },

      publishProduct: async (id: string) => {
        try {
          const result = await apiRequest(`/products/${id}/publish`, {
            method: 'POST',
          })

          if (result.success) {
            // Actualizar estado del producto usando el enum correcto
            set(state => ({
              products: state.products.map(product => 
                product.id === id 
                  ? { ...product, status: ProductStatus.PENDING }
                  : product
              )
            }))
          }

          return result
        } catch (error) {
          console.error('Error publishing product:', error)
          return { success: false, error: 'Error de conexión' }
        }
      },

      // GESTIÓN DE VENTAS
      loadSales: async (page = 1, filters) => {
        set({ salesLoading: true })
        
        const currentFilters = filters || get().salesFilters
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: get().salesPagination.limit.toString(),
          ...Object.entries(currentFilters).reduce((acc, [key, value]) => {
            if (value) acc[key] = value.toString()
            return acc
          }, {} as Record<string, string>)
        })
        
        try {
          const result = await apiRequest(`/orders/sales?${queryParams}`)
          
          if (result.success && result.data) {
            set({
              sales: result.data.data || [],
              salesPagination: {
                page: result.data.page || 1,
                limit: result.data.limit || 20,
                total: result.data.total || 0,
                totalPages: result.data.totalPages || 0
              },
              salesLoading: false
            })
          } else {
            set({ salesLoading: false })
          }
        } catch (error) {
          console.error('Error loading sales:', error)
          set({ salesLoading: false })
        }
      },

      loadSaleDetails: async (orderItemId: string) => {
        try {
          const result = await apiRequest(`/orders/sales/${orderItemId}`)
          
          if (result.success && result.data) {
            return result.data
          }
          
          return null
        } catch (error) {
          console.error('Error loading sale details:', error)
          return null
        }
      },

      // GESTIÓN DE REVIEWS
      loadReviews: async (page = 1, filters) => {
        set({ reviewsLoading: true })
        
        const currentFilters = filters || get().reviewsFilters
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: get().reviewsPagination.limit.toString(),
          sellerId: 'current', // Backend lo resuelve con el token
          ...Object.entries(currentFilters).reduce((acc, [key, value]) => {
            if (value) acc[key] = value.toString()
            return acc
          }, {} as Record<string, string>)
        })
        
        try {
          const result = await apiRequest(`/reviews?${queryParams}`)
          
          if (result.success && result.data) {
            set({
              reviews: result.data.data || [],
              reviewsPagination: {
                page: result.data.page || 1,
                limit: result.data.limit || 20,
                total: result.data.total || 0,
                totalPages: result.data.totalPages || 0
              },
              reviewsLoading: false
            })
          } else {
            set({ reviewsLoading: false })
          }
        } catch (error) {
          console.error('Error loading reviews:', error)
          set({ reviewsLoading: false })
        }
      },

      respondToReview: async (reviewId: string, response: string) => {
        try {
          const result = await apiRequest(`/reviews/${reviewId}/response`, {
            method: 'POST',
            body: JSON.stringify({ comment: response }),
          })

          if (result.success) {
            // Actualizar review en la lista
            set(state => ({
              reviews: state.reviews.map(review => 
                review.id === reviewId 
                  ? { 
                      ...review, 
                      response: {
                        id: result.data.id,
                        reviewId: reviewId,
                        sellerId: result.data.sellerId,
                        comment: response,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        seller: result.data.seller
                      }
                    }
                  : review
              )
            }))
          }

          return result
        } catch (error) {
          console.error('Error responding to review:', error)
          return { success: false, error: 'Error de conexión' }
        }
      },

      // FILTROS
      setProductFilters: (filters: Partial<ProductFilters>) => {
        set(state => ({
          productFilters: { ...state.productFilters, ...filters }
        }))
      },

      setSalesFilters: (filters: Partial<SalesFilters>) => {
        set(state => ({
          salesFilters: { ...state.salesFilters, ...filters }
        }))
      },

      setReviewsFilters: (filters: Partial<ReviewsFilters>) => {
        set(state => ({
          reviewsFilters: { ...state.reviewsFilters, ...filters }
        }))
      },

      clearAllFilters: () => {
        set({
          productFilters: initialState.productFilters,
          salesFilters: initialState.salesFilters,
          reviewsFilters: initialState.reviewsFilters
        })
      },

      // SELECCIÓN Y ACCIONES EN LOTE
      selectProduct: (productId: string) => {
        set(state => ({
          selectedProducts: state.selectedProducts.includes(productId)
            ? state.selectedProducts.filter(id => id !== productId)
            : [...state.selectedProducts, productId]
        }))
      },

      selectAllProducts: () => {
        set(state => ({
          selectedProducts: state.products.map(product => product.id)
        }))
      },

      clearProductSelection: () => {
        set({ selectedProducts: [] })
      },

      bulkUpdateProducts: async (action: 'publish' | 'unpublish' | 'delete', productIds: string[]) => {
        set({ bulkActionLoading: true })
        
        try {
          const result = await apiRequest('/products/bulk', {
            method: 'POST',
            body: JSON.stringify({ action, productIds }),
          })

          if (result.success) {
            // Recargar productos
            await get().loadProducts()
            set({ selectedProducts: [] })
          }

          set({ bulkActionLoading: false })
          return result
        } catch (error) {
          console.error('Error in bulk action:', error)
          set({ bulkActionLoading: false })
          return { success: false, error: 'Error de conexión' }
        }
      },

      // ANALYTICS
      loadAnalytics: async (period: string, metrics: string[]) => {
        try {
          const queryParams = new URLSearchParams({
            period,
            metrics: metrics.join(',')
          })
          
          const result = await apiRequest(`/analytics/seller/detailed?${queryParams}`)
          
          if (result.success && result.data) {
            return result.data
          }
          
          return null
        } catch (error) {
          console.error('Error loading analytics:', error)
          return null
        }
      },

      exportData: async (type: 'products' | 'sales' | 'reviews', format: 'csv' | 'xlsx' | 'pdf') => {
        try {
          const result = await apiRequest(`/analytics/seller/export?type=${type}&format=${format}`)
          
          if (result.success && result.data) {
            return result.data.downloadUrl
          }
          
          return ''
        } catch (error) {
          console.error('Error exporting data:', error)
          return ''
        }
      },

      // UTILIDADES
      getProductById: (id: string) => {
        const { products } = get()
        return products.find(product => product.id === id) || null
      },

      getProductsCount: () => {
        const { products } = get()
        return products.length
      },

      getTotalRevenue: () => {
        const { dashboardStats } = get()
        return dashboardStats?.totalRevenue || 0
      },

      getAverageRating: () => {
        const { dashboardStats } = get()
        return dashboardStats?.averageRating || 0
      },
    }),
    {
      name: 'furnibles-seller-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sellerProfile: state.sellerProfile,
        productFilters: state.productFilters,
        salesFilters: state.salesFilters,
        reviewsFilters: state.reviewsFilters,
      }),
    }
  )
)

// Registrar el store en el manager
if (typeof window !== 'undefined') {
  registerStore('seller', useSellerStore)
}

// Exportar tipos para uso en componentes
export type { 
  SellerDashboardStats, 
  SellerSale, 
  SellerReview, 
  ProductFormData, 
  SellerAnalytics,
  ProductFilters,
  SalesFilters,
  ReviewsFilters
}