import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  Product, 
  User, 
  Review, 
  Order,
  ProductStatus,
  ReviewStatus,
  UserStatus,
  OrderStatus,
  UserRole,
  ProductCategory,
  Difficulty
} from '@/types'
import { ApiResponse } from '@/types/additional'
import { registerStore } from './store-manager'

// DASHBOARD METRICS INTERFACE (coincide con uso en componente)
interface DashboardMetrics {
  totalUsers: number
  totalSellers: number
  totalProducts: number
  pendingProducts: number
  totalOrders: number
  totalRevenue: number
  platformFees: number
  totalReviews: number
  pendingReviews: number
  averageRating: number
  systemHealth: number
  activeDownloads: number
}

// RECENT ACTIVITY INTERFACE
interface RecentActivity {
  id: string
  type: 'user_registration' | 'product_submitted' | 'order_completed' | 'review_reported' | 'payout_processed'
  message: string
  timestamp: string
  severity: 'info' | 'warning' | 'error' | 'success'
  userId?: string
  productId?: string
  orderId?: string
}

// TOP PERFORMERS INTERFACE
interface TopPerformer {
  id: string
  name: string
  type: 'seller' | 'product'
  value: number
  metric: string
  change: number
}

// ADMIN DASHBOARD STATS INTERFACE (backend compatible)
interface AdminDashboardStats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingProducts: number
  pendingReviews: number
  flaggedContent: number
  activeUsers: number
  monthlyGrowth: {
    users: number
    products: number
    orders: number
    revenue: number
  }
  platformHealth: {
    serverStatus: 'healthy' | 'warning' | 'error'
    dbStatus: 'healthy' | 'warning' | 'error'
    paymentStatus: 'healthy' | 'warning' | 'error'
    emailStatus: 'healthy' | 'warning' | 'error'
  }
}

// ADMIN ANALYTICS INTERFACE
interface AdminAnalytics {
  usersByRole: { role: UserRole; count: number }[]
  productsByCategory: { category: ProductCategory; count: number }[]
  productsByStatus: { status: ProductStatus; count: number }[]
  ordersByStatus: { status: OrderStatus; count: number }[]
  topSellers: {
    id: string
    name: string
    storeName: string
    totalSales: number
    revenue: number
  }[]
  topProducts: {
    id: string
    title: string
    category: ProductCategory
    downloads: number
    revenue: number
    rating: number
  }[]
  revenueByMonth: {
    month: string
    revenue: number
    orders: number
  }[]
}

// ADMIN STATE INTERFACE
interface AdminState {
  // Estado general
  isLoading: boolean
  error: string | null
  
  // Dashboard (propiedades usadas en componente)
  dashboardMetrics: DashboardMetrics | null
  recentActivity: RecentActivity[]
  topPerformers: TopPerformer[]
  
  // Dashboard (backend compatible)
  dashboardStats: AdminDashboardStats | null
  analytics: AdminAnalytics | null
  lastStatsUpdate: number | null
  
  // Moderación
  pendingProducts: Product[]
  pendingReviews: Review[]
  flaggedContent: {
    reviews: Review[]
    users: User[]
  }
  
  // Gestión de usuarios
  users: User[]
  selectedUser: User | null
  userFilters: {
    role: UserRole | 'ALL'
    status: UserStatus | 'ALL'
    search: string
  }
  
  // Gestión de productos
  products: Product[]
  selectedProduct: Product | null
  productFilters: {
    status: ProductStatus | 'ALL'
    category: ProductCategory | 'ALL'
    seller: string
    search: string
  }
  
  // Configuración del sistema
  systemConfig: {
    platformFee: number
    maxFileSize: number
    allowedFileTypes: string[]
    maintenanceMode: boolean
    registrationEnabled: boolean
  }
}

// ADMIN ACTIONS INTERFACE
interface AdminActions {
  // Dashboard y analytics (métodos usados en componente)
  fetchDashboardData: (period?: string) => Promise<void>
  refreshMetrics: () => Promise<void>
  
