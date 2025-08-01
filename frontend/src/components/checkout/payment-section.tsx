'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CreditCardIcon, 
  ShieldIcon, 
  LockIcon, 
  CheckCircleIcon,
  InfoIcon,
  AlertCircleIcon
} from 'lucide-react'

interface PaymentSectionProps {
  total: number
  platformFee: number
  subtotal: number
  isProcessing: boolean
  onPaymentSubmit: () => void
  disabled?: boolean
}

export function PaymentSection({ 
  total, 
  platformFee, 
  subtotal, 
  isProcessing, 
  onPaymentSubmit,
  disabled = false 
}: PaymentSectionProps) {
  const t = useTranslations('checkout.payment')
  const tCommon = useTranslations('common')

  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [saveCard, setSaveCard] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')
    
    // Format with spaces every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ')
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19)
  }

  const formatExpiryDate = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')
    
    // Format as MM/YY
    if (digits.length >= 2) {
      return digits.slice(0, 2) + '/' + digits.slice(2, 4)
    }
    return digits
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted)
  }

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value)
    setExpiryDate(formatted)
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCvv(digits)
  }

  const isFormValid = () => {
    return (
      cardNumber.replace(/\s/g, '').length >= 13 &&
      expiryDate.length === 5 &&
      cvv.length >= 3 &&
      cardholderName.trim().length > 0 &&
      acceptedTerms
    )
  }

  const handleSubmit = () => {
    if (!isFormValid() || disabled || isProcessing) return
    onPaymentSubmit()
  }

  return (
    <div 
      className="bg-white border-[5px] border-black p-8"
      style={{ boxShadow: '8px 8px 0 #000000' }}
    >
      <h2 className="text-3xl font-black text-black mb-6 uppercase flex items-center gap-3">
        <CreditCardIcon className="w-8 h-8" />
        {t('title')}
      </h2>

      {/* Stripe Badge */}
      <div 
        className="bg-blue-100 border-3 border-black p-4 mb-6 flex items-center gap-3"
        style={{ boxShadow: '4px 4px 0 #000000' }}
      >
        <ShieldIcon className="w-6 h-6 text-blue-600" />
        <div>
          <p className="text-black font-black text-sm uppercase">{t('secure_payments')}</p>
          <p className="text-gray-600 text-xs font-bold">{t('ssl_protection')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tarjeta de Crédito/Débito */}
        <div>
          <h3 className="text-xl font-black text-black mb-4 uppercase">{t('card_section_title')}</h3>
          
          {/* Nombre del Titular */}
          <div className="mb-4">
            <label className="block text-black font-black text-sm uppercase mb-2">
              {t('cardholder_name')} *
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              disabled={isProcessing || disabled}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              placeholder={t('cardholder_placeholder')}
            />
          </div>

          {/* Número de Tarjeta */}
          <div className="mb-4">
            <label className="block text-black font-black text-sm uppercase mb-2">
              {t('card_number')} *
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              disabled={isProcessing || disabled}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              placeholder={t('card_number_placeholder')}
              maxLength={19}
            />
          </div>

          {/* Fecha de Vencimiento y CVV */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-black font-black text-sm uppercase mb-2">
                {t('expiry_date')} *
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={handleExpiryDateChange}
                disabled={isProcessing || disabled}
                className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
                style={{ boxShadow: '3px 3px 0 #000000' }}
                placeholder={t('expiry_placeholder')}
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-black font-black text-sm uppercase mb-2">
                CVV *
              </label>
              <input
                type="text"
                value={cvv}
                onChange={handleCvvChange}
                disabled={isProcessing || disabled}
                className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
                style={{ boxShadow: '3px 3px 0 #000000' }}
                placeholder={t('cvv_placeholder')}
                maxLength={4}
              />
            </div>
          </div>

          {/* Guardar Tarjeta */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                disabled={isProcessing || disabled}
                className="w-5 h-5 border-3 border-black focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-black font-bold text-sm">
                {t('save_card')}
              </span>
            </label>
          </div>
        </div>

        {/* Garantías */}
        <div 
          className="bg-green-100 border-3 border-black p-6"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <h3 className="text-lg font-black text-black mb-3 uppercase flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            {t('guarantees.title')}
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-black font-medium">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              {t('guarantees.unlimited_downloads')}
            </li>
            <li className="flex items-center gap-2 text-black font-medium">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              {t('guarantees.technical_support')}
            </li>
            <li className="flex items-center gap-2 text-black font-medium">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              {t('guarantees.full_refund')}
            </li>
            <li className="flex items-center gap-2 text-black font-medium">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              {t('guarantees.immediate_access')}
            </li>
          </ul>
        </div>

        {/* Resumen de Costos */}
        <div 
          className="bg-gray-100 border-3 border-black p-6"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <h3 className="text-lg font-black text-black mb-4 uppercase">{t('payment_summary')}</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-black font-bold">
              <span>{t('subtotal')}:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-black font-bold">
              <span>{t('platform_commission')}:</span>
              <span>{formatPrice(platformFee)}</span>
            </div>
            <div className="border-t-3 border-black pt-2 mt-2">
              <div className="flex justify-between items-center text-black font-black text-xl">
                <span className="uppercase">{t('total')}:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Términos y Condiciones */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              disabled={isProcessing || disabled}
              className="w-5 h-5 border-3 border-black focus:ring-0 focus:ring-offset-0 mt-1"
            />
            <span className="text-black font-bold text-sm">
              {t('terms_acceptance')}{' '}
              <a href="/terminos" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                {t('terms_link')}
              </a>
              {' '}{t('and')}{' '}
              <a href="/privacidad" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                {t('privacy_link')}
              </a>
            </span>
          </label>
        </div>

        {/* Información Adicional */}
        <div 
          className="bg-yellow-100 border-3 border-black p-4 flex items-start gap-3"
          style={{ boxShadow: '3px 3px 0 #000000' }}
        >
          <InfoIcon className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-black font-bold mb-1">
              {t('purchase_info.title')}
            </p>
            <ul className="text-gray-700 font-medium space-y-1">
              <li>• {t('purchase_info.confirmation_email')}</li>
              <li>• {t('purchase_info.download_links')}</li>
              <li>• {t('purchase_info.detailed_invoice')}</li>
              <li>• {t('purchase_info.support_access')}</li>
            </ul>
          </div>
        </div>

        {/* Botón de Pago */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid() || isProcessing || disabled}
          className="w-full bg-green-500 border-6 border-black font-black text-black text-xl uppercase py-4 hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          style={{ boxShadow: '6px 6px 0 #000000' }}
        >
          {isProcessing ? (
            <>
              <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
              {t('processing_payment')}
            </>
          ) : (
            <>
              <LockIcon className="w-6 h-6" />
              {t('pay_button', { amount: formatPrice(total) })}
            </>
          )}
        </button>

        {/* Métodos de Pago Aceptados */}
        <div className="text-center">
          <p className="text-gray-600 text-sm font-bold mb-2">{t('accepted_methods')}:</p>
          <div className="flex justify-center items-center gap-4">
            <div className="bg-white border-2 border-black px-3 py-1 text-xs font-black">VISA</div>
            <div className="bg-white border-2 border-black px-3 py-1 text-xs font-black">MASTERCARD</div>
            <div className="bg-white border-2 border-black px-3 py-1 text-xs font-black">AMEX</div>
            <div className="bg-white border-2 border-black px-3 py-1 text-xs font-black">STRIPE</div>
          </div>
        </div>

        {/* Error Message Area */}
        {!isFormValid() && acceptedTerms && (
          <div 
            className="bg-red-100 border-3 border-red-500 p-4 flex items-center gap-3"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <AlertCircleIcon className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-bold text-sm">
              {t('form_validation_error')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}