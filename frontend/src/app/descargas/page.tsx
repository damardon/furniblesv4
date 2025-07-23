'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  FilterIcon,
  SearchIcon,
  FolderIcon,
  HardDriveIcon,
  ActivityIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  ShoppingCartIcon,
  EyeIcon,
  AlertTriangleIcon
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { 
  getDownloadTokensByUserId, 
  getDownloadStats, 
  simulateDownload,
  DownloadToken 
} from '@/data/mockDownloads'

export default function DownloadsPage() {
  const t = useTranslations('downloads')
  const tCommon = useTranslations('common')
  const tProducts = useTranslations('products')
  const router = useRouter()
  
  // Stores
  const { isAuthenticated, user, setLoginModalOpen } = useAuthStore()

  // States
  const [downloadTokens, setDownloadTokens] = useState<DownloadToken[]>([])
  const [filteredTokens, setFilteredTokens] = useState<DownloadToken[]>([])
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'downloads' | 'expiry'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [downloadingTokens, setDownloadingTokens] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeTokens: 0,
    expiredTokens: 0,
    totalDownloads: 0,
    downloadsThisMonth: 0,
    totalFileSize: 0
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoginModalOpen(true)
      router.push('/productos')
      return
    }
  }, [isAuthenticated, setLoginModalOpen, router])

  // Load user downloads
  useEffect(() => {
    if (user?.id) {
      const userTokens = getDownloadTokensByUserId(user.id)
      const userStats = getDownloadStats(user.id)
      
      setDownloadTokens(userTokens)
      setFilteredTokens(userTokens)
      setStats(userStats)
    }
  }, [user?.id])

  // Filter and search downloads
  useEffect(() => {
    let filtered = [...downloadTokens]

    // Filter by status
    switch (filterStatus) {
      case 'ACTIVE':
        filtered = filtered.filter(token => 
          token.isActive && new Date(token.expiresAt) > new Date()
        )
        break
      case 'EXPIRED':
        filtered = filtered.filter(token => 
          new Date(token.expiresAt) <= new Date()
        )
        break
      case 'EXHAUSTED':
        filtered = filtered.filter(token => 
          token.downloadCount >= token.downloadLimit
        )
        break
      // 'ALL' doesn't filter
    }

    // Search by product name or seller
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(token => 
        token.productTitle.toLowerCase().includes(query) ||
        token.sellerName.toLowerCase().includes(query) ||
        token.storeName.toLowerCase().includes(query)
      )
    }

    // Sort tokens
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'name':
          aValue = a.productTitle.toLowerCase()
          bValue = b.productTitle.toLowerCase()
          break
        case 'downloads':
          aValue = a.downloadCount
          bValue = b.downloadCount
          break
        case 'expiry':
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

    setFilteredTokens(filtered)
  }, [downloadTokens, filterStatus, searchQuery, sortBy, sortOrder])

  const getStatusBadge = (token: DownloadToken) => {
    const now = new Date()
    const expiryDate = new Date(token.expiresAt)
    const isExpired = expiryDate <= now
    const isExhausted = token.downloadCount >= token.downloadLimit

    if (isExpired) {
      return {
        color: 'bg-red-400 text-black border-black',
        icon: XCircleIcon,
        text: t('status.expired')
      }
    }

    if (isExhausted) {
      return {
        color: 'bg-gray-400 text-black border-black',
        icon: AlertCircleIcon,
        text: t('status.exhausted')
      }
    }

    if (token.isActive) {
      return {
        color: 'bg-green-500 text-white border-black',
        icon: CheckCircleIcon,
        text: t('status.active')
      }
    }

    return {
      color: 'bg-yellow-400 text-black border-black',
      icon: ClockIcon,
      text: t('status.inactive')
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
      day: 'numeric'
    })
  }

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1000)} KB`
    }
    return `${sizeInMB.toFixed(1)} MB`
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleDownload = async (token: DownloadToken) => {
    if (downloadingTokens.has(token.id)) return

    setDownloadingTokens(prev => new Set(prev).add(token.id))

    try {
      const result = await simulateDownload(token.id)
      
      if (result.success && result.downloadUrl) {
        // Crear un link temporal para la descarga
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `${token.productSlug}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Actualizar el estado local
        setDownloadTokens(prev => 
          prev.map(t => t.id === token.id ? {
            ...t,
            downloadCount: t.downloadCount + 1,
            lastDownloadAt: new Date().toISOString(),
            isActive: t.downloadCount + 1 < t.downloadLimit
          } : t)
        )

        // TODO: Mostrar toast de éxito
        console.log(t('actions.download_started'), result.message)
      } else {
        // TODO: Mostrar toast de error
        console.error(t('actions.download_error'), result.message)
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      // TODO: Mostrar toast de error
    } finally {
      setDownloadingTokens(prev => {
        const newSet = new Set(prev)
        newSet.delete(token.id)
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
          <p className="text-black font-black text-xl uppercase">{t('access_restricted')}</p>
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
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/pedidos"
              className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {t('navigation.back_to_orders')}
            </Link>
            
            <div>
              <h1 className="text-4xl font-black text-black uppercase flex items-center gap-3">
                <DownloadIcon className="w-8 h-8" />
                {t('title')}
              </h1>
              <p className="text-gray-600 font-bold mt-2">
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <div 
              className="bg-blue-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <FolderIcon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-xl font-black text-black mb-1">{stats.totalProducts}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.total_pdfs')}</div>
            </div>
            
            <div 
              className="bg-green-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <CheckCircleIcon className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-xl font-black text-black mb-1">{stats.activeTokens}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.active')}</div>
            </div>
            
            <div 
              className="bg-red-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <XCircleIcon className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <div className="text-xl font-black text-black mb-1">{stats.expiredTokens}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.expired')}</div>
            </div>
            
            <div 
              className="bg-purple-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ActivityIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-xl font-black text-black mb-1">{stats.totalDownloads}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.downloads')}</div>
            </div>
            
            <div 
              className="bg-orange-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <div className="text-xl font-black text-black mb-1">{stats.downloadsThisMonth}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.this_month')}</div>
            </div>
            
            <div 
              className="bg-cyan-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <HardDriveIcon className="w-6 h-6 mx-auto mb-2 text-cyan-600" />
              <div className="text-xl font-black text-black mb-1">{formatFileSize(stats.totalFileSize)}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.total_size')}</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div 
          className="bg-white border-4 border-black p-6 mb-8"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="ALL">{t('filters.all_statuses')}</option>
              <option value="ACTIVE">{t('filters.active')}</option>
              <option value="EXPIRED">{t('filters.expired')}</option>
              <option value="EXHAUSTED">{t('filters.exhausted')}</option>
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
              <option value="downloads">{t('filters.sort_by_downloads')}</option>
              <option value="expiry">{t('filters.sort_by_expiry')}</option>
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
        </div>

        {/* Downloads List */}
        {filteredTokens.length === 0 ? (
          <div 
            className="bg-gray-100 border-4 border-black p-12 text-center"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-black text-black uppercase mb-4">
              {downloadTokens.length === 0 ? t('empty.no_downloads_title') : t('empty.no_results_title')}
            </h2>
            <p className="text-gray-600 font-bold mb-6">
              {downloadTokens.length === 0 
                ? t('empty.no_downloads_subtitle')
                : t('empty.no_results_subtitle')
              }
            </p>
            <Link 
              href="/productos"
              className="inline-flex items-center gap-2 bg-yellow-400 border-4 border-black px-6 py-3 font-black text-black uppercase hover:bg-orange-500 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ShoppingCartIcon className="w-4 h-4" />
              {t('empty.explore_products')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTokens.map((token) => {
              const status = getStatusBadge(token)
              const StatusIcon = status.icon
              const daysUntilExpiry = getDaysUntilExpiry(token.expiresAt)
              const isDownloading = downloadingTokens.has(token.id)
              const canDownload = token.isActive && 
                                new Date(token.expiresAt) > new Date() && 
                                token.downloadCount < token.downloadLimit

              return (
                <div 
                  key={token.id}
                  className="bg-white border-4 border-black p-6 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
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
                      <div className="font-black text-black">{formatFileSize(token.pdfFileSize)}</div>
                      <div className="text-gray-600 font-bold">PDF</div>
                    </div>
                  </div>

                  {/* Product Title */}
                  <div className="mb-4">
                    <Link 
                      href={`/productos/${token.productSlug}`}
                      className="text-lg font-black text-black uppercase hover:text-orange-500 transition-colors line-clamp-2"
                    >
                      {token.productTitle}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-600 font-bold">
                        {t('card.by')}: {token.sellerName}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-600 font-bold">{formatPrice(token.purchasePrice)}</span>
                    </div>
                  </div>

                  {/* Download Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-black uppercase">{t('card.downloads')}:</span>
                      <span className="text-sm font-black text-black">
                        {token.downloadCount} / {token.downloadLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 border-2 border-black h-3">
                      <div 
                        className="bg-blue-500 h-full border-r-2 border-black transition-all duration-300"
                        style={{ 
                          width: `${(token.downloadCount / token.downloadLimit) * 100}%`,
                          backgroundColor: token.downloadCount >= token.downloadLimit ? '#ef4444' : '#3b82f6'
                        }}
                      />
                    </div>
                  </div>

                  {/* Expiry Warning */}
                  {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
                    <div 
                      className="bg-yellow-100 border-2 border-yellow-500 p-3 mb-4 flex items-center gap-2"
                      style={{ boxShadow: '2px 2px 0 #000000' }}
                    >
                      <AlertTriangleIcon className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-800 font-bold text-sm">
                        {t('card.expires_in', { days: daysUntilExpiry, unit: daysUntilExpiry === 1 ? t('card.day') : t('card.days') })}
                      </span>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="block text-gray-600 font-bold">{t('card.purchased')}:</span>
                      <span className="text-black font-black">{formatDate(token.purchaseDate)}</span>
                    </div>
                    <div>
                      <span className="block text-gray-600 font-bold">{t('card.expires')}:</span>
                      <span className="text-black font-black">{formatDate(token.expiresAt)}</span>
                    </div>
                    {token.lastDownloadAt && (
                      <>
                        <div>
                          <span className="block text-gray-600 font-bold">{t('card.last_download')}:</span>
                          <span className="text-black font-black">{formatDate(token.lastDownloadAt)}</span>
                        </div>
                        <div>
                          <span className="block text-gray-600 font-bold">{t('card.from_ip')}:</span>
                          <span className="text-black font-black">{token.lastIpAddress}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/productos/${token.productSlug}`}
                        className="flex items-center gap-1 text-sm bg-blue-400 border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <EyeIcon className="w-3 h-3" />
                        {t('actions.view_product')}
                      </Link>
                      
                      <Link
                        href={`/pedidos/${token.orderNumber}`}
                        className="flex items-center gap-1 text-sm bg-gray-300 border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-gray-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <ExternalLinkIcon className="w-3 h-3" />
                        {t('actions.view_order')}
                      </Link>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(token)}
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
                          {t('actions.downloading')}
                        </>
                      ) : canDownload ? (
                        <>
                          <DownloadIcon className="w-4 h-4" />
                          {t('actions.download_pdf')}
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-4 h-4" />
                          {t('actions.not_available')}
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
        {filteredTokens.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 font-bold">
              {t('results.showing', { current: filteredTokens.length, total: downloadTokens.length })}
            </p>
          </div>
        )}

        {/* Help Section */}
        <div 
          className="bg-blue-100 border-4 border-black p-6 mt-8"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <h3 className="text-xl font-black text-black uppercase mb-4">💡 {t('help.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-black text-black uppercase mb-2">{t('help.download_limits.title')}:</h4>
              <ul className="space-y-1 text-gray-700">
                <li className="font-medium">• {t('help.download_limits.max_downloads')}</li>
                <li className="font-medium">• {t('help.download_limits.token_expiry')}</li>
                <li className="font-medium">• {t('help.download_limits.buyer_only')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-black uppercase mb-2">{t('help.download_issues.title')}:</h4>
              <ul className="space-y-1 text-gray-700">
                <li className="font-medium">• {t('help.download_issues.stable_connection')}</li>
                <li className="font-medium">• {t('help.download_issues.expired_token')}</li>
                <li className="font-medium">• {t('help.download_issues.pdf_optimized')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}