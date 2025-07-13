'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  FileCheck,
  MessageSquare,
  Flag,
  Shield,
  Database,
  Server,
  Mail,
  CreditCard,
  Eye,
  Download,
  Star,
  ShoppingCart,
  UserCheck,
  Calendar,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react'

// Stores
import { useAdminStore } from '@/lib/stores/admin-store'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const t = useTranslations('admin')

  // Store
  const { 
    dashboardStats, 
    analytics,
    pendingProducts,
    pendingReviews,
    flaggedContent,
    fetchDashboardStats,
    fetchAnalytics,
    refreshStats,
    isLoading: storeLoading,
    error
  } = useAdminStore()

  // Cargar datos iniciales
  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      try {
        await refreshStats()
        await fetchAnalytics('30d')
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setIsLoading(false)
        setLastRefresh(new Date())
      }
    }

    loadDashboard()
  }, [refreshStats, fetchAnalytics])

  // Manejar refresh manual
  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await refreshStats()
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular totales de moderación
  const getPendingModerationCount = () => {
    const products = pendingProducts?.length || 0
    const reviews = pendingReviews?.length || 0
    const flagged = (flaggedContent?.reviews?.length || 0) + (flaggedContent?.users?.length || 0)
    return { products, reviews, flagged, total: products + reviews + flagged }
  }

  // Obtener estado del sistema
  const getSystemHealthStatus = () => {
    if (!dashboardStats?.platformHealth) return 'unknown'
    
    const { serverStatus, dbStatus, paymentStatus, emailStatus } = dashboardStats.platformHealth
    const statuses = [serverStatus, dbStatus, paymentStatus, emailStatus]
    
    if (statuses.includes('error')) return 'error'
    if (statuses.includes('warning')) return 'warning'
    return 'healthy'
  }

  const pendingModeration = getPendingModerationCount()
  const systemHealth = getSystemHealthStatus()

  if (isLoading && !dashboardStats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">Dashboard Admin</h1>
          <p className="text-gray-600 font-bold">
            Vista general de la plataforma - Actualizado: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-black font-black border-2 border-black"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            ACTUALIZAR
          </Button>
        </div>
      </div>

      {/* Alertas críticas */}
      {(pendingModeration.total > 0 || systemHealth !== 'healthy') && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Alerta de moderación */}
          {pendingModeration.total > 0 && (
            <Card className="border-3 border-red-500" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <CardHeader className="bg-red-500 text-white">
                <CardTitle className="flex items-center gap-2 font-black">
                  <AlertTriangle className="h-5 w-5" />
                  MODERACIÓN PENDIENTE
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {pendingModeration.products > 0 && (
                    <Link href="/admin/productos" className="flex items-center justify-between p-2 bg-orange-100 hover:bg-orange-200 border border-orange-300">
                      <span className="font-bold">Productos pendientes</span>
                      <Badge variant="secondary" className="bg-orange-500 text-black">
                        {pendingModeration.products}
                      </Badge>
                    </Link>
                  )}
                  {pendingModeration.reviews > 0 && (
                    <Link href="/admin/reviews" className="flex items-center justify-between p-2 bg-orange-100 hover:bg-orange-200 border border-orange-300">
                      <span className="font-bold">Reviews pendientes</span>
                      <Badge variant="secondary" className="bg-orange-500 text-black">
                        {pendingModeration.reviews}
                      </Badge>
                    </Link>
                  )}
                  {pendingModeration.flagged > 0 && (
                    <Link href="/admin/reportes" className="flex items-center justify-between p-2 bg-red-100 hover:bg-red-200 border border-red-300">
                      <span className="font-bold">Contenido reportado</span>
                      <Badge variant="destructive">
                        {pendingModeration.flagged}
                      </Badge>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado del sistema */}
          <Card className={`border-3 ${
            systemHealth === 'error' ? 'border-red-500' : 
            systemHealth === 'warning' ? 'border-yellow-500' : 
            'border-green-500'
          }`} style={{ boxShadow: '5px 5px 0 #000000' }}>
            <CardHeader className={`${
              systemHealth === 'error' ? 'bg-red-500 text-white' : 
              systemHealth === 'warning' ? 'bg-yellow-500 text-black' : 
              'bg-green-500 text-black'
            }`}>
              <CardTitle className="flex items-center gap-2 font-black">
                {systemHealth === 'error' ? <XCircle className="h-5 w-5" /> :
                 systemHealth === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                 <CheckCircle className="h-5 w-5" />}
                ESTADO DEL SISTEMA
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Server className="h-4 w-4" />
                    Servidor
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    dashboardStats?.platformHealth?.serverStatus === 'healthy' ? 'bg-green-500' :
                    dashboardStats?.platformHealth?.serverStatus === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Database className="h-4 w-4" />
                    Base de datos
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    dashboardStats?.platformHealth?.dbStatus === 'healthy' ? 'bg-green-500' :
                    dashboardStats?.platformHealth?.dbStatus === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Pagos
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    dashboardStats?.platformHealth?.paymentStatus === 'healthy' ? 'bg-green-500' :
                    dashboardStats?.platformHealth?.paymentStatus === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    dashboardStats?.platformHealth?.emailStatus === 'healthy' ? 'bg-green-500' :
                    dashboardStats?.platformHealth?.emailStatus === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Usuarios */}
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-black uppercase">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-black">{dashboardStats?.totalUsers || 0}</div>
            <div className="flex items-center text-xs text-gray-600 font-bold">
              {dashboardStats?.monthlyGrowth?.users && dashboardStats.monthlyGrowth.users > 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                  +{dashboardStats.monthlyGrowth.users} este mes
                </>
              ) : (
                <span>Sin cambios este mes</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Productos */}
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-black uppercase">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-black">{dashboardStats?.totalProducts || 0}</div>
            <div className="flex items-center text-xs text-gray-600 font-bold">
              {dashboardStats?.monthlyGrowth?.products && dashboardStats.monthlyGrowth.products > 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                  +{dashboardStats.monthlyGrowth.products} este mes
                </>
              ) : (
                <span>Sin cambios este mes</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Órdenes */}
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-black uppercase">Total Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-black">{dashboardStats?.totalOrders || 0}</div>
            <div className="flex items-center text-xs text-gray-600 font-bold">
              {dashboardStats?.monthlyGrowth?.orders && dashboardStats.monthlyGrowth.orders > 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                  +{dashboardStats.monthlyGrowth.orders} este mes
                </>
              ) : (
                <span>Sin cambios este mes</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Total */}
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-black uppercase">Revenue Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-black">${dashboardStats?.totalRevenue || 0}</div>
            <div className="flex items-center text-xs text-gray-600 font-bold">
              {dashboardStats?.monthlyGrowth?.revenue && dashboardStats.monthlyGrowth.revenue > 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                  +${dashboardStats.monthlyGrowth.revenue} este mes
                </>
              ) : (
                <span>Sin cambios este mes</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widgets de actividad */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Actividad de moderación */}
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-black">
              <Shield className="h-5 w-5 text-red-600" />
              ACTIVIDAD DE MODERACIÓN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold">
                <FileCheck className="h-4 w-4" />
                Productos pendientes
              </span>
              <Link href="/admin/productos">
                <Badge variant={pendingModeration.products > 0 ? "destructive" : "secondary"}>
                  {pendingModeration.products}
                </Badge>
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold">
                <MessageSquare className="h-4 w-4" />
                Reviews pendientes
              </span>
              <Link href="/admin/reviews">
                <Badge variant={pendingModeration.reviews > 0 ? "destructive" : "secondary"}>
                  {pendingModeration.reviews}
                </Badge>
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold">
                <Flag className="h-4 w-4" />
                Contenido reportado
              </span>
              <Link href="/admin/reportes">
                <Badge variant={pendingModeration.flagged > 0 ? "destructive" : "secondary"}>
                  {pendingModeration.flagged}
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Top vendedores */}
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-black">
              <TrendingUp className="h-5 w-5 text-green-600" />
              TOP VENDEDORES
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topSellers?.length ? (
              <div className="space-y-3">
                {analytics.topSellers.slice(0, 5).map((seller, index) => (
                  <div key={seller.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-orange-500 text-black text-xs font-black rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm">{seller.storeName}</p>
                        <p className="text-xs text-gray-600">{seller.totalSales} ventas</p>
                      </div>
                    </div>
                    <span className="font-black text-green-600">${seller.revenue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-black">
              <Activity className="h-5 w-5 text-blue-600" />
              ACCIONES RÁPIDAS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin/usuarios"
              className="flex items-center gap-2 p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all font-bold"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <Users className="h-4 w-4" />
              Gestionar usuarios
            </Link>
            <Link
              href="/admin/productos"
              className="flex items-center gap-2 p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all font-bold"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <Package className="h-4 w-4" />
              Moderar productos
            </Link>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-2 p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all font-bold"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <TrendingUp className="h-4 w-4" />
              Ver analytics
            </Link>
            <Link
              href="/admin/configuracion"
              className="flex items-center gap-2 p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all font-bold"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <Shield className="h-4 w-4" />
              Configuración
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Error handling */}
      {error && (
        <Card className="border-3 border-red-500" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardHeader className="bg-red-500 text-white">
            <CardTitle className="flex items-center gap-2 font-black">
              <XCircle className="h-5 w-5" />
              ERROR
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-red-600 font-bold">{error}</p>
            <Button 
              onClick={handleRefresh}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}