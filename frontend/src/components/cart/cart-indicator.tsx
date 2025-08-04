'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'

export function CartIndicator() {
  const { getItemCount, getTotalAmount } = useCart()
  const itemCount = getItemCount()

  return (
    <Link href="/carrito">
      <Button
        variant="primary"
        size="default"
        className="relative flex items-center gap-2"
      >
        <span>🛒</span>
        <span className="hidden sm:inline">Carrito</span>
        {itemCount > 0 && (
          <>
            <span className="bg-red-500 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center absolute -top-2 -right-2">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
            <span className="hidden md:inline text-xs">
              ${getTotalAmount().toFixed(2)}
            </span>
          </>
        )}
      </Button>
    </Link>
  )
}