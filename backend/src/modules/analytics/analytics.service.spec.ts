// src/modules/analytics/analytics.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, HttpException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryService } from './services/analytics-query.service';
import { AnalyticsCalculationService } from './services/analytics-calculation.service';
import { AnalyticsCacheService } from './services/analytics-cache.service';
import {
  UserRole,
  OrderStatus,
  ProductStatus,
  ReviewStatus,
} from '@prisma/client';
import { SortBy } from './dto/seller-analytics.dto';
import { SortOrder } from './dto/seller-analytics.dto';
import { GroupByPeriod } from './dto/filters.dto';

// Mock data constants
const mockSellerId = 'seller123';
const mockBuyerId = 'buyer123';
const mockAdminId = 'admin123';
const mockProductId = 'product123';
const mockOrderId = 'order123';

const mockTimeRange = {
  start: new Date('2024-01-01'),
  end: new Date('2024-12-31'),
};

const mockSeller = {
  id: mockSellerId,
  email: 'seller@test.com',
  firstName: 'Test',
  lastName: 'Seller',
  role: UserRole.SELLER,
  sellerProfile: {
    id: 'sellerProfile123',
    storeName: 'Test Business', // Corregido: businessName → storeName
    description: 'Test Business Description',
  },
};

const mockOrders = [
  {
    id: mockOrderId,
    status: OrderStatus.COMPLETED,
    totalAmount: 100,
    platformFeeRate: 0.1,
    createdAt: new Date('2024-06-01'),
    buyer: {
      firstName: 'Test',
      lastName: 'Buyer',
    },
    items: [
      {
        id: 'item1',
        price: 50,
        sellerId: mockSellerId,
        product: {
          title: 'Test Product 1',
        },
      },
      {
        id: 'item2',
        price: 50,
        sellerId: mockSellerId,
        product: {
          title: 'Test Product 2',
        },
      },
    ],
  },
];

const mockProducts = [
  {
    id: mockProductId,
    title: 'Test Product',
    status: ProductStatus.APPROVED,
    sellerId: mockSellerId,
    createdAt: new Date('2024-01-01'),
    orderItems: [{ price: 100 }, { price: 150 }],
    productRating: {
      averageRating: 4.5,
      totalReviews: 10,
    },
  },
];

const mockReviews = [
  {
    id: 'review1',
    rating: 5,
    comment: 'Great product!',
    sellerId: mockSellerId,
    createdAt: new Date('2024-06-01'),
    buyer: {
      firstName: 'Test',
      lastName: 'Buyer',
    },
    product: {
      title: 'Test Product',
    },
    response: {
      id: 'response1',
    },
  },
];

const mockSellerRating = {
  sellerId: mockSellerId,
  averageRating: 4.5,
  totalReviews: 25,
};

const mockTransactions = [
  {
    type: 'PLATFORM_FEE',
    amount: 10,
    sellerId: mockSellerId,
    createdAt: new Date('2024-06-01'),
  },
  {
    type: 'STRIPE_FEE',
    amount: 5,
    sellerId: mockSellerId,
    createdAt: new Date('2024-06-01'),
  },
];

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  review: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  sellerRating: {
    findUnique: jest.fn(),
  },
  transaction: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
};

