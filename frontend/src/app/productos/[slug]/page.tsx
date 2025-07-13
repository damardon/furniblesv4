'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  StarIcon, 
  HeartIcon, 
  ShoppingCartIcon, 
  ClockIcon, 
  DownloadIcon, 
  CheckCircleIcon,
  ArrowLeftIcon,
  ShareIcon,
  TagIcon,
  WrenchIcon,
  PackageIcon,
  RulerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ZoomInIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon
} from 'lucide-react'
import { Product, Difficulty, ProductCategory } from '@/types'
import { useCartStore } from '@/lib/stores/cart-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getProductBySlug, mockProducts } from '@/data/mockProducts'
import { ProductCard } from '@/components/products/product-card'

interface ProductDetailPageProps {
  params: {
    slug: string
  }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const t = useTranslations('products')
  const [product, setProduct] = useState<Product | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  
  // Stores
  const { addItem } = useCartStore()
  const { isAuthenticated, setLoginModalOpen } = useAuthStore()

  useEffect(() => {
    const foundProduct = getProductBySlug(params.slug)
    if (!foundProduct) {
      notFound()
    }
    setProduct(foundProduct)

    // Productos relacionados (misma categoría, excluyendo el actual)
    const related = mockProducts
      .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
      .slice(0, 3)
    setRelatedProducts(related)
  }, [params.slug])

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🪵</div>
          <p className="text-black font-black text-xl uppercase">Cargando producto...</p>
        </div>
      </div>
    )
  }

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.EASY:
        return 'bg-green-500 text-black border-4 border-black'
      case Difficulty.INTERMEDIATE:
        return 'bg-yellow-400 text-black border-4 border-black'
      case Difficulty.ADVANCED:
        return 'bg-orange-500 text-black border-4 border-black'
      default:
        return 'bg-gray-400 text-black border-4 border-black'
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
    }
    
    return `${colors[category]} text-black border-4 border-black`
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
      month: 'long',
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
      // TODO: Mostrar toast de éxito
    } catch (error) {
      console.error('Error adding to cart:', error)
      // TODO: Mostrar toast de error
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex(prev => 
        prev === 0 ? product.previewImages.length - 1 : prev - 1
      )
    } else {
      setCurrentImageIndex(prev => 
        prev === product.previewImages.length - 1 ? 0 : prev + 1
      )
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      })
    } else {
      // Fallback: copiar al clipboard
      navigator.clipboard.writeText(window.location.href)
      // TODO: Mostrar toast de copiado
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-yellow-400 border-b-4 border-black p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 text-black font-black text-sm uppercase">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/productos" className="hover:text-orange-500 transition-colors">
              Productos
            </Link>
            <span>/</span>
            <span className="text-orange-500">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Botón volver */}
        <div className="mb-6">
          <Link 
            href="/productos"
            className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver al Catálogo
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Galería de Imágenes */}
          <div className="space-y-4">
            {/* Imagen Principal */}
            <div className="relative aspect-square border-6 border-black overflow-hidden bg-gradient-to-br from-orange-200 to-yellow-200">
              {product.previewImages.length > 0 ? (
                <Image
                  src={product.previewImages[currentImageIndex]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🪵</div>
                    <p className="text-black font-black text-xl uppercase">Sin Imagen</p>
                  </div>
                </div>
              )}

              {/* Navegación de imágenes */}
              {product.previewImages.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageNavigation('prev')}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white p-2 hover:bg-black transition-all"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleImageNavigation('next')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white p-2 hover:bg-black transition-all"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Botón zoom */}
              <button
                onClick={() => setShowImageModal(true)}
                className="absolute top-4 right-4 bg-white border-2 border-black p-2 hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <ZoomInIcon className="w-5 h-5 text-black" />
              </button>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.featured && (
                  <span 
                    className="bg-orange-500 text-black text-xs font-black px-3 py-1 border-2 border-black uppercase"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    Destacado
                  </span>
                )}
                {(() => {
                  const publishedDate = new Date(product.publishedAt || product.createdAt)
                  const daysDiff = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))
                  return daysDiff <= 7 ? (
                    <span 
                      className="bg-green-500 text-black text-xs font-black px-3 py-1 border-2 border-black uppercase"
                      style={{ boxShadow: '2px 2px 0 #000000' }}
                    >
                      Nuevo
                    </span>
                  ) : null
                })()}
              </div>

              {/* Indicador de imágenes */}
              {product.previewImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {product.previewImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 border-2 border-black transition-all ${
                        index === currentImageIndex ? 'bg-orange-500' : 'bg-white'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {product.previewImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.previewImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square border-4 overflow-hidden transition-all ${
                      index === currentImageIndex 
                        ? 'border-orange-500' 
                        : 'border-black hover:border-yellow-400'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} - imagen ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del Producto */}
          <div className="space-y-6">
            {/* Título y Rating */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-black mb-4 uppercase">
                {product.title}
              </h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <StarIcon className="w-5 h-5 fill-orange-500 text-orange-500" />
                  <span className="text-lg font-black text-black">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-600 font-bold">
                    ({product.reviewCount} reviews)
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" />
                    <span className="font-bold">{formatNumber(product.viewCount)} vistas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DownloadIcon className="w-4 h-4" />
                    <span className="font-bold">{formatNumber(product.downloadCount)} descargas</span>
                  </div>
                </div>
              </div>

              {/* Precio */}
              <div className="flex items-center justify-between mb-6">
                <div 
                  className="bg-yellow-400 border-4 border-black px-6 py-3"
                  style={{ boxShadow: '6px 6px 0 #000000' }}
                >
                  <span className="text-3xl font-black text-black">
                    {formatPrice(product.price)}
                  </span>
                </div>
                
                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-3 bg-white border-4 border-black hover:bg-yellow-400 transition-all"
                    style={{ boxShadow: '4px 4px 0 #000000' }}
                  >
                    <HeartIcon 
                      className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-black'}`} 
                    />
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="p-3 bg-white border-4 border-black hover:bg-yellow-400 transition-all"
                    style={{ boxShadow: '4px 4px 0 #000000' }}
                  >
                    <ShareIcon className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>
            </div>

            {/* Metadatos */}
            <div className="flex flex-wrap gap-3">
              <span 
                className={`${getDifficultyBadge(product.difficulty)} text-sm font-black px-3 py-2 uppercase`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <WrenchIcon className="w-4 h-4 inline mr-1" />
                {product.difficulty}
              </span>
              
              <span 
                className={`${getCategoryBadge(product.category)} text-sm font-black px-3 py-2 uppercase`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <TagIcon className="w-4 h-4 inline mr-1" />
                {product.category}
              </span>
              
              {product.estimatedTime && (
                <span 
                  className="bg-blue-400 text-black border-4 border-black text-sm font-black px-3 py-2 uppercase"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  {product.estimatedTime}
                </span>
              )}
            </div>

            {/* Descripción */}
            <div 
              className="bg-gray-100 border-4 border-black p-6"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <h3 className="text-xl font-black text-black mb-3 uppercase">Descripción</h3>
              <p className="text-black leading-relaxed font-medium">
                {product.description}
              </p>
            </div>

            {/* Información del Vendedor */}
            <div 
              className="bg-orange-100 border-4 border-black p-6"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <h3 className="text-xl font-black text-black mb-4 uppercase flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Vendedor
              </h3>
              
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-orange-500 border-4 border-black flex items-center justify-center text-black text-xl font-black">
                  {product.seller.firstName?.charAt(0) || 'U'}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-black text-black uppercase">
                      {product.seller.sellerProfile?.storeName || `${product.seller.firstName} ${product.seller.lastName}`}
                    </h4>
                    {product.seller.sellerProfile?.isVerified && (
                      <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-4 h-4 fill-orange-500 text-orange-500" />
                      <span className="text-sm font-black text-black">
                        {product.seller.sellerProfile?.rating.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 font-bold">
                      {product.seller.sellerProfile?.totalSales || 0} ventas
                    </span>
                  </div>
                  
                  {product.seller.sellerProfile?.description && (
                    <p className="text-sm text-black font-medium">
                      {product.seller.sellerProfile.description}
                    </p>
                  )}
                  
                  {product.seller.sellerProfile?.website && (
                    <a 
                      href={product.seller.sellerProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 font-bold hover:text-blue-800 transition-colors"
                    >
                      Visitar tienda →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de Compra Principal */}
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="w-full bg-green-500 border-6 border-black font-black text-black text-xl uppercase py-4 hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '6px 6px 0 #000000' }}
            >
              <ShoppingCartIcon className="w-6 h-6 inline mr-3" />
              {isAddingToCart ? 'Agregando...' : 'Agregar al Carrito'}
            </button>

            {/* Fecha de publicación */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4" />
              <span className="font-bold">
                Publicado el {formatDate(product.publishedAt || product.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Información Técnica */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Herramientas Requeridas */}
          <div 
            className="bg-blue-100 border-4 border-black p-6"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <h3 className="text-xl font-black text-black mb-4 uppercase flex items-center gap-2">
              <WrenchIcon className="w-5 h-5" />
              Herramientas
            </h3>
            <ul className="space-y-2">
              {product.toolsRequired.map((tool, index) => (
                <li key={index} className="flex items-center gap-2 text-black font-medium">
                  <span className="w-2 h-2 bg-black"></span>
                  {tool}
                </li>
              ))}
            </ul>
          </div>

          {/* Materiales */}
          <div 
            className="bg-green-100 border-4 border-black p-6"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <h3 className="text-xl font-black text-black mb-4 uppercase flex items-center gap-2">
              <PackageIcon className="w-5 h-5" />
              Materiales
            </h3>
            <ul className="space-y-2">
              {product.materials.map((material, index) => (
                <li key={index} className="flex items-center gap-2 text-black font-medium">
                  <span className="w-2 h-2 bg-black"></span>
                  {material}
                </li>
              ))}
            </ul>
          </div>

          {/* Dimensiones y Tags */}
          <div className="space-y-6">
            {/* Dimensiones */}
            {product.dimensions && (
              <div 
                className="bg-yellow-100 border-4 border-black p-6"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                <h3 className="text-xl font-black text-black mb-3 uppercase flex items-center gap-2">
                  <RulerIcon className="w-5 h-5" />
                  Dimensiones
                </h3>
                <p className="text-black font-bold text-lg">
                  {product.dimensions}
                </p>
              </div>
            )}

            {/* Tags */}
            <div 
              className="bg-purple-100 border-4 border-black p-6"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <h3 className="text-xl font-black text-black mb-3 uppercase">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-white text-black text-sm font-bold px-3 py-1 border-2 border-black"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Productos Relacionados */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-black text-black mb-8 uppercase text-center">
              Productos Relacionados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Imagen Ampliada */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={product.previewImages[currentImageIndex]}
              alt={product.title}
              width={800}
              height={600}
              className="object-contain max-h-full"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white text-black p-2 font-black text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}