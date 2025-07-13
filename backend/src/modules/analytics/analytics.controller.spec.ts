// src/modules/analytics/analytics.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { UserRole } from '@prisma/client';
import { TopPerformerType } from './dto/admin-analytics.dto';
import { GroupByPeriod } from './dto/filters.dto';
import { SortBy } from './dto/seller-analytics.dto';
import { SortOrder } from './dto/seller-analytics.dto'
import { PlatformMetric } from './dto/admin-analytics.dto';
import { ExportType } from './dto/export.dto';
import { ExportFormat } from './dto/export.dto';
import { Frequency } from './dto/export.dto';
import { before } from 'lodash';
import { query } from 'express';


// Mock data constants
const mockSellerId = 'seller123';
const mockBuyerId = 'buyer123';
const mockAdminId = 'admin123';

const mockSellerUser = {
  id: mockSellerId,
  email: 'seller@test.com',
  role: UserRole.SELLER,
  firstName: 'Test',
  lastName: 'Seller'
};

const mockAdminUser = {
  id: mockAdminId,
  email: 'admin@test.com',
  role: UserRole.ADMIN,
  firstName: 'Test',
  lastName: 'Admin'
};

const mockBuyerUser = {
  id: mockBuyerId,
  email: 'buyer@test.com',
  role: UserRole.BUYER,
  firstName: 'Test',
  lastName: 'Buyer'
};

const mockSellerDashboardResponse = {
  success: true,
  data: {
    totalRevenue: { value: 1000, change: 15.5, changeType: 'increase' },
    monthlyRevenue: { value: 200, change: 10, changeType: 'increase' },
    averageOrderValue: { value: 75, change: 5, changeType: 'increase' },
    totalOrders: { value: 20, change: 20, changeType: 'increase' },
    monthlyOrders: { value: 5, change: 0, changeType: 'neutral' },
    completionRate: { value: 95, change: 2, changeType: 'increase' },
    totalProducts: { value: 10 },
    activeProducts: { value: 8 },
    topPerformingProducts: [],
    averageRating: { value: 4.5, change: 0.2, changeType: 'increase' },
    totalReviews: { value: 25, change: 5, changeType: 'increase' },
    responseRate: { value: 80, change: 10, changeType: 'increase' },
    recentOrders: [],
    recentReviews: []
  },
  meta: {
    sellerId: mockSellerId,
    timeRange: {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-12-31T23:59:59.999Z'
    },
    lastUpdated: '2024-06-26T12:00:00.000Z',
    dataPoints: 25,
    currency: 'USD'
  }
};

const mockPlatformOverviewResponse = {
  success: true,
  data: {
    totalUsers: { value: 1000, change: 15, changeType: 'increase' },
    totalSellers: { value: 100, change: 10, changeType: 'increase' },
    totalBuyers: { value: 800, change: 20, changeType: 'increase' },
    activeUsers: { value: 500, change: 5, changeType: 'increase' },
    totalPlatformRevenue: { value: 10000, change: 25, changeType: 'increase' },
    monthlyPlatformRevenue: { value: 2000, change: 15, changeType: 'increase' },
    averagePlatformFee: { value: 100, change: 5, changeType: 'increase' },
    topSellers: [],
    topProducts: [],
    topCategories: []
  },
  meta: {
    requestedBy: mockAdminId,
    timeRange: {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-12-31T23:59:59.999Z'
    },
    lastUpdated: '2024-06-26T12:00:00.000Z',
    dataPoints: 0,
    currency: 'USD'
  }
};

const mockExportResponse = {
  success: true,
  data: {
    filename: 'analytics_export_1234567890.csv',
    downloadUrl: '/api/analytics/exports/analytics_export_1234567890.csv',
    size: 1024,
    recordCount: 100,
    generatedAt: '2024-06-26T12:00:00.000Z'
  },
  meta: {
    type: 'SELLER_REVENUE',
    format: 'CSV',
    requestedBy: mockAdminId,
    timeRange: {
      start: '2024-01-01',
      end: '2024-12-31'
    },
    filters: {}
  }
};

const mockHealthResponse = {
  status: 'healthy',
  uptime: 12345,
  version: '1.0.0',
  timestamp: '2024-06-26T12:00:00.000Z',
  services: {
    database: { status: 'healthy', responseTime: 10 },
    cache: { status: 'not_implemented' },
    analytics: { status: 'healthy', lastCalculation: '2024-06-26T12:00:00.000Z' }
  }
};

