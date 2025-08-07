'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  DownloadIcon,
  FileIcon,
  CalendarIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  SearchIcon,
  FolderIcon,
  HardDriveIcon,
  ActivityIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  ShoppingCartIcon,
  EyeIcon,
  AlertTriangleIcon,
  User,
  Store
} from 'lucide-react'

// ✅ Importar APIs reales en lugar de mock
import { useAuthStore } from '@/lib/stores/auth-store'
import { 
  getUserDownloads, 
  getDownloadStats, 
  downloadFile,
  isDownloadAvailable,
  formatTimeRemaining,
  getDownloadStatus
} from '@/lib/download-api'
import type { Download, DownloadStats, DownloadFilters } from '@/lib/download-api'

export default function DownloadsPage() {
  const t = useTranslations('downloads')
  const tCommon = useTranslations('common')
  const router = useRouter()
  
  // Stores
  const { isAuthenticated, user, setLoginModalOpen } = useAuthStore()

  // States
  const [downloads, setDownloads] = useState<Download[]>([])
  const [filteredDownloads, setFilteredDownloads] = useState<Download[]>([])
  const [filters, setFilters] = useState<DownloadFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'exhausted'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastDownloadAt' | 'expiresAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [downloadingTokens, setDownloadingTokens] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<DownloadStats>({
    totalDownloads: 0,
    activeDownloads: 0,
    expiredDownloads: 0,
    totalProducts: 0,
    recentDownloads: [],
    topProducts: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoginModalOpen(true)
      router.push('/productos')
      return
    }
  }, [isAuthenticated, setLoginModalOpen, router])

  // Load user downloads and stats
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const loadDownloadsData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        console.log('🔍 [DOWNLOADS] Loading user downloads and stats')
        
        // Cargar descargas y estadísticas en paralelo
        const [downloadsResponse, statsResponse] = await Promise.all([
          getUserDownloads(filters),
          getDownloadStats()
        ])
        
        setDownloads(downloadsResponse.data)
        setStats(statsResponse)
        
        console.log('✅ [DOWNLOADS] Data loaded:', {
          downloads: downloadsResponse.data.length,
          stats: statsResponse
        })
        
      } catch (err) {
        console.error('❌ [DOWNLOADS] Error loading data:', err)
        setError(err instanceof Error ? err.message : 'Error cargando descargas')
      } finally {
        setIsLoading(false)
      }
    }

    loadDownloadsData()
  }, [isAuthenticated, user, filters])

  // Filter and search downloads
  useEffect(() => {
    let filtered = [...downloads]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(download => {
        const status = getDownloadStatus(download)
        return status === statusFilter
      })
    }

    // Search by product name or seller
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(download => 
        download.product.title.toLowerCase().includes(query) ||
        download.product.seller?.storeName?.toLowerCase().includes(query)
      )
    }

    // Sort downloads
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'lastDownloadAt':
          aValue = a.lastDownloadAt ? new Date(a.lastDownloadAt).getTime() : 0
          bValue = b.lastDownloadAt ? new Date(b.lastDownloadAt).getTime() : 0
          break
        case 'expiresAt':
          aValue = new Date(a.expiresAt).getTime()
          bValue = new Date(b.expiresAt).getTime()
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

    setFilteredDownloads(filtered)
  }, [downloads, statusFilter, searchQuery, sortBy, sortOrder])

  const handleFilterChange = (newFilters: Partial<DownloadFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const getStatusBadge = (download: Download) => {
    const status = getDownloadStatus(download)

    switch (status) {
      case 'expired':
        return {
          color: 'bg-red-400 text-black border-black',
          icon: XCircleIcon,
          text: 'Expirado'
        }
      case 'exhausted':
        return {
          color: 'bg-gray-400 text-black border-black',
          icon: AlertCircleIcon,
          text: 'Sin descargas'
        }
      case 'active':
        return {
          color: 'bg-green-500 text-white border-black',
          icon: CheckCircleIcon,
          text: 'Activo'
        }
      default:
        return {
          color: 'bg-yellow-400 text-black border-black',
          icon: ClockIcon,
          text: 'Inactivo'
        }
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (sizeInBytes: number) => {
    const sizeInMB = sizeInBytes / (1024 * 1024)
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1000)} KB`
    }
    return `${sizeInMB.toFixed(1)} MB`
  }

  const handleDownload = async (download: Download) => {
    if (downloadingTokens.has(download.id)) return

    setDownloadingTokens(prev => new Set(prev).add(download.id))

    try {
      // Verificar disponibilidad primero
      const availability = await isDownloadAvailable(download.downloadToken)
      
      if (!availability.available) {
        alert(availability.reason || 'Descarga no disponible')
        return
      }

      // Proceder con la descarga
      const result = await downloadFile(download.downloadToken)
      
      if (result.success && result.data?.downloadUrl) {
        // Crear un link temporal para la descarga
        const link = document.createElement('a')
        link.href = result.data.downloadUrl
        link.download = `${download.product.title}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Actualizar el estado local
        setDownloads(prev => 
          prev.map(d => d.id === download.id ? {
            ...d,
            downloadCount: d.downloadCount + 1,
            lastDownloadAt: new Date().toISOString(),
            isActive: d.downloadCount + 1 < d.maxDownloads
          } : d)
        )

        console.log('✅ [DOWNLOADS] Download started successfully')
      } else {
        alert(result.error || 'Error al descargar archivo')
      }
    } catch (error) {
      console.error('❌ [DOWNLOADS] Download error:', error)
      alert('Error al descargar archivo')
    } finally {
      setDownloadingTokens(prev => {
        const newSet = new Set(prev)
        newSet.delete(download.id)
        return newSet
      })
    }
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-black font-black text-xl uppercase">Acceso restringido</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-black font-black text-xl uppercase">Cargando descargas...</p>
        </div>
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
            <Link href="/pedidos" className="hover:text-orange-500 transition-colors">
              Pedidos
            </Link>
            <span>/</span>
            <span className="text-orange-500">Descargas</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/pedidos"
              className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver a pedidos
            </Link>
            
            <div>
              <h1 className="text-4xl font-black text-black uppercase flex items-center gap-3">
                <DownloadIcon className="w-8 h-8 text-orange-500" />
                Mis Descargas
              </h1>
              <p className="text-gray-600 font-bold mt-2">
                Gestiona y descarga tus archivos PDF comprados
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div 
              className="bg-blue-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <FolderIcon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-xl font-black text-black mb-1">{stats.totalProducts}</div>
              <div className="text-xs font-black text-black uppercase">Productos</div>
            </div>
            
            <div 
              className="bg-green-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <CheckCircleIcon className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-xl font-black text-black mb-1">{stats.activeDownloads}</div>
              <div className="text-xs font-black text-black uppercase">Activos</div>
            </div>
            
            <div 
              className="bg-red-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <XCircleIcon className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <div className="text-xl font-black text-black mb-1">{stats.expiredDownloads}</div>
              <div className="text-xs font-black text-black uppercase">Expirados</div>
            </div>
            
            <div 
              className="bg-purple-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ActivityIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-xl font-black text-black mb-1">{stats.totalDownloads}</div>
              <div className="text-xs font-black text-black uppercase">Descargas</div>
            </div>
            
            <div 
              className="bg-orange-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <div className="text-xl font-black text-black mb-1">{stats.recentDownloads.length}</div>
              <div className="text-xs font-black text-black uppercase">Recientes</div>
            </div>
            
            <div 
              className="bg-cyan-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <HardDriveIcon className="w-6 h-6 mx-auto mb-2 text-cyan-600" />
              <div className="text-xl font-black text-black mb-1">{stats.topProducts.length}</div>
              <div className="text-xs font-black text-black uppercase">Top PDFs</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div 
          className="bg-white border-4 border-black p-6 mb-8 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black" />
              <input
                type="text"
                placeholder="Buscar por producto o vendedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="expired">Expirados</option>
              <option value="exhausted">Sin descargas</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="createdAt">Por fecha de compra</option>
              <option value="lastDownloadAt">Por última descarga</option>
              <option value="expiresAt">Por fecha de expiración</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="desc">Más recientes</option>
              <option value="asc">Más antiguos</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div 
            className="bg-red-100 border-4 border-red-500 p-6 mb-8 text-center"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-black text-red-600 uppercase mb-4">Error</h2>
            <p className="text-red-700 font-bold">{error}</p>
          </div>
        )}

        {/* Downloads List */}
        {filteredDownloads.length === 0 ? (
          <div 
            className="bg-gray-100 border-4 border-black p-12 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <div className="text-8xl mb-6">📄</div>
            <h2 className="text-3xl font-black text-black uppercase mb-4">
              {downloads.length === 0 ? 'No tienes descargas' : 'No se encontraron resultados'}
            </h2>
            <p className="text-gray-600 font-bold mb-6 text-lg">
              {downloads.length === 0 
                ? 'Compra algunos productos para ver tus descargas aquí'
                : 'Intenta cambiar los filtros de búsqueda'
              }
            </p>
            <Link 
              href="/productos"
              className="inline-flex items-center gap-2 bg-orange-500 border-4 border-black px-6 py-3 font-black text-black uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ShoppingCartIcon className="w-5 h-5" />
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDownloads.map((download) => {
              const status = getStatusBadge(download)
              const StatusIcon = status.icon
              const isDownloading = downloadingTokens.has(download.id)
              const canDownload = getDownloadStatus(download) === 'active'
              const remainingTime = formatTimeRemaining(download.expiresAt)

              return (
                <div 
                  key={download.id}
                  className="bg-white border-4 border-black p-6 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
                  style={{ boxShadow: '6px 6px 0 #000000' }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-500 border-3 border-black flex items-center justify-center">
                        <FileIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span 
                          className={`${status.color} border-2 text-xs font-black px-2 py-1 uppercase flex items-center gap-1`}
                          style={{ boxShadow: '2px 2px 0 #000000' }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.text}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm">
                      <div className="font-black text-black">PDF</div>
                      <div className="text-gray-600 font-bold">{remainingTime}</div>
                    </div>
                  </div>

                  {/* Product Title */}
                  <div className="mb-4">
                    <Link 
                      href={`/productos/${download.product.slug}`}
                      className="text-lg font-black text-black uppercase hover:text-orange-500 transition-colors line-clamp-2 block mb-2"
                    >
                      {download.product.title}
                    </Link>
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600 font-bold">
                        {download.product.seller?.storeName || 'Vendedor'}
                      </span>
                    </div>
                  </div>

                  {/* Download Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-black uppercase">Descargas:</span>
                      <span className="text-sm font-black text-black">
                        {download.downloadCount} / {download.maxDownloads}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 border-2 border-black h-3">
                      <div 
                        className="h-full border-r-2 border-black transition-all duration-300"
                        style={{ 
                          width: `${Math.min((download.downloadCount / download.maxDownloads) * 100, 100)}%`,
                          backgroundColor: download.downloadCount >= download.maxDownloads ? '#ef4444' : '#3b82f6'
                        }}
                      />
                    </div>
                  </div>

                  {/* Expiry Warning */}
                  {getDownloadStatus(download) === 'active' && remainingTime !== 'Expirado' && (
                    <div 
                      className="bg-yellow-100 border-2 border-yellow-500 p-3 mb-4 flex items-center gap-2"
                      style={{ boxShadow: '2px 2px 0 #000000' }}
                    >
                      <AlertTriangleIcon className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-800 font-bold text-sm">
                        Expira en {remainingTime}
                      </span>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="block text-gray-600 font-bold">Comprado:</span>
                      <span className="text-black font-black">{formatDate(download.order.createdAt)}</span>
                    </div>
                    <div>
                      <span className="block text-gray-600 font-bold">Expira:</span>
                      <span className="text-black font-black">{formatDate(download.expiresAt)}</span>
                    </div>
                    {download.lastDownloadAt && (
                      <>
                        <div>
                          <span className="block text-gray-600 font-bold">Última descarga:</span>
                          <span className="text-black font-black">{formatDate(download.lastDownloadAt)}</span>
                        </div>
                        <div>
                          <span className="block text-gray-600 font-bold">Pedido:</span>
                          <span className="text-black font-black">#{download.order.orderNumber}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/productos/${download.product.slug}`}
                        className="flex items-center gap-1 text-sm bg-blue-400 border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <EyeIcon className="w-3 h-3" />
                        Ver producto
                      </Link>
                      
                      <Link
                        href={`/pedidos/${download.order.orderNumber}`}
                        className="flex items-center gap-1 text-sm bg-gray-300 border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-gray-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <ExternalLinkIcon className="w-3 h-3" />
                        Ver pedido
                      </Link>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(download)}
                      disabled={!canDownload || isDownloading}
                      className={`flex items-center gap-2 px-4 py-2 border-3 border-black font-black text-sm uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        canDownload 
                          ? 'bg-green-500 text-white hover:bg-yellow-400 hover:text-black' 
                          : 'bg-gray-400 text-black'
                      }`}
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCwIcon className="w-4 h-4 animate-spin" />
                          Descargando...
                        </>
                      ) : canDownload ? (
                        <>
                          <DownloadIcon className="w-4 h-4" />
                          Descargar PDF
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-4 h-4" />
                          No disponible
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Results Counter */}
        {filteredDownloads.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 font-bold">
              Mostrando {filteredDownloads.length} de {downloads.length} descargas
            </p>
          </div>
        )}

        {/* Help Section */}
        <div 
          className="bg-blue-100 border-4 border-black p-8 mt-8 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <h3 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-3">
            💡 Ayuda y consejos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-black text-black uppercase mb-3 text-lg">Límites de descarga:</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="font-medium flex items-start gap-2">
                  <span className="text-orange-500 font-black">•</span>
                  Máximo 10 descargas por producto
                </li>
                <li className="font-medium flex items-start gap-2">
                  <span className="text-orange-500 font-black">•</span>
                  Los tokens expiran en 30 días
                </li>
                <li className="font-medium flex items-start gap-2">
                  <span className="text-orange-500 font-black">•</span>
                  Solo el comprador puede descargar
                </li>
                <li className="font-medium flex items-start gap-2">
                  <span className="text-orange-500 font-black">•</span>
                  Descarga inmediata tras el pago
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-black uppercase mb-3 text-lg">Problemas comunes:</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="font-medium flex items-start gap-2">
                  <span className="text-blue-500 font-black">•</span>
                  Mantén conexión estable durante la descarga
                </li>
                <li className="font-medium flex items-start gap-2">
                  <span className="text-blue-500 font-black">•</span>
                  Token expirado: contacta soporte
                </li>
                <li className="font-medium flex items-start gap-2">
                  <span className="text-blue-500 font-black">•</span>
                  PDFs optimizados para impresión
                </li>
                <li className="font-medium flex items-start gap-2">
                  <span className="text-blue-500 font-black">•</span>
                  Guarda copias de seguridad localmente
                </li>
              </ul>
            </div>
          </div>
          
          {/* Contact Support */}
          <div className="mt-6 text-center">
            <Link
              href="/ayuda"
              className="bg-orange-500 border-4 border-black text-black font-black py-3 px-6 uppercase hover:bg-yellow-400 transition-all inline-flex items-center gap-2"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <AlertCircleIcon className="w-5 h-5" />
              Centro de ayuda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}