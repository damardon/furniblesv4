'use client'

import { useState, useEffect, use } from 'react'
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
  EyeIcon,
  StoreIcon
} from 'lucide-react'

// ✅ Types basados en tu API real
interface Product {
  id: string
  title: string
  description: string
  slug: string
  price: number
  category: string
  difficulty: string
  status: string
  imageFileIds: string
  thumbnailFileIds: string
  tags: string
  estimatedTime: string
  toolsRequired: string
  materials: string
  dimensions: string
  specifications: any
  rating: number
  reviewCount: number
  viewCount: number
  downloadCount: number
  favoriteCount: number
  featured: boolean
  createdAt: string
  publishedAt: string
  sellerId: string
  seller: {
    id: string
    firstName: string
    avatar?: string | null
    createdAt: string
    lastName: string
    email: string
    sellerProfile: {
      id: string
      storeName: string
      slug: string
      description: string
      avatar?: string | null
      isVerified: boolean
      createdAt: string
    }
  }
}

// ✅ Updated interface for Next.js 15+ params
interface ProductDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

// ✅ Función para obtener producto desde API real
async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    console.log('🔍 [FRONTEND] Fetching product:', slug)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/slug/${slug}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    console.log('🔍 [FRONTEND] Product response status:', response.status)

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const product = await response.json()
    console.log('✅ [FRONTEND] Product data received:', product)
    
    // ✅ Obtener información completa del seller
    if (product.sellerId && !product.seller?.storeName) {
      try {
        const sellerResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/id/${product.sellerId}`, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
        
        if (sellerResponse.ok) {
          const sellerData = await sellerResponse.json()
          product.seller = { ...product.seller, ...sellerData }
          console.log('✅ [FRONTEND] Seller data added:', sellerData)
        }
      } catch (sellerError) {
        console.warn('⚠️ [FRONTEND] Could not fetch seller data:', sellerError)
      }
    }
    
    return product
  } catch (error) {
    console.error('❌ [FRONTEND] Error fetching product:', error)
    return null
  }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  // ✅ Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  
  const t = useTranslations('product_detail')
  const tCommon = useTranslations('common')
  const tProducts = useTranslations('products')
  
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

    useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        console.log('🔍 [FRONTEND] Fetching product:', resolvedParams.slug)
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/slug/${resolvedParams.slug}`, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            notFound()
            return
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const product = await response.json()
        console.log('✅ [FRONTEND] Product data received:', product)
        setProduct(product)
      } catch (err) {
        console.error('Error loading product:', err)
        setError(err instanceof Error ? err.message : 'Error loading product')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [resolvedParams.slug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-black font-black text-xl uppercase">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-black text-xl uppercase mb-4">Error: {error}</p>
          <Link 
            href="/productos"
            className="bg-orange-500 border-4 border-black text-black font-black py-2 px-4 uppercase hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  if (!product) {
    return notFound()
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500 text-black border-4 border-black'
      case 'intermediate':
        return 'bg-yellow-400 text-black border-4 border-black'
      case 'advanced':
        return 'bg-orange-500 text-black border-4 border-black'
      case 'expert':
        return 'bg-red-500 text-black border-4 border-black'
      default:
        return 'bg-gray-400 text-black border-4 border-black'
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors: { [key: string]: string } = {
      'LIVING_DINING': 'bg-blue-400',
      'BEDROOM': 'bg-purple-400', 
      'OUTDOOR': 'bg-green-400',
      'STORAGE': 'bg-yellow-400',
      'NORDIC': 'bg-cyan-400',
      'DECORATIVE': 'bg-pink-400',
      'FURNITURE': 'bg-orange-400',
      'BEDS': 'bg-red-400',
      'OFFICE': 'bg-indigo-400',
      'BATHROOM': 'bg-teal-400',
      'KITCHEN': 'bg-lime-400',
    }
    
    return `${colors[category] || 'bg-gray-400'} text-black border-4 border-black`
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

  const parseJsonField = (field: string): any[] => {
    try {
      return JSON.parse(field || '[]')
    } catch {
      return []
    }
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    try {
      // TODO: Implementar lógica de carrito real
      console.log('Adding to cart:', product.id)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular API call
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
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
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Parsear arrays de JSON
  const tags = parseJsonField(product.tags)
  const tools = parseJsonField(product.toolsRequired)
  const materials = parseJsonField(product.materials)
  const images = parseJsonField(product.imageFileIds)
  const thumbnails = parseJsonField(product.thumbnailFileIds)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-yellow-400 border-b-4 border-black p-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-black font-black text-sm uppercase">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/productos" className="hover:text-orange-500 transition-colors">
              Productos
            </Link>
            <span>/</span>
            <span className="text-orange-500 truncate">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Botón volver */}
        <div className="mb-6">
          <Link 
            href="/productos"
            className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver al catálogo
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Galería de Imágenes */}
          <div className="space-y-4">
            {/* Imagen Principal */}
            <div 
              className="relative aspect-square border-6 border-black overflow-hidden bg-gradient-to-br from-orange-200 to-yellow-200 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              {thumbnails.length > 0 ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/image/${thumbnails[currentImageIndex]}`}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🪵</div>
                    <p className="text-black font-black text-xl uppercase">Sin imagen</p>
                  </div>
                </div>
              )}

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

              {/* Stats overlay */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <div className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <EyeIcon className="w-3 h-3" />
                  {formatNumber(product.viewCount)}
                </div>
                <div className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <DownloadIcon className="w-3 h-3" />
                  {formatNumber(product.downloadCount)}
                </div>
              </div>
            </div>
          </div>

          {/* Información del Producto */}
          <div className="space-y-6">
            {/* Título y Rating */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-black mb-4 uppercase leading-tight">
                {product.title}
              </h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <StarIcon className="w-5 h-5 fill-orange-500 text-orange-500" />
                  <span className="text-lg font-black text-black">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-600 font-bold">
                    ({product.reviewCount} reseñas)
                  </span>
                </div>
                
                <div className="flex items-center gap-4 ml-auto">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-2 border-2 border-black transition-all ${
                      isFavorite ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-yellow-400'
                    }`}
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <HeartIcon className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="p-2 border-2 border-black bg-white text-black hover:bg-yellow-400 transition-all"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Badges de categoría y dificultad */}
              <div className="flex gap-3 mb-6">
                <span 
                  className={`text-sm font-black px-3 py-1 uppercase ${getCategoryBadge(product.category)}`}
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  {product.category}
                </span>
                <span 
                  className={`text-sm font-black px-3 py-1 uppercase ${getDifficultyBadge(product.difficulty)}`}
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  {product.difficulty}
                </span>
              </div>
            </div>

            {/* Precio */}
            <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '4px 4px 0 #000000' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl font-black text-green-600">
                  {formatPrice(product.price)}
                </span>
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-bold">Descarga instantánea</p>
                  <p className="text-xs text-gray-500">Archivos digitales</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="bg-orange-500 border-4 border-black text-black font-black py-3 px-4 uppercase hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      Agregando...
                    </>
                  ) : (
                    <>
                      <ShoppingCartIcon className="w-5 h-5" />
                      Agregar al carrito
                    </>
                  )}
                </button>
                
                <button className="bg-blue-500 border-4 border-black text-black font-black py-3 px-4 uppercase hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  <DownloadIcon className="w-5 h-5" />
                  Comprar ahora
                </button>
              </div>
            </div>

            {/* ✅ Info del vendedor - CON ENLACE AL FRONTSTORE */}
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 border-4 border-black p-6 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300" style={{ boxShadow: '6px 6px 0 #000000' }}>
  <h3 className="text-xl font-black text-black mb-4 uppercase flex items-center gap-2">
    <StoreIcon className="w-5 h-5" />
    Información del vendedor
  </h3>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-orange-500 border-3 border-black flex items-center justify-center" style={{ boxShadow: '3px 3px 0 #000000' }}>
        {product.seller?.sellerProfile?.avatar ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/image/${product.seller.sellerProfile.avatar}`}
            alt="Vendedor"
            className="w-full h-full object-cover"
          />
        ) : (
          <UserIcon className="w-8 h-8 text-black" />
        )}
      </div>
      <div>
        <p className="font-black text-black text-xl mb-1">
          {product.seller?.sellerProfile?.storeName || 
           `${product.seller?.firstName || ''} ${product.seller?.lastName || ''}`.trim() || 
           'Vendedor'}
        </p>
        <p className="text-sm text-gray-600 font-bold mb-2">
          📅 Publicado el {formatDate(product.publishedAt || product.createdAt)}
        </p>
        {product.seller?.sellerProfile?.description && (
          <p className="text-sm text-gray-700 max-w-md">
            {product.seller.sellerProfile.description}
          </p>
        )}
        {product.seller?.sellerProfile?.isVerified && (
          <div className="flex items-center gap-1 mt-2">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 font-bold uppercase">Verificado</span>
          </div>
        )}
      </div>
    </div>
    
    {/* ✅ ENLACE AL FRONTSTORE DEL VENDEDOR */}
    {product.seller?.sellerProfile?.slug && (
      <Link href={`/vendedores/${product.seller.sellerProfile.slug}`}>
        <button
          className="bg-orange-500 border-4 border-black text-black font-black py-3 px-6 uppercase hover:bg-yellow-400 transition-all flex items-center gap-2"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <StoreIcon className="w-5 h-5" />
          Ver Tienda
        </button>
      </Link>
    )}
  </div>
            </div>

            {/* Especificaciones técnicas */}
            <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '4px 4px 0 #000000' }}>
              <h3 className="text-xl font-black text-black mb-4 uppercase flex items-center gap-2">
                <RulerIcon className="w-5 h-5" />
                Especificaciones técnicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-black text-black text-sm uppercase">Tiempo estimado</p>
                    <p className="text-gray-600 font-bold">{product.estimatedTime}</p>
                  </div>
                </div>
                
                {product.dimensions && (
                  <div className="flex items-center gap-3">
                    <RulerIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-black text-black text-sm uppercase">Dimensiones</p>
                      <p className="text-gray-600 font-bold">{product.dimensions}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <EyeIcon className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-black text-black text-sm uppercase">Visualizaciones</p>
                    <p className="text-gray-600 font-bold">{formatNumber(product.viewCount)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <DownloadIcon className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-black text-black text-sm uppercase">Descargas</p>
                    <p className="text-gray-600 font-bold">{formatNumber(product.downloadCount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción completa */}
        <div className="bg-white border-4 border-black p-8 mb-8" style={{ boxShadow: '4px 4px 0 #000000' }}>
          <h2 className="text-2xl font-black text-black mb-6 uppercase">
            Descripción del producto
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 font-medium leading-relaxed text-lg">
              {product.description}
            </p>
          </div>
        </div>

        {/* Tags, herramientas y materiales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '4px 4px 0 #000000' }}>
              <h3 className="text-lg font-black text-black mb-4 uppercase flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                Etiquetas
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="bg-yellow-400 text-black text-xs font-black px-2 py-1 border-2 border-black uppercase"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Herramientas */}
          {tools.length > 0 && (
            <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '4px 4px 0 #000000' }}>
              <h3 className="text-lg font-black text-black mb-4 uppercase flex items-center gap-2">
                <WrenchIcon className="w-5 h-5" />
                Herramientas
              </h3>
              <ul className="space-y-2">
                {tools.map((tool, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700 font-medium">{tool}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Materiales */}
          {materials.length > 0 && (
            <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '4px 4px 0 #000000' }}>
              <h3 className="text-lg font-black text-black mb-4 uppercase flex items-center gap-2">
                <PackageIcon className="w-5 h-5" />
                Materiales
              </h3>
              <ul className="space-y-2">
                {materials.map((material, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-700 font-medium">{material}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}