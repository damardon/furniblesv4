'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Plus, Minus, ShoppingCartIcon, TrashIcon, CreditCardIcon } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cart-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { CartItem } from '@/types/additional'

export function CartModal() {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  
  const { 
    items, 
    isCartOpen, 
    setCartOpen, 
    subtotal, 
    platformFee, 
    total, 
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    isLoading
  } = useCartStore()
  
  const { isAuthenticated, setLoginModalOpen } = useAuthStore()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    setIsUpdating(productId)
    try {
      await updateQuantity(productId, newQuantity)
    } catch (error) {
      console.error('Error updating quantity:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveItem = async (productId: string) => {
    setIsUpdating(productId)
    try {
      await removeItem(productId)
    } catch (error) {
      console.error('Error removing item:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true)
      return
    }
    setCartOpen(false)
    // Navegar a checkout - implementaremos después
    window.location.href = '/checkout'
  }

  if (!isCartOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => setCartOpen(false)}
      />
      
      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white border-l-[5px] border-black">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b-[3px] border-black bg-orange-500"
          style={{ boxShadow: '0 3px 0 #000000' }}
        >
          <div className="flex items-center gap-3">
            <ShoppingCartIcon className="w-6 h-6 text-black" />
            <h2 className="text-2xl font-black text-black uppercase">
              Mi Carrito
            </h2>
            {itemCount > 0 && (
              <span 
                className="bg-black text-white px-2 py-1 text-sm font-black border-2 border-white"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                {itemCount}
              </span>
            )}
          </div>
          
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex flex-col h-[calc(100%-80px)]">
          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div 
                  className="bg-white border-[5px] border-black p-8 mx-auto max-w-xs"
                  style={{ boxShadow: '8px 8px 0 #000000' }}
                >
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-black font-black text-lg mb-2 uppercase">
                    Carrito Vacío
                  </h3>
                  <p className="text-black font-medium text-sm mb-4">
                    Agrega productos para empezar
                  </p>
                  <Link
                    href="/productos"
                    onClick={() => setCartOpen(false)}
                    className="bg-orange-500 border-3 border-black font-black text-black text-sm uppercase px-4 py-2 hover:bg-yellow-400 transition-all"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    Ver Productos
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item: CartItem) => (
                  <div
                    key={item.id}
                    className="bg-white border-[3px] border-black p-4 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
                    style={{ boxShadow: '6px 6px 0 #000000' }}
                  >
                    <div className="flex gap-4">
                      {/* Imagen */}
                      <div className="relative w-16 h-16 border-2 border-black overflow-hidden">
                        <Image
                          src={item.product.previewImages[0] || '/placeholder-product.jpg'}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <h4 className="font-black text-black text-sm uppercase line-clamp-2 mb-1">
                          {item.product.title}
                        </h4>
                        <p className="text-xs text-gray-600 font-bold mb-2">
                          {item.product.seller.sellerProfile?.storeName || 
                           `${item.product.seller.firstName} ${item.product.seller.lastName}`}
                        </p>
                        
                        {/* Precio */}
                        <div className="flex items-center justify-between">
                          <span className="font-black text-black">
                            {formatPrice(item.priceSnapshot)}
                          </span>
                          
                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              disabled={isUpdating === item.productId || item.quantity <= 1}
                              className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-yellow-400 transition-all disabled:opacity-50"
                              style={{ boxShadow: '2px 2px 0 #000000' }}
                            >
                              <Minus className="w-3 h-3 text-black" />
                            </button>
                            
                            <span className="w-8 text-center font-black text-black">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              disabled={isUpdating === item.productId}
                              className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-yellow-400 transition-all disabled:opacity-50"
                              style={{ boxShadow: '2px 2px 0 #000000' }}
                            >
                              <Plus className="w-3 h-3 text-black" />
                            </button>
                            
                            <button
                              onClick={() => handleRemoveItem(item.productId)}
                              disabled={isUpdating === item.productId}
                              className="w-8 h-8 bg-red-500 border-2 border-black flex items-center justify-center hover:bg-red-600 transition-all disabled:opacity-50"
                              style={{ boxShadow: '2px 2px 0 #000000' }}
                            >
                              <TrashIcon className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Botón limpiar carrito */}
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    disabled={isLoading}
                    className="w-full bg-red-500 border-3 border-black font-black text-white text-sm uppercase py-2 hover:bg-red-600 transition-all disabled:opacity-50"
                    style={{ boxShadow: '4px 4px 0 #000000' }}
                  >
                    <TrashIcon className="w-4 h-4 inline mr-2" />
                    Vaciar Carrito
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer con totales y checkout */}
          {items.length > 0 && (
            <div 
              className="border-t-[3px] border-black bg-gray-50 p-6"
              style={{ boxShadow: '0 -3px 0 #000000' }}
            >
              {/* Totales */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black">Subtotal:</span>
                  <span className="font-black text-black">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black text-sm">Fee plataforma (10%):</span>
                  <span className="font-bold text-black text-sm">{formatPrice(platformFee)}</span>
                </div>
                
                <div 
                  className="flex justify-between items-center py-2 border-t-2 border-black"
                >
                  <span className="font-black text-black text-lg uppercase">Total:</span>
                  <span className="font-black text-black text-xl">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full bg-yellow-400 border-3 border-black font-black text-black text-lg uppercase py-3 hover:bg-orange-500 transition-all disabled:opacity-50"
                  style={{ boxShadow: '5px 5px 0 #000000' }}
                >
                  <CreditCardIcon className="w-5 h-5 inline mr-2" />
                  {isAuthenticated ? 'Proceder al Pago' : 'Iniciar Sesión'}
                </button>
                
                <Link
                  href="/productos"
                  onClick={() => setCartOpen(false)}
                  className="block w-full bg-white border-3 border-black font-black text-black text-center text-sm uppercase py-2 hover:bg-yellow-400 transition-all"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  Seguir Comprando
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}