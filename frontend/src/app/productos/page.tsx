'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { ProductCard } from '@/components/products/product-card'
import { Search, Filter } from 'lucide-react'
import { mockProducts } from '@/data/mockProducts'
import { ProductCategory, Difficulty } from '@/types'

type SortOption = 'newest' | 'popular' | 'price_low' | 'price_high' | 'rating'
type CategoryFilter = 'all' | ProductCategory
type DifficultyFilter = 'all' | Difficulty

export default function ProductsPage() {
  const t = useTranslations('products')
  const tCommon = useTranslations('common')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Filtrar y ordenar productos
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = mockProducts

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        product.seller.sellerProfile?.storeName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    // Filtrar por dificultad
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(product => product.difficulty === difficultyFilter)
    }

    // Ordenar
    switch (sortBy) {
      case 'popular':
        return filtered.sort((a, b) => b.downloadCount - a.downloadCount)
      case 'price_low':
        return filtered.sort((a, b) => a.price - b.price)
      case 'price_high':
        return filtered.sort((a, b) => b.price - a.price)
      case 'rating':
        return filtered.sort((a, b) => b.rating - a.rating)
      case 'newest':
      default:
        return filtered.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.createdAt).getTime()
          const dateB = new Date(b.publishedAt || b.createdAt).getTime()
          return dateB - dateA
        })
    }
  }, [searchTerm, categoryFilter, difficultyFilter, sortBy])

  const categories = [
    { value: 'all' as const, label: t('categories.all') },
    { value: ProductCategory.FURNITURE, label: t('categories.furniture') },
    { value: ProductCategory.CHAIRS, label: t('categories.chairs') },
    { value: ProductCategory.TABLES, label: t('categories.tables') },
    { value: ProductCategory.BEDS, label: t('categories.beds') },
    { value: ProductCategory.STORAGE, label: t('categories.storage') },
    { value: ProductCategory.OUTDOOR, label: t('categories.outdoor') },
    { value: ProductCategory.DECORATIVE, label: t('categories.decorative') },
    { value: ProductCategory.OFFICE, label: t('categories.office') },
  ]

  const difficulties = [
    { value: 'all' as const, label: t('difficulties.all') },
    { value: Difficulty.BEGINNER, label: t('difficulties.beginner') },
    { value: Difficulty.INTERMEDIATE, label: t('difficulties.intermediate') },
    { value: Difficulty.ADVANCED, label: t('difficulties.advanced') },
  ]

  const sortOptions = [
    { value: 'newest' as const, label: t('sort.newest') },
    { value: 'popular' as const, label: t('sort.popular') },
    { value: 'rating' as const, label: t('sort.rating') },
    { value: 'price_low' as const, label: t('sort.price_low') },
    { value: 'price_high' as const, label: t('sort.price_high') },
  ]

  const clearAllFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setDifficultyFilter('all')
  }

  return (
    <div className="min-h-screen px-8 py-12">
      {/* Header de la página SABDA */}
      <div 
        className="bg-gradient-to-br from-blue-200 to-cyan-200 border-[5px] border-black py-16 mb-12 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
        style={{ boxShadow: '8px 8px 0 #000000' }}
      >
        <div className="text-center">
          <div 
            className="bg-orange-500 text-black inline-block mb-6 px-4 py-2 border-3 border-black font-black text-sm uppercase tracking-wide"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            {t('header.badge')}
          </div>
          <h1 className="text-black mb-6 font-black text-6xl leading-tight uppercase">
            {t('header.title')}
          </h1>
          <p className="text-black font-bold text-xl max-w-2xl mx-auto">
            {t('header.subtitle')}
          </p>
        </div>
      </div>

      {/* Barra de búsqueda y filtros SABDA */}
      <div 
        className="bg-white border-[5px] border-black p-8 mb-12 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
        style={{ boxShadow: '8px 8px 0 #000000' }}
      >
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            />
          </div>

          {/* Filtros de categoría */}
          <div className="flex flex-wrap gap-3">
            {categories.slice(0, 5).map((category) => (
              <button
                key={category.value}
                onClick={() => setCategoryFilter(category.value)}
                className={`px-4 py-2 font-black text-sm uppercase border-3 border-black transition-all ${
                  categoryFilter === category.value
                    ? 'bg-orange-500 text-black'
                    : 'bg-white text-black hover:bg-yellow-400'
                }`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Más filtros */}
          <div className="flex items-center gap-4">
            {/* Dificultad */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
              className="px-4 py-3 border-3 border-black bg-white font-bold focus:outline-none focus:bg-yellow-400"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </select>

            {/* Ordenar */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 border-3 border-black bg-white font-bold focus:outline-none focus:bg-yellow-400"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 items-center">
          <span 
            className="bg-yellow-400 text-black px-4 py-2 border-3 border-black font-black text-sm uppercase"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            {t('results.count', { count: filteredAndSortedProducts.length })}
          </span>
          
          {searchTerm && (
            <span 
              className="bg-blue-400 text-black px-4 py-2 border-3 border-black font-black text-sm uppercase"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              {t('results.search_label')}: "{searchTerm.toUpperCase()}"
            </span>
          )}
          
          {categoryFilter !== 'all' && (
            <span 
              className="bg-orange-500 text-black px-4 py-2 border-3 border-black font-black text-sm uppercase"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              {t('results.category_label')}: {categories.find(c => c.value === categoryFilter)?.label.toUpperCase()}
            </span>
          )}

          {difficultyFilter !== 'all' && (
            <span 
              className="bg-green-400 text-black px-4 py-2 border-3 border-black font-black text-sm uppercase"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              {t('results.difficulty_label')}: {difficulties.find(d => d.value === difficultyFilter)?.label.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Grid de productos */}
      {filteredAndSortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div 
            className="bg-white border-[5px] border-black p-12 max-w-md mx-auto hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '8px 8px 0 #000000' }}
          >
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-black font-black text-2xl mb-4 uppercase">
              {t('empty.title')}
            </h3>
            <p className="text-black font-medium">
              {t('empty.subtitle')}
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-6 bg-orange-500 border-3 border-black font-black text-black text-sm uppercase px-6 py-3 hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '4px 4px 0 #000000' }}
            >
              {t('empty.clear_filters')}
            </button>
          </div>
        </div>
      )}

      {/* Load more button SABDA */}
      {filteredAndSortedProducts.length > 0 && (
        <div className="text-center">
          <button 
            className="bg-white border-3 border-black font-black text-black text-xl uppercase px-12 py-4 hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '5px 5px 0 #000000' }}
          >
            {t('load_more')}
          </button>
        </div>
      )}
    </div>
  )
}