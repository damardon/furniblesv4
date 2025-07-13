// src/modules/analytics/dto/seller-analytics.dto.ts

import { IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SellerAnalyticsFiltersDto } from './filters.dto';

export enum DashboardMetric {
  REVENUE = 'revenue',
  ORDERS = 'orders',
  PRODUCTS = 'products',
  REVIEWS = 'reviews',
  CUSTOMERS = 'customers',
  CONVERSION = 'conversion'
}

export enum SortBy {
  REVENUE = 'revenue',
  ORDERS = 'orders',
  RATING = 'rating',
  REVIEWS = 'reviews',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export class GetSellerDashboardDto extends SellerAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include comparison with previous period',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeComparison must be a boolean' })
  includeComparison?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include recent activity data',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeActivity must be a boolean' })
  includeActivity?: boolean = true;
}

export class GetSellerRevenueDto extends SellerAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include breakdown by product',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeProductBreakdown must be a boolean' })
  includeProductBreakdown?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include platform fees breakdown',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeFees must be a boolean' })
  includeFees?: boolean = false;
}

export class GetSellerProductsDto extends SellerAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Sort products by',
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
    description: 'Include detailed metrics for each product',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeDetails must be a boolean' })
  includeDetails?: boolean = true;
}

export class GetSellerReviewsDto extends SellerAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include review distribution by rating',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeDistribution must be a boolean' })
  includeDistribution?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include recent reviews',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeRecentReviews must be a boolean' })
  includeRecentReviews?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include response rate metrics',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeResponseMetrics must be a boolean' })
  includeResponseMetrics?: boolean = true;
}

export class GetSellerCustomersDto extends SellerAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include repeat customer analysis',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeRepeatAnalysis must be a boolean' })
  includeRepeatAnalysis?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include customer lifetime value',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeLifetimeValue must be a boolean' })
  includeLifetimeValue?: boolean = false;
}

export class GetSellerNotificationsDto extends SellerAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include engagement metrics',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeEngagement must be a boolean' })
  includeEngagement?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include breakdown by notification type',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeTypeBreakdown must be a boolean' })
  includeTypeBreakdown?: boolean = true;
}

export class GetSellerConversionDto extends SellerAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Include funnel analysis',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeFunnel must be a boolean' })
  includeFunnel?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include conversion by traffic source',
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeTrafficSource must be a boolean' })
  includeTrafficSource?: boolean = false;
}

export class SellerAnalyticsResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Analytics data' })
  data: any;

  @ApiProperty({ description: 'Metadata about the response' })
  meta: {
    sellerId: string;
    timeRange: {
      start: string;
      end: string;
    };
    lastUpdated: string;
    dataPoints: number;
    currency: string;
  };

  @ApiPropertyOptional({ description: 'Error message if any' })
  error?: string;
}