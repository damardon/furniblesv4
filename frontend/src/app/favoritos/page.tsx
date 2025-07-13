'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCartStore } from '@/lib/stores/cart-store'
import { 
  getFavoritesByUserId, 
  getFavoriteStats, 
  getSimilarProductsToFavorites,
  toggleFavorite,
  Favorite 
} from '@/data/mockFavorites'
import { ProductCard } from '@/components/products/product-card'
import { ProductCategory, Difficulty } from '@/types'

export default function FavoritesPage() {
  const t = useTranslations('favorites')
  const router = useRouter()
  
  // Stores
  const { isAuthenticated, user, setLoginModalOpen } = useAuthStore()
  const { addItem } = useCartStore()

  // States
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([])
  const [similarProducts, setSimilarProducts] = useState<any[]>([])
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'ALL'>('ALL')
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'ALL'>('ALL')
  const [filterPriceRange, setFilterPriceRange] = useState<'ALL' | 'under10' | '10-20' | '20-30' | 'over30'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [removingFavorites, setRemovingFavorites] = useState<Set<string>>(new Set())
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    totalFavorites: 0,
    byCategory: {} as Record<string, number>,
    byDifficulty: {} as Record<string, number>,
    byPriceRange: { under10: 0, from10to20: 0, from20to30: 0, over30: 0 },
    recentlyAdded: 0
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoginModalOpen(true)
      router.push('/productos')
      return
    }
  }, [isAuthenticated, setLoginModalOpen, router])

  // Load user favorites
  useEffect(() => {
    if (user?.id) {
      const userFavorites = getFavoritesByUserId(user.id)
      const userStats = getFavoriteStats(user.id)
      const similar = getSimilarProductsToFavorites(user.id, 6)
      
      setFavorites(userFavorites)
      setFilteredFavorites(userFavorites)
      setStats(userStats)
      setSimilarProducts(similar)
    }
  }, [user?.id])

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
        favorite.product.seller.sellerProfile?.storeName.toLowerCase().includes(query) ||
        favorite.product.tags.some(tag => tag.toLowerCase().includes(query))
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
    if (!user?.id || removingFavorites.has(productId)) return

    setRemovingFavorites(prev => new Set(prev).add(productId))

    try {
      const result = await toggleFavorite(user.id, productId)
      
      if (result.success) {
        // Actualizar la lista local
        setFavorites(prev => prev.filter(fav => fav.productId !== productId))
        // TODO: Mostrar toast de éxito
      } else {
        // TODO: Mostrar toast de error
        console.error('Error removing favorite:', result.message)
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
      // TODO: Mostrar toast de error
    } finally {
      setRemovingFavorites(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleAddToCart = async (productId: string) => {
    if (!user?.id || addingToCart.has(productId)) return

    const favorite = favorites.find(fav => fav.productId === productId)
    if (!favorite) return

    setAddingToCart(prev => new Set(prev).add(productId))

    try {
      await addItem(favorite.product, 1)
      // TODO: Mostrar toast de éxito
    } catch (error) {
      console.error('Error adding to cart:', error)
      // TODO: Mostrar toast de error
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-black font-black text-xl uppercase">Acceso restringido</p>
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
              Inicio
            </Link>
            <span>/</span>
            <span className="text-orange-500">Favoritos</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/productos"
              className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver
            </Link>
            
            <div>
              <h1 className="text-4xl font-black text-black uppercase flex items-center gap-3">
                <HeartIcon className="w-8 h-8 fill-red-500 text-red-500" />
                Mis Favoritos
              </h1>
              <p className="text-gray-600 font-bold mt-2">
                Productos que has guardado para más tarde
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
              <div className="text-xs font-black text-black uppercase">Total Favoritos</div>
            </div>
            
            <div 
              className="bg-blue-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <TagIcon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-xl font-black text-black mb-1">{Object.keys(stats.byCategory).length}</div>
              <div className="text-xs font-black text-black uppercase">Categorías</div>
            </div>
            
            <div 
              className="bg-green-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <WrenchIcon className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-xl font-black text-black mb-1">{Object.keys(stats.byDifficulty).length}</div>
              <div className="text-xs font-black text-black uppercase">Dificultades</div>
            </div>
            
            <div 
              className="bg-yellow-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <DollarSignIcon className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-xl font-black text-black mb-1">
                {formatPrice(favorites.reduce((sum, fav) => sum + fav.product.price, 0))}
              </div>
              <div className="text-xs font-black text-black uppercase">Valor Total</div>
            </div>
            
            <div 
              className="bg-purple-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-xl font-black text-black mb-1">{stats.recentlyAdded}</div>
              <div className="text-xs font-black text-black uppercase">Esta Semana</div>
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
                Favoritos por Categoría
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
                placeholder="Buscar favoritos..."
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
              <option value="ALL">Todas las categorías</option>
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
              <option value="ALL">Todas las dificultades</option>
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
              <option value="ALL">Todos los precios</option>
              <option value="under10">Menos de $10</option>
              <option value="10-20">$10 - $20</option>
              <option value="20-30">$20 - $30</option>
              <option value="over30">Más de $30</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="date">Ordenar por fecha</option>
              <option value="name">Ordenar por nombre</option>
              <option value="price">Ordenar por precio</option>
              <option value="rating">Ordenar por rating</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="desc">Más reciente</option>
              <option value="asc">Más antiguo</option>
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
              {filteredFavorites.length} de {favorites.length} favoritos
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
              {favorites.length === 0 ? 'No tienes favoritos aún' : 'No se encontraron favoritos'}
            </h2>
            <p className="text-gray-600 font-bold mb-6">
              {favorites.length === 0 
                ? 'Explora nuestro catálogo y guarda los productos que te gusten'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </p>
            <Link 
              href="/productos"
              className="inline-flex items-center gap-2 bg-yellow-400 border-4 border-black px-6 py-3 font-black text-black uppercase hover:bg-orange-500 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <EyeIcon className="w-4 h-4" />
              Explorar Productos
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
                  title="Quitar de favoritos"
                >
                  <HeartIcon className="w-4 h-4 fill-current" />
                </button>
                
                {/* Add to cart button overlay */}
                <button
                  onClick={() => handleAddToCart(favorite.productId)}
                  disabled={addingToCart.has(favorite.productId)}
                  className="absolute top-2 left-2 z-10 p-2 bg-green-500 border-2 border-black text-white hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  title="Agregar al carrito"
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
                    {favorite.product.previewImages?.[0] ? (
                      <img
                        src={favorite.product.previewImages[0]}
                        alt={favorite.product.title}
                        className="w-full h-full object-cover"
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
                          {favorite.product.seller.sellerProfile?.storeName || 
                           `${favorite.product.seller.firstName} ${favorite.product.seller.lastName}`}
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
                          favorite.product.difficulty === 'EASY' ? 'bg-green-400' :
                          favorite.product.difficulty === 'INTERMEDIATE' ? 'bg-yellow-400' : 'bg-orange-400'
                        } text-black text-xs font-black px-2 py-1 border-2 border-black uppercase`}
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        {favorite.product.difficulty}
                      </span>

                      <span className="text-xs text-gray-600 font-bold">
                        Agregado: {formatDate(favorite.createdAt)}
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
                        Ver Producto
                      </Link>

                      <button
                        onClick={() => handleAddToCart(favorite.productId)}
                        disabled={addingToCart.has(favorite.productId)}
                        className="flex items-center gap-2 bg-green-500 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      >
                        <ShoppingCartIcon className="w-4 h-4" />
                        {addingToCart.has(favorite.productId) ? 'Agregando...' : 'Agregar al Carrito'}
                      </button>

                      <button
                        onClick={() => handleRemoveFavorite(favorite.productId)}
                        disabled={removingFavorites.has(favorite.productId)}
                        className="flex items-center gap-2 bg-red-500 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-red-600 transition-all disabled:opacity-50"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      >
                        <HeartIcon className="w-4 h-4" />
                        {removingFavorites.has(favorite.productId) ? 'Quitando...' : 'Quitar'}
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
              Te Podría Interesar
            </h2>
            <p className="text-gray-700 font-bold mb-6">
              Basado en tus favoritos, estos productos podrían gustarte
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
          <h3 className="text-xl font-black text-black uppercase mb-4">💡 Gestiona tus Favoritos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-black text-black uppercase mb-2">Organización:</h4>
              <ul className="space-y-1 text-gray-700">
                <li className="font-medium">• Usa filtros para encontrar favoritos específicos</li>
                <li className="font-medium">• Ordena por fecha para ver los más recientes</li>
                <li className="font-medium">• El modo lista muestra más información</li>
                <li className="font-medium">• Agrupa por categoría o dificultad</li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-black uppercase mb-2">Acciones Rápidas:</h4>
              <ul className="space-y-1 text-gray-700">
                <li className="font-medium">• Agregar al carrito desde favoritos</li>
                <li className="font-medium">• Quitar productos que ya no te interesan</li>
                <li className="font-medium">• Explorar recomendaciones similares</li>
                <li className="font-medium">• Comprar cuando haya ofertas especiales</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}