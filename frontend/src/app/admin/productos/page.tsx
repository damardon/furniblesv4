'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  Clock,
  AlertTriangle,
  Package,
  User,
  Calendar,
  Star,
  Download,
  MoreHorizontal,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Heart
} from 'lucide-react'

// Stores
import { useAdminStore } from '@/lib/stores/admin-store'
import { Product, ProductStatus, ProductCategory, Difficulty } from '@/types'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// Types
interface LocalFilters {
  status: ProductStatus | 'ALL'
  category: ProductCategory | 'ALL'
  seller: string
}

type ModerationAction = 'approve' | 'reject' | 'suspend'

interface ModerationState {
  product: Product | null
  action: ModerationAction | null
  reason: string
}

export default function AdminProductsPage() {
  // State
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    status: 'ALL',
    category: 'ALL',
    seller: ''
  })
  const [moderation, setModeration] = useState<ModerationState>({
    product: null,
    action: null,
    reason: ''
  })
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Store
  const { 
    products,
    pendingProducts,
    fetchAllProducts,
    fetchPendingProducts,
    approveProduct,
    rejectProduct,
    suspendProduct,
    featureProduct,
    isLoading,
    error
  } = useAdminStore()

  // Load initial data
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        await Promise.all([
          fetchAllProducts(),
          fetchPendingProducts()
        ])
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }

    loadData()
  }, [fetchAllProducts, fetchPendingProducts])

  // Filtered products with memoization for performance
  const filteredProducts = useMemo((): Product[] => {
    if (!products) return []
    
    return products.filter(product => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = [
          product.title,
          product.description,
          product.seller?.firstName,
          product.seller?.lastName,
          product.sellerId
        ].some(field => field?.toLowerCase().includes(query))
        
        if (!matchesSearch) return false
      }

      // Status filter
      if (localFilters.status !== 'ALL' && product.status !== localFilters.status) {
        return false
      }

      // Category filter
      if (localFilters.category !== 'ALL' && product.category !== localFilters.category) {
        return false
      }

      // Seller filter
      if (localFilters.seller.trim()) {
        const sellerQuery = localFilters.seller.toLowerCase()
        const matchesSeller = [
          product.sellerId,
          product.seller?.firstName,
          product.seller?.lastName
        ].some(field => field?.toLowerCase().includes(sellerQuery))
        
        if (!matchesSeller) return false
      }

      return true
    })
  }, [products, searchQuery, localFilters])

  // Handle moderation action
  const handleModeration = useCallback(async (): Promise<void> => {
    const { product, action, reason } = moderation
    if (!product || !action) return

    try {
      let result
      switch (action) {
        case 'approve':
          result = await approveProduct(product.id, reason || undefined)
          break
        case 'reject':
          result = await rejectProduct(product.id, reason)
          break
        case 'suspend':
          result = await suspendProduct(product.id, reason)
          break
      }

      if (result?.success) {
        setModeration({ product: null, action: null, reason: '' })
        await Promise.all([fetchAllProducts(), fetchPendingProducts()])
      }
    } catch (error) {
      console.error('Error in moderation:', error)
    }
  }, [moderation, approveProduct, rejectProduct, suspendProduct, fetchAllProducts, fetchPendingProducts])

  // Handle feature toggle
  const handleFeatureToggle = useCallback(async (productId: string, featured: boolean): Promise<void> => {
    try {
      const result = await featureProduct(productId, featured)
      if (result?.success) {
        await fetchAllProducts()
      }
    } catch (error) {
      console.error('Error featuring product:', error)
    }
  }, [featureProduct, fetchAllProducts])

  // Handle refresh
  const handleRefresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true)
    try {
      await Promise.all([fetchAllProducts(), fetchPendingProducts()])
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchAllProducts, fetchPendingProducts])

  // Clear all filters
  const clearFilters = useCallback((): void => {
    setSearchQuery('')
    setLocalFilters({
      status: 'ALL',
      category: 'ALL',
      seller: ''
    })
  }, [])

  // Get status badge
  const getStatusBadge = useCallback((status: ProductStatus): JSX.Element => {
    const badgeConfig = {
      [ProductStatus.PENDING]: { className: 'bg-yellow-400 text-black', text: 'PENDIENTE' },
      [ProductStatus.APPROVED]: { className: 'bg-green-500 text-white', text: 'APROBADO' },
      [ProductStatus.REJECTED]: { className: 'bg-red-500 text-white', text: 'RECHAZADO' },
      [ProductStatus.SUSPENDED]: { className: 'bg-orange-500 text-black', text: 'SUSPENDIDO' },
      [ProductStatus.DRAFT]: { className: 'bg-gray-300 text-black', text: 'BORRADOR' }
    }

    const config = badgeConfig[status] || { className: 'bg-gray-300 text-black', text: status }
    
    return (
      <Badge className={`${config.className} border-2 border-black font-black`}>
        {config.text}
      </Badge>
    )
  }, [])

  // Close moderation modal
  const closeModerationModal = useCallback((): void => {
    setModeration({ product: null, action: null, reason: '' })
  }, [])

  // Open moderation modal
  const openModerationModal = useCallback((product: Product, action: ModerationAction): void => {
    setModeration({ product, action, reason: '' })
  }, [])

  // Computed values
  const pendingCount = pendingProducts?.length || 0
  const isModalOpen = moderation.action !== null && moderation.product !== null
  const isFormValid = moderation.action === 'approve' || moderation.reason.trim().length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">
            Moderación de Productos
          </h1>
          <p className="text-gray-600 font-bold">
            {pendingCount} productos pendientes • {filteredProducts.length} mostrados de {products?.length || 0} total
          </p>
        </div>
        
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-white border-2 border-black text-black font-black hover:bg-yellow-400"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          ACTUALIZAR
        </Button>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-orange-500 border-3 border-black p-6" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-black" />
            <h2 className="font-black text-black text-lg uppercase">
              {pendingCount} PRODUCTOS PENDIENTES DE MODERACIÓN
            </h2>
          </div>
          <p className="font-bold text-black">
            Hay productos esperando tu aprobación. Revisa y modera el contenido para mantener la calidad de la plataforma.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border-3 border-black p-6" style={{ boxShadow: '5px 5px 0 #000000' }}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h2 className="font-black text-black text-lg uppercase">FILTROS Y BÚSQUEDA</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-bold mb-2" htmlFor="search">
                Buscar productos
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  placeholder="Título, descripción, vendedor..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-colors"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-bold mb-2" htmlFor="status">
                Estado
              </label>
              <select 
                id="status"
                value={localFilters.status} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  setLocalFilters(prev => ({ ...prev, status: e.target.value as ProductStatus | 'ALL' }))
                }
                className="w-full p-2 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-colors"
              >
                <option value="ALL">Todos los estados</option>
                <option value={ProductStatus.PENDING}>Pendientes</option>
                <option value={ProductStatus.APPROVED}>Aprobados</option>
                <option value={ProductStatus.REJECTED}>Rechazados</option>
                <option value={ProductStatus.SUSPENDED}>Suspendidos</option>
                <option value={ProductStatus.DRAFT}>Borradores</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold mb-2" htmlFor="category">
                Categoría
              </label>
              <select 
                id="category"
                value={localFilters.category} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  setLocalFilters(prev => ({ ...prev, category: e.target.value as ProductCategory | 'ALL' }))
                }
                className="w-full p-2 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-colors"
              >
                <option value="ALL">Todas las categorías</option>
                <option value={ProductCategory.FURNITURE}>Muebles</option>
                <option value={ProductCategory.CHAIRS}>Sillas</option>
                <option value={ProductCategory.TABLES}>Mesas</option>
                <option value={ProductCategory.BEDS}>Camas</option>
                <option value={ProductCategory.STORAGE}>Almacenamiento</option>
                <option value={ProductCategory.OUTDOOR}>Exterior</option>
                <option value={ProductCategory.DECORATIVE}>Decorativo</option>
                <option value={ProductCategory.KITCHEN}>Cocina</option>
                <option value={ProductCategory.OFFICE}>Oficina</option>
              </select>
            </div>

            {/* Seller */}
            <div>
              <label className="block text-sm font-bold mb-2" htmlFor="seller">
                Vendedor
              </label>
              <input
                id="seller"
                type="text"
                placeholder="ID o nombre del vendedor"
                value={localFilters.seller}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalFilters(prev => ({ ...prev, seller: e.target.value }))
                }
                className="w-full p-2 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-colors"
              />
            </div>
          </div>

          <Button
            onClick={clearFilters}
            className="bg-white border-2 border-black text-black font-bold hover:bg-yellow-400"
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500 border-3 border-black p-6" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-white" />
            <h2 className="font-black text-white text-lg uppercase">ERROR</h2>
          </div>
          <p className="text-white font-bold mb-4">{error}</p>
          <Button 
            onClick={handleRefresh}
            className="bg-white text-red-500 border-2 border-black font-bold hover:bg-red-100"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-4">
        {isLoading && !products ? (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-600">Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border-3 border-gray-300 p-12 text-center" style={{ boxShadow: '5px 5px 0 #000000' }}>
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-600 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500">Ajusta los filtros para ver más resultados</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white border-3 border-black p-6" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Product Preview */}
                <div className="lg:w-48 flex-shrink-0">
                  {product.previewImages && product.previewImages.length > 0 ? (
                    <div className="w-full h-32 lg:h-36 bg-gray-100 border-2 border-black flex items-center justify-center overflow-hidden">
                      <img 
                        src={product.previewImages[0]} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                      <div className="hidden flex-col items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">
                          {product.previewImages.length} imagen(es)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 lg:h-36 bg-gray-100 border-2 border-black flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Information */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-black text-black">{product.title}</h3>
                      <p className="text-gray-600 font-bold line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(product.status)}
                      {product.featured && (
                        <Badge className="bg-yellow-400 text-black border-2 border-black font-black">
                          ⭐ DESTACADO
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-bold text-gray-600">Precio:</span>
                      <p className="font-black text-green-600">${product.price}</p>
                    </div>
                    <div>
                      <span className="font-bold text-gray-600">Categoría:</span>
                      <p className="font-bold">{product.category}</p>
                    </div>
                    <div>
                      <span className="font-bold text-gray-600">Dificultad:</span>
                      <p className="font-bold">{product.difficulty}</p>
                    </div>
                    <div>
                      <span className="font-bold text-gray-600">Vendedor:</span>
                      <p className="font-bold">
                        {product.seller ? 
                          `${product.seller.firstName} ${product.seller.lastName}` : 
                          product.sellerId
                        }
                      </p>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {product.viewCount} vistas
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {product.downloadCount} descargas
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {product.rating} ({product.reviewCount} reviews)
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {product.favoriteCount} favoritos
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Rejection Reason */}
                  {product.status === ProductStatus.REJECTED && product.rejectionReason && (
                    <div className="p-3 bg-red-50 border-2 border-red-200 rounded">
                      <p className="text-sm font-bold text-red-800">
                        <strong>Razón de rechazo:</strong> {product.rejectionReason}
                      </p>
                      {product.moderatedAt && (
                        <p className="text-xs text-red-600 mt-1">
                          Moderado el {new Date(product.moderatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="lg:w-48 flex-shrink-0">
                  <div className="space-y-2">
                    {/* View Product */}
                    <Link
                      href={`/productos/${product.slug}`}
                      target="_blank"
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white border-2 border-black font-bold hover:bg-blue-600 transition-all"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      VER
                    </Link>

                    {/* Admin Detail */}
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 text-white border-2 border-black font-bold hover:bg-gray-600 transition-all"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    >
                      <Eye className="h-4 w-4" />
                      DETALLE
                    </Link>

                    {/* Moderation Actions for Pending Products */}
                    {product.status === ProductStatus.PENDING && (
                      <>
                        <Button
                          onClick={() => openModerationModal(product, 'approve')}
                          className="w-full bg-green-500 hover:bg-green-600 text-white border-2 border-black font-bold"
                          style={{ boxShadow: '3px 3px 0 #000000' }}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          APROBAR
                        </Button>
                        <Button
                          onClick={() => openModerationModal(product, 'reject')}
                          className="w-full bg-red-500 hover:bg-red-600 text-white border-2 border-black font-bold"
                          style={{ boxShadow: '3px 3px 0 #000000' }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          RECHAZAR
                        </Button>
                      </>
                    )}

                    {/* More Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-full bg-white border-2 border-black text-black font-bold hover:bg-yellow-400">
                          <MoreHorizontal className="h-4 w-4 mr-2" />
                          MÁS
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-2 border-black">
                        {product.status === ProductStatus.APPROVED && (
                          <DropdownMenuItem
                            onClick={() => handleFeatureToggle(product.id, !product.featured)}
                          >
                            {product.featured ? 'Quitar destaque' : 'Destacar producto'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => openModerationModal(product, 'suspend')}
                        >
                          Suspender producto
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/productos/${product.id}`}>
                            Ver detalles completos
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Moderation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-3 border-black max-w-2xl w-full" style={{ boxShadow: '10px 10px 0 #000000' }}>
            <div className="p-6">
              {/* Modal Header */}
              <div className="mb-6">
                <h2 className="text-xl font-black uppercase mb-2">
                  {moderation.action === 'approve' && '✅ Aprobar Producto'}
                  {moderation.action === 'reject' && '❌ Rechazar Producto'}
                  {moderation.action === 'suspend' && '⚠️ Suspender Producto'}
                </h2>
                <div className="text-gray-600">
                  <strong>Producto:</strong> {moderation.product?.title}<br/>
                  <strong>Vendedor:</strong> {moderation.product?.seller ? 
                    `${moderation.product.seller.firstName} ${moderation.product.seller.lastName}` : 
                    moderation.product?.sellerId}
                </div>
              </div>

              {/* Modal Content */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2" htmlFor="moderationReason">
                  {moderation.action === 'approve' 
                    ? 'Comentario de aprobación (opcional)'
                    : `Razón de ${moderation.action === 'reject' ? 'rechazo' : 'suspensión'} *`
                  }
                </label>
                <textarea
                  id="moderationReason"
                  placeholder={
                    moderation.action === 'approve' 
                      ? 'Notas internas sobre la aprobación...'
                      : `Explica por qué ${moderation.action === 'reject' ? 'rechazas' : 'suspendes'} este producto...`
                  }
                  value={moderation.reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setModeration(prev => ({ ...prev, reason: e.target.value }))
                  }
                  className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 min-h-[100px] resize-vertical"
                  required={moderation.action !== 'approve'}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3">
                <Button 
                  onClick={closeModerationModal}
                  className="bg-white border-2 border-black text-black font-bold hover:bg-gray-100"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleModeration}
                  disabled={isLoading || !isFormValid}
                  className={`border-2 border-black font-bold transition-all ${
                    moderation.action === 'approve' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    moderation.action === 'approve' ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )
                  )}
                  CONFIRMAR
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}