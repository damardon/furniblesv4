// User Types
export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isBoth: boolean;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sellerProfile?: SellerProfile;
  buyerProfile?: BuyerProfile;
}

export interface SellerProfile {
  id: string;
  storeName: string;
  slug: string;
  description?: string;
  website?: string;
  phone?: string;
  avatar?: string;
  banner?: string;
  rating: number;
  totalSales: number;
  isVerified: boolean;
}

export interface BuyerProfile {
  id: string;
  avatar?: string;
  phone?: string;
  preferences?: any;
  totalOrders: number;
  totalSpent: number;
}

// Product Types
export enum ProductCategory {
  TABLES = 'TABLES',
  CHAIRS = 'CHAIRS',
  BEDS = 'BEDS',
  SHELVES = 'SHELVES',
  STORAGE = 'STORAGE',
  DESKS = 'DESKS',
  OUTDOOR = 'OUTDOOR',
  DECORATIVE = 'DECORATIVE'
}

export enum Difficulty {
  EASY = 'EASY',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Product {
  id: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  category: ProductCategory;
  difficulty: Difficulty;
  pdfUrl: string;
  previewImages: string[];
  tags: string[];
  estimatedTime?: string;
  toolsRequired: string[];
  materials: string[];
  dimensions?: string;
  status: ProductStatus;
  sellerId: string;
  viewCount: number;
  downloadCount: number;
  favoriteCount: number;
  featured: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
  seller: User;
}

// Order Types
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  platformFee: number;
  sellerAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentIntentId?: string;
  paymentStatus?: string;
  isGuestOrder: boolean;
  guestEmail?: string;
  buyerId?: string;
  billingAddress: any;
  items: OrderItem[];
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  price: number;
  quantity: number;
  product: Product;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
