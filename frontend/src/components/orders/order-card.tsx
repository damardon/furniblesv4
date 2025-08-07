'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { 
  CalendarIcon, 
  CreditCardIcon, 
  DownloadIcon, 
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  AlertCircleIcon
} from 'lucide-react'
import { Order, OrderStatus } from '@/types'

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  const t = useTranslations('orders.card')
  const tCommon = useTranslations('common')
  const [isExpanded, setIsExpanded] = useState(false)

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

  const getStatusBadge = (status: OrderStatus) => {
    // Configuración tipada explícita para evitar error de tipo 'any'
    const statusConfig: Record<OrderStatus, {
      bg: string
      text: string
      icon: typeof ClockIcon
      label: string
    }> = {
      [OrderStatus.PENDING]: {
        bg: 'bg-yellow-400',
        text: 'text-black',
        icon: ClockIcon,
        label: t('status.pending')
      },
      [OrderStatus.PROCESSING]: {
        bg: 'bg-blue-400',
        text: 'text-black', 
        icon: AlertCircleIcon,
        label: t('status.processing')
      },
      [OrderStatus.PAID]: {
        bg: 'bg-green-400',
        text: 'text-black',
        icon: CheckCircleIcon,
        label: t('status.paid')
      },
      [OrderStatus.COMPLETED]: {
        bg: 'bg-green-600',
        text: 'text-white',
        icon: CheckCircleIcon,
        label: t('status.completed')
      },
      [OrderStatus.CANCELLED]: {
        bg: 'bg-red-500',
        text: 'text-white',
        icon: XCircleIcon,
        label: t('status.cancelled')
      },
      [OrderStatus.REFUNDED]: {
        bg: 'bg-gray-400',
        text: 'text-black',
        icon: XCircleIcon,
        label: t('status.refunded')
      },
      [OrderStatus.DISPUTED]: {
        bg: 'bg-orange-500',
        text: 'text-white',
        icon: AlertCircleIcon,
        label: t('status.disputed')
      }
    }

    const config = statusConfig[status]
    const StatusIcon = config.icon

    return (
      <span 
        className={`${config.bg} ${config.text} px-3 py-1 border-2 border-black font-black text-xs uppercase flex items-center gap-1`}
        style={{ boxShadow: '2px 2px 0 #000000' }}
      >
        <StatusIcon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const canDownload = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.PAID

  return (
    <div 
      className="bg-white border-[5px] border-black p-6 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
      style={{ boxShadow: '8px 8px 0 #000000' }}
    >
      {/* Header de la orden */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="font-black text-black text-lg uppercase">
            {t('order_title', { orderNumber: order.orderNumber })}
          </h3>
          {getStatusBadge(order.status)}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="font-black text-black text-xl">
            {formatPrice(order.totalAmount)}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4 text-black" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* Info básica */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="w-4 h-4 text-gray-600" />
          <span className="font-bold text-black">
            {formatDate(order.createdAt)}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <CreditCardIcon className="w-4 h-4 text-gray-600" />
          <span className="font-bold text-black">
            {t('product_count', { 
              count: order.items?.length,
              text: order.items?.length === 1 ? t('product_singular') : t('product_plural')
            })}
          </span>
        </div>

        {order.paidAt && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircleIcon className="w-4 h-4 text-green-600" />
            <span className="font-bold text-black">
              {t('paid_at', { date: formatDate(order.paidAt) })}
            </span>
          </div>
        )}
      </div>

      {/* Productos (preview) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {order.items?.slice(0, 4).map((item) => (
          <div 
            key={item.id}
            className="relative aspect-square border-2 border-black overflow-hidden group"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <Image
              src={item.product?.imageFileIds[0] || '/placeholder-product.jpg'}
              alt={item.productTitle}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            {item.quantity > 1 && (
              <span 
                className="absolute top-1 right-1 bg-orange-500 text-black text-xs font-black px-1 py-0.5 border border-black"
                style={{ boxShadow: '1px 1px 0 #000000' }}
              >
                x{item.quantity}
              </span>
            )}
          </div>
        ))}
        
        {(order.items?.length || 0) > 4 && (
          <div 
            className="aspect-square border-2 border-black flex items-center justify-center bg-gray-100"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <span className="font-black text-black text-sm">
              +{(order.items?.length || 0) - 4}
            </span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/pedidos/${order.id}`}
          className="bg-white border-3 border-black font-black text-black text-sm uppercase px-4 py-2 hover:bg-yellow-400 transition-all flex items-center gap-2"
          style={{ boxShadow: '3px 3px 0 #000000' }}
        >
          <EyeIcon className="w-4 h-4" />
          {t('actions.view_details')}
        </Link>

        {canDownload && (
          <button
            className="bg-green-400 border-3 border-black font-black text-black text-sm uppercase px-4 py-2 hover:bg-green-500 transition-all flex items-center gap-2"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <DownloadIcon className="w-4 h-4" />
            {t('actions.download')}
          </button>
        )}

        {order.status === OrderStatus.COMPLETED && (
          <Link
            href={`/pedidos/${order.id}/reviews`}
            className="bg-yellow-400 border-3 border-black font-black text-black text-sm uppercase px-4 py-2 hover:bg-orange-500 transition-all"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            {t('actions.write_review')}
          </Link>
        )}
      </div>

      {/* Detalles expandidos */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t-2 border-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lista de productos */}
            <div>
              <h4 className="font-black text-black text-lg uppercase mb-3">
                {t('expanded.products_title')}
              </h4>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-3 border-2 border-black"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <div className="relative w-12 h-12 border border-black overflow-hidden">
                      <Image
                        src={item.product?.imageFileIds[0] || '/placeholder-product.jpg'}
                        alt={item.productTitle}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-black text-xs uppercase line-clamp-1">
                        {item.productTitle}
                      </p>
                      <p className="text-xs text-gray-600 font-bold">
                        {t('expanded.quantity_price', { 
                          quantity: item.quantity,
                          price: formatPrice(item.price)
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de costos */}
            <div>
              <h4 className="font-black text-black text-lg uppercase mb-3">
                {t('expanded.summary_title')}
              </h4>
              <div 
                className="p-4 border-2 border-black bg-gray-50"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold text-black">{t('expanded.subtotal')}:</span>
                    <span className="font-black text-black">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-black">{t('expanded.platform_fee')}:</span>
                    <span className="font-bold text-black">{formatPrice(order.platformFee)}</span>
                  </div>
                  <div className="h-[1px] bg-black my-2"></div>
                  <div className="flex justify-between">
                    <span className="font-black text-black uppercase">{t('expanded.total')}:</span>
                    <span className="font-black text-orange-500 text-lg">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}