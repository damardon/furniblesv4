// Export centralizado para evitar dependencias circulares
export { useAuthStore } from './auth-store'
export { useCartStore } from './cart-store' 
export { useNotificationStore } from './notification-store'
export { useSellerStore } from './seller-store'
export { useAdminStore } from './admin-store'

// Store manager
export { storeManager, registerStore } from './store-manager'

// ✅ REGISTRO DE STORES EN STORE-MANAGER
if (typeof window !== 'undefined') {
  // Registrar stores después de que se inicialicen
  setTimeout(() => {
    const { useAuthStore } = require('./auth-store')
    const { useCartStore } = require('./cart-store')
    const { useNotificationStore } = require('./notification-store')
    const { useSellerStore } = require('./seller-store')
    const { useAdminStore } = require('./admin-store')
    const { registerStore } = require('./store-manager')

    // Registrar cada store
    registerStore('auth', useAuthStore)
    registerStore('cart', useCartStore)
    registerStore('notification', useNotificationStore)
    registerStore('seller', useSellerStore)
    registerStore('admin', useAdminStore)

    console.log('✅ All stores registered in store-manager')
  }, 100)
}

// Helper para acceder a stores desde otros stores
export const getStores = () => {
  if (typeof window === 'undefined') {
    return {
      authStore: null,
      cartStore: null, 
      notificationStore: null,
      sellerStore: null,
      adminStore: null
    }
  }

  // Importación dinámica solo en el cliente
  return {
    get authStore() {
      return require('./auth-store').useAuthStore.getState()
    },
    get cartStore() {
      return require('./cart-store').useCartStore.getState()
    },
    get notificationStore() {
      return require('./notification-store').useNotificationStore.getState()
    },
    get sellerStore() {
      return require('./seller-store').useSellerStore.getState()
    },
    get adminStore() {
      return require('./admin-store').useAdminStore.getState()
    }
  }
}