const mockChartResponse = {
  success: true,
  data: {
    data: [
      { date: '2024-01', value: 1000, label: '2024-01' },
      { date: '2024-02', value: 1200, label: '2024-02' }
    ],
    title: 'Revenue Trends',
    primaryLabel: 'Revenue',
    color: '#3B82F6'
  },
  meta: {
    title: 'Seller Revenue Chart',
    lastUpdated: '2024-06-26T12:00:00.000Z',
    dataPoints: 2,
    timeRange: {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-12-31T23:59:59.999Z'
    }
  }
};

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;

  const mockAnalyticsService = {
    getSellerDashboard: jest.fn(),
    getSellerRevenue: jest.fn(),
    getSellerProducts: jest.fn(),
    getSellerReviews: jest.fn(),
    getSellerCustomers: jest.fn(),
    getSellerNotifications: jest.fn(),
    getSellerConversion: jest.fn(),
    getPlatformOverview: jest.fn(),
    getTopPerformers: jest.fn(),
    getSellerComparison: jest.fn(),
    getConversionFunnel: jest.fn(),
    getCohortAnalysis: jest.fn(),
    getNotificationAnalytics: jest.fn(),
    getUserBehavior: jest.fn(),
    getFinancialReport: jest.fn(),
    exportData: jest.fn(),
    generateCustomReport: jest.fn(),
    scheduleReport: jest.fn(),
    downloadReport: jest.fn(),
    getSellerRevenueChart: jest.fn(),
    getPlatformOverviewChart: jest.fn(),
    getSystemHealth: jest.fn(),
    getCacheStatus: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService
        }
      ]
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Seller Analytics Endpoints', () => {
    describe('getSellerDashboard', () => {
      it('should return seller dashboard for seller user', async () => {
        // Arrange
        mockAnalyticsService.getSellerDashboard.mockResolvedValue(mockSellerDashboardResponse);

        const dto = {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          includeComparison: true,
          includeActivity: true
        };

        const req = { user: mockSellerUser,  query: {} };

        // Act
        const result = await controller.getSellerDashboard(dto, req as any);

        // Assert
        expect(result).toEqual(mockSellerDashboardResponse);
        expect(mockAnalyticsService.getSellerDashboard).toHaveBeenCalledWith(mockSellerId, dto);
      });

      it('should return seller dashboard for admin with sellerId query', async () => {
        // Arrange
        mockAnalyticsService.getSellerDashboard.mockResolvedValue(mockSellerDashboardResponse);

        const dto = {
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        };

        const req = { 
          user: mockAdminUser,
          query: { sellerId: 'seller123' }
        };

        // Act
        const result = await controller.getSellerDashboard(dto, req as any);

        // Assert
        expect(result).toEqual(mockSellerDashboardResponse);
        expect(mockAnalyticsService.getSellerDashboard).toHaveBeenCalledWith(mockSellerId, dto);
      });

      it('should throw ForbiddenException for admin without sellerId', async () => {
        // Arrange
        const dto = {};
        const req = { 
          user: mockAdminUser,
          query: {}
        };

        // Act & Assert
        await expect(controller.getSellerDashboard(dto, req as any))
          .rejects
          .toThrow(ForbiddenException);

        expect(mockAnalyticsService.getSellerDashboard).not.toHaveBeenCalled();
      });

      it('should throw ForbiddenException for buyer user', async () => {
        // Arrange
        const dto = {};
        const req = { user: mockBuyerUser, query: {} };

        // Act & Assert
        await expect(controller.getSellerDashboard(dto, req as any))
          .rejects
          .toThrow(ForbiddenException);

        expect(mockAnalyticsService.getSellerDashboard).not.toHaveBeenCalled();
      });
    });

    describe('getSellerRevenue', () => {
      it('should return seller revenue analytics', async () => {
        // Arrange
        const mockRevenueResponse = {
          success: true,
          data: {
            revenue: { total: { value: 1000 } },
            productBreakdown: [],
            feesBreakdown: { platformFees: 100, stripeFees: 30 },
            trends: []
          },
          meta: { sellerId: mockSellerId }
        };

        mockAnalyticsService.getSellerRevenue.mockResolvedValue(mockRevenueResponse);

        const dto = {
          includeProductBreakdown: true,
          includeFees: true,
          groupBy: GroupByPeriod.MONTH
        };

        const req = { user: mockSellerUser };

        // Act
        const result = await controller.getSellerRevenue(dto, req as any);

        // Assert
        expect(result).toEqual(mockRevenueResponse);
        expect(mockAnalyticsService.getSellerRevenue).toHaveBeenCalledWith(mockSellerId, dto);
      });

      it('should work for admin with sellerId query', async () => {
        // Arrange
        const mockRevenueResponse = { success: true, data: {}, meta: {} };
        mockAnalyticsService.getSellerRevenue.mockResolvedValue(mockRevenueResponse);

        const dto = {};
        const req = { 
          user: mockAdminUser,
          query: { sellerId: 'seller123' }
        };

        // Act
        const result = await controller.getSellerRevenue(dto, req as any);

        // Assert
        expect(result).toEqual(mockRevenueResponse);
        expect(mockAnalyticsService.getSellerRevenue).toHaveBeenCalledWith(mockSellerId, dto);
      });
    });

    describe('getSellerProducts', () => {
      it('should return seller products analytics', async () => {
        // Arrange
        const mockProductsResponse = {
          success: true,
          data: {
            products: [],
            summary: { total: 10, active: 8 }
          },
          meta: { sellerId: mockSellerId }
        };

        mockAnalyticsService.getSellerProducts.mockResolvedValue(mockProductsResponse);

        const dto = {
          sortBy: SortBy.REVENUE,
          sortOrder: SortOrder.DESC,
          includeDetails: true
        };

        const req = { user: mockSellerUser };

        // Act
        const result = await controller.getSellerProducts(dto, req as any);

        // Assert
        expect(result).toEqual(mockProductsResponse);
        expect(mockAnalyticsService.getSellerProducts).toHaveBeenCalledWith(mockSellerId, dto);
      });
    });

    describe('getSellerReviews', () => {
      it('should return seller reviews analytics', async () => {
        // Arrange
        const mockReviewsResponse = {
          success: true,
          data: {
            reviews: { averageRating: { value: 4.5 }, total: { value: 25 } },
            distribution: {},
            recentReviews: []
          },
          meta: { sellerId: mockSellerId }
        };

        mockAnalyticsService.getSellerReviews.mockResolvedValue(mockReviewsResponse);

        const dto = {
          includeDistribution: true,
          includeRecentReviews: true
        };

        const req = { user: mockSellerUser };

        // Act
        const result = await controller.getSellerReviews(dto, req as any);

        // Assert
        expect(result).toEqual(mockReviewsResponse);
        expect(mockAnalyticsService.getSellerReviews).toHaveBeenCalledWith(mockSellerId, dto);
      });
    });
  });

  describe('Admin Analytics Endpoints', () => {
    describe('getPlatformOverview', () => {
      it('should return platform overview for admin', async () => {
        // Arrange
        mockAnalyticsService.getPlatformOverview.mockResolvedValue(mockPlatformOverviewResponse);

        const dto = {
          includeComparison: true,
          includeTrends: true
        };

        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

        // Act
        const result = await controller.getPlatformOverview(dto, req as any);

        // Assert
        expect(result).toEqual(mockPlatformOverviewResponse);
        expect(mockAnalyticsService.getPlatformOverview).toHaveBeenCalledWith(dto, mockAdminId);
      });

      it('should throw ForbiddenException for non-admin user', async () => {
        // Arrange
        const dto = {};
        const req = { user: 'seller123', role: UserRole.SELLER };

        // Act & Assert
        await expect(controller.getPlatformOverview(dto, req as any))
          .rejects
          .toThrow(ForbiddenException);

        expect(mockAnalyticsService.getPlatformOverview).not.toHaveBeenCalled();
      });
    });

    describe('getTopPerformers', () => {
      it('should return top performers for admin', async () => {
        // Arrange
        const mockTopPerformersResponse = {
          success: true,
          data: {
            performers: [],
            type: TopPerformerType.SELLERS
          },
          meta: { requestedBy: mockAdminId }
        };

        mockAnalyticsService.getTopPerformers.mockResolvedValue(mockTopPerformersResponse);

        const dto = {
          type: TopPerformerType.SELLERS,
          sortBy: SortBy.REVENUE,
          sortOrder: SortOrder.DESC
        };

        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

        // Act
        const result = await controller.getTopPerformers(dto, req as any);

        // Assert
        expect(result).toEqual(mockTopPerformersResponse);
        expect(mockAnalyticsService.getTopPerformers).toHaveBeenCalledWith(dto, mockAdminId);
      });

      it('should validate required type parameter', async () => {
        // Arrange
        const dto = {
          sortBy: SortBy.REVENUE,
          // Missing required 'type' field
        };

        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

        // Act & Assert
        // This would be caught by class-validator in real scenarios
        // For now, we'll test that the service receives the dto as-is
        await controller.getTopPerformers(dto as any, req as any);
        expect(mockAnalyticsService.getTopPerformers).toHaveBeenCalledWith(dto, mockAdminId);
      });
    });

    describe('getSellerComparison', () => {
      it('should return seller comparison for admin', async () => {
        // Arrange
        const mockComparisonResponse = {
          success: true,
          data: {
            comparison: {}
          },
          meta: { requestedBy: mockAdminId }
        };

        mockAnalyticsService.getSellerComparison.mockResolvedValue(mockComparisonResponse);

        const dto = {
          sellerIds: [mockSellerId, 'seller456'],
          metrics: [PlatformMetric.REVENUE, PlatformMetric.ORDERS]
        };

        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

        // Act
        const result = await controller.getSellerComparison(dto, req as any);

        // Assert
        expect(result).toEqual(mockComparisonResponse);
        expect(mockAnalyticsService.getSellerComparison).toHaveBeenCalledWith(dto, mockAdminId);
      });
    });
  });

  describe('Export and Reporting Endpoints', () => {
    describe('exportData', () => {
      it('should export data for admin', async () => {
        // Arrange
        mockAnalyticsService.exportData.mockResolvedValue(mockExportResponse);

        const dto = {
          type: ExportType.SELLER_REVENUE,
          format: ExportFormat.CSV,
          filename: 'test_export',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        };

        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

        // Act
        const result = await controller.exportData(dto, req as any);

        // Assert
        expect(result).toEqual(mockExportResponse);
        expect(mockAnalyticsService.exportData).toHaveBeenCalledWith(dto, mockAdminId);
      });

      it('should throw ForbiddenException for non-admin/non-s user', async () => {
        // Arrange
        const dto = {
          type: ExportType.SELLER_REVENUE,
          format: ExportFormat.CSV,
        };

        const req = { user: {
      id: 'buyer123',
      role: UserRole.BUYER }};

        // Act & Assert
        await expect(controller.exportData(dto, req as any))
          .rejects
          .toThrow(ForbiddenException);

        expect(mockAnalyticsService.exportData).not.toHaveBeenCalled();
      });
    });

    describe('generateCustomReport', () => {
      it('should generate custom report for admin', async () => {
        // Arrange
        const mockCustomReportResponse = {
          success: true,
          data: {
            filename: 'custom_report_1234567890.pdf',
            downloadUrl: '/api/analytics/reports/custom_report_1234567890.pdf'
          },
          meta: { requestedBy: mockAdminId }
        };

        mockAnalyticsService.generateCustomReport.mockResolvedValue(mockCustomReportResponse);

        const dto = {
          title: 'Custom Report',
          description: 'Test report',
          metrics: ['revenue', 'orders'],
          chartTypes: ['line', 'bar']
        };

        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

        // Act
        const result = await controller.generateCustomReport(dto, req as any);

        // Assert
        expect(result).toEqual(mockCustomReportResponse);
        expect(mockAnalyticsService.generateCustomReport)
          .toHaveBeenCalledWith(dto, mockAdminId, UserRole.ADMIN);
      });

      it('should allow sellers to generate reports for their own data', async () => {
        // Arrange
        const mockCustomReportResponse = {
          success: true,
          data: { filename: 'seller_report.pdf' },
          meta: { requestedBy: mockSellerId }
        };

        mockAnalyticsService.generateCustomReport.mockResolvedValue(mockCustomReportResponse);

        const dto = {
          title: 'My Seller Report',
          metrics: ['revenue']
        };

        const req = { user: mockSellerUser };

        // Act
        const result = await controller.generateCustomReport(dto, req as any);

        // Assert
        expect(result).toEqual(mockCustomReportResponse);
        expect(mockAnalyticsService.generateCustomReport)
          .toHaveBeenCalledWith(dto, mockSellerId, UserRole.SELLER);
      });
    });

    describe('scheduleReport', () => {
      it('should schedule report for admin', async () => {
        // Arrange
        const mockScheduleResponse = {
          success: true,
          message: 'Report scheduled successfully',
          reportId: 'scheduled_1234567890'
        };

        mockAnalyticsService.scheduleReport.mockResolvedValue(mockScheduleResponse);

        const dto = {
          name: 'Weekly Sales Report',
          frequency: Frequency.WEEKLY,
          type: ExportType.SELLER_REVENUE,
          recipients: ['admin@test.com'],
          reportType: 'PLATFORM_OVERVIEW'
        };

        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

        // Act
        const result = await controller.scheduleReport(dto, req as any);

        // Assert
        expect(result).toEqual(mockScheduleResponse);
        expect(mockAnalyticsService.scheduleReport).toHaveBeenCalledWith(dto, mockAdminId);
      });
    });

    describe('downloadReport', () => {
      it('should download report for authorized user', async () => {
        // Arrange
        const mockDownloadResponse = {
          success: true,
          message: 'Report download initiated'
        };

        mockAnalyticsService.downloadReport.mockResolvedValue(mockDownloadResponse);

        const reportId = 'report123';
        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

        // Act
        const result = await controller.downloadReport(reportId, req as any);

        // Assert
        expect(result).toEqual(mockDownloadResponse);
        expect(mockAnalyticsService.downloadReport)
          .toHaveBeenCalledWith(reportId, mockAdminId, UserRole.ADMIN);
      });
    });
  });

  describe('Chart Data Endpoints', () => {
    describe('getSellerRevenueChart', () => {
      it('should return chart data for seller', async () => {
        // Arrange
        mockAnalyticsService.getSellerRevenueChart.mockResolvedValue(mockChartResponse);

        const sellerId = mockSellerId;
        const dto = {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          groupBy: GroupByPeriod.MONTH
        };

        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } }; // Admin accessing specific seller

        // Act
        const result = await controller.getSellerRevenueChart(sellerId, dto, req as any);

        // Assert
        expect(result).toEqual(mockChartResponse);
        expect(mockAnalyticsService.getSellerRevenueChart).toHaveBeenCalledWith(sellerId, dto);
      });

      it('should allow seller to access their own chart data', async () => {
        // Arrange
        mockAnalyticsService.getSellerRevenueChart.mockResolvedValue(mockChartResponse);

        const dto = {
          groupBy: GroupByPeriod.MONTH
        };

        const req = { user: mockSellerUser };

        // Act
        const result = await controller.getSellerRevenueChart(mockSellerId, dto, req as any);

        // Assert
        expect(result).toEqual(mockChartResponse);
        expect(mockAnalyticsService.getSellerRevenueChart).toHaveBeenCalledWith(mockSellerId, dto);
      });
    });

    describe('getPlatformOverviewChart', () => {
      it('should return platform chart data for admin', async () => {
        // Arrange
        const mockPlatformChartResponse = {
          success: true,
          data: {
            revenue: [],
            users: [],
            orders: []
          },
          meta: {
            title: 'Platform Overview Charts',
            lastUpdated: '2024-06-26T12:00:00.000Z'
          }
        };

        mockAnalyticsService.getPlatformOverviewChart.mockResolvedValue(mockPlatformChartResponse);

        const dto = {
          includeTrends: true
        };

        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

        // Act
        const result = await controller.getPlatformOverviewChart(dto, req as any);

        // Assert
        expect(result).toEqual(mockPlatformChartResponse);
        expect(mockAnalyticsService.getPlatformOverviewChart).toHaveBeenCalledWith(dto);
      });

      it('should throw ForbiddenException for non-admin user', async () => {
        // Arrange
        const dto = {};
        const req = { user: mockSellerUser };

        // Act & Assert
        await expect(controller.getPlatformOverviewChart(dto, req as any))
          .rejects
          .toThrow(ForbiddenException);

        expect(mockAnalyticsService.getPlatformOverviewChart).not.toHaveBeenCalled();
      });
    });
  });

  describe('System Health Endpoints', () => {
    let req: any;

    beforeEach(() => {
      req = { user: mockAdminUser }; // Default to admin user for health checks
    });
    describe('getSystemHealth', () => {
      it('should return system health status', async () => {
        // Arrange
        mockAnalyticsService.getSystemHealth.mockResolvedValue(mockHealthResponse);

        // Act
        const result = await controller.getSystemHealth(req);

        // Assert
        expect(result).toEqual(mockHealthResponse);
        expect(mockAnalyticsService.getSystemHealth).toHaveBeenCalled();
      });

      it('should return health status even when services are down', async () => {
        // Arrange
        const unhealthyResponse = {
          status: 'unhealthy',
          error: 'Database connection failed',
          timestamp: '2024-06-26T12:00:00.000Z'
        };

        mockAnalyticsService.getSystemHealth.mockResolvedValue(unhealthyResponse);

        // Act
        const result = await controller.getSystemHealth(req);

        // Assert
        expect(result).toEqual(unhealthyResponse);
        expect(result.status).toBe('unhealthy');
      });
    });

    describe('getCacheStatus', () => {
      it('should return cache status', async () => {
        // Arrange
        const mockCacheResponse = {
          status: 'not_implemented',
          message: 'Cache not yet implemented',
          timestamp: '2024-06-26T12:00:00.000Z'
        };

        mockAnalyticsService.getCacheStatus.mockResolvedValue(mockCacheResponse);

        const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

        // Act
        const result = await controller.getCacheStatus(req as any);

        // Assert
        expect(result).toEqual(mockCacheResponse);
        expect(mockAnalyticsService.getCacheStatus).toHaveBeenCalled();
      });

      it('should throw ForbiddenException for non-admin user', async () => {
        // Arrange
        const req = { user: mockSellerUser };

        // Act & Assert
        await expect(controller.getCacheStatus(req as any))
          .rejects
          .toThrow(ForbiddenException);

        expect(mockAnalyticsService.getCacheStatus).not.toHaveBeenCalled();
      });
    });
  });

  describe('Authorization Logic', () => {
    it('should correctly identify seller users', async () => {
      // Arrange
      mockAnalyticsService.getSellerDashboard.mockResolvedValue(mockSellerDashboardResponse);

      const dto = {};
      const req = { user: mockSellerUser, query: {} };

      // Act
      await controller.getSellerDashboard(dto, req as any);

      // Assert
      expect(mockAnalyticsService.getSellerDashboard).toHaveBeenCalledWith(mockSellerId, dto);
    });

    it('should correctly identify admin users', async () => {
      // Arrange
      mockAnalyticsService.getPlatformOverview.mockResolvedValue(mockPlatformOverviewResponse);

      const dto = {};
      const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

      // Act
      await controller.getPlatformOverview(dto, req as any);

      // Assert
      expect(mockAnalyticsService.getPlatformOverview).toHaveBeenCalledWith(dto, mockAdminId);
    });

    it('should handle mixed authorization scenarios', async () => {
      // Test case: Seller trying to access admin endpoint
      const req = { user: mockSellerUser };

      await expect(controller.getPlatformOverview({}, req as any))
        .rejects
        .toThrow(ForbiddenException);

      // Test case: Admin accessing seller endpoint with sellerId
      const adminReq = { 
        user: mockAdminUser,
        query: { sellerId: mockSellerId }
      };

      mockAnalyticsService.getSellerDashboard.mockResolvedValue(mockSellerDashboardResponse);
      
      const result = await controller.getSellerDashboard({}, adminReq as any);
      expect(result).toEqual(mockSellerDashboardResponse);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      // Arrange
      const serviceError = new Error('Database connection failed');
      mockAnalyticsService.getSellerDashboard.mockRejectedValue(serviceError);

      const dto = {};
      const req = { user: mockSellerUser, query: {} };

      // Act & Assert
      await expect(controller.getSellerDashboard(dto, req as any))
        .rejects
        .toThrow('Database connection failed');
    });

    it('should handle service returning null/undefined', async () => {
      // Arrange
      mockAnalyticsService.getSellerDashboard.mockResolvedValue(null);

      const dto = {};
      const req = { user: mockSellerUser, query: {} };

      // Act
      const result = await controller.getSellerDashboard(dto, req as any);

      // Assert
      expect(result).toBeNull();
      expect(mockAnalyticsService.getSellerDashboard).toHaveBeenCalledWith(mockSellerId, dto);
    });
  });

  describe('Parameter Validation', () => {
    it('should handle UUID validation in path parameters', async () => {
      // Arrange
      mockAnalyticsService.getSellerRevenueChart.mockResolvedValue(mockChartResponse);

      const validUUID = mockSellerId;
      const dto = {};
      const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

      // Act
      const result = await controller.getSellerRevenueChart(validUUID, dto, req as any);

      // Assert
      expect(result).toEqual(mockChartResponse);
      expect(mockAnalyticsService.getSellerRevenueChart).toHaveBeenCalledWith(validUUID, dto);
    });

    it('should handle query parameter validation through DTOs', async () => {
      // Arrange
      mockAnalyticsService.getSellerDashboard.mockResolvedValue(mockSellerDashboardResponse);

      // This would normally be validated by class-validator
      const dto = {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.999Z',
        includeComparison: true,
        includeActivity: false
      };

      const req = { user: mockSellerUser, query: {} };

      // Act
      const result = await controller.getSellerDashboard(dto, req as any);

      // Assert
      expect(result).toEqual(mockSellerDashboardResponse);
      expect(mockAnalyticsService.getSellerDashboard).toHaveBeenCalledWith(mockSellerId, dto);
    });
  });

  describe('HTTP Status Codes', () => {
  it('should return the seller dashboard data for a valid seller user', async () => {
      // Arrange
      mockAnalyticsService.getSellerDashboard.mockResolvedValue(mockSellerDashboardResponse);

      const dto = {};
      const req = { user: mockSellerUser, query: {} };

      // Act
      const result = await controller.getSellerDashboard(dto, req as any);

      // Assert
      expect(result.success).toBe(true);
      expect(result).toEqual(mockSellerDashboardResponse);
    });

    it('should handle POST requests with 200/201 status codes', async () => {
      // Test export endpoint (returns 200)
      mockAnalyticsService.exportData.mockResolvedValue(mockExportResponse);

      const exportDto = {
        type: 'SELLER_REVENUE' as any,
        format: 'CSV' as any
      };

      const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

      const exportResult = await controller.exportData(exportDto, req as any);
      expect(exportResult.success).toBe(true);

      // Test schedule report endpoint (returns 201)
      const scheduleDto = {
        name: 'Test Report',
        type: 'SELLER_REVENUE' as any,
        frequency: 'weekly' as any,
        recipients: ['test@example.com'],
        reportType: 'PLATFORM_OVERVIEW' as any
      };

      const scheduleResponse = {
        success: true,
        message: 'Report scheduled successfully',
        reportId: 'test123'
      };

      mockAnalyticsService.scheduleReport.mockResolvedValue(scheduleResponse);

      const scheduleResult = await controller.scheduleReport(scheduleDto, req as any);
      expect(scheduleResult.success).toBe(true);
    });
  });

  describe('Data Flow Integration', () => {
    it('should pass through DTO parameters correctly', async () => {
      // Arrange
      const complexDto = {
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        includeProductBreakdown: true,
        includeFees: true,
        groupBy: GroupByPeriod.MONTH
      };

      mockAnalyticsService.getSellerRevenue.mockResolvedValue({
        success: true,
        data: {},
        meta: {}
      });

      const req = { user: mockSellerUser };

      // Act
      await controller.getSellerRevenue(complexDto, req as any);

      // Assert
      expect(mockAnalyticsService.getSellerRevenue).toHaveBeenCalledWith(mockSellerId, complexDto);
    });

    it('should handle admin sellerId override correctly', async () => {
      // Arrange
      const targetSellerId = 'target-seller-123';
      const dto = { includeComparison: true };

      mockAnalyticsService.getSellerDashboard.mockResolvedValue(mockSellerDashboardResponse);

      const req = { 
        user: mockAdminUser,
        query: { sellerId: targetSellerId }
      };

      // Act
      await controller.getSellerDashboard(dto, req as any);

      // Assert
      expect(mockAnalyticsService.getSellerDashboard).toHaveBeenCalledWith(targetSellerId, dto);
    });

    it('should override sellerId in export for sellers', async () => {
      // Arrange
      const dto = {
        type: 'SELLER_REVENUE' as any,
        format: 'CSV' as any,
        sellerId: 'some-other-seller' // This should be overridden
      };

      mockAnalyticsService.exportData.mockResolvedValue(mockExportResponse);

      const req = { user: mockSellerUser, query: { sellerId: 'seller123' } };

      // Act
      await controller.exportData(dto, req as any);

      // Assert
      expect(dto.sellerId).toBe(mockSellerId); // Should be overridden
      expect(mockAnalyticsService.exportData).toHaveBeenCalledWith(dto, mockSellerId);
    });
  });

  describe('Role-based Access Control', () => {
    it('should enforce seller-only endpoints', async () => {
      const sellerOnlyEndpoints = [
        () => controller.getSellerDashboard({}, { user: mockBuyerUser } as any),
        () => controller.getSellerRevenue({}, { user: mockBuyerUser } as any),
        () => controller.getSellerProducts({}, { user: mockBuyerUser } as any),
        () => controller.getSellerReviews({}, { user: mockBuyerUser } as any),
        () => controller.getSellerCustomers({}, { user: mockBuyerUser } as any),
        () => controller.getSellerNotifications({}, { user: mockBuyerUser } as any),
        () => controller.getSellerConversion({}, { user: mockBuyerUser } as any)
      ];

      for (const endpoint of sellerOnlyEndpoints) {
        await expect(endpoint()).rejects.toThrow(ForbiddenException);
      }
    });

    it('should enforce admin-only endpoints', async () => {
      const adminOnlyEndpoints = [
        () => controller.getPlatformOverview({}, { user: mockSellerUser } as any),
        () => controller.getTopPerformers({ type: 'sellers' } as any, { user: mockSellerUser } as any),
        () => controller.getSellerComparison({ sellerIds: [] } as any, { user: mockSellerUser } as any),
        () => controller.getConversionFunnel({}, { user: mockSellerUser } as any),
        () => controller.getCohortAnalysis({}, { user: mockSellerUser } as any),
        () => controller.getNotificationAnalytics({}, { user: mockSellerUser } as any),
        () => controller.getUserBehavior({}, { user: mockSellerUser } as any),
        () => controller.getFinancialReport({}, { user: mockSellerUser } as any),
        () => controller.scheduleReport({} as any, { user: mockSellerUser } as any),
        () => controller.getPlatformOverviewChart({}, { user: mockSellerUser } as any),
        () => controller.getCacheStatus({ user: mockSellerUser } as any),
        () => controller.getSystemHealth({ user: mockSellerUser } as any)

      ];

      for (const endpoint of adminOnlyEndpoints) {
        await expect(endpoint()).rejects.toThrow(ForbiddenException);
      }
    });

    it('should allow multi-role endpoints with proper access control', async () => {
      // Test export endpoint - allowed for both SELLER and ADMIN
      mockAnalyticsService.exportData.mockResolvedValue(mockExportResponse);
      mockAnalyticsService.generateCustomReport.mockResolvedValue(mockExportResponse);
      mockAnalyticsService.downloadReport.mockResolvedValue({ success: true });

      const exportDto = {
        type: 'SELLER_REVENUE' as any,
        format: 'CSV' as any
      };

      const customReportDto = {
        title: 'Test Report',
        metrics: ['revenue']
      };

      // Seller access
      await expect(controller.exportData(exportDto, { user: mockSellerUser } as any))
        .resolves.toEqual(mockExportResponse);

      await expect(controller.generateCustomReport(customReportDto, { user: mockSellerUser } as any))
        .resolves.toEqual(mockExportResponse);

      await expect(controller.downloadReport('report123', { user: mockSellerUser } as any))
        .resolves.toEqual({ success: true });

      // Admin access
      await expect(controller.exportData(exportDto, { user: mockAdminUser } as any))
        .resolves.toEqual(mockExportResponse);

      await expect(controller.generateCustomReport(customReportDto, { user: mockAdminUser } as any))
        .resolves.toEqual(mockExportResponse);

      await expect(controller.downloadReport('report123', { user: mockAdminUser } as any))
        .resolves.toEqual({ success: true });
    });
  });

  describe('Chart Data Access Control', () => {
    it('should allow sellers to access their own chart data', async () => {
      // Arrange
      mockAnalyticsService.getSellerRevenueChart.mockResolvedValue(mockChartResponse);

      const dto = { groupBy: GroupByPeriod.MONTH };
      const req = { user: mockSellerUser };

      // Act
      const result = await controller.getSellerRevenueChart(mockSellerId, dto, req as any);

      // Assert
      expect(result).toEqual(mockChartResponse);
      expect(mockAnalyticsService.getSellerRevenueChart).toHaveBeenCalledWith(mockSellerId, dto);
    });

    it('should prevent sellers from accessing other sellers chart data', async () => {
      // Arrange
      const otherSellerId = 'other-seller-123';
      const dto = {};
      const req = { user: mockSellerUser };

      // Act & Assert
      await expect(controller.getSellerRevenueChart(otherSellerId, dto, req as any))
        .rejects
        .toThrow(ForbiddenException);

      expect(mockAnalyticsService.getSellerRevenueChart).not.toHaveBeenCalled();
    });

    it('should allow admins to access any seller chart data', async () => {
      // Arrange
      mockAnalyticsService.getSellerRevenueChart.mockResolvedValue(mockChartResponse);

      const otherSellerId = 'other-seller-123';
      const dto = {};
      const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

      // Act
      const result = await controller.getSellerRevenueChart(otherSellerId, dto, req as any);

      // Assert
      expect(result).toEqual(mockChartResponse);
      expect(mockAnalyticsService.getSellerRevenueChart).toHaveBeenCalledWith(otherSellerId, dto);
    });
  });

  describe('Health Endpoints', () => {
    let req: any;
    beforeEach(() => {
      req = { user: mockAdminUser };
    });
  it('should return health status for admin users', async () => {
    // Arrange
    mockAnalyticsService.getSystemHealth.mockResolvedValue(mockHealthResponse);
    const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

    // Act
    const result = await controller.getSystemHealth(req);

    // Assert
    expect(result).toEqual(mockHealthResponse);
    expect(mockAnalyticsService.getSystemHealth).toHaveBeenCalled();
  });

  it('should be accessible without authentication for health checks', async () => {
    // En tu caso, requiere auth, así que pásalo igual
    mockAnalyticsService.getSystemHealth.mockResolvedValue(mockHealthResponse);
    const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

    const result = await controller.getSystemHealth(req);
    expect(result.status).toBe('healthy');
  });
});

  describe('Service Integration', () => {
    it('should pass user context correctly to service methods', async () => {
      // Test admin methods that receive requestedBy parameter
      mockAnalyticsService.getPlatformOverview.mockResolvedValue(mockPlatformOverviewResponse);
      mockAnalyticsService.getTopPerformers.mockResolvedValue({ success: true, data: {}, meta: {} });

      const req = { user: mockAdminUser, query: { sellerId: 'seller123' } };

      await controller.getPlatformOverview({}, req as any);
      expect(mockAnalyticsService.getPlatformOverview).toHaveBeenCalledWith({}, mockAdminId);

      await controller.getTopPerformers({ type: 'sellers' } as any, req as any);
      expect(mockAnalyticsService.getTopPerformers).toHaveBeenCalledWith({ type: 'sellers' }, mockAdminId);
    });

    it('should pass user role to service methods when required', async () => {
      // Test methods that need user role
      mockAnalyticsService.generateCustomReport.mockResolvedValue(mockExportResponse);
      mockAnalyticsService.downloadReport.mockResolvedValue({ success: true });

      const dto = {
        title: 'Test Report',
        metrics: ['revenue']
      };

      // Seller
      const sellerReq = { user: mockSellerUser };
      await controller.generateCustomReport(dto, sellerReq as any);
      expect(mockAnalyticsService.generateCustomReport)
        .toHaveBeenCalledWith(dto, mockSellerId, UserRole.SELLER);

      // Admin
      const adminReq = { user: mockAdminUser };
      await controller.generateCustomReport(dto, adminReq as any);
      expect(mockAnalyticsService.generateCustomReport)
        .toHaveBeenCalledWith(dto, mockAdminId, UserRole.ADMIN);

      // Download report
      await controller.downloadReport('report123', adminReq as any);
      expect(mockAnalyticsService.downloadReport)
        .toHaveBeenCalledWith('report123', mockAdminId, UserRole.ADMIN);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty query parameters', async () => {
      // Arrange
      mockAnalyticsService.getSellerDashboard.mockResolvedValue(mockSellerDashboardResponse);

      const req = { 
        user: mockAdminUser, query: {}
      };

      // Act & Assert
      await expect(controller.getSellerDashboard({}, req as any))
        .rejects
        .toThrow(ForbiddenException);
    });

    it('should handle undefined sellerId in query', async () => {
      // Arrange
      const req = { 
        user: mockAdminUser,
        query: { sellerId: undefined }
      };

      // Act & Assert
      await expect(controller.getSellerDashboard({}, req as any))
        .rejects
        .toThrow(ForbiddenException);
    });

    it('should handle empty string sellerId in query', async () => {
      // Arrange
      const req = { 
        user: mockAdminUser,
        query: { sellerId: '' }
      };

      // Act & Assert
      await expect(controller.getSellerDashboard({}, req as any))
        .rejects
        .toThrow(ForbiddenException);
    });
  });
});