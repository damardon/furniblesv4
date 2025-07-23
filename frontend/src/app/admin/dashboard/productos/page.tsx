'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Eye,
  Edit,
  AlertTriangle,
  RefreshCw,
  Download,
  Star,
  Calendar,
  DollarSign,
  User,
  Tag,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Archive,
  Trash2,
  Shield
} from 'lucide-react'

// Stores y Types
import { useAdminStore } from '@/lib/stores/admin-store'
import { Product, ProductStatus, ProductCategory, Difficulty } from '@/types'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Checkbox } from '@/components/ui/checkbox'

// Tipos para las acciones de producto
type ProductAction = 'approve' | 'reject' | 'suspend' | 'feature' | 'archive' | 'view_details' | null

interface ProductActionState {
  action: ProductAction
  product: Product | null
  reason: string
  featured?: boolean
}

export default function AdminProductsPage() {
  // Estados principales
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [productAction, setProductAction] = useState<ProductActionState>({
    action: null,
    product: null,
    reason: '',
    featured: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'suspend' | null>(null)
  const [bulkReason, setBulkReason] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'ALL'>('ALL')

  // Traducciones
  const t = useTranslations('admin.products')
  const tCommon = useTranslations('common')
  const tProducts = useTranslations('products')
  const tStatus = useTranslations('admin.products.status')
  const tActions = useTranslations('admin.products.actions')
  const tCategories = useTranslations('admin.products.categories')

  // Store
  const { 
    products,
    productFilters,
    dashboardStats,
    selectedProduct,
    fetchAllProducts,
    updateProductStatus,
    featureProduct,
    setProductFilters,
    setSelectedProduct,
    isLoading: storeLoading,
    error
  } = useAdminStore()

  // Cargar productos al montar el componente
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        await fetchAllProducts()
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [fetchAllProducts])

  // Filtrar y paginar productos
  const filteredProducts = useMemo(() => {
    let filtered = products || []

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query) ||
        product.sellerId.toLowerCase().includes(query)
      )
    }

    // Filtros
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(product => product.status === statusFilter)
    }

    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    return filtered
  }, [products, searchQuery, statusFilter, categoryFilter])

  // Paginación
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  // Manejar selección de productos
  const handleSelectProduct = useCallback((productId: string, selected: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(productId)
      } else {
        newSet.delete(productId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedProducts(new Set(paginatedProducts.map(product => product.id)))
    } else {
      setSelectedProducts(new Set())
    }
  }, [paginatedProducts])

  // Manejar acciones de producto
  const handleProductAction = async () => {
    const { action, product, reason, featured } = productAction
    if (!action || !product) return

    setIsLoading(true)
    try {
      let result
      
      switch (action) {
        case 'approve':
          result = await updateProductStatus(product.id, ProductStatus.APPROVED, reason)
          break
          
        case 'reject':
          result = await updateProductStatus(product.id, ProductStatus.REJECTED, reason)
          break
          
        case 'suspend':
          result = await updateProductStatus(product.id, ProductStatus.SUSPENDED, reason)
          break
          
        case 'feature':
          result = await featureProduct(product.id, featured || false)
          break
          
        default:
          throw new Error('Acción no válida')
      }

      if (result.success) {
        // Limpiar estado de acción
        setProductAction({
          action: null,
          product: null,
          reason: '',
          featured: false
        })
        setShowProductModal(false)
        
        // Recargar productos
        await fetchAllProducts()
      }
    } catch (error) {
      console.error('Error in product action:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar acciones en lote
  const handleBulkAction = async () => {
    if (selectedProducts.size === 0 || !bulkAction) return

    setIsLoading(true)
    try {
      const promises = Array.from(selectedProducts).map(productId => {
        let status: ProductStatus
        switch (bulkAction) {
          case 'approve':
            status = ProductStatus.APPROVED
            break
          case 'reject':
            status = ProductStatus.REJECTED
            break
          case 'suspend':
            status = ProductStatus.SUSPENDED
            break
          default:
            throw new Error('Acción en lote no válida')
        }
        return updateProductStatus(productId, status, bulkReason)
      })

      await Promise.all(promises)
      setSelectedProducts(new Set())
      setBulkAction(null)
      setBulkReason('')
      setShowBulkModal(false)
      await fetchAllProducts()
    } catch (error) {
      console.error('Error in bulk action:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener badge de estado
  const getStatusBadge = (status: ProductStatus) => {
    const configs = {
      [ProductStatus.APPROVED]: {
        className: 'bg-green-500 text-white border-2 border-black',
        text: tStatus('approved')
      },
      [ProductStatus.PENDING]: {
        className: 'bg-yellow-500 text-black border-2 border-black',
        text: tStatus('pending')
      },
      [ProductStatus.REJECTED]: {
        className: 'bg-red-500 text-white border-2 border-black',
        text: tStatus('rejected')
      },
      [ProductStatus.SUSPENDED]: {
        className: 'bg-purple-500 text-white border-2 border-black',
        text: tStatus('suspended')
      },
      [ProductStatus.DRAFT]: {
        className: 'bg-gray-500 text-white border-2 border-black',
        text: tStatus('draft')
      }
    }

    const config = configs[status] || configs[ProductStatus.DRAFT]
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded ${config.className}`}>
        {config.text}
      </span>
    )
  }

  // Obtener badge de categoría
  const getCategoryBadge = (category: ProductCategory) => {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded bg-blue-100 text-blue-800 border border-blue-300">
        {tCategories(category.toLowerCase())}
      </span>
    )
  }

  // Obtener estadísticas de producto
  const getProductStats = (product: Product) => {
    return {
      views: product.viewCount || 0,
      downloads: product.downloadCount || 0,
      rating: product.rating || 0,
      reviews: product.reviewCount || 0
    }
  }

  const openProductAction = (action: ProductAction, product: Product, featured?: boolean) => {
    setProductAction({
      action,
      product,
      reason: '',
      featured
    })
    setShowProductModal(true)
  }

  const openBulkAction = (action: 'approve' | 'reject' | 'suspend') => {
    setBulkAction(action)
    setBulkReason('')
    setShowBulkModal(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">{t('title')}</h1>
          <p className="text-gray-600 font-bold">
            {t('summary', { 
              total: filteredProducts.length, 
              selected: selectedProducts.size 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => fetchAllProducts()}
            disabled={isLoading}
            variant="outline"
            className="border-2 border-black"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {tCommon('refresh')}
          </Button>
          
          <Button
            onClick={() => {/* Implementar export */}}
            variant="outline"
            className="border-2 border-black"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.total_products')}</p>
                <p className="text-2xl font-black">{dashboardStats?.totalProducts || products?.length || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.pending')}</p>
                <p className="text-2xl font-black">
                  {products?.filter(p => p.status === ProductStatus.PENDING).length || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.approved')}</p>
                <p className="text-2xl font-black">
                  {products?.filter(p => p.status === ProductStatus.APPROVED).length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.rejected')}</p>
                <p className="text-2xl font-black">
                  {products?.filter(p => p.status === ProductStatus.REJECTED).length || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-black">
            <Filter className="h-5 w-5" />
            {t('filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-bold mb-2">{t('filters.search_label')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('filters.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-2 border-black"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-bold mb-2">{t('filters.status_label')}</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'ALL')}
                className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">{t('filters.all_statuses')}</option>
                <option value={ProductStatus.PENDING}>{tStatus('pending')}</option>
                <option value={ProductStatus.APPROVED}>{tStatus('approved')}</option>
                <option value={ProductStatus.REJECTED}>{tStatus('rejected')}</option>
                <option value={ProductStatus.SUSPENDED}>{tStatus('suspended')}</option>
                <option value={ProductStatus.DRAFT}>{tStatus('draft')}</option>
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-bold mb-2">{t('filters.category_label')}</label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'ALL')}
                className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">{t('filters.all_categories')}</option>
                <option value={ProductCategory.TABLES}>{tCategories('tables')}</option>
                <option value={ProductCategory.CHAIRS}>{tCategories('chairs')}</option>
                <option value={ProductCategory.BEDS}>{tCategories('beds')}</option>
                <option value={ProductCategory.STORAGE}>{tCategories('storage')}</option>
                <option value={ProductCategory.OUTDOOR}>{tCategories('outdoor')}</option>
                <option value={ProductCategory.DECORATIVE}>{tCategories('decorative')}</option>
              </select>
            </div>

            {/* Vista */}
            <div>
              <label className="block text-sm font-bold mb-2">{t('filters.view_label')}</label>
              <div className="flex border-2 border-black rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 p-2 font-bold transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-orange-500 text-black' 
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {t('filters.grid_view')}
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 p-2 font-bold transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-orange-500 text-black' 
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {t('filters.list_view')}
                </button>
              </div>
            </div>
          </div>

          {/* Acciones en lote */}
          {selectedProducts.size > 0 && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="font-bold text-blue-800">
                  {t('bulk.selected_count', { count: selectedProducts.size })}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => openBulkAction('approve')}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white border-2 border-black"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {tActions('approve')}
                  </Button>
                  <Button
                    onClick={() => openBulkAction('reject')}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white border-2 border-black"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {tActions('reject')}
                  </Button>
                  <Button
                    onClick={() => openBulkAction('suspend')}
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600 text-white border-2 border-black"
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    {tActions('suspend')}
                  </Button>
                  <Button
                    onClick={() => setSelectedProducts(new Set())}
                    size="sm"
                    variant="outline"
                    className="border-2 border-black"
                  >
                    {tActions('clear')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de productos */}
      {isLoading && !products ? (
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-600">{t('loading')}</p>
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-600 mb-2">{t('no_products')}</h3>
          <p className="text-gray-500">{t('no_products_desc')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProducts.map((product) => {
            const stats = getProductStats(product)
            const isSelected = selectedProducts.has(product.id)
            
            return (
              <Card key={product.id} className="border-3 border-black overflow-hidden" style={{ boxShadow: '5px 5px 0 #000000' }}>
                {/* Imagen del producto */}
                <div className="relative h-48 bg-gray-100">
                  {product.previewImages?.[0] ? (
                    <Image
                      src={`/api/files/${product.previewImages[0]}`}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}

                  {/* Checkbox */}
                  <div className="absolute top-3 left-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleSelectProduct(product.id, checked as boolean)
                      }
                      className="bg-white border-2 border-black"
                    />
                  </div>

                  {/* Estado */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(product.status)}
                  </div>

                  {/* Featured */}
                  {product.featured && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded bg-yellow-500 text-black border-2 border-black">
                        <Star className="h-3 w-3 mr-1" />
                        {t('featured')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Título y precio */}
                    <div>
                      <h3 className="font-black text-lg text-black line-clamp-1">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-green-600">
                          {formatCurrency(product.price)}
                        </span>
                        {getCategoryBadge(product.category)}
                      </div>
                    </div>

                    {/* Descripción */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-blue-500" />
                        <span>{stats.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3 text-green-500" />
                        <span>{stats.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{stats.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span>{formatDate(product.createdAt)}</span>
                      </div>
                    </div>

                    {/* Vendedor */}
                    <div className="text-xs text-gray-500">
                      <span className="font-bold">{t('seller')}:</span> {product.sellerId.slice(0, 8)}...
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openProductAction('view_details', product)}
                        size="sm"
                        variant="outline"
                        className="flex-1 border-2 border-black"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {tActions('view')}
                      </Button>
                      
                      {product.status === ProductStatus.PENDING && (
                        <>
                          <Button
                            onClick={() => openProductAction('approve', product)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white border-2 border-black"
                            title={tActions('approve')}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => openProductAction('reject', product)}
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white border-2 border-black"
                            title={tActions('reject')}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}

                      {product.status === ProductStatus.APPROVED && (
                        <Button
                          onClick={() => openProductAction('feature', product, !product.featured)}
                          size="sm"
                          className={`border-2 border-black ${
                            product.featured 
                              ? 'bg-yellow-500 text-black' 
                              : 'bg-gray-500 text-white hover:bg-gray-600'
                          }`}
                          title={product.featured ? tActions('unfeature') : tActions('feature')}
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Vista Lista */
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="text-left p-3 font-black text-black">
                      <Checkbox
                        checked={selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left p-3 font-black text-black">{t('table.headers.product')}</th>
                    <th className="text-left p-3 font-black text-black">{t('table.headers.seller')}</th>
                    <th className="text-left p-3 font-black text-black">{t('table.headers.status')}</th>
                    <th className="text-left p-3 font-black text-black">{t('table.headers.category')}</th>
                    <th className="text-left p-3 font-black text-black">{t('table.headers.stats')}</th>
                    <th className="text-left p-3 font-black text-black">{t('table.headers.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => {
                    const stats = getProductStats(product)
                    const isSelected = selectedProducts.has(product.id)
                    
                    return (
                      <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleSelectProduct(product.id, checked as boolean)
                            }
                          />
                        </td>
                        
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 border-2 border-black rounded overflow-hidden">
                              {product.previewImages?.[0] ? (
                                <Image
                                  src={`/api/files/${product.previewImages[0]}`}
                                  alt={product.title}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-black text-sm line-clamp-1">
                                {product.title}
                              </p>
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {product.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-black text-green-600">
                                  {formatCurrency(product.price)}
                                </span>
                                {product.featured && (
                                  <Star className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-3">
                          <div className="text-sm">
                            <p className="font-bold">ID: {product.sellerId.slice(0, 8)}...</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(product.createdAt)}
                            </p>
                          </div>
                        </td>
                        
                        <td className="p-3">
                          {getStatusBadge(product.status)}
                        </td>
                        
                        <td className="p-3">
                          {getCategoryBadge(product.category)}
                        </td>
                        
                        <td className="p-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-blue-500" />
                              <span>{stats.views}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="h-3 w-3 text-green-500" />
                              <span>{stats.downloads}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{stats.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-gray-500" />
                              <span>{stats.reviews}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => openProductAction('view_details', product)}
                              size="sm"
                              variant="outline"
                              className="border-2 border-black"
                              title={tActions('view_details')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            {product.status === ProductStatus.PENDING && (
                              <>
                                <Button
                                  onClick={() => openProductAction('approve', product)}
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600 text-white border-2 border-black"
                                  title={tActions('approve')}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => openProductAction('reject', product)}
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600 text-white border-2 border-black"
                                  title={tActions('reject')}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}

                            {product.status === ProductStatus.APPROVED && (
                              <Button
                                onClick={() => openProductAction('feature', product, !product.featured)}
                                size="sm"
                                className={`border-2 border-black ${
                                  product.featured 
                                    ? 'bg-yellow-500 text-black' 
                                    : 'bg-gray-500 text-white hover:bg-gray-600'
                                }`}
                                title={product.featured ? tActions('unfeature') : tActions('feature')}
                              >
                                <Star className="h-3 w-3" />
                              </Button>
                            )}

                            {(product.status === ProductStatus.APPROVED || product.status === ProductStatus.REJECTED) && (
                              <Button
                                onClick={() => openProductAction('suspend', product)}
                                size="sm"
                                className="bg-purple-500 hover:bg-purple-600 text-white border-2 border-black"
                                title={tActions('suspend')}
                              >
                                <Flag className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-black">
          <p className="text-sm font-bold text-gray-600">
            {t('pagination.showing', {
              start: ((currentPage - 1) * itemsPerPage) + 1,
              end: Math.min(currentPage * itemsPerPage, filteredProducts.length),
              total: filteredProducts.length
            })}
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="border-2 border-black"
            >
              {t('pagination.previous')}
            </Button>
            
            <span className="px-3 py-1 bg-orange-500 text-black border-2 border-black font-black rounded">
              {currentPage} / {totalPages}
            </span>
            
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="border-2 border-black"
            >
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Modal de acción de producto */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={
          productAction.action === 'view_details' ? t('modals.view_details') :
          productAction.action === 'approve' ? t('modals.approve_product') :
          productAction.action === 'reject' ? t('modals.reject_product') :
          productAction.action === 'suspend' ? t('modals.suspend_product') :
          productAction.action === 'feature' ? t('modals.feature_product') : 
          t('modals.product_action')
        }
      >
        <div className="space-y-4">
          {productAction.product && (
            <>
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-100 border-2 border-black rounded overflow-hidden">
                    {productAction.product.previewImages?.[0] ? (
                      <Image
                        src={`/api/files/${productAction.product.previewImages[0]}`}
                        alt={productAction.product.title}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-lg">
                      {productAction.product.title}
                    </h3>
                    <p className="text-gray-600 font-medium text-sm mb-2">
                      {productAction.product.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(productAction.product.status)}
                      {getCategoryBadge(productAction.product.category)}
                      <span className="text-lg font-black text-green-600">
                        {formatCurrency(productAction.product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {productAction.action === 'view_details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.product_id')}</label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded border">{productAction.product.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.seller_id')}</label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded border">{productAction.product.sellerId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.created')}</label>
                      <p className="text-sm bg-gray-100 p-2 rounded border">
                        {new Date(productAction.product.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.difficulty')}</label>
                      <p className="text-sm bg-gray-100 p-2 rounded border">
                        {productAction.product.difficulty}
                      </p>
                    </div>
                  </div>

                  {/* Estadísticas del producto */}
                  <div className="space-y-2">
                    <h4 className="font-black text-gray-800">{t('details.statistics')}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {(() => {
                        const stats = getProductStats(productAction.product)
                        return (
                          <>
                            <div className="bg-blue-50 p-3 rounded border-2 border-blue-200">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-blue-600" />
                                <span className="font-bold">{t('details.views')}: {stats.views}</span>
                              </div>
                            </div>
                            <div className="bg-green-50 p-3 rounded border-2 border-green-200">
                              <div className="flex items-center gap-2">
                                <Download className="h-4 w-4 text-green-600" />
                                <span className="font-bold">{t('details.downloads')}: {stats.downloads}</span>
                              </div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded border-2 border-yellow-200">
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-600" />
                                <span className="font-bold">{t('details.rating')}: {stats.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded border-2 border-purple-200">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-purple-600" />
                                <span className="font-bold">{t('details.reviews')}: {stats.reviews}</span>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Herramientas y materiales */}
                  {(productAction.product.toolsRequired?.length > 0 || productAction.product.materials?.length > 0) && (
                    <div className="space-y-2">
                      <h4 className="font-black text-gray-800">{t('details.technical_details')}</h4>
                      {productAction.product.toolsRequired?.length > 0 && (
                        <div>
                          <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.tools')}</label>
                          <div className="flex flex-wrap gap-1">
                            {productAction.product.toolsRequired.map((tool, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {productAction.product.materials?.length > 0 && (
                        <div>
                          <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.materials')}</label>
                          <div className="flex flex-wrap gap-1">
                            {productAction.product.materials.map((material, index) => (
                              <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border">
                                {material}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {productAction.action === 'feature' && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <span className="font-bold text-yellow-800">
                      {productAction.featured ? t('modals.unfeature_action') : t('modals.feature_action')}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    {productAction.featured 
                      ? t('modals.unfeature_description')
                      : t('modals.feature_description')
                    }
                  </p>
                </div>
              )}

              {productAction.action !== 'view_details' && productAction.action !== 'feature' && (
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    {t('forms.reason_label')} *
                  </label>
                  <textarea
                    value={productAction.reason}
                    onChange={(e) => setProductAction(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder={
                      productAction.action === 'approve' ? t('forms.approve_reason_placeholder') :
                      productAction.action === 'reject' ? t('forms.reject_reason_placeholder') :
                      t('forms.suspend_reason_placeholder')
                    }
                    className="w-full px-3 py-2 border-2 border-black rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => setShowProductModal(false)}
                  variant="outline"
                  className="border-2 border-black"
                >
                  {tCommon('cancel')}
                </Button>
                
                {productAction.action !== 'view_details' && (
                  <Button
                    onClick={handleProductAction}
                    disabled={isLoading || ((productAction.action === 'approve' || productAction.action === 'reject' || productAction.action === 'suspend') && !productAction.reason.trim())}
                    className={
                      productAction.action === 'approve' ? 'bg-green-500 hover:bg-green-600 text-white border-2 border-black' :
                      productAction.action === 'reject' ? 'bg-red-500 hover:bg-red-600 text-white border-2 border-black' :
                      productAction.action === 'suspend' ? 'bg-purple-500 hover:bg-purple-600 text-white border-2 border-black' :
                      productAction.action === 'feature' ? 'bg-yellow-500 hover:bg-yellow-600 text-black border-2 border-black' :
                      'bg-gray-500 hover:bg-gray-600 text-white border-2 border-black'
                    }
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('forms.processing')}
                      </>
                    ) : (
                      <>
                        {productAction.action === 'approve' && <CheckCircle className="h-4 w-4 mr-2" />}
                        {productAction.action === 'reject' && <XCircle className="h-4 w-4 mr-2" />}
                        {productAction.action === 'suspend' && <Flag className="h-4 w-4 mr-2" />}
                        {productAction.action === 'feature' && <Star className="h-4 w-4 mr-2" />}
                        
                        {productAction.action === 'approve' ? t('forms.approve_product') :
                         productAction.action === 'reject' ? t('forms.reject_product') :
                         productAction.action === 'suspend' ? t('forms.suspend_product') :
                         productAction.action === 'feature' ? (productAction.featured ? t('forms.unfeature_product') : t('forms.feature_product')) : 
                         tCommon('confirm')
                        }
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal de acciones en lote */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={t('bulk.modal_title', { 
          action: bulkAction === 'approve' ? t('bulk.approve') : 
                  bulkAction === 'reject' ? t('bulk.reject') : 
                  t('bulk.suspend') 
        })}
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-blue-800">
                {t('bulk.selected_products', { count: selectedProducts.size })}
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {t('bulk.action_description')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">
              {t('bulk.reason_label', { 
                action: bulkAction === 'approve' ? t('bulk.approve') : 
                        bulkAction === 'reject' ? t('bulk.reject') : 
                        t('bulk.suspend') 
              })} *
            </label>
            <textarea
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder={t('bulk.reason_placeholder', { 
                action: bulkAction === 'approve' ? t('bulk.approve') : 
                        bulkAction === 'reject' ? t('bulk.reject') : 
                        t('bulk.suspend') 
              })}
              className="w-full px-3 py-2 border-2 border-black rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={() => setShowBulkModal(false)}
              variant="outline"
              className="border-2 border-black"
            >
              {tCommon('cancel')}
            </Button>
            
            <Button
              onClick={handleBulkAction}
              disabled={isLoading || !bulkReason.trim()}
              className={
                bulkAction === 'approve' 
                  ? 'bg-green-500 hover:bg-green-600 text-white border-2 border-black'
                  : bulkAction === 'reject'
                  ? 'bg-red-500 hover:bg-red-600 text-white border-2 border-black'
                  : 'bg-purple-500 hover:bg-purple-600 text-white border-2 border-black'
              }
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('forms.processing')}
                </>
              ) : (
                <>
                  {bulkAction === 'approve' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : bulkAction === 'reject' ? (
                    <XCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Flag className="h-4 w-4 mr-2" />
                  )}
                  {t('bulk.confirm_action', {
                    action: bulkAction === 'approve' ? t('bulk.approve') : 
                            bulkAction === 'reject' ? t('bulk.reject') : 
                            t('bulk.suspend'),
                    count: selectedProducts.size
                  })}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}