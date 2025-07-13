'use client'

import { useEffect, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface AdminProductDetailProps {
  params: {
    id: string
  }
}

export default function AdminProductDetail({ params }: AdminProductDetailProps) {
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'suspend' | null>(null)
  const [moderationReason, setModerationReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  
  const router = useRouter()
  const t = useTranslations('admin')

  // Store
  const { 
    approveProduct,
    rejectProduct,
    suspendProduct,
    featureProduct,
    isLoading: storeLoading,
    error
  } = useAdminStore()

  // Cargar producto específico
  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      try {
        // Mock data realista basado en el schema Prisma
        const mockProduct: Product = {
          id: params.id,
          title: "Mesa de Comedor Rústica Premium",
          description: "Una hermosa mesa de comedor hecha de madera maciza de roble con acabado rústico artesanal. Diseño perfecto para reuniones familiares, con capacidad para 6-8 personas. Incluye planos detallados, lista de materiales y guía paso a paso.",
          slug: "mesa-comedor-rustica-premium",
          price: 89.99,
          category: ProductCategory.TABLES,
          difficulty: Difficulty.INTERMEDIATE,
          status: ProductStatus.PENDING,
          pdfFileId: "file_pdf_12345",
          imageFileIds: ["img_001", "img_002", "img_003", "img_004"],
          thumbnailFileIds: ["thumb_001"],
          tags: ["mesa", "comedor", "rustico", "madera", "roble", "familiar"],
          estimatedTime: "6-8 horas",
          toolsRequired: [
            "Sierra circular",
            "Taladro eléctrico",
            "Lijadora orbital",
            "Fresadora",
            "Prensas",
            "Escuadra",
            "Metro"
          ],
          materials: [
            "Tablón de roble 200x90x4cm",
            "Listones de roble 8x8cm",
            "Tornillos de madera 6x80mm",
            "Cola blanca para madera",
            "Barniz poliuretano",
            "Lija grano 120, 220, 320"
          ],
          dimensions: "180cm L x 90cm W x 75cm H",
          specifications: {
            weight: "Aproximadamente 35kg",
            finish: "Barniz poliuretano satinado",
            assembly: "Requiere ensamblaje completo",
            skill_level: "Intermedio - Se requiere experiencia básica",
            tools_included: false,
            materials_included: false
          },
          moderatedBy: null,
          moderatedAt: null,
          rejectionReason: null,
          sellerId: "seller_abc123",
          viewCount: 342,
          downloadCount: 67,
          favoriteCount: 28,
          featured: false,
          rating: 4.7,
          reviewCount: 15,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 días atrás
          publishedAt: null,
          updatedAt: new Date(Date.now() - 3600000).toISOString() // 1 hora atrás
        }
        
        setProduct(mockProduct)
      } catch (error) {
        console.error('Error loading product:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [params.id])

  // Manejar moderación
  const handleModeration = async () => {
    if (!product || !moderationAction) return

    setIsLoading(true)
    try {
      let result
      switch (moderationAction) {
        case 'approve':
          result = await approveProduct(product.id, moderationReason || undefined)
          break
        case 'reject':
          result = await rejectProduct(product.id, moderationReason)
          break
        case 'suspend':
          result = await suspendProduct(product.id, moderationReason)
          break
      }

      if (result.success) {
        setModerationAction(null)
        setModerationReason('')
        
        // Actualizar el producto local
        setProduct(prev => {
          if (!prev) return null
          return {
            ...prev,
            status: moderationAction === 'approve' ? ProductStatus.APPROVED :
                   moderationAction === 'reject' ? ProductStatus.REJECTED :
                   ProductStatus.SUSPENDED,
            moderatedAt: new Date().toISOString(),
            rejectionReason: moderationAction === 'reject' ? moderationReason : null
          }
        })

        // Redirigir después de la acción
        setTimeout(() => {
          router.push('/admin/productos')
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

  // Obtener badge de estado
  const getStatusBadge = (status: ProductStatus) => {
    const badges = {
      [ProductStatus.PENDING]: { 
        variant: "secondary" as const, 
        className: "bg-yellow-400 text-black border-2 border-black", 
        text: "PENDIENTE" 
      },
      [ProductStatus.APPROVED]: { 
        variant: "secondary" as const, 
        className: "bg-green-500 text-white border-2 border-black", 
        text: "APROBADO" 
      },
      [ProductStatus.REJECTED]: { 
        variant: "destructive" as const, 
        className: "bg-red-500 text-white border-2 border-black", 
        text: "RECHAZADO" 
      },
      [ProductStatus.SUSPENDED]: { 
        variant: "secondary" as const, 
        className: "bg-orange-500 text-white border-2 border-black", 
        text: "SUSPENDIDO" 
      },
      [ProductStatus.DRAFT]: { 
        variant: "outline" as const, 
        className: "border-2 border-black", 
        text: "BORRADOR" 
      }
    }

    const config = badges[status] || badges[ProductStatus.DRAFT]
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="h-16 w-16 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-600">Cargando producto...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-2 border-black"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        
        <Card className="border-3 border-red-500" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-black text-red-600 mb-2">Producto no encontrado</h3>
            <p className="text-gray-500">El producto solicitado no existe o no tienes permisos para verlo.</p>
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
            VOLVER
          </Button>
          
          <div>
            <h1 className="text-2xl font-black uppercase text-black">Moderación de Producto</h1>
            <p className="text-gray-600 font-bold">ID: {product.id}</p>
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
            VER EN SITIO
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
                <CardTitle className="font-black text-xl">Estado de Moderación</CardTitle>
                <CardDescription className="font-bold">
                  Creado hace {Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24))} días
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusBadge(product.status)}
              {product.featured && (
                <Badge className="bg-yellow-400 text-black border-2 border-black">
                  ⭐ DESTACADO
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {product.status === ProductStatus.PENDING && (
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setModerationAction('approve')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white border-2 border-black font-black"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <Check className="h-4 w-4 mr-2" />
                APROBAR PRODUCTO
              </Button>
              <Button
                onClick={() => setModerationAction('reject')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white border-2 border-black font-black"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <X className="h-4 w-4 mr-2" />
                RECHAZAR PRODUCTO
              </Button>
              <Button
                onClick={() => setModerationAction('suspend')}
                variant="outline"
                className="border-2 border-black font-bold"
              >
                <Flag className="h-4 w-4 mr-2" />
                SUSPENDER
              </Button>
            </div>
          </CardContent>
        )}

        {product.status === ProductStatus.REJECTED && product.rejectionReason && (
          <CardContent>
            <div className="p-4 bg-red-50 border-2 border-red-200">
              <h4 className="font-black text-red-800 mb-2">Razón de rechazo:</h4>
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
                INFORMACIÓN DEL PRODUCTO
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
                    <p className="text-xs font-bold text-gray-600 uppercase">Precio</p>
                    <p className="font-black text-green-600">${product.price}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">Categoría</p>
                    <p className="font-bold">{product.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">Dificultad</p>
                    <p className="font-bold">{product.difficulty}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">Tiempo</p>
                    <p className="font-bold">{product.estimatedTime}</p>
                  </div>
                </div>
              </div>

              {product.dimensions && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-600">Dimensiones:</p>
                    <p className="font-bold">{product.dimensions}</p>
                  </div>
                </div>
              )}

              {product.tags && product.tags.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
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
            {/* Herramientas */}
            <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-black">
                  <Wrench className="h-5 w-5" />
                  HERRAMIENTAS REQUERIDAS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.toolsRequired.map((tool, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span className="font-medium">{tool}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Materiales */}
            <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-black">
                  <Layers className="h-5 w-5" />
                  MATERIALES REQUERIDOS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.materials.map((material, index) => (
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
                  ESPECIFICACIONES ADICIONALES
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
                ESTADÍSTICAS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-gray-600">
                    <Eye className="h-4 w-4" />
                    Vistas
                  </span>
                  <span className="font-black">{product.viewCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-gray-600">
                    <Download className="h-4 w-4" />
                    Descargas
                  </span>
                  <span className="font-black">{product.downloadCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-gray-600">
                    <Star className="h-4 w-4" />
                    Rating
                  </span>
                  <span className="font-black">{product.rating} ({product.reviewCount})</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Creado
                  </span>
                  <span className="font-bold text-sm">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del vendedor */}
          <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-black">
                <User className="h-5 w-5" />
                VENDEDOR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                <p className="font-black">ID: {product.sellerId}</p>
                <div className="mt-3">
                  <Link
                    href={`/admin/usuarios?search=${product.sellerId}`}
                    className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                  >
                    Ver perfil completo →
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
                ARCHIVOS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.pdfFileId && (
                <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200">
                  <span className="flex items-center gap-2 font-bold">
                    <FileText className="h-4 w-4 text-red-600" />
                    PDF Principal
                  </span>
                  <Button size="sm" variant="outline" className="border-black">
                    Ver
                  </Button>
                </div>
              )}
              
              {product.imageFileIds && product.imageFileIds.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200">
                  <span className="flex items-center gap-2 font-bold">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    Imágenes ({product.imageFileIds.length})
                  </span>
                  <Button size="sm" variant="outline" className="border-black">
                    Ver
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
                  ACCIONES
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleFeatureProduct(!product.featured)}
                  variant="outline"
                  className="w-full border-2 border-black font-bold"
                >
                  {product.featured ? '⭐ Quitar destaque' : '⭐ Destacar producto'}
                </Button>
                
                <Button
                  onClick={() => setModerationAction('suspend')}
                  variant="outline"
                  className="w-full border-2 border-black font-bold text-orange-600"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Suspender producto
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de moderación */}
      <Dialog open={!!moderationAction} onOpenChange={() => {
        setModerationAction(null)
        setModerationReason('')
      }}>
        <DialogContent className="border-3 border-black max-w-lg" style={{ boxShadow: '10px 10px 0 #000000' }}>
          <DialogHeader>
            <DialogTitle className="font-black uppercase">
              {moderationAction === 'approve' && '✅ Aprobar Producto'}
              {moderationAction === 'reject' && '❌ Rechazar Producto'}
              {moderationAction === 'suspend' && '⚠️ Suspender Producto'}
            </DialogTitle>
            <DialogDescription>
              <strong>{product.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {moderationAction === 'approve' ? (
              <div>
                <label className="block text-sm font-bold mb-2">
                  Comentario de aprobación (opcional)
                </label>
                <Textarea
                  placeholder="Notas internas sobre la aprobación..."
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="border-2 border-black"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este comentario es solo para uso interno del equipo de moderación.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold mb-2">
                  Razón de {moderationAction === 'reject' ? 'rechazo' : 'suspensión'} *
                </label>
                <Textarea
                  placeholder={`Explica detalladamente por qué ${moderationAction === 'reject' ? 'rechazas' : 'suspendes'} este producto. Esta información será visible para el vendedor.`}
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="border-2 border-black"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  * Campo obligatorio. Esta razón será enviada al vendedor.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setModerationAction(null)
                setModerationReason('')
              }}
              className="border-2 border-black"
              disabled={isLoading}
            >
              Cancelar
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
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                moderationAction === 'approve' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )
              )}
              {moderationAction === 'approve' ? 'APROBAR' : 
               moderationAction === 'reject' ? 'RECHAZAR' : 'SUSPENDER'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}