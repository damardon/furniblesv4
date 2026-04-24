// src/modules/analytics/analytics.service.ts

import { Injectable, NotFoundException, Logger, HttpException, HttpStatus } from '@nestjs/common';
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
    const cacheKey = this.cache.buildKey('seller', sellerId, 'dashboard', dto.startDate ?? '', dto.endDate ?? '', String(dto.includeActivity ?? true));
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

  async getSellerCustomers(_sellerId: string, _dto: GetSellerCustomersDto): Promise<SellerAnalyticsResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] getSellerCustomers called for seller ${_sellerId}`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Seller customers analytics endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async getSellerNotifications(_sellerId: string, _dto: GetSellerNotificationsDto): Promise<SellerAnalyticsResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] getSellerNotifications called for seller ${_sellerId}`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Seller notifications analytics endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async getSellerConversion(_sellerId: string, _dto: GetSellerConversionDto): Promise<SellerAnalyticsResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] getSellerConversion called for seller ${_sellerId}`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Seller conversion analytics endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
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

      // TODO: Implement getTopSellers, getTopProducts, getTopCategories in AnalyticsQueryService
      // For now, these are fetched as separate endpoints via getTopPerformers
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

  async getTopPerformers(_dto: GetTopPerformersDto, _requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] getTopPerformers called for type ${_dto.type}`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Top performers analytics endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async getSellerComparison(_dto: GetSellerComparisonDto, _requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] getSellerComparison called for ${_dto.sellerIds.length} sellers`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Seller comparison analytics endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async getConversionFunnel(_dto: GetConversionFunnelDto, _requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] getConversionFunnel called`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Conversion funnel analytics endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async getCohortAnalysis(_dto: GetCohortAnalysisDto, _requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] getCohortAnalysis called`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Cohort analysis endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async getNotificationAnalytics(_dto: GetNotificationAnalyticsDto, _requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] getNotificationAnalytics called`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Notification analytics endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async getUserBehavior(_dto: GetUserBehaviorDto, _requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] getUserBehavior called`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'User behavior analytics endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async getFinancialReport(_dto: GetFinancialReportDto, _requestedBy: string): Promise<AdminAnalyticsResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] getFinancialReport called`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Financial report endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  // ================================
  // EXPORT AND REPORTING
  // ================================

  async exportData(_dto: ExportDataDto, _requestedBy: string): Promise<ExportResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] exportData called for type ${_dto.type}`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Data export endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async generateCustomReport(_dto: CustomReportDto, _requestedBy: string, _userRole: UserRole): Promise<ExportResponseDto> {
    this.logger.warn(`[NOT_IMPLEMENTED] generateCustomReport called for report "${_dto.title}"`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Custom report generation endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async scheduleReport(_dto: ScheduleReportDto, _requestedBy: string): Promise<{ success: boolean; message: string; reportId: string }> {
    this.logger.warn(`[NOT_IMPLEMENTED] scheduleReport called for report "${_dto.name}"`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Report scheduling endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  async downloadReport(_reportId: string, _requestedBy: string, _userRole: UserRole): Promise<any> {
    this.logger.warn(`[NOT_IMPLEMENTED] downloadReport called for report "${_reportId}"`);
    throw new HttpException(
      { error: 'NOT_IMPLEMENTED', message: 'Report download endpoint is not yet implemented' },
      HttpStatus.NOT_IMPLEMENTED
    );
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
