'use client'

import { useState, useEffect, use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  Star, 
  Eye, 
  Download, 
  Package,
  CheckCircle,
  ShoppingBag,
  TrendingUp,
  Calendar,
  MapPin,
  ArrowLeft,
  Heart,
  Share2,
  User
} from 'lucide-react'

// ✅ Types basados en tu API real
interface Seller {
  id: string
  userId: string
  storeName: string
  slug: string
  description?: string | null
  rating: number
  totalSales: number
  totalReviews: number
  isVerified: boolean
  avatar?: string | null
  banner?: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
    isActive: boolean
    createdAt: string
  }
}

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
  dimensions: string
  rating: number
  reviewCount: number
  viewCount: number
  downloadCount: number
  favoriteCount: number
  featured: boolean
  createdAt: string
  publishedAt: string
}

interface ProductsResponse {
  data: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface SellerPageProps {
  params: Promise<{
    slug: string
  }>
}

// ✅ Función corregida para obtener vendedor
async function getSellerBySlug(slug: string): Promise<Seller | null> {
  try {
    console.log('🔍 [FRONTEND] Fetching seller by slug:', slug)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers?slug=${slug}&limit=1`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    console.log('🔍 [FRONTEND] Seller response status:', response.status)

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ [FRONTEND] Seller response:', data)
    
    // Si viene paginado, tomar el primer resultado
    if (data.data && data.data.length > 0) {
      return data.data[0]
    }
    
    // Si viene directo el seller
    if (data.id) {
      return data
    }
    
    return null
  } catch (error) {
    console.error('❌ [FRONTEND] Error fetching seller:', error)
    return null
  }
}

// ✅ Función corregida para obtener productos del vendedor
async function getSellerProducts(sellerId: string, page = 1, limit = 12): Promise<ProductsResponse | null> {
  try {
    console.log('🔍 [FRONTEND] Fetching seller products:', sellerId)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?sellerId=${sellerId}&page=${page}&limit=${limit}&status=APPROVED`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    console.log('🔍 [FRONTEND] Products response status:', response.status)

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ [FRONTEND] Products data received:', data)
    return data
  } catch (error) {
    console.error('❌ [FRONTEND] Error fetching seller products:', error)
    return null
  }
}

export default function SellerPage({ params }: SellerPageProps) {
  // ✅ Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  
  const t = useTranslations('seller')
  const tCommon = useTranslations('common')
  const tProducts = useTranslations('products')
  
  const [seller, setSeller] = useState<Seller | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productsTotal, setProductsTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const loadSellerData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const sellerData = await getSellerBySlug(resolvedParams.slug)
        
        if (!sellerData) {
          notFound()
          return
        }
        
        setSeller(sellerData)
        
        // Cargar productos del vendedor
        setProductsLoading(true)
        const productsData = await getSellerProducts(sellerData.id)
        
        if (productsData) {
          setProducts(productsData.data)
          setProductsTotal(productsData.total)
        }
      } catch (err) {
        console.error('Error loading seller:', err)
        setError(err instanceof Error ? err.message : 'Error loading seller')
      } finally {
        setIsLoading(false)
        setProductsLoading(false)
      }
    }

    loadSellerData()
  }, [resolvedParams.slug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-black font-black text-xl uppercase">Cargando tienda...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-black text-xl uppercase mb-4">Error: {error}</p>
          <Link 
            href="/vendedores"
            className="bg-orange-500 border-4 border-black text-black font-black py-2 px-4 uppercase hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            Volver a vendedores
          </Link>
        </div>
      </div>
    )
  }

  if (!seller) {
    return notFound()
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
      month: 'long'
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500'
      case 'intermediate': return 'bg-yellow-400'
      case 'advanced': return 'bg-orange-500'
      case 'expert': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getCategoryColor = (category: string) => {
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
    return colors[category] || 'bg-gray-400'
  }

  const renderProductCard = (product: Product) => {
    const thumbnails = product.thumbnailFileIds ? JSON.parse(product.thumbnailFileIds) : []
    
    return (
      <div
        key={product.id}
        className="bg-white border-[4px] border-black transition-all duration-300 group hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[11px_11px_0_#000000] h-full flex flex-col"
        style={{ boxShadow: '8px 8px 0 #000000' }}
      >
        <Link href={`/productos/${product.slug}`}>
          {/* Imagen del producto */}
          <div className="relative aspect-square overflow-hidden border-b-4 border-black">
            {thumbnails.length > 0 ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/thumbnail/${thumbnails[0]}`}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">🪵</div>
                  <p className="text-black font-black text-sm uppercase">Sin imagen</p>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.featured && (
                <span 
                  className="bg-orange-500 text-black text-xs font-black px-2 py-1 border-2 border-black uppercase"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  Destacado
                </span>
              )}
            </div>

            {/* Stats overlay */}
            <div className="absolute bottom-3 right-3 flex gap-2">
              <div className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatNumber(product.viewCount)}
              </div>
              <div className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <Download className="w-3 h-3" />
                {formatNumber(product.downloadCount)}
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col flex-1">
            {/* Título */}
            <h3 className="font-black text-lg text-black mb-2 line-clamp-2 uppercase leading-tight">
              {product.title}
            </h3>

            {/* Descripción */}
            <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">
              {product.description}
            </p>

            {/* Badges de categoría y dificultad */}
            <div className="flex gap-2 mb-3">
              <span 
                className={`text-xs font-black px-2 py-1 uppercase text-black border-2 border-black ${getCategoryColor(product.category)}`}
              >
                {product.category}
              </span>
              <span 
                className={`text-xs font-black px-2 py-1 uppercase text-black border-2 border-black ${getDifficultyColor(product.difficulty)}`}
              >
                {product.difficulty}
              </span>
            </div>

            {/* Precio y rating */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-2xl font-black text-green-600">
                {formatPrice(product.price)}
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span className="font-black text-black">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-600">({product.reviewCount})</span>
              </div>
            </div>

            {/* Tiempo estimado */}
            <div className="text-xs text-gray-600 font-bold">
              ⏱️ {product.estimatedTime}
            </div>
          </div>
        </Link>
      </div>
    )
  }

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
            <Link href="/vendedores" className="hover:text-orange-500 transition-colors">
              Vendedores
            </Link>
            <span>/</span>
            <span className="text-orange-500 truncate">{seller.storeName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Botón volver */}
        <div className="mb-6">
          <Link 
            href="/vendedores"
            className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a vendedores
          </Link>
        </div>

        {/* Header de la tienda */}
        <div 
          className="bg-gradient-to-br from-blue-200 to-cyan-200 border-[5px] border-black p-8 mb-8 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar de la tienda */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 border-4 border-black overflow-hidden bg-orange-500">
                {seller.avatar || seller.user.avatar ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/image/${seller.avatar || seller.user.avatar}`}
                    alt={seller.storeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-black" />
                  </div>
                )}
              </div>
              {seller.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 border-3 border-black p-2 rounded-sm">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Info de la tienda */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-black uppercase">
                      {seller.storeName}
                    </h1>
                    {seller.isVerified && (
                      <span 
                        className="bg-blue-500 text-white text-sm font-black px-3 py-1 border-2 border-black uppercase"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        ✓ Verificado
                      </span>
                    )}
                  </div>
                  <p className="text-black font-bold mb-2">
                    Por {seller.user.firstName} {seller.user.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span className="font-bold">
                      Miembro desde {formatDate(seller.user.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-3">
                  <button
                    className="p-3 border-2 border-black bg-white text-black hover:bg-yellow-400 transition-all"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                    title="Agregar a favoritos"
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                  
                  <button
                    className="p-3 border-2 border-black bg-white text-black hover:bg-yellow-400 transition-all"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                    title="Compartir tienda"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Descripción */}
              {seller.description && (
                <p className="text-black font-medium mb-4 text-lg">
                  {seller.description}
                </p>
              )}

              {/* Estadísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white border-3 border-black" style={{ boxShadow: '3px 3px 0 #000000' }}>
                  <div className="text-2xl font-black text-blue-600 mb-1">{productsTotal}</div>
                  <div className="text-sm font-black text-black uppercase">Productos</div>
                </div>
                <div className="text-center p-4 bg-white border-3 border-black" style={{ boxShadow: '3px 3px 0 #000000' }}>
                  <div className="text-2xl font-black text-green-600 mb-1">{seller.rating.toFixed(1)}</div>
                  <div className="text-sm font-black text-black uppercase">Rating</div>
                </div>
                <div className="text-center p-4 bg-white border-3 border-black" style={{ boxShadow: '3px 3px 0 #000000' }}>
                  <div className="text-2xl font-black text-purple-600 mb-1">{seller.totalReviews}</div>
                  <div className="text-sm font-black text-black uppercase">Reviews</div>
                </div>
                <div className="text-center p-4 bg-white border-3 border-black" style={{ boxShadow: '3px 3px 0 #000000' }}>
                  <div className="text-2xl font-black text-orange-600 mb-1">{formatNumber(seller.totalSales)}</div>
                  <div className="text-sm font-black text-black uppercase">Ventas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productos de la tienda */}
        <div 
          className="bg-white border-[5px] border-black p-8 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black uppercase flex items-center gap-3">
              <Package className="w-8 h-8 text-orange-500" />
              Productos ({productsTotal})
            </h2>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
                <p className="text-xl font-bold text-gray-600">Cargando productos...</p>
              </div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map(product => renderProductCard(product))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div 
                className="bg-gray-100 border-[5px] border-black p-12 max-w-md mx-auto hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
                style={{ boxShadow: '8px 8px 0 #000000' }}
              >
                <div className="text-8xl mb-6">📦</div>
                <h3 className="text-black font-black text-2xl mb-4 uppercase">
                  Sin productos
                </h3>
                <p className="text-black font-medium">
                  Este vendedor aún no tiene productos publicados o están pendientes de aprobación.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}