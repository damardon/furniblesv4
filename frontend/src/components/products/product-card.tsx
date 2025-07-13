'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { StarIcon, HeartIcon, ShoppingCartIcon, ClockIcon, DownloadIcon, CheckCircleIcon } from 'lucide-react'
import { Product, Difficulty, ProductCategory } from '@/types'
import { useCartStore } from '@/lib/stores/cart-store'
import { useAuthStore } from '@/lib/stores/auth-store'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('products')
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  // Stores
  const { addItem } = useCartStore()
  const { isAuthenticated, setLoginModalOpen } = useAuthStore()

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.BEGINNER:
        return 'bg-green-500 text-black border-2 border-black'
      case Difficulty.INTERMEDIATE:
        return 'bg-yellow-400 text-black border-2 border-black'
      case Difficulty.ADVANCED:
        return 'bg-orange-500 text-black border-2 border-black'
      case Difficulty.EXPERT:
        return 'bg-red-500 text-white border-2 border-black'
      default:
        return 'bg-gray-400 text-black border-2 border-black'
    }
  }

  const getCategoryBadge = (category: ProductCategory) => {
    const colors = {
      [ProductCategory.TABLES]: 'bg-blue-400',
      [ProductCategory.CHAIRS]: 'bg-purple-400', 
      [ProductCategory.BEDS]: 'bg-pink-400',
      [ProductCategory.SHELVES]: 'bg-green-400',
      [ProductCategory.STORAGE]: 'bg-yellow-400',
      [ProductCategory.DESKS]: 'bg-orange-400',
      [ProductCategory.OUTDOOR]: 'bg-cyan-400',
      [ProductCategory.DECORATIVE]: 'bg-red-400',
      [ProductCategory.FURNITURE]: 'bg-indigo-400',
      [ProductCategory.FURNITURES]: 'bg-teal-400',
      [ProductCategory.LIGHTING]: 'bg-amber-400',
      [ProductCategory.KITCHEN]: 'bg-lime-400',
      [ProductCategory.BATHROOM]: 'bg-sky-400',
      [ProductCategory.OFFICE]: 'bg-violet-400',
      [ProductCategory.GARDEN]: 'bg-emerald-400',
      [ProductCategory.TOYS]: 'bg-rose-400',
      [ProductCategory.SPORTS]: 'bg-blue-500',
      [ProductCategory.ELECTRONICS]: 'bg-gray-500',
    }
    
    return `${colors[category] || 'bg-gray-400'} text-black border-2 border-black`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true)
      return
    }

    setIsAddingToCart(true)
    try {
      await addItem(product, 1)
      // Aquí podrías mostrar un toast de éxito
    } catch (error) {
      console.error('Error adding to cart:', error)
      // Aquí podrías mostrar un toast de error
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Usar primera imagen de preview como imagen principal
  const imageUrl = product.previewImages?.[0] || ''

  return (
    <div 
      className="bg-white border-[5px] border-black p-6 transition-all duration-300 group hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[11px_11px_0_#000000]"
      style={{ boxShadow: '8px 8px 0 #000000' }}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-[4/3] overflow-hidden mb-4 border-4 border-black">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">🪵</div>
              <p className="text-black text-sm font-black uppercase">SIN IMAGEN</p>
            </div>
          </div>
        )}

        {/* Badges superiores */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.featured && (
            <span 
              className="bg-orange-500 text-black text-xs font-black px-2 py-1 border-2 border-black uppercase"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              DESTACADO
            </span>
          )}
          {/* Badge para productos nuevos (últimos 7 días) */}
          {(() => {
            const publishedDate = new Date(product.publishedAt || product.createdAt)
            const daysDiff = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))
            return daysDiff <= 7 ? (
              <span 
                className="bg-green-500 text-black text-xs font-black px-2 py-1 border-2 border-black uppercase"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                NUEVO
              </span>
            ) : null
          })()}
        </div>

        {/* Botón favorito */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all duration-200 transform hover:scale-110"
          style={{ boxShadow: '3px 3px 0 #000000' }}
        >
          <HeartIcon 
            className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-black'}`} 
          />
        </button>

        {/* Contador de favoritos */}
        <div 
          className="absolute bottom-3 right-3 bg-black text-white px-2 py-1 text-xs font-black border-2 border-white"
          style={{ boxShadow: '2px 2px 0 #000000' }}
        >
          ❤️ {formatNumber(product.favoriteCount)}
        </div>
      </div>

      {/* Rating y descargas */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <StarIcon className="w-4 h-4 fill-orange-500 text-orange-500" />
          <span className="text-sm font-black text-black">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-600 font-bold">
            ({product.reviewCount})
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <DownloadIcon className="w-4 h-4" />
          <span className="font-bold">{formatNumber(product.downloadCount)} descargas</span>
        </div>
      </div>

      {/* Título */}
      <Link href={`/productos/${product.slug}`}>
        <h3 className="font-black text-black mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors text-lg uppercase cursor-pointer">
          {product.title}
        </h3>
      </Link>

      {/* Descripción */}
      <p className="text-black text-sm mb-4 line-clamp-2 font-medium">
        {product.description}
      </p>

      {/* Metadatos */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span 
          className={`${getDifficultyBadge(product.difficulty)} text-xs font-black px-2 py-1 uppercase`}
          style={{ boxShadow: '2px 2px 0 #000000' }}
        >
          {product.difficulty}
        </span>
        
        {product.estimatedTime && (
          <div className="flex items-center gap-1 text-black font-bold text-xs">
            <ClockIcon className="w-3 h-3" />
            <span>{product.estimatedTime}</span>
          </div>
        )}
        
        {/* Badge de categoría */}
        <span 
          className={`${getCategoryBadge(product.category)} text-xs font-black px-2 py-1 uppercase`}
          style={{ boxShadow: '2px 2px 0 #000000' }}
        >
          {product.category}
        </span>
      </div>

      {/* Seller info */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b-2 border-black">
        <div className="w-8 h-8 bg-orange-500 border-2 border-black flex items-center justify-center text-black text-xs font-black">
          {product.seller?.firstName?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-black text-black truncate uppercase">
              {product.seller?.sellerProfile?.storeName || `${product.seller?.firstName || ''} ${product.seller?.lastName || ''}`}
            </p>
            {product.seller?.sellerProfile?.isVerified && (
              <div className="relative group">
                <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Vendedor Verificado
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <StarIcon className="w-3 h-3 fill-orange-500 text-orange-500" />
            <span className="text-xs text-black font-bold">
              {product.seller?.sellerProfile?.rating?.toFixed(1) || '0.0'}
            </span>
          </div>
        </div>
      </div>

      {/* Precio */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-black">
            {formatPrice(product.price)}
          </span>
        </div>
        {/* Fecha de publicación */}
        <span className="text-xs text-gray-600 font-bold">
          {formatDate(product.publishedAt || product.createdAt)}
        </span>
      </div>

      {/* Botón de compra principal */}
      <button 
        onClick={handleAddToCart}
        disabled={isAddingToCart}
        className="w-full bg-yellow-400 border-3 border-black font-black text-black text-sm uppercase py-3 mb-3 hover:bg-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: '4px 4px 0 #000000' }}
      >
        <ShoppingCartIcon className="w-4 h-4 inline mr-2" />
        {isAddingToCart ? 'AGREGANDO...' : 'AGREGAR AL CARRITO'}
      </button>

      {/* Botón de ver detalles */}
      <Link href={`/productos/${product.slug}`}>
        <button 
          className="w-full bg-white border-3 border-black font-black text-black text-sm uppercase py-3 hover:bg-yellow-400 transition-all"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          VER DETALLES
        </button>
      </Link>

      {/* Tags - ✅ CORREGIDO: Agregado key prop */}
      <div className="flex flex-wrap gap-1 mt-4">
        {product.tags.slice(0, 3).map((tag, index) => (
          <span
            key={`${product.id}-tag-${index}`} // ✅ Key única agregada
            className="bg-blue-200 text-black text-xs font-bold px-2 py-1 border border-black"
            style={{ boxShadow: '1px 1px 0 #000000' }}
          >
            #{tag}
          </span>
        ))}
        {product.tags.length > 3 && (
          <span className="text-black font-bold text-xs px-2 py-1">
            +{product.tags.length - 3}
          </span>
        )}
      </div>

      {/* Stats adicionales */}
      <div className="flex items-center justify-between mt-4 pt-2 border-t-2 border-black text-xs">
        <span className="text-gray-600 font-bold">
          👁️ {formatNumber(product.viewCount)} vistas
        </span>
        <span className="text-gray-600 font-bold">
          ID: {product.id.slice(-6)}
        </span>
      </div>
    </div>
  )
}