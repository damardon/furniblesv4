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
  setTimeout(async () => {
    const authStoreModule = await import('./auth-store')
    const cartStoreModule = await import('./cart-store')
    const notificationStoreModule = await import('./notification-store')
    const sellerStoreModule = await import('./seller-store')
    const adminStoreModule = await import('./admin-store')
    const storeManagerModule = await import('./store-manager')

    // Registrar cada store
    storeManagerModule.registerStore('auth', authStoreModule.useAuthStore)
    storeManagerModule.registerStore('cart', cartStoreModule.useCartStore)
    storeManagerModule.registerStore('notification', notificationStoreModule.useNotificationStore)
    storeManagerModule.registerStore('seller', sellerStoreModule.useSellerStore)
    storeManagerModule.registerStore('admin', adminStoreModule.useAdminStore)

  }, 100)
}