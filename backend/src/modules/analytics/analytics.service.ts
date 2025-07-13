// src/modules/analytics/analytics.service.ts

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Prisma, OrderStatus, ProductStatus, ReviewStatus } from '@prisma/client';

// Import interfaces
import {
  SellerDashboardMetrics,
  AdminPlatformMetrics,
  ConversionFunnelMetrics,
  CohortMetrics,
  NotificationEngagementMetrics,
  MetricValue,
  ProductMetric,
  SellerMetric,
  CategoryMetric,
  RecentOrderMetric,
  RecentReviewMetric
} from './interfaces/analytics.interface';

import {
  LineChartData,
  ChartResponse,
  TimeSeriesData
} from './interfaces/charts.interface';

// Import DTOs
import {
  GetSellerDashboardDto,
  GetSellerRevenueDto,
  GetSellerProductsDto,
  GetSellerReviewsDto,
  GetSellerCustomersDto,
  GetSellerNotificationsDto,
  GetSellerConversionDto,
  SellerAnalyticsResponseDto
} from './dto/seller-analytics.dto';

import {
  GetPlatformOverviewDto,
  GetTopPerformersDto,
  GetSellerComparisonDto,
  GetConversionFunnelDto,
  GetCohortAnalysisDto,
  GetNotificationAnalyticsDto,
  GetUserBehaviorDto,
  GetFinancialReportDto,
  AdminAnalyticsResponseDto
} from './dto/admin-analytics.dto';

