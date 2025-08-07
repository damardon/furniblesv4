'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { 
  ShoppingBagIcon, 
  CalendarIcon, 
  FilterIcon,
  SearchIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  AlertCircleIcon,
  CreditCardIcon,
  PackageIcon,
  DownloadIcon,
  EyeIcon,
  RefreshCwIcon
} from 'lucide-react'
import { Order, OrderStatus } from '@/types'
import { useAuthStore } from '@/lib/stores/auth-store'

// ✅ MIGRATED: No more mock data imports
// ❌ REMOVED: import { getOrdersByUserId, getOrderStats } from '@/data/mockOrders'

export default function OrdersPage() {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const router = useRouter()
  
  // Stores
  const { isAuthenticated, user, setLoginModalOpen } = useAuthStore()

  // States
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    completedOrders: 0,
    pendingOrders: 0
  })

  // ✅ MIGRATED: Loading and error states for API calls
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

  // ✅ MIGRATED: Load user orders from API instead of mock data
  useEffect(() => {
    if (!user?.id) return

    const loadUserOrders = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        // Fetch user orders from API
        const ordersResponse = await fetch('/api/orders/my', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!ordersResponse.ok) {
          if (ordersResponse.status === 401) {
            setLoginModalOpen(true)
            router.push('/productos')
            return
          }
          throw new Error(`HTTP error! status: ${ordersResponse.status}`)
        }

        const ordersData = await ordersResponse.json()
        
        if (ordersData.success) {
          const userOrders = ordersData.orders || []
          setOrders(userOrders)
          setFilteredOrders(userOrders)

          // Calculate stats from fetched orders
          const calculatedStats = calculateOrderStats(userOrders)
          setStats(calculatedStats)
        } else {
          throw new Error(ordersData.message || 'Failed to load orders')
        }

      } catch (error) {
        console.error('Error loading orders:', error)
        setError(error instanceof Error ? error.message : 'Failed to load orders')
        setOrders([])
        setFilteredOrders([])
        setStats({
          totalOrders: 0,
          totalSpent: 0,
          completedOrders: 0,
          pendingOrders: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUserOrders()
  }, [user?.id, setLoginModalOpen, router])

  // ✅ MIGRATED: Helper function to calculate stats from orders
  const calculateOrderStats = (ordersList: Order[]) => {
    const totalOrders = ordersList.length
    const totalSpent = ordersList
      .filter(order => order.status === OrderStatus.COMPLETED || order.status === OrderStatus.PAID)
      .reduce((sum, order) => sum + order.totalAmount, 0)
    
    const statusCounts = ordersList.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<OrderStatus, number>)

    return {
      totalOrders,
      totalSpent,
      completedOrders: statusCounts[OrderStatus.COMPLETED] || 0,
      pendingOrders: statusCounts[OrderStatus.PENDING] || 0
    }
  }

  // Filter and search orders
  useEffect(() => {
    let filtered = [...orders]

    // Filter by status
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }

    // ✅ FIXED: Search by order number or product title with safe navigation
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        (order.items && order.items.some(item => 
          item.productTitle.toLowerCase().includes(query)
        ))
      )
    }

    // Sort orders
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'amount':
          aValue = a.totalAmount
          bValue = b.totalAmount
          break
        case 'status':
          aValue = a.status
          bValue = b.status
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

    setFilteredOrders(filtered)
  }, [orders, selectedStatus, searchQuery, sortBy, sortOrder])

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.PENDING]: {
        color: 'bg-yellow-400 text-black border-black',
        icon: ClockIcon,
        text: t('status.pending')
      },
      [OrderStatus.PROCESSING]: {
        color: 'bg-blue-400 text-black border-black',
        icon: PackageIcon,
        text: t('status.processing')
      },
      [OrderStatus.PAID]: {
        color: 'bg-green-400 text-black border-black',
        icon: CreditCardIcon,
        text: t('status.paid')
      },
      [OrderStatus.COMPLETED]: {
        color: 'bg-green-500 text-white border-black',
        icon: CheckCircleIcon,
        text: t('status.completed')
      },
      [OrderStatus.CANCELLED]: {
        color: 'bg-red-400 text-black border-black',
        icon: XCircleIcon,
        text: t('status.cancelled')
      },
      [OrderStatus.REFUNDED]: {
        color: 'bg-gray-400 text-black border-black',
        icon: AlertCircleIcon,
        text: t('status.refunded')
      },
      [OrderStatus.DISPUTED]: {
        color: 'bg-purple-400 text-black border-black',
        icon: AlertCircleIcon,
        text: t('status.disputed')
      },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <span 
        className={`${config.color} border-2 text-xs font-black px-2 py-1 uppercase flex items-center gap-1`}
        style={{ boxShadow: '2px 2px 0 #000000' }}
      >
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    )
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

  // ✅ MIGRATED: Retry function for API failures
  const handleRetry = () => {
    if (user?.id) {
      setError(null)
      // Trigger the orders reload by changing a dependency
      window.location.reload()
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

  // ✅ MIGRATED: Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
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
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCwIcon className="h-16 w-16 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-xl font-bold text-gray-600">{t('loading')}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ✅ MIGRATED: Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white">
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
          <div 
            className="bg-red-100 border-4 border-red-500 p-8 text-center"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <AlertCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-red-800 uppercase mb-4">
              {t('error.title')}
            </h2>
            <p className="text-red-700 font-bold mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-red-500 hover:bg-red-600 text-white border-2 border-black px-6 py-3 font-black uppercase transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <RefreshCwIcon className="h-4 w-4 mr-2 inline" />
              {t('error.retry')}
            </button>
          </div>
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
              href="/productos"
              className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {tCommon('actions.back')}
            </Link>
            
            <div>
              <h1 className="text-4xl font-black text-black uppercase flex items-center gap-3">
                <ShoppingBagIcon className="w-8 h-8" />
                {t('title')}
              </h1>
              <p className="text-gray-600 font-bold mt-2">
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div 
              className="bg-blue-100 border-4 border-black p-6 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <div className="text-2xl font-black text-black mb-2">{stats.totalOrders}</div>
              <div className="text-sm font-black text-black uppercase">{t('stats.total_orders')}</div>
            </div>
            
            <div 
              className="bg-green-100 border-4 border-black p-6 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <div className="text-2xl font-black text-black mb-2">{stats.completedOrders}</div>
              <div className="text-sm font-black text-black uppercase">{t('stats.completed')}</div>
            </div>
            
            <div 
              className="bg-yellow-100 border-4 border-black p-6 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <div className="text-2xl font-black text-black mb-2">{stats.pendingOrders}</div>
              <div className="text-sm font-black text-black uppercase">{t('stats.pending')}</div>
            </div>
            
            <div 
              className="bg-orange-100 border-4 border-black p-6 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <div className="text-2xl font-black text-black mb-2">{formatPrice(stats.totalSpent)}</div>
              <div className="text-sm font-black text-black uppercase">{t('stats.total_spent')}</div>
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
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | 'ALL')}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="ALL">{t('filters.all_statuses')}</option>
              <option value={OrderStatus.PENDING}>{t('status.pending')}</option>
              <option value={OrderStatus.PROCESSING}>{t('status.processing')}</option>
              <option value={OrderStatus.PAID}>{t('status.paid')}</option>
              <option value={OrderStatus.COMPLETED}>{t('status.completed')}</option>
              <option value={OrderStatus.CANCELLED}>{t('status.cancelled')}</option>
              <option value={OrderStatus.REFUNDED}>{t('status.refunded')}</option>
              <option value={OrderStatus.DISPUTED}>{t('status.disputed')}</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="date">{t('sort.by_date')}</option>
              <option value="amount">{t('sort.by_amount')}</option>
              <option value="status">{t('sort.by_status')}</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="desc">{t('sort.newest')}</option>
              <option value="asc">{t('sort.oldest')}</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div 
            className="bg-gray-100 border-4 border-black p-12 text-center"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-black text-black uppercase mb-4">
              {orders.length === 0 ? t('empty.no_orders') : t('empty.no_results')}
            </h2>
            <p className="text-gray-600 font-bold mb-6">
              {orders.length === 0 ? t('empty.start_shopping') : t('empty.adjust_filters')}
            </p>
            <Link 
              href="/productos"
              className="inline-flex items-center gap-2 bg-yellow-400 border-4 border-black px-6 py-3 font-black text-black uppercase hover:bg-orange-500 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ShoppingBagIcon className="w-4 h-4" />
              {t('actions.view_products')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div 
                key={order.id}
                className="bg-white border-4 border-black p-6 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
                style={{ boxShadow: '6px 6px 0 #000000' }}
              >
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div>
                      <h3 className="text-xl font-black text-black uppercase">
                        {order.orderNumber}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="font-bold">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-black text-black">
                        {formatPrice(order.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-600 font-bold">
                        {/* ✅ FIXED: Safe navigation for items length */}
                        {t('items_count', { 
                          count: order.items?.length || 0,
                          item: (order.items?.length || 0) === 1 ? t('item.singular') : t('item.plural')
                        })}
                      </div>
                    </div>
                    
                    <Link 
                      href={`/pedidos/${order.orderNumber}`}
                      className="flex items-center gap-2 bg-blue-400 border-3 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    >
                      <EyeIcon className="w-4 h-4" />
                      {t('actions.view')}
                    </Link>
                  </div>
                </div>

                {/* ✅ FIXED: Order Items Preview with safe navigation */}
                {order.items && order.items.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {order.items.map((item) => (
                      <div 
                        key={item.id}
                        className="flex gap-3 p-4 bg-gray-50 border-2 border-black"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <div className="relative w-16 h-16 border-2 border-black overflow-hidden">
                          {(() => {
                            // ✅ FIXED: Parse imageFileIds JSON string safely
                            try {
                              const imageIds = item.product?.imageFileIds ? JSON.parse(item.product.imageFileIds) : [];
                              const firstImageId = Array.isArray(imageIds) && imageIds.length > 0 ? imageIds[0] : null;
                              
                              if (firstImageId) {
                                return (
                                  <Image
                                    src={`/api/files/${firstImageId}`}
                                    alt={item.productTitle}
                                    fill
                                    className="object-cover"
                                  />
                                );
                              }
                            } catch (error) {
                              console.error('Error parsing imageFileIds:', error);
                            }
                            
                            // Fallback image
                            return (
                              <div className="w-full h-full bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
                                <span className="text-2xl">🪵</span>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-black text-sm uppercase line-clamp-2 mb-1">
                            {item.productTitle}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold bg-blue-200 text-black px-2 py-1 border border-black">
                              {t('quantity_label')}: {item.quantity}
                            </span>
                            <span className="font-black text-black text-sm">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {order.paymentIntentId && (
                      <span className="font-bold">
                        {t('payment_id')}: {order.paymentIntentId.slice(-8)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(order.status === OrderStatus.COMPLETED || order.status === OrderStatus.PAID) && (
                      <Link
                        href="/descargas"
                        className="flex items-center gap-1 text-sm bg-green-400 border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <DownloadIcon className="w-3 h-3" />
                        {t('actions.download')}
                      </Link>
                    )}
                    
                    <Link 
                      href={`/pedidos/${order.orderNumber}`}
                      className="flex items-center gap-1 text-sm bg-white border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-gray-100 transition-all"
                      style={{ boxShadow: '2px 2px 0 #000000' }}
                    >
                      {t('actions.view_detail')}
                      <ChevronRightIcon className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Counter */}
        {filteredOrders.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 font-bold">
              {t('results_showing', { 
                showing: filteredOrders.length, 
                total: orders.length 
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}