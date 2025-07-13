// Tipos adicionales para completar el sistema FURNIBLES
// Complementa el archivo index.ts existente

// Importar tipos existentes desde index.ts
import {
  User,
  UserRole,
  Product,
  ProductCategory,
  Difficulty,
  ProductStatus,
  Order,
  OrderStatus,
  OrderItem,
  ApiResponse,
  PaginatedResponse,
  SellerProfile,
  BuyerProfile
} from './index';

// Cart Types
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  priceSnapshot: number;
  quantity: number;
  addedAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  file: File;
}

export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  vote: ReviewHelpfulness;
  createdAt: string;
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

// Notification Types
export enum NotificationType {
  // Order notifications
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_PAID = 'ORDER_PAID',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  
  // Payment notifications
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYOUT_PROCESSED = 'PAYOUT_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  
  // Review notifications
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  REVIEW_RESPONSE = 'REVIEW_RESPONSE',
  REVIEW_HELPFUL_VOTE = 'REVIEW_HELPFUL_VOTE',
  REVIEW_MILESTONE = 'REVIEW_MILESTONE',
  
  // Product notifications
  PRODUCT_APPROVED = 'PRODUCT_APPROVED',
  PRODUCT_REJECTED = 'PRODUCT_REJECTED',
  PRODUCT_FEATURED = 'PRODUCT_FEATURED',
  
  // System notifications
  WELCOME = 'WELCOME',
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  SELLER_ONBOARDED = 'SELLER_ONBOARDED',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE'
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
  orderId?: string;
  priority: NotificationPriority;
  channel: NotificationChannel;
  groupKey?: string;
  expiresAt?: string;
  clickedAt?: string;
  clickCount: number;
  createdAt: string;
}

// Analytics Types
export interface SellerAnalytics {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  averageRating: number;
  topProducts: Product[];
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    sales: number;
  }>;
  categoryBreakdown: Array<{
    category: ProductCategory;
    sales: number;
    revenue: number;
  }>;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  platformFees: number;
  pendingProducts: number;
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

// Search and Filter Types
export interface ProductFilters {
  category?: ProductCategory[];
  difficulty?: Difficulty[];
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  featured?: boolean;
  sellerId?: string;
  tags?: string[];
  search?: string;
}

export interface ProductSearchParams {
  filters?: ProductFilters;
  sort?: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'rating' | 'popular';
  page?: number;
  limit?: number;
}

// Checkout Types
export interface CheckoutSession {
  id: string;
  sessionId: string;
  orderId: string;
  status: 'pending' | 'completed' | 'expired';
  url: string;
  expiresAt: string;
}

// Download Types
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
}

// Stripe Types
export interface StripeAccount {
  id: string;
  object: string;
  business_profile: any;
  capabilities: any;
  charges_enabled: boolean;
  country: string;
  created: number;
  default_currency: string;
  details_submitted: boolean;
  email?: string;
  external_accounts: any;
  metadata: any;
  payouts_enabled: boolean;
  requirements: any;
  settings: any;
  tos_acceptance: any;
  type: string;
}

// Form Types (para React Hook Form)
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  acceptTerms: boolean;
}

export interface ProductForm {
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  difficulty: Difficulty;
  tags: string[];
  estimatedTime?: string;
  toolsRequired: string[];
  materials: string[];
  dimensions?: string;
  pdfFile?: File;
  imageFiles?: File[];
}

export interface ReviewForm {
  rating: number;
  title?: string;
  comment: string;
  pros?: string;
  cons?: string;
  images?: File[];
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Language Types
export type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt';

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

// Asset Integration Types
export interface AnimeConfig {
  targets: string | HTMLElement | HTMLElement[] | NodeList;
  [key: string]: any; // Permite cualquier propiedad de anime.js
}

export interface ParticlesConfig {
  particles: {
    number: {
      value: number;
      density: {
        enable: boolean;
        value_area: number;
      };
    };
    color: {
      value: string | string[];
    };
    shape: {
      type: string | string[];
    };
    opacity: {
      value: number;
      random: boolean;
    };
    size: {
      value: number;
      random: boolean;
    };
    line_linked: {
      enable: boolean;
      distance: number;
      color: string;
      opacity: number;
      width: number;
    };
    move: {
      enable: boolean;
      speed: number;
      direction: string;
      random: boolean;
      straight: boolean;
      out_mode: string;
      bounce: boolean;
    };
  };
  interactivity: {
    detect_on: string;
    events: {
      onhover: {
        enable: boolean;
        mode: string;
      };
      onclick: {
        enable: boolean;
        mode: string;
      };
      resize: boolean;
    };
  };
  retina_detect: boolean;
}

// Re-export types from index.ts to have everything in one place when needed
export type {
  User,
  UserRole,
  SellerProfile,
  BuyerProfile,
  Product,
  ProductCategory,
  Difficulty,
  ProductStatus,
  Order,
  OrderStatus,
  OrderItem,
  ApiResponse,
  PaginatedResponse
} from './index';