  // Dashboard y analytics (backend compatible)
  fetchDashboardStats: () => Promise<void>
  fetchAnalytics: (period?: string) => Promise<void>
  refreshStats: () => Promise<void>
  
  // Moderación de productos
  fetchPendingProducts: () => Promise<void>
  approveProduct: (productId: string, reason?: string) => Promise<ApiResponse>
  rejectProduct: (productId: string, reason: string) => Promise<ApiResponse>
  suspendProduct: (productId: string, reason: string) => Promise<ApiResponse>
  
  // Moderación de reviews
  fetchPendingReviews: () => Promise<void>
  fetchFlaggedContent: () => Promise<void>
  approveReview: (reviewId: string) => Promise<ApiResponse>
  removeReview: (reviewId: string, reason: string) => Promise<ApiResponse>
  flagReview: (reviewId: string, reason: string) => Promise<ApiResponse>
  
  // Gestión de usuarios
  fetchUsers: (filters?: Partial<AdminState['userFilters']>) => Promise<void>
  fetchUserById: (userId: string) => Promise<void>
  updateUserStatus: (userId: string, status: UserStatus, reason?: string) => Promise<ApiResponse>
  promoteUser: (userId: string, newRole: UserRole) => Promise<ApiResponse>
  resetUserPassword: (userId: string) => Promise<ApiResponse>
  
  // Gestión de productos (admin)
  fetchAllProducts: (filters?: Partial<AdminState['productFilters']>) => Promise<void>
  updateProductStatus: (productId: string, status: ProductStatus, reason?: string) => Promise<ApiResponse>
  featureProduct: (productId: string, featured: boolean) => Promise<ApiResponse>
  
  // Sistema y configuración
  fetchSystemConfig: () => Promise<void>
  updateSystemConfig: (config: Partial<AdminState['systemConfig']>) => Promise<ApiResponse>
  enableMaintenanceMode: (enabled: boolean, message?: string) => Promise<ApiResponse>
  
  // Analytics avanzado
  exportData: (type: 'users' | 'products' | 'orders' | 'analytics', format: 'csv' | 'xlsx' | 'json') => Promise<void>
  generateReport: (type: string, period: string) => Promise<void>
  
  // Filtros y búsqueda
  setUserFilters: (filters: Partial<AdminState['userFilters']>) => void
  setProductFilters: (filters: Partial<AdminState['productFilters']>) => void
  clearFilters: () => void
  
