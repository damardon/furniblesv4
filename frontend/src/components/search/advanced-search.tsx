'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Star,
  DollarSign,
  Calendar,
  Tag,
  Grid,
  List,
  SlidersHorizontal,
  RefreshCw,
  Save,
  Bookmark,
  TrendingUp,
  Users,
  Award,
  Zap,
  MapPin,
  Clock
} from 'lucide-react'
import { ProductCategory, Difficulty } from '@/types'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { NotificationType } from '@/types/additional'
import { cn } from '@/lib/utils'

interface AdvancedSearchState {
  // Búsqueda básica
  query: string
  category: ProductCategory | 'ALL'
  difficulty: Difficulty | 'ALL'
  
  // Filtros de precio
  priceRange: { min: number; max: number }
  currency: 'USD' | 'EUR' | 'MXN'
  
  // Filtros de calidad
  minRating: number | 'ALL'
  minReviews: number | 'ALL'
  
  // Filtros temporales
  dateRange: 'ALL' | '7d' | '30d' | '90d' | '1y' | 'custom'
  customDateStart?: string
  customDateEnd?: string
  
  // Filtros de vendedor
  sellerId?: string
  sellerRating: number | 'ALL'
  verifiedSellers: boolean
  
  // Filtros de contenido
  tags: string[]
  hasImages: boolean
  hasPDF: boolean
  downloadCount: 'ALL' | '1-10' | '11-50' | '51-100' | '100+'
  
  // Filtros avanzados
  complexity: 'ALL' | 'simple' | 'medium' | 'complex'
  buildTime: 'ALL' | '1h' | '1-3h' | '3-6h' | '6h+'
  toolsRequired: string[]
  materials: string[]
  
  // Ordenamiento
  sortBy: 'relevance' | 'recent' | 'popular' | 'rating' | 'price-low' | 'price-high' | 'downloads' | 'reviews'
  sortOrder: 'asc' | 'desc'
  
  // Vista
  viewMode: 'grid' | 'list' | 'compact'
  itemsPerPage: 12 | 24 | 48 | 96
  
  // Filtros sociales
  trending: boolean
  featured: boolean
  newArrivals: boolean
  onSale: boolean
}

interface SavedSearch {
  id: string
  name: string
  filters: AdvancedSearchState
  createdAt: string
  lastUsed: string
}

interface AdvancedSearchProps {
  onSearch: (filters: AdvancedSearchState) => void
  onFiltersChange?: (filters: AdvancedSearchState) => void
  initialFilters?: Partial<AdvancedSearchState>
  showSaveSearch?: boolean
  showPresets?: boolean
  resultCount?: number
  isLoading?: boolean
  className?: string
}

const defaultFilters: AdvancedSearchState = {
  query: '',
  category: 'ALL',
  difficulty: 'ALL',
  priceRange: { min: 0, max: 1000 },
  currency: 'USD',
  minRating: 'ALL',
  minReviews: 'ALL',
  dateRange: 'ALL',
  sellerId: undefined,
  sellerRating: 'ALL',
  verifiedSellers: false,
  tags: [],
  hasImages: false,
  hasPDF: false,
  downloadCount: 'ALL',
  complexity: 'ALL',
  buildTime: 'ALL',
  toolsRequired: [],
  materials: [],
  sortBy: 'relevance',
  sortOrder: 'desc',
  viewMode: 'grid',
  itemsPerPage: 24,
  trending: false,
  featured: false,
  newArrivals: false,
  onSale: false
}

