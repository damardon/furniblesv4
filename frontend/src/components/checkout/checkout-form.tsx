'use client'

import { useTranslations } from 'next-intl'
import { UserIcon, MailIcon, MapPinIcon, PhoneIcon } from 'lucide-react'

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

interface CheckoutFormProps {
  billingData: BillingData
  onDataChange: (field: keyof BillingData, value: string) => void
  isProcessing: boolean
}

export function CheckoutForm({ billingData, onDataChange, isProcessing }: CheckoutFormProps) {
  const t = useTranslations('checkout.form')
  const tCommon = useTranslations('common')

  return (
    <div 
      className="bg-white border-[5px] border-black p-8"
      style={{ boxShadow: '8px 8px 0 #000000' }}
    >
      <h2 className="text-3xl font-black text-black mb-6 uppercase flex items-center gap-3">
        <UserIcon className="w-8 h-8" />
        {t('title')}
      </h2>

      <div className="space-y-6">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-black font-black text-sm uppercase mb-2">
              {t('fields.first_name')} *
            </label>
            <input
              type="text"
              value={billingData.firstName}
              onChange={(e) => onDataChange('firstName', e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              placeholder={t('placeholders.first_name')}
            />
          </div>
          <div>
            <label className="block text-black font-black text-sm uppercase mb-2">
              {t('fields.last_name')} *
            </label>
            <input
              type="text"
              value={billingData.lastName}
              onChange={(e) => onDataChange('lastName', e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              placeholder={t('placeholders.last_name')}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
            <MailIcon className="w-4 h-4" />
            {t('fields.email')} *
          </label>
          <input
            type="email"
            value={billingData.email}
            onChange={(e) => onDataChange('email', e.target.value)}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 #000000' }}
            placeholder={t('placeholders.email')}
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
            <PhoneIcon className="w-4 h-4" />
            {t('fields.phone')} *
          </label>
          <input
            type="tel"
            value={billingData.phone}
            onChange={(e) => onDataChange('phone', e.target.value)}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 #000000' }}
            placeholder={t('placeholders.phone')}
          />
        </div>

        {/* País y Ciudad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-black font-black text-sm uppercase mb-2">
              {t('fields.country')} *
            </label>
            <select
              value={billingData.country}
              onChange={(e) => onDataChange('country', e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="Chile">{t('countries.chile')}</option>
              <option value="Argentina">{t('countries.argentina')}</option>
              <option value="Colombia">{t('countries.colombia')}</option>
              <option value="México">{t('countries.mexico')}</option>
              <option value="Perú">{t('countries.peru')}</option>
              <option value="España">{t('countries.spain')}</option>
              <option value="Estados Unidos">{t('countries.usa')}</option>
            </select>
          </div>
          <div>
            <label className="block text-black font-black text-sm uppercase mb-2">
              {t('fields.city')} *
            </label>
            <input
              type="text"
              value={billingData.city}
              onChange={(e) => onDataChange('city', e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              placeholder={t('placeholders.city')}
            />
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
            <MapPinIcon className="w-4 h-4" />
            {t('fields.address')} *
          </label>
          <input
            type="text"
            value={billingData.address}
            onChange={(e) => onDataChange('address', e.target.value)}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 #000000' }}
            placeholder={t('placeholders.address')}
          />
        </div>

        {/* Código Postal */}
        <div>
          <label className="block text-black font-black text-sm uppercase mb-2">
            {t('fields.zip_code')} *
          </label>
          <input
            type="text"
            value={billingData.zipCode}
            onChange={(e) => onDataChange('zipCode', e.target.value)}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 #000000' }}
            placeholder={t('placeholders.zip_code')}
          />
        </div>
      </div>
    </div>
  )
}