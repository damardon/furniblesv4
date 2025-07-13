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

// Types (basados en tu schema)
interface SellerProfile {
  id: string
  storeName: string
  slug: string
  description?: string
  website?: string
  phone?: string
  avatar?: string
  banner?: string
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
    email: string
  }
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<SellerProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'sales' | 'newest'>('rating')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)

  const t = useTranslations('sellers')

  // Mock data mientras implementas la API real
  useEffect(() => {
    const loadSellers = async () => {
      setIsLoading(true)
      try {
        // Simular API call - reemplazar con fetch real
        const mockSellers: SellerProfile[] = [
          {
            id: '1',
            storeName: 'Muebles Artesanales El Roble',
            slug: 'muebles-el-roble',
            description: 'Especialistas en muebles rústicos de madera maciza con más de 15 años de experiencia.',
            website: 'https://elroble.com',
            phone: '+34 123 456 789',
            avatar: 'https://picsum.photos/100/100?random=101',
            banner: 'https://picsum.photos/800/200?random=201',
            rating: 4.8,
            totalSales: 245,
            totalReviews: 128,
            isVerified: true,
            createdAt: '2023-01-15T00:00:00Z',
            updatedAt: '2024-12-01T00:00:00Z',
            user: {
              id: 'user1',
              firstName: 'Carlos',
              lastName: 'Martínez',
              email: 'carlos@elroble.com'
            }
          },
          {
            id: '2',
            storeName: 'Diseños Modernos Luna',
            slug: 'disenos-luna',
            description: 'Muebles contemporáneos y minimalistas para espacios modernos.',
            website: 'https://diseñosluna.es',
            avatar: 'https://picsum.photos/100/100?random=102',
            banner: 'https://picsum.photos/800/200?random=202',
            rating: 4.6,
            totalSales: 189,
            totalReviews: 95,
            isVerified: true,
            createdAt: '2023-03-20T00:00:00Z',
            updatedAt: '2024-11-28T00:00:00Z',
            user: {
              id: 'user2',
              firstName: 'Ana',
              lastName: 'González',
              email: 'ana@diseñosluna.es'
            }
          },
          {
            id: '3',
            storeName: 'Carpintería Tradicional Vega',
            slug: 'carpinteria-vega',
            description: 'Técnicas tradicionales aplicadas a diseños contemporáneos.',
            phone: '+34 987 654 321',
            avatar: 'https://picsum.photos/100/100?random=103',
            rating: 4.9,
            totalSales: 156,
            totalReviews: 89,
            isVerified: false,
            createdAt: '2023-06-10T00:00:00Z',
            updatedAt: '2024-12-05T00:00:00Z',
            user: {
              id: 'user3',
              firstName: 'Miguel',
              lastName: 'Vega',
              email: 'miguel@vega.com'
            }
          },
          {
            id: '4',
            storeName: 'Eco Muebles Sostenibles',
            slug: 'eco-muebles',
            description: 'Muebles ecológicos fabricados con materiales sostenibles y técnicas respetuosas.',
            website: 'https://ecomuebles.org',
            avatar: 'https://picsum.photos/100/100?random=104',
            banner: 'https://picsum.photos/800/200?random=204',
            rating: 4.7,
            totalSales: 78,
            totalReviews: 42,
            isVerified: true,
            createdAt: '2023-09-05T00:00:00Z',
            updatedAt: '2024-11-30T00:00:00Z',
            user: {
              id: 'user4',
              firstName: 'Laura',
              lastName: 'Fernández',
              email: 'laura@ecomuebles.org'
            }
          }
        ]

        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500))
        setSellers(mockSellers)
      } catch (error) {
        console.error('Error loading sellers:', error)
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
      className="bg-white border-[5px] border-black transition-all duration-300 group hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[11px_11px_0_#000000]"
      style={{ boxShadow: '8px 8px 0 #000000' }}
    >
      {/* Banner */}
      {seller.banner && (
        <div className="relative h-32 overflow-hidden border-b-4 border-black">
          <Image
            src={seller.banner}
            alt={`Banner de ${seller.storeName}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="p-6">
        {/* Header con avatar y nombre */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            {seller.avatar ? (
              <div className="w-16 h-16 border-4 border-black overflow-hidden">
                <Image
                  src={seller.avatar}
                  alt={seller.storeName}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-orange-500 border-4 border-black flex items-center justify-center">
                <span className="text-black font-black text-xl">
                  {seller.user.firstName?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            {seller.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 border-2 border-black p-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-lg text-black uppercase truncate">
                {seller.storeName}
              </h3>
              {seller.isVerified && (
                <span className="bg-blue-500 text-white text-xs font-black px-2 py-1 border-2 border-black">
                  VERIFICADO
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 font-bold">
              Por {seller.user.firstName} {seller.user.lastName}
            </p>
          </div>
        </div>

        {/* Descripción */}
        {seller.description && (
          <p className="text-black text-sm mb-4 line-clamp-2 font-medium">
            {seller.description}
          </p>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span className="font-black text-black">{seller.rating.toFixed(1)}</span>
            </div>
            <p className="text-xs font-bold text-gray-600">{seller.totalReviews} reviews</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ShoppingBag className="w-4 h-4 text-green-600" />
              <span className="font-black text-black">{formatNumber(seller.totalSales)}</span>
            </div>
            <p className="text-xs font-bold text-gray-600">ventas</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="font-black text-black">+</span>
            </div>
            <p className="text-xs font-bold text-gray-600">productos</p>
          </div>
        </div>

        {/* Enlaces de contacto */}
        <div className="flex items-center gap-2 mb-4">
          {seller.website && (
            <a
              href={seller.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-blue-400 border-2 border-black hover:bg-blue-500 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <Globe className="w-4 h-4 text-black" />
            </a>
          )}
          {seller.phone && (
            <a
              href={`tel:${seller.phone}`}
              className="p-2 bg-green-400 border-2 border-black hover:bg-green-500 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <Phone className="w-4 h-4 text-black" />
            </a>
          )}
        </div>

        {/* Botón de ver tienda */}
        <Link href={`/vendedores/${seller.slug}`}>
          <button
            className="w-full bg-orange-500 border-3 border-black font-black text-black text-sm uppercase py-3 hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            VER TIENDA
          </button>
        </Link>
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
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {seller.avatar ? (
            <div className="w-12 h-12 border-3 border-black overflow-hidden">
              <Image
                src={seller.avatar}
                alt={seller.storeName}
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 bg-orange-500 border-3 border-black flex items-center justify-center">
              <span className="text-black font-black">
                {seller.user.firstName?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          {seller.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 border border-black p-0.5">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-black uppercase">{seller.storeName}</h3>
            {seller.isVerified && (
              <span className="bg-blue-500 text-white text-xs font-black px-1 py-0.5 border border-black">
                ✓
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 font-bold mb-2">
            {seller.description || `Tienda de ${seller.user.firstName} ${seller.user.lastName}`}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
              <strong>{seller.rating.toFixed(1)}</strong> ({seller.totalReviews})
            </span>
            <span className="flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-green-600" />
              <strong>{formatNumber(seller.totalSales)} ventas</strong>
            </span>
          </div>
        </div>

        {/* Botón de acción */}
        <div className="flex-shrink-0">
          <Link href={`/vendedores/${seller.slug}`}>
            <button
              className="px-4 py-2 bg-orange-500 border-2 border-black font-black text-black text-xs uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              VER TIENDA
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
              🏪 DIRECTORIO DE VENDEDORES
            </h1>
            <p className="text-lg font-bold text-gray-700 max-w-2xl mx-auto">
              Descubre las mejores tiendas de muebles artesanales. 
              Conecta directamente con diseñadores y carpinteros expertos.
            </p>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tiendas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3">
              {/* Ordenar */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border-2 border-black font-bold bg-white focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                <option value="rating">Mejor valorados</option>
                <option value="sales">Más ventas</option>
                <option value="newest">Más recientes</option>
              </select>

              {/* Vista */}
              <div className="flex border-2 border-black">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500' : 'bg-white'} border-r border-black`}
                >
                  <Grid3X3 className="w-4 h-4 text-black" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-orange-500' : 'bg-white'}`}
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
        {/* Stats */}
        <div className="mb-8">
          <p className="text-black font-bold">
            {isLoading ? 'Cargando...' : `${filteredSellers.length} vendedores encontrados`}
          </p>
        </div>

        {/* Lista/Grid de vendedores */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
              <p className="text-xl font-bold text-gray-600">Cargando vendedores...</p>
            </div>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-gray-600 mb-2">No se encontraron vendedores</h3>
            <p className="text-gray-500">Intenta con otros términos de búsqueda</p>
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