export function AdvancedSearch({
  onSearch,
  onFiltersChange,
  initialFilters = {},
  showSaveSearch = true,
  showPresets = true,
  resultCount,
  isLoading = false,
  className
}: AdvancedSearchProps) {
  const t = useTranslations('advanced_search')
  const tProducts = useTranslations('products')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token } = useAuthStore()
  const { addNotification } = useNotificationStore()
  
  const [filters, setFilters] = useState<AdvancedSearchState>({
    ...defaultFilters,
    ...initialFilters
  })
  
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [saveSearchName, setSaveSearchName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  
  // Opciones predefinidas
  const availableTags = [
    'moderno', 'rustico', 'minimalista', 'vintage', 'industrial', 
    'escandinavo', 'clasico', 'contemporaneo', 'artesanal', 'eco-friendly',
    'DIY', 'principiante', 'avanzado', 'profesional', 'economico'
  ]
  
  const availableTools = [
    'sierra', 'taladro', 'lijadora', 'martillo', 'destornillador',
    'metro', 'nivel', 'escuadra', 'fresadora', 'ingletadora'
  ]
  
  const availableMaterials = [
    'madera', 'metal', 'plastico', 'vidrio', 'tela', 'cuero',
    'pino', 'roble', 'MDF', 'contrachapado', 'acero', 'aluminio'
  ]

  // ✅ CORRIGIENDO LOS PRESETS - tipos exactos
  const presetSearches: Array<{ name: string; filters: AdvancedSearchState }> = [
    {
      name: t('presets.beginner_furniture'),
      filters: { 
        ...defaultFilters, 
        difficulty: Difficulty.BEGINNER, 
        category: ProductCategory.FURNITURE, 
        priceRange: { min: 0, max: 50 }
      }
    },
    {
      name: t('presets.popular_chairs'),
      filters: { 
        ...defaultFilters, 
        category: ProductCategory.CHAIRS, 
        sortBy: 'popular', 
        minRating: 4 
      }
    },
    {
      name: t('presets.recent_tables'),
      filters: { 
        ...defaultFilters, 
        category: ProductCategory.TABLES, 
        dateRange: '30d', 
        sortBy: 'recent'
      }
    },
    {
      name: t('presets.premium_designs'),
      filters: { 
        ...defaultFilters, 
        priceRange: { min: 100, max: 1000 }, 
        minRating: 4.5, 
        verifiedSellers: true 
      }
    }
  ]

  // Helper para crear notificaciones
  const createNotification = (
    type: NotificationType,
    title: string,
    message: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
  ) => ({
    id: `notif-${Date.now()}-${Math.random()}`,
    userId: user?.id || '',
    type,
    title,
    message,
    data: {},
    isRead: false,
    readAt: undefined,
    sentAt: new Date().toISOString(),
    emailSent: false,
    orderId: undefined,
    priority: priority as any,
    channel: 'IN_APP' as any,
    groupKey: undefined,
    expiresAt: undefined,
    clickedAt: undefined,
    clickCount: 0,
    createdAt: new Date().toISOString()
  })

  // Cargar búsquedas guardadas
  useEffect(() => {
    if (user) {
      loadSavedSearches()
    }
  }, [user])

  // Sync con URL
  useEffect(() => {
    const urlFilters: Partial<AdvancedSearchState> = {}
    
    searchParams.forEach((value, key) => {
      switch (key) {
        case 'q':
          urlFilters.query = value
          break
        case 'category':
          // Validar que sea un ProductCategory válido
          if (Object.values(ProductCategory).includes(value as ProductCategory)) {
            urlFilters.category = value as ProductCategory
          }
          break
        case 'difficulty':
          // Validar que sea un Difficulty válido
          if (Object.values(Difficulty).includes(value as Difficulty)) {
            urlFilters.difficulty = value as Difficulty
          }
          break
        case 'sort':
          // Validar sortBy
          const validSorts = ['relevance', 'recent', 'popular', 'rating', 'price-low', 'price-high', 'downloads', 'reviews']
          if (validSorts.includes(value)) {
            urlFilters.sortBy = value as any
          }
          break
        case 'view':
          // Validar viewMode
          if (['grid', 'list', 'compact'].includes(value)) {
            urlFilters.viewMode = value as any
          }
          break
      }
    })

    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }))
    }
  }, [searchParams])

  const loadSavedSearches = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/saved-searches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setSavedSearches(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading saved searches:', error)
    }
  }

  const handleFilterChange = (key: keyof AdvancedSearchState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const handleSearch = () => {
    onSearch(filters)
    updateUrl(filters)
  }

  const updateUrl = (searchFilters: AdvancedSearchState) => {
    const params = new URLSearchParams()
    
    if (searchFilters.query) params.set('q', searchFilters.query)
    if (searchFilters.category !== 'ALL') params.set('category', searchFilters.category)
    if (searchFilters.difficulty !== 'ALL') params.set('difficulty', searchFilters.difficulty)
    if (searchFilters.sortBy !== 'relevance') params.set('sort', searchFilters.sortBy)
    if (searchFilters.viewMode !== 'grid') params.set('view', searchFilters.viewMode)
    
    const url = params.toString() ? `?${params.toString()}` : ''
    router.push(url, { scroll: false })
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    onFiltersChange?.(defaultFilters)
    router.push('', { scroll: false })
  }

  const applyPreset = (preset: typeof presetSearches[0]) => {
    setFilters(preset.filters)
    onFiltersChange?.(preset.filters)
    handleSearch()
  }

  const saveCurrentSearch = async () => {
    if (!saveSearchName.trim()) {
      addNotification(createNotification(
        'VALIDATION_ERROR' as NotificationType,
        t('save_search.error'),
        t('save_search.name_required'),
        'HIGH'
      ))
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/saved-searches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: saveSearchName,
          filters: filters
        }),
      })

      if (response.ok) {
        addNotification(createNotification(
          'SEARCH_SAVED' as NotificationType,
          t('save_search.success'),
          t('save_search.success_message', { name: saveSearchName }),
          'NORMAL'
        ))
        
        setSaveSearchName('')
        setShowSaveDialog(false)
        loadSavedSearches()
      } else {
        throw new Error('Failed to save search')
      }
    } catch (error) {
      addNotification(createNotification(
        'SYSTEM_ERROR' as NotificationType,
        t('save_search.error'),
        t('save_search.error_message'),
        'HIGH'
      ))
    }
  }

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters)
    onFiltersChange?.(savedSearch.filters)
    handleSearch()
  }

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof AdvancedSearchState]
      const defaultValue = defaultFilters[key as keyof AdvancedSearchState]
      return JSON.stringify(value) !== JSON.stringify(defaultValue)
    })
  }, [filters])

  return (
    <div className={cn("bg-white border-4 border-black p-6 space-y-6", className)} style={{ boxShadow: '4px 4px 0 #000000' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-black uppercase flex items-center gap-2">
          <Search className="w-6 h-6" />
          {t('title')}
        </h2>
        
        {typeof resultCount === 'number' && (
          <div className="px-4 py-2 bg-gray-100 border-2 border-black font-bold text-sm">
            {isLoading ? t('searching') : t('results_found', { count: resultCount })}
          </div>
        )}
      </div>

      {/* Main Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-4 py-4 bg-white border-3 border-black font-bold text-lg focus:outline-none focus:bg-yellow-400 transition-all"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          />
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 bg-white border-3 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <option value="ALL">{tProducts('categories.all')}</option>
            <option value={ProductCategory.FURNITURE}>{tProducts('categories.furniture')}</option>
            <option value={ProductCategory.CHAIRS}>{tProducts('categories.chairs')}</option>
            <option value={ProductCategory.TABLES}>{tProducts('categories.tables')}</option>
            <option value={ProductCategory.STORAGE}>{tProducts('categories.storage')}</option>
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="px-3 py-2 bg-white border-3 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <option value="ALL">{t('difficulty.all')}</option>
            <option value={Difficulty.BEGINNER}>{t('difficulty.beginner')}</option>
            <option value={Difficulty.INTERMEDIATE}>{t('difficulty.intermediate')}</option>
            <option value={Difficulty.ADVANCED}>{t('difficulty.advanced')}</option>
            <option value={Difficulty.EXPERT}>{t('difficulty.expert')}</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 bg-white border-3 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <option value="relevance">{t('sort.relevance')}</option>
            <option value="recent">{t('sort.recent')}</option>
            <option value="popular">{t('sort.popular')}</option>
            <option value="rating">{t('sort.rating')}</option>
            <option value="price-low">{t('sort.price_low')}</option>
            <option value="price-high">{t('sort.price_high')}</option>
          </select>

          <select
            value={`${filters.priceRange.min}-${filters.priceRange.max}`}
            onChange={(e) => {
              const [min, max] = e.target.value.split('-').map(Number)
              handleFilterChange('priceRange', { min, max })
            }}
            className="px-3 py-2 bg-white border-3 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <option value="0-1000">{t('price.all')}</option>
            <option value="0-25">{t('price.under_25')}</option>
            <option value="25-50">$25 - $50</option>
            <option value="50-100">$50 - $100</option>
            <option value="100-1000">{t('price.over_100')}</option>
          </select>

          <div className="flex border-3 border-black overflow-hidden">
            <button
              onClick={() => handleFilterChange('viewMode', 'grid')}
              className={cn(
                "flex-1 p-2 font-bold transition-all",
                filters.viewMode === 'grid' 
                  ? "bg-orange-500 text-black" 
                  : "bg-white hover:bg-gray-100"
              )}
            >
              <Grid className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => handleFilterChange('viewMode', 'list')}
              className={cn(
                "flex-1 p-2 font-bold transition-all border-l-2 border-black",
                filters.viewMode === 'list' 
                  ? "bg-orange-500 text-black" 
                  : "bg-white hover:bg-gray-100"
              )}
            >
              <List className="w-4 h-4 mx-auto" />
            </button>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 border-3 border-black font-bold text-sm uppercase transition-all",
              showAdvanced 
                ? "bg-orange-500 text-black" 
                : "bg-white hover:bg-yellow-400"
            )}
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Presets */}
      {showPresets && (
        <div className="border-t-2 border-black pt-4">
          <h3 className="font-black text-black uppercase text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {t('quick_searches')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {presetSearches.map((preset, index) => (
              <button
                key={index}
                onClick={() => applyPreset(preset)}
                className="px-3 py-2 bg-blue-400 border-2 border-black font-bold text-sm uppercase hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t-2 border-black pt-6 space-y-6">
          {/* Quality Filters */}
          <div>
            <h3 className="font-black text-black uppercase text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              {t('quality_filters')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-black text-sm mb-2">{t('min_rating')}</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border-2 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
                >
                  <option value="ALL">{t('any_rating')}</option>
                  <option value="4.5">4.5+ ⭐⭐⭐⭐⭐</option>
                  <option value="4">4+ ⭐⭐⭐⭐</option>
                  <option value="3">3+ ⭐⭐⭐</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-black text-sm mb-2">{t('min_reviews')}</label>
                <select
                  value={filters.minReviews}
                  onChange={(e) => handleFilterChange('minReviews', e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border-2 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
                >
                  <option value="ALL">{t('any_reviews')}</option>
                  <option value="50">50+ {t('reviews')}</option>
                  <option value="10">10+ {t('reviews')}</option>
                  <option value="5">5+ {t('reviews')}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-black text-sm mb-2">{t('downloads')}</label>
                <select
                  value={filters.downloadCount}
                  onChange={(e) => handleFilterChange('downloadCount', e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
                >
                  <option value="ALL">{t('any_downloads')}</option>
                  <option value="100+">100+ {t('downloads')}</option>
                  <option value="51-100">51-100 {t('downloads')}</option>
                  <option value="11-50">11-50 {t('downloads')}</option>
                  <option value="1-10">1-10 {t('downloads')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="font-black text-black uppercase text-sm mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {t('tags')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = filters.tags.includes(tag)
                      ? filters.tags.filter(t => t !== tag)
                      : [...filters.tags, tag]
                    handleFilterChange('tags', newTags)
                  }}
                  className={cn(
                    "px-3 py-1 border-2 border-black text-sm font-bold uppercase transition-all",
                    filters.tags.includes(tag)
                      ? "bg-orange-500 text-black"
                      : "bg-white hover:bg-yellow-400"
                  )}
                  style={{ boxShadow: '1px 1px 0 #000000' }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Content Filters */}
          <div>
            <h3 className="font-black text-black uppercase text-sm mb-3">
              {t('content_filters')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasImages}
                  onChange={(e) => handleFilterChange('hasImages', e.target.checked)}
                  className="w-4 h-4 border-2 border-black"
                />
                <span className="font-bold text-sm">{t('has_images')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasPDF}
                  onChange={(e) => handleFilterChange('hasPDF', e.target.checked)}
                  className="w-4 h-4 border-2 border-black"
                />
                <span className="font-bold text-sm">{t('has_pdf')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.verifiedSellers}
                  onChange={(e) => handleFilterChange('verifiedSellers', e.target.checked)}
                  className="w-4 h-4 border-2 border-black"
                />
                <span className="font-bold text-sm">{t('verified_sellers')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                  className="w-4 h-4 border-2 border-black"
                />
                <span className="font-bold text-sm">{t('featured_only')}</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {user && savedSearches.length > 0 && (
        <div className="border-t-2 border-black pt-4">
          <h3 className="font-black text-black uppercase text-sm mb-3 flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            {t('saved_searches')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {savedSearches.slice(0, 5).map((savedSearch) => (
              <button
                key={savedSearch.id}
                onClick={() => loadSavedSearch(savedSearch)}
                className="px-3 py-2 bg-purple-400 border-2 border-black font-bold text-sm hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                {savedSearch.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 border-t-2 border-black pt-4">
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-400 border-2 border-black font-bold text-sm uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <RefreshCw className="w-4 h-4" />
              {t('reset_filters')}
            </button>
          )}

          {showSaveSearch && user && hasActiveFilters && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-400 border-2 border-black font-bold text-sm uppercase hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <Save className="w-4 h-4" />
              {t('save_search')}
            </button>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="flex items-center gap-2 px-8 py-3 bg-green-500 border-3 border-black font-black text-black uppercase hover:bg-yellow-400 transition-all disabled:opacity-50"
          style={{ boxShadow: '3px 3px 0 #000000' }}
        >
          <Search className="w-5 h-5" />
          {isLoading ? t('searching') : t('search_now')}
        </button>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white border-4 border-black p-6 max-w-md w-full"
            style={{ boxShadow: '8px 8px 0 #000000' }}
          >
            <h3 className="text-xl font-black text-black uppercase mb-4">
              {t('save_search.title')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-black text-sm mb-2">
                  {t('save_search.name_label')}
                </label>
                <input
                  type="text"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  placeholder={t('save_search.name_placeholder')}
                  className="w-full px-3 py-2 bg-white border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveCurrentSearch}
                  className="flex-1 bg-green-500 border-2 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  {t('save_search.save')}
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false)
                    setSaveSearchName('')
                  }}
                  className="flex-1 bg-gray-400 border-2 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  {t('save_search.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}