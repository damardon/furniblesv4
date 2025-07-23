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
  feeBreakdown?: FeeBreakdownItem[];
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
export interface FeeBreakdownItem {
  type: 'PLATFORM_FEE' | 'STRIPE_FEE' | 'SELLER_AMOUNT' | 'TAX'
  description: string
  amount: number
  percentage?: number
  sellerId?: string
}
export interface OrderWithFeeBreakdown {
feeBreakdown: FeeBreakdownItem[]
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

// Product Types - CORREGIDO: Solo categorías del Prisma Schema
export enum ProductCategory {
  FURNITURE = 'FURNITURE',
  CHAIRS = 'CHAIRS',
  TABLES = 'TABLES',
  BEDS = 'BEDS',
  STORAGE = 'STORAGE',
  OUTDOOR = 'OUTDOOR',
  DECORATIVE = 'DECORATIVE',
  OFFICE = 'OFFICE'
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

export interface Product {
  id: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  category: ProductCategory;
  difficulty: Difficulty;
  pdfUrl: string;
  pdfFileId?: string;           // ID del archivo PDF principal
  previewImages: string[];      // URLs de imágenes de vista previa
  thumbnails?: string[];
  tags: string[];
  estimatedTime?: string;
  toolsRequired: string[];
  materials: string[];
  dimensions?: string;
  specifications?: any;
  status: ProductStatus;
  sellerId: string;
  // Estadísticas
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
  applicationFee?: number;
  status: OrderStatus;
  paymentIntentId?: string;
  paymentStatus?: string;
  buyerEmail: string;
  billingData?: any;
  billingAddress: any,
  metadata?: any;
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
  buyerName?: string
  productTitle?: string
  productSlug?: string
  sellerName?: string
  reportsCount?: number
  moderationReason?: string
  moderatedBy?: string
  moderatedAt?: string
  response?: {
    id: string
    comment: string
    createdAt: string
    sellerId: string
  }
  sellerId: string;
  rating: number;
  title?: string;
  comment: string;
  pros?: string;
  cons?: string;
  status: ReviewStatus;
  isVerified: boolean;
  notHelpfulCount: number;
  helpfulCount: number
  createdAt: string;
  updatedAt: string;
  // Relations
  buyer: User;
  product: Product;
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

// AGREGADO: Rating Types del Prisma Schema
export interface ProductRating {
  id: string;
  productId: string;
  totalReviews: number;
  averageRating: number;
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
  recommendationRate: number;
  updatedAt: string;
}

export interface SellerRating {
  id: string;
  sellerId: string;
  totalReviews: number;
  averageRating: number;
  communicationRating?: number;
  qualityRating?: number;
  valueRating?: number;
  shippingRating?: number;
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
  updatedAt: string;
}

// Notification Types - CORREGIDO: Todos los tipos del Prisma
export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_PAID = 'ORDER_PAID',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_DISPUTED = 'ORDER_DISPUTED',
  ORDER_REFUNDED = 'ORDER_REFUNDED',
  PRODUCT_SOLD = 'PRODUCT_SOLD',
  DOWNLOAD_READY = 'DOWNLOAD_READY',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
  // Payment related notifications
  PAYMENT_SETUP = 'PAYMENT_SETUP',
  PAYMENT_SETUP_COMPLETE = 'PAYMENT_SETUP_COMPLETE',
  PAYMENT_METHOD_ADDED = 'PAYMENT_METHOD_ADDED',
  PAYOUT_REQUESTED = 'PAYOUT_REQUESTED',
  PAYOUT_COMPLETED = 'PAYOUT_COMPLETED',
  PAYOUT_FAILED = 'PAYOUT_FAILED',
  TRANSFER_FAILED = 'TRANSFER_FAILED',
  DISPUTE_CREATED = 'DISPUTE_CREATED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  SALE_COMPLETED = 'SALE_COMPLETED',
  // Review related notifications
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  REVIEW_RESPONSE_RECEIVED = 'REVIEW_RESPONSE_RECEIVED',
  REVIEW_FLAGGED = 'REVIEW_FLAGGED',
  REVIEW_REMOVED = 'REVIEW_REMOVED',
  // Advanced review notifications
  REVIEW_HELPFUL_VOTE = 'REVIEW_HELPFUL_VOTE',
  REVIEW_WEEKLY_DIGEST = 'REVIEW_WEEKLY_DIGEST',
  REVIEW_FOLLOW_UP = 'REVIEW_FOLLOW_UP',
  REVIEW_MILESTONE = 'REVIEW_MILESTONE',
  SELLER_RATING_IMPROVED = 'SELLER_RATING_IMPROVED',
  PRODUCT_RATING_MILESTONE = 'PRODUCT_RATING_MILESTONE',
  REVIEW_PENDING_REMINDER = 'REVIEW_PENDING_REMINDER'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// AGREGADO: Nuevos enums del Prisma Schema
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  WEB_PUSH = 'WEB_PUSH',
  IN_APP = 'IN_APP',
  SMS = 'SMS'
}

export enum DigestFrequency {
  DISABLED = 'DISABLED',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
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
  channel?: NotificationChannel;
  groupKey?: string;
  orderId?: string;
  expiresAt?: string;
  clickedAt?: string;
  clickCount: number;
  createdAt: string;
}

// AGREGADO: Notification Preferences del Prisma Schema
export interface NotificationPreference {
  id: string;
  userId: string;
  emailEnabled: boolean;
  webPushEnabled: boolean;
  inAppEnabled: boolean;
  orderNotifications: boolean;
  paymentNotifications: boolean;
  reviewNotifications: boolean;
  marketingEmails: boolean;
  systemNotifications: boolean;
  reviewReceived: boolean;
  reviewResponses: boolean;
  reviewHelpfulVotes: boolean;
  reviewMilestones: boolean;
  reviewReminders: boolean;
  digestFrequency: DigestFrequency;
  digestDay?: number;
  digestTime?: string;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
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

// AGREGADO: Fee Types del Prisma Schema
export enum FeeType {
  PLATFORM_FEE = 'PLATFORM_FEE',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  TAX = 'TAX',
  REGIONAL_FEE = 'REGIONAL_FEE'
}

export enum SellerFeeType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  TIERED = 'TIERED'
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  sellerId: string;
  orderId: string;
  subtotal: number;
  platformFee: number;
  netAmount: number;
  taxAmount?: number;
  totalAmount: number;
  status: InvoiceStatus;
  currency: string;
  issuedAt: string;
  dueAt?: string;
  paidAt?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
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

// AGREGADO: Download Token Types del Prisma Schema
export interface DownloadToken {
  id: string;
  token: string;
  orderId: string;
  productId: string;
  buyerId: string;
  downloadLimit: number;
  downloadCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  lastDownloadAt?: string;
  lastIpAddress?: string;
  lastUserAgent?: string;
}

export interface Download {
  id: string;
  downloadToken: string;
  orderId: string;
  productId: string;
  buyerId: string;
  expiresAt: string;
  downloadCount: number;
  maxDownloads: number;
  isActive: boolean;
  createdAt: string;
  lastDownloadAt?: string;
  ipAddress?: string;
  userAgent?: string;
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