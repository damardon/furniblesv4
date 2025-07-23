'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CreditCard, 
  Shield, 
  Lock, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Calendar,
  User,
  DollarSign
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCartStore } from '@/lib/stores/cart-store'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { NotificationType } from '@/types/additional'
import { cn } from '@/lib/utils'

interface PaymentFormProps {
  amount: number
  currency?: string
  onSuccess?: (paymentResult: any) => void
  onError?: (error: string) => void
  onCancel?: () => void
  className?: string
  showSummary?: boolean
  disabled?: boolean
}

interface CardData {
  number: string
  expiry: string
  cvc: string
  name: string
  postalCode: string
}

interface BillingData {
  email: string
  firstName: string
  lastName: string
  address: string
  city: string
  country: string
  phone: string
}

export function PaymentForm({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
  className,
  showSummary = true,
  disabled = false
}: PaymentFormProps) {
  const t = useTranslations('payment_form')
  const { user } = useAuthStore()
  const { items, total: cartTotal } = useCartStore()
  const { addNotification } = useNotificationStore()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [cardData, setCardData] = useState<CardData>({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    postalCode: ''
  })
  
  const [billingData, setBillingData] = useState<BillingData>({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: '',
    city: '',
    country: 'US',
    phone: ''
  })

  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [savePaymentMethod, setSavePaymentMethod] = useState(false)

  // Helper para crear notificaciones
  const createNotification = (
    type: NotificationType,
    title: string,
    message: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
  ) => ({
    id: `notif-${Date.now()}-${Math.random()}`,
    userId: user?.id || '',
    type,
    title,
    message,
    data: {},
    isRead: false,
    readAt: undefined,
    sentAt: new Date().toISOString(),
    emailSent: false,
    orderId: undefined,
    priority: priority as any,
    channel: 'IN_APP' as any,
    groupKey: undefined,
    expiresAt: undefined,
    clickedAt: undefined,
    clickCount: 0,
    createdAt: new Date().toISOString()
  })

  // Pre-rellenar datos del usuario
  useEffect(() => {
    if (user) {
      setBillingData(prev => ({
        ...prev,
        email: user.email || prev.email,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName
      }))
      setCardData(prev => ({
        ...prev,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
      }))
    }
  }, [user])

  const formatCardNumber = (value: string) => {
    // Remover todo excepto números
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    // Agregar espacios cada 4 dígitos
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const validateCard = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar número de tarjeta (básico)
    const cardNumber = cardData.number.replace(/\s/g, '')
    if (!cardNumber || cardNumber.length < 15) {
      newErrors.number = t('errors.invalid_card_number')
    }

    // Validar fecha de expiración
    if (!cardData.expiry || !cardData.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      newErrors.expiry = t('errors.invalid_expiry')
    } else {
      const [month, year] = cardData.expiry.split('/')
      const now = new Date()
      const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1)
      if (expDate < now) {
        newErrors.expiry = t('errors.card_expired')
      }
    }

    // Validar CVC
    if (!cardData.cvc || cardData.cvc.length < 3) {
      newErrors.cvc = t('errors.invalid_cvc')
    }

    // Validar nombre
    if (!cardData.name.trim()) {
      newErrors.name = t('errors.name_required')
    }

    // Validar datos de facturación
    if (!billingData.email || !billingData.email.includes('@')) {
      newErrors.email = t('errors.invalid_email')
    }

    if (!billingData.firstName.trim()) {
      newErrors.firstName = t('errors.first_name_required')
    }

    if (!billingData.lastName.trim()) {
      newErrors.lastName = t('errors.last_name_required')
    }

    if (!agreedToTerms) {
      newErrors.terms = t('errors.must_agree_terms')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCardDataChange = (field: keyof CardData, value: string) => {
    let formattedValue = value

    if (field === 'number') {
      formattedValue = formatCardNumber(value)
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value)
    } else if (field === 'cvc') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4)
    }

    setCardData(prev => ({ ...prev, [field]: formattedValue }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBillingDataChange = (field: keyof BillingData, value: string) => {
    setBillingData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getCardType = (number: string) => {
    const num = number.replace(/\s/g, '')
    if (num.startsWith('4')) return 'visa'
    if (num.startsWith('5') || num.startsWith('2')) return 'mastercard'
    if (num.startsWith('3')) return 'amex'
    return 'unknown'
  }

  const processPayment = async () => {
    if (!validateCard()) {
      addNotification(createNotification(
        'VALIDATION_ERROR' as NotificationType,
        t('errors.validation_failed'),
        t('errors.fix_errors_message'),
        'HIGH'
      ))
      return
    }

    setIsProcessing(true)

    try {
      // Simular integración con Stripe
      // En implementación real:
      // 1. Crear PaymentIntent en backend
      // 2. Confirmar pago con Stripe.js
      // 3. Manejar 3D Secure si es necesario

      // Simular delay del procesamiento
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Simular resultado exitoso (90% de las veces)
      const isSuccess = Math.random() > 0.1

      if (isSuccess) {
        const paymentResult = {
          id: `pi_${Date.now()}`,
          amount: amount * 100, // En centavos
          currency,
          status: 'succeeded',
          payment_method: {
            type: 'card',
            card: {
              last4: cardData.number.slice(-4),
              brand: getCardType(cardData.number)
            }
          }
        }

        addNotification(createNotification(
          'PAYMENT_SUCCESS' as NotificationType,
          t('success.payment_completed'),
          t('success.payment_completed_message', { amount: `$${amount}` }),
          'NORMAL'
        ))

        onSuccess?.(paymentResult)
      } else {
        throw new Error('Payment declined by bank')
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      
      const errorMessage = error.message || t('errors.payment_failed')
      
      addNotification(createNotification(
        'PAYMENT_ERROR' as NotificationType,
        t('errors.payment_failed'),
        errorMessage,
        'HIGH'
      ))

      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const cardType = getCardType(cardData.number)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Payment Method Selection */}
      <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '4px 4px 0 #000000' }}>
        <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          {t('payment_method')}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod('card')}
            className={cn(
              "p-4 border-3 border-black font-bold transition-all",
              paymentMethod === 'card' 
                ? "bg-orange-500 text-black" 
                : "bg-white hover:bg-gray-100"
            )}
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <CreditCard className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm uppercase">{t('card_payment')}</div>
          </button>

          <button
            onClick={() => setPaymentMethod('paypal')}
            disabled={true}
            className="p-4 border-3 border-black font-bold bg-gray-200 text-gray-500 cursor-not-allowed"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <div className="w-6 h-6 mx-auto mb-2 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
              PP
            </div>
            <div className="text-sm uppercase">{t('paypal_soon')}</div>
          </button>
        </div>
      </div>

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '4px 4px 0 #000000' }}>
          <h3 className="text-lg font-black text-black uppercase mb-4">
            {t('card_details')}
          </h3>

          <div className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="block font-black text-black text-sm uppercase mb-2">
                {t('card_number')} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardData.number}
                  onChange={(e) => handleCardDataChange('number', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  disabled={disabled || isProcessing}
                  className={cn(
                    "w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50",
                    errors.number && "border-red-500 bg-red-50"
                  )}
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                />
                {cardType !== 'unknown' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className={cn(
                      "px-2 py-1 text-xs font-bold uppercase",
                      cardType === 'visa' && "bg-blue-600 text-white",
                      cardType === 'mastercard' && "bg-red-600 text-white",
                      cardType === 'amex' && "bg-green-600 text-white"
                    )}>
                      {cardType}
                    </div>
                  </div>
                )}
              </div>
              {errors.number && (
                <p className="text-red-600 text-xs font-bold mt-1">{errors.number}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Expiry */}
              <div>
                <label className="block font-black text-black text-sm uppercase mb-2">
                  {t('expiry_date')} *
                </label>
                <input
                  type="text"
                  value={cardData.expiry}
                  onChange={(e) => handleCardDataChange('expiry', e.target.value)}
                  placeholder="MM/YY"
                  maxLength={5}
                  disabled={disabled || isProcessing}
                  className={cn(
                    "w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50",
                    errors.expiry && "border-red-500 bg-red-50"
                  )}
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                />
                {errors.expiry && (
                  <p className="text-red-600 text-xs font-bold mt-1">{errors.expiry}</p>
                )}
              </div>

              {/* CVC */}
              <div>
                <label className="block font-black text-black text-sm uppercase mb-2">
                  {t('cvc')} *
                </label>
                <input
                  type="text"
                  value={cardData.cvc}
                  onChange={(e) => handleCardDataChange('cvc', e.target.value)}
                  placeholder="123"
                  maxLength={4}
                  disabled={disabled || isProcessing}
                  className={cn(
                    "w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50",
                    errors.cvc && "border-red-500 bg-red-50"
                  )}
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                />
                {errors.cvc && (
                  <p className="text-red-600 text-xs font-bold mt-1">{errors.cvc}</p>
                )}
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block font-black text-black text-sm uppercase mb-2">
                {t('cardholder_name')} *
              </label>
              <input
                type="text"
                value={cardData.name}
                onChange={(e) => handleCardDataChange('name', e.target.value)}
                placeholder={t('name_placeholder')}
                disabled={disabled || isProcessing}
                className={cn(
                  "w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50",
                  errors.name && "border-red-500 bg-red-50"
                )}
                style={{ boxShadow: '2px 2px 0 #000000' }}
              />
              {errors.name && (
                <p className="text-red-600 text-xs font-bold mt-1">{errors.name}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Billing Information */}
      <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '4px 4px 0 #000000' }}>
        <h3 className="text-lg font-black text-black uppercase mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          {t('billing_information')}
        </h3>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block font-black text-black text-sm uppercase mb-2">
              {t('email')} *
            </label>
            <input
              type="email"
              value={billingData.email}
              onChange={(e) => handleBillingDataChange('email', e.target.value)}
              placeholder="tu@email.com"
              disabled={disabled || isProcessing}
              className={cn(
                "w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50",
                errors.email && "border-red-500 bg-red-50"
              )}
              style={{ boxShadow: '2px 2px 0 #000000' }}
            />
            {errors.email && (
              <p className="text-red-600 text-xs font-bold mt-1">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block font-black text-black text-sm uppercase mb-2">
                {t('first_name')} *
              </label>
              <input
                type="text"
                value={billingData.firstName}
                onChange={(e) => handleBillingDataChange('firstName', e.target.value)}
                placeholder={t('first_name_placeholder')}
                disabled={disabled || isProcessing}
                className={cn(
                  "w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50",
                  errors.firstName && "border-red-500 bg-red-50"
                )}
                style={{ boxShadow: '2px 2px 0 #000000' }}
              />
              {errors.firstName && (
                <p className="text-red-600 text-xs font-bold mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block font-black text-black text-sm uppercase mb-2">
                {t('last_name')} *
              </label>
              <input
                type="text"
                value={billingData.lastName}
                onChange={(e) => handleBillingDataChange('lastName', e.target.value)}
                placeholder={t('last_name_placeholder')}
                disabled={disabled || isProcessing}
                className={cn(
                  "w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50",
                  errors.lastName && "border-red-500 bg-red-50"
                )}
                style={{ boxShadow: '2px 2px 0 #000000' }}
              />
              {errors.lastName && (
                <p className="text-red-600 text-xs font-bold mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      {showSummary && (
        <div className="bg-blue-100 border-4 border-black p-6" style={{ boxShadow: '4px 4px 0 #000000' }}>
          <h3 className="text-lg font-black text-black uppercase mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {t('payment_summary')}
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">{t('subtotal')}</span>
              <span className="font-black text-black">${(amount * 0.9).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">{t('platform_fee')}</span>
              <span className="font-black text-black">${(amount * 0.1).toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-black pt-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-black text-lg uppercase">{t('total')}</span>
                <span className="font-black text-orange-500 text-xl">${amount.toFixed(2)} {currency}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Options */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="save-payment"
            checked={savePaymentMethod}
            onChange={(e) => setSavePaymentMethod(e.target.checked)}
            className="w-4 h-4 mt-1 border-2 border-black"
            disabled={disabled || isProcessing}
          />
          <label htmlFor="save-payment" className="text-sm font-bold text-black">
            {t('save_payment_method')}
          </label>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agree-terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 mt-1 border-2 border-black"
            disabled={disabled || isProcessing}
          />
          <label htmlFor="agree-terms" className="text-sm font-bold text-black">
            {t('agree_terms')}
            <a href="/terminos" target="_blank" className="text-orange-500 hover:text-orange-600 ml-1">
              {t('terms_link')}
            </a>
          </label>
        </div>
        {errors.terms && (
          <p className="text-red-600 text-xs font-bold">{errors.terms}</p>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-green-100 border-3 border-black p-4 flex items-center gap-3">
        <Shield className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-black text-black text-sm uppercase mb-1">
            {t('secure_payment')}
          </p>
          <p className="text-xs font-bold text-green-600">
            {t('security_notice')}
          </p>
        </div>
        <Lock className="w-5 h-5 text-green-600" />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 bg-gray-400 border-3 border-black px-6 py-4 font-black text-black uppercase hover:bg-yellow-400 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            {t('cancel')}
          </button>
        )}

        <button
          onClick={processPayment}
          disabled={disabled || isProcessing || !agreedToTerms}
          className="flex-2 bg-green-500 border-3 border-black px-8 py-4 font-black text-black uppercase hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ boxShadow: '3px 3px 0 #000000' }}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('processing')}
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              {t('pay_now', { amount: `${amount.toFixed(2)}` })}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
