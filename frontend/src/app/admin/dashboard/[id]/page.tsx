'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Check,
  X,
  Eye,
  Download,
  Star,
  Calendar,
  User,
  Package,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  AlertTriangle,
  Clock,
  Flag,
  Shield,
  Edit,
  Trash2,
  RefreshCw,
  DollarSign,
  Tag,
  Ruler,
  Timer,
  Wrench,
  Layers
} from 'lucide-react'

// Stores
import { useAdminStore } from '@/lib/stores/admin-store'
import { Product, ProductStatus, ProductCategory, Difficulty } from '@/types'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'

interface AdminProductDetailProps {
  params: {
    id: string
  }
}

// ✅ HELPER FUNCTIONS para manejar JSON strings del schema Prisma
const parseJsonField = (jsonString: string): any[] => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return [];
  }
};

export default function AdminProductDetail({ params }: AdminProductDetailProps) {
  const { id } = params
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'suspend' | null>(null)
  const [moderationReason, setModerationReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [showModerationModal, setShowModerationModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  
  // Traducciones
  const t = useTranslations('admin.products.detail')
  const tCommon = useTranslations('common')
  const tStatus = useTranslations('admin.products.status')
  const tCategories = useTranslations('admin.products.categories')

  // Store
  const { 
    updateProductStatus,
    featureProduct,
    isLoading: storeLoading,
    error: storeError
  } = useAdminStore()

  // ✅ MIGRACIÓN: Cargar producto desde API real
  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await fetch(`/api/admin/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found')
          }
          if (response.status === 401) {
            throw new Error('Unauthorized access')
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.success && data.product) {
          setProduct(data.product)
        } else {
          throw new Error(data.message || 'Failed to load product')
        }
      } catch (error) {
        console.error('Error loading product:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
        setProduct(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [id])

  // Manejar moderación
  const handleModeration = async () => {
    if (!product || !moderationAction) return

    setIsLoading(true)
    try {
      let result
      let newStatus: ProductStatus

      switch (moderationAction) {
        case 'approve':
          newStatus = ProductStatus.APPROVED
          break
        case 'reject':
          newStatus = ProductStatus.REJECTED
          break
        case 'suspend':
          newStatus = ProductStatus.SUSPENDED
          break
        default:
          throw new Error('Invalid moderation action')
      }

      result = await updateProductStatus(product.id, newStatus, moderationReason || undefined)

      if (result.success) {
        setModerationAction(null)
        setModerationReason('')
        setShowModerationModal(false)
        
        // Actualizar el producto local
        setProduct(prev => {
          if (!prev) return null
          return {
            ...prev,
            status: newStatus,
            moderatedAt: new Date().toISOString(),
            rejectionReason: moderationAction === 'reject' ? moderationReason : undefined
          }
        })

        // Redirigir después de la acción
        setTimeout(() => {
          router.push('/admin/dashboard/productos')
        }, 2000)
      }
    } catch (error) {
      console.error('Error in moderation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar destacar producto
  const handleFeatureProduct = async (featured: boolean) => {
    if (!product) return

    try {
      await featureProduct(product.id, featured)
      setProduct(prev => prev ? { ...prev, featured } : null)
    } catch (error) {
      console.error('Error featuring product:', error)
    }
  }

  // Abrir modal de moderación
  const openModerationModal = (action: 'approve' | 'reject' | 'suspend') => {
    setModerationAction(action)
    setModerationReason('')
    setShowModerationModal(true)
  }

  // Obtener badge de estado
  const getStatusBadge = (status: ProductStatus) => {
    const badges = {
      [ProductStatus.PENDING]: { 
        className: "bg-yellow-400 text-black border-2 border-black", 
        text: tStatus('pending')
      },
      [ProductStatus.APPROVED]: { 
        className: "bg-green-500 text-white border-2 border-black", 
        text: tStatus('approved')
      },
      [ProductStatus.REJECTED]: { 
        className: "bg-red-500 text-white border-2 border-black", 
        text: tStatus('rejected')
      },
      [ProductStatus.SUSPENDED]: { 
        className: "bg-orange-500 text-white border-2 border-black", 
        text: tStatus('suspended')
      },
      [ProductStatus.DRAFT]: { 
        className: "border-2 border-black", 
        text: tStatus('draft')
      }
    }

    const config = badges[status] || badges[ProductStatus.DRAFT]
    
    return (
      <Badge className={config.className}>
        {config.text}
      </Badge>
    )
  }

  // ✅ HELPER: Convertir campos JSON para mostrar en UI
  const productTags = parseJsonField(product?.tags || '[]');
  const productToolsRequired = parseJsonField(product?.toolsRequired || '[]');
  const productMaterials = parseJsonField(product?.materials || '[]');
  const productImages = parseJsonField(product?.imageFileIds || '[]');

  // ✅ HELPER: Obtener información del seller
  const getSellerInfo = () => {
    if (!product?.seller) return null;
    
    return {
      id: product.seller.id,
      name: `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim(),
      email: product.seller.email,
      storeName: product.seller.sellerProfile?.storeName || 'Unknown Store',
      rating: product.seller.sellerProfile?.rating || 0,
      totalSales: product.seller.sellerProfile?.totalSales || 0,
      isVerified: product.seller.sellerProfile?.isVerified || false
    };
  };

  const sellerInfo = getSellerInfo();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="h-16 w-16 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-2 border-black"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>
        </div>
        
        <Card className="border-3 border-red-500" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-black text-red-600 mb-2">
              {error === 'Product not found' ? t('not_found') : t('error_loading')}
            </h3>
            <p className="text-gray-500 mb-4">
              {error === 'Product not found' ? t('not_found_desc') : error}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-black"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-2 border-black"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>
          
          <div>
            <h1 className="text-2xl font-black uppercase text-black">{t('title')}</h1>
            <p className="text-gray-600 font-bold">{t('product_id')}: {product.id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/productos/${product.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white border-2 border-black font-bold hover:bg-blue-600 transition-all"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <ExternalLink className="h-4 w-4" />
            {t('view_on_site')}
          </Link>
        </div>
      </div>

      {/* Estado y acciones principales */}
      <Card className={`border-3 ${
        product.status === ProductStatus.PENDING ? 'border-yellow-500' :
        product.status === ProductStatus.APPROVED ? 'border-green-500' :
        product.status === ProductStatus.REJECTED ? 'border-red-500' :
        'border-gray-500'
      }`} style={{ boxShadow: '5px 5px 0 #000000' }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 border-2 border-black">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="font-black text-xl">{t('moderation_status')}</CardTitle>
                <CardDescription className="font-bold">
                  {t('created_days_ago', { 
                    days: Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
                  })}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusBadge(product.status)}
              {product.featured && (
                <Badge className="bg-yellow-400 text-black border-2 border-black">
                  ⭐ {t('featured')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {product.status === ProductStatus.PENDING && (
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => openModerationModal('approve')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white border-2 border-black font-black"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <Check className="h-4 w-4 mr-2" />
                {t('approve_product')}
              </Button>
              <Button
                onClick={() => openModerationModal('reject')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white border-2 border-black font-black"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <X className="h-4 w-4 mr-2" />
                {t('reject_product')}
              </Button>
              <Button
                onClick={() => openModerationModal('suspend')}
                variant="outline"
                className="border-2 border-black font-bold"
              >
                <Flag className="h-4 w-4 mr-2" />
                {t('suspend')}
              </Button>
            </div>
          </CardContent>
        )}

        {product.status === ProductStatus.REJECTED && product.rejectionReason && (
          <CardContent>
            <div className="p-4 bg-red-50 border-2 border-red-200">
              <h4 className="font-black text-red-800 mb-2">{t('rejection_reason')}:</h4>
              <p className="text-red-700 font-bold">{product.rejectionReason}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Información del producto */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal - Información básica */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información básica */}
          <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-black">
                <Package className="h-5 w-5" />
                {t('product_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-black mb-2">{product.title}</h2>
                <p className="text-gray-700 font-medium leading-relaxed">{product.description}</p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">{t('price')}</p>
                    <p className="font-black text-green-600">${product.price}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">{t('category')}</p>
                    <p className="font-bold">{tCategories(product.category.toLowerCase())}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">{t('difficulty')}</p>
                    <p className="font-bold">{product.difficulty}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">{t('time')}</p>
                    <p className="font-bold">{product.estimatedTime}</p>
                  </div>
                </div>
              </div>

              {product.dimensions && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-600">{t('dimensions')}:</p>
                    <p className="font-bold">{product.dimensions}</p>
                  </div>
                </div>
              )}

              {/* ✅ CORREGIDO: Usar productTags parseado */}
              {productTags && productTags.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-2">{t('tags')}:</p>
                  <div className="flex flex-wrap gap-2">
                    {productTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="border-black">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Herramientas y materiales */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* ✅ CORREGIDO: Herramientas */}
            <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-black">
                  <Wrench className="h-5 w-5" />
                  {t('required_tools')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {productToolsRequired.map((tool, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span className="font-medium">{tool}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* ✅ CORREGIDO: Materiales */}
            <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-black">
                  <Layers className="h-5 w-5" />
                  {t('required_materials')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {productMaterials.map((material, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="font-medium">{material}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Especificaciones adicionales */}
          {product.specifications && (
            <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-black">
                  <FileText className="h-5 w-5" />
                  {t('additional_specs')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-bold text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna lateral - Estadísticas y archivos */}
        <div className="space-y-6">
          {/* Estadísticas */}
          <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-black">
                <Eye className="h-5 w-5" />
                {t('statistics')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-gray-600">
                    <Eye className="h-4 w-4" />
                    {t('views')}
                  </span>
                  <span className="font-black">{product.viewCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-gray-600">
                    <Download className="h-4 w-4" />
                    {t('downloads')}
                  </span>
                  <span className="font-black">{product.downloadCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-gray-600">
                    <Star className="h-4 w-4" />
                    {t('rating')}
                  </span>
                  <span className="font-black">{product.rating} ({product.reviewCount})</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {t('created')}
                  </span>
                  <span className="font-bold text-sm">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ✅ MEJORADO: Información del vendedor con datos reales */}
          <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-black">
                <User className="h-5 w-5" />
                {t('seller')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                {sellerInfo && (
                  <>
                    <p className="font-black text-lg">{sellerInfo.name}</p>
                    <p className="text-sm text-gray-600 mb-1">{sellerInfo.email}</p>
                    <p className="text-sm font-bold text-blue-600 mb-2">{sellerInfo.storeName}</p>
                    
                    <div className="flex justify-center gap-4 text-xs mb-3">
                      <div className="text-center">
                        <p className="font-bold">{sellerInfo.rating.toFixed(1)}</p>
                        <p className="text-gray-500">Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{sellerInfo.totalSales}</p>
                        <p className="text-gray-500">Sales</p>
                      </div>
                    </div>
                    
                    {sellerInfo.isVerified && (
                      <Badge className="bg-green-100 text-green-800 mb-3">
                        ✓ Verified
                      </Badge>
                    )}
                  </>
                )}
                
                <div className="mt-3">
                  <Link
                    href={`/admin/dashboard/usuarios?search=${product.sellerId}`}
                    className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                  >
                    {t('view_full_profile')} →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Archivos */}
          <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-black">
                <FileText className="h-5 w-5" />
                {t('files')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.pdfFileId && (
                <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200">
                  <span className="flex items-center gap-2 font-bold">
                    <FileText className="h-4 w-4 text-red-600" />
                    {t('main_pdf')}
                  </span>
                  <Button size="sm" variant="outline" className="border-black">
                    {t('view')}
                  </Button>
                </div>
              )}
              
              {/* ✅ CORREGIDO: Usar productImages parseado */}
              {productImages && productImages.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200">
                  <span className="flex items-center gap-2 font-bold">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    {t('images')} ({productImages.length})
                  </span>
                  <Button size="sm" variant="outline" className="border-black">
                    {t('view')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones adicionales */}
          {product.status === ProductStatus.APPROVED && (
            <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-black">
                  <Edit className="h-5 w-5" />
                  {t('actions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleFeatureProduct(!product.featured)}
                  variant="outline"
                  className="w-full border-2 border-black font-bold"
                >
                  {product.featured ? t('remove_featured') : t('make_featured')}
                </Button>
                
                <Button
                  onClick={() => openModerationModal('suspend')}
                  variant="outline"
                  className="w-full border-2 border-black font-bold text-orange-600"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {t('suspend_product')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de moderación */}
      <Modal
        isOpen={showModerationModal}
        onClose={() => {
          setShowModerationModal(false)
          setModerationAction(null)
          setModerationReason('')
        }}
        title={
          moderationAction === 'approve' ? t('modals.approve_title') :
          moderationAction === 'reject' ? t('modals.reject_title') :
          moderationAction === 'suspend' ? t('modals.suspend_title') :
          t('modals.moderation_title')
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded">
            <h3 className="font-black text-lg mb-2">{product.title}</h3>
            <p className="text-gray-600 text-sm">{product.description.slice(0, 100)}...</p>
          </div>

          {moderationAction === 'approve' ? (
            <div>
              <label className="block text-sm font-bold mb-2">
                {t('modals.approval_comment')}
              </label>
              <Textarea
                placeholder={t('modals.approval_placeholder')}
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                className="border-2 border-black"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('modals.internal_note')}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold mb-2">
                {t('modals.reason_label')} *
              </label>
              <Textarea
                placeholder={
                  moderationAction === 'reject' 
                    ? t('modals.reject_placeholder')
                    : t('modals.suspend_placeholder')
                }
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                className="border-2 border-black"
               rows={4}
               required
             />
             <p className="text-xs text-gray-500 mt-1">
               {t('modals.required_field')}
             </p>
           </div>
         )}

         <div className="flex justify-end gap-3 pt-4 border-t">
           <Button 
             variant="outline" 
             onClick={() => {
               setShowModerationModal(false)
               setModerationAction(null)
               setModerationReason('')
             }}
             className="border-2 border-black"
             disabled={isLoading}
           >
             {tCommon('cancel')}
           </Button>
           <Button
             onClick={handleModeration}
             disabled={isLoading || (moderationAction !== 'approve' && !moderationReason.trim())}
             className={`border-2 border-black font-black ${
               moderationAction === 'approve' 
                 ? 'bg-green-500 hover:bg-green-600' 
                 : 'bg-red-500 hover:bg-red-600'
             } text-white`}
             style={{ boxShadow: '3px 3px 0 #000000' }}
           >
             {isLoading ? (
               <>
                 <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                 {t('modals.processing')}
               </>
             ) : (
               <>
                 {moderationAction === 'approve' ? (
                   <Check className="h-4 w-4 mr-2" />
                 ) : (
                   <X className="h-4 w-4 mr-2" />
                 )}
                 {moderationAction === 'approve' ? t('modals.approve_button') : 
                  moderationAction === 'reject' ? t('modals.reject_button') : 
                  t('modals.suspend_button')}
               </>
             )}
           </Button>
         </div>
       </div>
     </Modal>
   </div>
 )
}