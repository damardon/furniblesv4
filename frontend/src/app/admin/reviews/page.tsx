'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  Flag,
  MessageSquare,
  Star,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  Image as ImageIcon,
  FileText,
  Shield,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

// Types - Coherentes con src/types/index.ts
import { 
  Review, 
  ReviewStatus, 
  ReviewHelpfulness,
  User as UserType, 
  Product,
  ReviewFilters
} from '@/types'

// Stores
import { useAdminStore } from '@/lib/stores/admin-store'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

// Tipos para acciones de moderación
type ModerationAction = 'approve' | 'remove' | 'flag' | null

interface ModerationState {
  action: ModerationAction
  review: Review | null
  reason: string
}

export default function AdminReviewsPage() {
  // Estados principales
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'all'>('pending')
  const [moderationState, setModerationState] = useState<ModerationState>({
    action: null,
    review: null,
    reason: ''
  })
  const [filters, setFilters] = useState<ReviewFilters>({
    status: undefined,
    rating: undefined,
    hasResponse: undefined
  })
  const [isLoading, setIsLoading] = useState(true)

  const t = useTranslations('admin')

  // Store - Métodos coherentes con admin-store.ts
  const { 
    pendingReviews,
    flaggedContent,
    fetchPendingReviews,
    fetchFlaggedContent,
    approveReview,
    removeReview,
    flagReview,
    isLoading: storeLoading,
    error
  } = useAdminStore()

  // Cargar datos al montar componente
  useEffect(() => {
    const loadReviewData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          fetchPendingReviews(),
          fetchFlaggedContent()
        ])
      } catch (error) {
        console.error('Error loading review data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadReviewData()
  }, [fetchPendingReviews, fetchFlaggedContent])

  // Obtener reviews según la pestaña activa
  const getActiveReviews = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return pendingReviews || []
      case 'flagged':
        return flaggedContent?.reviews || []
      case 'all':
        // En implementación real, esto vendría de un endpoint getAllReviews()
        return [...(pendingReviews || []), ...(flaggedContent?.reviews || [])]
      default:
        return []
    }
  }, [activeTab, pendingReviews, flaggedContent])

  // Filtrar reviews
  const filteredReviews = useMemo(() => {
    let filtered = getActiveReviews

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(review => 
        review.title?.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query) ||
        review.product?.title.toLowerCase().includes(query) ||
        review.buyer?.email.toLowerCase().includes(query)
      )
    }

    // Filtros adicionales
    if (filters.rating) {
      filtered = filtered.filter(review => review.rating === filters.rating)
    }

    if (filters.hasResponse !== undefined) {
      filtered = filtered.filter(review => 
        filters.hasResponse ? !!review.response : !review.response
      )
    }

    return filtered
  }, [getActiveReviews, searchQuery, filters])

  // Manejar moderación
  const handleModeration = async () => {
    const { action, review, reason } = moderationState
    if (!action || !review) return

    setIsLoading(true)
    try {
      let result
      
      switch (action) {
        case 'approve':
          result = await approveReview(review.id)
          break
        case 'remove':
          result = await removeReview(review.id, reason)
          break
        case 'flag':
          result = await flagReview(review.id, reason)
          break
        default:
          throw new Error('Acción no válida')
      }

      if (result.success) {
        // Limpiar estado
        setModerationState({
          action: null,
          review: null,
          reason: ''
        })
        
        // Recargar datos
        await Promise.all([
          fetchPendingReviews(),
          fetchFlaggedContent()
        ])
      }
    } catch (error) {
      console.error('Error in moderation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener badge de estado
  const getStatusBadge = (status: ReviewStatus) => {
    const configs = {
      [ReviewStatus.PENDING_MODERATION]: {
        variant: 'secondary' as const,
        className: 'bg-yellow-400 text-black border-2 border-black',
        text: 'PENDIENTE'
      },
      [ReviewStatus.PUBLISHED]: {
        variant: 'secondary' as const,
        className: 'bg-green-500 text-white border-2 border-black',
        text: 'PUBLICADA'
      },
      [ReviewStatus.FLAGGED]: {
        variant: 'destructive' as const,
        className: 'bg-orange-500 text-white border-2 border-black',
        text: 'REPORTADA'
      },
      [ReviewStatus.REMOVED]: {
        variant: 'destructive' as const,
        className: 'bg-red-500 text-white border-2 border-black',
        text: 'ELIMINADA'
      }
    }

    const config = configs[status] || configs[ReviewStatus.PENDING_MODERATION]
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    )
  }

  // Renderizar estrellas
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  // Obtener contadores para tabs
  const getTabCounts = () => ({
    pending: pendingReviews?.length || 0,
    flagged: flaggedContent?.reviews?.length || 0,
    all: (pendingReviews?.length || 0) + (flaggedContent?.reviews?.length || 0)
  })

  const tabCounts = getTabCounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">Moderación de Reviews</h1>
          <p className="text-gray-600 font-bold">
            {tabCounts.pending} pendientes • {tabCounts.flagged} reportadas • {filteredReviews.length} mostradas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => Promise.all([fetchPendingReviews(), fetchFlaggedContent()])}
            disabled={isLoading}
            variant="outline"
            className="border-2 border-black"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            ACTUALIZAR
          </Button>
        </div>
      </div>

      {/* Alertas de moderación */}
      {(tabCounts.pending > 0 || tabCounts.flagged > 0) && (
        <Card className="border-3 border-orange-500" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardHeader className="bg-orange-500 text-black">
            <CardTitle className="flex items-center gap-2 font-black">
              <AlertTriangle className="h-5 w-5" />
              MODERACIÓN REQUERIDA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              {tabCounts.pending > 0 && (
                <div className="p-3 bg-yellow-50 border-2 border-yellow-200">
                  <p className="font-bold text-yellow-800">
                    <MessageSquare className="inline h-4 w-4 mr-1" />
                    {tabCounts.pending} reviews pendientes de moderación
                  </p>
                </div>
              )}
              {tabCounts.flagged > 0 && (
                <div className="p-3 bg-red-50 border-2 border-red-200">
                  <p className="font-bold text-red-800">
                    <Flag className="inline h-4 w-4 mr-1" />
                    {tabCounts.flagged} reviews reportadas por usuarios
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de navegación */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-white border-2 border-black">
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black border-r border-black font-bold"
            >
              PENDIENTES
              {tabCounts.pending > 0 && (
                <Badge className="ml-2 bg-orange-500 text-black border border-black">
                  {tabCounts.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="flagged"
              className="data-[state=active]:bg-red-400 data-[state=active]:text-white border-r border-black font-bold"
            >
              REPORTADAS
              {tabCounts.flagged > 0 && (
                <Badge className="ml-2 bg-red-500 text-white border border-black">
                  {tabCounts.flagged}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-blue-400 data-[state=active]:text-white font-bold"
            >
              TODAS
            </TabsTrigger>
          </TabsList>

          {/* Filtros rápidos */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-black w-64"
              />
            </div>
            
            <Select 
              value={filters.rating?.toString() || 'all'} 
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                rating: value === 'all' ? undefined : parseInt(value) 
              }))}
            >
              <SelectTrigger className="w-32 border-2 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas ⭐</SelectItem>
                <SelectItem value="5">5 estrellas</SelectItem>
                <SelectItem value="4">4 estrellas</SelectItem>
                <SelectItem value="3">3 estrellas</SelectItem>
                <SelectItem value="2">2 estrellas</SelectItem>
                <SelectItem value="1">1 estrella</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contenido de tabs */}
        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {isLoading && !getActiveReviews.length ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-600">Cargando reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <Card className="border-3 border-gray-300" style={{ boxShadow: '5px 5px 0 #000000' }}>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-gray-600 mb-2">
                    No se encontraron reviews
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === 'pending' && 'No hay reviews pendientes de moderación'}
                    {activeTab === 'flagged' && 'No hay reviews reportadas'}
                    {activeTab === 'all' && 'Ajusta los filtros para ver más resultados'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredReviews.map((review) => (
                <Card key={review.id} className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header de la review */}
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            {getStatusBadge(review.status)}
                            {review.isVerified && (
                              <Badge className="bg-blue-500 text-white border-2 border-black">
                                ✓ VERIFICADA
                              </Badge>
                            )}
                          </div>
                          
                          {review.title && (
                            <h3 className="text-lg font-black text-black mb-2">
                              {review.title}
                            </h3>
                          )}
                          
                          <p className="text-gray-700 leading-relaxed">
                            {review.comment}
                          </p>
                        </div>
                        
                        <div className="lg:w-48 flex-shrink-0">
                          <div className="text-right space-y-2">
                            <p className="text-sm font-bold text-gray-600">
                              ID: {review.id.slice(0, 8)}...
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pros y contras */}
                      {(review.pros || review.cons) && (
                        <div className="grid gap-4 md:grid-cols-2">
                          {review.pros && (
                            <div className="p-3 bg-green-50 border-2 border-green-200">
                              <h4 className="font-bold text-green-800 mb-1">👍 Pros:</h4>
                              <p className="text-green-700 text-sm">{review.pros}</p>
                            </div>
                          )}
                          {review.cons && (
                            <div className="p-3 bg-red-50 border-2 border-red-200">
                              <h4 className="font-bold text-red-800 mb-1">👎 Contras:</h4>
                              <p className="text-red-700 text-sm">{review.cons}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Información del producto y usuario */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4 bg-gray-50 border-2 border-gray-200">
                        <div>
                          <h4 className="font-bold text-gray-600 mb-2">PRODUCTO</h4>
                          <Link
                            href={`/productos/${review.product?.slug || '#'}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1"
                          >
                            {review.product?.title || 'Producto no disponible'}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-600 mb-2">COMPRADOR</h4>
                          <p className="text-sm">
                            <span className="font-bold">
                              {review.buyer?.firstName} {review.buyer?.lastName}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">{review.buyer?.email}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-600 mb-2">ENGAGEMENT</h4>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3 text-green-600" />
                              {review.helpfulCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsDown className="h-3 w-3 text-red-600" />
                              {review.notHelpfulCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Respuesta del vendedor */}
                      {review.response && (
                        <div className="p-4 bg-blue-50 border-2 border-blue-200">
                          <h4 className="font-bold text-blue-800 mb-2">
                            💬 Respuesta del vendedor:
                          </h4>
                          <p className="text-blue-700 text-sm mb-2">{review.response.comment}</p>
                          <p className="text-xs text-blue-600">
                            Por {review.response.seller?.firstName} {review.response.seller?.lastName} •{' '}
                            {new Date(review.response.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Imágenes de la review */}
                      {review.images && review.images.length > 0 && (
                        <div className="p-4 bg-purple-50 border-2 border-purple-200">
                          <h4 className="font-bold text-purple-800 mb-2">
                            📸 Imágenes adjuntas ({review.images.length}):
                          </h4>
                          <div className="flex gap-2">
                            {review.images.map((image, index) => (
                              <div key={image.id} className="w-16 h-16 bg-gray-200 border-2 border-black flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Razón de moderación si existe */}
                      {review.moderationReason && (
                        <div className="p-4 bg-red-50 border-2 border-red-200">
                          <h4 className="font-bold text-red-800 mb-2">⚠️ Razón de moderación:</h4>
                          <p className="text-red-700 text-sm">{review.moderationReason}</p>
                          {review.moderatedBy && (
                            <p className="text-xs text-red-600 mt-1">
                              Moderado por: {review.moderatedBy} •{' '}
                              {review.moderatedAt && new Date(review.moderatedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Acciones de moderación */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-200">
                        {review.status === ReviewStatus.PENDING_MODERATION && (
                          <>
                            <Button
                              onClick={() => setModerationState({
                                action: 'approve',
                                review,
                                reason: ''
                              })}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white border-2 border-black font-black"
                              style={{ boxShadow: '3px 3px 0 #000000' }}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              APROBAR REVIEW
                            </Button>
                            <Button
                              onClick={() => setModerationState({
                                action: 'remove',
                                review,
                                reason: ''
                              })}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white border-2 border-black font-black"
                              style={{ boxShadow: '3px 3px 0 #000000' }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              ELIMINAR REVIEW
                            </Button>
                          </>
                        )}

                        {review.status === ReviewStatus.FLAGGED && (
                          <>
                            <Button
                              onClick={() => setModerationState({
                                action: 'approve',
                                review,
                                reason: ''
                              })}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white border-2 border-black font-black"
                              style={{ boxShadow: '3px 3px 0 #000000' }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              MANTENER PUBLICADA
                            </Button>
                            <Button
                              onClick={() => setModerationState({
                                action: 'remove',
                                review,
                                reason: ''
                              })}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white border-2 border-black font-black"
                              style={{ boxShadow: '3px 3px 0 #000000' }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              ELIMINAR DEFINITIVAMENTE
                            </Button>
                          </>
                        )}

                        {/* Acción adicional de reportar */}
                        {review.status === ReviewStatus.PUBLISHED && (
                          <Button
                            onClick={() => setModerationState({
                              action: 'flag',
                              review,
                              reason: ''
                            })}
                            variant="outline"
                            className="border-2 border-black font-bold"
                          >
                            <Flag className="h-4 w-4 mr-2" />
                            REPORTAR
                          </Button>
                        )}

                        {/* Ver en contexto */}
                        <Button
                          asChild
                          variant="outline"
                          className="border-2 border-black font-bold"
                        >
                          <Link
                            href={`/productos/${review.product?.slug || '#'}#review-${review.id}`}
                            target="_blank"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            VER EN SITIO
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de moderación */}
      <Dialog open={!!moderationState.action} onOpenChange={() => {
        setModerationState({
          action: null,
          review: null,
          reason: ''
        })
      }}>
        <DialogContent className="border-3 border-black max-w-lg" style={{ boxShadow: '10px 10px 0 #000000' }}>
          <DialogHeader>
            <DialogTitle className="font-black uppercase">
              {moderationState.action === 'approve' && '✅ Aprobar Review'}
              {moderationState.action === 'remove' && '❌ Eliminar Review'}
              {moderationState.action === 'flag' && '🚩 Reportar Review'}
            </DialogTitle>
            <DialogDescription>
              Review de{' '}
              <strong>
                {moderationState.review?.buyer?.firstName} {moderationState.review?.buyer?.lastName}
              </strong>
              {moderationState.review?.product && (
                <> para <strong>{moderationState.review.product.title}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mostrar contenido de la review */}
            {moderationState.review && (
              <div className="p-3 bg-gray-50 border-2 border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(moderationState.review.rating)}
                </div>
                {moderationState.review.title && (
                  <h4 className="font-bold mb-1">{moderationState.review.title}</h4>
                )}
                <p className="text-sm text-gray-700">{moderationState.review.comment}</p>
              </div>
            )}

            {moderationState.action === 'approve' ? (
              <div>
                <label className="block text-sm font-bold mb-2">
                  Comentario interno (opcional)
                </label>
                <Textarea
                  placeholder="Notas internas sobre la aprobación..."
                  value={moderationState.reason}
                  onChange={(e) => setModerationState(prev => ({ ...prev, reason: e.target.value }))}
                  className="border-2 border-black"
                  rows={3}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold mb-2">
                  Razón de {moderationState.action === 'remove' ? 'eliminación' : 'reporte'} *
                </label>
                <Textarea
                  placeholder={`Explica por qué ${moderationState.action === 'remove' ? 'eliminas' : 'reportas'} esta review...`}
                  value={moderationState.reason}
                  onChange={(e) => setModerationState(prev => ({ ...prev, reason: e.target.value }))}
                  className="border-2 border-black"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta información será registrada para auditoría.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModerationState({
                action: null,
                review: null,
                reason: ''
              })}
              className="border-2 border-black"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleModeration}
              disabled={isLoading || (moderationState.action !== 'approve' && !moderationState.reason.trim())}
              className={`border-2 border-black font-black ${
                moderationState.action === 'approve' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600'
              } text-white`}
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                moderationState.action === 'approve' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )
              )}
              {moderationState.action === 'approve' ? 'APROBAR' : 
               moderationState.action === 'remove' ? 'ELIMINAR' : 'REPORTAR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error handling */}
      {error && (
        <Card className="border-3 border-red-500" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardHeader className="bg-red-500 text-white">
            <CardTitle className="flex items-center gap-2 font-black">
              <XCircle className="h-5 w-5" />
              ERROR DE CARGA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-red-600 font-bold mb-4">{error}</p>
            <Button 
              onClick={() => Promise.all([fetchPendingReviews(), fetchFlaggedContent()])}
              className="bg-red-500 hover:bg-red-600 text-white border-2 border-black"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}