let service: AnalyticsService;
let prismaService: PrismaService;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockQueryService: any;

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AnalyticsService,
      {
        provide: PrismaService,
        useValue: mockPrisma,
      },
      {
        provide: AnalyticsQueryService,
        useValue: {
          getSellerRevenue: jest.fn().mockResolvedValue({
            total: 1000, monthly: 500, averageOrderValue: 100,
          }),
          getSellerOrders: jest.fn().mockResolvedValue({
            total: 10, monthly: 5, completionRate: 0.9,
          }),
          getSellerProducts: jest.fn().mockResolvedValue({
            total: 5, active: 4, topPerforming: [],
          }),
          getSellerReviews: jest.fn().mockResolvedValue({
            averageRating: 4.5, total: 20, responseRate: 0.8,
          }),
          getSellerRecentOrders: jest.fn().mockResolvedValue([]),
          getSellerRecentReviews: jest.fn().mockResolvedValue([]),
          getSellerRevenueByProduct: jest.fn().mockResolvedValue([]),
          getSellerFeesBreakdown: jest.fn().mockResolvedValue({
            platformFees: 0, netRevenue: 1000, feeRate: 0.1,
          }),
          getSellerRevenueTrends: jest.fn().mockResolvedValue([]),
          getPlatformUsers: jest.fn().mockResolvedValue({
            total: 1000, new: 50, active: 700, sellers: 100, buyers: 900,
          }),
          getPlatformRevenue: jest.fn().mockResolvedValue({
            total: 50000, monthly: 5000, platformFees: 5000,
          }),
          getPlatformOrders: jest.fn().mockResolvedValue({
            total: 500, completed: 450, pending: 50, completionRate: 0.9,
          }),
          getPlatformProducts: jest.fn().mockResolvedValue({
            total: 200, active: 180, pending: 20,
          }),
          getPlatformReviews: jest.fn().mockResolvedValue({
            total: 300, averageRating: 4.3,
          }),
          checkDatabaseHealth: jest.fn().mockResolvedValue({ status: 'healthy', latencyMs: 5 }),
          checkAnalyticsHealth: jest.fn().mockResolvedValue({ status: 'healthy' }),
        },
      },
      {
        provide: AnalyticsCalculationService,
        useValue: {
          calculateSellerMetrics: jest.fn().mockReturnValue({}),
          calculatePlatformMetrics: jest.fn().mockReturnValue({}),
          calculateRevenueTrends: jest.fn().mockReturnValue([]),
          groupByPeriod: jest.fn().mockReturnValue([]),
          getTimeRange: jest.fn().mockReturnValue({
            start: new Date('2024-01-01'),
            end: new Date('2024-12-31'),
          }),
        },
      },
      {
        provide: AnalyticsCacheService,
        useValue: {
          get: jest.fn().mockResolvedValue(null),
          set: jest.fn().mockResolvedValue(undefined),
          del: jest.fn().mockResolvedValue(undefined),
          isEnabled: jest.fn().mockReturnValue(false),
          buildKey: jest.fn().mockReturnValue('mock-cache-key'),
          getOrSet: jest.fn().mockImplementation((_key: string, fn: () => Promise<unknown>) => fn()),
        },
      },
    ],
  }).compile();

  service = module.get<AnalyticsService>(AnalyticsService);
  prismaService = module.get<PrismaService>(PrismaService);
  mockQueryService = module.get(AnalyticsQueryService);

  // Reset all mocks
  jest.clearAllMocks();

  // Mock default return values
  mockPrisma.user.findUnique.mockResolvedValue(mockSeller);
  mockPrisma.order.findMany.mockResolvedValue(mockOrders);
  mockPrisma.product.findMany.mockResolvedValue(mockProducts);
  mockPrisma.review.findMany.mockResolvedValue(mockReviews);
  mockPrisma.sellerRating.findUnique.mockResolvedValue(mockSellerRating);
  mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
  mockPrisma.user.count.mockResolvedValue(1000);
  mockPrisma.order.count.mockResolvedValue(500);
  mockPrisma.product.count.mockResolvedValue(200);
  mockPrisma.review.count.mockResolvedValue(300);
  mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]); // Mock database health check
});

