'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  Search,
  Star,
  Package,
  MapPin,
  Globe,
  Phone,
  CheckCircle,
  ShoppingBag,
  Users,
  TrendingUp,
  Filter,
  Grid3X3,
  List,
  Award
} from 'lucide-react'

// ✅ Types correctos basados en tu schema de Prisma
interface SellerProfile {
  id: string
  userId: string
  storeName: string
  slug: string
  description?: string | null
  rating: number
  totalSales: number
  totalReviews: number
  isVerified: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
    isActive: boolean
  }
}

interface SellersResponse {
  data: SellerProfile[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<SellerProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'sales' | 'newest'>('rating')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const t = useTranslations('seller')
  const tCommon = useTranslations('common')

  // ✅ Función para cargar vendedores desde el API real
  useEffect(() => {
    const loadSellers = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        console.log('🔍 [FRONTEND] Loading sellers from API...')
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        console.log('🔍 [FRONTEND] API Response status:', response.status)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data: SellersResponse = await response.json()
        console.log('🔍 [FRONTEND] Sellers loaded:', data.data.length)
        
        setSellers(data.data)
      } catch (error) {
        console.error('❌ [FRONTEND] Error loading sellers:', error)
        setError(error instanceof Error ? error.message : 'Error loading sellers')
        
        // ⚠️ Fallback a datos mock solo en caso de error
        console.log('⚠️ [FRONTEND] Using fallback mock data')
        const mockSellers: SellerProfile[] = [
          {
            id: 'cmdjni1ny00026693cjf4vaz1',
            userId: 'cmdjni1nr00006693aw9c9022',
            storeName: 'Furnibles Official Store',
            slug: 'furnibles-official',
            description: 'Tienda oficial de Furnibles con los mejores diseños',
            rating: 4.9,
            totalSales: 50,
            totalReviews: 0,
            isVerified: true,
            createdAt: '2025-07-26T02:48:30.958Z',
            updatedAt: '2025-07-26T02:48:30.958Z',
            user: {
              id: 'cmdjni1nr00006693aw9c9022',
              firstName: 'Admin',
              lastName: 'Furnibles',
              avatar: null,
              isActive: true,
            }
          },
          {
            id: 'cmdjni1xh000766939p4zg67e',
            userId: 'cmdjni1xb00056693ufmi55eh',
            storeName: 'Muebles Juan',
            slug: 'muebles-juan',
            description: 'Especialista en muebles de madera rústicos y modernos con 15 años de experiencia',
            rating: 4.7,
            totalSales: 127,
            totalReviews: 0,
            isVerified: true,
            createdAt: '2025-07-26T02:48:31.301Z',
            updatedAt: '2025-07-26T02:48:31.301Z',
            user: {
              id: 'cmdjni1xb00056693ufmi55eh',
              firstName: 'Juan',
              lastName: 'Carpintero',
              avatar: null,
              isActive: true,
            }
          },
          {
            id: 'cmdjni2h3000f66937myjjddx',
            userId: 'cmdjni2gs000b6693ujffm30z',
            storeName: 'Ana Designs',
            slug: 'ana-designs',
            description: 'Diseños únicos y personalizados con enfoque minimalista',
            rating: 4.8,
            totalSales: 23,
            totalReviews: 0,
            isVerified: true,
            createdAt: '2025-07-26T02:48:32.008Z',
            updatedAt: '2025-07-26T02:48:32.008Z',
            user: {
              id: 'cmdjni2gs000b6693ujffm30z',
              firstName: 'Ana',
              lastName: 'Híbrida',
              avatar: null,
              isActive: true,
            }
          }
        ]
        setSellers(mockSellers)
      } finally {
        setIsLoading(false)
      }
    }

    loadSellers()
  }, [])

  // Filtrar y ordenar vendedores
  const filteredSellers = sellers
    .filter(seller =>
      seller.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'sales':
          return b.totalSales - a.totalSales
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const renderSellerCard = (seller: SellerProfile) => (
    <div
      key={seller.id}
      className="bg-white border-[4px] border-black transition-all duration-300 group hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[11px_11px_0_#000000] h-full flex flex-col"
      style={{ boxShadow: '8px 8px 0 #000000' }}
    >
      {/* Banner placeholder */}
      <div className="relative h-32 overflow-hidden border-b-4 border-black">
        <div className="w-full h-full bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center">
          <Package className="w-12 h-12 text-black opacity-20" />
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        {/* Header con avatar y nombre */}
        <div className="flex items-start gap-4 mb-4 min-h-[80px]">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 border-4 border-black overflow-hidden bg-orange-500">
              {seller.user.avatar ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/image/${seller.user.avatar}`}
                  alt={seller.storeName}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-black font-black text-xl">
                    {seller.user.firstName?.charAt(0) || seller.storeName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            {seller.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 border-2 border-black p-1 rounded-sm">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <h3 className="font-black text-lg text-black uppercase truncate leading-tight">
                {seller.storeName}
              </h3>
              {seller.isVerified && (
                <span className="bg-blue-500 text-white text-xs font-black px-2 py-1 border-2 border-black flex-shrink-0">
                  {t('verified')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 font-bold">
              {t('by_seller', { 
                firstName: seller.user.firstName, 
                lastName: seller.user.lastName 
              })}
            </p>
          </div>
        </div>

        {/* Descripción */}
        <div className="mb-4 min-h-[60px]">
          <p className="text-black text-sm line-clamp-3 font-medium">
            {seller.description || t('default_description', { 
              firstName: seller.user.firstName, 
              lastName: seller.user.lastName 
            })}
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 fill-orange-500 text-orange-500 flex-shrink-0" />
              <span className="font-black text-black">{seller.rating.toFixed(1)}</span>
            </div>
            <p className="text-xs font-bold text-gray-600 leading-tight">
              {t('stats.reviews_count', { count: seller.totalReviews })}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ShoppingBag className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="font-black text-black">{formatNumber(seller.totalSales)}</span>
            </div>
            <p className="text-xs font-bold text-gray-600 leading-tight">{t('stats.sales')}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="font-black text-black">+</span>
            </div>
            <p className="text-xs font-bold text-gray-600 leading-tight">{t('stats.products')}</p>
          </div>
        </div>

        {/* Botón de ver tienda */}
        <div className="mt-auto">
          <Link href={`/vendedores/${seller.slug}`}>
            <button
              className="w-full bg-orange-500 border-3 border-black font-black text-black text-sm uppercase py-3 hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              {t('actions.view_store')}
            </button>
          </Link>
        </div>
      </div>
    </div>
  )

  const renderSellerList = (seller: SellerProfile) => (
    <div
      key={seller.id}
      className="bg-white border-[3px] border-black p-4 mb-4 transition-all duration-300 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000000]"
      style={{ boxShadow: '4px 4px 0 #000000' }}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 border-3 border-black overflow-hidden bg-orange-500">
            {seller.user.avatar ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/image/${seller.user.avatar}`}
                alt={seller.storeName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-black font-black">
                  {seller.user.firstName?.charAt(0) || seller.storeName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          {seller.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 border border-black p-0.5 rounded-sm">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-black uppercase">{seller.storeName}</h3>
            {seller.isVerified && (
              <span className="bg-blue-500 text-white text-xs font-black px-1 py-0.5 border border-black">
                ✓
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 font-bold mb-2 line-clamp-2">
            {seller.description || t('default_description', { 
              firstName: seller.user.firstName, 
              lastName: seller.user.lastName 
            })}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
              <strong>{seller.rating.toFixed(1)}</strong> ({seller.totalReviews})
            </span>
            <span className="flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-green-600" />
              <strong>{formatNumber(seller.totalSales)} {t('stats.sales')}</strong>
            </span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <Link href={`/vendedores/${seller.slug}`}>
            <button
              className="px-4 py-2 bg-orange-500 border-2 border-black font-black text-black text-xs uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              {t('actions.view_store')}
            </button>
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-[5px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black uppercase text-black mb-4">
              {t('title')}            
            </h1>
            <p className="text-lg font-bold text-gray-700 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border-2 border-black font-bold bg-white focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                <option value="rating">{t('sort.best_rated')}</option>
                <option value="sales">{t('sort.most_sales')}</option>
                <option value="newest">{t('sort.newest')}</option>
              </select>

              <div className="flex border-2 border-black">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500' : 'bg-white'} border-r border-black`}
                  title={t('view.grid')}
                >
                  <Grid3X3 className="w-4 h-4 text-black" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-orange-500' : 'bg-white'}`}
                  title={t('view.list')}
                >
                  <List className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-black font-bold">
            {isLoading ? 
              tCommon('loading') : 
              t('results_count', { count: filteredSellers.length })
            }
            {error && (
              <span className="text-red-600 ml-2">
                ⚠️ {error} ({tCommon('using_fallback_data')})
              </span>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
              <p className="text-xl font-bold text-gray-600">{t('loading_sellers')}</p>
            </div>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-gray-600 mb-2">{t('no_sellers.title')}</h3>
            <p className="text-gray-500">{t('no_sellers.description')}</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "space-y-4"
          }>
            {filteredSellers.map(seller => 
              viewMode === 'grid' ? renderSellerCard(seller) : renderSellerList(seller)
            )}
          </div>
        )}
      </div>
    </div>
  )
}