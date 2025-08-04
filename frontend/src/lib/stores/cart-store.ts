import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem, Product } from '@/types/additional'
import { ApiResponse } from '@/types/additional'
import { storeManager, registerStore } from './store-manager'

// CART STATE INTERFACE
interface CartState {
  // Items del carrito
  items: CartItem[]
  
  // Estado de carga
  isLoading: boolean
  isSyncing: boolean
  
  // Totales calculados
  subtotal: number
  platformFee: number
  total: number
  itemCount: number
  
  // Estado de UI
  isCartOpen: boolean
  isCheckoutLoading: boolean
  
  // Datos de checkout
  checkoutSession: string | null
  
  // Timestamp de última sincronización
  lastSyncedAt: number | null
}

// CART ACTIONS INTERFACE
interface CartActions {
  // Gestión de items
  addItem: (product: Product, quantity?: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  
  // Sincronización con servidor
  syncWithServer: () => Promise<void>
  loadCartFromServer: () => Promise<void>
  
  // Cálculos
  calculateTotals: () => void
  getItemQuantity: (productId: string) => number
  hasItem: (productId: string) => boolean
  
  // Checkout
  createCheckoutSession: () => Promise<ApiResponse<{ url: string; sessionId: string }>>
  
  // Estado de UI
  setCartOpen: (open: boolean) => void
  setCheckoutLoading: (loading: boolean) => void
  
  // Utilidades
  getCartSummary: () => {
    itemCount: number
    subtotal: number
    total: number
    items: CartItem[]
  }
  validateCart: () => Promise<{ valid: boolean; issues: string[] }>
}

// CONFIGURACIÓN DE FEES
const PLATFORM_FEE_RATE = 0.10 // 10% fee de plataforma

// INITIAL STATE
const initialState: CartState = {
  items: [],
  isLoading: false,
  isSyncing: false,
  subtotal: 0,
  platformFee: 0,
  total: 0,
  itemCount: 0,
  isCartOpen: false,
  isCheckoutLoading: false,
  checkoutSession: null,
  lastSyncedAt: null,
}

// HELPER FUNCTIONS
const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + (item.priceSnapshot * item.quantity), 0)
}

const calculatePlatformFee = (subtotal: number): number => {
  return subtotal * PLATFORM_FEE_RATE
}

const calculateTotal = (subtotal: number, platformFee: number): number => {
  return subtotal + platformFee
}

