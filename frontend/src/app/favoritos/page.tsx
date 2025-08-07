'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { 
  HeartIcon,
  ArrowLeftIcon,
  FilterIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  TrendingUpIcon,
  TagIcon,
  WrenchIcon,
  DollarSignIcon,
  CalendarIcon,
  ShoppingCartIcon,
  EyeIcon,
  BarChartIcon
} from 'lucide-react'
import { ProductCategory, Difficulty } from '@/types'

// Helper para obtener token JWT
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  }
  return null
}

interface Product {
  id: string
  title: string
  slug: string
  price: number
  rating: number
  viewCount: number
  downloadCount: number
  category: ProductCategory
  difficulty: Difficulty
  description: string
  thumbnailFileIds?: string
  tags?: string | string[]
  seller?: {
    firstName?: string
    lastName?: string
    sellerProfile?: {
      storeName?: string
    }
  }
}

interface Favorite {
  id: string
  productId: string
  createdAt: string
  product: Product
}

interface FavoriteStats {
  totalFavorites: number
  byCategory: Record<string, number>
  byDifficulty: Record<string, number>
  byPriceRange: { under10: number; from10to20: number; from20to30: number; over30: number }
  recentlyAdded: number
}

export default function FavoritesPage() {
  const t = useTranslations('favorites')
  const tCommon = useTranslations('common')
  const tProducts = useTranslations('products')
  const router = useRouter()
  
  // States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([])
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'ALL'>('ALL')
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'ALL'>('ALL')
  const [filterPriceRange, setFilterPriceRange] = useState<'ALL' | 'under10' | '10-20' | '20-30' | 'over30'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [removingFavorites, setRemovingFavorites] = useState<Set<string>>(new Set())
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<FavoriteStats>({
    totalFavorites: 0,
    byCategory: {},
    byDifficulty: {},
    byPriceRange: { under10: 0, from10to20: 0, from20to30: 0, over30: 0 },
    recentlyAdded: 0
  })

  // Check authentication
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.push('/productos')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  // Load user favorites
  useEffect(() => {
    const loadUserFavorites = async () => {
      const token = getAuthToken()
      if (!token || !isAuthenticated) return

      setIsLoading(true)
      setError(null)

      try {
        // Cargar favoritos del usuario
        const favoritesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!favoritesResponse.ok) throw new Error('Error cargando favoritos')
        
        const favoritesData = await favoritesResponse.json()
        
        // Cargar estadísticas de favoritos
        const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        const statsData = statsResponse.ok ? await statsResponse.json() : {
          totalFavorites: favoritesData.length,
          byCategory: {},
          byDifficulty: {},
          byPriceRange: { under10: 0, from10to20: 0, from20to30: 0, over30: 0 },
          recentlyAdded: 0
        }

        // Cargar productos similares
        const similarResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites/similar?limit=6`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        const similarData = similarResponse.ok ? await similarResponse.json() : []

        setFavorites(favoritesData.favorites || favoritesData || [])
        setFilteredFavorites(favoritesData.favorites || favoritesData || [])
        setStats(statsData)
        setSimilarProducts(similarData.products || similarData || [])

      } catch (error) {
        console.error('Error loading favorites:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserFavorites()
  }, [isAuthenticated])

  // Filter and search favorites
  useEffect(() => {
    let filtered = [...favorites]

    // Filter by category
    if (filterCategory !== 'ALL') {
      filtered = filtered.filter(favorite => favorite.product.category === filterCategory)
    }

    // Filter by difficulty
    if (filterDifficulty !== 'ALL') {
      filtered = filtered.filter(favorite => favorite.product.difficulty === filterDifficulty)
    }

    // Filter by price range
    if (filterPriceRange !== 'ALL') {
      filtered = filtered.filter(favorite => {
        const price = favorite.product.price
        switch (filterPriceRange) {
          case 'under10': return price < 10
          case '10-20': return price >= 10 && price < 20
          case '20-30': return price >= 20 && price < 30
          case 'over30': return price >= 30
          default: return true
        }
      })
    }

    // Search by product name or seller
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(favorite => 
        favorite.product.title.toLowerCase().includes(query) ||
        favorite.product.seller?.sellerProfile?.storeName?.toLowerCase().includes(query) ||
        (() => {
          try {
            const tags = typeof favorite.product.tags === 'string' 
              ? JSON.parse(favorite.product.tags) 
              : favorite.product.tags || []
            return Array.isArray(tags) 
              ? tags.some((tag: string) => tag.toLowerCase().includes(query))
              : false
          } catch {
            return false
          }
        })()
      )
    }

    // Sort favorites
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'name':
          aValue = a.product.title.toLowerCase()
          bValue = b.product.title.toLowerCase()
          break
        case 'price':
          aValue = a.product.price
          bValue = b.product.price
          break
        case 'rating':
          aValue = a.product.rating
          bValue = b.product.rating
          break
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredFavorites(filtered)
  }, [favorites, filterCategory, filterDifficulty, filterPriceRange, searchQuery, sortBy, sortOrder])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const handleRemoveFavorite = async (productId: string) => {
    const token = getAuthToken()
    if (!token || removingFavorites.has(productId)) return

    setRemovingFavorites(prev => new Set(prev).add(productId))

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        // Actualizar la lista local
        setFavorites(prev => prev.filter(fav => fav.productId !== productId))
        // TODO: Mostrar toast de éxito
      } else {
        throw new Error('Error eliminando favorito')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
      setError(error instanceof Error ? error.message : 'Error eliminando favorito')
    } finally {
      setRemovingFavorites(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleAddToCart = async (productId: string) => {
    const token = getAuthToken()
    if (!token || addingToCart.has(productId)) return

    const favorite = favorites.find(fav => fav.productId === productId)
    if (!favorite) return

    setAddingToCart(prev => new Set(prev).add(productId))

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: productId,
          quantity: 1
        })
      })

      if (response.ok) {
        // TODO: Mostrar toast de éxito
      } else {
        throw new Error('Error agregando al carrito')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      setError(error instanceof Error ? error.message : 'Error agregando al carrito')
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  // Component para mostrar un producto como card
  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-white border-4 border-black hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300" style={{ boxShadow: '6px 6px 0 #000000' }}>
      <div className="relative">
        {/* Product Image */}
        <div className="relative w-full h-48 border-b-4 border-black overflow-hidden">
          {product.thumbnailFileIds ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/thumbnail/${JSON.parse(product.thumbnailFileIds)[0]}`}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
              <span className="text-6xl">🪵</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-black px-2 py-1 border-2 border-black uppercase ${
              product.difficulty === 'BEGINNER' ? 'bg-green-400' :
              product.difficulty === 'INTERMEDIATE' ? 'bg-yellow-400' : 'bg-orange-400'
            }`}>
              {product.difficulty}
            </span>
            <span className="text-xs font-black px-2 py-1 border-2 border-black bg-blue-400 uppercase">
              {product.category}
            </span>
          </div>

          <Link href={`/productos/${product.slug}`} className="block">
            <h3 className="text-lg font-black text-black uppercase line-clamp-2 mb-2 hover:text-orange-500 transition-colors">
              {product.title}
            </h3>
          </Link>

          <p className="text-sm text-gray-600 font-medium line-clamp-2 mb-3">
            {product.description}
          </p>

          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-black text-black">
              {formatPrice(product.price)}
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-black">{product.rating.toFixed(1)}</span>
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`text-sm ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 font-bold">
            <span>{product.viewCount} vistas</span>
            <span>{product.downloadCount} descargas</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-black font-black text-xl uppercase">{t('access_restricted')}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">{t('loading_favorites')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-black uppercase mb-2">{t('error_title')}</h2>
          <p className="text-gray-600 font-bold mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-500 border-3 border-black px-6 py-3 font-black text-white uppercase hover:bg-yellow-400 hover:text-black transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-yellow-400 border-b-4 border-black p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 text-black font-black text-sm uppercase">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              {tCommon('navigation.home')}
            </Link>
            <span>/</span>
            <span className="text-orange-500">{t('title')}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-100 border-4 border-red-500 p-4 mb-8" style={{ boxShadow: '4px 4px 0 #000000' }}>
            <p className="text-red-800 font-bold">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-600 font-bold text-sm hover:text-red-800"
            >
              {t('dismiss_error')}
            </button>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/productos"
              className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {tCommon('actions.back')}
            </Link>
            
            <div>
              <h1 className="text-4xl font-black text-black uppercase flex items-center gap-3">
                <HeartIcon className="w-8 h-8 fill-red-500 text-red-500" />
                {t('title')}
              </h1>
              <p className="text-gray-600 font-bold mt-2">
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div 
              className="bg-red-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <HeartIcon className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <div className="text-xl font-black text-black mb-1">{stats.totalFavorites}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.total_favorites')}</div>
            </div>
            
            <div 
              className="bg-blue-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <TagIcon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-xl font-black text-black mb-1">{Object.keys(stats.byCategory).length}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.categories')}</div>
            </div>
            
            <div 
              className="bg-green-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <WrenchIcon className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-xl font-black text-black mb-1">{Object.keys(stats.byDifficulty).length}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.difficulties')}</div>
            </div>
            
            <div 
              className="bg-yellow-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <DollarSignIcon className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-xl font-black text-black mb-1">
                {formatPrice(favorites.reduce((sum, fav) => sum + fav.product.price, 0))}
              </div>
              <div className="text-xs font-black text-black uppercase">{t('stats.total_value')}</div>
            </div>
            
            <div 
              className="bg-purple-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-xl font-black text-black mb-1">{stats.recentlyAdded}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.this_week')}</div>
            </div>
          </div>

          {/* Category Distribution */}
          {Object.keys(stats.byCategory).length > 0 && (
            <div 
              className="bg-white border-4 border-black p-6 mb-8"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                <BarChartIcon className="w-5 h-5" />
                {t('category_distribution.title')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.byCategory).map(([category, count]) => (
                  <div 
                    key={category}
                    className="bg-gray-100 border-2 border-black p-3 text-center"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <div className="text-lg font-black text-black">{count}</div>
                    <div className="text-xs font-bold text-gray-600 uppercase">{category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        <div 
          className="bg-white border-4 border-black p-6 mb-8"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black" />
              <input
                type="text"
                placeholder={t('filters.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="ALL">{t('filters.all_categories')}</option>
              {Object.values(ProductCategory).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="ALL">{t('filters.all_difficulties')}</option>
              {Object.values(Difficulty).map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>

            {/* Price Range Filter */}
            <select
              value={filterPriceRange}
              onChange={(e) => setFilterPriceRange(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="ALL">{t('filters.all_prices')}</option>
              <option value="under10">{t('filters.under_10')}</option>
              <option value="10-20">{t('filters.10_to_20')}</option>
              <option value="20-30">{t('filters.20_to_30')}</option>
              <option value="over30">{t('filters.over_30')}</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="date">{t('filters.sort_by_date')}</option>
              <option value="name">{t('filters.sort_by_name')}</option>
              <option value="price">{t('filters.sort_by_price')}</option>
              <option value="rating">{t('filters.sort_by_rating')}</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="desc">{t('filters.most_recent')}</option>
              <option value="asc">{t('filters.oldest')}</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 border-3 border-black transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <GridIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 border-3 border-black transition-all ${
                  viewMode === 'list' 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 font-bold text-sm">
              {t('results.showing', { current: filteredFavorites.length, total: favorites.length })}
            </p>
          </div>
        </div>

        {/* Favorites List */}
        {filteredFavorites.length === 0 ? (
          <div 
            className="bg-gray-100 border-4 border-black p-12 text-center"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <div className="text-6xl mb-4">💝</div>
            <h2 className="text-2xl font-black text-black uppercase mb-4">
              {favorites.length === 0 ? t('empty.no_favorites_title') : t('empty.no_results_title')}
            </h2>
            <p className="text-gray-600 font-bold mb-6">
              {favorites.length === 0 
                ? t('empty.no_favorites_subtitle')
                : t('empty.no_results_subtitle')
              }
            </p>
            <Link 
              href="/productos"
              className="inline-flex items-center gap-2 bg-yellow-400 border-4 border-black px-6 py-3 font-black text-black uppercase hover:bg-orange-500 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <EyeIcon className="w-4 h-4" />
              {t('empty.explore_products')}
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredFavorites.map((favorite) => (
              <div key={favorite.id} className="relative">
                {/* Remove button overlay */}
                <button
                  onClick={() => handleRemoveFavorite(favorite.productId)}
                  disabled={removingFavorites.has(favorite.productId)}
                  className="absolute top-2 right-2 z-10 p-2 bg-red-500 border-2 border-black text-white hover:bg-red-600 transition-all disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  title={t('actions.remove_favorite')}
                >
                  <HeartIcon className="w-4 h-4 fill-current" />
                </button>
                
                {/* Add to cart button overlay */}
                <button
                  onClick={() => handleAddToCart(favorite.productId)}
                  disabled={addingToCart.has(favorite.productId)}
                  className="absolute top-2 left-2 z-10 p-2 bg-green-500 border-2 border-black text-white hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  title={t('actions.add_to_cart')}
                >
                  <ShoppingCartIcon className="w-4 h-4" />
                </button>

                {/* Favorite date badge */}
                <div className="absolute bottom-2 left-2 z-10 bg-blue-500 border-2 border-black text-white text-xs font-black px-2 py-1">
                  {formatDate(favorite.createdAt)}
                </div>

                <ProductCard product={favorite.product} />
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4 mb-8">
            {filteredFavorites.map((favorite) => (
              <div 
                key={favorite.id}
                className="bg-white border-4 border-black p-6 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
                style={{ boxShadow: '6px 6px 0 #000000' }}
              >
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="relative w-32 h-32 border-3 border-black overflow-hidden flex-shrink-0">
                    {favorite.product.thumbnailFileIds ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/thumbnail/${JSON.parse(favorite.product.thumbnailFileIds)[0]}`}
                        alt={favorite.product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
                        <span className="text-4xl">🪵</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link 
                          href={`/productos/${favorite.product.slug}`}
                          className="text-xl font-black text-black uppercase hover:text-orange-500 transition-colors line-clamp-2"
                        >
                          {favorite.product.title}
                        </Link>
                        <p className="text-sm text-gray-600 font-bold mt-1">
                          {favorite.product.seller?.sellerProfile?.storeName || 
                           `${favorite.product.seller?.firstName || ''} ${favorite.product.seller?.lastName || ''}`.trim() || 'Vendedor'}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-black text-black mb-1">
                          {formatPrice(favorite.product.price)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black text-black">{favorite.product.rating.toFixed(1)}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span 
                                key={i}
                                className={`text-xs ${i < Math.floor(favorite.product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-black text-sm mb-4 line-clamp-2 font-medium">
                      {favorite.product.description}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <span 
                        className="bg-blue-400 text-black text-xs font-black px-2 py-1 border-2 border-black uppercase"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        {favorite.product.category}
                      </span>
                      
                      <span 
                        className={`${
                          favorite.product.difficulty === 'BEGINNER' ? 'bg-green-400' :
                          favorite.product.difficulty === 'INTERMEDIATE' ? 'bg-yellow-400' : 'bg-orange-400'
                        } text-black text-xs font-black px-2 py-1 border-2 border-black uppercase`}
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        {favorite.product.difficulty}
                      </span>

                      <span className="text-xs text-gray-600 font-bold">
                        {t('list.added')}: {formatDate(favorite.createdAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/productos/${favorite.product.slug}`}
                        className="flex items-center gap-2 bg-blue-400 border-3 border-black px-4 py-2 font-black text-black text-sm uppercase hover:bg-yellow-400 transition-all"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      >
                        <EyeIcon className="w-4 h-4" />
                        {t('actions.view_product')}
                      </Link>

                      <button
                        onClick={() => handleAddToCart(favorite.productId)}
                        disabled={addingToCart.has(favorite.productId)}
                        className="flex items-center gap-2 bg-green-500 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      >
                        <ShoppingCartIcon className="w-4 h-4" />
                        {addingToCart.has(favorite.productId) ? t('actions.adding') : t('actions.add_to_cart')}
                      </button>

                      <button
                        onClick={() => handleRemoveFavorite(favorite.productId)}
                        disabled={removingFavorites.has(favorite.productId)}
                        className="flex items-center gap-2 bg-red-500 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-red-600 transition-all disabled:opacity-50"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      >
                        <HeartIcon className="w-4 h-4" />
                        {removingFavorites.has(favorite.productId) ? t('actions.removing') : t('actions.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Similar Products Recommendations */}
        {similarProducts.length > 0 && (
          <div 
            className="bg-orange-100 border-4 border-black p-6 mt-8"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <h2 className="text-2xl font-black text-black uppercase mb-4 flex items-center gap-2">
              <TrendingUpIcon className="w-6 h-6" />
              {t('recommendations.title')}
            </h2>
            <p className="text-gray-700 font-bold mb-6">
              {t('recommendations.subtitle')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div 
          className="bg-blue-100 border-4 border-black p-6 mt-8"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <h3 className="text-xl font-black text-black uppercase mb-4">💡 {t('tips.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-black text-black uppercase mb-2">{t('tips.organization.title')}:</h4>
              <ul className="space-y-1 text-gray-700">
                <li className="font-medium">• {t('tips.organization.use_filters')}</li>
                <li className="font-medium">• {t('tips.organization.sort_by_date')}</li>
                <li className="font-medium">• {t('tips.organization.list_mode')}</li>
                <li className="font-medium">• {t('tips.organization.group_by_category')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-black uppercase mb-2">{t('tips.quick_actions.title')}:</h4>
              <ul className="space-y-1 text-gray-700">
                <li className="font-medium">• {t('tips.quick_actions.add_to_cart')}</li>
                <li className="font-medium">• {t('tips.quick_actions.remove_uninteresting')}</li>
                <li className="font-medium">• {t('tips.quick_actions.explore_similar')}</li>
                <li className="font-medium">• {t('tips.quick_actions.buy_on_offers')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}