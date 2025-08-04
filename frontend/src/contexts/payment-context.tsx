// frontend/src/contexts/payment-context.tsx
'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'

// ✅ Tipos para los métodos de pago
type PaymentMethod = 'stripe' | 'paypal'

interface PaymentState {
  selectedMethod: PaymentMethod
  isProcessing: boolean
  error: string | null
  stripe: Stripe | null
  paypalLoaded: boolean
}

type PaymentAction =
  | { type: 'SET_METHOD'; payload: PaymentMethod }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STRIPE'; payload: Stripe | null }
  | { type: 'SET_PAYPAL_LOADED'; payload: boolean }

const initialState: PaymentState = {
  selectedMethod: 'stripe',
  isProcessing: false,
  error: null,
  stripe: null,
  paypalLoaded: false
}

function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case 'SET_METHOD':
      return { ...state, selectedMethod: action.payload, error: null }
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isProcessing: false }
    case 'SET_STRIPE':
      return { ...state, stripe: action.payload }
    case 'SET_PAYPAL_LOADED':
      return { ...state, paypalLoaded: action.payload }
    default:
      return state
  }
}

interface PaymentContextType {
  state: PaymentState
  setPaymentMethod: (method: PaymentMethod) => void
  initializeStripe: () => Promise<void>
  initializePayPal: () => Promise<void>
}

// ✅ SIMPLIFICADO: Eliminamos las funciones de procesamiento del contexto
// Las manejaremos directamente en los componentes de formulario

const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(paymentReducer, initialState)

  // ✅ Inicializar Stripe
  const initializeStripe = async () => {
    try {
      const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      if (!stripePublicKey) {
        throw new Error('Stripe public key not configured')
      }

      const stripe = await loadStripe(stripePublicKey)
      dispatch({ type: 'SET_STRIPE', payload: stripe })
      console.log('✅ [PAYMENT] Stripe initialized')
    } catch (error) {
      console.error('❌ [PAYMENT] Stripe initialization error:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Error inicializando Stripe' })
    }
  }

  // ✅ Inicializar PayPal
  const initializePayPal = async () => {
    try {
      const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
      if (!paypalClientId) {
        throw new Error('PayPal client ID not configured')
      }

      // Cargar PayPal SDK dinámicamente
      if (!window.paypal) {
        const script = document.createElement('script')
        script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&components=buttons`
        script.async = true
        
        script.onload = () => {
          dispatch({ type: 'SET_PAYPAL_LOADED', payload: true })
          console.log('✅ [PAYMENT] PayPal initialized')
        }
        
        script.onerror = () => {
          dispatch({ type: 'SET_ERROR', payload: 'Error cargando PayPal' })
        }
        
        document.head.appendChild(script)
      } else {
        dispatch({ type: 'SET_PAYPAL_LOADED', payload: true })
      }
    } catch (error) {
      console.error('❌ [PAYMENT] PayPal initialization error:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Error inicializando PayPal' })
    }
  }

  // ✅ Cambiar método de pago
  const setPaymentMethod = (method: PaymentMethod) => {
    dispatch({ type: 'SET_METHOD', payload: method })
  }

  const value: PaymentContextType = {
    state,
    setPaymentMethod,
    initializeStripe,
    initializePayPal
  }

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  )
}

export function usePayment() {
  const context = useContext(PaymentContext)
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider')
  }
  return context
}

// ✅ Tipos para window.paypal
declare global {
  interface Window {
    paypal: any
  }
}