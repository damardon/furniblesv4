'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Star,
  Download,
  Eye,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
} from 'lucide-react'

import { useSellerStore } from '@/lib/stores/seller-store'

// Funciones de formato - internacionalizadas
const formatCurrency = (amount: number, locale: string = 'es-ES') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatNumber = (num: number, locale: string = 'es-ES') => {
  return new Intl.NumberFormat(locale).format(num)
}

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`
}

export default function SellerAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  // Traducciones
  const t = useTranslations('seller.analytics')
  const tCommon = useTranslations('common')

  const {
    dashboardStats,
    products,
    loadDashboardStats,
    loadProducts,
    loadAnalytics,
  } = useSellerStore()

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          loadDashboardStats(selectedPeriod),
          loadProducts(1),
          loadAnalytics(selectedPeriod, ['revenue', 'sales', 'products', 'customers'])
        ])
        
        // Simular datos de analytics (en un caso real vendrían del backend)
        const mockAnalytics = {
          revenue: {
            current: dashboardStats?.totalRevenue || 0,
            previous: (dashboardStats?.totalRevenue || 0) * 0.85,
            trend: 15.3
          },
          sales: {
            current: dashboardStats?.totalSales || 0,
            previous: (dashboardStats?.totalSales || 0) * 0.92,
            trend: 8.7
          },
          customers: {
            current: 156,
            previous: 134,
            trend: 16.4
          },
          conversionRate: {
            current: 3.2,
            previous: 2.8,
            trend: 14.3
          },
          topProducts: products.slice(0, 5).map(p => ({
            ...p,
            salesCount: Math.floor(Math.random() * 50) + 10,
            revenue: p.price * (Math.floor(Math.random() * 50) + 10)
          })),
          revenueByMonth: [
            { month: t('months.jan'), revenue: 1200, sales: 24 },
            { month: t('months.feb'), revenue: 1800, sales: 36 },
            { month: t('months.mar'), revenue: 2400, sales: 48 },
            { month: t('months.apr'), revenue: 1900, sales: 38 },
            { month: t('months.may'), revenue: 2800, sales: 56 },
            { month: t('months.jun'), revenue: 3200, sales: 64 },
          ],
          categoryBreakdown: [
            { category: t('categories.nordic'), sales: 45, percentage: 35 },
            { category: t('categories.kitchen'), sales: 32, percentage: 25 },
            { category: t('categories.storage'), sales: 28, percentage: 22 },
            { category: t('categories.decorative'), sales: 15, percentage: 12 },
            { category: t('categories.bathroom'), sales: 8, percentage: 6 },
          ]
        }
        
        setAnalyticsData(mockAnalytics)
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedPeriod, loadDashboardStats, loadProducts, loadAnalytics, dashboardStats, t])

  // Componente para mostrar métricas con tendencia
  const MetricCard = ({ 
    title, 
    value, 
    previousValue, 
    trend, 
    icon: Icon, 
    color, 
    formatter = formatNumber 
  }: any) => {
    const isPositive = trend > 0
    const TrendIcon = isPositive ? TrendingUp : TrendingDown
    
    return (
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase">{title}</p>
            <p className="text-2xl font-black text-black">
              {formatter(value)}
            </p>
          </div>
          <div className={`w-12 h-12 ${color} border-2 border-black flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-black" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 border border-black text-xs font-bold ${
            isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <TrendIcon className="h-3 w-3" />
            {formatPercentage(Math.abs(trend))}
          </div>
          <span className="text-xs text-gray-600 font-bold">
            {t('vs_previous_period')}
          </span>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">{t('loading_analytics')}</p>
        </div>
      </div>
    )
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

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={t('metrics.revenue')}
          value={analyticsData?.revenue.current || 0}
          previousValue={analyticsData?.revenue.previous || 0}
          trend={analyticsData?.revenue.trend || 0}
          icon={DollarSign}
          color="bg-green-500"
          formatter={formatCurrency}
        />
        
        <MetricCard
          title={t('metrics.sales')}
          value={analyticsData?.sales.current || 0}
          previousValue={analyticsData?.sales.previous || 0}
          trend={analyticsData?.sales.trend || 0}
          icon={Package}
          color="bg-blue-500"
        />
        
        <MetricCard
          title={t('metrics.customers')}
          value={analyticsData?.customers.current || 0}
          previousValue={analyticsData?.customers.previous || 0}
          trend={analyticsData?.customers.trend || 0}
          icon={Users}
          color="bg-purple-500"
        />
        
        <MetricCard
          title={t('metrics.conversion')}
          value={analyticsData?.conversionRate.current || 0}
          previousValue={analyticsData?.conversionRate.previous || 0}
          trend={analyticsData?.conversionRate.trend || 0}
          icon={Target}
          color="bg-orange-500"
          formatter={formatPercentage}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO DE INGRESOS */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black uppercase text-black">{t('charts.revenue_by_month')}</h3>
            <BarChart3 className="h-6 w-6 text-gray-600" />
          </div>
          
          <div className="space-y-4">
            {analyticsData?.revenueByMonth.map((data: any, index: number) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 text-sm font-bold text-black">
                  {data.month}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-black">
                      {formatCurrency(data.revenue)}
                    </span>
                    <span className="text-xs text-gray-600 font-bold">
                      {t('sales_count', { count: data.sales })}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 border border-black">
                    <div 
                      className="bg-green-500 h-full border-r border-black transition-all duration-500"
                      style={{ 
                        width: `${(data.revenue / Math.max(...(analyticsData?.revenueByMonth.map((d: any) => d.revenue) || [1]))) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCTOS TOP */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black uppercase text-black">{t('charts.top_products')}</h3>
            <Award className="h-6 w-6 text-gray-600" />
          </div>
          
          <div className="space-y-4">
            {analyticsData?.topProducts.map((product: any, index: number) => (
              <div key={product.id} className="flex items-center gap-4 p-3 border-2 border-gray-200 hover:border-orange-500 transition-colors">
                <div className="w-8 h-8 bg-orange-500 border-2 border-black flex items-center justify-center">
                  <span className="text-xs font-black text-black">#{index + 1}</span>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-black text-black text-sm line-clamp-1">
                    {product.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {t('product_stats.sales', { count: product.salesCount })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(product.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-black text-green-600 text-sm">
                    {formatCurrency(product.revenue)}
                  </p>
                  <p className="text-xs text-gray-600 font-bold">
                    {formatCurrency(product.price)} {t('product_stats.each')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BREAKDOWN POR CATEGORÍA */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black uppercase text-black">{t('charts.sales_by_category')}</h3>
            <PieChart className="h-6 w-6 text-gray-600" />
          </div>
          
          <div className="space-y-3">
            {analyticsData?.categoryBreakdown.map((category: any, index: number) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500']
              const color = colors[index % colors.length]
              
              return (
                <div key={category.category} className="flex items-center gap-4">
                  <div className={`w-4 h-4 ${color} border border-black`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-black text-sm">
                        {category.category}
                      </span>
                      <span className="text-sm font-bold text-black">
                        {t('category_sales', { count: category.sales })}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 border border-black">
                      <div 
                        className={`${color} h-full border-r border-black transition-all duration-500`}
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-black">
                      {category.percentage}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* MÉTRICAS ADICIONALES */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black uppercase text-black">{t('charts.key_metrics')}</h3>
            <Activity className="h-6 w-6 text-gray-600" />
          </div>
          
          <div className="space-y-6">
            {/* Average Order Value */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600 text-sm">{t('key_metrics.avg_order_value')}</span>
                <span className="font-black text-black">
                  {formatCurrency((analyticsData?.revenue.current || 0) / (analyticsData?.sales.current || 1))}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 border border-black">
                <div className="bg-green-500 h-full w-3/4 border-r border-black" />
              </div>
            </div>

            {/* Customer Retention */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600 text-sm">{t('key_metrics.customer_retention')}</span>
                <span className="font-black text-black">67%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 border border-black">
                <div className="bg-blue-500 h-full w-2/3 border-r border-black" />
              </div>
            </div>

            {/* Product Views */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600 text-sm">{t('key_metrics.total_views')}</span>
                <span className="font-black text-black">
                  {formatNumber(products.reduce((sum, p) => sum + p.viewCount, 0))}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 border border-black">
                <div className="bg-purple-500 h-full w-5/6 border-r border-black" />
              </div>
            </div>

            {/* Downloads */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600 text-sm">{t('key_metrics.total_downloads')}</span>
                <span className="font-black text-black">
                  {formatNumber(products.reduce((sum, p) => sum + p.downloadCount, 0))}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 border border-black">
                <div className="bg-orange-500 h-full w-4/5 border-r border-black" />
              </div>
            </div>

            {/* Average Rating */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600 text-sm">{t('key_metrics.avg_rating')}</span>
                <div className="flex items-center gap-1">
                  <span className="font-black text-black">
                    {(products.reduce((sum, p) => sum + p.rating, 0) / (products.length || 1)).toFixed(1)}
                  </span>
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
              <div className="w-full bg-gray-200 h-2 border border-black">
                <div className="bg-yellow-500 h-full w-4/5 border-r border-black" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INSIGHTS Y RECOMENDACIONES */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="flex items-center gap-3 mb-6">
          <Target className="h-6 w-6 text-orange-500" />
          <h3 className="text-xl font-black uppercase text-black">{t('insights.title')}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Insight 1 */}
          <div className="bg-green-50 border-2 border-green-500 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-black text-green-800 text-sm">{t('insights.growth.title')}</span>
            </div>
            <p className="text-green-700 font-bold text-sm">
              {t('insights.growth.description', { 
                percentage: analyticsData?.revenue.trend.toFixed(1) 
              })}
            </p>
          </div>

          {/* Insight 2 */}
          <div className="bg-blue-50 border-2 border-blue-500 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="font-black text-blue-800 text-sm">{t('insights.quality.title')}</span>
            </div>
            <p className="text-blue-700 font-bold text-sm">
              {t('insights.quality.description')}
            </p>
          </div>

          {/* Insight 3 */}
          <div className="bg-orange-50 border-2 border-orange-500 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="font-black text-orange-800 text-sm">{t('insights.opportunity.title')}</span>
            </div>
            <p className="text-orange-700 font-bold text-sm">
              {t('insights.opportunity.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}