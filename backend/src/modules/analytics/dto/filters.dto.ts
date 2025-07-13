// src/modules/analytics/dto/filters.dto.ts

import { IsOptional, IsString, IsDateString, IsEnum, IsUUID, Min, Max, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum GroupByPeriod {
  DAY = 'day',
  WEEK = 'week', 
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export class TimeRangeDto {
  @ApiPropertyOptional({
    description: 'Start date in ISO format',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate?: string;
}

export class BaseAnalyticsFiltersDto extends TimeRangeDto {
  @ApiPropertyOptional({
    description: 'Group results by time period',
    enum: GroupByPeriod,
    example: GroupByPeriod.MONTH
  })
  @IsOptional()
  @IsEnum(GroupByPeriod, { message: 'groupBy must be one of: day, week, month, quarter, year' })
  groupBy?: GroupByPeriod;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    minimum: 1,
    maximum: 1000,
    default: 50
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(1000, { message: 'limit cannot exceed 1000' })
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Number of results to skip',
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'offset must be an integer' })
  @Min(0, { message: 'offset cannot be negative' })
  offset?: number = 0;
}

export class SellerAnalyticsFiltersDto extends BaseAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific product ID',
    example: 'clp1234567890abcdef'
  })
  @IsOptional()
  @IsUUID(4, { message: 'productId must be a valid UUID' })
  productId?: string;

  @ApiPropertyOptional({
    description: 'Filter by product category ID',
    example: 'clp1234567890abcdef'
  })
  @IsOptional()
  @IsUUID(4, { message: 'categoryId must be a valid UUID' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: OrderStatus,
    example: OrderStatus.COMPLETED
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'status must be a valid order status' })
  status?: OrderStatus;
}

export class AdminAnalyticsFiltersDto extends BaseAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific seller ID',
    example: 'clp1234567890abcdef'
  })
  @IsOptional()
  @IsUUID(4, { message: 'sellerId must be a valid UUID' })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific product ID',
    example: 'clp1234567890abcdef'
  })
  @IsOptional()
  @IsUUID(4, { message: 'productId must be a valid UUID' })
  productId?: string;

  @ApiPropertyOptional({
    description: 'Filter by product category ID',
    example: 'clp1234567890abcdef'
  })
  @IsOptional()
  @IsUUID(4, { message: 'categoryId must be a valid UUID' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user role',
    example: 'SELLER'
  })
  @IsOptional()
  @IsString({ message: 'userRole must be a string' })
  userRole?: string;

  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: OrderStatus,
    example: OrderStatus.COMPLETED
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'status must be a valid order status' })
  status?: OrderStatus;
}

export class ConversionAnalyticsFiltersDto extends BaseAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific seller ID',
    example: 'clp1234567890abcdef'
  })
  @IsOptional()
  @IsUUID(4, { message: 'sellerId must be a valid UUID' })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by product category ID',
    example: 'clp1234567890abcdef'
  })
  @IsOptional()
  @IsUUID(4, { message: 'categoryId must be a valid UUID' })
  categoryId?: string;
}

export class CohortAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Start month for cohort analysis (YYYY-MM format)',
    example: '2024-01'
  })
  @IsOptional()
  @IsString({ message: 'startMonth must be a string in YYYY-MM format' })
  startMonth?: string;

  @ApiPropertyOptional({
    description: 'End month for cohort analysis (YYYY-MM format)',
    example: '2024-12'
  })
  @IsOptional()
  @IsString({ message: 'endMonth must be a string in YYYY-MM format' })
  endMonth?: string;

  @ApiPropertyOptional({
    description: 'Number of months to analyze',
    minimum: 1,
    maximum: 24,
    default: 12
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'periods must be an integer' })
  @Min(1, { message: 'periods must be at least 1' })
  @Max(24, { message: 'periods cannot exceed 24' })
  periods?: number = 12;
}

export class NotificationAnalyticsFiltersDto extends BaseAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by notification type',
    example: 'REVIEW_RECEIVED'
  })
  @IsOptional()
  @IsString({ message: 'notificationType must be a string' })
  notificationType?: string;

  @ApiPropertyOptional({
    description: 'Filter by notification channel',
    example: 'EMAIL'
  })
  @IsOptional()
  @IsString({ message: 'channel must be a string' })
  channel?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'clp1234567890abcdef'
  })
  @IsOptional()
  @IsUUID(4, { message: 'userId must be a valid UUID' })
  userId?: string;
}