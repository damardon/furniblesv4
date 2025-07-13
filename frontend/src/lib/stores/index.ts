// Export centralizado para evitar dependencias circulares
export { useAuthStore } from './auth-store'
export { useCartStore } from './cart-store' 
export { useNotificationStore } from './notification-store'

// Helper para acceder a stores desde otros stores
export const getStores = () => {
  if (typeof window === 'undefined') {
    return {
      authStore: null,
      cartStore: null, 
      notificationStore: null
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
    }
  }
}