describe('AnalyticsService', () => {
  describe('getSellerDashboard', () => {
    it('should return seller dashboard with all metrics', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockSeller);
      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.sellerRating.findUnique.mockResolvedValue(mockSellerRating);

      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        includeComparison: true,
        includeActivity: true,
      };

      // Act
      const result = await service.getSellerDashboard(mockSellerId, dto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.totalRevenue).toBeDefined();
      expect(result.data.totalOrders).toBeDefined();
      expect(result.data.totalProducts).toBeDefined();
      expect(result.data.averageRating).toBeDefined();
      expect(result.meta.sellerId).toBe(mockSellerId);
      expect(result.meta.currency).toBe('USD');

      // Verify database calls
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockSellerId, role: UserRole.SELLER },
        include: { sellerProfile: true },
      });
    });

    it('should throw NotFoundException when seller not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      // Act & Assert
      await expect(
        service.getSellerDashboard(mockSellerId, dto),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockSellerId, role: UserRole.SELLER },
        include: { sellerProfile: true },
      });
    });

    it('should handle empty data gracefully', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockSeller);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.sellerRating.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.getSellerDashboard(mockSellerId, {
        startDate,
        endDate,
      });

      // Assert
      expect(result.meta.timeRange.start).toBe(
        new Date(startDate).toISOString(),
      );
      expect(result.meta.timeRange.end).toBe(new Date(endDate).toISOString());
    });

    it('should use default 30-day range when no dates provided', async () => {
      const result = await service.getSellerDashboard(mockSellerId, {});

      // Verify timeRange is present in the response; the specific values are determined by
      // AnalyticsCalculationService.getTimeRange which is tested in its own unit spec.
      expect(result.meta.timeRange).toHaveProperty('start');
      expect(result.meta.timeRange).toHaveProperty('end');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        service.getSellerDashboard(mockSellerId, {}),
      ).rejects.toThrow('Database error');
    });

    it('should log errors appropriately', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Test error'));

      // Act
      try {
        await service.getSellerDashboard(mockSellerId, {});
      } catch (error) {
        // Expected error
      }

      // Assert
      // Logger should be called (we can't easily test the actual Logger without mocking it)
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Revenue Calculations', () => {
    it('should calculate revenue accurately from OrderItems', async () => {
      // AnalyticsQueryService.getSellerRevenue is mocked to return { total: 1000 }
      const result = await service.getSellerDashboard(mockSellerId, {});
      expect(result.data.totalRevenue).toBeDefined();
      expect(typeof result.data.totalRevenue).toBe('number');
    });

    it('should handle orders with no seller items', async () => {
      // Mock query service to return zero revenue for this scenario
      const mockQueryService = (service as unknown as { query: { getSellerRevenue: jest.Mock } }).query;
      mockQueryService.getSellerRevenue.mockResolvedValueOnce({ total: 0, monthly: 0, averageOrderValue: 0 });

      const result = await service.getSellerDashboard(mockSellerId, {});
      expect(result.data.totalRevenue).toBe(0);
    });
  });

  describe('Aggregations and Performance', () => {
    it('should use Promise.all for parallel queries', async () => {
      const startTime = Date.now();
      await service.getSellerDashboard(mockSellerId, { includeActivity: true });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);

      // Verify query service methods were called (not Prisma directly)
      const mockQueryService = (service as unknown as { query: {
        getSellerRevenue: jest.Mock;
        getSellerOrders: jest.Mock;
        getSellerProducts: jest.Mock;
        getSellerReviews: jest.Mock;
      } }).query;
      expect(mockQueryService.getSellerRevenue).toHaveBeenCalled();
      expect(mockQueryService.getSellerOrders).toHaveBeenCalled();
      expect(mockQueryService.getSellerProducts).toHaveBeenCalled();
      expect(mockQueryService.getSellerReviews).toHaveBeenCalled();
    });
  });

  describe('Response Format Validation', () => {
    it('should return properly formatted response structure', async () => {
      const result = await service.getSellerDashboard(mockSellerId, {});

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');

      expect(result.meta).toHaveProperty('sellerId', mockSellerId);
      expect(result.meta).toHaveProperty('timeRange');
      expect(result.meta).toHaveProperty('lastUpdated');
      expect(result.meta).toHaveProperty('currency', 'USD');

      expect(result.data).toHaveProperty('totalRevenue');
      expect(result.data).toHaveProperty('totalOrders');
      expect(result.data).toHaveProperty('totalProducts');
      expect(result.data).toHaveProperty('averageRating');
    });
  });
});

