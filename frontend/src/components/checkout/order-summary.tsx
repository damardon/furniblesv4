'use client'

import Image from 'next/image'
import { CartItem } from '@/types/additional'

interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  platformFee: number
  total: number
}

export function OrderSummary({ items, subtotal, platformFee, total }: OrderSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  return (
    <div>
      <h2 className="text-3xl font-black text-black mb-6 uppercase">
        Resumen del Pedido
      </h2>

      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item: CartItem) => (
          <div 
            key={item.id}
            className="flex gap-4 p-4 border-2 border-black hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <div className="relative w-16 h-16 border-2 border-black overflow-hidden">
              <Image
                src={item.product.previewImages[0] || '/placeholder-product.jpg'}
                alt={item.product.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-black text-sm uppercase line-clamp-2 mb-1">
                {item.product.title}
              </h4>
              <p className="text-xs text-gray-600 font-bold mb-2">
                {item.product.seller.sellerProfile?.storeName || 
                 `${item.product.seller.firstName} ${item.product.seller.lastName}`}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold bg-blue-200 text-black px-2 py-1 border border-black">
                  Qty: {item.quantity}
                </span>
                <span className="font-black text-black">
                  {formatPrice(item.priceSnapshot * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div 
        className="space-y-3 p-4 border-2 border-black bg-gray-50"
        style={{ boxShadow: '3px 3px 0 #000000' }}
      >
        <div className="flex justify-between items-center">
          <span className="font-bold text-black">Subtotal:</span>
          <span className="font-black text-black">{formatPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-black">Fee plataforma (10%):</span>
          <span className="font-bold text-black">{formatPrice(platformFee)}</span>
        </div>
        
        <div className="h-[2px] bg-black my-3"></div>
        
        <div className="flex justify-between items-center">
          <span className="font-black text-black text-xl uppercase">Total:</span>
          <span className="font-black text-orange-500 text-2xl">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  )
}