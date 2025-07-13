// src/modules/analytics/interfaces/analytics.interface.ts

export interface TimeRange {
  startDate: string;
  endDate: string;
}

export interface MetricValue {
  value: number;
  change?: number; // Percentage change from previous period
  changeType?: 'increase' | 'decrease' | 'neutral';
}

export interface SellerDashboardMetrics {
  // Revenue Metrics
  totalRevenue: MetricValue;
  monthlyRevenue: MetricValue;
  averageOrderValue: MetricValue;
  
  // Order Metrics
  totalOrders: MetricValue;
  monthlyOrders: MetricValue;
  completionRate: MetricValue;
  
  // Product Metrics
  totalProducts: MetricValue;
  activeProducts: MetricValue;
  topPerformingProducts: ProductMetric[];
  
  // Review Metrics
  averageRating: MetricValue;
  totalReviews: MetricValue;
  responseRate: MetricValue;
  
  // Recent Activity
  recentOrders: RecentOrderMetric[];
  recentReviews: RecentReviewMetric[];
}

export interface ProductMetric {
  id: string;
  title: string;
  revenue: number;
  orders: number;
  averageRating: number;
  reviewCount: number;
  conversionRate: number;
}

export interface RecentOrderMetric {
  id: string;
  buyerName: string;
  productTitle: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface RecentReviewMetric {
  id: string;
  buyerName: string;
  productTitle: string;
  rating: number;
  comment: string;
  createdAt: string;
  hasResponse: boolean;
}

export interface AdminPlatformMetrics {
  // Platform Overview
  totalUsers: MetricValue;
  totalSellers: MetricValue;
  totalBuyers: MetricValue;
  activeUsers: MetricValue;
  
  // Revenue Metrics
  totalPlatformRevenue: MetricValue;
  monthlyPlatformRevenue: MetricValue;
  averagePlatformFee: MetricValue;
  
  // Order Metrics
  totalOrders: MetricValue;
  monthlyOrders: MetricValue;
  averageOrderValue: MetricValue;
  
  // Product Metrics
  totalProducts: MetricValue;
  activeProducts: MetricValue;
  pendingModeration: MetricValue;
  
  // Review Metrics
  totalReviews: MetricValue;
  averagePlatformRating: MetricValue;
  
  // Top Performers
  topSellers: SellerMetric[];
  topProducts: ProductMetric[];
  topCategories: CategoryMetric[];
}

export interface SellerMetric {
  id: string;
  businessName: string;
  revenue: number;
  orders: number;
  averageRating: number;
  reviewCount: number;
  joinedAt: string;
}

export interface CategoryMetric {
  id: string;
  name: string;
  productCount: number;
  revenue: number;
  averageRating: number;
}

export interface ConversionFunnelMetrics {
  // Funnel Steps
  visitors: number;
  productViews: number;
  cartAdds: number;
  checkoutStarts: number;
  orders: number;
  completedOrders: number;
  reviews: number;
  
  // Conversion Rates
  productViewRate: number;
  cartConversionRate: number;
  checkoutConversionRate: number;
  orderCompletionRate: number;
  reviewRate: number;
  
  // Drop-off Analysis
  dropOffs: {
    viewToCart: number;
    cartToCheckout: number;
    checkoutToOrder: number;
    orderToCompletion: number;
    completionToReview: number;
  };
}

export interface CohortMetrics {
  cohortMonth: string;
  usersCount: number;
  retentionRates: {
    month1: number;
    month2: number;
    month3: number;
    month6: number;
    month12: number;
  };
  revenuePerUser: {
    month1: number;
    month2: number;
    month3: number;
    month6: number;
    month12: number;
  };
}

export interface NotificationEngagementMetrics {
  // Overall Metrics
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  
  // By Type
  byType: {
    type: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  }[];
  
  // By Channel
  byChannel: {
    channel: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  }[];
  
  // Trends
  trends: {
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }[];
}

export interface ExportData {
  filename: string;
  format: 'csv' | 'xlsx' | 'pdf';
  data: any[];
  headers: string[];
  generatedAt: string;
  requestedBy: string;
}

export interface AnalyticsFilters {
  timeRange?: TimeRange;
  sellerId?: string;
  productId?: string;
  categoryId?: string;
  status?: string;
  userRole?: string;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  limit?: number;
  offset?: number;
}