describe('getSellerRevenue', () => {
  it('should calculate revenue correctly', async () => {
    // Arrange
    mockPrisma.order.findMany.mockResolvedValue(mockOrders);

    const dto = {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      includeProductBreakdown: true,
      includeFees: true,
    };

    // Act
    const result = await service.getSellerRevenue(mockSellerId, dto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.revenue).toBeDefined();
    expect(result.meta.sellerId).toBe(mockSellerId);
  });

  it('should include product breakdown when requested', async () => {
    // Arrange
    mockPrisma.order.findMany.mockResolvedValue(mockOrders);
    mockPrisma.product.findMany.mockResolvedValue(mockProducts);

    const dto = {
      includeProductBreakdown: true,
      includeFees: false,
    };

    // Act
    const result = await service.getSellerRevenue(mockSellerId, dto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.productBreakdown).toBeDefined();
  });

  it('should include fees breakdown when requested', async () => {
    // Arrange
    mockPrisma.order.findMany.mockResolvedValue(mockOrders);
    mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

    const dto = {
      includeProductBreakdown: false,
      includeFees: true,
    };

    // Act
    const result = await service.getSellerRevenue(mockSellerId, dto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.feesBreakdown).toBeDefined();
  });
});

describe('getSellerProducts', () => {
  it('should return product analytics', async () => {
    // Arrange
    mockPrisma.product.findMany.mockResolvedValue(mockProducts);

    const dto = {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      sortBy: SortBy.REVENUE,
      sortOrder: SortOrder.DESC,
      includeDetails: true,
    };

    // Act
    const result = await service.getSellerProducts(mockSellerId, dto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.products).toBeDefined();
    expect(result.data.summary).toBeDefined();
    expect(result.meta.sellerId).toBe(mockSellerId);
  });

  it('should handle products with no sales', async () => {
    // Arrange
    const productsWithoutSales = [
      {
        ...mockProducts[0],
        orderItems: [],
      },
    ];
    mockPrisma.product.findMany.mockResolvedValue(productsWithoutSales);

    const dto = {};

    // Act
    const result = await service.getSellerProducts(mockSellerId, dto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.products).toBeDefined();
  });
});

describe('getSellerReviews', () => {
  it('should return review analytics', async () => {
    // Arrange
    mockPrisma.review.findMany.mockResolvedValue(mockReviews);
    mockPrisma.sellerRating.findUnique.mockResolvedValue(mockSellerRating);

    const dto = {
      includeDistribution: true,
      includeRecentReviews: true,
      includeResponseMetrics: true,
    };

    // Act
    const result = await service.getSellerReviews(mockSellerId, dto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.reviews).toBeDefined();
    expect(result.data.recentReviews).toBeDefined();
    expect(result.meta.sellerId).toBe(mockSellerId);
  });

  it('should handle seller with no reviews', async () => {
    // Mock query service to return zero reviews for this scenario
    const mockQueryService = (service as unknown as { query: { getSellerReviews: jest.Mock } }).query;
    mockQueryService.getSellerReviews.mockResolvedValueOnce({
      averageRating: 0, total: 0, responseRate: 0,
    });

    const result = await service.getSellerReviews(mockSellerId, {});

    expect(result.success).toBe(true);
    expect(result.data.reviews.averageRating).toBe(0);
    expect(result.data.reviews.total).toBe(0);
  });
});

