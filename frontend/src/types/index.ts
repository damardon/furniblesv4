
// ✅ CORREGIDO: User Types - Sincronizado con Prisma
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
  emailVerifiedAt?: string;
  // Relations
  sellerProfile?: SellerProfile;
  buyerProfile?: BuyerProfile;
}

export interface SellerProfile {
  id: string;
  userId: string;
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
  // Relations
  user?: User;
  sellerRating?: SellerRating;
}

export interface BuyerProfile {
  id: string;
  userId: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: any;
  totalOrders: number;
  totalSpent: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  user?: User;
}

// ✅ CORREGIDO: Product Types - Sincronizado 100% con Prisma
export enum ProductCategory {
  LIVING_DINING = 'LIVING_DINING',
  BEDROOM = 'BEDROOM',
  OUTDOOR = 'OUTDOOR',
  STORAGE = 'STORAGE',          // ✅ CORREGIDO: Era 'ORGANIZATION'
  NORDIC = 'NORDIC',
  DECORATIVE = 'DECORATIVE',
  FURNITURE = 'FURNITURE',
  BEDS = 'BEDS',
  OFFICE = 'OFFICE',
  BATHROOM = 'BATHROOM',
  KITCHEN = 'KITCHEN'
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',        // ✅ CORREGIDO: Era 'EASY'
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'             // ✅ AGREGADO: Faltaba EXPERT
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
  status: ProductStatus;
  
  // ✅ CORREGIDO: Campos de archivos sincronizados con Prisma
  pdfFileId?: string;           // Single PDF file ID
  imageFileIds: string;         // JSON array string de image IDs  
  thumbnailFileIds: string;     // JSON array string de thumbnail IDs
  
  // ✅ CORREGIDO: Arrays como JSON strings (como en Prisma)
  tags: string;                 // JSON array string
  toolsRequired: string;        // JSON array string  
  materials: string;            // JSON array string
  
  estimatedTime?: string;
  dimensions?: string;
  specifications?: any;
  
  // Moderation
  moderatedBy?: string;
  moderatedAt?: string;
  rejectionReason?: string;
  
  // Seller
  sellerId: string;
  
  // Stats
  viewCount: number;
  downloadCount: number;
  favoriteCount: number;
  featured: boolean;
  rating: number;
  reviewCount: number;
  
  // Timestamps
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
  
  // Relations
  seller?: User;       // ✅ CORREGIDO: Referencia SellerProfile
  productRating?: ProductRating;
}

// ✅ AGREGADO: Product Rating (faltaba)
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
  recommendationRate?: number;
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

// ✅ CORREGIDO: Order Types - Sincronizado con Prisma
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
  
  // ✅ CORREGIDO: Campos financieros sincronizados
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
  feeBreakdown?: any;
  metadata?: any;
  
  // Timestamps
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  updatedAt: string;
  
  // Relations
  buyer?: User;
  items?: OrderItem[];
  downloads?: Download[];
  downloadTokens?: DownloadToken[];
  reviews?: Review[];
  invoice?: Invoice;
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
  storeName?: string;
  createdAt: string;
  // Relations
  order?: Order;
  product?: Product;
  seller?: User;
}

// ✅ CORREGIDO: Review Types - Sincronizado con Prisma
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
  buyer?: User;
  product?: Product;
  images?: ReviewImage[];
  response?: ReviewResponse;
  votes?: ReviewVote[];
  reports?: ReviewReport[];
}

export interface ReviewImage {
  id: string;
  reviewId: string;
  fileId: string;
  caption?: string;
  order: number;
  createdAt: string;
  // Relations
  file?: File;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  sellerId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  seller?: User;
}

export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  vote: ReviewHelpfulness;
  createdAt: string;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  userId: string;
  reason: string;
  details?: string;
  resolved: boolean;
  createdAt: string;
}

// ✅ CORREGIDO: File Types - Sincronizado con Prisma
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
  checksum?: string;
  metadata?: any;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

// ✅ CORREGIDO: Download Types - Sincronizado con Prisma
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
  // Relations
  order?: Order;
  product?: Product;
  buyer?: User;
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
  // Relations
  order?: Order;
  product?: Product;
  buyer?: User;
}

// ✅ CORREGIDO: Cart Types - Simple y directo
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  priceSnapshot: number;
  quantity: number;
  addedAt: string;
  updatedAt: string;
  // Relations
  user?: User;
  product?: Product;
}

// ✅ Favorite Types - Sincronizado con Prisma
export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  // Relations
  user?: User;
  product?: Product;
}

// ✅ CORREGIDO: Notification Types - Todos los tipos del Prisma
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
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  REVIEW_RESPONSE_RECEIVED = 'REVIEW_RESPONSE_RECEIVED',
  REVIEW_FLAGGED = 'REVIEW_FLAGGED',
  REVIEW_REMOVED = 'REVIEW_REMOVED',
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
  sentAt?: string;
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

// ✅ CORREGIDO: Transaction Types - Sincronizado con Prisma
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
  description?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

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
  description?: string;
  failureReason?: string;
  requestedAt: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

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

// ✅ API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ✅ Filter Types
export interface ProductFilters {
  q?: string;
  category?: ProductCategory;
  difficulty?: Difficulty;
  priceMin?: number;
  priceMax?: number;
  tags?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
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
  search?: string;
}

// ✅ Analytics Types
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

// ✅ Utility Types
export interface FeeBreakdownItem {
  type: FeeType;
  description: string;
  amount: number;
  percentage?: number;
  sellerId?: string;
}