// CART STORE
export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      // ESTADO INICIAL
      ...initialState,

      // GESTIÓN DE ITEMS
      addItem: async (product: Product, quantity = 1) => {
        const { items } = get()
        
        // Verificar si el item ya existe
        const existingItem = items.find(item => item.productId === product.id)
        
        if (existingItem) {
          // Actualizar cantidad del item existente
          await get().updateQuantity(product.id, existingItem.quantity + quantity)
          return
        }

        // Crear nuevo item
        const newItem: CartItem = {
          id: `temp_${Date.now()}`, // ID temporal hasta sincronizar con servidor
          userId: '', // Se asignará en el servidor
          productId: product.id,
          priceSnapshot: product.price,
          quantity,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          product,
        }

        const newItems = [...items, newItem]
        
        set({ 
          items: newItems,
          isLoading: true 
        })
        
        get().calculateTotals()
        const isAuthenticated = storeManager.isAuthenticated()
        // Sincronizar con servidor si está autenticado
        if (isAuthenticated) {
          await get().syncWithServer()
        } else {
          set({ isLoading: false })
        }
      },

      removeItem: async (productId: string) => {
        const { items } = get()
        const newItems = items.filter(item => item.productId !== productId)
        
        set({ 
          items: newItems,
          isLoading: true 
        })
        
        get().calculateTotals()

        // Sincronizar con servidor
        await get().syncWithServer()
        set({ isLoading: false })
      },

      updateQuantity: async (productId: string, quantity: number) => {
        const { items } = get()
        
        if (quantity <= 0) {
          await get().removeItem(productId)
          return
        }

        const newItems = items.map(item => 
          item.productId === productId 
            ? { 
                ...item, 
                quantity, 
                updatedAt: new Date().toISOString() 
              }
            : item
        )
        
        set({ 
          items: newItems,
          isLoading: true 
        })
        
        get().calculateTotals()

        // Sincronizar con servidor
        await get().syncWithServer()
        set({ isLoading: false })
      },

      clearCart: async () => {
        set({ 
          items: [],
          isLoading: true 
        })
        
        get().calculateTotals()

        // Sincronizar con servidor
        await get().syncWithServer()
        set({ isLoading: false })
      },


        // SINCRONIZACIÓN CON SERVIDOR
      syncWithServer: async () => {
        // Solo sincronizar si hay token de autenticación
        const authToken = storeManager.getToken()
        
        if (!authToken) {
          set({ isSyncing: false })
          return
        }

        set({ isSyncing: true })

        try {
          const { items, lastSyncedAt } = get()
          
          // ✅ CORREGIR: Formatear datos según SyncCartDto que espera el backend
          const syncData = {
            items: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              localPrice: item.priceSnapshot // ← Precio local para comparación
            })),
            // ✅ FIX: Manejo correcto de lastSyncedAt que puede ser null
            lastSync: lastSyncedAt ? new Date(lastSyncedAt).toISOString() : undefined,
            metadata: {
              sessionId: `cart-${Date.now()}`,
              source: 'web-app'
            }
          }
          
          // Enviar datos al servidor en formato correcto
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'Accept-Language': 'es', // ← Agregar header de idioma
            },
            body: JSON.stringify(syncData), // ← Usar syncData en lugar de { items }
          })

          if (response.ok) {
            const result: ApiResponse<CartItem[]> = await response.json()
            if (result.success && result.data) {
              set({ 
                items: result.data,
                lastSyncedAt: Date.now(),
                isSyncing: false 
              })
              get().calculateTotals()
            }
          } else {
            // ✅ MEJORAR: Mejor manejo de errores
            const errorText = await response.text()
            console.error('Cart sync failed:', response.status, errorText)
            
            // Si es 403, puede ser que el usuario no esté autenticado correctamente
            if (response.status === 403) {
              console.warn('🚨 Cart sync: Usuario no autorizado o token inválido')
              // Optionally, could redirect to login or refresh token here
            }
          }
        } catch (error) {
          console.error('Cart sync error:', error)
        } finally {
          set({ isSyncing: false })
        }
      },

      loadCartFromServer: async () => {
        const authToken = storeManager.getToken()
        
        if (!authToken) return

        set({ isLoading: true })

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          })

          if (response.ok) {
            const result: ApiResponse<CartItem[]> = await response.json()
            if (result.success && result.data) {
              set({ 
                items: result.data,
                lastSyncedAt: Date.now() 
              })
              get().calculateTotals()
            }
          }
        } catch (error) {
          console.error('Load cart error:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      // CÁLCULOS
      calculateTotals: () => {
        const { items } = get()
        const subtotal = calculateSubtotal(items)
        const platformFee = calculatePlatformFee(subtotal)
        const total = calculateTotal(subtotal, platformFee)
        const itemCount = items.reduce((count, item) => count + item.quantity, 0)

        set({
          subtotal,
          platformFee,
          total,
          itemCount,
        })
      },

      getItemQuantity: (productId: string) => {
        const { items } = get()
        const item = items.find(item => item.productId === productId)
        return item?.quantity || 0
      },

      hasItem: (productId: string) => {
        const { items } = get()
        return items.some(item => item.productId === productId)
      },

      // CHECKOUT
      createCheckoutSession: async () => {
        const { items, total } = get()
        const authToken = storeManager.getToken()

        if (items.length === 0) {
          return { success: false, error: 'El carrito está vacío' }
        }

        set({ isCheckoutLoading: true })

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout/create-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            },
            body: JSON.stringify({
              items: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.priceSnapshot,
              })),
              totalAmount: total,
            }),
          })

          const result: ApiResponse<{ url: string; sessionId: string }> = await response.json()

          if (result.success && result.data) {
            set({ 
              checkoutSession: result.data.sessionId,
              isCheckoutLoading: false 
            })
            return result
          } else {
            set({ isCheckoutLoading: false })
            return { success: false, error: result.error || 'Error al crear sesión de checkout' }
          }
        } catch (error) {
          console.error('Checkout session error:', error)
          set({ isCheckoutLoading: false })
          return { success: false, error: 'Error de conexión' }
        }
      },

      // ESTADO DE UI
      setCartOpen: (open: boolean) => {
        set({ isCartOpen: open })
      },

      setCheckoutLoading: (loading: boolean) => {
        set({ isCheckoutLoading: loading })
      },

      // UTILIDADES
      getCartSummary: () => {
        const { items, itemCount, subtotal, total } = get()
        return { items, itemCount, subtotal, total }
      },

      validateCart: async () => {
        const { items } = get()
        const issues: string[] = []

        // Verificar que todos los productos aún existan y estén disponibles
        for (const item of items) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${item.productId}`)
            
            if (!response.ok) {
              issues.push(`El producto "${item.product.title}" ya no está disponible`)
              continue
            }

            const result: ApiResponse<Product> = await response.json()
            
            if (!result.success || !result.data) {
              issues.push(`El producto "${item.product.title}" ya no está disponible`)
              continue
            }

            const product = result.data
            
            // Verificar si el precio ha cambiado
            if (product.price !== item.priceSnapshot) {
              issues.push(`El precio de "${item.product.title}" ha cambiado`)
            }

            // Verificar si el producto está aprobado
            if (product.status !== 'APPROVED') {
              issues.push(`El producto "${item.product.title}" ya no está disponible`)
            }
          } catch (error) {
            issues.push(`Error al verificar "${item.product.title}"`)
          }
        }

        return {
          valid: issues.length === 0,
          issues,
        }
      },
    }),
    {
      name: 'furnibles-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        lastSyncedAt: state.lastSyncedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalcular totales al hidratar
          state.calculateTotals()
          
          // Sincronizar con servidor si es necesario
          const timeSinceLastSync = state.lastSyncedAt ? Date.now() - state.lastSyncedAt : Infinity
          if (timeSinceLastSync > 5 * 60 * 1000) { // 5 minutos
            state.syncWithServer()
          }
        }
      },
    }
  )
)