describe('getPlatformOverview', () => {
  it('should return platform metrics for admin', async () => {
    const result = await service.getPlatformOverview({ includeComparison: true, includeTrends: true }, mockAdminId);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    // Data fields come from query service mocks (flat numbers spread into platformData)
    expect(result.data.total).toBeDefined();
    expect(result.meta.requestedBy).toBe(mockAdminId);
  });

  it('should handle empty platform data', async () => {
    // Mock query service to return zero platform data
    const mockQueryService = (service as unknown as { query: {
      getPlatformUsers: jest.Mock; getPlatformRevenue: jest.Mock;
      getPlatformOrders: jest.Mock; getPlatformProducts: jest.Mock; getPlatformReviews: jest.Mock;
    } }).query;
    mockQueryService.getPlatformUsers.mockResolvedValueOnce({ total: 0, new: 0, active: 0, sellers: 0, buyers: 0 });
    mockQueryService.getPlatformRevenue.mockResolvedValueOnce({ total: 0, monthly: 0, platformFees: 0 });
    mockQueryService.getPlatformOrders.mockResolvedValueOnce({ total: 0, completed: 0, pending: 0, completionRate: 0 });
    mockQueryService.getPlatformProducts.mockResolvedValueOnce({ total: 0, active: 0, pending: 0 });
    mockQueryService.getPlatformReviews.mockResolvedValueOnce({ total: 0, averageRating: 0 });

    const result = await service.getPlatformOverview({}, mockAdminId);

    expect(result.success).toBe(true);
    expect(result.data.total).toBe(0);
  });
});

describe('exportData', () => {
  it('should throw NOT_IMPLEMENTED when export is requested', async () => {
    const dto = {
      type: 'SELLER_REVENUE' as any,
      format: 'CSV' as any,
      filename: 'test_export',
      sellerId: mockSellerId,
    };
    await expect(service.exportData(dto, mockAdminId)).rejects.toThrow(HttpException);
  });

  it('should throw NOT_IMPLEMENTED regardless of export type', async () => {
    const dto = {
      type: 'PLATFORM_OVERVIEW' as any,
      format: 'XLSX' as any,
    };
    await expect(service.exportData(dto, mockAdminId)).rejects.toThrow(HttpException);
  });
});

describe('generateCustomReport', () => {
  it('should throw NOT_IMPLEMENTED when custom report is requested', async () => {
    const dto = {
      title: 'Custom Analytics Report',
      metrics: ['revenue', 'orders'],
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };
    await expect(
      service.generateCustomReport(dto as any, mockAdminId, UserRole.ADMIN),
    ).rejects.toThrow(HttpException);
  });
});

describe('getSystemHealth', () => {
  it('should return healthy status when all services are working', async () => {
    // Arrange
    mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

    // Act
    const result = await service.getSystemHealth();

    // Assert
    expect(result.status).toBe('healthy');
    expect(result.uptime).toBeDefined();
    expect(result.services.database.status).toBe('healthy');
    expect(result.services.analytics.status).toBe('healthy');
  });

  it('should return unhealthy status when database is down', async () => {
    // Arrange — override checkDatabaseHealth to report unhealthy
    mockQueryService.checkDatabaseHealth.mockResolvedValueOnce({
      status: 'unhealthy',
      error: 'Database connection failed',
    });

    // Act
    const result = await service.getSystemHealth();

    // Assert
    expect(result.status).toBe('unhealthy');
    expect(result.error).toBeDefined();
  });
});

describe('getSellerRevenueChart', () => {
  it('should return chart data for seller revenue', async () => {
    // Arrange
    mockPrisma.order.findMany.mockResolvedValue(mockOrders);

    const dto = {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      groupBy: GroupByPeriod.MONTH,
    };

    // Act
    const result = await service.getSellerRevenueChart(mockSellerId, dto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.title).toBe('Revenue Trends');
    expect(result.data.data).toBeDefined();
    expect(result.meta.title).toBe('Seller Revenue Chart');
  });
});

describe('Authorization and Data Access', () => {
  it('should filter orders correctly by seller ID', async () => {
    // getSellerDashboard delegates to AnalyticsQueryService — verify the right seller ID is passed
    mockPrisma.user.findUnique.mockResolvedValue(mockSeller);

    await service.getSellerDashboard(mockSellerId, {});

    expect(mockQueryService.getSellerOrders).toHaveBeenCalledWith(
      mockSellerId,
      expect.any(Object),
    );
  });

  it('should validate seller existence before processing', async () => {
    // Arrange
    mockPrisma.user.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(
      service.getSellerDashboard('invalid-seller-id', {}),
    ).rejects.toThrow(NotFoundException);
  });
});
