import { mockProducts } from './mockProducts'
import { Product } from '@/types'

// Tipos para el sistema de favoritos
export interface Favorite {
  id: string
  userId: string
  productId: string
  createdAt: string
  // Información del producto para fácil acceso
  product: Product
}

export interface FavoriteStats {
  totalFavorites: number
  byCategory: Record<string, number>
  byDifficulty: Record<string, number>
  byPriceRange: {
    under10: number
    from10to20: number
    from20to30: number
    over30: number
  }
  recentlyAdded: number // Últimos 7 días
}

// Mock favorites para el usuario actual
export const mockFavorites: Favorite[] = [
  {
    id: 'fav_001',
    userId: 'buyer_001',
    productId: mockProducts[0].id, // Mesa de Comedor
    createdAt: '2024-11-28T14:20:00Z',
    product: mockProducts[0]
  },
  {
    id: 'fav_002', 
    userId: 'buyer_001',
    productId: mockProducts[2].id, // Estantería Industrial
    createdAt: '2024-11-25T16:45:00Z',
    product: mockProducts[2]
  },
  {
    id: 'fav_003',
    userId: 'buyer_001',
    productId: mockProducts[4].id, // Escritorio Ejecutivo
    createdAt: '2024-12-02T09:15:00Z',
    product: mockProducts[4]
  }
]

// Funciones auxiliares
export const getFavoritesByUserId = (userId: string): Favorite[] => {
  return mockFavorites.filter(favorite => favorite.userId === userId)
}

export const getFavoriteById = (favoriteId: string): Favorite | undefined => {
  return mockFavorites.find(favorite => favorite.id === favoriteId)
}

export const getUserFavoriteByProductId = (userId: string, productId: string): Favorite | undefined => {
  return mockFavorites.find(favorite => 
    favorite.userId === userId && favorite.productId === productId
  )
}

export const isProductFavorited = (userId: string, productId: string): boolean => {
  return !!getUserFavoriteByProductId(userId, productId)
}

export const getFavoriteStats = (userId: string): FavoriteStats => {
  const userFavorites = getFavoritesByUserId(userId)
  
  // Por categoría
  const byCategory = userFavorites.reduce((acc, favorite) => {
    const category = favorite.product.category
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Por dificultad  
  const byDifficulty = userFavorites.reduce((acc, favorite) => {
    const difficulty = favorite.product.difficulty
    acc[difficulty] = (acc[difficulty] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Por rango de precio
  const byPriceRange = userFavorites.reduce((acc, favorite) => {
    const price = favorite.product.price
    if (price < 10) acc.under10++
    else if (price < 20) acc.from10to20++
    else if (price < 30) acc.from20to30++
    else acc.over30++
    return acc
  }, { under10: 0, from10to20: 0, from20to30: 0, over30: 0 })

  // Agregados recientemente (últimos 7 días)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentlyAdded = userFavorites.filter(favorite => 
    new Date(favorite.createdAt) > weekAgo
  ).length

  return {
    totalFavorites: userFavorites.length,
    byCategory,
    byDifficulty,
    byPriceRange,
    recentlyAdded
  }
}

// Simular agregar a favoritos
export const addToFavorites = async (userId: string, productId: string): Promise<{success: boolean, message: string, favoriteId?: string}> => {
  // Verificar si ya está en favoritos
  if (isProductFavorited(userId, productId)) {
    return { success: false, message: 'El producto ya está en tus favoritos' }
  }

  // Verificar que el producto existe
  const product = mockProducts.find(p => p.id === productId)
  if (!product) {
    return { success: false, message: 'Producto no encontrado' }
  }

  // Simular tiempo de procesamiento
  await new Promise(resolve => setTimeout(resolve, 500))

  // Crear nuevo favorito
  const newFavorite: Favorite = {
    id: `fav_${Date.now()}`,
    userId,
    productId,
    createdAt: new Date().toISOString(),
    product
  }

  // En una implementación real esto se haría en el backend
  mockFavorites.push(newFavorite)

  return { 
    success: true, 
    message: 'Producto agregado a favoritos',
    favoriteId: newFavorite.id
  }
}

// Simular remover de favoritos
export const removeFromFavorites = async (userId: string, productId: string): Promise<{success: boolean, message: string}> => {
  const favoriteIndex = mockFavorites.findIndex(favorite => 
    favorite.userId === userId && favorite.productId === productId
  )

  if (favoriteIndex === -1) {
    return { success: false, message: 'El producto no está en tus favoritos' }
  }

  // Simular tiempo de procesamiento
  await new Promise(resolve => setTimeout(resolve, 500))

  // Remover favorito
  mockFavorites.splice(favoriteIndex, 1)

  return { 
    success: true, 
    message: 'Producto removido de favoritos'
  }
}

// Toggle favorito (agregar o remover)
export const toggleFavorite = async (userId: string, productId: string): Promise<{success: boolean, message: string, isFavorited: boolean}> => {
  const isFavorited = isProductFavorited(userId, productId)
  
  if (isFavorited) {
    const result = await removeFromFavorites(userId, productId)
    return { ...result, isFavorited: false }
  } else {
    const result = await addToFavorites(userId, productId)
    return { ...result, isFavorited: true }
  }
}

// Obtener productos similares a los favoritos (para recomendaciones)
export const getSimilarProductsToFavorites = (userId: string, limit: number = 6): Product[] => {
  const userFavorites = getFavoritesByUserId(userId)
  
  if (userFavorites.length === 0) {
    return mockProducts.slice(0, limit)
  }

  // Obtener categorías favoritas
  const favoriteCategories = [...new Set(userFavorites.map(f => f.product.category))]
  const favoriteProductIds = userFavorites.map(f => f.productId)

  // Buscar productos similares que no estén en favoritos
  const similarProducts = mockProducts.filter(product => 
    favoriteCategories.includes(product.category) && 
    !favoriteProductIds.includes(product.id)
  )

  // Ordenar por rating y tomar los mejores
  return similarProducts
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit)
}