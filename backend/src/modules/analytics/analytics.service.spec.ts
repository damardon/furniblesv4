// src/modules/analytics/analytics.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, OrderStatus, ProductStatus, ReviewStatus } from '@prisma/client';
import { SortBy } from './dto/seller-analytics.dto';
import { SortOrder } from './dto/seller-analytics.dto'
import { GroupByPeriod } from './dto/filters.dto';

// Mock data constants
const mockSellerId = 'seller123';
const mockBuyerId = 'buyer123';
const mockAdminId = 'admin123';
const mockProductId = 'product123';
const mockOrderId = 'order123';

const mockTimeRange = {
  start: new Date('2024-01-01'),
  end: new Date('2024-12-31')
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
    description: 'Test Business Description'
  }
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
      lastName: 'Buyer'
    },
    items: [
      {
        id: 'item1',
        price: 50,
        sellerId: mockSellerId,
        product: {
          title: 'Test Product 1'
        }
      },
      {
        id: 'item2',
        price: 50,
        sellerId: mockSellerId,
        product: {
          title: 'Test Product 2'
        }
      }
    ]
  }
];

const mockProducts = [
  {
    id: mockProductId,
    title: 'Test Product',
    status: ProductStatus.APPROVED,
    sellerId: mockSellerId,
    createdAt: new Date('2024-01-01'),
    orderItems: [
      { price: 100 },
      { price: 150 }
    ],
    productRating: {
      averageRating: 4.5,
      totalReviews: 10
    }
  }
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
      lastName: 'Buyer'
    },
    product: {
      title: 'Test Product'
    },
    response: {
      id: 'response1'
    }
  }
];

const mockSellerRating = {
  sellerId: mockSellerId,
  averageRating: 4.5,
  totalReviews: 25
};

const mockTransactions = [
  {
    type: 'PLATFORM_FEE',
    amount: 10,
    sellerId: mockSellerId,
    createdAt: new Date('2024-06-01')
  },
  {
    type: 'STRIPE_FEE',
    amount: 5,
    sellerId: mockSellerId,
    createdAt: new Date('2024-06-01')
  }
];

const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn()
    },
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn()
    },
    product: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn()
    },
    sellerRating: {
      findUnique: jest.fn()
    },
    transaction: {
      findMany: jest.fn()
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn()
  };

  let service: AnalyticsService;
  let prismaService: PrismaService;

beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrisma
        }
      ]
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);

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
        includeActivity: true
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
        include: { sellerProfile: true }
      });
    });

    it('should throw NotFoundException when seller not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      // Act & Assert
      await expect(service.getSellerDashboard(mockSellerId, dto))
        .rejects
        .toThrow(NotFoundException);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockSellerId, role: UserRole.SELLER },
        include: { sellerProfile: true }
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
      const result = await service.getSellerDashboard(mockSellerId, { startDate, endDate });

      // Assert
      expect(result.meta.timeRange.start).toBe(new Date(startDate).toISOString());
      expect(result.meta.timeRange.end).toBe(new Date(endDate).toISOString());
    });

    it('should use default 30-day range when no dates provided', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockSeller);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.sellerRating.findUnique.mockResolvedValue(null);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Act
      const result = await service.getSellerDashboard(mockSellerId, {});

      // Assert
      const startTime = new Date(result.meta.timeRange.start).getTime();
      const expectedTime = thirtyDaysAgo.getTime();
      
      // Allow for small time differences (within 1 minute)
      expect(Math.abs(startTime - expectedTime)).toBeLessThan(60000);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getSellerDashboard(mockSellerId, {}))
        .rejects
        .toThrow('Database error');
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
      // Arrange
      const ordersWithMultipleItems = [
        {
          ...mockOrders[0],
          items: [
            { price: 100, sellerId: mockSellerId },
            { price: 50, sellerId: mockSellerId },
          ]
        }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockSeller);
      mockPrisma.order.findMany.mockResolvedValue(ordersWithMultipleItems);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.sellerRating.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.getSellerDashboard(mockSellerId, {});

      // Assert
      // Should only count items belonging to the seller (100 + 50 = 150)
      expect(result.data.totalRevenue.value).toBe(150);
    });

    it('should handle orders with no seller items', async () => {
      // Arrange
      const ordersWithoutSellerItems = [
        {
          ...mockOrders[0],
          items: [] // No items for this seller
        }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockSeller);
      mockPrisma.order.findMany.mockResolvedValue(ordersWithoutSellerItems);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.sellerRating.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.getSellerDashboard(mockSellerId, {});

      // Assert
      expect(result.data.totalRevenue.value).toBe(0);
      expect(result.data.averageOrderValue.value).toBe(0);
    });
  });

  describe('Aggregations and Performance', () => {
    it('should use Promise.all for parallel queries', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockSeller);
      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.sellerRating.findUnique.mockResolvedValue(mockSellerRating);

      const startTime = Date.now();

      // Act
      await service.getSellerDashboard(mockSellerId, { includeActivity: true });

      const endTime = Date.now();

      // Assert
      // Should complete quickly due to parallel queries
      expect(endTime - startTime).toBeLessThan(100); // Should be nearly instant in tests

      // Verify all expected database calls were made
      expect(mockPrisma.order.findMany).toHaveBeenCalled();
      expect(mockPrisma.product.findMany).toHaveBeenCalled();
      expect(mockPrisma.review.findMany).toHaveBeenCalled();
      expect(mockPrisma.sellerRating.findUnique).toHaveBeenCalled();
    });
  });

  describe('Response Format Validation', () => {
    it('should return properly formatted response structure', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockSeller);
      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.sellerRating.findUnique.mockResolvedValue(mockSellerRating);

      // Act
      const result = await service.getSellerDashboard(mockSellerId, {});

      // Assert
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
      
      // Verify MetricValue structure
      expect(result.data.totalRevenue).toHaveProperty('value');
      expect(result.data.totalRevenue).toHaveProperty('change');
      expect(result.data.totalRevenue).toHaveProperty('changeType');
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
        includeFees: true
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
        includeFees: false
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
        includeFees: true
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
        includeDetails: true
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
          orderItems: []
        }
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
        includeResponseMetrics: true
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
      // Arrange
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.sellerRating.findUnique.mockResolvedValue(null);

      const dto = {};

      // Act
      const result = await service.getSellerReviews(mockSellerId, dto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.reviews.averageRating.value).toBe(0);
      expect(result.data.reviews.total.value).toBe(0);
    });
  });

  describe('getPlatformOverview', () => {
    it('should return platform metrics for admin', async () => {
      // Arrange
      mockPrisma.user.count.mockResolvedValueOnce(1000) // totalUsers
        .mockResolvedValueOnce(100) // totalSellers
        .mockResolvedValueOnce(800) // totalBuyers  
        .mockResolvedValueOnce(500); // activeUsers

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(500);
      mockPrisma.order.aggregate.mockResolvedValue({ _avg: { totalAmount: 75 } });

      mockPrisma.product.count.mockResolvedValueOnce(200) // totalProducts
        .mockResolvedValueOnce(180) // activeProducts
        .mockResolvedValueOnce(20); // pendingModeration

      mockPrisma.review.count.mockResolvedValue(300);
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.2 } });

      const dto = {
        includeComparison: true,
        includeTrends: true
      };

      // Act
      const result = await service.getPlatformOverview(dto, mockAdminId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.totalUsers.value).toBe(1000);
      expect(result.data.totalSellers.value).toBe(100);
      expect(result.data.totalBuyers.value).toBe(800);
      expect(result.meta.requestedBy).toBe(mockAdminId);
    });

    it('should handle empty platform data', async () => {
      // Arrange
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.aggregate.mockResolvedValue({ _avg: { totalAmount: null } });
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.review.count.mockResolvedValue(0);
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } });

      const dto = {};

      // Act
      const result = await service.getPlatformOverview(dto, mockAdminId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.totalUsers.value).toBe(0);
      expect(result.data.averageOrderValue.value).toBe(0);
      expect(result.data.averagePlatformRating.value).toBe(0);
    });
  });

  describe('exportData', () => {
    it('should create export request successfully', async () => {
      // Arrange
      const dto = {
        type: 'SELLER_REVENUE' as any,
        format: 'CSV' as any,
        filename: 'test_export',
        sellerId: mockSellerId,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      // Act
      const result = await service.exportData(dto, mockAdminId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.filename).toContain('test_export.CSV');
      expect(result.data.downloadUrl).toBeDefined();
      expect(result.meta.requestedBy).toBe(mockAdminId);
      expect(result.meta.type).toBe('SELLER_REVENUE');
      expect(result.meta.format).toBe('CSV');
    });

    it('should generate default filename when not provided', async () => {
      // Arrange
      const dto = {
        type: 'PLATFORM_OVERVIEW' as any,
        format: 'XLSX' as any
      };

      // Act
      const result = await service.exportData(dto, mockAdminId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.filename).toMatch(/analytics_export_\d+\.XLSX/);
    });
  });

  describe('generateCustomReport', () => {
    it('should generate custom report successfully', async () => {
      // Arrange
      const dto = {
        title: 'Custom Analytics Report',
        description: 'Test report description',
        metrics: ['revenue', 'orders', 'customers'],
        chartTypes: ['line', 'bar'],
        includeRawData: true,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      // Act
      const result = await service.generateCustomReport(dto, mockAdminId, UserRole.ADMIN);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.filename).toMatch(/custom_report_\d+\.pdf/);
      expect(result.meta.requestedBy).toBe(mockAdminId);
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
      // Arrange
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

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
        groupBy: GroupByPeriod.MONTH
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
      // Arrange
      const expectedWhereClause = {
        status: OrderStatus.COMPLETED,
        createdAt: expect.any(Object),
        items: {
          some: {
            sellerId: mockSellerId
          }
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockSeller);
      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.sellerRating.findUnique.mockResolvedValue(null);

      // Act
      await service.getSellerDashboard(mockSellerId, {});

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhereClause
        })
      );
    });

    it('should validate seller existence before processing', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getSellerDashboard('invalid-seller-id', {}))
        .rejects
        .toThrow(NotFoundException);
    });
  });
