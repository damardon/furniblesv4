'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  DollarSign,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  MessageSquare,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

import { useAuthStore } from '@/lib/stores/auth-store'

// ✅ Tipos coherentes con backend
interface DashboardStats {
  totalRevenue: number
  totalSales: number
  totalProducts: number
  averageRating: number
  monthlyGrowth: {
    revenue: number
    sales: number
    products: number
    rating: number
  }
}

interface RecentSale {
  id: string
  orderNumber: string
  buyerName: string
  productTitle: string
  amount: number
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED'
  createdAt: string
}

interface TopProduct {
  id: string
  title: string
  sales: number
  revenue: number
  rating: number
  views: number
}

interface RecentReview {
  id: string
  productTitle: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
  responded: boolean
}

interface DashboardData {
  stats: DashboardStats
  recentSales: RecentSale[]
  topProducts: TopProduct[]
  recentReviews: RecentReview[]
}

// ✅ Helper para obtener token de autenticación
const getAuthToken = (): string | null => {
  try {
    const authData = localStorage.getItem('furnibles-auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed.state?.token || parsed.token
    }
  } catch (error) {
    console.error('Error parsing auth token:', error)
  }
  return null
}

export default function SellerDashboardPage() {
  const t = useTranslations('seller.dashboard')
  const tCommon = useTranslations('common')
  const tOrders = useTranslations('orders')
  const { user } = useAuthStore()
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ Cargar datos del dashboard desde APIs reales
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const token = getAuthToken()
        if (!token) {
          setError('No autorizado')
          return
        }

        console.log('🔍 [SELLER-DASHBOARD] Fetching dashboard data')

        // ✅ API call para estadísticas generales del vendedor
        const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/seller/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })

        if (!statsResponse.ok) {
          throw new Error(`Error ${statsResponse.status}: ${statsResponse.statusText}`)
        }

        const statsData = await statsResponse.json()
        console.log('✅ [SELLER-DASHBOARD] Stats loaded:', statsData)

        // ✅ API call para ventas recientes
        const salesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/sales?limit=5&sortBy=createdAt&sortOrder=desc`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })

        let recentSales: RecentSale[] = []
        if (salesResponse.ok) {
          const salesData = await salesResponse.json()
          console.log('✅ [SELLER-DASHBOARD] Recent sales loaded:', salesData.data?.length || 0)
          
          // Transformar datos de la API al formato esperado
          recentSales = salesData.data?.map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            buyerName: `${order.buyer?.firstName || ''} ${order.buyer?.lastName || ''}`.trim() || order.buyerEmail,
            productTitle: order.items?.[0]?.productTitle || 'Producto sin título',
            amount: order.totalAmount || 0,
            status: order.status,
            createdAt: order.createdAt,
          })) || []
        }

        // ✅ API call para productos top
        const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/seller/top-products?limit=3`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })

        let topProducts: TopProduct[] = []
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          console.log('✅ [SELLER-DASHBOARD] Top products loaded:', productsData.length || 0)
          topProducts = productsData || []
        }

        // ✅ API call para reviews recientes
        const reviewsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews?sellerId=${user?.id}&limit=4&sortBy=createdAt&sortOrder=desc`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })

        let recentReviews: RecentReview[] = []
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          console.log('✅ [SELLER-DASHBOARD] Recent reviews loaded:', reviewsData.data?.length || 0)
          
          // Transformar datos de la API al formato esperado
          recentReviews = reviewsData.data?.map((review: any) => ({
            id: review.id,
            productTitle: review.product?.title || 'Producto sin título',
            customerName: `${review.buyer?.firstName || ''} ${review.buyer?.lastName || ''}`.trim() || 'Usuario anónimo',
            rating: review.rating || 0,
            comment: review.comment || '',
            createdAt: review.createdAt,
            responded: !!review.response, // Verificar si tiene respuesta
          })) || []
        }

        // Construir objeto de datos del dashboard
        const dashboardData: DashboardData = {
          stats: {
            totalRevenue: statsData.totalRevenue || 0,
            totalSales: statsData.totalSales || 0,
            totalProducts: statsData.totalProducts || 0,
            averageRating: statsData.averageRating || 0,
            monthlyGrowth: {
              revenue: statsData.monthlyGrowth?.revenue || 0,
              sales: statsData.monthlyGrowth?.sales || 0,
              products: statsData.monthlyGrowth?.products || 0,
              rating: statsData.monthlyGrowth?.rating || 0,
            }
          },
          recentSales,
          topProducts,
          recentReviews,
        }

        setDashboardData(dashboardData)
        console.log('✅ [SELLER-DASHBOARD] Dashboard data set successfully')

      } catch (err) {
        console.error('❌ [SELLER-DASHBOARD] Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) {
      fetchDashboardData()
    }
  }, [user?.id])

  // ✅ Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // ✅ Formatear fecha
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  // ✅ Obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500 text-white'
      case 'PAID':
        return 'bg-blue-500 text-white'
      case 'PROCESSING':
        return 'bg-yellow-500 text-black'
      case 'PENDING':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  // ✅ Obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return tOrders('status.completed')
      case 'PAID':
        return tOrders('status.paid')
      case 'PROCESSING':
        return tOrders('status.processing')
      case 'PENDING':
        return tOrders('status.pending')
      default:
        return tCommon('error')
    }
  }

  // ✅ Estados de loading y error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border-[3px] border-black p-8 text-center" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-black text-black uppercase mb-4">Error</h2>
        <p className="text-gray-600 font-bold mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-orange-500 border-2 border-black text-black font-black py-2 px-4 uppercase hover:bg-orange-400 transition-all"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          {tCommon('retry')}
        </button>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="bg-white border-[3px] border-black p-8 text-center" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-black text-black uppercase mb-4">Sin datos</h2>
        <p className="text-gray-600 font-bold">No se pudieron cargar los datos del dashboard</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* HEADER DEL DASHBOARD */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-black uppercase mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-600 font-bold">
              {t('welcome', { storeName: user?.sellerProfile?.storeName || `${user?.firstName} ${user?.lastName}` })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-600">{t('last_update')}</p>
              <p className="text-sm font-black text-black">
                {new Date().toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
        </div>
      </div>

      {/* ESTADÍSTICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Ingresos Totales */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 border-2 border-black">
              <DollarSign className="h-6 w-6 text-black" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold ${dashboardData.stats.monthlyGrowth.revenue > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dashboardData.stats.monthlyGrowth.revenue > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(dashboardData.stats.monthlyGrowth.revenue).toFixed(1)}%
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-black mb-1">
              {formatCurrency(dashboardData.stats.totalRevenue)}
            </h3>
            <p className="text-sm font-bold text-gray-600">{t('total_revenue')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('vs_last_month')}</p>
          </div>
        </div>

        {/* Ventas Totales */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 border-2 border-black">
              <ShoppingBag className="h-6 w-6 text-black" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold ${dashboardData.stats.monthlyGrowth.sales > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dashboardData.stats.monthlyGrowth.sales > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(dashboardData.stats.monthlyGrowth.sales).toFixed(1)}%
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-black mb-1">
              {dashboardData.stats.totalSales}
            </h3>
            <p className="text-sm font-bold text-gray-600">{t('total_sales')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('vs_last_month')}</p>
          </div>
        </div>

        {/* Productos Totales */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 border-2 border-black">
              <Package className="h-6 w-6 text-black" />
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-gray-600">
              {dashboardData.stats.monthlyGrowth.products === 0 ? (
                <span>{t('no_change')}</span>
              ) : (
                <>
                  {dashboardData.stats.monthlyGrowth.products > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(dashboardData.stats.monthlyGrowth.products).toFixed(1)}%
                </>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-black mb-1">
              {dashboardData.stats.totalProducts}
            </h3>
            <p className="text-sm font-bold text-gray-600">{t('total_products')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('active_products')}</p>
          </div>
        </div>

        {/* Calificación Promedio */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500 border-2 border-black">
              <Star className="h-6 w-6 text-black" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold ${dashboardData.stats.monthlyGrowth.rating >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dashboardData.stats.monthlyGrowth.rating >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(dashboardData.stats.monthlyGrowth.rating).toFixed(1)}%
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-black mb-1">
              {dashboardData.stats.averageRating.toFixed(1)}/5.0
            </h3>
            <p className="text-sm font-bold text-gray-600">{t('average_rating')}</p>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < Math.floor(dashboardData.stats.averageRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* VENTAS RECIENTES */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-black uppercase">{t('recent_sales')}</h2>
            <Link 
              href="/vendedor-dashboard/ventas"
              className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              {t('view_all')}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {dashboardData.recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 border-2 border-gray-200 hover:border-black transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-black text-sm">{sale.orderNumber}</h4>
                    <span className={`px-2 py-1 text-xs font-bold border border-black ${getStatusColor(sale.status)}`}>
                      {getStatusText(sale.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-bold">{sale.buyerName}</p>
                  <p className="text-xs text-gray-500">{sale.productTitle}</p>
                  <p className="text-xs text-gray-400">{formatDate(sale.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-black">{formatCurrency(sale.amount)}</p>
                </div>
              </div>
            ))}
          </div>
          
          {dashboardData.recentSales.length === 0 && (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">{t('no_data')}</p>
            </div>
          )}
        </div>

        {/* PRODUCTOS DESTACADOS */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-black uppercase">{t('top_products')}</h2>
            <Link 
              href="/vendedor-dashboard/productos"
              className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              {t('view_all')}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {dashboardData.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-black transition-all">
                <div className="w-8 h-8 bg-orange-500 border-2 border-black flex items-center justify-center">
                  <span className="font-black text-black">#{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-black text-sm mb-1">{product.title}</h4>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-600 font-bold">{product.sales} {t('sales')}</span>
                    <span className="text-gray-600 font-bold">{product.views} {t('views')}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-gray-600 font-bold">{product.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-black">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>

          {dashboardData.topProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">{t('no_data')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subir Producto */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 border-2 border-black mx-auto mb-4 flex items-center justify-center">
              <Package className="h-8 w-8 text-black" />
            </div>
            <h3 className="font-black text-lg text-black mb-2 uppercase">{t('quick_actions.upload_product')}</h3>
            <p className="text-sm text-gray-600 font-bold mb-4">
              {t('quick_actions.upload_product_desc')}
            </p>
            <Link
              href="/vendedor-dashboard/productos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-3 bg-green-500 border-2 border-black font-black text-black uppercase hover:bg-green-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <Package className="h-4 w-4" />
              {t('quick_actions.create_product')}
            </Link>
          </div>
        </div>

        {/* Ver Analytics */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 border-2 border-black mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-black" />
            </div>
            <h3 className="font-black text-lg text-black mb-2 uppercase">{t('quick_actions.analytics')}</h3>
            <p className="text-sm text-gray-600 font-bold mb-4">
              {t('quick_actions.analytics_desc')}
            </p>
            <Link
              href="/vendedor-dashboard/analytics"
              className="inline-flex items-center gap-2 px-4 py-3 bg-blue-500 border-2 border-black font-black text-black uppercase hover:bg-blue-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <TrendingUp className="h-4 w-4" />
              {t('quick_actions.view_analytics')}
            </Link>
          </div>
        </div>

        {/* Gestionar Reviews */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 border-2 border-black mx-auto mb-4 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-black" />
            </div>
            <h3 className="font-black text-lg text-black mb-2 uppercase">{t('quick_actions.reviews')}</h3>
            <p className="text-sm text-gray-600 font-bold mb-4">
              {t('quick_actions.reviews_desc')}
            </p>
            <Link
              href="/vendedor-dashboard/reviews"
              className="inline-flex items-center gap-2 px-4 py-3 bg-yellow-500 border-2 border-black font-black text-black uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <MessageSquare className="h-4 w-4" />
              {t('quick_actions.manage')}
            </Link>
          </div>
        </div>
      </div>

      {/* RESEÑAS RECIENTES */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-black uppercase">{t('recent_reviews')}</h2>
          <Link 
            href="/vendedor-dashboard/reviews"
            className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
          >
            {t('view_all')}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardData.recentReviews.map((review) => (
            <div key={review.id} className="p-4 border-2 border-gray-200 hover:border-black transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-600">{review.customerName}</span>
                </div>
              </div>

              <h4 className="font-bold text-black text-sm mb-2">{review.productTitle}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{review.comment}</p>
              <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>

              {!review.responded && (
                <div className="mt-3">
                  <Link
                    href={`/vendedor-dashboard/reviews?highlight=${review.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 border-2 border-black font-bold text-black text-xs hover:bg-orange-400 transition-all"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <MessageSquare className="h-3 w-3" />
                    {t('respond')}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {dashboardData.recentReviews.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold">{t('no_data')}</p>
          </div>
        )}
      </div>

      {/* TIPS Y CONSEJOS */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500 border-2 border-black">
            <AlertCircle className="h-6 w-6 text-black" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg text-black mb-2 uppercase">{t('tips.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-black">{t('tips.tip1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-black">{t('tips.tip2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-black">{t('tips.tip3')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-black">{t('tips.tip4')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-black">{t('tips.tip5')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-black">{t('tips.tip6')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}