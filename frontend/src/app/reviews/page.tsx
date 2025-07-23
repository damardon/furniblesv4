'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { 
  StarIcon,
  MessageSquareIcon,
  ArrowLeftIcon,
  SearchIcon,
  CalendarIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  EditIcon,
  ExternalLinkIcon,
  ImageIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  TrendingUpIcon,
  BarChartIcon
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'

// Tipos para Reviews
enum ReviewStatus {
  PENDING_MODERATION = 'PENDING_MODERATION',
  PUBLISHED = 'PUBLISHED',
  FLAGGED = 'FLAGGED',
  REMOVED = 'REMOVED'
}

interface Review {
  id: string
  productId: string
  productTitle: string
  productSlug: string
  rating: number
  title?: string
  comment: string
  pros?: string
  cons?: string
  status: ReviewStatus
  helpfulCount: number
  notHelpfulCount: number
  orderNumber: string
  createdAt: string
  imageUrls?: string[]
  product: {
    sellerName: string
    previewImages?: string[]
  }
  sellerResponse?: {
    sellerName: string
    comment: string
    createdAt: string
  }
}

interface PendingReview {
  orderId: string
  orderNumber: string
  productId: string
  productTitle: string
  purchaseDate: string
  product: {
    previewImages?: string[]
  }
}

// Mock data
const mockReviews: Review[] = [
  {
    id: 'review_001',
    productId: 'product_001',
    productTitle: 'Mesa de Comedor Moderna Roble',
    productSlug: 'mesa-comedor-moderna-roble',
    rating: 5,
    title: 'Excelente calidad y diseño',
    comment: 'Muy satisfecho con la compra. Las instrucciones son muy claras y el resultado final quedó perfecto. La madera es de muy buena calidad.',
    pros: 'Instrucciones claras, materiales de calidad, acabado profesional',
    cons: 'Requiere más tiempo del estimado',
    status: ReviewStatus.PUBLISHED,
    helpfulCount: 12,
    notHelpfulCount: 1,
    orderNumber: 'ORD-20241201-001',
    createdAt: '2024-12-15T10:30:00Z',
    imageUrls: [
      'https://picsum.photos/400/300?random=101',
      'https://picsum.photos/400/300?random=102'
    ],
    product: {
      sellerName: 'Maderas Mendoza',
      previewImages: ['https://picsum.photos/400/300?random=1']
    },
    sellerResponse: {
      sellerName: 'Carlos Mendoza',
      comment: '¡Muchas gracias por tu review! Nos alegra saber que quedaste satisfecho con el resultado.',
      createdAt: '2024-12-16T08:00:00Z'
    }
  },
  {
    id: 'review_002',
    productId: 'product_002',
    productTitle: 'Silla Escandinava Premium',
    productSlug: 'silla-escandinava-premium',
    rating: 4,
    title: 'Muy buena pero con algunos detalles',
    comment: 'En general estoy contento con el resultado. El diseño es muy bonito y las instrucciones están bien explicadas.',
    status: ReviewStatus.PUBLISHED,
    helpfulCount: 8,
    notHelpfulCount: 0,
    orderNumber: 'ORD-20241120-002',
    createdAt: '2024-12-10T15:45:00Z',
    product: {
      sellerName: 'Nordic Design Co.',
      previewImages: ['https://picsum.photos/400/300?random=3']
    }
  }
]

const mockPendingReviews: PendingReview[] = [
  {
    orderId: 'order_003',
    orderNumber: 'ORD-20241218-003',
    productId: 'product_003',
    productTitle: 'Estantería Industrial Hierro y Madera',
    purchaseDate: '2024-12-18T14:30:00Z',
    product: {
      previewImages: ['https://picsum.photos/400/300?random=5']
    }
  }
]

// Funciones mock
const getReviewsByUserId = (userId: string): Review[] => {
  return mockReviews
}

