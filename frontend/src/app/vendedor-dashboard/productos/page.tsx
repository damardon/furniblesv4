'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  Filter,
  Plus,
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
  Copy,
  Archive,
  Trash2,
  Upload,
  BarChart3
} from 'lucide-react'

// Stores y Types
import { useSellerStore } from '@/lib/stores/seller-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Product, ProductStatus, ProductCategory, Difficulty } from '@/types'

// Helper function para API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('furnibles-auth-storage')
  const parsedToken = token ? JSON.parse(token).state?.token : null
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(parsedToken && { 'Authorization': `Bearer ${parsedToken}` }),
      ...options.headers,
    },
    ...options,
  })
  
  return response.json()
}

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Checkbox } from '@/components/ui/checkbox'

// Tipos para las acciones de producto
type ProductAction = 'publish' | 'unpublish' | 'edit' | 'duplicate' | 'archive' | 'delete' | 'view_details' | null

interface ProductActionState {
  action: ProductAction
  product: Product | null
  reason: string
}

export default function SellerProductsPage() {
  // Estados principales
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [productAction, setProductAction] = useState<ProductActionState>({
    action: null,
    product: null,
    reason: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'publish' | 'unpublish' | 'archive' | 'delete' | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'ALL'>('ALL')

  const t = useTranslations('seller.products')
  const tCommon = useTranslations('common')
  const tProducts = useTranslations('products')

  // Stores
  const { user } = useAuthStore()
  const { 
    products,
    productsLoading,
    productsPagination,
    productFilters,
    loadProducts,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    publishProduct,
    setProductFilters
  } = useSellerStore()

  // Cargar productos al montar el componente
  useEffect(() => {
    const loadSellerProducts = async () => {
      setIsLoading(true)
      try {
        await loadProducts(1)
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSellerProducts()
  }, [loadProducts])

  // Filtrar y paginar productos
  const filteredProducts = useMemo(() => {
    let filtered = products || []

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
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
    const { action, product } = productAction
    if (!action || !product) return

    setIsLoading(true)
    try {
      let result
      
      switch (action) {
        case 'publish':
          result = await publishProduct(product.id)
          break
          
        case 'unpublish':
          // Para unpublish, necesitamos hacer una llamada directa a la API
          result = await apiRequest(`/products/${product.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'DRAFT' }),
          })
          break
          
        case 'duplicate':
          result = await duplicateProduct(product.id)
          break
          
        case 'archive':
          // Para archive, necesitamos hacer una llamada directa a la API
          result = await apiRequest(`/products/${product.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'SUSPENDED' }),
          })
          break
          
        case 'delete':
          result = await deleteProduct(product.id)
          break
          
        default:
          throw new Error('Acción no válida')
      }

      if (result.success) {
        // Limpiar estado de acción
        setProductAction({
          action: null,
          product: null,
          reason: ''
        })
        setShowProductModal(false)
        
        // Recargar productos
        await loadProducts(currentPage)
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
        switch (bulkAction) {
          case 'publish':
            return publishProduct(productId)
          case 'unpublish':
            return apiRequest(`/products/${productId}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'DRAFT' }),
            })
          case 'archive':
            return apiRequest(`/products/${productId}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'SUSPENDED' }),
            })
          case 'delete':
            return deleteProduct(productId)
          default:
            throw new Error('Acción en lote no válida')
        }
      })

      await Promise.all(promises)
      setSelectedProducts(new Set())
      setBulkAction(null)
      setShowBulkModal(false)
      await loadProducts(currentPage)
    } catch (error) {
      console.error('Error in bulk action:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener badge de estado
  const getStatusBadge = (status: ProductStatus) => {
    const configs = {
      'APPROVED': {
        className: 'bg-green-500 text-white border-2 border-black',
        text: t('status.approved')
      },
      'PENDING': {
        className: 'bg-yellow-500 text-black border-2 border-black',
        text: t('status.pending')
      },
      'REJECTED': {
        className: 'bg-red-500 text-white border-2 border-black',
        text: t('status.rejected')
      },
      'SUSPENDED': {
        className: 'bg-purple-500 text-white border-2 border-black',
        text: t('status.suspended')
      },
      'DRAFT': {
        className: 'bg-gray-500 text-white border-2 border-black',
        text: t('status.draft')
      }
    }

    const config = configs[status] || configs['DRAFT']
    
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
        {tProducts(`categories.${category.toLowerCase()}`)}
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

  const openProductAction = (action: ProductAction, product: Product) => {
    setProductAction({
      action,
      product,
      reason: ''
    })
    setShowProductModal(true)
  }

  const openBulkAction = (action: 'publish' | 'unpublish' | 'archive' | 'delete') => {
    setBulkAction(action)
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

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (!products) return { total: 0, drafts: 0, published: 0, pending: 0 }
    
    return {
      total: products.length,
      drafts: products.filter(p => p.status === 'DRAFT').length,
      published: products.filter(p => p.status === 'APPROVED').length,
      pending: products.filter(p => p.status === 'PENDING').length
    }
  }, [products])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">{t('title')}</h1>
          <p className="text-gray-600 font-bold">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => loadProducts(currentPage)}
            disabled={isLoading}
            variant="outline"
            className="border-2 border-black"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {tCommon('refresh')}
          </Button>
          
          <Link href="/vendedor-dashboard/productos/nuevo">
            <Button className="bg-green-500 hover:bg-green-600 text-black border-2 border-black">
              <Plus className="h-4 w-4 mr-2" />
              {t('create_new')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.my_products')}</p>
                <p className="text-2xl font-black">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.drafts')}</p>
                <p className="text-2xl font-black">{stats.drafts}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.published')}</p>
                <p className="text-2xl font-black">{stats.published}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.pending')}</p>
                <p className="text-2xl font-black">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
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
                <option value="DRAFT">{t('status.draft')}</option>
                <option value="PENDING">{t('status.pending')}</option>
                <option value="APPROVED">{t('status.approved')}</option>
                <option value="REJECTED">{t('status.rejected')}</option>
                <option value="SUSPENDED">{t('status.suspended')}</option>
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
                <option value="TABLES">{tProducts('categories.tables')}</option>
                <option value="CHAIRS">{tProducts('categories.chairs')}</option>
                <option value="BEDS">{tProducts('categories.beds')}</option>
                <option value="STORAGE">{tProducts('categories.storage')}</option>
                <option value="OUTDOOR">{tProducts('categories.outdoor')}</option>
                <option value="DECORATIVE">{tProducts('categories.decorative')}</option>
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
                    onClick={() => openBulkAction('publish')}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white border-2 border-black"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {t('actions.publish')}
                  </Button>
                  <Button
                    onClick={() => openBulkAction('unpublish')}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black border-2 border-black"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    {t('actions.unpublish')}
                  </Button>
                  <Button
                    onClick={() => openBulkAction('delete')}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white border-2 border-black"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('actions.delete')}
                  </Button>
                  <Button
                    onClick={() => setSelectedProducts(new Set())}
                    size="sm"
                    variant="outline"
                    className="border-2 border-black"
                  >
                    {t('actions.clear')}
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
          <p className="text-gray-500 mb-6">{t('create_first')}</p>
          <Link href="/vendedor-dashboard/productos/nuevo">
            <Button className="bg-green-500 hover:bg-green-600 text-black border-2 border-black">
              <Plus className="h-4 w-4 mr-2" />
              {t('create_new')}
            </Button>
          </Link>
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
                  {product.pdfFileId ? (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="h-12 w-12 text-gray-400" />
                    </div>
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

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Link href={`/vendedor-dashboard/productos/${product.id}/editar`} className="flex-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-2 border-black"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {t('actions.edit')}
                        </Button>
                      </Link>
                      
                      {product.status === 'DRAFT' && (
                        <Button
                          onClick={() => openProductAction('publish', product)}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white border-2 border-black"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                      )}

                      <Button
                        onClick={() => openProductAction('duplicate', product)}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-black"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
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
                              {product.pdfFileId ? (
                                <div className="flex items-center justify-center h-full">
                                  <FileText className="h-6 w-6 text-gray-400" />
                                </div>
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
                            <Link href={`/vendedor-dashboard/productos/${product.id}/editar`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-2 border-black"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </Link>
                            
                            <Button
                              onClick={() => openProductAction('view_details', product)}
                              size="sm"
                              variant="outline"
                              className="border-2 border-black"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>

                            {product.status === 'DRAFT' && (
                              <Button
                                onClick={() => openProductAction('publish', product)}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white border-2 border-black"
                              >
                                <Upload className="h-3 w-3" />
                              </Button>
                            )}

                            <Button
                              onClick={() => openProductAction('duplicate', product)}
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-black"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>

                            <Button
                              onClick={() => openProductAction('delete', product)}
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white border-2 border-black"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
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
              {tCommon('previous')}
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
              {tCommon('next')}
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
          productAction.action === 'publish' ? t('modals.publish_product') :
          productAction.action === 'duplicate' ? t('modals.duplicate_product') :
          productAction.action === 'delete' ? t('modals.delete_product') :
          t('modals.product_action')
        }
      >
        <div className="space-y-4">
          {productAction.product && (
            <>
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-100 border-2 border-black rounded overflow-hidden">
                    {productAction.product.pdfFileId ? (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
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
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.rating')}</label>
                      <p className="text-sm bg-gray-100 p-2 rounded border">
                        {getProductStats(productAction.product).rating.toFixed(1)} / 5.0
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
                </div>
              )}

              {productAction.action === 'delete' && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-bold text-red-800">{t('delete_warning.title')}</span>
                  </div>
                  <p className="text-sm text-red-700">
                    {t('delete_warning.description')}
                  </p>
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
                    disabled={isLoading}
                    className={
                      productAction.action === 'publish' ? 'bg-green-500 hover:bg-green-600 text-white border-2 border-black' :
                      productAction.action === 'duplicate' ? 'bg-blue-500 hover:bg-blue-600 text-white border-2 border-black' :
                      productAction.action === 'delete' ? 'bg-red-500 hover:bg-red-600 text-white border-2 border-black' :
                      'bg-gray-500 hover:bg-gray-600 text-white border-2 border-black'
                    }
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {tCommon('loading')}
                      </>
                    ) : (
                      <>
                        {productAction.action === 'publish' && <Upload className="h-4 w-4 mr-2" />}
                        {productAction.action === 'duplicate' && <Copy className="h-4 w-4 mr-2" />}
                        {productAction.action === 'delete' && <Trash2 className="h-4 w-4 mr-2" />}
                        
                        {productAction.action === 'publish' ? t('actions.publish') :
                         productAction.action === 'duplicate' ? t('actions.duplicate') :
                         productAction.action === 'delete' ? t('actions.delete') : 
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
          action: bulkAction === 'publish' ? t('bulk.publish') :
                  bulkAction === 'unpublish' ? t('bulk.unpublish') :
                  bulkAction === 'delete' ? t('bulk.delete') : ''
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
              disabled={isLoading}
              className={
                bulkAction === 'publish' 
                  ? 'bg-green-500 hover:bg-green-600 text-white border-2 border-black'
                  : bulkAction === 'unpublish'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black border-2 border-black'
                  : 'bg-red-500 hover:bg-red-600 text-white border-2 border-black'
              }
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                <>
                  {bulkAction === 'publish' ? (
                    <Upload className="h-4 w-4 mr-2" />
                  ) : bulkAction === 'unpublish' ? (
                    <Archive className="h-4 w-4 mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {t('bulk.confirm_action', { 
                    action: bulkAction === 'publish' ? t('bulk.publish') :
                            bulkAction === 'unpublish' ? t('bulk.unpublish') :
                            t('bulk.delete'),
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