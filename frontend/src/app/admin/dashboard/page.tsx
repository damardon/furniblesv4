'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAdminStore } from 'src/lib/stores/admin-store'
import { useNotificationStore } from 'src/lib/stores/notification-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Package,
  DollarSign,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  Download,
  MessageSquare,
  Shield,
  Activity,
  BarChart3,
  Calendar,
  Filter,
  RefreshCw,
  Settings,
  ExternalLink
} from 'lucide-react'

interface DashboardMetrics {
  totalUsers: number
  totalSellers: number
  totalProducts: number
  pendingProducts: number
  totalOrders: number
  totalRevenue: number
  platformFees: number
  totalReviews: number
  pendingReviews: number
  averageRating: number
  systemHealth: number
  activeDownloads: number
}

interface RecentActivity {
  id: string
  type: 'user_registration' | 'product_submitted' | 'order_completed' | 'review_reported' | 'payout_processed'
  message: string
  timestamp: string
  severity: 'info' | 'warning' | 'error' | 'success'
  userId?: string
  productId?: string
  orderId?: string
}

interface TopPerformer {
  id: string
  name: string
  type: 'seller' | 'product'
  value: number
  metric: string
  change: number
}

export default function AdminDashboardPage() {
  const t = useTranslations('admin.dashboard')
  const tCommon = useTranslations('common')
  const tUsers = useTranslations('admin.users')
  const tProducts = useTranslations('admin.products')
  const tOrders = useTranslations('admin.orders')

  const {
    dashboardMetrics,
    recentActivity,
    topPerformers,
    isLoading,
    error,
    fetchDashboardData,
    refreshMetrics
  } = useAdminStore()

  const { notifications } = useNotificationStore()

  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDashboardData(selectedPeriod)
  }, [selectedPeriod, fetchDashboardData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshMetrics()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <Users className="h-4 w-4" />
      case 'product_submitted':
        return <Package className="h-4 w-4" />
      case 'order_completed':
        return <CheckCircle className="h-4 w-4" />
      case 'review_reported':
        return <AlertTriangle className="h-4 w-4" />
      case 'payout_processed':
        return <DollarSign className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'success':
        return 'text-green-500'
      default:
        return 'text-blue-500'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('error_loading_dashboard')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="1d">{t('periods.today')}</option>
            <option value="7d">{t('periods.week')}</option>
            <option value="30d">{t('periods.month')}</option>
            <option value="90d">{t('periods.quarter')}</option>
          </select>

          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {tCommon('refresh')}
          </Button>

          {/* Settings */}
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            {tCommon('settings')}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metrics.total_users')}
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardMetrics?.totalUsers?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t('metrics.sellers_count', { count: dashboardMetrics?.totalSellers || 0 })}
            </div>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metrics.total_products')}
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardMetrics?.totalProducts?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t('metrics.pending_approval', { count: dashboardMetrics?.pendingProducts || 0 })}
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metrics.total_revenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardMetrics?.totalRevenue || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t('metrics.platform_fees', { amount: formatCurrency(dashboardMetrics?.platformFees || 0) })}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metrics.system_health')}
            </CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardMetrics?.systemHealth || 100}%
            </div>
            <Progress 
              value={dashboardMetrics?.systemHealth || 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="users">{t('tabs.users')}</TabsTrigger>
            <TabsTrigger value="products">{t('tabs.products')}</TabsTrigger>
            <TabsTrigger value="orders">{t('tabs.orders')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('tabs.reviews')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {t('recent_activity.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('recent_activity.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i: number) => (
                          <div key={i} className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                            <div className="flex-1 space-y-1">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {recentActivity?.map((activity: RecentActivity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className={`mt-1 ${getActivityColor(activity.severity)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 break-words">
                                {activity.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant={activity.severity === 'error' ? 'destructive' : 'secondary'}>
                              {t(`activity_types.${activity.type}`)}
                            </Badge>
                          </div>
                        ))}
                        {(!recentActivity || recentActivity.length === 0) && (
                          <p className="text-center text-gray-500 py-8">
                            {t('recent_activity.no_activity')}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {t('top_performers.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('top_performers.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                              <div className="space-y-1">
                                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                              </div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-12 animate-pulse" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {topPerformers?.map((performer: TopPerformer, index: number) => (
                          <div key={performer.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                                #{index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {performer.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t(`performer_types.${performer.type}`)} • {performer.metric}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {performer.type === 'seller' ? formatCurrency(performer.value) : performer.value.toLocaleString()}
                              </p>
                              <p className={`text-xs ${performer.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(performer.change)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {(!topPerformers || topPerformers.length === 0) && (
                          <p className="text-center text-gray-500 py-8">
                            {t('top_performers.no_data')}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{tUsers('management.title')}</CardTitle>
                <CardDescription>
                  {tUsers('management.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {tUsers('management.coming_soon')}
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                      {tUsers('management.coming_soon_description')}
                    </p>
                    <Button className="mt-4" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {tUsers('management.view_all')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>{tProducts('moderation.title')}</CardTitle>
                <CardDescription>
                  {tProducts('moderation.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {tProducts('moderation.coming_soon')}
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                      {tProducts('moderation.coming_soon_description')}
                    </p>
                    <Button className="mt-4" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {tProducts('moderation.view_pending')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{tOrders('management.title')}</CardTitle>
                <CardDescription>
                  {tOrders('management.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {tOrders('management.coming_soon')}
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                      {tOrders('management.coming_soon_description')}
                    </p>
                    <Button className="mt-4" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {tOrders('management.view_all')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>{t('reviews.moderation.title')}</CardTitle>
                <CardDescription>
                  {t('reviews.moderation.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t('reviews.moderation.coming_soon')}
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                      {t('reviews.moderation.coming_soon_description')}
                    </p>
                    <Button className="mt-4" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('reviews.moderation.view_pending')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}