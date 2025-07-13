// Store Manager - Acceso centralizado y seguro a todos los stores
// Evita dependencias circulares y permite acceso entre stores

type StoreInstance = {
  getState: () => any;
  setState: (state: any) => void;
  subscribe: (listener: (state: any) => void) => () => void;
}

// Registry global de stores
const storeRegistry = new Map<string, StoreInstance>()

// Registrar un store
export function registerStore(name: string, store: StoreInstance) {
  storeRegistry.set(name, store)
}

// Obtener un store registrado
export function getStore<T>(name: string): T | null {
  const store = storeRegistry.get(name)
  return store ? store.getState() : null
}

// Acceso específico a stores comunes
export const storeManager = {
  // Auth Store
  getAuthState: () => {
    try {
      const store = storeRegistry.get('auth')
      return store?.getState() || { 
        user: null, 
        isAuthenticated: false, 
        token: null 
      }
    } catch {
      return { user: null, isAuthenticated: false, token: null }
    }
  },

  // Cart Store  
  getCartState: () => {
    try {
      const store = storeRegistry.get('cart')
      return store?.getState() || { 
        items: [], 
        total: 0, 
        itemCount: 0 
      }
    } catch {
      return { items: [], total: 0, itemCount: 0 }
    }
  },

  // Notification Store
  getNotificationState: () => {
    try {
      const store = storeRegistry.get('notification')
      return store?.getState() || { 
        notifications: [], 
        unreadCount: 0 
      }
    } catch {
      return { notifications: [], unreadCount: 0 }
    }
  },

  // Seller Store
  getSellerState: () => {
    try {
      const store = storeRegistry.get('seller')
      return store?.getState() || { 
        sellerProfile: null,
        dashboardStats: null,
        products: [],
        sales: [],
        reviews: []
      }
    } catch {
      return { 
        sellerProfile: null,
        dashboardStats: null,
        products: [],
        sales: [],
        reviews: []
      }
    }
  },

  // 🆕 Admin Store
  getAdminState: () => {
    try {
      const store = storeRegistry.get('admin')
      return store?.getState() || { 
        dashboardStats: null,
        analytics: null,
        pendingProducts: [],
        pendingReviews: [],
        flaggedContent: { reviews: [], users: [] },
        users: [],
        products: [],
        systemConfig: {
          platformFee: 0.10,
          maxFileSize: 10485760,
          allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
          maintenanceMode: false,
          registrationEnabled: true
        }
      }
    } catch {
      return { 
        dashboardStats: null,
        analytics: null,
        pendingProducts: [],
        pendingReviews: [],
        flaggedContent: { reviews: [], users: [] },
        users: [],
        products: [],
        systemConfig: {
          platformFee: 0.10,
          maxFileSize: 10485760,
          allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
          maintenanceMode: false,
          registrationEnabled: true
        }
      }
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    const authState = storeManager.getAuthState()
    return authState.isAuthenticated || false
  },

  // Obtener token actual
  getToken: () => {
    const authState = storeManager.getAuthState()
    return authState.token || null
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const authState = storeManager.getAuthState()
    return authState.user || null
  },

  // Obtener cantidad de items en carrito
  getCartItemCount: () => {
    const cartState = storeManager.getCartState()
    return cartState.itemCount || 0
  },

  // Obtener notificaciones no leídas
  getUnreadNotificationCount: () => {
    const notificationState = storeManager.getNotificationState()
    return notificationState.unreadCount || 0
  },

  // Métodos del Seller
  getSellerProfile: () => {
    const sellerState = storeManager.getSellerState()
    return sellerState.sellerProfile || null
  },

  getSellerDashboardStats: () => {
    const sellerState = storeManager.getSellerState()
    return sellerState.dashboardStats || null
  },

  getSellerProductsCount: () => {
    const sellerState = storeManager.getSellerState()
    return sellerState.products?.length || 0
  },

  getSellerTotalRevenue: () => {
    const sellerState = storeManager.getSellerState()
    return sellerState.dashboardStats?.totalRevenue || 0
  },

  // 🆕 Métodos del Admin
  getAdminDashboardStats: () => {
    const adminState = storeManager.getAdminState()
    return adminState.dashboardStats || null
  },

  getAdminAnalytics: () => {
    const adminState = storeManager.getAdminState()
    return adminState.analytics || null
  },

  getPendingProductsCount: () => {
    const adminState = storeManager.getAdminState()
    return adminState.pendingProducts?.length || 0
  },

  getPendingReviewsCount: () => {
    const adminState = storeManager.getAdminState()
    return adminState.pendingReviews?.length || 0
  },

  getFlaggedContentCount: () => {
    const adminState = storeManager.getAdminState()
    const flagged = adminState.flaggedContent
    return (flagged?.reviews?.length || 0) + (flagged?.users?.length || 0)
  },

  getTotalUsersCount: () => {
    const adminState = storeManager.getAdminState()
    return adminState.dashboardStats?.totalUsers || 0
  },

  getTotalProductsCount: () => {
    const adminState = storeManager.getAdminState()
    return adminState.dashboardStats?.totalProducts || 0
  },

  getPlatformRevenue: () => {
    const adminState = storeManager.getAdminState()
    return adminState.dashboardStats?.totalRevenue || 0
  },

  getSystemHealth: () => {
    const adminState = storeManager.getAdminState()
    return adminState.dashboardStats?.platformHealth || {
      serverStatus: 'healthy',
      dbStatus: 'healthy',
      paymentStatus: 'healthy',
      emailStatus: 'healthy'
    }
  },

  isMaintenanceMode: () => {
    const adminState = storeManager.getAdminState()
    return adminState.systemConfig?.maintenanceMode || false
  },

  // Verificación de roles y permisos
  canAccessSellerFeatures: () => {
    const authState = storeManager.getAuthState()
    const user = authState.user
    if (!user) return false
    return user.role === 'SELLER' || user.role === 'ADMIN' || user.isBoth
  },

  // 🆕 Verificar acceso admin
  canAccessAdminFeatures: () => {
    const authState = storeManager.getAuthState()
    const user = authState.user
    if (!user) return false
    return user.role === 'ADMIN'
  },

  // Verificar si el usuario es seller verificado
  isVerifiedSeller: () => {
    const sellerState = storeManager.getSellerState()
    return sellerState.sellerProfile?.isVerified || false
  },

  // 🆕 Verificar si el usuario es admin
  isAdmin: () => {
    const authState = storeManager.getAuthState()
    const user = authState.user
    return user?.role === 'ADMIN' || false
  },

  // 🆕 Obtener estadísticas de moderación pendiente
  getModerationPendingCount: () => {
    const adminState = storeManager.getAdminState()
    const pendingProducts = adminState.pendingProducts?.length || 0
    const pendingReviews = adminState.pendingReviews?.length || 0
    const flaggedContent = storeManager.getFlaggedContentCount()
    return pendingProducts + pendingReviews + flaggedContent
  },

  // 🆕 Obtener estado de la plataforma
  getPlatformStatus: () => {
    const adminState = storeManager.getAdminState()
    const health = storeManager.getSystemHealth()
    const maintenanceMode = storeManager.isMaintenanceMode()
    
    if (maintenanceMode) return 'maintenance'
    
    const hasErrors = Object.values(health).some(status => status === 'error')
    const hasWarnings = Object.values(health).some(status => status === 'warning')
    
    if (hasErrors) return 'error'
    if (hasWarnings) return 'warning'
    return 'healthy'
  }
}

// Helper para uso en hooks
export function useStoreManager() {
  return storeManager
}

// 🆕 Helper específico para admin
export function useAdminManager() {
  return {
    getAdminState: storeManager.getAdminState,
    getDashboardStats: storeManager.getAdminDashboardStats,
    getAnalytics: storeManager.getAdminAnalytics,
    getPendingProductsCount: storeManager.getPendingProductsCount,
    getPendingReviewsCount: storeManager.getPendingReviewsCount,
    getFlaggedContentCount: storeManager.getFlaggedContentCount,
    getModerationPendingCount: storeManager.getModerationPendingCount,
    getPlatformStatus: storeManager.getPlatformStatus,
    getSystemHealth: storeManager.getSystemHealth,
    isMaintenanceMode: storeManager.isMaintenanceMode,
    canAccessAdminFeatures: storeManager.canAccessAdminFeatures,
    isAdmin: storeManager.isAdmin
  }
}