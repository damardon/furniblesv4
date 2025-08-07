'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Search,
  Filter,
  Star,
  MessageSquare,
  ThumbsUp,
  Reply,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  X,
  Shield,
  Flag,
  Eye,
  Ban,
  Trash2
} from 'lucide-react'

// ✅ Tipos coherentes con backend
interface Review {
  id: string
  orderId: string
  productId: string
  buyerId: string
  sellerId: string
  rating: number
  title?: string
  comment: string
  pros?: string
  cons?: string
  status: 'PENDING_MODERATION' | 'PUBLISHED' | 'FLAGGED' | 'REMOVED'
  isVerified: boolean
  helpfulCount: number
  notHelpfulCount: number
  moderatedBy?: string
  moderatedAt?: string
  moderationReason?: string
  createdAt: string
  updatedAt: string
  buyer?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  product?: {
    id: string
    title: string
    slug: string
    seller?: {
      id: string
      firstName: string
      lastName: string
      storeName?: string
    }
  }
  response?: {
    id: string
    sellerId: string
    comment: string
    createdAt: string
  }
  reports?: Array<{
    id: string
    userId: string
    reason: string
    details?: string
    createdAt: string
  }>
}

interface ReviewsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface ReviewsFilters {
  status?: string
  rating?: number
  productId?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface ReviewsData {
  data: Review[]
  pagination: ReviewsPagination
  stats: {
    total: number
    pending: number
    flagged: number
    published: number
    removed: number
    averageRating: number
    byRating: {
      1: number
      2: number
      3: number
      4: number
      5: number
    }
  }
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

export default function AdminReviewsPage() {
  const t = useTranslations('admin.reviews')
  const tCommon = useTranslations('common')
  const tStatus = useTranslations('admin.reviews.status')
  const tActions = useTranslations('admin.reviews.actions')

  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [moderationModalOpen, setModerationModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [moderationAction, setModerationAction] = useState<'approve' | 'flag' | 'remove' | null>(null)
  const [moderationReason, setModerationReason] = useState('')
  const [isSubmittingModeration, setIsSubmittingModeration] = useState(false)

  const [reviewsFilters, setReviewsFiltersLocal] = useState<ReviewsFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // ✅ Cargar reviews desde API real
  const loadReviews = async (page: number = 1, filters?: ReviewsFilters) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const token = getAuthToken()
      if (!token) {
        setError('No autorizado')
        return
      }

      console.log('🔍 [ADMIN-REVIEWS] Fetching reviews with filters:', { page, ...filters })
      
      // Construir query params
      const queryParams = new URLSearchParams()
      queryParams.append('page', page.toString())
      queryParams.append('limit', '20')
      
      if (filters?.status) queryParams.append('status', filters.status)
      if (filters?.rating) queryParams.append('rating', filters.rating.toString())
      if (filters?.productId) queryParams.append('productId', filters.productId)
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder)
      
      // ✅ API call para reviews del admin
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ [ADMIN-REVIEWS] Reviews loaded:', data.data?.length || 0)
      
      // Calcular estadísticas desde los datos
      const reviews = data.data || []
      const stats = {
        total: data.total || 0,
        pending: reviews.filter((r: Review) => r.status === 'PENDING_MODERATION').length,
        flagged: reviews.filter((r: Review) => r.status === 'FLAGGED').length,
        published: reviews.filter((r: Review) => r.status === 'PUBLISHED').length,
        removed: reviews.filter((r: Review) => r.status === 'REMOVED').length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length 
          : 0,
        byRating: {
          1: reviews.filter((r: Review) => r.rating === 1).length,
          2: reviews.filter((r: Review) => r.rating === 2).length,
          3: reviews.filter((r: Review) => r.rating === 3).length,
          4: reviews.filter((r: Review) => r.rating === 4).length,
          5: reviews.filter((r: Review) => r.rating === 5).length,
        }
      }

      setReviewsData({
        data: reviews,
        pagination: {
          page: data.page || page,
          limit: data.limit || 20,
          total: data.total || 0,
          totalPages: data.totalPages || 0,
          hasNext: data.hasNext || false,
          hasPrev: data.hasPrev || false,
        },
        stats
      })

    } catch (err) {
      console.error('❌ [ADMIN-REVIEWS] Error loading reviews:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Moderar review
  const moderateReview = async (reviewId: string, action: string, reason: string) => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No autorizado')
      }

      console.log('🔍 [ADMIN-REVIEWS] Moderating review:', { reviewId, action, reason })
      
      // ✅ API call para moderar review
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews/${reviewId}/moderate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ [ADMIN-REVIEWS] Review moderated successfully:', result)
      
      return { success: true, data: result }
    } catch (error) {
      console.error('❌ [ADMIN-REVIEWS] Error moderating review:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error moderating review' 
      }
    }
  }

