'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  CreditCard, 
  Download, 
  X, 
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Store,
  Eye
} from 'lucide-react'

// ✅ Importar API real
import { getOrderByNumber, cancelOrder } from '@/lib/orders-api'
import { getDownloadsByOrder } from '@/lib/download-api'
import type { Order } from '@/lib/orders-api'
import type { Download as DownloadType } from '@/lib/download-api'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  
  const [order, setOrder] = useState<Order | null>(null)
  const [downloads, setDownloads] = useState<DownloadType []>([])
  const [loading, setLoading] = useState(true)
  const [downloadsLoading, setDownloadsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const orderNumber = params.orderNumber as string

  useEffect(() => {
    if (!orderNumber) return

    const fetchOrderData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔍 [ORDER-DETAIL] Fetching order:', orderNumber)
        
        const orderData = await getOrderByNumber(orderNumber)
        
        if (!orderData) {
          setError('Pedido no encontrado')
          return
        }
        
        setOrder(orderData)
        
        // Si el pedido está pagado, cargar descargas
        if (orderData.status === 'PAID' || orderData.status === 'COMPLETED') {
          setDownloadsLoading(true)
          try {
            const downloadsData = await getDownloadsByOrder(orderNumber)
            setDownloads(downloadsData)
          } catch (downloadsError) {
            console.error('Error loading downloads:', downloadsError)
          } finally {
            setDownloadsLoading(false)
          }
        }
        
      } catch (err) {
        console.error('Error fetching order:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderData()
  }, [orderNumber])

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'PENDING') return
    
    const confirmed = window.confirm('¿Estás seguro de que quieres cancelar este pedido?')
    if (!confirmed) return
    
    setCancelLoading(true)
    try {
      const result = await cancelOrder(orderNumber, 'Cancelado por el usuario')
      
      if (result.success) {
        setOrder(prev => prev ? { ...prev, status: 'CANCELLED' as const } : null)
      } else {
        alert(result.error || 'Error al cancelar el pedido')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Error al cancelar el pedido')
    } finally {
      setCancelLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-black font-black text-xl uppercase">Cargando pedido...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div 
            className="bg-white border-[5px] border-black p-12 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '8px 8px 0 #000000' }}
          >
            <div className="text-8xl mb-6">⚠️</div>
            <h2 className="text-black font-black text-3xl mb-4 uppercase">
              Error
            </h2>
            <p className="text-black font-medium text-lg mb-6">{error}</p>
            <Link
              href="/pedidos"
              className="bg-orange-500 border-4 border-black text-black font-black py-3 px-6 uppercase hover:bg-yellow-400 transition-all inline-block"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              Volver a pedidos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div 
            className="bg-white border-[5px] border-black p-12 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '8px 8px 0 #000000' }}
          >
            <div className="text-8xl mb-6">📦</div>
            <h2 className="text-black font-black text-3xl mb-4 uppercase">
              Pedido no encontrado
            </h2>
            <p className="text-black font-medium text-lg mb-6">
              El pedido #{orderNumber} no existe o no tienes permisos para verlo.
            </p>
            <Link
              href="/pedidos"
              className="bg-orange-500 border-4 border-black text-black font-black py-3 px-6 uppercase hover:bg-yellow-400 transition-all inline-block"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              Volver a pedidos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-400 text-black border-4 border-black'
      case 'PROCESSING':
        return 'bg-blue-400 text-black border-4 border-black'
      case 'PAID':
        return 'bg-green-400 text-black border-4 border-black'
      case 'COMPLETED':
        return 'bg-green-500 text-black border-4 border-black'
      case 'CANCELLED':
        return 'bg-red-400 text-black border-4 border-black'
      case 'REFUNDED':
        return 'bg-purple-400 text-black border-4 border-black'
      case 'DISPUTED':
        return 'bg-orange-600 text-white border-4 border-black'
      default:
        return 'bg-gray-400 text-black border-4 border-black'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5" />
      case 'PROCESSING':
        return <Package className="w-5 h-5" />
      case 'PAID':
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5" />
      case 'CANCELLED':
      case 'REFUNDED':
        return <X className="w-5 h-5" />
      case 'DISPUTED':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Package className="w-5 h-5" />
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-yellow-400 border-b-4 border-black p-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 text-black font-black text-sm uppercase">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/pedidos" className="hover:text-orange-500 transition-colors">
              Pedidos
            </Link>
            <span>/</span>
            <span className="text-orange-500 truncate">#{order.orderNumber}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Botón volver */}
        <div className="mb-6">
          <Link 
            href="/pedidos"
            className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a pedidos
          </Link>
        </div>

        {/* Header del pedido */}
        <div 
          className="bg-gradient-to-br from-blue-200 to-cyan-200 border-[5px] border-black p-8 mb-8 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-black uppercase mb-2">
                Pedido #{order.orderNumber}
              </h1>
              <div className="flex items-center gap-2 text-black font-bold">
                <Calendar className="w-5 h-5" />
                <span>Creado el {formatDate(order.createdAt)}</span>
              </div>
              {order.paidAt && (
                <div className="flex items-center gap-2 text-black font-bold mt-1">
                  <CreditCard className="w-5 h-5" />
                  <span>Pagado el {formatDate(order.paidAt)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <span 
                className={`px-4 py-2 font-black text-sm uppercase flex items-center gap-2 ${getStatusBadge(order.status)}`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                {getStatusIcon(order.status)}
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Resumen del pedido */}
        <div 
          className="bg-white border-[5px] border-black p-8 mb-8 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          <h2 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-500" />
            Resumen del pedido
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-yellow-400 border-3 border-black" style={{ boxShadow: '3px 3px 0 #000000' }}>
              <div className="text-2xl font-black text-black mb-1">{order.items.length}</div>
              <div className="text-sm font-black text-black uppercase">Productos</div>
            </div>
            <div className="text-center p-4 bg-green-400 border-3 border-black" style={{ boxShadow: '3px 3px 0 #000000' }}>
              <div className="text-2xl font-black text-black mb-1">{formatPrice(order.subtotal)}</div>
              <div className="text-sm font-black text-black uppercase">Subtotal</div>
            </div>
            <div className="text-center p-4 bg-orange-400 border-3 border-black" style={{ boxShadow: '3px 3px 0 #000000' }}>
              <div className="text-2xl font-black text-black mb-1">{formatPrice(order.totalAmount)}</div>
              <div className="text-sm font-black text-black uppercase">Total</div>
            </div>
          </div>

          {/* Desglose de costos */}
          <div className="mt-6 bg-gray-100 border-3 border-black p-4" style={{ boxShadow: '3px 3px 0 #000000' }}>
            <h3 className="font-black text-black uppercase mb-3">Desglose de costos</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-black">Subtotal:</span>
                <span className="font-bold text-black">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-black">Comisión plataforma ({(order.platformFeeRate * 100).toFixed(0)}%):</span>
                <span className="font-bold text-black">{formatPrice(order.platformFee)}</span>
              </div>
              <div className="border-t-2 border-black pt-2 flex justify-between items-center">
                <span className="font-black text-black uppercase">Total:</span>
                <span className="font-black text-black text-xl">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Productos del pedido */}
        <div 
          className="bg-white border-[5px] border-black p-8 mb-8 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          <h2 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            Productos ({order.items.length})
          </h2>
          
          <div className="space-y-4">
            {order.items.map((item) => (
              <div 
                key={item.id} 
                className="bg-gray-50 border-3 border-black p-6 hover:bg-yellow-50 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <Link 
                      href={`/productos/${item.productSlug}`}
                      className="text-xl font-black text-black uppercase hover:text-orange-500 transition-colors block mb-2"
                    >
                      {item.productTitle}
                    </Link>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Store className="w-4 h-4 text-gray-600" />
                        <span className="font-bold text-gray-700">Vendedor: {item.sellerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-600" />
                        <span className="font-bold text-gray-700">Cantidad: {item.quantity}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-black text-green-600 mb-1">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="text-sm font-bold text-gray-600">
                      {formatPrice(item.price)} c/u
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Información del comprador */}
        <div 
          className="bg-white border-[5px] border-black p-8 mb-8 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          <h2 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-3">
            <User className="w-8 h-8 text-purple-500" />
            Información del comprador
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-black text-black uppercase mb-2">Datos personales</h3>
              <p className="font-bold text-black">{order.buyer.firstName} {order.buyer.lastName}</p>
              <p className="font-medium text-gray-700">{order.buyer.email}</p>
            </div>
            
            {order.billingData && (
              <div>
                <h3 className="font-black text-black uppercase mb-2">Datos de facturación</h3>
                <div className="text-sm font-medium text-gray-700">
                  {/* Renderizar datos de facturación si existen */}
                  <pre className="bg-gray-100 p-2 rounded text-xs">
                    {JSON.stringify(order.billingData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Descargas disponibles */}
        {(order.status === 'PAID' || order.status === 'COMPLETED') && (
          <div 
            className="bg-white border-[5px] border-black p-8 mb-8 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '8px 8px 0 #000000' }}
          >
            <h2 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-3">
              <Download className="w-8 h-8 text-green-500" />
              Descargas disponibles
            </h2>
            
            {downloadsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
                <p className="font-bold text-gray-600">Cargando descargas...</p>
              </div>
            ) : downloads.length > 0 ? (
              <div className="space-y-4">
                {downloads.map((download) => (
                  <div 
                    key={download.id}
                    className="bg-green-50 border-3 border-black p-6"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-black uppercase mb-1">
                          {download.product.title}
                        </h3>
                        <p className="text-sm font-bold text-gray-700 mb-2">
                          Descargas restantes: {download.maxDownloads - download.downloadCount} de {download.maxDownloads}
                        </p>
                        <p className="text-xs font-medium text-gray-600">
                          Válido hasta: {formatDate(download.expiresAt)}
                        </p>
                      </div>
                      
                      <Link
                        href={`/descargas`}
                        className="bg-green-500 border-3 border-black text-black font-black py-2 px-4 uppercase hover:bg-green-600 transition-all flex items-center gap-2"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📁</div>
                <p className="font-bold text-gray-600">No hay descargas disponibles para este pedido</p>
              </div>
            )}
          </div>
        )}

        {/* Acciones del pedido */}
        <div className="flex flex-wrap gap-4">
          {order.status === 'PENDING' && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelLoading}
              className="bg-red-500 border-4 border-black text-black font-black py-3 px-6 uppercase hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              {cancelLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Cancelando...
                </>
              ) : (
                <>
                  <X className="w-5 h-5" />
                  Cancelar pedido
                </>
              )}
            </button>
          )}

          {(order.status === 'PAID' || order.status === 'COMPLETED') && (
            <Link
              href="/descargas"
              className="bg-blue-500 border-4 border-black text-black font-black py-3 px-6 uppercase hover:bg-blue-600 transition-all flex items-center gap-2"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <Download className="w-5 h-5" />
              Ver todas las descargas
            </Link>
          )}

          <Link
            href={`/productos/${order.items[0]?.productSlug}`}
            className="bg-orange-500 border-4 border-black text-black font-black py-3 px-6 uppercase hover:bg-yellow-400 transition-all flex items-center gap-2"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <Eye className="w-5 h-5" />
            Ver producto
          </Link>
        </div>
      </div>
    </div>
  )
}