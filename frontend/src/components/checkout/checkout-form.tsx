'use client'

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
  return (
    <div 
      className="bg-white border-[5px] border-black p-8"
      style={{ boxShadow: '8px 8px 0 #000000' }}
    >
      <h2 className="text-3xl font-black text-black mb-6 uppercase flex items-center gap-3">
        <UserIcon className="w-8 h-8" />
        Datos de Facturación
      </h2>

      <div className="space-y-6">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-black font-black text-sm uppercase mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={billingData.firstName}
              onChange={(e) => onDataChange('firstName', e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-black font-black text-sm uppercase mb-2">
              Apellido *
            </label>
            <input
              type="text"
              value={billingData.lastName}
              onChange={(e) => onDataChange('lastName', e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              placeholder="Tu apellido"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
            <MailIcon className="w-4 h-4" />
            Email *
          </label>
          <input
            type="email"
            value={billingData.email}
            onChange={(e) => onDataChange('email', e.target.value)}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 #000000' }}
            placeholder="tu@email.com"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
            <PhoneIcon className="w-4 h-4" />
            Teléfono *
          </label>
          <input
            type="tel"
            value={billingData.phone}
            onChange={(e) => onDataChange('phone', e.target.value)}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 #000000' }}
            placeholder="+56 9 1234 5678"
          />
        </div>

        {/* País y Ciudad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-black font-black text-sm uppercase mb-2">
              País *
            </label>
            <select
              value={billingData.country}
              onChange={(e) => onDataChange('country', e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="Chile">Chile</option>
              <option value="Argentina">Argentina</option>
              <option value="Colombia">Colombia</option>
              <option value="México">México</option>
              <option value="Perú">Perú</option>
              <option value="España">España</option>
              <option value="Estados Unidos">Estados Unidos</option>
            </select>
          </div>
          <div>
            <label className="block text-black font-black text-sm uppercase mb-2">
              Ciudad *
            </label>
            <input
              type="text"
              value={billingData.city}
              onChange={(e) => onDataChange('city', e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              placeholder="Tu ciudad"
            />
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
            <MapPinIcon className="w-4 h-4" />
            Dirección *
          </label>
          <input
            type="text"
            value={billingData.address}
            onChange={(e) => onDataChange('address', e.target.value)}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 #000000' }}
            placeholder="Calle 123, Depto 456"
          />
        </div>

        {/* Código Postal */}
        <div>
          <label className="block text-black font-black text-sm uppercase mb-2">
            Código Postal *
          </label>
          <input
            type="text"
            value={billingData.zipCode}
            onChange={(e) => onDataChange('zipCode', e.target.value)}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 #000000' }}
            placeholder="12345"
          />
        </div>
      </div>
    </div>
  )
}