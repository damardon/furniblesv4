// Enums coherentes con el backend
export enum ProductCategory {
  FURNITURE = 'FURNITURE',
  CHAIRS = 'CHAIRS', 
  TABLES = 'TABLES',
  STORAGE = 'STORAGE',
  BEDS = 'BEDS',
  DESKS = 'DESKS',
  OUTDOOR = 'OUTDOOR',
  DECORATIVE = 'DECORATIVE'
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE', 
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED', 
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export enum FileType {
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  THUMBNAIL = 'THUMBNAIL',
  REVIEW_IMAGE = 'REVIEW_IMAGE'
}

export enum FileStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
  DELETED = 'DELETED'
}

// Interfaces coherentes con el ERD
export interface File {
  id: string
  filename: string
  key: string
  url: string
  mimeType: string
  size: number
  type: FileType
  status: FileStatus
  width?: number
  height?: number
  checksum: string
  metadata?: Record<string, any>
  uploadedById: string
  createdAt: string
  updatedAt: string
}

export interface SellerProfile {
  id: string
  userId: string
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
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  sellerProfile?: SellerProfile
}

export interface ProductRating {
  id: string
  productId: string
  totalReviews: number
  averageRating: number
  oneStar: number
  twoStar: number
  threeStar: number
  fourStar: number
  fiveStar: number
  recommendationRate: number
  updatedAt: string
}

export interface Product {
  id: string
  title: string
  description: string
  slug: string
  price: number
  category: ProductCategory
  difficulty: Difficulty
  status: ProductStatus
  
  // Files
  pdfFileId?: string
  pdfFile?: File
  imageFileIds: string[]
  imageFiles: File[]
  thumbnailFileIds: string[]
  thumbnailFiles: File[]
  
  // Metadata
  tags: string[]
  estimatedTime: string
  toolsRequired: string[]
  materials: string[]
  dimensions?: string
  specifications?: Record<string, any>
  
  // Seller
  sellerId: string
  seller: User
  
  // Stats
  viewCount: number
  downloadCount: number
  favoriteCount: number
  featured: boolean
  
  // Ratings (aggregated)
  rating: number
  reviewCount: number
  productRating?: ProductRating
  
  // Moderation
  moderatedBy?: string
  moderatedAt?: string
  rejectionReason?: string
  
  // Timestamps
  createdAt: string
  publishedAt?: string
  updatedAt: string
}

// Para el frontend - versión simplificada
export interface ProductCardData {
  id: string
  title: string
  description: string
  slug: string
  price: number
  category: ProductCategory
  difficulty: Difficulty
  status: ProductStatus
  
  // Imágenes principales
  mainImage?: File
  thumbnailImage?: File
  
  // Metadata básica
  tags: string[]
  estimatedTime: string
  
  // Seller info
  seller: {
    id: string
    storeName: string
    rating: number
    isVerified: boolean
    avatar?: string
  }
  
  // Stats
  rating: number
  reviewCount: number
  downloadCount: number
  favoriteCount: number
  featured: boolean
  
  // Timestamps
  createdAt: string
  publishedAt?: string
}

// Para listas de productos
export interface ProductListResponse {
  products: ProductCardData[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// Para detalle de producto
export interface ProductDetailData extends Product {
  // Archivos completos
  pdfFile: File
  imageFiles: File[]
  thumbnailFiles: File[]
  
  // Reviews sample
  recentReviews?: Review[]
  
  // Productos relacionados
  relatedProducts?: ProductCardData[]
}

// Review interface
export interface Review {
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
  createdAt: string
  updatedAt: string
  
  // Relations
  buyer: User
  reviewImages?: File[]
  response?: ReviewResponse
}

export interface ReviewResponse {
  id: string
  reviewId: string
  sellerId: string
  comment: string
  createdAt: string
  updatedAt: string
  seller: User
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
  statusCode: number
}