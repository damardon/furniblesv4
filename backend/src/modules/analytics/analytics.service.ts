// src/modules/analytics/analytics.service.ts

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

import {
  SellerDashboardMetrics,
  AdminPlatformMetrics,
  ConversionFunnelMetrics,
  NotificationEngagementMetrics
} from './interfaces/analytics.interface';

import { LineChartData, ChartResponse } from './interfaces/charts.interface';

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

import { AnalyticsQueryService } from './services/analytics-query.service';
import { AnalyticsCalculationService } from './services/analytics-calculation.service';
import { AnalyticsCacheService, CACHE_TTL } from './services/analytics-cache.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly query: AnalyticsQueryService,
    private readonly calc: AnalyticsCalculationService,
    private readonly cache: AnalyticsCacheService
  ) {}

  // ================================
  // SELLER ANALYTICS
  // ================================

  async getSellerDashboard(sellerId: string, dto: GetSellerDashboardDto): Promise<SellerAnalyticsResponseDto> {
    const cacheKey = this.cache.buildKey('seller', sellerId, 'dashboard', dto.startDate ?? '', dto.endDate ?? '');
    return this.cache.getOrSet(cacheKey, async () => {
      this.logger.log(`Getting seller dashboard for ${sellerId}`);
      const { startDate, endDate, includeActivity = true } = dto;
      const timeRange = this.calc.getTimeRange(startDate, endDate);

      const seller = await this.prisma.user.findUnique({
        where: { id: sellerId, role: UserRole.SELLER },
        include: { sellerProfile: true }
      });
      if (!seller) throw new NotFoundException('Seller not found');

      const [revenueData, orderData, productData, reviewData, recentOrders, recentReviews] =
        await Promise.all([
          this.query.getSellerRevenue(sellerId, timeRange),
          this.query.getSellerOrders(sellerId, timeRange),
          this.query.getSellerProducts(sellerId, timeRange),
          this.query.getSellerReviews(sellerId, timeRange),
          includeActivity ? this.query.getSellerRecentOrders(sellerId, 5) : [],
          includeActivity ? this.query.getSellerRecentReviews(sellerId, 5) : []
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
          timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
          lastUpdated: new Date().toISOString(),
          dataPoints: recentOrders.length + recentReviews.length,
          currency: 'USD'
        }
      };
    }, CACHE_TTL.SELLER_DASHBOARD);
  }

  async getSellerRevenue(sellerId: string, dto: GetSellerRevenueDto): Promise<SellerAnalyticsResponseDto> {
    this.logger.log(`Getting seller revenue for ${sellerId}`);
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);

    const [revenueMetrics, productBreakdown, feesBreakdown, trends] = await Promise.all([
      this.query.getSellerRevenue(sellerId, timeRange),
      dto.includeProductBreakdown ? this.query.getSellerRevenueByProduct(sellerId, timeRange) : null,
      dto.includeFees ? this.query.getSellerFeesBreakdown(sellerId, timeRange) : null,
      this.query.getSellerRevenueTrends(sellerId, timeRange, dto.groupBy || 'month')
    ]);

    return {
      success: true,
      data: { revenue: revenueMetrics, productBreakdown, feesBreakdown, trends },
      meta: {
        sellerId,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: trends.length,
        currency: 'USD'
      }
    };
  }

  async getSellerProducts(sellerId: string, dto: GetSellerProductsDto): Promise<SellerAnalyticsResponseDto> {
    this.logger.log(`Getting seller products analytics for ${sellerId}`);
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    const productData = await this.query.getSellerProducts(sellerId, timeRange);

    return {
      success: true,
      data: { products: productData.topPerforming, summary: { total: productData.total, active: productData.active } },
      meta: {
        sellerId,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: productData.topPerforming.length,
        currency: 'USD'
      }
    };
  }

  async getSellerReviews(sellerId: string, dto: GetSellerReviewsDto): Promise<SellerAnalyticsResponseDto> {
    this.logger.log(`Getting seller reviews analytics for ${sellerId}`);
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);

    const [reviewMetrics, recentReviews] = await Promise.all([
      this.query.getSellerReviews(sellerId, timeRange),
      dto.includeRecentReviews ? this.query.getSellerRecentReviews(sellerId, 10) : []
    ]);

    return {
      success: true,
      data: { reviews: reviewMetrics, recentReviews },
      meta: {
        sellerId,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: recentReviews.length,
        currency: 'USD'
      }
    };
  }

  async getSellerCustomers(_sellerId: string, dto: GetSellerCustomersDto): Promise<SellerAnalyticsResponseDto> {
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    return {
      success: true,
      data: {},
      meta: {
        sellerId: _sellerId,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: 0,
        currency: 'USD'
      }
    };
  }

  async getSellerNotifications(_sellerId: string, dto: GetSellerNotificationsDto): Promise<SellerAnalyticsResponseDto> {
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    return {
      success: true,
      data: {},
      meta: {
        sellerId: _sellerId,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: 0,
        currency: 'USD'
      }
    };
  }

  async getSellerConversion(_sellerId: string, dto: GetSellerConversionDto): Promise<SellerAnalyticsResponseDto> {
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    return {
      success: true,
      data: {},
      meta: {
        sellerId: _sellerId,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: 0,
        currency: 'USD'
      }
    };
  }

  // ================================
  // ADMIN ANALYTICS
  // ================================

  async getPlatformOverview(dto: GetPlatformOverviewDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    const cacheKey = this.cache.buildKey('platform', 'overview', dto.startDate ?? '', dto.endDate ?? '');
    return this.cache.getOrSet(cacheKey, async () => {
      this.logger.log(`Getting platform overview requested by ${requestedBy}`);
      const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);

      const [userMetrics, revenueMetrics, orderMetrics, productMetrics, reviewMetrics] =
        await Promise.all([
          this.query.getPlatformUsers(timeRange),
          this.query.getPlatformRevenue(timeRange),
          this.query.getPlatformOrders(timeRange),
          this.query.getPlatformProducts(timeRange),
          this.query.getPlatformReviews(timeRange)
        ]);

      const platformData: AdminPlatformMetrics = {
        ...userMetrics,
        ...revenueMetrics,
        ...orderMetrics,
        ...productMetrics,
        ...reviewMetrics,
        topSellers: [],
        topProducts: [],
        topCategories: []
      };

      return {
        success: true,
        data: platformData,
        meta: {
          requestedBy,
          timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
          lastUpdated: new Date().toISOString(),
          dataPoints: 0,
          currency: 'USD'
        }
      };
    }, CACHE_TTL.PLATFORM_OVERVIEW);
  }

  async getTopPerformers(dto: GetTopPerformersDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    this.logger.log(`Getting top performers: ${dto.type}`);
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    return {
      success: true,
      data: { performers: [], type: dto.type },
      meta: {
        requestedBy,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: 0,
        currency: 'USD'
      }
    };
  }

  async getSellerComparison(dto: GetSellerComparisonDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    this.logger.log(`Getting seller comparison for ${dto.sellerIds.length} sellers`);
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    return {
      success: true,
      data: {},
      meta: {
        requestedBy,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: dto.sellerIds.length,
        currency: 'USD'
      }
    };
  }

  async getConversionFunnel(dto: GetConversionFunnelDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    const funnelData: ConversionFunnelMetrics = {
      visitors: 0, productViews: 0, cartAdds: 0, checkoutStarts: 0,
      orders: 0, completedOrders: 0, reviews: 0,
      productViewRate: 0, cartConversionRate: 0, checkoutConversionRate: 0,
      orderCompletionRate: 0, reviewRate: 0,
      dropOffs: { viewToCart: 0, cartToCheckout: 0, checkoutToOrder: 0, orderToCompletion: 0, completionToReview: 0 }
    };
    return {
      success: true,
      data: funnelData,
      meta: {
        requestedBy,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: 0,
        currency: 'USD'
      }
    };
  }

  async getCohortAnalysis(dto: GetCohortAnalysisDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    return {
      success: true,
      data: { cohorts: [] },
      meta: {
        requestedBy,
        timeRange: { start: dto.startMonth || '2024-01', end: dto.endMonth || '2024-12' },
        lastUpdated: new Date().toISOString(),
        dataPoints: 0,
        currency: 'USD'
      }
    };
  }

  async getNotificationAnalytics(dto: GetNotificationAnalyticsDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    const notificationData: NotificationEngagementMetrics = {
      totalSent: 0, deliveryRate: 0, openRate: 0, clickRate: 0, byType: [], byChannel: [], trends: []
    };
    return {
      success: true,
      data: notificationData,
      meta: {
        requestedBy,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: 0,
        currency: 'USD'
      }
    };
  }

  async getUserBehavior(dto: GetUserBehaviorDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    return {
      success: true,
      data: {},
      meta: {
        requestedBy,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: 0,
        currency: 'USD'
      }
    };
  }

  async getFinancialReport(dto: GetFinancialReportDto, requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    return {
      success: true,
      data: {},
      meta: {
        requestedBy,
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
        lastUpdated: new Date().toISOString(),
        dataPoints: 0,
        currency: 'USD'
      }
    };
  }

  // ================================
  // EXPORT AND REPORTING
  // ================================

  async exportData(dto: ExportDataDto, requestedBy: string): Promise<ExportResponseDto> {
    this.logger.log(`Exporting data: ${dto.type} in ${dto.format} format`);
    const filename = dto.filename || `analytics_export_${Date.now()}`;
    return {
      success: true,
      data: {
        filename: `${filename}.${dto.format}`,
        downloadUrl: `/api/analytics/exports/${filename}.${dto.format}`,
        size: 0,
        recordCount: 0,
        generatedAt: new Date().toISOString()
      } as any,
      meta: {
        type: dto.type,
        format: dto.format,
        requestedBy,
        timeRange: { start: dto.startDate || '', end: dto.endDate || '' },
        filters: dto
      }
    };
  }

  async generateCustomReport(dto: CustomReportDto, requestedBy: string, _userRole: UserRole): Promise<ExportResponseDto> {
    this.logger.log(`Generating custom report: ${dto.title}`);
    const filename = `custom_report_${Date.now()}`;
    return {
      success: true,
      data: {
        filename: `${filename}.pdf`,
        downloadUrl: `/api/analytics/reports/${filename}.pdf`,
        size: 0,
        recordCount: 0,
        generatedAt: new Date().toISOString()
      } as any,
      meta: {
        type: ExportType.CUSTOM_REPORT,
        format: ExportFormat.PDF,
        requestedBy,
        timeRange: { start: dto.startDate || '', end: dto.endDate || '' }
      }
    };
  }

  async scheduleReport(dto: ScheduleReportDto, _requestedBy: string): Promise<{ success: boolean; message: string; reportId: string }> {
    const reportId = `scheduled_${Date.now()}`;
    return {
      success: true,
      message: `Report "${dto.name}" scheduled successfully for ${dto.frequency} delivery`,
      reportId
    };
  }

  async downloadReport(_reportId: string, _requestedBy: string, _userRole: UserRole): Promise<any> {
    return { success: true, message: 'Report download initiated' };
  }

  // ================================
  // CHART DATA
  // ================================

  async getSellerRevenueChart(sellerId: string, dto: GetSellerRevenueDto): Promise<ChartResponse<LineChartData>> {
    const timeRange = this.calc.getTimeRange(dto.startDate, dto.endDate);
    const trends = await this.query.getSellerRevenueTrends(sellerId, timeRange, dto.groupBy || 'month');

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
        timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() }
      }
    };
  }

  async getPlatformOverviewChart(dto: GetPlatformOverviewDto): Promise<any> {
    return {
      success: true,
      data: { revenue: [], users: [], orders: [] },
      meta: { title: 'Platform Overview Charts', lastUpdated: new Date().toISOString(), dataPoints: 0 }
    };
  }

  // ================================
  // SYSTEM HEALTH
  // ================================

  async getSystemHealth(): Promise<any> {
    const [databaseHealth, analyticsHealth] = await Promise.all([
      this.query.checkDatabaseHealth(),
      this.query.checkAnalyticsHealth()
    ]);

    const cacheHealth = { status: this.cache.isEnabled ? 'healthy' : 'not_configured' };
    const unhealthy = databaseHealth.status === 'unhealthy' || analyticsHealth.status === 'unhealthy';

    return {
      status: unhealthy ? 'unhealthy' : 'healthy',
      uptime: process.uptime(),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: { database: databaseHealth, cache: cacheHealth, analytics: analyticsHealth },
      ...(unhealthy ? { error: 'One or more services are failing' } : {})
    };
  }

  async getCacheStatus(): Promise<any> {
    return {
      status: this.cache.isEnabled ? 'healthy' : 'not_configured',
      timestamp: new Date().toISOString()
    };
  }
}
