// frontend/src/app/checkout/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/contexts/auth-context'
import { usePayment } from '@/contexts/payment-context'
import { Button } from '@/components/ui/button'
import { Elements } from '@stripe/react-stripe-js'
import { StripePaymentForm } from '@/components/checkout/stripe-payment-form'
import { PayPalPaymentForm } from '@/components/checkout/paypal-payment-form'

export default function CheckoutPage() {
  const router = useRouter()
  const { state: cartState } = useCart()
  const { state: authState } = useAuth()
  const { state: paymentState, setPaymentMethod, initializeStripe, initializePayPal } = usePayment()
  
  const [customerInfo, setCustomerInfo] = useState({
    email: authState.user?.email || '',
    name: `${authState.user?.firstName || ''} ${authState.user?.lastName || ''}`.trim(),
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  })

  // Redireccionar si no hay items en el carrito
  useEffect(() => {
    if (cartState.items.length === 0) {
      router.push('/carrito')
      return
    }
  }, [cartState.items, router])

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      router.push('/auth/login?redirect=/checkout')
      return
    }
  }, [authState.isAuthenticated, authState.isLoading, router])

  // Inicializar métodos de pago
  useEffect(() => {
    initializeStripe()
    initializePayPal()
  }, [])

  const handleCustomerInfoChange = (field: string, value: string) => {
    if (field.includes('address.')) {
      const addressField = field.split('.')[1]
      setCustomerInfo(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setCustomerInfo(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl font-bold">Cargando checkout...</p>
        </div>
      </div>
    )
  }

  if (cartState.items.length === 0) {
    return null // Se redireccionará
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase mb-4">Checkout</h1>
          <p className="text-lg">Completa tu compra de manera segura</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información del cliente */}
          <div className="space-y-6">
            <div 
              className="bg-white border-4 border-black p-6"
              style={{ boxShadow: '6px 6px 0 #000000' }}
            >
              <h2 className="font-black text-xl uppercase mb-4">Información de Facturación</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={customerInfo.address.line1}
                    onChange={(e) => handleCustomerInfoChange('address.line1', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
                    placeholder="Calle y número"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.city}
                      onChange={(e) => handleCustomerInfoChange('address.city', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.postal_code}
                      onChange={(e) => handleCustomerInfoChange('address.postal_code', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selección de método de pago */}
            <div 
              className="bg-white border-4 border-black p-6"
              style={{ boxShadow: '6px 6px 0 #000000' }}
            >
              <h2 className="font-black text-xl uppercase mb-4">Método de Pago</h2>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="stripe"
                    name="payment-method"
                    checked={paymentState.selectedMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                    className="mr-3"
                  />
                  <label htmlFor="stripe" className="flex items-center gap-2 font-bold">
                    <span>💳</span>
                    <span>Tarjeta de Crédito/Débito</span>
                    <span className="text-xs text-gray-500">(Visa, Mastercard, American Express)</span>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="paypal"
                    name="payment-method"
                    checked={paymentState.selectedMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')}
                    className="mr-3"
                  />
                  <label htmlFor="paypal" className="flex items-center gap-2 font-bold">
                    <span>💙</span>
                    <span>PayPal</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Formulario de pago */}
            <div 
              className="bg-white border-4 border-black p-6"
              style={{ boxShadow: '6px 6px 0 #000000' }}
            >
              <h2 className="font-black text-xl uppercase mb-4">Detalles de Pago</h2>
              
              {paymentState.selectedMethod === 'stripe' && paymentState.stripe && (
                <Elements stripe={paymentState.stripe}>
                  <StripePaymentForm 
                    amount={cartState.summary.totalAmount}
                    currency="USD"
                    cartItems={cartState.items}
                    customerInfo={customerInfo}
                  />
                </Elements>
              )}

              {paymentState.selectedMethod === 'paypal' && paymentState.paypalLoaded && (
                <PayPalPaymentForm
                  amount={cartState.summary.totalAmount}
                  currency="USD"
                  cartItems={cartState.items}
                  customerInfo={customerInfo}
                />
              )}
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div 
              className="bg-white border-4 border-black p-6 sticky top-8"
              style={{ boxShadow: '6px 6px 0 #000000' }}
            >
              <h2 className="font-black text-xl uppercase mb-4">Resumen del Pedido</h2>
              
              <div className="space-y-3 mb-6">
                {cartState.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div>
                      <h4 className="font-bold text-sm">{item.productTitle}</h4>
                      <p className="text-xs text-gray-600">Por: {item.seller.storeName}</p>
                    </div>
                    <span className="font-bold">${item.currentPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">${cartState.summary.subtotal.toFixed(2)}</span>
                </div>
                
                {cartState.summary.feeBreakdown.map((fee, index) => (
                  <div key={index} className="flex justify-between text-sm text-gray-600">
                    <span>{fee.description}:</span>
                    <span>${fee.amount.toFixed(2)}</span>
                  </div>
                ))}
                
                <hr className="border-black border-2" />
                
                <div className="flex justify-between text-xl font-black">
                  <span>Total:</span>
                  <span className="text-orange-500">${cartState.summary.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>🔒 Pago 100% seguro y cifrado</p>
                <p>Todos los métodos de pago están protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}