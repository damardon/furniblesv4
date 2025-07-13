'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Download,
  Star,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { useSellerStore } from '@/lib/stores/seller-store'
import { ProductStatus, ProductCategory, Difficulty } from '@/types'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Funciones de formato simples
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('es-ES').format(num)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function SellerProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const {
    products,
    productsLoading,
    productsPagination,
    productFilters,
    selectedProducts,
    bulkActionLoading,
    loadProducts,
    setProductFilters,
    selectProduct,
    selectAllProducts,
    clearProductSelection,
    deleteProduct,
    duplicateProduct,
    publishProduct,
    bulkUpdateProducts,
  } = useSellerStore()

  // Cargar productos iniciales
  useEffect(() => {
    loadProducts(1)
  }, [loadProducts])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts(1, { ...productFilters, search: searchQuery })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [productFilters, searchQuery, loadProducts])

  // Manejadores de eventos
  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleFilterChange = (key: keyof typeof productFilters, value: string) => {
    setProductFilters({ [key]: value })
  }

  const handlePageChange = (page: number) => {
    loadProducts(page)
  }

  const handleProductAction = async (action: string, productId: string) => {
    switch (action) {
      case 'delete':
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
          await deleteProduct(productId)
        }
        break
      case 'duplicate':
        await duplicateProduct(productId)
        break
      case 'publish':
        await publishProduct(productId)
        break
    }
  }

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedProducts.length === 0) return
    
    const confirmMessage = 
      action === 'delete' 
        ? `¿Eliminar ${selectedProducts.length} producto(s)?`
        : `¿${action === 'publish' ? 'Publicar' : 'Despublicar'} ${selectedProducts.length} producto(s)?`
    
    if (confirm(confirmMessage)) {
      await bulkUpdateProducts(action, selectedProducts)
    }
  }

  // Función para obtener el color del estado
  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.APPROVED:
        return 'bg-green-500 text-white'
      case ProductStatus.PENDING:
        return 'bg-yellow-500 text-black'
      case ProductStatus.DRAFT:
        return 'bg-gray-500 text-white'
      case ProductStatus.REJECTED:
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  // Función para obtener el ícono del estado
  const getStatusIcon = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />
      case ProductStatus.PENDING:
        return <Clock className="h-4 w-4" />
      case ProductStatus.DRAFT:
        return <Package className="h-4 w-4" />
      case ProductStatus.REJECTED:
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase text-black">Mis Productos</h1>
            <p className="text-gray-600 font-bold">
              {productsPagination.total} producto(s) total
            </p>
          </div>

          <Link
            href="/vendedor/productos/nuevo"
            className="flex items-center gap-2 px-4 py-3 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <Plus className="h-5 w-5" />
            SUBIR PRODUCTO
          </Link>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        {/* Barra superior */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar productos por título..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2">
            {/* Toggle filtros */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-3 border-2 border-black font-bold transition-all ${
                filtersOpen ? 'bg-orange-500 text-black' : 'bg-white text-black hover:bg-yellow-400'
              }`}
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <Filter className="h-4 w-4" />
              FILTROS
            </button>

            {/* Vista */}
            <div className="flex border-2 border-black bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-all ${
                  viewMode === 'grid' ? 'bg-orange-500 text-black' : 'bg-white text-black hover:bg-yellow-400'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 transition-all ${
                  viewMode === 'list' ? 'bg-orange-500 text-black' : 'bg-white text-black hover:bg-yellow-400'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Panel de filtros expandible */}
        {filtersOpen && (
          <div className="border-t-2 border-black pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Estado */}
              <div>
                <label className="block text-sm font-black text-black mb-2">ESTADO</label>
                <select
                  value={productFilters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="">Todos los estados</option>
                  <option value={ProductStatus.DRAFT}>Borrador</option>
                  <option value={ProductStatus.PENDING}>Pendiente</option>
                  <option value={ProductStatus.APPROVED}>Aprobado</option>
                  <option value={ProductStatus.REJECTED}>Rechazado</option>
                </select>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-black text-black mb-2">CATEGORÍA</label>
                <select
                  value={productFilters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="">Todas las categorías</option>
                  <option value={ProductCategory.TABLES}>Mesas</option>
                  <option value={ProductCategory.CHAIRS}>Sillas</option>
                  <option value={ProductCategory.BEDS}>Camas</option>
                  <option value={ProductCategory.STORAGE}>Almacenamiento</option>
                  <option value={ProductCategory.OUTDOOR}>Exterior</option>
                  <option value={ProductCategory.DECORATIVE}>Decorativo</option>
                </select>
              </div>

              {/* Dificultad */}
              <div>
                <label className="block text-sm font-black text-black mb-2">DIFICULTAD</label>
                <select
                  value={productFilters.difficulty || ''}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="">Todas las dificultades</option>
                  <option value={Difficulty.EASY}>Fácil</option>
                  <option value={Difficulty.INTERMEDIATE}>Intermedio</option>
                  <option value={Difficulty.ADVANCED}>Avanzado</option>
                </select>
              </div>

              {/* Ordenar */}
              <div>
                <label className="block text-sm font-black text-black mb-2">ORDENAR POR</label>
                <select
                  value={`${productFilters.sortBy}-${productFilters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    handleFilterChange('sortBy', sortBy)
                    handleFilterChange('sortOrder', sortOrder)
                  }}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="createdAt-desc">Más recientes</option>
                  <option value="createdAt-asc">Más antiguos</option>
                  <option value="title-asc">Título A-Z</option>
                  <option value="title-desc">Título Z-A</option>
                  <option value="price-desc">Precio mayor</option>
                  <option value="price-asc">Precio menor</option>
                  <option value="rating-desc">Mejor valorados</option>
                  <option value="sales-desc">Más vendidos</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ACCIONES EN LOTE */}
      {selectedProducts.length > 0 && (
        <div className="bg-yellow-100 border-[3px] border-yellow-500 p-4" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-black text-yellow-800">
                {selectedProducts.length} producto(s) seleccionado(s)
              </span>
              <button
                onClick={clearProductSelection}
                className="text-yellow-600 hover:text-yellow-800 font-bold text-sm"
              >
                Limpiar selección
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                disabled={bulkActionLoading}
                className="px-3 py-2 bg-green-500 border-2 border-green-600 font-bold text-green-800 hover:bg-green-400 transition-all disabled:opacity-50"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                PUBLICAR
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={bulkActionLoading}
                className="px-3 py-2 bg-red-500 border-2 border-red-600 font-bold text-red-800 hover:bg-red-400 transition-all disabled:opacity-50"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                ELIMINAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE PRODUCTOS */}
      {productsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">Cargando productos...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border-[3px] border-black p-12 text-center" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-black text-black mb-2">No tienes productos aún</h3>
          <p className="text-gray-600 font-bold mb-6">
            Comienza subiendo tu primer producto para empezar a vender.
          </p>
          <Link
            href="/vendedor/productos/nuevo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <Plus className="h-5 w-5" />
            SUBIR PRIMER PRODUCTO
          </Link>
        </div>
      ) : (
        <>
          {/* Vista Grid */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border-[3px] border-black overflow-hidden"
                  style={{ boxShadow: '6px 6px 0 #000000' }}
                >
                  {/* Imagen del producto */}
                  <div className="relative aspect-video bg-gray-100">
                    {product.previewImages?.[0] ? (
                      <Image
                        src={product.previewImages[0]}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Selector de checkbox */}
                    <div className="absolute top-3 left-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => selectProduct(product.id)}
                        className="w-5 h-5 border-2 border-black"
                      />
                    </div>

                    {/* Estado del producto */}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-black border-2 border-black ${getStatusColor(product.status)}`}>
                        {getStatusIcon(product.status)}
                        {product.status}
                      </span>
                    </div>

                    {/* Menú de acciones */}
                    <div className="absolute bottom-3 right-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all">
                            <MoreVertical className="h-4 w-4 text-black" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-2 border-black">
                          <DropdownMenuItem asChild>
                            <Link href={`/vendedor/productos/${product.id}/editar`} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleProductAction('duplicate', product.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          {product.status === ProductStatus.DRAFT && (
                            <DropdownMenuItem onClick={() => handleProductAction('publish', product.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Publicar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleProductAction('delete', product.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Contenido del producto */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-black text-lg text-black line-clamp-2">
                        {product.title}
                      </h3>
                      <span className="text-lg font-black text-green-600 ml-2">
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 font-bold mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Métricas */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(product.viewCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {formatNumber(product.downloadCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(product.createdAt)}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 border border-blue-300 font-bold">
                        {product.category}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 border border-purple-300 font-bold">
                        {product.difficulty}
                      </span>
                    </div>

                    {/* Acciones principales */}
                    <div className="flex gap-2">
                      <Link
                        href={`/vendedor/productos/${product.id}/editar`}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <Edit className="h-4 w-4" />
                        EDITAR
                      </Link>
                      <Link
                        href={`/productos/${product.slug}`}
                        target="_blank"
                        className="flex items-center justify-center px-3 py-2 bg-gray-500 border-2 border-black font-bold text-white hover:bg-gray-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINACIÓN */}
          {productsPagination.totalPages > 1 && (
            <div className="bg-white border-[3px] border-black p-4" style={{ boxShadow: '6px 6px 0 #000000' }}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-gray-600">
                  Mostrando {((productsPagination.page - 1) * productsPagination.limit) + 1} - {Math.min(productsPagination.page * productsPagination.limit, productsPagination.total)} de {productsPagination.total} productos
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(productsPagination.page - 1)}
                    disabled={productsPagination.page === 1}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-black font-bold text-black hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, productsPagination.totalPages) }, (_, i) => {
                      const page = i + 1
                      const isActive = page === productsPagination.page
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 border-2 border-black font-black transition-all ${
                            isActive
                              ? 'bg-orange-500 text-black'
                              : 'bg-white text-black hover:bg-yellow-400'
                          }`}
                          style={{ boxShadow: '2px 2px 0 #000000' }}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(productsPagination.page + 1)}
                    disabled={productsPagination.page === productsPagination.totalPages}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-black font-bold text-black hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}