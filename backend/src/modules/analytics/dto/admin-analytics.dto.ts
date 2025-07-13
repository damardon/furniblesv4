// src/modules/analytics/dto/admin-analytics.dto.ts

import { IsOptional, IsEnum, IsUUID, IsBoolean, IsArray, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminAnalyticsFiltersDto, ConversionAnalyticsFiltersDto, CohortAnalyticsFiltersDto, NotificationAnalyticsFiltersDto } from './filters.dto';
import { SortBy, SortOrder } from './seller-analytics.dto';

export enum PlatformMetric {
  USERS = 'users',
  REVENUE = 'revenue',
  ORDERS = 'orders',
  PRODUCTS = 'products',
  REVIEWS = 'reviews',
  NOTIFICATIONS = 'notifications',
  CONVERSION = 'conversion'
}

export enum TopPerformerType {
  SELLERS = 'sellers',
  PRODUCTS = 'products',
  CATEGORIES = 'categories',
  BUYERS = 'buyers'
}

export class GetPlatformOverviewDto extends AdminAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include comparison with previous period',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeComparison must be a boolean' })
  includeComparison?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include growth trends',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeTrends must be a boolean' })
  includeTrends?: boolean = true;

  @ApiPropertyOptional({
    description: 'Metrics to include',
    enum: PlatformMetric,
    isArray: true,
    example: [PlatformMetric.USERS, PlatformMetric.REVENUE, PlatformMetric.ORDERS]
  })
  @IsOptional()
  @IsArray({ message: 'metrics must be an array' })
  @IsEnum(PlatformMetric, { each: true, message: 'Each metric must be a valid platform metric' })
  @Type(() => String)
  metrics?: PlatformMetric[];
}

export class GetTopPerformersDto extends AdminAnalyticsFiltersDto {
  @ApiProperty({
    description: 'Type of performers to retrieve',
    enum: TopPerformerType
  })
  @IsEnum(TopPerformerType, { message: 'type must be one of: sellers, products, categories, buyers' })
  type: TopPerformerType;

  @ApiPropertyOptional({
    description: 'Sort performers by',
    enum: SortBy,
    default: SortBy.REVENUE
  })
  @IsOptional()
  @IsEnum(SortBy, { message: 'sortBy must be one of: revenue, orders, rating, reviews, createdAt, updatedAt' })
  sortBy?: SortBy = SortBy.REVENUE;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'sortOrder must be either asc or desc' })
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Include detailed metrics',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeDetails must be a boolean' })
  includeDetails?: boolean = true;
}

export class GetSellerComparisonDto extends AdminAnalyticsFiltersDto {
  @ApiProperty({
    description: 'Seller IDs to compare',
    type: [String],
    example: ['seller1_id', 'seller2_id']
  })
  @IsArray({ message: 'sellerIds must be an array' })
  @IsUUID(4, { each: true, message: 'Each sellerId must be a valid UUID' })
  sellerIds: string[];

  @ApiPropertyOptional({
    description: 'Metrics to compare',
    enum: PlatformMetric,
    isArray: true,
    default: [PlatformMetric.REVENUE, PlatformMetric.ORDERS, PlatformMetric.REVIEWS]
  })
  @IsOptional()
  @IsArray({ message: 'metrics must be an array' })
  @IsEnum(PlatformMetric, { each: true, message: 'Each metric must be a valid platform metric' })
  @Type(() => String)
  metrics?: PlatformMetric[] = [PlatformMetric.REVENUE, PlatformMetric.ORDERS, PlatformMetric.REVIEWS];
}

export class GetConversionFunnelDto extends ConversionAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include step-by-step breakdown',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeBreakdown must be a boolean' })
  includeBreakdown?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include drop-off analysis',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeDropOffs must be a boolean' })
  includeDropOffs?: boolean = true;
}

export class GetCohortAnalysisDto extends CohortAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include revenue per user analysis',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeRevenue must be a boolean' })
  includeRevenue?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include retention heatmap data',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeHeatmap must be a boolean' })
  includeHeatmap?: boolean = true;
}

export class GetNotificationAnalyticsDto extends NotificationAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include engagement trends',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeTrends must be a boolean' })
  includeTrends?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include breakdown by type and channel',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeBreakdown must be a boolean' })
  includeBreakdown?: boolean = true;
}

export class GetUserBehaviorDto extends AdminAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include user journey analysis',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeJourney must be a boolean' })
  includeJourney?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include activity patterns',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includePatterns must be a boolean' })
  includePatterns?: boolean = true;
}

export class GetFinancialReportDto extends AdminAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include detailed breakdown by seller',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeSellerBreakdown must be a boolean' })
  includeSellerBreakdown?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include platform fees analysis',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeFeesAnalysis must be a boolean' })
  includeFeesAnalysis?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include payment method breakdown',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includePaymentMethods must be a boolean' })
  includePaymentMethods?: boolean = true;
}

export class AdminAnalyticsResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Analytics data' })
  data: any;

  @ApiProperty({ description: 'Metadata about the response' })
  meta: {
    requestedBy: string;
    timeRange: {
      start: string;
      end: string;
    };
    lastUpdated: string;
    dataPoints: number;
    currency: string;
    filters?: Record<string, any>;
  };

  @ApiPropertyOptional({ description: 'Error message if any' })
  error?: string;
}