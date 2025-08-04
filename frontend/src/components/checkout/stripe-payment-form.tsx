// frontend/src/components/checkout/stripe-payment-form.tsx
'use client'

import { useState } from 'react'
import { 
  useStripe, 
  useElements, 
  CardElement
} from '@stripe/react-stripe-js'
import type { StripeCardElement } from '@stripe/stripe-js'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'
import { usePayment } from '@/contexts/payment-context'
import { Button } from '@/components/ui/button'

interface StripePaymentFormProps {
  amount: number
  currency: string
  cartItems: any[]
  customerInfo: {
    email: string
    name: string
    address?: any
  }
}

export function StripePaymentForm({ amount, currency, cartItems, customerInfo }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const { clearCart } = useCart()
  const { state: paymentState } = usePayment()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setError('Stripe no está disponible')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Elemento de tarjeta no encontrado')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Crear Payment Intent en el backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/stripe/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Stripe usa centavos
          currency: currency.toLowerCase(),
          cartItems,
          customerInfo
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error creando payment intent')
      }

      const { clientSecret } = await response.json()

      // ✅ CORREGIDO: Sin cast, el tipo se infiere automáticamente
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement, // ✅ Tipo correcto automáticamente
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            address: customerInfo.address ? {
              line1: customerInfo.address.line1,
              city: customerInfo.address.city,
              state: customerInfo.address.state,
              postal_code: customerInfo.address.postal_code,
              country: customerInfo.address.country,
            } : undefined
          }
        }
      })

      if (confirmError) {
        throw new Error(confirmError.message || 'Error en el pago')
      }

      if (paymentIntent?.status === 'succeeded') {
        console.log('✅ [STRIPE] Payment successful')
        
        // Limpiar carrito y redirigir
        await clearCart()
        router.push(`/checkout/success?payment_id=${paymentIntent.id}`)
      } else {
        throw new Error('El pago no se completó correctamente')
      }

    } catch (error: any) {
      console.error('❌ [STRIPE] Payment error:', error)
      setError(error.message || 'Error procesando el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Elemento de tarjeta de Stripe */}
      <div className="p-4 border-2 border-gray-300 rounded-none bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#000000',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '500',
                '::placeholder': {
                  color: '#666666',
                },
              },
              invalid: {
                color: '#e74c3c',
              },
            },
            hidePostalCode: false,
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3">
          <p className="font-bold">❌ {error}</p>
        </div>
      )}

      {/* Información de seguridad */}
      <div className="bg-blue-50 border-2 border-blue-300 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-600">🔒</span>
          <span className="font-bold text-blue-800">Pago Seguro</span>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Procesado por Stripe (certificado PCI DSS Level 1)</li>
          <li>• Soporte para Visa, Mastercard, American Express</li>
          <li>• Cifrado de 256 bits SSL/TLS</li>
          <li>• No almacenamos datos de tu tarjeta</li>
        </ul>
      </div>

      {/* Botón de pago */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!stripe || isProcessing || paymentState.isProcessing}
      >
        {isProcessing ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Procesando pago...
          </>
        ) : (
          <>
            <span className="mr-2">💳</span>
            Pagar ${amount.toFixed(2)} con Tarjeta
          </>
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        <p>Al hacer clic en "Pagar", aceptas nuestros términos y condiciones.</p>
        <p>El cargo aparecerá como "FURNIBLES" en tu estado de cuenta.</p>
      </div>
    </form>
  )
}