const getReviewStats = (userId: string) => {
  return {
    totalReviews: mockReviews.length,
    averageRating: 4.5,
    helpfulVotes: 20,
    withImages: 1,
    withSellerResponse: 1,
    pendingCount: mockPendingReviews.length,
    ratingDistribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 }
  }
}

const getPendingReviews = (userId: string): PendingReview[] => {
  return mockPendingReviews
}

export default function ReviewsPage() {
  const t = useTranslations('reviews')
  const tCommon = useTranslations('common')
  const tBreadcrumb = useTranslations('breadcrumb')
  const router = useRouter()
  
  // Stores
  const { isAuthenticated, user, setLoginModalOpen } = useAuthStore()

  // States
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [filterStatus, setFilterStatus] = useState<'ALL' | ReviewStatus>('ALL')
  const [filterRating, setFilterRating] = useState<'ALL' | number>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'helpful'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    helpfulVotes: 0,
    withImages: 0,
    withSellerResponse: 0,
    pendingCount: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })

  // Modal states
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedPendingReview, setSelectedPendingReview] = useState<PendingReview | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoginModalOpen(true)
      router.push('/productos')
      return
    }
  }, [isAuthenticated, setLoginModalOpen, router])

  // Load user reviews
  useEffect(() => {
    if (user?.id) {
      const userReviews = getReviewsByUserId(user.id)
      const userStats = getReviewStats(user.id)
      const userPendingReviews = getPendingReviews(user.id)
      
      setReviews(userReviews)
      setFilteredReviews(userReviews)
      setStats(userStats)
      setPendingReviews(userPendingReviews)
    }
  }, [user?.id])

  // Filter and search reviews
  useEffect(() => {
    let filtered = [...reviews]

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(review => review.status === filterStatus)
    }

    // Filter by rating
    if (filterRating !== 'ALL') {
      filtered = filtered.filter(review => review.rating === filterRating)
    }

    // Search by product name or comment
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(review => 
        review.productTitle.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query) ||
        review.title?.toLowerCase().includes(query) ||
        review.product.sellerName.toLowerCase().includes(query)
      )
    }

    // Sort reviews
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'rating':
          aValue = a.rating
          bValue = b.rating
          break
        case 'helpful':
          aValue = a.helpfulCount
          bValue = b.helpfulCount
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

    setFilteredReviews(filtered)
  }, [reviews, filterStatus, filterRating, searchQuery, sortBy, sortOrder])

  const getStatusBadge = (status: ReviewStatus) => {
    const statusConfig = {
      [ReviewStatus.PENDING_MODERATION]: {
        color: 'bg-yellow-400 text-black border-black',
        icon: ClockIcon,
        text: t('status.pending')
      },
      [ReviewStatus.PUBLISHED]: {
        color: 'bg-green-500 text-white border-black',
        icon: CheckCircleIcon,
        text: t('status.published')
      },
      [ReviewStatus.FLAGGED]: {
        color: 'bg-orange-400 text-black border-black',
        icon: AlertCircleIcon,
        text: t('status.flagged')
      },
      [ReviewStatus.REMOVED]: {
        color: 'bg-red-400 text-black border-black',
        icon: TrashIcon,
        text: t('status.removed')
      }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleWriteReview = (pendingReview: PendingReview) => {
    setSelectedPendingReview(pendingReview)
    setShowReviewModal(true)
  }

  const handleReviewSubmitted = () => {
    if (user?.id) {
      const userReviews = getReviewsByUserId(user.id)
      const userStats = getReviewStats(user.id)
      const userPendingReviews = getPendingReviews(user.id)
      
      setReviews(userReviews)
      setStats(userStats)
      setPendingReviews(userPendingReviews)
    }
    setShowReviewModal(false)
    setSelectedPendingReview(null)
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-yellow-400 border-b-4 border-black p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 text-black font-black text-sm uppercase">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              {tBreadcrumb('home')}
            </Link>
            <span>/</span>
            <span className="text-orange-500">{t('page_title')}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
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
                <MessageSquareIcon className="w-8 h-8" />
                {t('page_title')}
              </h1>
              <p className="text-gray-600 font-bold mt-2">
                {t('page_description')}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <div 
              className="bg-blue-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <MessageSquareIcon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-xl font-black text-black mb-1">{stats.totalReviews}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.total_reviews')}</div>
            </div>
            
            <div 
              className="bg-yellow-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <StarIcon className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-xl font-black text-black mb-1">{stats.averageRating}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.average_rating')}</div>
            </div>
            
            <div 
              className="bg-green-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ThumbsUpIcon className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-xl font-black text-black mb-1">{stats.helpfulVotes}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.helpful_votes')}</div>
            </div>
            
            <div 
              className="bg-purple-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ImageIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-xl font-black text-black mb-1">{stats.withImages}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.with_images')}</div>
            </div>
            
            <div 
              className="bg-orange-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <CheckCircleIcon className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <div className="text-xl font-black text-black mb-1">{stats.withSellerResponse}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.with_response')}</div>
            </div>
            
            <div 
              className="bg-red-100 border-4 border-black p-4 text-center"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <ClockIcon className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <div className="text-xl font-black text-black mb-1">{stats.pendingCount}</div>
              <div className="text-xs font-black text-black uppercase">{t('stats.pending')}</div>
            </div>
          </div>

          {/* Rating Distribution */}
          {stats.totalReviews > 0 && (
            <div 
              className="bg-white border-4 border-black p-6 mb-8"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                <BarChartIcon className="w-5 h-5" />
                {t('rating_distribution.title')}
              </h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution]
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
                  
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="font-black text-black text-sm">{stars}</span>
                        <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-200 border-2 border-black h-4">
                        <div 
                          className="bg-yellow-400 h-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="font-bold text-black text-sm w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <div 
            className="bg-orange-100 border-4 border-black p-6 mb-8"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <h2 className="text-2xl font-black text-black uppercase mb-4 flex items-center gap-2">
              <PlusIcon className="w-6 h-6" />
              {t('pending_reviews.title')}
            </h2>
            <p className="text-gray-700 font-bold mb-4">
              {t('pending_reviews.description', { 
                count: pendingReviews.length,
                productText: pendingReviews.length === 1 ? 'producto' : 'productos'
              })}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingReviews.slice(0, 6).map((pending) => (
                <div 
                  key={`${pending.orderId}-${pending.productId}`}
                  className="bg-white border-3 border-black p-4"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <div className="flex gap-3 mb-3">
                    <div className="relative w-12 h-12 border-2 border-black overflow-hidden">
                      {pending.product.previewImages?.[0] ? (
                        <Image
                          src={pending.product.previewImages[0]}
                          alt={pending.productTitle}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
                          <span className="text-lg">🪵</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-black text-sm uppercase line-clamp-2 mb-1">
                        {pending.productTitle}
                      </h4>
                      <p className="text-xs text-gray-600 font-bold">
                        {t('pending_reviews.purchased')}: {formatDate(pending.purchaseDate)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleWriteReview(pending)}
                    className="w-full bg-green-500 border-2 border-black font-black text-white text-xs uppercase py-2 hover:bg-yellow-400 hover:text-black transition-all"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    {t('pending_reviews.write_review')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div 
          className="bg-white border-4 border-black p-6 mb-8"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black" />
              <input
                type="text"
                placeholder={t('filters.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="ALL">{t('filters.all_statuses')}</option>
              <option value={ReviewStatus.PUBLISHED}>{t('status.published')}</option>
              <option value={ReviewStatus.PENDING_MODERATION}>{t('status.pending')}</option>
              <option value={ReviewStatus.FLAGGED}>{t('status.flagged')}</option>
            </select>

            {/* Rating Filter */}
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="ALL">{t('filters.all_ratings')}</option>
              <option value={5}>{t('filters.stars', { count: 5 })}</option>
              <option value={4}>{t('filters.stars', { count: 4 })}</option>
              <option value={3}>{t('filters.stars', { count: 3 })}</option>
              <option value={2}>{t('filters.stars', { count: 2 })}</option>
              <option value={1}>{t('filters.stars', { count: 1 })}</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="date">{t('filters.sort_by_date')}</option>
              <option value="rating">{t('filters.sort_by_rating')}</option>
              <option value="helpful">{t('filters.sort_by_helpful')}</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <option value="desc">{t('filters.newest')}</option>
              <option value="asc">{t('filters.oldest')}</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div 
            className="bg-gray-100 border-4 border-black p-12 text-center"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-2xl font-black text-black uppercase mb-4">
              {reviews.length === 0 ? t('empty_state.no_reviews') : t('empty_state.no_results')}
            </h2>
            <p className="text-gray-600 font-bold mb-6">
              {reviews.length === 0 
                ? t('empty_state.no_reviews_description')
                : t('empty_state.no_results_description')
              }
            </p>
            <Link 
              href="/productos"
              className="inline-flex items-center gap-2 bg-yellow-400 border-4 border-black px-6 py-3 font-black text-black uppercase hover:bg-orange-500 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              <EyeIcon className="w-4 h-4" />
              {t('empty_state.explore_products')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div 
                key={review.id}
                className="bg-white border-4 border-black p-6 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
                style={{ boxShadow: '6px 6px 0 #000000' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 border-3 border-black overflow-hidden">
                      {review.product.previewImages?.[0] ? (
                        <Image
                          src={review.product.previewImages[0]}
                          alt={review.productTitle}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
                          <span className="text-lg">🪵</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Link 
                        href={`/productos/${review.productSlug}`}
                        className="text-lg font-black text-black uppercase hover:text-orange-500 transition-colors line-clamp-2 mb-1"
                      >
                        {review.productTitle}
                      </Link>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600 font-bold">
                          {review.product.sellerName}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-600 font-bold">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(review.status)}
                        <span className="bg-blue-200 text-black text-xs font-black px-2 py-1 border border-black uppercase">
                          ✓ {t('verified_purchase')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/productos/${review.productSlug}`}
                      className="p-2 bg-blue-400 border-2 border-black hover:bg-yellow-400 transition-all"
                      style={{ boxShadow: '2px 2px 0 #000000' }}
                      title={t('actions.view_product')}
                    >
                      <ExternalLinkIcon className="w-4 h-4 text-black" />
                    </Link>
                    
                    {review.status === ReviewStatus.PUBLISHED && (
                      <button
                        className="p-2 bg-gray-300 border-2 border-black hover:bg-yellow-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                        title={t('actions.edit_review')}
                      >
                        <EditIcon className="w-4 h-4 text-black" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, index) => (
                      <StarIcon 
                        key={index}
                        className={`w-5 h-5 ${index < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="font-black text-black text-lg">{review.rating}/5</span>
                </div>

                {/* Title */}
                {review.title && (
                  <h3 className="text-xl font-black text-black uppercase mb-3">
                    {review.title}
                  </h3>
                )}

                {/* Comment */}
                <p className="text-black leading-relaxed mb-4 font-medium">
                  {review.comment}
                </p>

                {/* Pros & Cons */}
                {(review.pros || review.cons) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {review.pros && (
                      <div 
                        className="bg-green-100 border-2 border-green-500 p-3"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <h4 className="font-black text-green-800 text-sm uppercase mb-2">
                          👍 {t('pros_cons.positive_aspects')}
                        </h4>
                        <p className="text-green-700 text-sm font-medium">{review.pros}</p>
                      </div>
                    )}
                    
                    {review.cons && (
                      <div 
                        className="bg-red-100 border-2 border-red-500 p-3"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <h4 className="font-black text-red-800 text-sm uppercase mb-2">
                          👎 {t('pros_cons.areas_to_improve')}
                        </h4>
                        <p className="text-red-700 text-sm font-medium">{review.cons}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Images */}
                {review.imageUrls && review.imageUrls.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-black text-black text-sm uppercase mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {t('images.title', { count: review.imageUrls.length })}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {review.imageUrls.map((imageUrl, index) => (
                        <div 
                          key={index}
                          className="relative aspect-square border-3 border-black overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                        >
                          <Image
                            src={imageUrl}
                            alt={t('images.result_alt', { index: index + 1 })}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seller Response */}
                {review.sellerResponse && (
                  <div 
                    className="bg-blue-100 border-3 border-blue-500 p-4 mb-4"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-500 border-2 border-black rounded-full flex items-center justify-center">
                        <span className="text-white font-black text-sm">
                          {review.sellerResponse.sellerName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-black text-black text-sm uppercase">
                          {t('seller_response.title', { sellerName: review.sellerResponse.sellerName })}
                        </h4>
                        <p className="text-xs text-gray-600 font-bold">
                          {formatDate(review.sellerResponse.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-blue-800 font-medium">
                      {review.sellerResponse.comment}
                    </p>
                  </div>
                )}

                {/* Stats & Actions */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <ThumbsUpIcon className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-black">{review.helpfulCount}</span>
                      <span className="text-gray-600 font-medium">{t('helpful_votes.helpful')}</span>
                    </div>
                    
                    {review.notHelpfulCount > 0 && (
                      <div className="flex items-center gap-1">
                        <ThumbsDownIcon className="w-4 h-4 text-red-600" />
                        <span className="font-bold text-black">{review.notHelpfulCount}</span>
                        <span className="text-gray-600 font-medium">{t('helpful_votes.not_helpful')}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 font-bold">
                        {t('order_info', { orderNumber: review.orderNumber })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {review.status === ReviewStatus.PUBLISHED && (
                      <Link
                        href={`/productos/${review.productSlug}#reviews`}
                        className="text-sm bg-green-400 border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        {t('actions.view_public')}
                      </Link>
                    )}
                    
                    <Link
                      href={`/pedidos/${review.orderNumber}`}
                      className="text-sm bg-blue-400 border-2 border-black px-3 py-1 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                      style={{ boxShadow: '2px 2px 0 #000000' }}
                    >
                      {t('actions.view_order')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Counter */}
        {filteredReviews.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 font-bold">
              {t('results_counter', { 
                showing: filteredReviews.length, 
                total: reviews.length 
              })}
            </p>
          </div>
        )}

        {/* Tips Section */}
        <div 
          className="bg-purple-100 border-4 border-black p-6 mt-8"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5" />
            💡 {t('tips.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-black text-black uppercase mb-2">{t('tips.increase_impact.title')}</h4>
              <ul className="space-y-1 text-gray-700">
                <li className="font-medium">• {t('tips.increase_impact.include_photos')}</li>
                <li className="font-medium">• {t('tips.increase_impact.be_specific')}</li>
                <li className="font-medium">• {t('tips.increase_impact.mention_tools')}</li>
                <li className="font-medium">• {t('tips.increase_impact.describe_quality')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-black uppercase mb-2">{t('tips.community.title')}</h4>
              <ul className="space-y-1 text-gray-700">
                <li className="font-medium">• {t('tips.community.help_buyers')}</li>
                <li className="font-medium">• {t('tips.community.improve_products')}</li>
                <li className="font-medium">• {t('tips.community.inspire_community')}</li>
                <li className="font-medium">• {t('tips.community.build_trust')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedPendingReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white border-4 border-black p-6 max-w-md w-full"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <h3 className="text-xl font-black text-black uppercase mb-4">
              {t('modal.write_review_title')}
            </h3>
            <p className="text-gray-600 font-bold mb-4">
              {t('modal.product_label')}: {selectedPendingReview.productTitle}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {t('modal.implementation_note')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedPendingReview(null)
                }}
                className="flex-1 bg-gray-400 border-2 border-black font-black text-black uppercase py-2 hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                {tCommon('actions.cancel')}
              </button>
              <button
                onClick={handleReviewSubmitted}
                className="flex-1 bg-green-500 border-2 border-black font-black text-white uppercase py-2 hover:bg-yellow-400 hover:text-black transition-all"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                {t('modal.simulate_review')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}