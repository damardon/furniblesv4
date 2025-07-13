// User Types
export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
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
  status: UserStatus;
  avatar?: string;
  // Stripe Properties (from backend schema)
  stripeConnectId?: string;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  // Relations
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
  totalReviews: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProfile {
  id: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: any;
  totalOrders: number;
  totalSpent: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
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
  DECORATIVE = 'DECORATIVE',
  FURNITURES = 'FURNITURES',
  FURNITURE = 'FURNITURE',
  LIGHTING = 'LIGHTING',
  KITCHEN = 'KITCHEN',
  BATHROOM = 'BATHROOM',
  OFFICE = 'OFFICE',
  GARDEN = 'GARDEN',
  TOYS = 'TOYS',
  SPORTS = 'SPORTS',
  ELECTRONICS = 'ELECTRONICS',
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE', 
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
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
  specifications?: any;
  status: ProductStatus;
  sellerId: string;
  viewCount: number;
  downloadCount: number;
  favoriteCount: number;
  featured: boolean;
  rating: number;
  reviewCount: number;
  // Moderation fields
  moderatedBy?: string;
  moderatedAt?: string;
  rejectionReason?: string;
  // Timestamps
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
  // Relations
  seller: User;
}

// Order Types
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED'
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  subtotal: number;
  subtotalAmount: number;
  platformFeeRate: number;
  platformFee: number;
  totalAmount: number;
  sellerAmount: number;
  transferGroup?: string;
  applicationFee: number;
  status: OrderStatus;
  paymentIntentId?: string;
  paymentStatus?: string;
  buyerEmail: string;
  billingData: any;
  metadata?: any;
  feeBreakdown?: any;
  items: OrderItem[];
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  productTitle: string;
  productSlug: string;
  price: number;
  quantity: number;
  sellerName: string;
  storeName: string;
  createdAt: string;
  product: Product;
}

// Review Types
export enum ReviewStatus {
  PENDING_MODERATION = 'PENDING_MODERATION',
  PUBLISHED = 'PUBLISHED',
  FLAGGED = 'FLAGGED',
  REMOVED = 'REMOVED'
}

export enum ReviewHelpfulness {
  HELPFUL = 'HELPFUL',
  NOT_HELPFUL = 'NOT_HELPFUL'
}

export interface Review {
  id: string;
  orderId: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  rating: number;
  title?: string;
  comment: string;
  pros?: string;
  cons?: string;
  status: ReviewStatus;
  isVerified: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  buyer: User;
  product: Product;
  response?: ReviewResponse;
  images?: ReviewImage[];
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  sellerId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  seller: User;
}

export interface ReviewImage {
  id: string;
  reviewId: string;
  fileId: string;
  caption?: string;
  order: number;
  createdAt: string;
}

export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  vote: ReviewHelpfulness;
  createdAt: string;
}

// Notification Types
export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_PAID = 'ORDER_PAID',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PRODUCT_APPROVED = 'PRODUCT_APPROVED',
  PRODUCT_REJECTED = 'PRODUCT_REJECTED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  REVIEW_RESPONSE = 'REVIEW_RESPONSE',
  PAYOUT_PROCESSED = 'PAYOUT_PROCESSED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  emailSent: boolean;
  priority: NotificationPriority;
  orderId?: string;
  expiresAt?: string;
  clickedAt?: string;
  clickCount: number;
  createdAt: string;
}

// Transaction Types
export enum TransactionType {
  SALE = 'SALE',
  PLATFORM_FEE = 'PLATFORM_FEE',
  STRIPE_FEE = 'STRIPE_FEE',
  PAYOUT = 'PAYOUT',
  REFUND = 'REFUND',
  CHARGEBACK = 'CHARGEBACK'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  sellerId?: string;
  orderId?: string;
  payoutId?: string;
  stripeTransactionId?: string;
  stripeChargeId?: string;
  stripePaymentIntentId?: string;
  description: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

// Payout Types
export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface Payout {
  id: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  stripePayoutId?: string;
  stripeTransferId?: string;
  description: string;
  failureReason?: string;
  requestedAt: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  seller: User;
}

// File Types
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

export interface File {
  id: string;
  filename: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  type: FileType;
  status: FileStatus;
  width?: number;
  height?: number;
  checksum: string;
  metadata?: any;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  averageOrderValue: number;
  conversionRate: number;
  platformFeeRevenue: number;
  activeVendors: number;
}

export interface ChartData {
  label: string;
  value: number;
  date?: string;
}

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
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

// Search and Filter Types
export interface ProductFilters {
  category?: ProductCategory;
  difficulty?: Difficulty;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  featured?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  sellerId?: string;
  buyerId?: string;
}

export interface ReviewFilters {
  status?: ReviewStatus;
  rating?: number;
  productId?: string;
  sellerId?: string;
  hasResponse?: boolean;
}