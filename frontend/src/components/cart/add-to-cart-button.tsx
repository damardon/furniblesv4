'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'

interface AddToCartButtonProps {
  productId: string
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'icon'
  children?: React.ReactNode
}

export function AddToCartButton({ 
  productId, 
  className, 
  variant = 'primary',
  size = 'default',
  children 
}: AddToCartButtonProps) {
  const { addToCart, state } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    setIsAdding(true)
    try {
      await addToCart(productId)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const isInCart = state.items.some(item => item.productId === productId)

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding || isInCart || state.isLoading}
      variant={isInCart ? 'success' : variant}
      size={size}
      className={className}
    >
      {isAdding ? (
        <>⏳ Agregando...</>
      ) : isInCart ? (
        <>✅ En Carrito</>
      ) : (
        children || <>🛒 Agregar al Carrito</>
      )}
    </Button>
  )
}