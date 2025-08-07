'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
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
  RefreshCw
} from 'lucide-react'
import { ProductCategory, Difficulty } from '@/types'

interface PriceRange {
  min: number
  max: number
}

interface FilterState {
  search: string
  category: ProductCategory | 'ALL'
  difficulty: Difficulty | 'ALL'
  priceRange: PriceRange
  rating: number | 'ALL'
  dateRange: 'ALL' | '7d' | '30d' | '90d' | '1y'
  sortBy: 'recent' | 'popular' | 'rating' | 'price-low' | 'price-high' | 'name'
  viewMode: 'grid' | 'list'
  inStock: boolean
  featured: boolean
  tags: string[]
}

interface SearchFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
  showViewToggle?: boolean
  showAdvanced?: boolean
  className?: string
  resultCount?: number
  isLoading?: boolean
}

const defaultFilters: FilterState = {
  search: '',
  category: 'ALL',
  difficulty: 'ALL',
  priceRange: { min: 0, max: 1000 },
  rating: 'ALL',
  dateRange: 'ALL',
  sortBy: 'recent',
  viewMode: 'grid',
  inStock: true,
  featured: false,
  tags: []
}

export function SearchFilters({
  onFiltersChange,
  initialFilters = {},
  showViewToggle = true,
  showAdvanced = true,
  className,
  resultCount,
  isLoading = false
}: SearchFiltersProps) {
  const t = useTranslations('search_filters')
  const tProducts = useTranslations('products')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    ...initialFilters
  })
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [availableTags] = useState([
    'moderno', 'rustico', 'minimalista', 'vintage', 'industrial', 
    'escandinavo', 'clasico', 'contemporaneo', 'artesanal', 'eco-friendly'
  ])

  // Sync with URL params
  useEffect(() => {
    const urlFilters: Partial<FilterState> = {}
    
    searchParams.forEach((value, key) => {
      switch (key) {
        case 'q':
          urlFilters.search = value
          break
        case 'categoria':
          urlFilters.category = value as ProductCategory
          break
        case 'dificultad':
          urlFilters.difficulty = value as Difficulty
          break
        case 'precio_min':
          urlFilters.priceRange = { 
            ...filters.priceRange, 
            min: parseInt(value) || 0 
          }
          break
        case 'precio_max':
          urlFilters.priceRange = { 
            ...filters.priceRange, 
            max: parseInt(value) || 1000 
          }
          break
        case 'rating':
          urlFilters.rating = value === 'ALL' ? 'ALL' : parseInt(value)
          break
        case 'orden':
          urlFilters.sortBy = value as FilterState['sortBy']
          break
        case 'vista':
          urlFilters.viewMode = value as 'grid' | 'list'
          break
        case 'tags':
          urlFilters.tags = value.split(',').filter(Boolean)
          break
      }
    })

    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }))
    }
  }, [searchParams])

  // Update URL when filters change
  const updateUrl = (newFilters: FilterState) => {
    const params = new URLSearchParams()
    
    if (newFilters.search) params.set('q', newFilters.search)
    if (newFilters.category !== 'ALL') params.set('categoria', newFilters.category)
    if (newFilters.difficulty !== 'ALL') params.set('dificultad', newFilters.difficulty)
    if (newFilters.priceRange.min > 0) params.set('precio_min', newFilters.priceRange.min.toString())
    if (newFilters.priceRange.max < 1000) params.set('precio_max', newFilters.priceRange.max.toString())
    if (newFilters.rating !== 'ALL') params.set('rating', newFilters.rating.toString())
    if (newFilters.sortBy !== 'recent') params.set('orden', newFilters.sortBy)
    if (newFilters.viewMode !== 'grid') params.set('vista', newFilters.viewMode)
    if (newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','))
    
    const url = params.toString() ? `?${params.toString()}` : ''
    router.push(url, { scroll: false })
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
    updateUrl(newFilters)
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
    router.push('', { scroll: false })
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    handleFilterChange('tags', newTags)
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.category !== 'ALL' ||
      filters.difficulty !== 'ALL' ||
      filters.priceRange.min > 0 ||
      filters.priceRange.max < 1000 ||
      filters.rating !== 'ALL' ||
      filters.dateRange !== 'ALL' ||
      !filters.inStock ||
      filters.featured ||
      filters.tags.length > 0
    )
  }, [filters])

  const categories = [
    { value: 'ALL', label: tProducts('categories.all') },
    { value: ProductCategory.LIVING_DINING, label: tProducts('categories.living_dining') },
    { value: ProductCategory.BEDROOM, label: tProducts('categories.bedroom') },
    { value: ProductCategory.OUTDOOR, label: tProducts('categories.outdoor') },
    { value: ProductCategory.STORAGE, label: tProducts('categories.storage') },
    { value: ProductCategory.NORDIC, label: tProducts('categories.nordic') },
    { value: ProductCategory.DECORATIVE, label: tProducts('categories.decorative') },
    { value: ProductCategory.FURNITURE, label: tProducts('categories.furniture') },
    { value: ProductCategory.BEDS, label: tProducts('categories.beds') },
    { value: ProductCategory.OFFICE, label: tProducts('categories.office') },
    { value: ProductCategory.BATHROOM, label: tProducts('categories.bathroom') },    
    { value: ProductCategory.KITCHEN, label: tProducts('categories.kitchen') },  
  ]

  const difficulties = [
    { value: 'ALL', label: t('difficulty.all') },
    { value: Difficulty.BEGINNER, label: t('difficulty.easy') },
    { value: Difficulty.INTERMEDIATE, label: t('difficulty.intermediate') },
    { value: Difficulty.ADVANCED, label: t('difficulty.advanced') }
  ]

  const sortOptions = [
    { value: 'recent', label: t('sort.recent') },
    { value: 'popular', label: t('sort.popular') },
    { value: 'rating', label: t('sort.rating') },
    { value: 'price-low', label: t('sort.price_low') },
    { value: 'price-high', label: t('sort.price_high') },
    { value: 'name', label: t('sort.name') }
  ]

  return (
    <div className={cn("bg-white border-4 border-black p-6", className)} style={{ boxShadow: '4px 4px 0 #000000' }}>
      {/* Search and Results Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-3 border-black font-medium focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Results Count */}
          {typeof resultCount === 'number' && (
            <div className="px-3 py-2 bg-gray-100 border-2 border-black font-bold text-sm whitespace-nowrap">
              {isLoading ? t('loading') : t('results_count', { count: resultCount })}
            </div>
          )}

          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex border-2 border-black overflow-hidden">
              <button
                onClick={() => handleFilterChange('viewMode', 'grid')}
                className={cn(
                  "p-2 transition-colors",
                  filters.viewMode === 'grid' 
                    ? "bg-orange-500 text-white" 
                    : "bg-white hover:bg-gray-100"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFilterChange('viewMode', 'list')}
                className={cn(
                  "p-2 transition-colors border-l-2 border-black",
                  filters.viewMode === 'list' 
                    ? "bg-orange-500 text-white" 
                    : "bg-white hover:bg-gray-100"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full px-3 py-2 bg-white border-3 border-black font-medium focus:outline-none focus:bg-yellow-400 transition-all"
          style={{ boxShadow: '2px 2px 0 #000000' }}
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        {/* Difficulty */}
        <select
          value={filters.difficulty}
          onChange={(e) => handleFilterChange('difficulty', e.target.value)}
          className="w-full px-3 py-2 bg-white border-3 border-black font-medium focus:outline-none focus:bg-yellow-400 transition-all"
          style={{ boxShadow: '2px 2px 0 #000000' }}
        >
          {difficulties.map(diff => (
            <option key={diff.value} value={diff.value}>{diff.label}</option>
          ))}
        </select>

        {/* Sort By */}
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="w-full px-3 py-2 bg-white border-3 border-black font-medium focus:outline-none focus:bg-yellow-400 transition-all"
          style={{ boxShadow: '2px 2px 0 #000000' }}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {/* Price Range Quick Select */}
        <select
          value={`${filters.priceRange.min}-${filters.priceRange.max}`}
          onChange={(e) => {
            const [min, max] = e.target.value.split('-').map(Number)
            handleFilterChange('priceRange', { min, max })
          }}
          className="w-full px-3 py-2 bg-white border-3 border-black font-medium focus:outline-none focus:bg-yellow-400 transition-all"
          style={{ boxShadow: '2px 2px 0 #000000' }}
        >
          <option value="0-1000">{t('price.all')}</option>
          <option value="0-25">{t('price.under_25')}</option>
          <option value="25-50">$25 - $50</option>
          <option value="50-100">$50 - $100</option>
          <option value="100-200">$100 - $200</option>
          <option value="200-1000">{t('price.over_200')}</option>
        </select>

        {/* Advanced Filters Toggle */}
        {showAdvanced && (
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 border-3 border-black font-bold text-sm uppercase transition-all",
              showAdvancedFilters 
                ? "bg-orange-500 text-white" 
                : "bg-white hover:bg-yellow-400"
            )}
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('advanced')}
            {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && showAdvancedFilters && (
        <div 
          className="border-t-2 border-black pt-6 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Price Range Sliders */}
            <div className="space-y-3">
              <label className="block font-black text-black text-sm uppercase">
                <DollarSign className="w-4 h-4 inline mr-1" />
                {t('price_range')}
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold w-8">${filters.priceRange.min}</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="5"
                    value={filters.priceRange.min}
                    onChange={(e) => handleFilterChange('priceRange', {
                      ...filters.priceRange,
                      min: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold w-12">${filters.priceRange.max}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="5"
                  value={filters.priceRange.max}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    max: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-3">
              <label className="block font-black text-black text-sm uppercase">
                <Star className="w-4 h-4 inline mr-1" />
                {t('min_rating')}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => handleFilterChange('rating', filters.rating === rating ? 'ALL' : rating)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 border-2 border-black text-sm font-bold transition-all",
                      filters.rating === rating 
                        ? "bg-yellow-400 text-black" 
                        : "bg-white hover:bg-gray-100"
                    )}
                    style={{ boxShadow: '1px 1px 0 #000000' }}
                  >
                    {rating}
                    <Star className="w-3 h-3 fill-current" />
                  </button>
                ))}
                <button
                  onClick={() => handleFilterChange('rating', 'ALL')}
                  className={cn(
                    "px-2 py-1 border-2 border-black text-sm font-bold transition-all",
                    filters.rating === 'ALL' 
                      ? "bg-yellow-400 text-black" 
                      : "bg-white hover:bg-gray-100"
                  )}
                  style={{ boxShadow: '1px 1px 0 #000000' }}
                >
                  {t('all')}
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <label className="block font-black text-black text-sm uppercase">
                <Calendar className="w-4 h-4 inline mr-1" />
                {t('date_added')}
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-black font-medium focus:outline-none focus:bg-yellow-400 transition-all"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                <option value="ALL">{t('date.all_time')}</option>
                <option value="7d">{t('date.last_7_days')}</option>
                <option value="30d">{t('date.last_30_days')}</option>
                <option value="90d">{t('date.last_90_days')}</option>
                <option value="1y">{t('date.last_year')}</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label className="block font-black text-black text-sm uppercase">
              <Tag className="w-4 h-4 inline mr-1" />
              {t('tags')}
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1 border-2 border-black text-sm font-bold uppercase transition-all",
                    filters.tags.includes(tag)
                      ? "bg-orange-500 text-white"
                      : "bg-white hover:bg-yellow-400"
                  )}
                  style={{ boxShadow: '1px 1px 0 #000000' }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Options */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                className="w-4 h-4 border-2 border-black"
              />
              <span className="font-bold text-sm">{t('in_stock_only')}</span>
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
      )}

      {/* Active Filters & Reset */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-4 border-t-2 border-black">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-bold text-gray-600">
              {t('active_filters')}:
            </span>
            <div className="flex flex-wrap gap-1">
              {filters.search && (
                <span className="px-2 py-1 bg-blue-100 border border-black text-xs font-bold">
                  "{filters.search}"
                </span>
              )}
              {filters.category !== 'ALL' && (
                <span className="px-2 py-1 bg-green-100 border border-black text-xs font-bold">
                  {categories.find(c => c.value === filters.category)?.label}
                </span>
              )}
              {filters.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-orange-100 border border-black text-xs font-bold">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1 bg-gray-200 border-2 border-black font-bold text-sm uppercase hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <RefreshCw className="w-3 h-3" />
            {t('reset')}
          </button>
        </div>
      )}
    </div>
  )
}