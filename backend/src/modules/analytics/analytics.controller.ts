// src/modules/analytics/analytics.controller.ts

import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  UseGuards,
  Req,
  ValidationPipe,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

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
  ExportResponseDto
} from './dto/export.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  // ================================
  // SELLER ANALYTICS ENDPOINTS
  // ================================

  @Get('seller/dashboard')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller dashboard analytics',
    description: 'Comprehensive dashboard metrics for sellers including revenue, orders, products, and reviews'
  })
  @ApiResponse({
    status: 200,
    description: 'Seller dashboard analytics retrieved successfully',
    type: SellerAnalyticsResponseDto
  })
  @ApiQuery({ name: 'startDate', required: false, example: '2024-01-01T00:00:00.000Z' })
  @ApiQuery({ name: 'endDate', required: false, example: '2024-12-31T23:59:59.999Z' })
  @ApiQuery({ name: 'includeComparison', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'includeActivity', required: false, type: Boolean, example: true })
  async getSellerDashboard(
    @Query(ValidationPipe) dto: GetSellerDashboardDto,
    @Req() req: any
  ): Promise<SellerAnalyticsResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Sellers can only view their own dashboard
    if (userRole === UserRole.SELLER) {
      return this.analyticsService.getSellerDashboard(userId, dto);
    } else if (userRole === UserRole.ADMIN) {
      // Admins must specify sellerId in query params
      const sellerId = req.query?.sellerId;
      if (!sellerId) {
        throw new ForbiddenException('Seller ID required for admin users');
      }
      return this.analyticsService.getSellerDashboard(sellerId, dto);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @Get('seller/revenue')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller revenue analytics',
    description: 'Detailed revenue analytics including trends, breakdowns, and fee analysis'
  })
  @ApiResponse({
    status: 200,
    description: 'Seller revenue analytics retrieved successfully',
    type: SellerAnalyticsResponseDto
  })
  async getSellerRevenue(
    @Query(ValidationPipe) dto: GetSellerRevenueDto,
    @Req() req: any
  ): Promise<SellerAnalyticsResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Sellers can only view their own data
    if (userRole === UserRole.SELLER) {
      return this.analyticsService.getSellerRevenue(userId, dto);
    } else if (userRole === UserRole.ADMIN) {
      // Admins must specify sellerId in query params
      const sellerId = req.query.sellerId;
      if (!sellerId) {
        throw new ForbiddenException('Seller ID required for admin users');
      }
      return this.analyticsService.getSellerRevenue(sellerId, dto);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @Get('seller/products')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller products analytics',
    description: 'Product performance analytics including top performers, ratings, and conversion metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Seller products analytics retrieved successfully',
    type: SellerAnalyticsResponseDto
  })
  async getSellerProducts(
    @Query(ValidationPipe) dto: GetSellerProductsDto,
    @Req() req: any
  ): Promise<SellerAnalyticsResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Sellers can only view their own data
    if (userRole === UserRole.SELLER) {
      return this.analyticsService.getSellerProducts(userId, dto);
    } else if (userRole === UserRole.ADMIN) {
      // Admins must specify sellerId in query params
      const sellerId = req.query.sellerId;
      if (!sellerId) {
        throw new ForbiddenException('Seller ID required for admin users');
      }
      return this.analyticsService.getSellerProducts(sellerId, dto);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @Get('seller/reviews')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller reviews analytics',
    description: 'Review analytics including ratings distribution, response rates, and recent activity'
  })
  @ApiResponse({
    status: 200,
    description: 'Seller reviews analytics retrieved successfully',
    type: SellerAnalyticsResponseDto
  })
  async getSellerReviews(
    @Query(ValidationPipe) dto: GetSellerReviewsDto,
    @Req() req: any
  ): Promise<SellerAnalyticsResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Sellers can only view their own data
    if (userRole === UserRole.SELLER) {
      return this.analyticsService.getSellerReviews(userId, dto);
    } else if (userRole === UserRole.ADMIN) {
      // Admins must specify sellerId in query params
      const sellerId = req.query.sellerId;
      if (!sellerId) {
        throw new ForbiddenException('Seller ID required for admin users');
      }
      return this.analyticsService.getSellerReviews(sellerId, dto);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @Get('seller/customers')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller customer analytics',
    description: 'Customer analytics including repeat buyers, lifetime value, and acquisition metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Seller customer analytics retrieved successfully',
    type: SellerAnalyticsResponseDto
  })
  async getSellerCustomers(
    @Query(ValidationPipe) dto: GetSellerCustomersDto,
    @Req() req: any
  ): Promise<SellerAnalyticsResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Sellers can only view their own data
    if (userRole === UserRole.SELLER) {
      return this.analyticsService.getSellerCustomers(userId, dto);
    } else if (userRole === UserRole.ADMIN) {
      // Admins must specify sellerId in query params
      const sellerId = req.query.sellerId;
      if (!sellerId) {
        throw new ForbiddenException('Seller ID required for admin users');
      }
      return this.analyticsService.getSellerCustomers(sellerId, dto);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @Get('seller/notifications')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller notification analytics',
    description: 'Notification engagement analytics including open rates, click rates, and type breakdown'
  })
  @ApiResponse({
    status: 200,
    description: 'Seller notification analytics retrieved successfully',
    type: SellerAnalyticsResponseDto
  })
  async getSellerNotifications(
    @Query(ValidationPipe) dto: GetSellerNotificationsDto,
    @Req() req: any
  ): Promise<SellerAnalyticsResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Sellers can only view their own data
    if (userRole === UserRole.SELLER) {
      return this.analyticsService.getSellerNotifications(userId, dto);
    } else if (userRole === UserRole.ADMIN) {
      // Admins must specify sellerId in query params
      const sellerId = req.query.sellerId;
      if (!sellerId) {
        throw new ForbiddenException('Seller ID required for admin users');
      }
      return this.analyticsService.getSellerNotifications(sellerId, dto);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @Get('seller/conversion')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller conversion analytics',
    description: 'Conversion funnel analytics and optimization insights for seller products'
  })
  @ApiResponse({
    status: 200,
    description: 'Seller conversion analytics retrieved successfully',
    type: SellerAnalyticsResponseDto
  })
  async getSellerConversion(
    @Query(ValidationPipe) dto: GetSellerConversionDto,
    @Req() req: any
  ): Promise<SellerAnalyticsResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Sellers can only view their own data
    if (userRole === UserRole.SELLER) {
      return this.analyticsService.getSellerConversion(userId, dto);
    } else if (userRole === UserRole.ADMIN) {
      // Admins must specify sellerId in query params
      const sellerId = req.query.sellerId;
      if (!sellerId) {
        throw new ForbiddenException('Seller ID required for admin users');
      }
      return this.analyticsService.getSellerConversion(sellerId, dto);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  // ================================
  // ADMIN ANALYTICS ENDPOINTS
  // ================================

  @Get('admin/platform')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get platform overview analytics',
    description: 'Platform-wide analytics including users, revenue, orders, and growth metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Platform analytics retrieved successfully',
    type: AdminAnalyticsResponseDto
  })
  async getPlatformOverview(
    @Query(ValidationPipe) dto: GetPlatformOverviewDto,
    @Req() req: any
  ): Promise<AdminAnalyticsResponseDto> {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }
    // Admins can access platform overview without specifying sellerId
    return this.analyticsService.getPlatformOverview(dto, req.user.id);
  }

  @Get('admin/top-performers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get top performers analytics',
    description: 'Top performing sellers, products, categories, and buyers with detailed metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Top performers analytics retrieved successfully',
    type: AdminAnalyticsResponseDto
  })
  @ApiQuery({ name: 'type', required: true, enum: ['sellers', 'products', 'categories', 'buyers'] })
  async getTopPerformers(
    @Query(ValidationPipe) dto: GetTopPerformersDto,
    @Req() req: any
  ): Promise<AdminAnalyticsResponseDto> {
    return this.analyticsService.getTopPerformers(dto, req.user.id);
  }

  @Get('admin/sellers/comparison')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller comparison analytics',
    description: 'Compare multiple sellers across various metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Seller comparison analytics retrieved successfully',
    type: AdminAnalyticsResponseDto
  })
  async getSellerComparison(
    @Query(ValidationPipe) dto: GetSellerComparisonDto,
    @Req() req: any
  ): Promise<AdminAnalyticsResponseDto> {
    return this.analyticsService.getSellerComparison(dto, req.user.id);
  }

  @Get('admin/conversion-funnel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get platform conversion funnel analytics',
    description: 'Platform-wide conversion funnel analysis with drop-off points and optimization insights'
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion funnel analytics retrieved successfully',
    type: AdminAnalyticsResponseDto
  })
  async getConversionFunnel(
    @Query(ValidationPipe) dto: GetConversionFunnelDto,
    @Req() req: any
  ): Promise<AdminAnalyticsResponseDto> {
    return this.analyticsService.getConversionFunnel(dto, req.user.id);
  }

  @Get('admin/cohort-analysis')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get cohort analysis',
    description: 'User retention and revenue cohort analysis with heatmap data'
  })
  @ApiResponse({
    status: 200,
    description: 'Cohort analysis retrieved successfully',
    type: AdminAnalyticsResponseDto
  })
  async getCohortAnalysis(
    @Query(ValidationPipe) dto: GetCohortAnalysisDto,
    @Req() req: any
  ): Promise<AdminAnalyticsResponseDto> {
    return this.analyticsService.getCohortAnalysis(dto, req.user.id);
  }

  @Get('admin/notifications')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get platform notification analytics',
    description: 'Platform-wide notification engagement analytics with trends and breakdowns'
  })
  @ApiResponse({
    status: 200,
    description: 'Notification analytics retrieved successfully',
    type: AdminAnalyticsResponseDto
  })
  async getNotificationAnalytics(
    @Query(ValidationPipe) dto: GetNotificationAnalyticsDto,
    @Req() req: any
  ): Promise<AdminAnalyticsResponseDto> {
    return this.analyticsService.getNotificationAnalytics(dto, req.user.id);
  }

  @Get('admin/user-behavior')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get user behavior analytics',
    description: 'User journey analysis, activity patterns, and engagement metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'User behavior analytics retrieved successfully',
    type: AdminAnalyticsResponseDto
  })
  async getUserBehavior(
    @Query(ValidationPipe) dto: GetUserBehaviorDto,
    @Req() req: any
  ): Promise<AdminAnalyticsResponseDto> {
    return this.analyticsService.getUserBehavior(dto, req.user.id);
  }

  @Get('admin/financial-report')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get financial report',
    description: 'Comprehensive financial report with revenue, fees, and payment analysis'
  })
  @ApiResponse({
    status: 200,
    description: 'Financial report retrieved successfully',
    type: AdminAnalyticsResponseDto
  })
  async getFinancialReport(
    @Query(ValidationPipe) dto: GetFinancialReportDto,
    @Req() req: any
  ): Promise<AdminAnalyticsResponseDto> {
    return this.analyticsService.getFinancialReport(dto, req.user.id);
  }

  // ================================
  // EXPORT AND REPORTING ENDPOINTS
  // ================================

  @Post('export')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Export analytics data',
    description: 'Export analytics data in various formats (CSV, XLSX, PDF, JSON)'
  })
  @ApiResponse({
    status: 200,
    description: 'Data exported successfully',
    type: ExportResponseDto
  })
  async exportData(
    @Body(ValidationPipe) dto: ExportDataDto,
    @Req() req: any
  ): Promise<ExportResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate access based on export type and user role
  if (userRole === UserRole.SELLER) {
    // Sellers can only export their own data
    dto.sellerId = userId;
  } else if (userRole === UserRole.ADMIN) {
    // Admins can export any seller's data
    // dto.sellerId stays as provided
  } else {
    throw new ForbiddenException('Access denied');
  }

  return this.analyticsService.exportData(dto, userId);
}

  @Post('reports/custom')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate custom report',
    description: 'Generate a custom analytics report with specified metrics and visualizations'
  })
  @ApiResponse({
    status: 200,
    description: 'Custom report generated successfully',
    type: ExportResponseDto
  })
  async generateCustomReport(
    @Body(ValidationPipe) dto: CustomReportDto,
    @Req() req: any
  ): Promise<ExportResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    return this.analyticsService.generateCustomReport(dto, userId, userRole);
  }

  @Post('reports/schedule')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Schedule automated report',
    description: 'Schedule automated report generation and delivery'
  })
  @ApiResponse({
    status: 201,
    description: 'Report scheduled successfully'
  })
  async scheduleReport(
    @Body(ValidationPipe) dto: ScheduleReportDto,
    @Req() req: any
  ): Promise<{ success: boolean; message: string; reportId: string }> {
    return this.analyticsService.scheduleReport(dto, req.user.id);
  }

  @Get('reports/:reportId/download')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Download generated report',
    description: 'Download a previously generated report by ID'
  })
  @ApiParam({ name: 'reportId', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report downloaded successfully'
  })
  async downloadReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Req() req: any
  ): Promise<any> {
    const userId = req.user.id;
    const userRole = req.user.role;

    return this.analyticsService.downloadReport(reportId, userId, userRole);
  }

  // ================================
  // CHART DATA ENDPOINTS
  // ================================

  @Get('charts/seller/:sellerId/revenue')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller revenue chart data',
    description: 'Get formatted chart data for seller revenue visualization'
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({
    status: 200,
    description: 'Revenue chart data retrieved successfully'
  })
  async getSellerRevenueChart(
    @Param('sellerId', ParseUUIDPipe) sellerId: string,
    @Query(ValidationPipe) dto: GetSellerRevenueDto,
    @Req() req: any
  ): Promise<any> {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Access control
    if (userRole === UserRole.SELLER && sellerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.analyticsService.getSellerRevenueChart(sellerId, dto);
  }

  @Get('charts/admin/platform-overview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get platform overview chart data',
    description: 'Get formatted chart data for platform overview dashboard'
  })
  @ApiResponse({
    status: 200,
    description: 'Platform overview chart data retrieved successfully'
  })
  async getPlatformOverviewChart(
    @Query(ValidationPipe) dto: GetPlatformOverviewDto,
    @Req() req: any
  ): Promise<any> {
  
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can access this endpoint');
}
return this.analyticsService.getPlatformOverviewChart(dto);
}

  
  // ================================
  // HEALTH AND STATUS ENDPOINTS
  // ================================

  @Get('health')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get analytics system health',
    description: 'Check the health and status of the analytics system'
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics system health retrieved successfully'
  })
  async getSystemHealth(
    @Req() req: any
  ): Promise<any> {
    if (req.user.role !== 'ADMIN') {
    throw new ForbiddenException('Only admin can access this endpoint');
  }
    return this.analyticsService.getSystemHealth();
  }

  @Get('cache/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get analytics cache status',
    description: 'Get status of analytics data cache and performance metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Cache status retrieved successfully'
  })
  async getCacheStatus(
    @Req() req: any
  ): Promise<any> {
    if (req.user.role !== 'ADMIN') {
    throw new ForbiddenException('Only admin can access this endpoint');
  }
    return this.analyticsService.getCacheStatus();
  }

  @Get('stats')
@Public()
@ApiOperation({ summary: 'Get general analytics stats' })
async getStats() {
  try {
    const [totalProducts, totalUsers, totalOrders] = await Promise.all([
      this.prisma.product.count({ where: { status: 'APPROVED' } }),
      this.prisma.user.count(),
      this.prisma.order.count({ where: { status: 'PAID' } }),
    ]);

    return {
      success: true,
      data: {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue: 0, // Calcular si tienes datos
      }
    };
  } catch (error) {
    return {
      success: false,
      data: {
        totalProducts: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
      }
    };
  }
}
}