  // Función para actualizar filtros
  const setReviewsFilters = (filters: Partial<ReviewsFilters>) => {
    setReviewsFiltersLocal(prev => ({ ...prev, ...filters }))
  }

  // ✅ Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ✅ Renderizar estrellas
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? 'text-yellow-500 fill-yellow-500' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  // ✅ Cargar datos iniciales
  useEffect(() => {
    loadReviews(1)
  }, [])

  // ✅ Aplicar filtros cuando cambien
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadReviews(1, { ...reviewsFilters, search: searchQuery })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [reviewsFilters, searchQuery])

  // Manejadores
  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleFilterChange = (key: keyof ReviewsFilters, value: string | number | boolean) => {
    setReviewsFilters({ [key]: value })
  }

  const handlePageChange = (page: number) => {
    loadReviews(page, { ...reviewsFilters, search: searchQuery })
  }

  // Modal de moderación
  const openModerationModal = (review: Review, action: 'approve' | 'flag' | 'remove') => {
    setSelectedReview(review)
    setModerationAction(action)
    setModerationReason('')
    setModerationModalOpen(true)
  }

  const closeModerationModal = () => {
    setModerationModalOpen(false)
    setSelectedReview(null)
    setModerationAction(null)
    setModerationReason('')
  }

  const handleSubmitModeration = async () => {
    if (!selectedReview || !moderationAction) return

    // Para 'remove' y 'flag', la razón es obligatoria
    if ((moderationAction === 'remove' || moderationAction === 'flag') && !moderationReason.trim()) {
      return
    }

    setIsSubmittingModeration(true)

    try {
      const result = await moderateReview(selectedReview.id, moderationAction, moderationReason.trim())
      
      if (result.success) {
        closeModerationModal()
        // Recargar la página actual
        loadReviews(reviewsData?.pagination.page || 1, { ...reviewsFilters, search: searchQuery })
      } else {
        alert(result.error || 'Error al moderar la review')
      }
    } catch (error) {
      console.error('Error submitting moderation:', error)
      alert('Error al moderar la review')
    } finally {
      setIsSubmittingModeration(false)
    }
  }

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-500 text-white'
      case 'PENDING_MODERATION':
        return 'bg-yellow-500 text-black'
      case 'FLAGGED':
        return 'bg-orange-500 text-black'
      case 'REMOVED':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  // Función para obtener el ícono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle className="h-4 w-4" />
      case 'PENDING_MODERATION':
        return <Clock className="h-4 w-4" />
      case 'FLAGGED':
        return <AlertCircle className="h-4 w-4" />
      case 'REMOVED':
        return <XCircle className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  // ✅ Estados de loading y error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
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
          onClick={() => loadReviews(1)}
          className="bg-orange-500 border-2 border-black text-black font-black py-2 px-4 uppercase hover:bg-orange-400 transition-all"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          {tCommon('retry')}
        </button>
      </div>
    )
  }

  if (!reviewsData) {
    return (
      <div className="bg-white border-[3px] border-black p-8 text-center" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-black text-black uppercase mb-4">Sin datos</h2>
        <p className="text-gray-600 font-bold">No se pudieron cargar los datos de reviews</p>
      </div>
    )
  }

  const { data: reviews, pagination: reviewsPagination, stats: reviewStats } = reviewsData

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div>
          <h1 className="text-2xl font-black uppercase text-black">{t('title')}</h1>
          <p className="text-gray-600 font-bold">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* ESTADÍSTICAS DE REVIEWS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Reviews */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.total_reviews')}</p>
              <p className="text-2xl font-black text-black">
                {reviewStats.total}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {renderStars(Math.round(reviewStats.averageRating))}
                <span className="text-sm font-bold text-gray-600 ml-1">
                  {reviewStats.averageRating.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-500 border-2 border-black flex items-center justify-center">
              <Star className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>

        {/* Pendientes de Moderación */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.pending_moderation')}</p>
              <p className="text-2xl font-black text-black">
                {reviewStats.pending}
              </p>
              <p className="text-xs font-bold text-orange-600 mt-1">
                {t('stats.require_attention')}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 border-2 border-black flex items-center justify-center">
              <Clock className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>

        {/* Reportadas */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.flagged')}</p>
              <p className="text-2xl font-black text-black">
                {reviewStats.flagged}
              </p>
              <p className="text-xs font-bold text-red-600 mt-1">
                {t('stats.reported_content')}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 border-2 border-black flex items-center justify-center">
              <Flag className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Publicadas */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.published')}</p>
              <p className="text-2xl font-black text-black">
                {reviewStats.published}
              </p>
              <p className="text-xs font-bold text-green-600 mt-1">
                {reviewStats.total > 0 ? Math.round((reviewStats.published / reviewStats.total) * 100) : 0}% {t('stats.approval_rate')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 border-2 border-black flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        {/* Barra superior */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder={t('filters.search_placeholder')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
            </div>
          </div>

          {/* Toggle filtros */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-3 border-2 border-black font-bold transition-all ${
              filtersOpen ? 'bg-orange-500 text-black' : 'bg-white text-black hover:bg-yellow-400'
            }`}
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <Filter className="h-4 w-4" />
            {tCommon('filter')}
          </button>
        </div>

        {/* Panel de filtros expandible */}
        {filtersOpen && (
          <div className="border-t-2 border-black pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-black text-black mb-2">{t('filters.rating')}</label>
                <select
                  value={reviewsFilters.rating || ''}
                  onChange={(e) => handleFilterChange('rating', parseInt(e.target.value) || 0)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="">{t('filters.all_ratings')}</option>
                  <option value="5">5 {t('filters.stars')}</option>
                  <option value="4">4 {t('filters.stars')}</option>
                  <option value="3">3 {t('filters.stars')}</option>
                  <option value="2">2 {t('filters.stars')}</option>
                  <option value="1">1 {t('filters.star')}</option>
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-black text-black mb-2">{t('filters.status')}</label>
                <select
                  value={reviewsFilters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="">{t('filters.all_statuses')}</option>
                  <option value="PENDING_MODERATION">{tStatus('pending_moderation')}</option>
                  <option value="PUBLISHED">{tStatus('published')}</option>
                  <option value="FLAGGED">{tStatus('flagged')}</option>
                  <option value="REMOVED">{tStatus('removed')}</option>
                </select>
              </div>

              {/* Producto */}
              <div>
                <label className="block text-sm font-black text-black mb-2">{t('filters.product')}</label>
                <select
                  value={reviewsFilters.productId || ''}
                  onChange={(e) => handleFilterChange('productId', e.target.value)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="">{t('filters.all_products')}</option>
                </select>
              </div>

              {/* Ordenar */}
              <div>
                <label className="block text-sm font-black text-black mb-2">{t('filters.sort_by')}</label>
                <select
                  value={`${reviewsFilters.sortBy}-${reviewsFilters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    handleFilterChange('sortBy', sortBy)
                    handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc')
                  }}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="createdAt-desc">{t('filters.sort_newest')}</option>
                  <option value="createdAt-asc">{t('filters.sort_oldest')}</option>
                  <option value="rating-desc">{t('filters.sort_highest_rating')}</option>
                  <option value="rating-asc">{t('filters.sort_lowest_rating')}</option>
                  <option value="helpfulCount-desc">{t('filters.sort_most_helpful')}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LISTA DE REVIEWS */}
      {reviews.length === 0 ? (
        <div className="bg-white border-[3px] border-black p-12 text-center" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-black text-black mb-2">{t('no_reviews')}</h3>
          <p className="text-gray-600 font-bold mb-6">
            {t('no_reviews_description')}
          </p>
        </div>
      ) : (
        <>
          {/* Reviews */}
          <div className="space-y-6">
            {reviews.map((review: Review) => (
              <div
                key={review.id}
                className="bg-white border-[3px] border-black p-6"
                style={{ boxShadow: '6px 6px 0 #000000' }}
              >
                {/* Header de la review */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar del comprador */}
                  <div className="w-12 h-12 bg-blue-500 border-2 border-black flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-white" />
                  </div>

                  <div className="flex-1">
                    {/* Info del comprador y producto */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-black text-black">
                          {review.buyer ? `${review.buyer.firstName} ${review.buyer.lastName}` : 'Usuario desconocido'}
                        </h3>
                        <p className="text-sm text-gray-600 font-bold">{review.product?.title || 'Producto no disponible'}</p>
                        <p className="text-xs text-gray-500 font-bold">
                          {t('seller')}: {review.product?.seller ? `${review.product.seller.firstName} ${review.product.seller.lastName}` : 'Vendedor desconocido'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-xs text-gray-500 font-bold">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Estado de la review */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-black border border-black ${getStatusColor(review.status)}`}>
                        {getStatusIcon(review.status)}
                        {tStatus(review.status.toLowerCase())}
                      </span>
                      
                      {review.helpfulCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                          <ThumbsUp className="h-3 w-3" />
                          {review.helpfulCount} {t('helpful')}
                        </span>
                      )}

                      {review.reports && review.reports.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                          <Flag className="h-3 w-3" />
                          {review.reports?.length || 0} {t('reports')}
                        </span>
                      )}
                    </div>

                    {/* Título de la review */}
                    {review.title && (
                      <h4 className="font-black text-black mb-2">{review.title}</h4>
                    )}

                    {/* Comentario */}
                    <p className="text-gray-700 font-bold mb-3 leading-relaxed">
                      {review.comment}
                    </p>

                    {/* Pros y Cons */}
                    {(review.pros || review.cons) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {review.pros && (
                          <div className="bg-green-50 border-2 border-green-300 p-3">
                            <h5 className="font-black text-green-800 mb-1 text-sm">{t('pros')}:</h5>
                            <p className="text-green-700 text-sm font-bold">{review.pros}</p>
                          </div>
                        )}
                        {review.cons && (
                          <div className="bg-red-50 border-2 border-red-300 p-3">
                            <h5 className="font-black text-red-800 mb-1 text-sm">{t('cons')}:</h5>
                            <p className="text-red-700 text-sm font-bold">{review.cons}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Respuesta del vendedor */}
                    {review.response && (
                      <div className="bg-blue-50 border-2 border-blue-300 p-4 mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Reply className="h-4 w-4 text-blue-600" />
                          <span className="font-black text-blue-800 text-sm">{t('seller_response')}:</span>
                          <span className="text-xs text-blue-600 font-bold">
                            {formatDate(review.response.createdAt)}
                          </span>
                        </div>
                        <p className="text-blue-700 font-bold">{review.response.comment}</p>
                      </div>
                    )}

                    {/* Razón de moderación */}
                    {review.moderationReason && (
                      <div className="bg-gray-50 border-2 border-gray-300 p-4 mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-gray-600" />
                          <span className="font-black text-gray-800 text-sm">{t('moderation_reason')}:</span>
                        </div>
                        <p className="text-gray-700 font-bold">{review.moderationReason}</p>
                        {review.moderatedBy && (
                          <p className="text-xs text-gray-500 font-bold mt-1">
                            {t('moderated_by')}: {review.moderatedBy}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Acciones de moderación */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t-2 border-gray-200">
                      {review.status === 'PENDING_MODERATION' && (
                        <>
                          <button
                            onClick={() => openModerationModal(review, 'approve')}
                            className="flex items-center gap-2 px-3 py-2 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all"
                            style={{ boxShadow: '3px 3px 0 #000000' }}
                          >
                            <CheckCircle className="h-4 w-4" />
                            {tActions('approve')}
                          </button>
                          <button
                            onClick={() => openModerationModal(review, 'flag')}
                            className="flex items-center gap-2 px-3 py-2 bg-orange-500 border-2 border-black font-bold text-black hover:bg-orange-400 transition-all"
                            style={{ boxShadow: '3px 3px 0 #000000' }}
                          >
                            <Flag className="h-4 w-4" />
                            {tActions('flag')}
                          </button>
                          <button
                            onClick={() => openModerationModal(review, 'remove')}
                            className="flex items-center gap-2 px-3 py-2 bg-red-500 border-2 border-black font-bold text-white hover:bg-red-400 transition-all"
                            style={{ boxShadow: '3px 3px 0 #000000' }}
                          >
                            <Trash2 className="h-4 w-4" />
                            {tActions('remove')}
                          </button>
                        </>
                      )}

                      {review.status === 'PUBLISHED' && (
                        <>
                          <button
                            onClick={() => openModerationModal(review, 'flag')}
                            className="flex items-center gap-2 px-3 py-2 bg-orange-500 border-2 border-black font-bold text-black hover:bg-orange-400 transition-all"
                            style={{ boxShadow: '3px 3px 0 #000000' }}
                          >
                            <Flag className="h-4 w-4" />
                            {tActions('flag')}
                          </button>
                          <button
                            onClick={() => openModerationModal(review, 'remove')}
                            className="flex items-center gap-2 px-3 py-2 bg-red-500 border-2 border-black font-bold text-white hover:bg-red-400 transition-all"
                            style={{ boxShadow: '3px 3px 0 #000000' }}
                          >
                            <Trash2 className="h-4 w-4" />
                            {tActions('remove')}
                          </button>
                        </>
                      )}

                      {review.status === 'FLAGGED' && (
                        <>
                          <button
                            onClick={() => openModerationModal(review, 'approve')}
                            className="flex items-center gap-2 px-3 py-2 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all"
                            style={{ boxShadow: '3px 3px 0 #000000' }}
                          >
                            <CheckCircle className="h-4 w-4" />
                            {tActions('approve')}
                          </button>
                          <button
                            onClick={() => openModerationModal(review, 'remove')}
                            className="flex items-center gap-2 px-3 py-2 bg-red-500 border-2 border-black font-bold text-white hover:bg-red-400 transition-all"
                            style={{ boxShadow: '3px 3px 0 #000000' }}
                          >
                            <Trash2 className="h-4 w-4" />
                            {tActions('remove')}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => window.open(`/productos/${review.product?.slug}`, '_blank')}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      >
                        <Eye className="h-4 w-4" />
                        {tActions('view_product')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINACIÓN */}
          {reviewsPagination.totalPages > 1 && (
            <div className="bg-white border-[3px] border-black p-4" style={{ boxShadow: '6px 6px 0 #000000' }}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-gray-600">
                  {t('pagination.showing', { 
                    start: ((reviewsPagination.page - 1) * reviewsPagination.limit) + 1,
                    end: Math.min(reviewsPagination.page * reviewsPagination.limit, reviewsPagination.total),
                    total: reviewsPagination.total 
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(reviewsPagination.page - 1)}
                    disabled={reviewsPagination.page === 1}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-black font-bold text-black hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {tCommon('previous')}
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, reviewsPagination.totalPages) }, (_, i) => {
                      const page = i + 1
                      const isActive = page === reviewsPagination.page
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 border-2 border-black font-black transition-all ${
                            isActive
                              ? 'bg-orange-500 text-black'
                              : 'bg-white text-black hover:bg-yellow-400'
                          }`}
                          style={{ boxShadow: '2px 2px 0 #000000' }}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(reviewsPagination.page + 1)}
                    disabled={reviewsPagination.page === reviewsPagination.totalPages}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-black font-bold text-black hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    {tCommon('next')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE MODERACIÓN */}
      {moderationModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[3px] border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ boxShadow: '6px 6px 0 #000000' }}>
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b-2 border-black">
              <h3 className="text-xl font-black uppercase text-black">
                {moderationAction === 'approve' ? t('modals.approve_review') :
                 moderationAction === 'flag' ? t('modals.flag_review') :
                 moderationAction === 'remove' ? t('modals.remove_review') : 
                 t('modals.moderate_review')}
              </h3>
              <button
                onClick={closeModerationModal}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-black" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              {/* Review original */}
              <div className="bg-gray-50 border-2 border-gray-300 p-4 mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 border-2 border-black rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(selectedReview.rating)}
                      <span className="font-bold text-black">
                        {selectedReview.buyer ? `${selectedReview.buyer.firstName} ${selectedReview.buyer.lastName}` : 'Usuario desconocido'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-bold">{selectedReview.product?.title || 'Producto no disponible'}</p>
                    <p className="text-xs text-gray-500 font-bold">
                      {t('seller')}: {selectedReview.product?.seller ? `${selectedReview.product.seller.firstName} ${selectedReview.product.seller.lastName}` : 'Vendedor desconocido'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-black border border-black ${getStatusColor(selectedReview.status)}`}>
                      {getStatusIcon(selectedReview.status)}
                      {tStatus(selectedReview.status.toLowerCase())}
                    </span>
                  </div>
                </div>
                
                {selectedReview.title && (
                  <h4 className="font-black text-black mb-2">{selectedReview.title}</h4>
                )}
                
                <p className="text-gray-700 font-bold mb-2">{selectedReview.comment}</p>
                
                {selectedReview.pros && (
                  <div className="mb-2">
                    <span className="text-green-600 font-bold text-sm">{t('pros')}: </span>
                    <span className="text-gray-700 font-bold text-sm">{selectedReview.pros}</span>
                  </div>
                )}
                
                {selectedReview.cons && (
                  <div className="mb-2">
                    <span className="text-red-600 font-bold text-sm">{t('cons')}: </span>
                    <span className="text-gray-700 font-bold text-sm">{selectedReview.cons}</span>
                  </div>
                )}

                {selectedReview.helpfulCount > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <ThumbsUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600 font-bold text-sm">
                      {selectedReview.helpfulCount} {t('helpful')}
                    </span>
                  </div>
                )}

                {selectedReview.reports && selectedReview.reports.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Flag className="h-3 w-3 text-red-600" />
                    <span className="text-red-600 font-bold text-sm">
                      {selectedReview.reports?.length || 0} {t('reports')}
                    </span>
                  </div>
                )}
              </div>

              {/* Descripción de la acción */}
              <div className={`p-4 border-2 rounded mb-4 ${
                moderationAction === 'approve' ? 'bg-green-50 border-green-300' :
                moderationAction === 'flag' ? 'bg-orange-50 border-orange-300' :
                'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {moderationAction === 'approve' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {moderationAction === 'flag' && <Flag className="h-5 w-5 text-orange-600" />}
                  {moderationAction === 'remove' && <Trash2 className="h-5 w-5 text-red-600" />}
                  <span className={`font-bold ${
                    moderationAction === 'approve' ? 'text-green-800' :
                    moderationAction === 'flag' ? 'text-orange-800' :
                    'text-red-800'
                  }`}>
                    {moderationAction === 'approve' ? t('modals.approve_action') :
                     moderationAction === 'flag' ? t('modals.flag_action') :
                     t('modals.remove_action')}
                  </span>
                </div>
                <p className={`text-sm font-bold ${
                  moderationAction === 'approve' ? 'text-green-700' :
                  moderationAction === 'flag' ? 'text-orange-700' :
                  'text-red-700'
                }`}>
                  {moderationAction === 'approve' ? t('modals.approve_description') :
                   moderationAction === 'flag' ? t('modals.flag_description') :
                   t('modals.remove_description')}
                </p>
              </div>

              {/* Razón de moderación */}
              {(moderationAction === 'flag' || moderationAction === 'remove') && (
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    {t('modals.reason_label')} *
                  </label>
                  <textarea
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder={
                      moderationAction === 'flag' 
                        ? t('modals.flag_reason_placeholder')
                        : t('modals.remove_reason_placeholder')
                    }
                    rows={4}
                    className="w-full p-3 border-2 border-black font-bold resize-none focus:outline-none focus:bg-yellow-400"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                    maxLength={500}
                    required
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-500 font-bold">
                      {t('modals.reason_required')}
                    </span>
                    <span className="text-sm text-gray-500 font-bold">
                      {moderationReason.length}/500
                    </span>
                  </div>
                </div>
              )}

              {moderationAction === 'approve' && (
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    {t('modals.approval_note')}
                  </label>
                  <textarea
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder={t('modals.approval_note_placeholder')}
                    rows={3}
                    className="w-full p-3 border-2 border-black font-bold resize-none focus:outline-none focus:bg-yellow-400"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                    maxLength={200}
                  />
                  <div className="text-right mt-1">
                    <span className="text-sm text-gray-500 font-bold">
                      {moderationReason.length}/200
                    </span>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSubmitModeration}
                  disabled={
                    isSubmittingModeration || 
                    ((moderationAction === 'flag' || moderationAction === 'remove') && !moderationReason.trim())
                  }
                  className={`flex items-center gap-2 px-6 py-3 border-2 border-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    moderationAction === 'approve' ? 'bg-green-500 text-black hover:bg-green-400' :
                    moderationAction === 'flag' ? 'bg-orange-500 text-black hover:bg-orange-400' :
                    'bg-red-500 text-white hover:bg-red-400'
                  }`}
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  {isSubmittingModeration ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      {t('modals.processing')}...
                    </>
                  ) : (
                    <>
                      {moderationAction === 'approve' && <CheckCircle className="h-5 w-5" />}
                      {moderationAction === 'flag' && <Flag className="h-5 w-5" />}
                      {moderationAction === 'remove' && <Trash2 className="h-5 w-5" />}
                      {moderationAction === 'approve' ? t('modals.confirm_approve') :
                       moderationAction === 'flag' ? t('modals.confirm_flag') :
                       t('modals.confirm_remove')}
                    </>
                  )}
                </button>

                <button
                  onClick={closeModerationModal}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 border-2 border-black font-bold text-white hover:bg-gray-400 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}