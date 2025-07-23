'use client'

import { useState, useEffect } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  CreditCardIcon,
  UserIcon,
  MapPinIcon,
  MailIcon,
  PhoneIcon,
  DownloadIcon,
  FileTextIcon,
  PackageIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ShareIcon,
  PrinterIcon,
  ExternalLinkIcon,
  ShoppingCartIcon,
  TagIcon
} from 'lucide-react'
import { Order, OrderStatus } from '@/types'
import { useAuthStore } from '@/lib/stores/auth-store'
import { mockOrders } from '@/data/mockOrders'

interface OrderDetailPageProps {
  params: {
    orderNumber: string
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const t = useTranslations('order_detail')
  const tCommon = useTranslations('common')
  const tOrders = useTranslations('orders')
  const router = useRouter()
  
  // Stores
  const { isAuthenticated, user, setLoginModalOpen } = useAuthStore()

  // States
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoginModalOpen(true)
      router.push('/productos')
      return
    }
  }, [isAuthenticated, setLoginModalOpen, router])

  // Load order
  useEffect(() => {
    const foundOrder = mockOrders.find(o => o.orderNumber === params.orderNumber)
    
    if (!foundOrder) {
      notFound()
    }

    // Check if order belongs to current user
    if (foundOrder.buyerId !== user?.id) {
      router.push('/pedidos')
      return
    }

    setOrder(foundOrder)
    setIsLoading(false)
  }, [params.orderNumber, user?.id, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-black font-black text-xl uppercase">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return notFound()
  }

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.PENDING]: {
        color: 'bg-yellow-400 text-black border-black',
        icon: ClockIcon,
        text: t('status.pending'),
        description: t('status_descriptions.pending')
      },
      [OrderStatus.PROCESSING]: {
        color: 'bg-blue-400 text-black border-black',
        icon: RefreshCwIcon,
        text: t('status.processing'),
        description: t('status_descriptions.processing')
      },
      [OrderStatus.PAID]: {
        color: 'bg-green-400 text-black border-black',
        icon: CreditCardIcon,
        text: t('status.paid'),
        description: t('status_descriptions.paid')
      },
      [OrderStatus.COMPLETED]: {
        color: 'bg-green-500 text-white border-black',
        icon: CheckCircleIcon,
        text: t('status.completed'),
        description: t('status_descriptions.completed')
      },
      [OrderStatus.CANCELLED]: {
        color: 'bg-red-400 text-black border-black',
        icon: XCircleIcon,
        text: t('status.failed'),
        description: t('status_descriptions.failed')
      },
      [OrderStatus.REFUNDED]: {
        color: 'bg-gray-400 text-black border-black',
        icon: AlertCircleIcon,
        text: t('status.refunded'),
        description: t('status_descriptions.refunded')
      },
      [OrderStatus.DISPUTED]: {
        color: 'bg-gray-400 text-black border-black',
        icon: AlertCircleIcon,
        text: t('status.refunded'),
        description: t('status_descriptions.refunded')
      },
    }

    return statusConfig[status]
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t('share.title', { orderNumber: order.orderNumber }),
        text: t('share.text', { orderNumber: order.orderNumber }),
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const statusInfo = getStatusBadge(order.status)
  const StatusIcon = statusInfo.icon

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
            <Link href="/pedidos" className="hover:text-orange-500 transition-colors">
              {tOrders('title')}
            </Link>
            <span>/</span>
            <span className="text-orange-500">{order.orderNumber}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link 
                href="/pedidos"
                className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                <ArrowLeftIcon className="w-4 h-4" />
                {tCommon('actions.back')}
              </Link>
              
              <div>
                <h1 className="text-4xl font-black text-black uppercase flex items-center gap-3">
                  <PackageIcon className="w-8 h-8" />
                  {order.orderNumber}
                </h1>
                <p className="text-gray-600 font-bold mt-2">
                  {t('ordered_on', { date: formatDate(order.createdAt) })}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-3 bg-white border-4 border-black hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
                title={t('actions.share')}
              >
                <ShareIcon className="w-5 h-5 text-black" />
              </button>
              
              <button
                onClick={handlePrint}
                className="p-3 bg-white border-4 border-black hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
                title={t('actions.print')}
              >
                <PrinterIcon className="w-5 h-5 text-black" />
              </button>
            </div>
          </div>

          {/* Order Status */}
          <div 
            className={`${statusInfo.color} border-4 p-6 mb-8`}
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-black/10 border-3 border-black rounded-full flex items-center justify-center">
                  <StatusIcon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase mb-1">
                    {t('status_label')}: {statusInfo.text}
                  </h2>
                  <p className="font-bold text-sm">
                    {statusInfo.description}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-black mb-1">
                  {formatPrice(order.totalAmount)}
                </div>
                <div className="text-sm font-bold uppercase">
                  {t('products_count', { 
                    count: order.items.length, 
                    unit: order.items.length === 1 ? t('product_singular') : t('product_plural') 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Products */}
            <div 
              className="bg-white border-4 border-black p-6"
              style={{ boxShadow: '6px 6px 0 #000000' }}
            >
              <h3 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-2">
                <ShoppingCartIcon className="w-6 h-6" />
                {t('sections.products')}
              </h3>
              
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex gap-6 p-4 bg-gray-50 border-3 border-black"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <div className="relative w-24 h-24 border-3 border-black overflow-hidden">
                      {item.product.previewImages?.[0] ? (
                        <Image
                          src={item.product.previewImages[0]}
                          alt={item.productTitle}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
                          <span className="text-3xl">🪵</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link 
                            href={`/productos/${item.productSlug}`}
                            className="text-lg font-black text-black uppercase hover:text-orange-500 transition-colors"
                          >
                            {item.productTitle}
                          </Link>
                          <p className="text-sm text-gray-600 font-bold mt-1">
                            {item.product.seller.sellerProfile?.storeName || 
                             `${item.product.seller.firstName} ${item.product.seller.lastName}`}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-black text-black">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          <div className="text-sm text-gray-600 font-bold">
                            {formatPrice(item.price)} × {item.quantity}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span 
                            className="bg-blue-200 text-black text-xs font-black px-2 py-1 border-2 border-black uppercase"
                            style={{ boxShadow: '2px 2px 0 #000000' }}
                          >
                            {t('product.quantity')}: {item.quantity}
                          </span>
                          
                          <span 
                            className={`${item.product.difficulty === 'BEGINNER' ? 'bg-green-400' : 
                                       item.product.difficulty === 'INTERMEDIATE' ? 'bg-yellow-400' : 'bg-orange-400'} 
                                       text-black text-xs font-black px-2 py-1 border-2 border-black uppercase`}
                            style={{ boxShadow: '2px 2px 0 #000000' }}
                          >
                            {item.product.difficulty}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {(order.status === OrderStatus.COMPLETED || order.status === OrderStatus.PAID) && (
                            <Link
                              href="/descargas"
                              className="flex items-center gap-1 bg-green-400 border-2 border-black px-3 py-1 font-black text-black text-xs uppercase hover:bg-yellow-400 transition-all"
                              style={{ boxShadow: '2px 2px 0 #000000' }}
                            >
                              <DownloadIcon className="w-3 h-3" />
                              {t('product.download')}
                            </Link>
                          )}
                          
                          <Link
                            href={`/productos/${item.productSlug}`}
                            className="flex items-center gap-1 bg-white border-2 border-black px-3 py-1 font-black text-black text-xs uppercase hover:bg-gray-100 transition-all"
                            style={{ boxShadow: '2px 2px 0 #000000' }}
                          >
                            <ExternalLinkIcon className="w-3 h-3" />
                            {t('product.view')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Timeline */}
            <div 
              className="bg-white border-4 border-black p-6"
              style={{ boxShadow: '6px 6px 0 #000000' }}
            >
              <h3 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                {t('sections.timeline')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-100 border-2 border-black">
                  <div className="w-10 h-10 bg-green-500 border-2 border-black rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-black uppercase">{t('timeline.order_created')}</p>
                    <p className="text-sm text-gray-600 font-bold">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                {order.paidAt && (
                  <div className="flex items-center gap-4 p-4 bg-blue-100 border-2 border-black">
                    <div className="w-10 h-10 bg-blue-500 border-2 border-black rounded-full flex items-center justify-center">
                      <CreditCardIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-black uppercase">{t('timeline.payment_confirmed')}</p>
                      <p className="text-sm text-gray-600 font-bold">{formatDate(order.paidAt)}</p>
                    </div>
                  </div>
                )}

                {order.completedAt && (
                  <div className="flex items-center gap-4 p-4 bg-purple-100 border-2 border-black">
                    <div className="w-10 h-10 bg-purple-500 border-2 border-black rounded-full flex items-center justify-center">
                      <PackageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-black uppercase">{t('timeline.order_completed')}</p>
                      <p className="text-sm text-gray-600 font-bold">{formatDate(order.completedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div 
              className="bg-white border-4 border-black p-6"
              style={{ boxShadow: '6px 6px 0 #000000' }}
            >
              <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                <FileTextIcon className="w-5 h-5" />
                {t('sections.summary')}
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-black font-bold">
                  <span>{t('summary.subtotal')}:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center text-black font-bold">
                  <span>{t('summary.platform_fee')}:</span>
                  <span>{formatPrice(order.platformFee)}</span>
                </div>
                
                <div className="border-t-3 border-black pt-3">
                  <div className="flex justify-between items-center text-black font-black text-xl">
                    <span className="uppercase">{t('summary.total')}:</span>
                    <span className="text-orange-500">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {order.paymentIntentId && (
              <div 
                className="bg-white border-4 border-black p-6"
                style={{ boxShadow: '6px 6px 0 #000000' }}
              >
                <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5" />
                  {t('sections.payment_info')}
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-black text-black uppercase block">{t('payment.payment_id')}:</span>
                    <span className="font-bold text-gray-600 break-all">
                      {order.paymentIntentId}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-black text-black uppercase block">{t('payment.payment_status')}:</span>
                    <span className="font-bold text-gray-600">
                      {order.paymentStatus}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-black text-black uppercase block">{t('payment.method')}:</span>
                    <span className="font-bold text-gray-600">{t('payment.credit_debit_card')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Information */}
            <div 
              className="bg-white border-4 border-black p-6"
              style={{ boxShadow: '6px 6px 0 #000000' }}
            >
              <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                {t('sections.billing_info')}
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-600" />
                  <span className="font-bold text-black">
                    {order.billingAddress.firstName} {order.billingAddress.lastName}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MailIcon className="w-4 h-4 text-gray-600" />
                  <span className="font-bold text-gray-600">
                    {order.billingAddress.email}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-gray-600" />
                  <span className="font-bold text-gray-600">
                    {order.billingAddress.phone}
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPinIcon className="w-4 h-4 text-gray-600 mt-1" />
                  <div className="font-bold text-gray-600">
                    <div>{order.billingAddress.address}</div>
                    <div>{order.billingAddress.city}, {order.billingAddress.country}</div>
                    <div>{order.billingAddress.zipCode}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {(order.status === OrderStatus.COMPLETED || order.status === OrderStatus.PAID) && (
                <Link
                  href="/descargas"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 border-4 border-black font-black text-white text-lg uppercase py-3 hover:bg-yellow-400 hover:text-black transition-all"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  <DownloadIcon className="w-5 h-5" />
                  {t('actions.go_to_downloads')}
                </Link>
              )}
              
              <Link
                href="/productos"
                className="w-full flex items-center justify-center gap-2 bg-blue-400 border-4 border-black font-black text-black text-lg uppercase py-3 hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                <ShoppingCartIcon className="w-5 h-5" />
                {t('actions.continue_shopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}