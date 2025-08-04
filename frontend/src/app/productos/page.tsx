'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  Eye, 
  Download, 
  Package,
  SlidersHorizontal 
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
  dimensions: string
  rating: number
  reviewCount: number
  viewCount: number
  downloadCount: number
  favoriteCount: number
  featured: boolean
  createdAt: string
  publishedAt: string
  seller: {
    id: string
    avatar?: string | null
  }
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

interface ProductFilters {
  q?: string
  category?: string
  difficulty?: string
  priceMin?: number
  priceMax?: number
  tags?: string
  sortBy?: string
  page?: number
  limit?: number
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    sortBy: 'newest'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const t = useTranslations('products')
  const tCommon = useTranslations('common')

  // ✅ Función para cargar productos desde el API real
  const loadProducts = async (newFilters?: ProductFilters) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const currentFilters = { ...filters, ...newFilters }
      console.log('🔍 [FRONTEND] Loading products with filters:', currentFilters)
      
      // Construir query string
      const queryParams = new URLSearchParams()
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      console.log('🔍 [FRONTEND] Products API response status:', response.status)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: ProductsResponse = await response.json()
      console.log('✅ [FRONTEND] Products loaded:', data.data.length)
      
      setProducts(data.data)
      setTotalProducts(data.total)
      setTotalPages(data.totalPages)
      setFilters(currentFilters)
    } catch (error) {
      console.error('❌ [FRONTEND] Error loading products:', error)
      setError(error instanceof Error ? error.message : 'Error loading products')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts()
  }, [])

  // Manejar cambios de filtros
  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 } // Reset a página 1
    loadProducts(updatedFilters)
  }

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page }
    loadProducts(newFilters)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const renderProductCard = (product: Product) => (
    <div
      key={product.id}
      className="bg-white border-[4px] border-black transition-all duration-300 group hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[11px_11px_0_#000000] h-full flex flex-col"
      style={{ boxShadow: '8px 8px 0 #000000' }}
    >
      <Link href={`/productos/${product.slug}`}>
        {/* Imagen del producto */}
        <div className="relative aspect-square overflow-hidden border-b-4 border-black">
          {product.thumbnailFileIds && JSON.parse(product.thumbnailFileIds).length > 0 ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/thumbnail/${JSON.parse(product.thumbnailFileIds)[0]}`}
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
            {(() => {
              const publishedDate = new Date(product.publishedAt || product.createdAt)
              const daysDiff = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))
              return daysDiff <= 7 ? (
                <span 
                  className="bg-green-500 text-black text-xs font-black px-2 py-1 border-2 border-black uppercase"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  Nuevo
                </span>
              ) : null
            })()}
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
          <div className="text-xs text-gray-600 font-bold mb-3">
            ⏱️ {product.estimatedTime}
          </div>

          {/* Dimensiones */}
          {product.dimensions && (
            <div className="text-xs text-gray-600 font-bold">
              📏 {product.dimensions}
            </div>
          )}
        </div>
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header SABDA style */}
      <div 
        className="bg-gradient-to-br from-blue-200 to-cyan-200 border-[5px] border-black py-16 mb-12 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
        style={{ boxShadow: '8px 8px 0 #000000' }}
      >
        <div className="text-center max-w-7xl mx-auto px-4">
          <div 
            className="bg-orange-500 text-black inline-block mb-6 px-4 py-2 border-3 border-black font-black text-sm uppercase tracking-wide"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            Marketplace Digital
          </div>
          <h1 className="text-black mb-6 font-black text-6xl leading-tight uppercase">
            Catálogo de Productos
          </h1>
          <p className="text-black font-bold text-xl max-w-2xl mx-auto">
            Descubre increíbles diseños de muebles para crear con tus propias manos
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barra de búsqueda y filtros */}
        <div 
          className="bg-white border-[5px] border-black p-8 mb-12 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={filters.q || ''}
                onChange={(e) => handleFilterChange({ q: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3">
              {/* Filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border-2 border-black font-bold bg-white hover:bg-yellow-400 transition-all flex items-center gap-2"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
              </button>

              {/* Ordenar */}
              <select
                value={filters.sortBy || 'newest'}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                className="px-3 py-2 border-2 border-black font-bold bg-white focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="rating">Mejor valorados</option>
                <option value="popular">Más populares</option>
              </select>

              {/* Vista */}
              <div className="flex border-2 border-black">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500' : 'bg-white'} border-r border-black`}
                  title="Vista de cuadrícula"
                >
                  <Grid3X3 className="w-4 h-4 text-black" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-orange-500' : 'bg-white'}`}
                  title="Vista de lista"
                >
                  <List className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          </div>

          {/* Panel de filtros avanzados */}
          {showFilters && (
            <div className="mt-6 bg-yellow-100 border-4 border-black p-6" style={{ boxShadow: '4px 4px 0 #000000' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-black text-black mb-2 uppercase">Categoría</label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
                    className="w-full px-3 py-2 border-2 border-black font-bold bg-white focus:outline-none"
                  >
                    <option value="">Todas</option>
                    <option value="LIVING_DINING">Sala/Comedor</option>
                    <option value="BEDROOM">Dormitorio</option>
                    <option value="OUTDOOR">Exterior</option>
                    <option value="STORAGE">Almacenamiento</option>
                    <option value="NORDIC">Nórdico</option>
                    <option value="DECORATIVE">Decorativo</option>
                    <option value="FURNITURE">Muebles</option>
                    <option value="BEDS">Camas</option>
                    <option value="OFFICE">Oficina</option>
                    <option value="BATHROOM">Baño</option>
                    <option value="KITCHEN">Cocina</option>
                  </select>
                </div>

                {/* Dificultad */}
                <div>
                  <label className="block text-sm font-black text-black mb-2 uppercase">Dificultad</label>
                  <select
                    value={filters.difficulty || ''}
                    onChange={(e) => handleFilterChange({ difficulty: e.target.value || undefined })}
                    className="w-full px-3 py-2 border-2 border-black font-bold bg-white focus:outline-none"
                  >
                    <option value="">Todas</option>
                    <option value="BEGINNER">Principiante</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                    <option value="EXPERT">Experto</option>
                  </select>
                </div>

                {/* Precio mínimo */}
                <div>
                  <label className="block text-sm font-black text-black mb-2 uppercase">Precio mín.</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={filters.priceMin || ''}
                    onChange={(e) => handleFilterChange({ priceMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border-2 border-black font-bold bg-white focus:outline-none"
                  />
                </div>

                {/* Precio máximo */}
                <div>
                  <label className="block text-sm font-black text-black mb-2 uppercase">Precio máx.</label>
                  <input
                    type="number"
                    placeholder="1000"
                    min="0"
                    step="0.01"
                    value={filters.priceMax || ''}
                    onChange={(e) => handleFilterChange({ priceMax: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border-2 border-black font-bold bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Botones de filtros */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setFilters({ page: 1, limit: 12, sortBy: 'newest' })
                    loadProducts({ page: 1, limit: 12, sortBy: 'newest' })
                  }}
                  className="bg-white border-2 border-black text-black font-black py-2 px-4 uppercase hover:bg-gray-100 transition-all"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex flex-wrap gap-3 items-center">
            <span 
              className="bg-yellow-400 text-black px-4 py-2 border-3 border-black font-black text-sm uppercase"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              {isLoading ? 'Cargando...' : `${totalProducts} productos encontrados`}
            </span>
            
            {error && (
              <span 
                className="bg-red-500 text-white px-4 py-2 border-3 border-black font-black text-sm uppercase"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                ⚠️ {error}
              </span>
            )}
          </div>

          {/* Info de página */}
          {!isLoading && totalPages > 1 && (
            <p className="text-gray-600 font-bold">
              Página {filters.page} de {totalPages}
            </p>
          )}
        </div>

        {/* Grid de productos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
              <p className="text-xl font-bold text-gray-600">Cargando productos...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div 
              className="bg-white border-[5px] border-black p-12 max-w-md mx-auto hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-black font-black text-2xl mb-4 uppercase">
                No se encontraron productos
              </h3>
              <p className="text-black font-medium">
                Intenta con filtros diferentes o busca otro término
              </p>
              <button
                onClick={() => {
                  setFilters({ page: 1, limit: 12, sortBy: 'newest' })
                  loadProducts({ page: 1, limit: 12, sortBy: 'newest' })
                }}
                className="mt-6 bg-orange-500 border-3 border-black font-black text-black text-sm uppercase px-6 py-3 hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12" 
              : "space-y-4 mb-12"
            }>
              {products.map(product => renderProductCard(product))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mb-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                  className="px-4 py-2 bg-white border-2 border-black font-black text-black uppercase hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  Anterior
                </button>

                {/* Números de página */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, filters.page! - 2)) + i
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border-2 border-black font-black uppercase transition-all ${
                        page === filters.page
                          ? 'bg-orange-500 text-black'
                          : 'bg-white text-black hover:bg-yellow-400'
                      }`}
                      style={{ boxShadow: '2px 2px 0 #000000' }}
                    >
                      {page}
                    </button>
                  )
                })}

                <button
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === totalPages}
                  className="px-4 py-2 bg-white border-2 border-black font-black text-black uppercase hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  Siguiente
                </button>
              </div>
            )}

            {/* Load more button SABDA style - opcional */}
            <div className="text-center">
              <div 
                className="bg-white border-3 border-black font-black text-black text-xl uppercase px-12 py-4 hover:bg-yellow-400 transition-all inline-block"
                style={{ boxShadow: '5px 5px 0 #000000' }}
              >
                ¡{totalProducts} productos disponibles!
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}