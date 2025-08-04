// frontend/src/app/carrito/page.tsx
'use client'

import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

export default function CarritoPage() {
  const { state, removeFromCart, clearCart } = useCart()
  const { items, summary, isLoading, error } = state

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-xl font-bold">Cargando carrito...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="text-center">
            <div className="text-8xl mb-8">🛒</div>
            <h1 className="text-4xl font-black uppercase mb-4">Tu carrito está vacío</h1>
            <p className="text-xl mb-8">¡Descubre increíbles planos de muebles!</p>
            <Link href="/productos">
              <Button variant="primary" size="lg">
                Ver Productos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase mb-4">Mi Carrito</h1>
          <p className="text-lg">
            {summary.itemCount} producto{summary.itemCount !== 1 ? 's' : ''} en tu carrito
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items del carrito */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border-4 border-black p-6"
                style={{ boxShadow: '6px 6px 0 #000000' }}
              >
                <div className="flex gap-4">
                  {/* Imagen del producto */}
                  <div className="w-20 h-20 bg-gray-200 border-2 border-black flex-shrink-0">
                    {item.product.imageUrl ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/image/${item.product.imageUrl}`}
                        alt={item.productTitle}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        📐
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1">
                    <h3 className="font-black text-lg uppercase mb-2">
                      {item.productTitle}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Por: {item.seller.storeName}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      Categoría: {item.product.category}
                    </p>
                    
                    {/* Precio */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-orange-500">
                        ${item.currentPrice.toFixed(2)}
                      </span>
                      {item.priceSnapshot !== item.currentPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${item.priceSnapshot.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2">
                    <Link href={`/productos/${item.product.slug}`}>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen del carrito */}
          <div className="lg:col-span-1">
            <div
              className="bg-white border-4 border-black p-6 sticky top-8"
              style={{ boxShadow: '6px 6px 0 #000000' }}
            >
              <h2 className="font-black text-xl uppercase mb-4">Resumen</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">${summary.subtotal.toFixed(2)}</span>
                </div>
                
                {summary.feeBreakdown.map((fee, index) => (
                  <div key={index} className="flex justify-between text-sm text-gray-600">
                    <span>{fee.description}:</span>
                    <span>${fee.amount.toFixed(2)}</span>
                  </div>
                ))}
                
                <hr className="border-black border-2" />
                
                <div className="flex justify-between text-xl font-black">
                  <span>Total:</span>
                  <span className="text-orange-500">${summary.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/checkout">
                  <Button variant="success" size="lg" className="w-full">
                    💳 Proceder al Pago
                  </Button>
                </Link>
                
                <Link href="/productos">
                  <Button variant="outline" size="default" className="w-full">
                    Seguir Comprando
                  </Button>
                </Link>
                
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={clearCart}
                >
                  🗑️ Vaciar Carrito
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}