  // Estado de UI
  setSelectedUser: (user: User | null) => void
  setSelectedProduct: (product: Product | null) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// HELPER FUNCTION para convertir stats a metrics
const convertStatsToMetrics = (stats: AdminDashboardStats | null): DashboardMetrics | null => {
  if (!stats) return null
  
  return {
    totalUsers: stats.totalUsers,
    totalSellers: Math.floor(stats.totalUsers * 0.3), // Estimación 30% vendedores
    totalProducts: stats.totalProducts,
    pendingProducts: stats.pendingProducts,
    totalOrders: stats.totalOrders,
    totalRevenue: stats.totalRevenue,
    platformFees: stats.totalRevenue * 0.1, // 10% platform fee
    totalReviews: stats.totalProducts * 2, // Estimación 2 reviews por producto
    pendingReviews: stats.pendingReviews,
    averageRating: 4.2, // Rating promedio estimado
    systemHealth: stats.platformHealth.serverStatus === 'healthy' ? 100 : 
                  stats.platformHealth.serverStatus === 'warning' ? 75 : 50,
    activeDownloads: Math.floor(stats.totalOrders * 1.5) // Estimación downloads activos
  }
}

// MOCK DATA para desarrollo
const generateMockRecentActivity = (): RecentActivity[] => [
  {
    id: '1',
    type: 'user_registration',
    message: 'Nuevo usuario registrado: María González',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    severity: 'success'
  },
  {
    id: '2',
    type: 'product_submitted',
    message: 'Producto enviado para revisión: "Mesa de Centro Moderna"',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    severity: 'info'
  },
  {
    id: '3',
    type: 'order_completed',
    message: 'Pedido completado: #ORD-2024-001234',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    severity: 'success'
  },
  {
    id: '4',
    type: 'review_reported',
    message: 'Review reportada por contenido inapropiado',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    severity: 'warning'
  },
  {
    id: '5',
    type: 'payout_processed',
    message: 'Pago procesado para Carlos Ruiz: $245.50',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    severity: 'success'
  }
]

const generateMockTopPerformers = (): TopPerformer[] => [
  {
    id: '1',
    name: 'Carlos Ruiz',
    type: 'seller',
    value: 2850,
    metric: 'Ventas del mes',
    change: 15.3
  },
  {
    id: '2',
    name: 'Ana Martínez',
    type: 'seller', 
    value: 2240,
    metric: 'Ventas del mes',
    change: 8.7
  },
  {
    id: '3',
    name: 'Mesa de Centro Minimalista',
    type: 'product',
    value: 127,
    metric: 'Descargas',
    change: 23.1
  },
  {
    id: '4',
    name: 'Silla Ergonómica Office',
    type: 'product',
    value: 98,
    metric: 'Descargas',
    change: -5.2
  },
  {
    id: '5',
    name: 'Luis García',
    type: 'seller',
    value: 1890,
    metric: 'Ventas del mes',
    change: 12.4
  }
]

// INITIAL STATE
const initialState: AdminState = {
  isLoading: false,
  error: null,
  
  // Dashboard (componente)
  dashboardMetrics: null,
  recentActivity: [],
  topPerformers: [],
  
  // Dashboard (backend)
  dashboardStats: null,
  analytics: null,
  lastStatsUpdate: null,
  
  pendingProducts: [],
  pendingReviews: [],
  flaggedContent: {
    reviews: [],
    users: []
  },
  
  users: [],
  selectedUser: null,
  userFilters: {
    role: 'ALL',
    status: 'ALL',
    search: ''
  },
  
  products: [],
  selectedProduct: null,
  productFilters: {
    status: 'ALL',
    category: 'ALL',
    seller: '',
    search: ''
  },
  
  systemConfig: {
    platformFee: 0.10,
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maintenanceMode: false,
    registrationEnabled: true
  }
}

// HELPER FUNCTION para headers con auth
const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
})

