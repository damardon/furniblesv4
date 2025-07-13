'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  ArrowLeftIcon, 
  ShoppingCartIcon, 
  LockIcon,
  CheckCircleIcon,
  AlertTriangleIcon
} from 'lucide-react'
import { useCartStore } from '@/lib/stores/cart-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { OrderSummary } from '@/components/checkout/order-summary'
import { PaymentSection } from '@/components/checkout/payment-section'

interface BillingData {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  city: string
  address: string
  zipCode: string
}

export default function CheckoutPage() {
  const t = useTranslations('checkout')
  const router = useRouter()
  
  // Stores
  const { items, subtotal, platformFee, total, clearCart } = useCartStore()
  const { isAuthenticated, user, setLoginModalOpen } = useAuthStore()

  // States
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [billingData, setBillingData] = useState<BillingData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.buyerProfile?.phone || '',
    country: 'Chile',
    city: '',
    address: '',
    zipCode: ''
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoginModalOpen(true)
      router.push('/productos')
      return
    }
  }, [isAuthenticated, setLoginModalOpen, router])

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/productos')
      return
    }
  }, [items, router])

  // Update billing data when user changes
  useEffect(() => {
    if (user) {
      setBillingData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.buyerProfile?.phone || ''
      }))
    }
  }, [user])

  // Los totales ya vienen calculados del store
  // subtotal, platformFee, total están disponibles directamente

  // Handle billing data changes
  const handleBillingDataChange = (field: keyof BillingData, value: string) => {
    setBillingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validate form
  const isFormValid = () => {
    return Object.values(billingData).every(value => value.trim() !== '')
  }

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!isFormValid() || isProcessing) {
      return
    }

    setIsProcessing(true)

    try {
      // TODO: Integrate with real Stripe payment
      // For now, simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Generate mock order number
      const mockOrderNumber = 'FUR-' + Date.now().toString().slice(-8)
      setOrderNumber(mockOrderNumber)

      // Clear cart
      clearCart()

      // Show success modal
      setShowSuccessModal(true)

      // TODO: Redirect to order confirmation page
      // setTimeout(() => {
      //   router.push(`/pedidos/${mockOrderNumber}`)
      // }, 3000)

    } catch (error) {
      console.error('Payment error:', error)
      // TODO: Show error toast
    } finally {
      setIsProcessing(false)
    }
  }

  // Don't render if not authenticated or cart is empty
  if (!isAuthenticated || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-black font-black text-xl uppercase mb-4">
            {!isAuthenticated ? 'Debes iniciar sesión' : 'Carrito vacío'}
          </p>
          <Link 
            href="/productos"
            className="inline-flex items-center gap-2 bg-yellow-400 border-4 border-black px-6 py-3 font-black text-black uppercase hover:bg-orange-500 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Ir a Productos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-yellow-400 border-b-4 border-black p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-black font-black text-sm uppercase">
              <Link href="/" className="hover:text-orange-500 transition-colors">
                Inicio
              </Link>
              <span>/</span>
              <Link href="/productos" className="hover:text-orange-500 transition-colors">
                Productos
              </Link>
              <span>/</span>
              <span className="text-orange-500">Checkout</span>
            </div>
            
            {/* Security Badge */}
            <div className="flex items-center gap-2">
              <LockIcon className="w-4 h-4 text-black" />
              <span className="text-black font-black text-sm uppercase">Pago Seguro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/productos"
              className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver
            </Link>
            
            <div>
              <h1 className="text-4xl font-black text-black uppercase flex items-center gap-3">
                <ShoppingCartIcon className="w-8 h-8" />
                Finalizar Compra
              </h1>
              <p className="text-gray-600 font-bold mt-2">
                {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div 
            className="bg-gray-200 border-3 border-black p-4"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <div className="flex items-center justify-between text-sm font-black uppercase">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 border-2 border-black rounded-full flex items-center justify-center text-white text-xs">
                  ✓
                </div>
                <span className="text-black">Carrito</span>
              </div>
              
              <div className="flex-1 h-1 bg-gray-300 mx-4"></div>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center text-black text-xs font-black">
                  2
                </div>
                <span className="text-black">Checkout</span>
              </div>
              
              <div className="flex-1 h-1 bg-gray-300 mx-4"></div>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 border-2 border-black rounded-full flex items-center justify-center text-black text-xs font-black">
                  3
                </div>
                <span className="text-gray-500">Confirmación</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Billing Information */}
            <CheckoutForm
              billingData={billingData}
              onDataChange={handleBillingDataChange}
              isProcessing={isProcessing}
            />

            {/* Payment Section */}
            <PaymentSection
              total={total}
              platformFee={platformFee}
              subtotal={subtotal}
              isProcessing={isProcessing}
              onPaymentSubmit={handlePaymentSubmit}
              disabled={!isFormValid()}
            />
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div 
              className="bg-white border-[5px] border-black p-6 sticky top-8"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <OrderSummary
                items={items}
                subtotal={subtotal}
                platformFee={platformFee}
                total={total}
              />

              {/* Form Validation Warning */}
              {!isFormValid() && (
                <div 
                  className="bg-orange-100 border-3 border-orange-500 p-4 mt-6 flex items-start gap-3"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <AlertTriangleIcon className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-orange-800 font-bold text-sm mb-1">
                      Formulario incompleto
                    </p>
                    <p className="text-orange-700 text-xs font-medium">
                      Por favor completa todos los campos requeridos para continuar
                    </p>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div 
                className="bg-blue-100 border-3 border-blue-500 p-4 mt-6"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <LockIcon className="w-4 h-4 text-blue-600" />
                  <p className="text-blue-800 font-black text-sm uppercase">
                    Compra Segura
                  </p>
                </div>
                <p className="text-blue-700 text-xs font-medium">
                  Tu información está protegida con encriptación SSL de 256 bits
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white border-6 border-black p-8 max-w-md w-full"
            style={{ boxShadow: '8px 8px 0 #000000' }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-black text-black uppercase mb-4">
                ¡Compra Exitosa!
              </h2>
              
              <p className="text-black font-bold mb-2">
                Tu pedido #{orderNumber} ha sido procesado
              </p>
              
              <p className="text-gray-600 text-sm font-medium mb-6">
                Recibirás un email con los enlaces de descarga en unos minutos
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/productos')}
                  className="w-full bg-yellow-400 border-4 border-black font-black text-black uppercase py-3 hover:bg-orange-500 transition-all"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  Seguir Comprando
                </button>
                
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-white border-4 border-black font-black text-black uppercase py-3 hover:bg-gray-100 transition-all"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}