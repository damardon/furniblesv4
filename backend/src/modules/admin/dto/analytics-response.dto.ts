import { ApiProperty } from '@nestjs/swagger';

export class OrderAnalyticsDto {
  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalPlatformFees: number;

  @ApiProperty()
  avgOrderValue: number;

  @ApiProperty()
  conversionRate: number;

  @ApiProperty()
  ordersByStatus: Record<string, number>;

  @ApiProperty()
  revenueByPeriod: {
    period: string;
    revenue: number;
    orders: number;
  }[];
}

export class ProductAnalyticsDto {
  @ApiProperty()
  totalProducts: number;

  @ApiProperty()
  totalDownloads: number;

  @ApiProperty()
  avgRating: number;

  @ApiProperty()
  topSellingProducts: {
    id: string;
    title: string;
    sales: number;
    revenue: number;
  }[];

  @ApiProperty()
  productsByCategory: Record<string, number>;

  @ApiProperty()
  productsByDifficulty: Record<string, number>;
}

export class UserAnalyticsDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  totalBuyers: number;

  @ApiProperty()
  totalSellers: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  newUsersThisPeriod: number;

  @ApiProperty()
  topSellers: {
    id: string;
    name: string;
    storeName: string;
    sales: number;
    revenue: number;
  }[];

  @ApiProperty()
  usersByCountry: Record<string, number>;
}

export class FinancialAnalyticsDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalPlatformFees: number;

  @ApiProperty()
  totalSellerPayouts: number;

  @ApiProperty()
  pendingPayouts: number;

  @ApiProperty()
  revenueByCountry: Record<string, number>;

  @ApiProperty()
  feesByType: Record<string, number>;

  @ApiProperty()
  monthlyGrowth: {
    month: string;
    revenue: number;
    growth: number;
  }[];
}

export class AdminDashboardDto {
  @ApiProperty()
  orders: OrderAnalyticsDto;

  @ApiProperty()
  products: ProductAnalyticsDto;

  @ApiProperty()
  users: UserAnalyticsDto;

  @ApiProperty()
  financial: FinancialAnalyticsDto;

  @ApiProperty()
  generatedAt: Date;
}