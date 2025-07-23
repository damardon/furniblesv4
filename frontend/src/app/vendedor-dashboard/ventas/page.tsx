'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  User,
  Package,
  Eye,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

import { useSellerStore } from '@/lib/stores/seller-store'
import { OrderStatus } from '@/types'

// Funciones de formato - mantener internacionalización
const formatCurrency = (amount: number, locale: string = 'es-ES') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (dateString: string, locale: string = 'es-ES') => {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function SellerSalesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  // Traducciones
  const t = useTranslations('seller.sales')
  const tCommon = useTranslations('common')
  const tOrders = useTranslations('orders')

  const {
    sales,
    salesLoading,
    salesPagination,
    salesFilters,
    dashboardStats,
    loadSales,
    setSalesFilters,
    loadDashboardStats,
  } = useSellerStore()

  // Cargar datos iniciales
  useEffect(() => {
    loadSales(1)
    loadDashboardStats(selectedPeriod)
  }, [loadSales, loadDashboardStats, selectedPeriod])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSales(1, { ...salesFilters, search: searchQuery })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [salesFilters, searchQuery, loadSales])

  // Manejadores
  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleFilterChange = (key: keyof typeof salesFilters, value: string) => {
    setSalesFilters({ [key]: value })
  }

  const handlePageChange = (page: number) => {
    loadSales(page)
  }

  // Función para obtener el color del estado
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'bg-green-500 text-white'
      case OrderStatus.PAID:
        return 'bg-blue-500 text-white'
      case OrderStatus.PROCESSING:
        return 'bg-yellow-500 text-black'
      case OrderStatus.PENDING:
        return 'bg-orange-500 text-black'
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  // Función para obtener el ícono del estado
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />
      case OrderStatus.PAID:
      case OrderStatus.PROCESSING:
        return <Clock className="h-4 w-4" />
      case OrderStatus.PENDING:
        return <Package className="h-4 w-4" />
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  // Función para obtener texto del estado
  const getStatusText = (status: OrderStatus) => {
    return tOrders(`status.${status.toLowerCase()}`)
  }

  // Función para obtener texto del período
  const getPeriodText = (period: string) => {
    return t(`periods.${period}`)
  }

  // Calcular totales del periodo actual
  const currentPeriodStats = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + sale.saleAmount, 0),
    totalNet: sales.reduce((sum, sale) => sum + sale.netAmount, 0),
    totalFees: sales.reduce((sum, sale) => sum + sale.platformFee, 0),
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase text-black">{t('title')}</h1>
            <p className="text-gray-600 font-bold">
              {t('subtitle')}
            </p>
          </div>

          {/* SELECTOR DE PERIODO */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <div className="flex border-2 border-black bg-white">
              {[
                { key: 'week', label: t('periods.week') },
                { key: 'month', label: t('periods.month') },
                { key: 'quarter', label: t('periods.quarter') },
                { key: 'year', label: t('periods.year') }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key as any)}
                  className={`px-3 py-2 font-bold text-sm transition-all ${
                    selectedPeriod === period.key
                      ? 'bg-orange-500 text-black'
                      : 'bg-white text-black hover:bg-yellow-400'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MÉTRICAS DEL PERIODO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Ventas */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">{t('metrics.sales')}</p>
              <p className="text-2xl font-black text-black">
                {currentPeriodStats.totalSales}
              </p>
              <p className="text-xs font-bold text-blue-600 mt-1">
                {t('periods.this_period', { period: getPeriodText(selectedPeriod) })}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 border-2 border-black flex items-center justify-center">
              <Package className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>

        {/* Ingresos Brutos */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">{t('metrics.gross_revenue')}</p>
              <p className="text-2xl font-black text-black">
                {formatCurrency(currentPeriodStats.totalRevenue)}
              </p>
              <p className="text-xs font-bold text-green-600 mt-1">
                {t('metrics.before_fees')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 border-2 border-black flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>

        {/* Ingresos Netos */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">{t('metrics.net_revenue')}</p>
              <p className="text-2xl font-black text-black">
                {formatCurrency(currentPeriodStats.totalNet)}
              </p>
              <p className="text-xs font-bold text-purple-600 mt-1">
                {t('metrics.after_fees')}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 border-2 border-black flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>

        {/* Comisiones */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">{t('metrics.fees')}</p>
              <p className="text-2xl font-black text-black">
                {formatCurrency(currentPeriodStats.totalFees)}
              </p>
              <p className="text-xs font-bold text-orange-600 mt-1">
                {t('metrics.platform_fee')}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 border-2 border-black flex items-center justify-center">
              <FileText className="h-6 w-6 text-black" />
            </div>
          </div>
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
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
            </div>
          </div>

          {/* Toggle filtros */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-3 border-2 border-black font-bold transition-all ${
              filtersOpen ? 'bg-orange-500 text-black' : 'bg-white text-black hover:bg-yellow-400'
            }`}
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <Filter className="h-4 w-4" />
            {t('filters.title')}
          </button>
        </div>

        {/* Panel de filtros expandible */}
        {filtersOpen && (
          <div className="border-t-2 border-black pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Estado */}
              <div>
                <label className="block text-sm font-black text-black mb-2">{t('filters.status')}</label>
                <select
                  value={salesFilters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="">{t('filters.all_statuses')}</option>
                  <option value={OrderStatus.PENDING}>{tOrders('status.pending')}</option>
                  <option value={OrderStatus.PROCESSING}>{tOrders('status.processing')}</option>
                  <option value={OrderStatus.PAID}>{tOrders('status.paid')}</option>
                  <option value={OrderStatus.COMPLETED}>{tOrders('status.completed')}</option>
                  <option value={OrderStatus.CANCELLED}>{tOrders('status.failed')}</option>
                  <option value={OrderStatus.REFUNDED}>{tOrders('status.refunded')}</option>
                </select>
              </div>

              {/* Fecha Desde */}
              <div>
                <label className="block text-sm font-black text-black mb-2">{t('filters.date_from')}</label>
                <input
                  type="date"
                  value={salesFilters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                />
              </div>

              {/* Fecha Hasta */}
              <div>
                <label className="block text-sm font-black text-black mb-2">{t('filters.date_to')}</label>
                <input
                  type="date"
                  value={salesFilters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                />
              </div>

              {/* Ordenar */}
              <div>
                <label className="block text-sm font-black text-black mb-2">{t('filters.sort_by')}</label>
                <select
                  value={`${salesFilters.sortBy}-${salesFilters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    handleFilterChange('sortBy', sortBy)
                    handleFilterChange('sortOrder', sortOrder)
                  }}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="createdAt-desc">{t('sort.newest')}</option>
                  <option value="createdAt-asc">{t('sort.oldest')}</option>
                  <option value="amount-desc">{t('sort.highest_amount')}</option>
                  <option value="amount-asc">{t('sort.lowest_amount')}</option>
                  <option value="buyerName-asc">{t('sort.buyer_a_z')}</option>
                  <option value="buyerName-desc">{t('sort.buyer_z_a')}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LISTA DE VENTAS */}
      {salesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">{t('loading_sales')}</p>
          </div>
        </div>
      ) : sales.length === 0 ? (
        <div className="bg-white border-[3px] border-black p-12 text-center" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-black text-black mb-2">{t('no_sales.title')}</h3>
          <p className="text-gray-600 font-bold mb-6">
            {t('no_sales.description')}
          </p>
        </div>
      ) : (
        <>
          {/* Tabla de ventas */}
          <div className="bg-white border-[3px] border-black overflow-hidden" style={{ boxShadow: '6px 6px 0 #000000' }}>
            {/* Header de la tabla */}
            <div className="bg-gray-100 border-b-2 border-black p-4">
              <div className="grid grid-cols-12 gap-4 items-center font-black text-sm uppercase text-black">
                <div className="col-span-3">{t('table.product')}</div>
                <div className="col-span-2">{t('table.buyer')}</div>
                <div className="col-span-1">{t('table.status')}</div>
                <div className="col-span-2">{t('table.amounts')}</div>
                <div className="col-span-2">{t('table.date')}</div>
                <div className="col-span-2">{t('table.order')}</div>
              </div>
            </div>

            {/* Ventas */}
            <div className="divide-y-2 divide-black">
              {sales.map((sale) => (
                <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Producto */}
                    <div className="col-span-3">
                      <div>
                        <h3 className="font-black text-black line-clamp-1">{sale.productTitle}</h3>
                        <p className="text-sm text-gray-600 font-bold">
                          {formatCurrency(sale.price)} x {sale.quantity}
                        </p>
                      </div>
                    </div>

                    {/* Comprador */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 border-2 border-black flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-black text-sm">{sale.buyerName}</p>
                          <p className="text-xs text-gray-600 font-bold">{sale.buyerEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="col-span-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-black border border-black ${getStatusColor(sale.status)}`}>
                        {getStatusIcon(sale.status)}
                        {getStatusText(sale.status)}
                      </span>
                    </div>

                    {/* Montos */}
                    <div className="col-span-2">
                      <div className="text-sm">
                        <p className="font-black text-green-600">
                          {formatCurrency(sale.saleAmount)}
                        </p>
                        <p className="text-xs text-gray-600 font-bold">
                          {t('table.net')}: {formatCurrency(sale.netAmount)}
                        </p>
                        <p className="text-xs text-orange-600 font-bold">
                          {t('table.fee')}: {formatCurrency(sale.platformFee)}
                        </p>
                      </div>
                    </div>

                    {/* Fecha */}
                    <div className="col-span-2">
                      <div className="text-sm">
                        <p className="font-bold text-black">
                          {formatDate(sale.createdAt)}
                        </p>
                        {sale.paidAt && (
                          <p className="text-xs text-green-600 font-bold">
                            {t('table.paid')}: {formatDate(sale.paidAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Orden */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-blue-600 text-sm">
                          #{sale.orderNumber}
                        </p>
                        <button
                          className="p-1 hover:bg-gray-200 transition-colors"
                          title={t('table.view_order')}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PAGINACIÓN */}
          {salesPagination.totalPages > 1 && (
            <div className="bg-white border-[3px] border-black p-4" style={{ boxShadow: '6px 6px 0 #000000' }}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-gray-600">
                  {t('pagination.showing', {
                    start: ((salesPagination.page - 1) * salesPagination.limit) + 1,
                    end: Math.min(salesPagination.page * salesPagination.limit, salesPagination.total),
                    total: salesPagination.total
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(salesPagination.page - 1)}
                    disabled={salesPagination.page === 1}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-black font-bold text-black hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {tCommon('previous')}
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, salesPagination.totalPages) }, (_, i) => {
                      const page = i + 1
                      const isActive = page === salesPagination.page
                      
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
                    onClick={() => handlePageChange(salesPagination.page + 1)}
                    disabled={salesPagination.page === salesPagination.totalPages}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-black font-bold text-black hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    {tCommon('next')}
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