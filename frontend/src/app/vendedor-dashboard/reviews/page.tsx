'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'

import { useSellerStore } from '@/lib/stores/seller-store'
import { ReviewStatus } from '@/types/additional'

// Funciones de formato
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Renderizar estrellas
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

export default function SellerReviewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [responseModalOpen, setResponseModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [responseText, setResponseText] = useState('')
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)

  const {
    reviews,
    reviewsLoading,
    reviewsPagination,
    reviewsFilters,
    loadReviews,
    setReviewsFilters,
    respondToReview,
  } = useSellerStore()

  // Cargar datos iniciales
  useEffect(() => {
    loadReviews(1)
  }, [loadReviews])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadReviews(1, { ...reviewsFilters, search: searchQuery })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [reviewsFilters, searchQuery, loadReviews])

  // Manejadores
  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleFilterChange = (key: keyof typeof reviewsFilters, value: string | number | boolean) => {
    setReviewsFilters({ [key]: value })
  }

  const handlePageChange = (page: number) => {
    loadReviews(page)
  }

  // Modal de respuesta
  const openResponseModal = (review: any) => {
    setSelectedReview(review)
    setResponseText(review.response?.comment || '')
    setResponseModalOpen(true)
  }

  const closeResponseModal = () => {
    setResponseModalOpen(false)
    setSelectedReview(null)
    setResponseText('')
  }

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return

    setIsSubmittingResponse(true)

    try {
      const result = await respondToReview(selectedReview.id, responseText.trim())
      
      if (result.success) {
        closeResponseModal()
        loadReviews(reviewsPagination.page)
      }
    } catch (error) {
      console.error('Error submitting response:', error)
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  // Función para obtener el color del estado
  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case ReviewStatus.PUBLISHED:
        return 'bg-green-500 text-white'
      case ReviewStatus.PENDING_MODERATION:
        return 'bg-yellow-500 text-black'
      case ReviewStatus.FLAGGED:
        return 'bg-orange-500 text-black'
      case ReviewStatus.REMOVED:
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  // Función para obtener el ícono del estado
  const getStatusIcon = (status: ReviewStatus) => {
    switch (status) {
      case ReviewStatus.PUBLISHED:
        return <CheckCircle className="h-4 w-4" />
      case ReviewStatus.PENDING_MODERATION:
        return <Clock className="h-4 w-4" />
      case ReviewStatus.FLAGGED:
        return <AlertCircle className="h-4 w-4" />
      case ReviewStatus.REMOVED:
        return <XCircle className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  // Calcular estadísticas de reviews
  const reviewStats = {
    total: reviews.length,
    withResponse: reviews.filter(r => r.response).length,
    pending: reviews.filter(r => !r.response).length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0,
    byRating: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div>
          <h1 className="text-2xl font-black uppercase text-black">Mis Reviews</h1>
          <p className="text-gray-600 font-bold">
            Gestiona las reviews de tus productos
          </p>
        </div>
      </div>

      {/* ESTADÍSTICAS DE REVIEWS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Reviews */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">Total Reviews</p>
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

        {/* Con Respuesta */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">Con Respuesta</p>
              <p className="text-2xl font-black text-black">
                {reviewStats.withResponse}
              </p>
              <p className="text-xs font-bold text-green-600 mt-1">
                {reviewStats.total > 0 ? Math.round((reviewStats.withResponse / reviewStats.total) * 100) : 0}% respondidas
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 border-2 border-black flex items-center justify-center">
              <Reply className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase">Pendientes</p>
              <p className="text-2xl font-black text-black">
                {reviewStats.pending}
              </p>
              <p className="text-xs font-bold text-orange-600 mt-1">
                Sin responder
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 border-2 border-black flex items-center justify-center">
              <Clock className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>

        {/* Distribución */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase mb-3">Distribución</p>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-black w-3">{rating}</span>
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <div className="flex-1 bg-gray-200 h-2 border border-black">
                    <div 
                      className="bg-yellow-500 h-full border-r border-black"
                      style={{ 
                        width: reviewStats.total > 0 
                          ? `${(reviewStats.byRating[rating as keyof typeof reviewStats.byRating] / reviewStats.total) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                  <span className="font-bold text-black w-6">
                    {reviewStats.byRating[rating as keyof typeof reviewStats.byRating]}
                  </span>
                </div>
              ))}
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
                placeholder="Buscar por producto o comentario..."
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
            FILTROS
          </button>
        </div>

        {/* Panel de filtros expandible */}
        {filtersOpen && (
          <div className="border-t-2 border-black pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-black text-black mb-2">RATING</label>
                <select
                  value={reviewsFilters.rating || ''}
                  onChange={(e) => handleFilterChange('rating', parseInt(e.target.value) || 0)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="">Todos los ratings</option>
                  <option value="5">5 estrellas</option>
                  <option value="4">4 estrellas</option>
                  <option value="3">3 estrellas</option>
                  <option value="2">2 estrellas</option>
                  <option value="1">1 estrella</option>
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-black text-black mb-2">ESTADO</label>
                <select
                  value={reviewsFilters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="">Todos los estados</option>
                  <option value={ReviewStatus.PUBLISHED}>Publicadas</option>
                  <option value={ReviewStatus.PENDING_MODERATION}>Pendiente moderación</option>
                  <option value={ReviewStatus.FLAGGED}>Reportadas</option>
                  <option value={ReviewStatus.REMOVED}>Removidas</option>
                </select>
              </div>

              {/* Con Respuesta */}
              <div>
                <label className="block text-sm font-black text-black mb-2">RESPUESTA</label>
                <select
                  value={reviewsFilters.hasResponse ? 'true' : 'false'}
                  onChange={(e) => handleFilterChange('hasResponse', e.target.value === 'true')}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="">Todas</option>
                  <option value="true">Con respuesta</option>
                  <option value="false">Sin respuesta</option>
                </select>
              </div>

              {/* Ordenar */}
              <div>
                <label className="block text-sm font-black text-black mb-2">ORDENAR POR</label>
                <select
                  value={`${reviewsFilters.sortBy}-${reviewsFilters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    handleFilterChange('sortBy', sortBy)
                    handleFilterChange('sortOrder', sortOrder)
                  }}
                  className="w-full border-2 border-black font-bold p-2 focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <option value="createdAt-desc">Más recientes</option>
                  <option value="createdAt-asc">Más antiguos</option>
                  <option value="rating-desc">Mayor rating</option>
                  <option value="rating-asc">Menor rating</option>
                  <option value="helpfulCount-desc">Más útiles</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LISTA DE REVIEWS */}
      {reviewsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">Cargando reviews...</p>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border-[3px] border-black p-12 text-center" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-black text-black mb-2">No tienes reviews aún</h3>
          <p className="text-gray-600 font-bold mb-6">
            Las reviews aparecerán aquí cuando los compradores evalúen tus productos.
          </p>
        </div>
      ) : (
        <>
          {/* Reviews */}
          <div className="space-y-6">
            {reviews.map((review) => (
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
                        <h3 className="font-black text-black">{review.buyerName}</h3>
                        <p className="text-sm text-gray-600 font-bold">{review.productTitle}</p>
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
                        {review.status}
                      </span>
                      
                      {review.helpfulCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                          <ThumbsUp className="h-3 w-3" />
                          {review.helpfulCount} útiles
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
                            <h5 className="font-black text-green-800 mb-1 text-sm">PROS:</h5>
                            <p className="text-green-700 text-sm font-bold">{review.pros}</p>
                          </div>
                        )}
                        {review.cons && (
                          <div className="bg-red-50 border-2 border-red-300 p-3">
                            <h5 className="font-black text-red-800 mb-1 text-sm">CONTRAS:</h5>
                            <p className="text-red-700 text-sm font-bold">{review.cons}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Respuesta del vendedor */}
                    {review.response ? (
                      <div className="bg-blue-50 border-2 border-blue-300 p-4 mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Reply className="h-4 w-4 text-blue-600" />
                          <span className="font-black text-blue-800 text-sm">TU RESPUESTA:</span>
                          <span className="text-xs text-blue-600 font-bold">
                            {formatDate(review.response.createdAt)}
                          </span>
                        </div>
                        <p className="text-blue-700 font-bold">{review.response.comment}</p>
                        <button
                          onClick={() => openResponseModal(review)}
                          className="mt-2 text-blue-600 hover:text-blue-800 font-bold text-sm"
                        >
                          Editar respuesta
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <button
                          onClick={() => openResponseModal(review)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all"
                          style={{ boxShadow: '3px 3px 0 #000000' }}
                        >
                          <Reply className="h-4 w-4" />
                          RESPONDER
                        </button>
                      </div>
                    )}
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
                  Mostrando {((reviewsPagination.page - 1) * reviewsPagination.limit) + 1} - {Math.min(reviewsPagination.page * reviewsPagination.limit, reviewsPagination.total)} de {reviewsPagination.total} reviews
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(reviewsPagination.page - 1)}
                    disabled={reviewsPagination.page === 1}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-black font-bold text-black hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
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
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE RESPUESTA */}
      {responseModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[3px] border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ boxShadow: '6px 6px 0 #000000' }}>
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b-2 border-black">
              <h3 className="text-xl font-black uppercase text-black">
                {selectedReview.response ? 'Editar Respuesta' : 'Responder Review'}
              </h3>
              <button
                onClick={closeResponseModal}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-black" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              {/* Review original */}
              <div className="bg-gray-50 border-2 border-gray-300 p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="font-bold text-black">{selectedReview.buyerName}</span>
                </div>
                <p className="text-gray-700 font-bold">{selectedReview.comment}</p>
              </div>

              {/* Textarea para respuesta */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  TU RESPUESTA:
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  rows={6}
                  className="w-full p-3 border-2 border-black font-bold resize-none focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  maxLength={1000}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500 font-bold">
                    Sé profesional y útil en tu respuesta
                  </span>
                  <span className="text-sm text-gray-500 font-bold">
                    {responseText.length}/1000
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim() || isSubmittingResponse}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  {isSubmittingResponse ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      ENVIANDO...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      {selectedReview.response ? 'ACTUALIZAR' : 'ENVIAR'} RESPUESTA
                    </>
                  )}
                </button>

                <button
                  onClick={closeResponseModal}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 border-2 border-black font-bold text-white hover:bg-gray-400 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}