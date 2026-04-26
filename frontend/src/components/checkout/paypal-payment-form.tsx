'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'

interface PayPalPaymentFormProps {
  amount: number
  currency: string
  cartItems: any[]
  customerInfo: {
    email: string
    name: string
  }
}

export function PayPalPaymentForm({ amount, currency, cartItems, customerInfo }: PayPalPaymentFormProps) {
  const router = useRouter()
  const { clearCart } = useCart()
  const paypalRef = useRef<HTMLDivElement>(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (window.paypal && paypalRef.current) {
      // Limpiar cualquier botón PayPal existente
      paypalRef.current.innerHTML = ''

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal'
        },
        
        createOrder: async () => {
          try {
            setIsProcessing(true)
            setError(null)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/paypal/create-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify({
                amount,
                currency,
                cartItems,
                customerInfo
              })
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Error creando orden PayPal')
            }

            const { orderId } = await response.json()
            return orderId

          } catch (error: any) {
            console.error('❌ [PAYPAL] Create order error:', error)
            setError(error.message)
            throw error
          } finally {
            setIsProcessing(false)
          }
        },

        onApprove: async (data: any) => {
          try {
            setIsProcessing(true)
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/paypal/capture-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify({
                orderId: data.orderID
              })
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Error capturando pago PayPal')
            }

            const result = await response.json()
            
            if (result.status === 'COMPLETED') {
              
              // Limpiar carrito y redirigir
              await clearCart()
              router.push(`/checkout/success?payment_id=${result.paymentId}`)
            } else {
              throw new Error('El pago no se completó correctamente')
            }

          } catch (error: any) {
            console.error('❌ [PAYPAL] Approval error:', error)
            setError(error.message)
          } finally {
            setIsProcessing(false)
          }
        },

        onError: (err: any) => {
          console.error('❌ [PAYPAL] Payment error:', err)
          setError('Error procesando el pago con PayPal')
          setIsProcessing(false)
        },

        onCancel: () => {
          setIsProcessing(false)
        }

      }).render(paypalRef.current)
    }
  }, [amount, currency, cartItems, customerInfo])

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3">
          <p className="font-bold">❌ {error}</p>
        </div>
      )}

      {/* Loading indicator */}
      {isProcessing && (
        <div className="bg-blue-100 border-2 border-blue-500 text-blue-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            <span className="font-bold">Procesando pago con PayPal...</span>
          </div>
        </div>
      )}

      {/* Información de PayPal */}
      <div className="bg-blue-50 border-2 border-blue-300 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-600">💙</span>
          <span className="font-bold text-blue-800">PayPal</span>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Paga con tu cuenta PayPal o tarjeta</li>
          <li>• Protección del comprador incluida</li>
          <li>• No compartimos tus datos financieros</li>
          <li>• Cancelación fácil si hay problemas</li>
        </ul>
      </div>

      {/* Contenedor para botones PayPal */}
      <div className="space-y-4">
        <div 
          ref={paypalRef}
          className="min-h-[50px] flex items-center justify-center bg-gray-50 border-2 border-gray-300"
        />
        
        <div className="text-xs text-gray-500 text-center">
          <p>Al usar PayPal, aceptas los términos y condiciones de PayPal.</p>
          <p>Serás redirigido a PayPal para completar el pago de forma segura.</p>
        </div>
      </div>

      {/* Resumen del monto */}
      <div className="bg-white border-2 border-black p-4" style={{ boxShadow: '3px 3px 0 #000000' }}>
        <div className="flex justify-between items-center">
          <span className="font-bold">Total a pagar:</span>
          <span className="text-2xl font-black text-orange-500">
            ${amount.toFixed(2)} {currency}
          </span>
        </div>
      </div>
    </div>
  )
}