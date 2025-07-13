'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  ArrowLeftIcon, 
  ShoppingCartIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LockIcon
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
  const { items, total, clearCart } = useCartStore()
  const { isAuthenticated, user, setLoginModalOpen } = useAuthStore()

  // States
  const [billingData, setBillingData] = useState<BillingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Chile',
    city: '',
    address: '',
    zipCode: ''
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'billing' | 'payment' | 'processing'>('billing')

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.priceSnapshot * item.quantity), 0)
  const platformFeeRate = 0.10 // 10%
  const platformFee = subtotal * platformFeeRate
  const totalAmount = subtotal + platformFee

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/productos')
      return
    }
  }, [items.length, router])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoginModalOpen(true)
      router.push('/productos')
      return
    }
  }, [isAuthenticated, setLoginModalOpen, router])

  // Pre-fill user data if available
  useEffect(() => {
    if (user) {
      setBillingData(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
        phone: user.buyerProfile?.phone || prev.phone
      }))
    }
  }, [user])

  const handleBillingDataChange = (field: keyof BillingData, value: string) => {
    setBillingData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear payment error when user makes changes
    if (paymentError) {
      setPaymentError(null)
    }
  }

  const validateBillingData = (): boolean => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'country', 'city', 'address', 'zipCode']
    return required.every(field => billingData[field as keyof BillingData].trim().length > 0)
  }

  const handleContinueToPayment = () => {
    if (!validateBillingData()) {
      setPaymentError('Por favor completa todos los campos requeridos')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(billingData.email)) {
      setPaymentError('Por favor ingresa un email válido')
      return
    }
    
    setPaymentError(null)
    setCurrentStep('payment')
  }

  const handlePaymentSubmit = async () => {
    setIsProcessing(true)
    setPaymentError(null)
    setCurrentStep('processing')

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Here you would integrate with Stripe
      // const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      // const response = await createPaymentIntent(...)
      // const result = await stripe.confirmCardPayment(...)

      // For now, simulate success
      const orderNumber = `ORD-${Date.now()}`
      
      // Clear cart
      clearCart()
      
      // Redirect to success page
      router.push(`/checkout/success?order=${orderNumber}`)
      
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError('Error procesando el pago. Por favor intenta nuevamente.')
      setCurrentStep('payment')
    } finally {
      setIsProcessing(false)
    }
  }

  // Don't render if cart is empty or not authenticated
  if (items.length === 0 || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-black font-black text-xl uppercase">
            {items.length === 0 ? 'Carrito vacío' : 'Acceso restringido'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-yellow-400 border-b-4 border-black p-4">
        <div className="container mx-auto">
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-8">
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

        {/* Progress Indicator */}
        <div className="mb-8">
          <div 
            className="bg-white border-4 border-black p-6"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
                {/* Step 1: Billing */}
                <div className="flex items-center">
                  <div 
                    className={`w-10 h-10 border-3 border-black flex items-center justify-center font-black text-sm ${
                      currentStep === 'billing' 
                        ? 'bg-yellow-400 text-black' 
                        : currentStep === 'payment' || currentStep === 'processing'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-black'
                    }`}
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    {currentStep === 'payment' || currentStep === 'processing' ? '✓' : '1'}
                  </div>
                  <span className="ml-2 font-black text-black text-sm uppercase">
                    Datos de Facturación
                  </span>
                </div>

                <div className="w-8 h-1 bg-black"></div>

                {/* Step 2: Payment */}
                <div className="flex items-center">
                  <div 
                    className={`w-10 h-10 border-3 border-black flex items-center justify-center font-black text-sm ${
                      currentStep === 'payment' 
                        ? 'bg-yellow-400 text-black' 
                        : currentStep === 'processing'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-black'
                    }`}
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    {currentStep === 'processing' ? '✓' : '2'}
                  </div>
                  <span className="ml-2 font-black text-black text-sm uppercase">
                    Pago
                  </span>
                </div>

                <div className="w-8 h-1 bg-black"></div>

                {/* Step 3: Processing */}
                <div className="flex items-center">
                  <div 
                    className={`w-10 h-10 border-3 border-black flex items-center justify-center font-black text-sm ${
                      currentStep === 'processing' 
                        ? 'bg-yellow-400 text-black' 
                        : 'bg-white text-black'
                    }`}
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    3
                  </div>
                  <span className="ml-2 font-black text-black text-sm uppercase">
                    Procesando
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {paymentError && (
          <div 
            className="bg-red-100 border-4 border-red-500 p-4 mb-8 flex items-center gap-3"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <AlertCircleIcon className="w-6 h-6 text-red-600" />
            <p className="text-red-800 font-bold">
              {paymentError}
            </p>
          </div>
        )}

        {/* Processing State */}
        {currentStep === 'processing' && (
          <div 
            className="bg-blue-100 border-4 border-black p-8 text-center mb-8"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-black text-black uppercase mb-2">
              Procesando tu Pago
            </h2>
            <p className="text-gray-600 font-bold">
              Por favor no cierres esta ventana ni presiones el botón atrás
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <LockIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-600">
                Conexión segura
              </span>
            </div>
          </div>
        )}

        {/* Main Content */}
        {currentStep !== 'processing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Billing Form */}
              {currentStep === 'billing' && (
                <>
                  <CheckoutForm
                    billingData={billingData}
                    onDataChange={handleBillingDataChange}
                    isProcessing={isProcessing}
                  />
                  
                  {/* Continue Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleContinueToPayment}
                      disabled={isProcessing}
                      className="bg-green-500 border-4 border-black px-8 py-3 font-black text-black text-lg uppercase hover:bg-yellow-400 transition-all disabled:opacity-50"
                      style={{ boxShadow: '4px 4px 0 #000000' }}
                    >
                      Continuar al Pago →
                    </button>
                  </div>
                </>
              )}

              {/* Payment Form */}
              {currentStep === 'payment' && (
                <>
                  <PaymentSection
                    total={totalAmount}
                    platformFee={platformFee}
                    subtotal={subtotal}
                    isProcessing={isProcessing}
                    onPaymentSubmit={handlePaymentSubmit}
                  />
                  
                  {/* Back Button */}
                  <div className="flex justify-start">
                    <button
                      onClick={() => setCurrentStep('billing')}
                      disabled={isProcessing}
                      className="bg-gray-400 border-4 border-black px-6 py-3 font-black text-black uppercase hover:bg-yellow-400 transition-all disabled:opacity-50"
                      style={{ boxShadow: '4px 4px 0 #000000' }}
                    >
                      ← Volver a Datos
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div 
                className="bg-white border-[5px] border-black p-8 sticky top-8"
                style={{ boxShadow: '8px 8px 0 #000000' }}
              >
                <OrderSummary
                  items={items}
                  subtotal={subtotal}
                  platformFee={platformFee}
                  total={totalAmount}
                />
                
                {/* Security Badge */}
                <div 
                  className="bg-green-100 border-3 border-black p-4 mt-6 flex items-center gap-3"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <LockIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-black font-black text-sm uppercase">Pago Seguro</p>
                    <p className="text-gray-600 text-xs font-bold">SSL Encriptado</p>
                  </div>
                </div>

                {/* Billing Summary in Payment Step */}
                {currentStep === 'payment' && (
                  <div 
                    className="bg-blue-100 border-3 border-black p-4 mt-4"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <h4 className="font-black text-black text-sm uppercase mb-2">
                      Datos de Facturación:
                    </h4>
                    <div className="text-xs text-black font-medium space-y-1">
                      <p>{billingData.firstName} {billingData.lastName}</p>
                      <p>{billingData.email}</p>
                      <p>{billingData.address}</p>
                      <p>{billingData.city}, {billingData.country}</p>
                    </div>
                    <button
                      onClick={() => setCurrentStep('billing')}
                      className="text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors mt-2"
                    >
                      Editar datos →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-12">
          <div 
            className="bg-gray-100 border-4 border-black p-6"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <h3 className="text-xl font-black text-black uppercase mb-4 text-center">
              ¿Por qué comprar en Furnibles?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-black text-black text-sm uppercase mb-1">Descargas Inmediatas</p>
                <p className="text-xs text-gray-600 font-medium">Acceso instantáneo después del pago</p>
              </div>
              <div>
                <LockIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-black text-black text-sm uppercase mb-1">Pagos Seguros</p>
                <p className="text-xs text-gray-600 font-medium">Protegidos por Stripe SSL</p>
              </div>
              <div>
                <ShoppingCartIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="font-black text-black text-sm uppercase mb-1">Soporte 24/7</p>
                <p className="text-xs text-gray-600 font-medium">Ayuda cuando la necesites</p>
              </div>
              <div>
                <CheckCircleIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="font-black text-black text-sm uppercase mb-1">Garantía Total</p>
                <p className="text-xs text-gray-600 font-medium">Reembolso si no estás satisfecho</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}