// ADMIN STORE
export const useAdminStore = create<AdminState & AdminActions>()(
  persist(
    (set, get) => ({
      // ESTADO INICIAL
      ...initialState,

      // DASHBOARD Y ANALYTICS (métodos usados en componente)
      fetchDashboardData: async (period = '7d') => {
        set({ isLoading: true, error: null })
        
        try {
          // Obtener token del auth store
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          // Fetch dashboard stats
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard?period=${period}`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            // Si falla la API, usar datos mock para desarrollo
            console.warn('API no disponible, usando datos mock')
            const mockStats: AdminDashboardStats = {
              totalUsers: 1247,
              totalProducts: 543,
              totalOrders: 2341,
              totalRevenue: 45680.50,
              pendingProducts: 12,
              pendingReviews: 8,
              flaggedContent: 3,
              activeUsers: 892,
              monthlyGrowth: {
                users: 15.3,
                products: 8.7,
                orders: 23.1,
                revenue: 18.9
              },
              platformHealth: {
                serverStatus: 'healthy',
                dbStatus: 'healthy', 
                paymentStatus: 'healthy',
                emailStatus: 'warning'
              }
            }

            set({
              dashboardStats: mockStats,
              dashboardMetrics: convertStatsToMetrics(mockStats),
              recentActivity: generateMockRecentActivity(),
              topPerformers: generateMockTopPerformers(),
              lastStatsUpdate: Date.now(),
              isLoading: false
            })
            return
          }

          const result: ApiResponse<AdminDashboardStats> = await response.json()

          if (result.success && result.data) {
            set({ 
              dashboardStats: result.data,
              dashboardMetrics: convertStatsToMetrics(result.data),
              recentActivity: generateMockRecentActivity(), // TODO: obtener del backend
              topPerformers: generateMockTopPerformers(), // TODO: obtener del backend
              lastStatsUpdate: Date.now(),
              isLoading: false 
            })
          } else {
            throw new Error(result.error || 'Error al cargar estadísticas')
          }
        } catch (error) {
          console.error('Dashboard data error:', error)
          
          // Fallback a datos mock en caso de error
          const mockStats: AdminDashboardStats = {
            totalUsers: 1247,
            totalProducts: 543,
            totalOrders: 2341,
            totalRevenue: 45680.50,
            pendingProducts: 12,
            pendingReviews: 8,
            flaggedContent: 3,
            activeUsers: 892,
            monthlyGrowth: {
              users: 15.3,
              products: 8.7,
              orders: 23.1,
              revenue: 18.9
            },
            platformHealth: {
              serverStatus: 'healthy',
              dbStatus: 'healthy',
              paymentStatus: 'healthy', 
              emailStatus: 'warning'
            }
          }

          set({
            dashboardStats: mockStats,
            dashboardMetrics: convertStatsToMetrics(mockStats),
            recentActivity: generateMockRecentActivity(),
            topPerformers: generateMockTopPerformers(),
            error: 'Usando datos de ejemplo - API no disponible',
            isLoading: false
          })
        }
      },

      refreshMetrics: async () => {
        await get().fetchDashboardData()
        await get().fetchAnalytics()
      },

      // DASHBOARD Y ANALYTICS (métodos originales)
      fetchDashboardStats: async () => {
        set({ isLoading: true, error: null })
        
        try {
          // Obtener token del auth store
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            throw new Error('Error al obtener estadísticas')
          }

          const result: ApiResponse<AdminDashboardStats> = await response.json()

          if (result.success && result.data) {
            set({ 
              dashboardStats: result.data,
              dashboardMetrics: convertStatsToMetrics(result.data),
              lastStatsUpdate: Date.now(),
              isLoading: false 
            })
          } else {
            throw new Error(result.error || 'Error al cargar estadísticas')
          }
        } catch (error) {
          console.error('Dashboard stats error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false 
          })
        }
      },

      fetchAnalytics: async (period = '30d') => {
        set({ isLoading: true, error: null })
        
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics?period=${period}`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            throw new Error('Error al obtener analytics')
          }

          const result: ApiResponse<AdminAnalytics> = await response.json()

          if (result.success && result.data) {
            set({ 
              analytics: result.data,
              isLoading: false 
            })
          } else {
            throw new Error(result.error || 'Error al cargar analytics')
          }
        } catch (error) {
          console.error('Analytics error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false 
          })
        }
      },

      refreshStats: async () => {
        await Promise.all([
          get().fetchDashboardStats(),
          get().fetchAnalytics()
        ])
      },

      // MODERACIÓN DE PRODUCTOS
      fetchPendingProducts: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/pending`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            throw new Error('Error al obtener productos pendientes')
          }

          const result: ApiResponse<Product[]> = await response.json()

          if (result.success && result.data) {
            set({ 
              pendingProducts: result.data,
              isLoading: false 
            })
          } else {
            throw new Error(result.error || 'Error al cargar productos pendientes')
          }
        } catch (error) {
          console.error('Pending products error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false 
          })
        }
      },

      approveProduct: async (productId: string, reason?: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}/approve`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ reason })
          })

          const result: ApiResponse = await response.json()

          if (result.success) {
            // Actualizar lista de productos pendientes
            const currentPending = get().pendingProducts
            set({ 
              pendingProducts: currentPending.filter(p => p.id !== productId)
            })
          }

          return result
        } catch (error) {
          console.error('Approve product error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      rejectProduct: async (productId: string, reason: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}/reject`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ reason })
          })

          const result: ApiResponse = await response.json()

          if (result.success) {
            // Actualizar lista de productos pendientes
            const currentPending = get().pendingProducts
            set({ 
              pendingProducts: currentPending.filter(p => p.id !== productId)
            })
          }

          return result
        } catch (error) {
          console.error('Reject product error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      suspendProduct: async (productId: string, reason: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}/suspend`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ reason })
          })

          const result: ApiResponse = await response.json()

          return result
        } catch (error) {
          console.error('Suspend product error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      // MODERACIÓN DE REVIEWS
      fetchPendingReviews: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/pending`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            throw new Error('Error al obtener reviews pendientes')
          }

          const result: ApiResponse<Review[]> = await response.json()

          if (result.success && result.data) {
            set({ 
              pendingReviews: result.data,
              isLoading: false 
            })
          } else {
            throw new Error(result.error || 'Error al cargar reviews pendientes')
          }
        } catch (error) {
          console.error('Pending reviews error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false 
          })
        }
      },

      fetchFlaggedContent: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/flagged-content`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            throw new Error('Error al obtener contenido reportado')
          }

          const result: ApiResponse<{ reviews: Review[]; users: User[] }> = await response.json()

          if (result.success && result.data) {
            set({ 
              flaggedContent: result.data,
              isLoading: false 
            })
          } else {
            throw new Error(result.error || 'Error al cargar contenido reportado')
          }
        } catch (error) {
          console.error('Flagged content error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false 
          })
        }
      },

      approveReview: async (reviewId: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/${reviewId}/approve`, {
            method: 'POST',
            headers: getAuthHeaders(token)
          })

          const result: ApiResponse = await response.json()

          if (result.success) {
            // Actualizar lista de reviews pendientes
            const currentPending = get().pendingReviews
            set({ 
              pendingReviews: currentPending.filter(r => r.id !== reviewId)
            })
          }

          return result
        } catch (error) {
          console.error('Approve review error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      removeReview: async (reviewId: string, reason: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/${reviewId}/remove`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ reason })
          })

          const result: ApiResponse = await response.json()

          if (result.success) {
            // Actualizar listas
            const currentPending = get().pendingReviews
            const currentFlagged = get().flaggedContent
            set({ 
              pendingReviews: currentPending.filter(r => r.id !== reviewId),
              flaggedContent: {
                ...currentFlagged,
                reviews: currentFlagged.reviews.filter(r => r.id !== reviewId)
              }
            })
          }

          return result
        } catch (error) {
          console.error('Remove review error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      flagReview: async (reviewId: string, reason: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/${reviewId}/flag`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ reason })
          })

          const result: ApiResponse = await response.json()

          return result
        } catch (error) {
          console.error('Flag review error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      // GESTIÓN DE USUARIOS
      fetchUsers: async (filters = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          // Construir query params
          const params = new URLSearchParams()
          const currentFilters = { ...get().userFilters, ...filters }
          
          if (currentFilters.role !== 'ALL') params.append('role', currentFilters.role)
          if (currentFilters.status !== 'ALL') params.append('status', currentFilters.status)
          if (currentFilters.search) params.append('search', currentFilters.search)

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params.toString()}`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            throw new Error('Error al obtener usuarios')
          }

          const result: ApiResponse<User[]> = await response.json()

          if (result.success && result.data) {
            set({ 
              users: result.data,
              userFilters: currentFilters,
              isLoading: false 
            })
          } else {
            throw new Error(result.error || 'Error al cargar usuarios')
          }
        } catch (error) {
          console.error('Fetch users error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false 
          })
        }
      },

      fetchUserById: async (userId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            throw new Error('Error al obtener usuario')
          }

          const result: ApiResponse<User> = await response.json()

          if (result.success && result.data) {
            set({ 
              selectedUser: result.data,
              isLoading: false 
            })
          } else {
            throw new Error(result.error || 'Error al cargar usuario')
          }
        } catch (error) {
          console.error('Fetch user error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false 
          })
        }
      },

      updateUserStatus: async (userId: string, status: UserStatus, reason?: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ status, reason })
          })

          const result: ApiResponse = await response.json()

          if (result.success) {
            // Actualizar usuario en la lista
            const currentUsers = get().users
            set({ 
              users: currentUsers.map(user => 
                user.id === userId ? { ...user, status } : user
              )
            })

            // Actualizar usuario seleccionado si coincide
            const selectedUser = get().selectedUser
            if (selectedUser && selectedUser.id === userId) {
              set({ selectedUser: { ...selectedUser, status } })
            }
          }

          return result
        } catch (error) {
          console.error('Update user status error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      promoteUser: async (userId: string, newRole: UserRole) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/promote`, {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ role: newRole })
          })

          const result: ApiResponse = await response.json()

          if (result.success) {
            // Actualizar usuario en la lista
            const currentUsers = get().users
            set({ 
              users: currentUsers.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
              )
            })

            // Actualizar usuario seleccionado si coincide
            const selectedUser = get().selectedUser
            if (selectedUser && selectedUser.id === userId) {
              set({ selectedUser: { ...selectedUser, role: newRole } })
            }
          }

          return result
        } catch (error) {
          console.error('Promote user error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      resetUserPassword: async (userId: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/reset-password`, {
            method: 'POST',
            headers: getAuthHeaders(token)
          })

          const result: ApiResponse = await response.json()

          return result
        } catch (error) {
          console.error('Reset password error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      // GESTIÓN DE PRODUCTOS (ADMIN)
      fetchAllProducts: async (filters = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          // Construir query params
          const params = new URLSearchParams()
          const currentFilters = { ...get().productFilters, ...filters }
          
          if (currentFilters.status !== 'ALL') params.append('status', currentFilters.status)
          if (currentFilters.category !== 'ALL') params.append('category', currentFilters.category)
          if (currentFilters.seller) params.append('seller', currentFilters.seller)
          if (currentFilters.search) params.append('search', currentFilters.search)

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products?${params.toString()}`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            throw new Error('Error al obtener productos')
          }

          const result: ApiResponse<Product[]> = await response.json()

          if (result.success && result.data) {
            set({ 
              products: result.data,
              productFilters: currentFilters,
              isLoading: false 
            })
          } else {
            throw new Error(result.error || 'Error al cargar productos')
          }
        } catch (error) {
          console.error('Fetch products error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false 
          })
        }
      },

      updateProductStatus: async (productId: string, status: ProductStatus, reason?: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ status, reason })
          })

          const result: ApiResponse = await response.json()

          if (result.success) {
            // Actualizar producto en la lista
            const currentProducts = get().products
            set({ 
              products: currentProducts.map(product => 
                product.id === productId ? { ...product, status } : product
              )
            })

            // Actualizar producto seleccionado si coincide
            const selectedProduct = get().selectedProduct
            if (selectedProduct && selectedProduct.id === productId) {
              set({ selectedProduct: { ...selectedProduct, status } })
            }
          }

          return result
        } catch (error) {
          console.error('Update product status error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      featureProduct: async (productId: string, featured: boolean) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}/feature`, {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ featured })
          })

          const result: ApiResponse = await response.json()

          if (result.success) {
            // Actualizar producto en la lista
            const currentProducts = get().products
            set({ 
              products: currentProducts.map(product => 
                product.id === productId ? { ...product, featured } : product
              )
            })

            // Actualizar producto seleccionado si coincide
            const selectedProduct = get().selectedProduct
            if (selectedProduct && selectedProduct.id === productId) {
              set({ selectedProduct: { ...selectedProduct, featured } })
            }
          }

          return result
        } catch (error) {
          console.error('Feature product error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      // SISTEMA Y CONFIGURACIÓN
      fetchSystemConfig: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system/config`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            throw new Error('Error al obtener configuración del sistema')
          }

          const result: ApiResponse<AdminState['systemConfig']> = await response.json()

          if (result.success && result.data) {
            set({ 
              systemConfig: result.data,
              isLoading: false 
            })
          } else {
            throw new Error(result.error || 'Error al cargar configuración')
          }
        } catch (error) {
          console.error('System config error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false 
          })
        }
      },

      updateSystemConfig: async (config: Partial<AdminState['systemConfig']>) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system/config`, {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify(config)
          })

          const result: ApiResponse = await response.json()

          if (result.success) {
            // Actualizar configuración local
            const currentConfig = get().systemConfig
            set({ 
              systemConfig: { ...currentConfig, ...config }
            })
          }

          return result
        } catch (error) {
          console.error('Update system config error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      enableMaintenanceMode: async (enabled: boolean, message?: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system/maintenance`, {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ enabled, message })
          })

          const result: ApiResponse = await response.json()

          if (result.success) {
            // Actualizar configuración local
            const currentConfig = get().systemConfig
            set({ 
              systemConfig: { ...currentConfig, maintenanceMode: enabled }
            })
          }

          return result
        } catch (error) {
          console.error('Maintenance mode error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
        }
      },

      // ANALYTICS AVANZADO
      exportData: async (type: 'users' | 'products' | 'orders' | 'analytics', format: 'csv' | 'xlsx' | 'json') => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/export/${type}?format=${format}`, {
            headers: getAuthHeaders(token)
          })

          if (!response.ok) {
            throw new Error('Error al exportar datos')
          }

          // Descargar archivo
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `furnibles-${type}-${new Date().toISOString().split('T')[0]}.${format}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Export data error:', error)
          throw error
        }
      },

      generateReport: async (type: string, period: string) => {
        try {
          const authStore = (window as any).storeManager?.getStore('auth')
          const token = authStore?.getState().token
          
          if (!token) {
            throw new Error('No autorizado')
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/generate`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ type, period })
          })

          if (!response.ok) {
            throw new Error('Error al generar reporte')
          }

          // Descargar reporte PDF
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `furnibles-report-${type}-${period}-${new Date().toISOString().split('T')[0]}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Generate report error:', error)
          throw error
        }
      },

      // FILTROS Y BÚSQUEDA
      setUserFilters: (filters: Partial<AdminState['userFilters']>) => {
        const currentFilters = get().userFilters
        set({ userFilters: { ...currentFilters, ...filters } })
      },

      setProductFilters: (filters: Partial<AdminState['productFilters']>) => {
        const currentFilters = get().productFilters
        set({ productFilters: { ...currentFilters, ...filters } })
      },

      clearFilters: () => {
        set({
          userFilters: {
            role: 'ALL',
            status: 'ALL',
            search: ''
          },
          productFilters: {
            status: 'ALL',
            category: 'ALL',
            seller: '',
            search: ''
          }
        })
      },

      // ESTADO DE UI
      setSelectedUser: (user: User | null) => {
        set({ selectedUser: user })
      },

      setSelectedProduct: (product: Product | null) => {
        set({ selectedProduct: product })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'furnibles-admin-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir configuraciones y filtros, no datos temporales
        userFilters: state.userFilters,
        productFilters: state.productFilters,
        systemConfig: state.systemConfig,
        lastStatsUpdate: state.lastStatsUpdate
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Limpiar datos temporales al hidratar
          state.pendingProducts = []
          state.pendingReviews = []
          state.users = []
          state.products = []
          state.selectedUser = null
          state.selectedProduct = null
          state.error = null
          state.isLoading = false
          state.dashboardMetrics = null
          state.recentActivity = []
          state.topPerformers = []
        }
      },
    }
  )
)

// Registrar el store en el manager
if (typeof window !== 'undefined') {
  registerStore('admin', useAdminStore)
}