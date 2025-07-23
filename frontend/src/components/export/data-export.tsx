'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  FileImage,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  Settings,
  BarChart3,
  Users,
  ShoppingBag,
  Star,
  DollarSign,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { NotificationType } from '@/types/additional'
import { cn } from '@/lib/utils'

interface ExportRequest {
  id: string
  type: ExportType
  format: ExportFormat
  dateRange: { start: string; end: string }
  filters: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  downloadUrl?: string
  createdAt: string
  completedAt?: string
  fileSize?: number
  error?: string
}

type ExportType = 
  | 'orders' 
  | 'products' 
  | 'reviews' 
  | 'analytics' 
  | 'users' 
  | 'sellers' 
  | 'transactions'
  | 'downloads'

type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf'

interface DataExportProps {
  availableTypes?: ExportType[]
  maxExports?: number
  showHistory?: boolean
  className?: string
}

export function DataExport({
  availableTypes = ['orders', 'products', 'reviews', 'analytics'],
  maxExports = 5,
  showHistory = true,
  className
}: DataExportProps) {
  const t = useTranslations('data_export')
  const { user, token } = useAuthStore()
  const { addNotification } = useNotificationStore()
  
  const [selectedType, setSelectedType] = useState<ExportType>('orders')
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<ExportRequest[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Helper para crear notificaciones
  const createNotification = (
    type: NotificationType,
    title: string,
    message: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
  ) => ({
    id: `notif-${Date.now()}-${Math.random()}`,
    userId: user?.id || '',
    type,
    title,
    message,
    data: {},
    isRead: false,
    readAt: undefined,
    sentAt: new Date().toISOString(),
    emailSent: false,
    orderId: undefined,
    priority: priority as any,
    channel: 'IN_APP' as any,
    groupKey: undefined,
    expiresAt: undefined,
    clickedAt: undefined,
    clickCount: 0,
    createdAt: new Date().toISOString()
  })

  // Definir tipos disponibles según el rol del usuario
  const getAvailableTypes = (): ExportType[] => {
    if (!user) return []

    switch (user.role) {
      case 'ADMIN':
        return ['orders', 'products', 'reviews', 'analytics', 'users', 'sellers', 'transactions', 'downloads']
      case 'SELLER':
        return ['orders', 'products', 'reviews', 'analytics', 'downloads']
      case 'BUYER':
        return ['orders', 'reviews', 'downloads']
      default:
        return availableTypes
    }
  }

  const exportTypeConfig = {
    orders: {
      icon: ShoppingBag,
      title: t('types.orders'),
      description: t('types.orders_desc'),
      formats: ['csv', 'xlsx', 'json'] as ExportFormat[],
      filters: ['status', 'seller', 'amount_range']
    },
    products: {
      icon: FileText,
      title: t('types.products'),
      description: t('types.products_desc'),
      formats: ['csv', 'xlsx', 'json'] as ExportFormat[],
      filters: ['category', 'status', 'price_range', 'rating']
    },
    reviews: {
      icon: Star,
      title: t('types.reviews'),
      description: t('types.reviews_desc'),
      formats: ['csv', 'xlsx', 'json'] as ExportFormat[],
      filters: ['rating', 'product', 'verified']
    },
    analytics: {
      icon: BarChart3,
      title: t('types.analytics'),
      description: t('types.analytics_desc'),
      formats: ['csv', 'xlsx', 'pdf'] as ExportFormat[],
      filters: ['metric_type', 'aggregation']
    },
    users: {
      icon: Users,
      title: t('types.users'),
      description: t('types.users_desc'),
      formats: ['csv', 'xlsx'] as ExportFormat[],
      filters: ['role', 'status', 'registration_date']
    },
    sellers: {
      icon: Users,
      title: t('types.sellers'),
      description: t('types.sellers_desc'),
      formats: ['csv', 'xlsx'] as ExportFormat[],
      filters: ['verification_status', 'rating', 'sales_volume']
    },
    transactions: {
      icon: DollarSign,
      title: t('types.transactions'),
      description: t('types.transactions_desc'),
      formats: ['csv', 'xlsx', 'json'] as ExportFormat[],
      filters: ['type', 'status', 'amount_range']
    },
    downloads: {
      icon: Download,
      title: t('types.downloads'),
      description: t('types.downloads_desc'),
      formats: ['csv', 'xlsx'] as ExportFormat[],
      filters: ['product', 'user']
    }
  }

  useEffect(() => {
    loadExportHistory()
  }, [])

  const loadExportHistory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exports/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setExportHistory(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading export history:', error)
      // Usar datos simulados
      setExportHistory([
        {
          id: '1',
          type: 'orders',
          format: 'csv',
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
          filters: {},
          status: 'completed',
          progress: 100,
          downloadUrl: '/exports/orders-2024-01.csv',
          createdAt: '2024-01-31T10:00:00Z',
          completedAt: '2024-01-31T10:02:00Z',
          fileSize: 2048576
        }
      ])
    }
  }

  const handleExport = async () => {
    if (exportHistory.filter(e => e.status === 'pending' || e.status === 'processing').length >= maxExports) {
      addNotification(createNotification(
        'EXPORT_LIMIT_REACHED' as NotificationType,
        t('errors.limit_reached'),
        t('errors.limit_reached_message', { max: maxExports }),
        'HIGH'
      ))
      return
    }

    setIsExporting(true)

    const exportRequest = {
      type: selectedType,
      format: selectedFormat,
      dateRange,
      filters
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exports/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(exportRequest),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          addNotification(createNotification(
            'EXPORT_STARTED' as NotificationType,
            t('success.export_started'),
            t('success.export_started_message', { type: exportTypeConfig[selectedType].title }),
            'NORMAL'
          ))

          // Agregar a historial local
          const newExport: ExportRequest = {
            id: result.data.id,
            ...exportRequest,
            status: 'pending',
            progress: 0,
            createdAt: new Date().toISOString()
          }
          setExportHistory(prev => [newExport, ...prev])

          // Simular progreso
          simulateExportProgress(result.data.id)
        }
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      addNotification(createNotification(
        'EXPORT_ERROR' as NotificationType,
        t('errors.export_failed'),
        t('errors.export_failed_message'),
        'HIGH'
      ))
    } finally {
      setIsExporting(false)
    }
  }

  const simulateExportProgress = (exportId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      
      setExportHistory(prev => prev.map(exp => 
        exp.id === exportId 
          ? { 
              ...exp, 
              status: progress >= 100 ? 'completed' : 'processing',
              progress: Math.min(progress, 100),
              completedAt: progress >= 100 ? new Date().toISOString() : undefined,
              downloadUrl: progress >= 100 ? `/exports/${exp.type}-${Date.now()}.${exp.format}` : undefined,
              fileSize: progress >= 100 ? Math.floor(Math.random() * 5000000) + 100000 : undefined
            }
          : exp
      ))

      if (progress >= 100) {
        clearInterval(interval)
        addNotification(createNotification(
          'EXPORT_COMPLETED' as NotificationType,
          t('success.export_completed'),
          t('success.export_completed_message'),
          'NORMAL'
        ))
      }
    }, 1000)
  }

  const handleDownload = (exportRequest: ExportRequest) => {
    if (exportRequest.downloadUrl) {
      // En implementación real, esto sería la URL del archivo
      const link = document.createElement('a')
      link.href = exportRequest.downloadUrl
      link.download = `${exportRequest.type}-${new Date(exportRequest.createdAt).toISOString().split('T')[0]}.${exportRequest.format}`
      link.click()

      addNotification(createNotification(
        'EXPORT_DOWNLOADED' as NotificationType,
        t('success.download_started'),
        t('success.download_started_message'),
        'NORMAL'
      ))
    }
  }

  const deleteExport = async (exportId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exports/${exportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setExportHistory(prev => prev.filter(exp => exp.id !== exportId))
        addNotification(createNotification(
          'EXPORT_DELETED' as NotificationType,
          t('success.export_deleted'),
          t('success.export_deleted_message'),
          'NORMAL'
        ))
      }
    } catch (error) {
      console.error('Delete export error:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: ExportRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'xlsx':
        return <FileSpreadsheet className="w-4 h-4 text-green-600" />
      case 'pdf':
        return <FileImage className="w-4 h-4 text-red-600" />
      case 'json':
        return <FileText className="w-4 h-4 text-blue-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const currentTypeConfig = exportTypeConfig[selectedType]
  const userAvailableTypes = getAvailableTypes()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <h2 className="text-2xl font-black text-black uppercase mb-2 flex items-center gap-2">
          <Download className="w-6 h-6" />
          {t('title')}
        </h2>
        <p className="text-gray-600 font-bold">
          {t('description')}
        </p>
      </div>

      {/* Export Configuration */}
      <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <h3 className="text-lg font-black text-black uppercase mb-4">
          {t('create_export')}
        </h3>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block font-black text-black text-sm uppercase mb-3">
              {t('select_type')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userAvailableTypes.map((type) => {
                const config = exportTypeConfig[type]
                const IconComponent = config.icon
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "p-4 border-3 border-black text-left transition-all",
                      selectedType === type
                        ? "bg-orange-500 text-black"
                        : "bg-white hover:bg-yellow-400"
                    )}
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <IconComponent className="w-6 h-6" />
                      <span className="font-black text-sm uppercase">{config.title}</span>
                    </div>
                    <p className="text-xs font-medium">{config.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Format and Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-black text-black text-sm uppercase mb-2">
                {t('format')}
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                className="w-full px-3 py-2 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                {currentTypeConfig.formats.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-black text-black text-sm uppercase mb-2">
                {t('date_start')}
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              />
            </div>

            <div>
              <label className="block font-black text-black text-sm uppercase mb-2">
                {t('date_end')}
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              />
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-400 border-2 border-black font-bold text-sm uppercase hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <Filter className="w-4 h-4" />
            {t('advanced_filters')}
            {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t-2 border-black pt-4">
              <div className="text-sm text-gray-600 font-bold mb-4">
                {t('available_filters')}: {currentTypeConfig.filters.join(', ')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentTypeConfig.filters.map((filterType) => (
                  <div key={filterType}>
                    <label className="block font-bold text-black text-sm mb-2">
                      {t(`filters.${filterType}`)}
                    </label>
                    <input
                      type="text"
                      placeholder={t(`filters.${filterType}_placeholder`)}
                      className="w-full px-3 py-2 bg-white border-2 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
                      style={{ boxShadow: '2px 2px 0 #000000' }}
                      onChange={(e) => setFilters(prev => ({ ...prev, [filterType]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-8 py-3 bg-green-500 border-3 border-black font-black text-black uppercase hover:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <Download className="w-5 h-5" />
              {isExporting ? t('creating_export') : t('create_export')}
            </button>
          </div>
        </div>
      </div>

      {/* Export History */}
      {showHistory && (
        <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-black uppercase">
              {t('export_history')}
            </h3>
            <button
              onClick={loadExportHistory}
              className="p-2 bg-gray-200 border-2 border-black hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <RefreshCw className="w-4 h-4 text-black" />
            </button>
          </div>

          {exportHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-black text-black uppercase">{t('no_exports')}</p>
              <p className="text-gray-600 font-bold text-sm">{t('no_exports_desc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exportHistory.map((exportRequest) => (
                <div
                  key={exportRequest.id}
                  className="border-2 border-black p-4 flex items-center justify-between"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(exportRequest.status)}
                      {getFormatIcon(exportRequest.format)}
                    </div>
                    
                    <div>
                      <h4 className="font-black text-black text-sm uppercase">
                        {exportTypeConfig[exportRequest.type].title} - {exportRequest.format.toUpperCase()}
                      </h4>
                      <p className="text-xs text-gray-600 font-bold">
                        {new Date(exportRequest.createdAt).toLocaleDateString()} 
                        {exportRequest.fileSize && ` • ${formatFileSize(exportRequest.fileSize)}`}
                      </p>
                      
                      {exportRequest.status === 'processing' && (
                        <div className="mt-2 w-32 bg-gray-200 border border-black h-2">
                          <div 
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${exportRequest.progress}%` }}
                          />
                        </div>
                      )}
                      
                      {exportRequest.error && (
                        <p className="text-xs text-red-600 font-bold mt-1">
                          {exportRequest.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {exportRequest.status === 'completed' && exportRequest.downloadUrl && (
                      <button
                        onClick={() => handleDownload(exportRequest)}
                        className="p-2 bg-green-400 border-2 border-black hover:bg-yellow-400 transition-all"
                        style={{ boxShadow: '1px 1px 0 #000000' }}
                        title={t('download')}
                      >
                        <Download className="w-4 h-4 text-black" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteExport(exportRequest.id)}
                      className="p-2 bg-red-400 border-2 border-black hover:bg-yellow-400 transition-all"
                      style={{ boxShadow: '1px 1px 0 #000000' }}
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4 text-black" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}