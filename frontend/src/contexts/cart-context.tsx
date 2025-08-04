// frontend/src/contexts/cart-context.tsx
'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// ✅ Tipos basados en tu backend
interface CartItem {
  id: string
  productId: string
  productTitle: string
  productSlug: string
  priceSnapshot: number
  currentPrice: number
  quantity: number
  addedAt: Date
  seller: {
    id: string
    name: string
    storeName: string
  }
  product: {
    id: string
    title: string
    slug: string
    price: number
    category: string
    status: string
    imageUrl?: string
  }
}

interface CartSummary {
  subtotal: number
  platformFeeRate: number
  platformFee: number
  totalAmount: number
  itemCount: number
  feeBreakdown: {
    type: string
    description: string
    amount: number
    rate?: number
  }[]
}

interface CartState {
  items: CartItem[]
  summary: CartSummary
  isLoading: boolean
  error: string | null
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: { items: CartItem[]; summary: CartSummary } }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }

const initialState: CartState = {
  items: [],
  summary: {
    subtotal: 0,
    platformFeeRate: 0,
    platformFee: 0,
    totalAmount: 0,
    itemCount: 0,
    feeBreakdown: []
  },
  isLoading: false,
  error: null
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items,
        summary: action.payload.summary,
        isLoading: false,
        error: null
      }
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        summary: {
          ...state.summary,
          itemCount: state.items.length + 1
        }
      }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        summary: {
          ...state.summary,
          itemCount: state.items.length - 1
        }
      }
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        summary: initialState.summary
      }
    default:
      return state
  }
}

interface CartContextType {
  state: CartState
  addToCart: (productId: string) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  loadCart: () => Promise<void>
  getItemCount: () => number
  getTotalAmount: () => number
  // ✅ NUEVAS funciones para manejo de pagos
  handlePaymentSuccess: (paymentId: string, paymentMethod?: string) => Promise<void>
  handlePaymentError: (errorCode: string, errorMessage: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  // ✅ NUEVO: Hook de router para redirecciones
  const router = useRouter()

  // ✅ Función para obtener token de auth (implementar según tu sistema de auth)
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    }
    return null
  }

  const getAuthHeaders = () => {
    const token = getAuthToken()
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'es',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  // ✅ Cargar carrito desde API
  const loadCart = async () => {
    const token = getAuthToken()
    if (!token) {
      console.log('No auth token, skipping cart load')
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({
          type: 'SET_CART',
          payload: {
            items: data.items || [],
            summary: data.summary || initialState.summary
          }
        })
        console.log('✅ Cart loaded:', data.items.length, 'items')
      } else {
        console.error('Failed to load cart:', response.status)
        dispatch({ type: 'SET_ERROR', payload: 'Error cargando carrito' })
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' })
    }
  }

  // ✅ Agregar producto al carrito
  const addToCart = async (productId: string) => {
    const token = getAuthToken()
    if (!token) {
      dispatch({ type: 'SET_ERROR', payload: 'Debes iniciar sesión para agregar productos' })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId })
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({
          type: 'SET_CART',
          payload: {
            items: data.items || [],
            summary: data.summary || initialState.summary
          }
        })
        console.log('✅ Product added to cart')
      } else {
        const errorData = await response.json()
        dispatch({ type: 'SET_ERROR', payload: errorData.message || 'Error agregando producto' })
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' })
    }
  }

  // ✅ Remover producto del carrito
  const removeFromCart = async (itemId: string) => {
    const token = getAuthToken()
    if (!token) return

    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({
          type: 'SET_CART',
          payload: {
            items: data.items || [],
            summary: data.summary || initialState.summary
          }
        })
        console.log('✅ Product removed from cart')
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Error removiendo producto' })
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' })
    }
  }

  // ✅ Limpiar carrito completo
  const clearCart = async () => {
    const token = getAuthToken()
    if (!token) {
      // Si no hay token, solo limpiar el estado local
      dispatch({ type: 'CLEAR_CART' })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/clear`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        dispatch({ type: 'CLEAR_CART' })
        console.log('✅ Cart cleared')
      } else {
        // Aún así limpiar localmente si hay error del servidor
        dispatch({ type: 'CLEAR_CART' })
        console.warn('Server cart clear failed, but cleared locally')
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
      // Limpiar localmente aunque falle el servidor
      dispatch({ type: 'CLEAR_CART' })
    }
  }

  // ✅ NUEVA función: Manejar pago exitoso
  const handlePaymentSuccess = async (paymentId: string, paymentMethod: string = 'unknown') => {
    try {
      console.log('🎉 [CART] Payment successful, clearing cart and redirecting...')
      
      // Limpiar carrito
      await clearCart()
      
      // Redirigir a página de éxito con información del pago
      const searchParams = new URLSearchParams({
        payment_id: paymentId,
        method: paymentMethod
      })
      
      router.push(`/checkout/success?${searchParams.toString()}`)
      
    } catch (error) {
      console.error('❌ [CART] Error handling payment success:', error)
      
      // Aún así redirigir a página de éxito
      router.push(`/checkout/success?payment_id=${paymentId}`)
    }
  }

  // ✅ NUEVA función: Manejar error de pago
  const handlePaymentError = (errorCode: string, errorMessage: string) => {
    console.error('❌ [CART] Payment error:', { errorCode, errorMessage })
    
    // Construir parámetros para la página de error
    const searchParams = new URLSearchParams({
      error_code: errorCode,
      error_message: errorMessage,
      timestamp: new Date().toISOString()
    })
    
    // Redirigir a página de error
    router.push(`/checkout/error?${searchParams.toString()}`)
  }

  const getItemCount = () => state.summary.itemCount || state.items.length
  const getTotalAmount = () => state.summary.totalAmount || 0

  // ✅ Cargar carrito al inicializar
  useEffect(() => {
    loadCart()
  }, [])

  const value: CartContextType = {
    state,
    addToCart,
    removeFromCart,
    clearCart,
    loadCart,
    getItemCount,
    getTotalAmount,
    // ✅ NUEVAS funciones exportadas
    handlePaymentSuccess,
    handlePaymentError
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}