import {
  ExportDataDto,
  CustomReportDto,
  ScheduleReportDto,
  ExportResponseDto,
  ExportType,
  ExportFormat
} from './dto/export.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ================================
  // SELLER ANALYTICS METHODS
  // ================================

  async getSellerDashboard(sellerId: string, dto: GetSellerDashboardDto): Promise<SellerAnalyticsResponseDto> {
    try {
      this.logger.log(`Getting seller dashboard for ${sellerId}`);
      
      const { startDate, endDate, includeComparison = true, includeActivity = true } = dto;
      const timeRange = this.getTimeRange(startDate, endDate);

      // Verify seller exists
      const seller = await this.prisma.user.findUnique({
        where: { id: sellerId, role: UserRole.SELLER },
        include: { sellerProfile: true }
      });

      if (!seller) {
        throw new NotFoundException('Seller not found');
      }

      // Get dashboard metrics
      const [
        revenueData,
        orderData,
        productData,
        reviewData,
        recentOrders,
        recentReviews
      ] = await Promise.all([
        this.calculateSellerRevenue(sellerId, timeRange),
        this.calculateSellerOrders(sellerId, timeRange),
        this.calculateSellerProducts(sellerId, timeRange),
        this.calculateSellerReviews(sellerId, timeRange),
        includeActivity ? this.getSellerRecentOrders(sellerId, 5) : [],
        includeActivity ? this.getSellerRecentReviews(sellerId, 5) : []
      ]);

      const dashboardData: SellerDashboardMetrics = {
        totalRevenue: revenueData.total,
        monthlyRevenue: revenueData.monthly,
        averageOrderValue: revenueData.averageOrderValue,
        totalOrders: orderData.total,
        monthlyOrders: orderData.monthly,
        completionRate: orderData.completionRate,
        totalProducts: productData.total,
        activeProducts: productData.active,
        topPerformingProducts: productData.topPerforming,
        averageRating: reviewData.averageRating,
        totalReviews: reviewData.total,
        responseRate: reviewData.responseRate,
        recentOrders,
        recentReviews
      };

      return {
        success: true,
        data: dashboardData,
        meta: {
          sellerId,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: recentOrders.length + recentReviews.length,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting seller dashboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSellerRevenue(sellerId: string, dto: GetSellerRevenueDto): Promise<SellerAnalyticsResponseDto> {
    try {
      this.logger.log(`Getting seller revenue for ${sellerId}`);
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      
      const [
        revenueMetrics,
        productBreakdown,
        feesBreakdown,
        trends
      ] = await Promise.all([
        this.calculateSellerRevenue(sellerId, timeRange),
        dto.includeProductBreakdown ? this.getRevenueByProduct(sellerId, timeRange) : null,
        dto.includeFees ? this.getSellerFeesBreakdown(sellerId, timeRange) : null,
        this.getSellerRevenueTrends(sellerId, timeRange, dto.groupBy || 'month')
      ]);

      return {
        success: true,
        data: {
          revenue: revenueMetrics,
          productBreakdown,
          feesBreakdown,
          trends
        },
        meta: {
          sellerId,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: trends.length,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting seller revenue: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSellerProducts(sellerId: string, dto: GetSellerProductsDto): Promise<SellerAnalyticsResponseDto> {
    try {
      this.logger.log(`Getting seller products analytics for ${sellerId}`);
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      
      const [products, summary] = await Promise.all([
        this.getSellerProductAnalytics(sellerId, timeRange, dto),
        this.getSellerProductsSummary(sellerId, timeRange)
      ]);

      return {
        success: true,
        data: {
          products,
          summary
        },
        meta: {
          sellerId,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: products.length,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting seller products: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSellerReviews(sellerId: string, dto: GetSellerReviewsDto): Promise<SellerAnalyticsResponseDto> {
    try {
      this.logger.log(`Getting seller reviews analytics for ${sellerId}`);
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      
      const [
        reviewMetrics,
        distribution,
        recentReviews,
        responseMetrics
      ] = await Promise.all([
        this.calculateSellerReviews(sellerId, timeRange),
        dto.includeDistribution ? this.getSellerReviewDistribution(sellerId, timeRange) : null,
        dto.includeRecentReviews ? this.getSellerRecentReviews(sellerId, 10) : [],
        dto.includeResponseMetrics ? this.getSellerResponseMetrics(sellerId, timeRange) : null
      ]);

      return {
        success: true,
        data: {
          reviews: reviewMetrics,
          distribution,
          recentReviews,
          responseMetrics
        },
        meta: {
          sellerId,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: recentReviews.length,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting seller reviews: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSellerCustomers(sellerId: string, dto: GetSellerCustomersDto): Promise<SellerAnalyticsResponseDto> {
    try {
      this.logger.log(`Getting seller customers analytics for ${sellerId}`);
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      
      const [
        customerMetrics,
        repeatAnalysis,
        lifetimeValue
      ] = await Promise.all([
        this.calculateSellerCustomers(sellerId, timeRange),
        dto.includeRepeatAnalysis ? this.getRepeatCustomerAnalysis(sellerId, timeRange) : null,
        dto.includeLifetimeValue ? this.getCustomerLifetimeValue(sellerId, timeRange) : null
      ]);

      return {
        success: true,
        data: {
          customers: customerMetrics,
          repeatAnalysis,
          lifetimeValue
        },
        meta: {
          sellerId,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: 0,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting seller customers: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSellerNotifications(sellerId: string, dto: GetSellerNotificationsDto): Promise<SellerAnalyticsResponseDto> {
    try {
      this.logger.log(`Getting seller notifications analytics for ${sellerId}`);
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      
      const [
        notificationMetrics,
        engagement,
        typeBreakdown
      ] = await Promise.all([
        this.calculateSellerNotifications(sellerId, timeRange),
        dto.includeEngagement ? this.getSellerNotificationEngagement(sellerId, timeRange) : null,
        dto.includeTypeBreakdown ? this.getSellerNotificationTypeBreakdown(sellerId, timeRange) : null
      ]);

      return {
        success: true,
        data: {
          notifications: notificationMetrics,
          engagement,
          typeBreakdown
        },
        meta: {
          sellerId,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: 0,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting seller notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSellerConversion(sellerId: string, dto: GetSellerConversionDto): Promise<SellerAnalyticsResponseDto> {
    try {
      this.logger.log(`Getting seller conversion analytics for ${sellerId}`);
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      
      const [
        conversionMetrics,
        funnelData,
        trafficSource
      ] = await Promise.all([
        this.calculateSellerConversion(sellerId, timeRange),
        dto.includeFunnel ? this.getSellerConversionFunnel(sellerId, timeRange) : null,
        dto.includeTrafficSource ? this.getTrafficSourceConversion(sellerId, timeRange) : null
      ]);

      return {
        success: true,
        data: {
          conversion: conversionMetrics,
          funnelData,
          trafficSource
        },
        meta: {
          sellerId,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: 0,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting seller conversion: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ================================
  // ADMIN ANALYTICS METHODS  
  // ================================

  async getPlatformOverview(dto: GetPlatformOverviewDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    try {
      this.logger.log(`Getting platform overview requested by ${requestedBy}`);
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      
      const [
        userMetrics,
        revenueMetrics,
        orderMetrics,
        productMetrics,
        reviewMetrics,
        topPerformers
      ] = await Promise.all([
        this.calculatePlatformUsers(timeRange),
        this.calculatePlatformRevenue(timeRange),
        this.calculatePlatformOrders(timeRange),
        this.calculatePlatformProducts(timeRange),
        this.calculatePlatformReviews(timeRange),
        this.getPlatformTopPerformers(timeRange)
      ]);

      const platformData: AdminPlatformMetrics = {
        ...userMetrics,
        ...revenueMetrics,
        ...orderMetrics,
        ...productMetrics,
        ...reviewMetrics,
        ...topPerformers
      };

      return {
        success: true,
        data: platformData,
        meta: {
          requestedBy,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: 0,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting platform overview: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTopPerformers(dto: GetTopPerformersDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    try {
      this.logger.log(`Getting top performers: ${dto.type}`);
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      const performers = await this.calculateTopPerformers(dto.type, timeRange, dto);

      return {
        success: true,
        data: {
          performers,
          type: dto.type
        },
        meta: {
          requestedBy,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: performers.length,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting top performers: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSellerComparison(dto: GetSellerComparisonDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    try {
      this.logger.log(`Getting seller comparison for ${dto.sellerIds.length} sellers`);
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      const comparison = await this.calculateSellerComparison(dto.sellerIds, timeRange, dto.metrics);

      return {
        success: true,
        data: comparison,
        meta: {
          requestedBy,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: dto.sellerIds.length,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting seller comparison: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getConversionFunnel(dto: GetConversionFunnelDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    try {
      this.logger.log('Getting platform conversion funnel');
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      const funnelData = await this.calculatePlatformConversionFunnel(timeRange, dto);

      return {
        success: true,
        data: funnelData,
        meta: {
          requestedBy,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: 0,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting conversion funnel: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCohortAnalysis(dto: GetCohortAnalysisDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    try {
      this.logger.log('Getting cohort analysis');
      
      const cohortData = await this.calculateCohortAnalysis(dto);

      return {
        success: true,
        data: cohortData,
        meta: {
          requestedBy,
          timeRange: {
            start: dto.startMonth || '2024-01',
            end: dto.endMonth || '2024-12'
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: cohortData.cohorts?.length || 0,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting cohort analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getNotificationAnalytics(dto: GetNotificationAnalyticsDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    try {
      this.logger.log('Getting platform notification analytics');
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      const notificationData = await this.calculatePlatformNotificationAnalytics(timeRange, dto);

      return {
        success: true,
        data: notificationData,
        meta: {
          requestedBy,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: 0,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting notification analytics: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserBehavior(dto: GetUserBehaviorDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    try {
      this.logger.log('Getting user behavior analytics');
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      const behaviorData = await this.calculateUserBehavior(timeRange, dto);

      return {
        success: true,
        data: behaviorData,
        meta: {
          requestedBy,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: 0,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting user behavior: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFinancialReport(dto: GetFinancialReportDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    try {
      this.logger.log('Getting financial report');
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      const financialData = await this.calculateFinancialReport(timeRange, dto);

      return {
        success: true,
        data: financialData,
        meta: {
          requestedBy,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: 0,
          currency: 'USD'
        }
      };

    } catch (error) {
      this.logger.error(`Error getting financial report: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ================================
  // EXPORT AND REPORTING METHODS
  // ================================

  async exportData(dto: ExportDataDto, requestedBy: string): Promise<ExportResponseDto> {
    try {
      this.logger.log(`Exporting data: ${dto.type} in ${dto.format} format`);
      
      const filename = dto.filename || `analytics_export_${Date.now()}`;
      const data = await this.prepareExportData(dto);

      return {
        success: true,
        data: {
          filename: `${filename}.${dto.format}`,
          downloadUrl: `/api/analytics/exports/${filename}.${dto.format}`,
          size: 0,
          recordCount: Array.isArray(data) ? data.length : 0,
          generatedAt: new Date().toISOString()
        } as any, // Temporary fix for type compatibility
        meta: {
          type: dto.type,
          format: dto.format,
          requestedBy,
          timeRange: {
            start: dto.startDate || '',
            end: dto.endDate || ''
          },
          filters: dto
        }
      };

    } catch (error) {
      this.logger.error(`Error exporting data: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generateCustomReport(dto: CustomReportDto, requestedBy: string, userRole: UserRole): Promise<ExportResponseDto> {
    try {
      this.logger.log(`Generating custom report: ${dto.title}`);
      
      const reportData = await this.buildCustomReport(dto, userRole);
      const filename = `custom_report_${Date.now()}`;

      return {
        success: true,
        data: {
          filename: `${filename}.pdf`,
          downloadUrl: `/api/analytics/reports/${filename}.pdf`,
          size: 0,
          recordCount: 0,
          generatedAt: new Date().toISOString()
        } as any, // Temporary fix for type compatibility
        meta: {
          type: ExportType.CUSTOM_REPORT,
          format: ExportFormat.PDF,
          requestedBy,
          timeRange: {
            start: dto.startDate || '',
            end: dto.endDate || ''
          }
        }
      };

    } catch (error) {
      this.logger.error(`Error generating custom report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async scheduleReport(dto: ScheduleReportDto, requestedBy: string): Promise<{ success: boolean; message: string; reportId: string }> {
    try {
      this.logger.log(`Scheduling report: ${dto.name} - ${dto.frequency}`);
      
      const reportId = `scheduled_${Date.now()}`;
      
      // TODO: Implement actual scheduling with cron jobs
      
      return {
        success: true,
        message: `Report "${dto.name}" scheduled successfully for ${dto.frequency} delivery`,
        reportId
      };

    } catch (error) {
      this.logger.error(`Error scheduling report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async downloadReport(reportId: string, requestedBy: string, userRole: UserRole): Promise<any> {
    try {
      this.logger.log(`Downloading report: ${reportId}`);
      
      // TODO: Implement actual download logic
      return {
        success: true,
        message: 'Report download initiated'
      };

    } catch (error) {
      this.logger.error(`Error downloading report: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ================================
  // CHART DATA METHODS
  // ================================

  async getSellerRevenueChart(sellerId: string, dto: GetSellerRevenueDto): Promise<ChartResponse<LineChartData>> {
    try {
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      const trends = await this.getSellerRevenueTrends(sellerId, timeRange, dto.groupBy || 'month');

      const chartData: LineChartData = {
        data: trends,
        title: 'Revenue Trends',
        primaryLabel: 'Revenue',
        color: '#3B82F6'
      };

      return {
        success: true,
        data: chartData,
        meta: {
          title: 'Seller Revenue Chart',
          lastUpdated: new Date().toISOString(),
          dataPoints: trends.length,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          }
        }
      };

    } catch (error) {
      this.logger.error(`Error getting seller revenue chart: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPlatformOverviewChart(dto: GetPlatformOverviewDto): Promise<any> {
    try {
      this.logger.log('Getting platform overview chart data');
      
      const timeRange = this.getTimeRange(dto.startDate, dto.endDate);
      
      // TODO: Implement platform overview charts
      return {
        success: true,
        data: {
          revenue: [],
          users: [],
          orders: []
        },
        meta: {
          title: 'Platform Overview Charts',
          lastUpdated: new Date().toISOString(),
          dataPoints: 0
        }
      };

    } catch (error) {
      this.logger.error(`Error getting platform overview chart: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ================================
  // SYSTEM HEALTH METHODS
  // ================================

  async getSystemHealth(): Promise<any> {
  try {
    const databaseHealth = await this.checkDatabaseHealth();
    const cacheHealth = await this.checkCacheHealth();
    const analyticsHealth = await this.checkAnalyticsHealth();

    const hasAnyFailure = 
      databaseHealth.status === 'unhealthy' || 
      cacheHealth.status === 'unhealthy' || 
      analyticsHealth.status === 'unhealthy';

    const healthData: any = {
      status: hasAnyFailure ? 'unhealthy' : 'healthy',
      uptime: process.uptime(),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: databaseHealth,
        cache: cacheHealth,
        analytics: analyticsHealth
      }
    };

    if (hasAnyFailure) {
      healthData.error = 'One or more services are failing';
    }

    return healthData;

  } catch (error) {
    this.logger.error(`Error getting system health: ${error.message}`, error.stack);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
  async getCacheStatus(): Promise<any> {
    try {
      return {
        status: 'not_implemented',
        message: 'Cache not yet implemented',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Error getting cache status: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ================================
  // PRIVATE CALCULATION METHODS
  // ================================

  private async calculateSellerRevenue(sellerId: string, timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      // Get orders where seller has items (through OrderItem)
      const orders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          },
          items: {
            some: {
              sellerId: sellerId
            }
          }
        },
        include: {
          items: {
            where: {
              sellerId: sellerId
            },
            select: {
              price: true
            }
          }
        }
      });

      // Calculate total revenue from seller's items
      const totalRevenue = orders.reduce((sum, order) => {
        const sellerRevenue = order.items.reduce((itemSum, item) => itemSum + item.price, 0);
        return sum + sellerRevenue;
      }, 0);
      
      // Get previous period for comparison
      const prevPeriod = this.getPreviousPeriod(timeRange);
      const prevOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: {
            gte: prevPeriod.start,
            lte: prevPeriod.end
          },
          items: {
            some: {
              sellerId: sellerId
            }
          }
        },
        include: {
          items: {
            where: {
              sellerId: sellerId
            },
            select: {
              price: true
            }
          }
        }
      });

      const prevRevenue = prevOrders.reduce((sum, order) => {
        const sellerRevenue = order.items.reduce((itemSum, item) => itemSum + item.price, 0);
        return sum + sellerRevenue;
      }, 0);

      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      // Calculate monthly revenue (current month)
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: { gte: monthStart },
          items: {
            some: {
              sellerId: sellerId
            }
          }
        },
        include: {
          items: {
            where: {
              sellerId: sellerId
            },
            select: {
              price: true
            }
          }
        }
      });

      const monthlyRevenue = monthOrders.reduce((sum, order) => {
        const sellerRevenue = order.items.reduce((itemSum, item) => itemSum + item.price, 0);
        return sum + sellerRevenue;
      }, 0);

      const totalOrderItems = orders.reduce((sum, order) => sum + order.items.length, 0);
      const averageOrderValue = totalOrderItems > 0 ? totalRevenue / totalOrderItems : 0;

      return {
        total: {
          value: totalRevenue,
          change: revenueChange,
          changeType: revenueChange > 0 ? 'increase' : revenueChange < 0 ? 'decrease' : 'neutral'
        },
        monthly: {
          value: monthlyRevenue,
          change: 0, // TODO: Calculate monthly change
          changeType: 'neutral'
        },
        averageOrderValue: {
          value: averageOrderValue,
          change: 0, // TODO: Calculate AOV change
          changeType: 'neutral'
        }
      };

    } catch (error) {
      this.logger.error(`Error calculating seller revenue: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async calculateSellerOrders(sellerId: string, timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      // Get orders where seller has items
      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          },
          items: {
            some: {
              sellerId: sellerId
            }
          }
        },
        select: {
          status: true,
          createdAt: true
        }
      });

      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED).length;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      // Monthly orders
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthlyOrdersCount = await this.prisma.order.count({
        where: {
          createdAt: { gte: monthStart },
          items: {
            some: {
              sellerId: sellerId
            }
          }
        }
      });

      return {
        total: {
          value: totalOrders,
          change: 0, // TODO: Calculate change
          changeType: 'neutral'
        },
        monthly: {
          value: monthlyOrdersCount,
          change: 0,
          changeType: 'neutral'
        },
        completionRate: {
          value: completionRate,
          change: 0,
          changeType: 'neutral'
        }
      };

    } catch (error) {
      this.logger.error(`Error calculating seller orders: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async calculateSellerProducts(sellerId: string, timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      // Get all products for seller
      const products = await this.prisma.product.findMany({
        where: { sellerId },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          orderItems: {
            where: {
              order: {
                status: OrderStatus.COMPLETED,
                createdAt: {
                  gte: timeRange.start,
                  lte: timeRange.end
                }
              }
            },
            select: {
              price: true
            }
          },
          productRating: {
            select: {
              averageRating: true,
              totalReviews: true
            }
          }
        }
      });

      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.status === ProductStatus.APPROVED).length;

      // Calculate top performing products
      const topPerforming: ProductMetric[] = products
        .map(product => ({
          id: product.id,
          title: product.title,
          revenue: product.orderItems.reduce((sum, item) => sum + item.price, 0),
          orders: product.orderItems.length,
          averageRating: Number(product.productRating?.averageRating || 0),
          reviewCount: product.productRating?.totalReviews || 0,
          conversionRate: 0 // TODO: Calculate conversion rate
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        total: {
          value: totalProducts
        },
        active: {
          value: activeProducts
        },
        topPerforming
      };

    } catch (error) {
      this.logger.error(`Error calculating seller products: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async calculateSellerReviews(sellerId: string, timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      // Get seller rating from SellerRating table
      const sellerRating = await this.prisma.sellerRating.findUnique({
        where: { sellerId }
      });

      // Get reviews in time range
      const reviews = await this.prisma.review.findMany({
        where: {
          sellerId,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        },
        select: {
          id: true,
          rating: true,
          response: {
            select: { id: true }
          }
        }
      });

      const totalReviews = reviews.length;
      const reviewsWithResponse = reviews.filter(r => r.response).length;
      const responseRate = totalReviews > 0 ? (reviewsWithResponse / totalReviews) * 100 : 0;

      return {
        averageRating: {
          value: Number(sellerRating?.averageRating || 0),
          change: 0, // TODO: Calculate change
          changeType: 'neutral'
        },
        total: {
          value: sellerRating?.totalReviews || 0,
          change: 0,
          changeType: 'neutral'
        },
        responseRate: {
          value: responseRate,
          change: 0,
          changeType: 'neutral'
        }
      };

    } catch (error) {
      this.logger.error(`Error calculating seller reviews: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getSellerRecentOrders(sellerId: string, limit: number): Promise<RecentOrderMetric[]> {
    try {
      const orders = await this.prisma.order.findMany({
        where: {
          items: {
            some: {
              sellerId: sellerId
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          buyer: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          items: {
            where: {
              sellerId: sellerId
            },
            take: 1,
            include: {
              product: {
                select: {
                  title: true
                }
              }
            }
          }
        }
      });

      return orders.map(order => ({
        id: order.id,
        buyerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
        productTitle: order.items[0]?.product?.title || 'Multiple Items',
        amount: order.items.reduce((sum, item) => sum + item.price, 0),
        status: order.status,
        createdAt: order.createdAt.toISOString()
      }));

    } catch (error) {
      this.logger.error(`Error getting recent orders: ${error.message}`, error.stack);
      return [];
    }
  }

  private async getSellerRecentReviews(sellerId: string, limit: number): Promise<RecentReviewMetric[]> {
    try {
      const reviews = await this.prisma.review.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          buyer: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          product: {
            select: {
              title: true
            }
          },
          response: {
            select: { id: true }
          }
        }
      });

      return reviews.map(review => ({
        id: review.id,
        buyerName: `${review.buyer.firstName} ${review.buyer.lastName}`,
        productTitle: review.product.title,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        hasResponse: !!review.response
      }));

    } catch (error) {
      this.logger.error(`Error getting recent reviews: ${error.message}`, error.stack);
      return [];
    }
  }

  // Additional calculation methods for other analytics
  private async getRevenueByProduct(sellerId: string, timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const productRevenue = await this.prisma.product.findMany({
        where: { sellerId },
        select: {
          id: true,
          title: true,
          orderItems: {
            where: {
              order: {
                status: OrderStatus.COMPLETED,
                createdAt: {
                  gte: timeRange.start,
                  lte: timeRange.end
                }
              }
            },
            select: {
              price: true
            }
          }
        }
      });

      return productRevenue.map(product => ({
        productId: product.id,
        productTitle: product.title,
        revenue: product.orderItems.reduce((sum, item) => sum + item.price, 0),
        orders: product.orderItems.length
      })).sort((a, b) => b.revenue - a.revenue);

    } catch (error) {
      this.logger.error(`Error getting revenue by product: ${error.message}`, error.stack);
      return [];
    }
  }

  private async getSellerFeesBreakdown(sellerId: string, timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      // Get transactions for fee analysis
      const transactions = await this.prisma.transaction.findMany({
        where: {
          sellerId,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        },
        select: {
          type: true,
          amount: true
        }
      });

      const platformFees = transactions
        .filter(t => t.type === 'PLATFORM_FEE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const stripeFees = transactions
        .filter(t => t.type === 'STRIPE_FEE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        platformFees,
        stripeFees,
        totalFees: platformFees + stripeFees
      };

    } catch (error) {
      this.logger.error(`Error getting fees breakdown: ${error.message}`, error.stack);
      return { platformFees: 0, stripeFees: 0, totalFees: 0 };
    }
  }

  private async getSellerRevenueTrends(sellerId: string, timeRange: { start: Date; end: Date }, groupBy: string): Promise<TimeSeriesData[]> {
    try {
      // Get orders with seller items
      const orders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          },
          items: {
            some: {
              sellerId: sellerId
            }
          }
        },
        select: {
          createdAt: true,
          items: {
            where: {
              sellerId: sellerId
            },
            select: {
              price: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Group by month for now (TODO: implement dynamic grouping)
      const monthlyData = new Map<string, number>();
      
      orders.forEach(order => {
        const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
        const sellerRevenue = order.items.reduce((sum, item) => sum + item.price, 0);
        const current = monthlyData.get(month) || 0;
        monthlyData.set(month, current + sellerRevenue);
      });

      return Array.from(monthlyData.entries()).map(([date, value]) => ({
        date,
        value,
        label: date
      }));

    } catch (error) {
      this.logger.error(`Error getting revenue trends: ${error.message}`, error.stack);
      return [];
    }
  }

  // Platform calculation methods
  private async calculatePlatformUsers(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const [totalUsers, totalSellers, totalBuyers, activeUsers] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: UserRole.SELLER } }),
        this.prisma.user.count({ where: { role: UserRole.BUYER } }),
        this.prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      return {
        totalUsers: { value: totalUsers, change: 0, changeType: 'neutral' },
        totalSellers: { value: totalSellers, change: 0, changeType: 'neutral' },
        totalBuyers: { value: totalBuyers, change: 0, changeType: 'neutral' },
        activeUsers: { value: activeUsers, change: 0, changeType: 'neutral' }
      };

    } catch (error) {
      this.logger.error(`Error calculating platform users: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async calculatePlatformRevenue(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const orders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        },
        select: { totalAmount: true, platformFeeRate: true }
      });

      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const platformRevenue = orders.reduce((sum, order) => {
        const fee = order.totalAmount * order.platformFeeRate;
        return sum + fee;
      }, 0);

      // Monthly revenue
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthlyOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: { gte: monthStart }
        },
        select: { totalAmount: true, platformFeeRate: true }
      });

      const monthlyPlatformRevenue = monthlyOrders.reduce((sum, order) => {
        const fee = order.totalAmount * order.platformFeeRate;
        return sum + fee;
      }, 0);

      return {
        totalPlatformRevenue: { value: platformRevenue, change: 0, changeType: 'neutral' },
        monthlyPlatformRevenue: { value: monthlyPlatformRevenue, change: 0, changeType: 'neutral' },
        averagePlatformFee: { value: orders.length > 0 ? platformRevenue / orders.length : 0, change: 0, changeType: 'neutral' }
      };

    } catch (error) {
      this.logger.error(`Error calculating platform revenue: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async calculatePlatformOrders(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const [totalOrders, monthlyOrders] = await Promise.all([
        this.prisma.order.count({
          where: {
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          }
        }),
        this.prisma.order.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ]);

      const avgOrderValue = await this.prisma.order.aggregate({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        },
        _avg: { totalAmount: true }
      });

      return {
        totalOrders: { value: totalOrders, change: 0, changeType: 'neutral' },
        monthlyOrders: { value: monthlyOrders, change: 0, changeType: 'neutral' },
        averageOrderValue: { value: Number(avgOrderValue._avg.totalAmount) || 0, change: 0, changeType: 'neutral' }
      };

    } catch (error) {
      this.logger.error(`Error calculating platform orders: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async calculatePlatformProducts(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const [totalProducts, activeProducts, pendingModeration] = await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({ where: { status: ProductStatus.APPROVED } }),
        this.prisma.product.count({ where: { status: ProductStatus.PENDING } })
      ]);

      return {
        totalProducts: { value: totalProducts, change: 0, changeType: 'neutral' },
        activeProducts: { value: activeProducts, change: 0, changeType: 'neutral' },
        pendingModeration: { value: pendingModeration, change: 0, changeType: 'neutral' }
      };

    } catch (error) {
      this.logger.error(`Error calculating platform products: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async calculatePlatformReviews(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const [totalReviews, avgRating, pendingModeration] = await Promise.all([
        this.prisma.review.count({
          where: {
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          }
        }),
        this.prisma.review.aggregate({
          _avg: { rating: true },
          where: {
            status: ReviewStatus.PUBLISHED
          }
        }),
        this.prisma.review.count({ where: { status: ReviewStatus.PENDING_MODERATION } })
      ]);

      return {
        totalReviews: { value: totalReviews, change: 0, changeType: 'neutral' },
        averagePlatformRating: { value: Number(avgRating._avg.rating) || 0, change: 0, changeType: 'neutral' },
        pendingModeration: { value: pendingModeration, change: 0, changeType: 'neutral' }
      };

    } catch (error) {
      this.logger.error(`Error calculating platform reviews: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Placeholder methods for complex analytics (to be implemented)
  private async getSellerProductAnalytics(sellerId: string, timeRange: any, dto: any): Promise<ProductMetric[]> { return []; }
  private async getSellerProductsSummary(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async getSellerReviewDistribution(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async getSellerResponseMetrics(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async calculateSellerCustomers(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async getRepeatCustomerAnalysis(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async getCustomerLifetimeValue(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async calculateSellerNotifications(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async getSellerNotificationEngagement(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async getSellerNotificationTypeBreakdown(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async calculateSellerConversion(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async getSellerConversionFunnel(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async getTrafficSourceConversion(sellerId: string, timeRange: any): Promise<any> { return {}; }
  private async getPlatformTopPerformers(timeRange: any): Promise<any> { return { topSellers: [], topProducts: [], topCategories: [] }; }
  private async calculateTopPerformers(type: string, timeRange: any, dto: any): Promise<any[]> { return []; }
  private async calculateSellerComparison(sellerIds: string[], timeRange: any, metrics: any): Promise<any> { return {}; }
  private async calculatePlatformConversionFunnel(timeRange: any, dto: any): Promise<ConversionFunnelMetrics> {
    return {
      visitors: 0, productViews: 0, cartAdds: 0, checkoutStarts: 0, orders: 0, completedOrders: 0, reviews: 0,
      productViewRate: 0, cartConversionRate: 0, checkoutConversionRate: 0, orderCompletionRate: 0, reviewRate: 0,
      dropOffs: { viewToCart: 0, cartToCheckout: 0, checkoutToOrder: 0, orderToCompletion: 0, completionToReview: 0 }
    };
  }
  private async calculateCohortAnalysis(dto: any): Promise<any> { return { cohorts: [] }; }
  private async calculatePlatformNotificationAnalytics(timeRange: any, dto: any): Promise<NotificationEngagementMetrics> {
    return { totalSent: 0, deliveryRate: 0, openRate: 0, clickRate: 0, byType: [], byChannel: [], trends: [] };
  }
  private async calculateUserBehavior(timeRange: any, dto: any): Promise<any> { return {}; }
  private async calculateFinancialReport(timeRange: any, dto: any): Promise<any> { return {}; }
  private async prepareExportData(dto: ExportDataDto): Promise<any> { return []; }
  private async buildCustomReport(dto: CustomReportDto, userRole: UserRole): Promise<any> { return {}; }

  // ================================
  // PRIVATE UTILITY METHODS
  // ================================

  private getTimeRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private getPreviousPeriod(timeRange: { start: Date; end: Date }): { start: Date; end: Date } {
    const duration = timeRange.end.getTime() - timeRange.start.getTime();
    return {
      start: new Date(timeRange.start.getTime() - duration),
      end: new Date(timeRange.start.getTime())
    };
  }

  private async checkDatabaseHealth(): Promise<{ status: string; responseTime?: number }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      return { status: 'healthy', responseTime };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }

  private async checkCacheHealth(): Promise<{ status: string }> {
    return { status: 'not_implemented' };
  }

  private async checkAnalyticsHealth(): Promise<{ status: string; lastCalculation?: string }> {
    try {
      await this.prisma.user.count();
      return { status: 'healthy', lastCalculation: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}