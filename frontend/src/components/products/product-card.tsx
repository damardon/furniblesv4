// frontend/src/components/products/product-card.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'
import { Star, Download, User, Calendar, Clock, Heart, Eye, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'

// ✅ CORREGIDO: Importar el enum correcto
import { Difficulty } from '@/types/product'

interface Product {
  id: string
  title: string
  description: string
  slug: string
  price: number
  category: string
  difficulty: string
  imageFileIds?: string | string[]
  rating: number
  downloadCount?: number
  tags?: string | string[]
  seller: {
    id: string
    firstName?: string
    lastName?: string
    sellerProfile?: {
      id: string
      storeName: string
      slug: string
      avatar?: string
      isVerified: boolean
    }
  }
  createdAt: string
}

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // ✅ CORREGIDO: Función para obtener el texto de dificultad
  const getDifficultyText = (difficulty: string) => {
    const difficultyMap: Record<string, string> = {
      'EASY': 'Fácil',
      'MEDIUM': 'Intermedio', 
      'HARD': 'Difícil',
      'EXPERT': 'Experto'
    }
    return difficultyMap[difficulty.toUpperCase()] || difficulty
  }

  // ✅ CORREGIDO: Función para obtener color de dificultad
  const getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      'EASY': 'bg-green-500',
      'MEDIUM': 'bg-yellow-500',
      'HARD': 'bg-orange-500', 
      'EXPERT': 'bg-red-500'
    }
    return colorMap[difficulty.toUpperCase()] || 'bg-gray-500'
  }

  // ✅ CORREGIDO: Manejo de imágenes
  const getProductImages = () => {
    if (!product.imageFileIds) return []
    
    if (typeof product.imageFileIds === 'string') {
      try {
        // Si es un string JSON
        const parsed = JSON.parse(product.imageFileIds)
        return Array.isArray(parsed) ? parsed : [product.imageFileIds]
      } catch {
        // Si es un string simple
        return product.imageFileIds.split(',').filter(id => id.trim())
      }
    }
    
    if (Array.isArray(product.imageFileIds)) {
      return product.imageFileIds
    }
    
    return []
  }

  const productImages = getProductImages()
  const hasImages = productImages.length > 0

  // ✅ CORREGIDO: Información del seller
  const sellerInfo = {
    name: product.seller?.sellerProfile?.storeName || 
          `${product.seller?.firstName || ''} ${product.seller?.lastName || ''}`.trim() || 
          'Vendedor',
    slug: product.seller?.sellerProfile?.slug || '',
    avatar: product.seller?.sellerProfile?.avatar,
    isVerified: product.seller?.sellerProfile?.isVerified || false
  }

  // ✅ CORREGIDO: Función para obtener tags como array
  const getTagsArray = () => {
    if (!product.tags) return []
    
    if (typeof product.tags === 'string') {
      try {
        const parsed = JSON.parse(product.tags)
        return Array.isArray(parsed) ? parsed : product.tags.split(',').filter(tag => tag.trim())
      } catch {
        return product.tags.split(',').filter(tag => tag.trim())
      }
    }
    
    if (Array.isArray(product.tags)) {
      return product.tags
    }
    
    return []
  }

  const tagsArray = getTagsArray()

  return (
    <div 
      className={`bg-white border-[4px] border-black hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300 group ${className}`}
      style={{ boxShadow: '8px 8px 0 #000000' }}
    >
      {/* Imagen del producto */}
      <div className="relative h-48 overflow-hidden border-b-[4px] border-black">
        {hasImages ? (
          <div className="relative h-full">
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/image/${productImages[currentImageIndex]}`}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement
                target.src = '/images/placeholder-product.jpg'
              }}
            />
            
            {/* Navegación de imágenes */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : productImages.length - 1)
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentImageIndex(prev => prev < productImages.length - 1 ? prev + 1 : 0)
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  →
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="text-6xl">📐</div>
          </div>
        )}

        {/* Badge de dificultad */}
        <div className="absolute top-2 left-2">
          <span 
            className={`${getDifficultyColor(product.difficulty)} text-white text-xs font-bold px-2 py-1 border-2 border-black`}
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            {getDifficultyText(product.difficulty)}
          </span>
        </div>

        {/* Botón de favorito */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsLiked(!isLiked)
          }}
          className={`absolute top-2 right-2 p-2 border-2 border-black transition-all ${
            isLiked ? 'bg-red-500 text-white' : 'bg-white text-black'
          }`}
          style={{ boxShadow: '2px 2px 0 #000000' }}
        >
          <Heart size={16} fill={isLiked ? 'white' : 'none'} />
        </button>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Título y descripción */}
        <Link href={`/productos/${product.slug}`} className="block mb-3">
          <h3 className="font-black text-lg uppercase text-black mb-2 line-clamp-2 hover:text-orange-500 transition-colors">
            {product.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {product.description}
          </p>
        </Link>

        {/* Información del seller */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-orange-500 border-2 border-black rounded-full flex items-center justify-center">
            {sellerInfo.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/image/${sellerInfo.avatar}`}
                alt={sellerInfo.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User size={12} className="text-black" />
            )}
          </div>
          
          <Link 
            href={sellerInfo.slug ? `/vendedores/${sellerInfo.slug}` : '#'}
            className="text-xs text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-1"
          >
            <span>Por: {sellerInfo.name}</span>
            {sellerInfo.isVerified && (
              <span className="text-green-500 text-xs">✓</span>
            )}
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-500" fill="currentColor" />
            <span className="font-bold">{product.rating?.toFixed(1) || '4.5'}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Download size={12} />
            <span>{product.downloadCount || 0}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{new Date(product.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Tags */}
        {tagsArray.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tagsArray.slice(0, 3).map((tag, index) => (
              <span
                key={`${product.id}-tag-${index}`}
                className="bg-blue-200 text-black text-xs font-bold px-2 py-1 border border-black"
                style={{ boxShadow: '1px 1px 0 #000000' }}
              >
                #{typeof tag === 'string' ? tag.trim() : tag}
              </span>
            ))}
            
            {tagsArray.length > 3 && (
              <span className="text-black font-bold text-xs px-2 py-1">
                +{tagsArray.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Precio y botones */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-orange-500">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 block">USD</span>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/productos/${product.slug}`}>
              <Button variant="outline" size="sm">
                <Eye size={14} />
              </Button>
            </Link>
          </div>
        </div>

        {/* ✅ Botón de agregar al carrito */}
        <div className="mt-4">
          <AddToCartButton 
            productId={product.id}
            variant="primary"
            size="default"
            className="w-full"
          >
            🛒 Agregar al Carrito
          </AddToCartButton>
        </div>
      </div>
    </div>
  )
}