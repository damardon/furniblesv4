// src/modules/analytics/dto/export.dto.ts

import { IsEnum, IsOptional, IsString, IsArray, IsBoolean, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseAnalyticsFiltersDto } from './filters.dto';

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  PDF = 'pdf',
  JSON = 'json'
}

export enum ExportType {
  SELLER_DASHBOARD = 'seller_dashboard',
  SELLER_REVENUE = 'seller_revenue',
  SELLER_PRODUCTS = 'seller_products',
  SELLER_REVIEWS = 'seller_reviews',
  SELLER_CUSTOMERS = 'seller_customers',
  ADMIN_PLATFORM = 'admin_platform',
  ADMIN_SELLERS = 'admin_sellers',
  ADMIN_FINANCIAL = 'admin_financial',
  CONVERSION_FUNNEL = 'conversion_funnel',
  COHORT_ANALYSIS = 'cohort_analysis',
  NOTIFICATION_ANALYTICS = 'notification_analytics',
  CUSTOM_REPORT = 'custom_report'
}

export enum Frequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}  

export class ExportDataDto extends BaseAnalyticsFiltersDto {
  @ApiProperty({
    description: 'Type of data to export',
    enum: ExportType
  })
  @IsEnum(ExportType, { message: 'type must be a valid export type' })
  type: ExportType;

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    default: ExportFormat.CSV
  })
  @IsEnum(ExportFormat, { message: 'format must be one of: csv, xlsx, pdf, json' })
  format: ExportFormat = ExportFormat.CSV;

  @ApiPropertyOptional({
    description: 'Custom filename (without extension)',
    example: 'my_analytics_report'
  })
  @IsOptional()
  @IsString({ message: 'filename must be a string' })
  filename?: string;

  @ApiPropertyOptional({
    description: 'Specific seller ID for seller-specific exports',
    example: 'clp1234567890abcdef'
  })
  @IsOptional()
  @IsUUID(4, { message: 'sellerId must be a valid UUID' })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Specific product ID for product-specific exports',
    example: 'clp1234567890abcdef'
  })
  @IsOptional()
  @IsUUID(4, { message: 'productId must be a valid UUID' })
  productId?: string;

  @ApiPropertyOptional({
    description: 'Include metadata in export',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeMetadata must be a boolean' })
  includeMetadata?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include charts in export (PDF only)',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeCharts must be a boolean' })
  includeCharts?: boolean = true;
}

export class CustomReportDto extends BaseAnalyticsFiltersDto {
  @ApiProperty({
    description: 'Report title',
    example: 'Q4 2024 Sales Performance Report'
  })
  @IsString({ message: 'title must be a string' })
  title: string;

  @ApiPropertyOptional({
    description: 'Report description',
    example: 'Comprehensive analysis of sales performance for Q4 2024'
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'Metrics to include in the report',
    type: [String],
    example: ['revenue', 'orders', 'customers', 'reviews']
  })
  @IsArray({ message: 'metrics must be an array' })
  @IsString({ each: true, message: 'Each metric must be a string' })
  metrics: string[];

  @ApiPropertyOptional({
    description: 'Chart types to include',
    type: [String],
    example: ['line', 'bar', 'pie']
  })
  @IsOptional()
  @IsArray({ message: 'chartTypes must be an array' })
  @IsString({ each: true, message: 'Each chart type must be a string' })
  chartTypes?: string[];

  @ApiPropertyOptional({
    description: 'Include raw data tables',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeRawData must be a boolean' })
  includeRawData?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include executive summary',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeExecutiveSummary must be a boolean' })
  includeExecutiveSummary?: boolean = true;
}

export class ScheduleReportDto {
  @ApiProperty({
    description: 'Report name',
    example: 'Weekly Sales Report'
  })
  @IsString({ message: 'name must be a string' })
  name: string;

  @ApiProperty({
    description: 'Report type',
    enum: ExportType
  })
  @IsEnum(ExportType, { message: 'type must be a valid export type' })
  type: ExportType;

  @ApiProperty({
    description: 'Schedule frequency',
    enum: Frequency,
    example: 'weekly'
  })
  @IsEnum(Frequency, {
    message: 'frequency must be one of: daily, weekly, monthly, quarterly'
  })
  frequency: Frequency;

  @ApiPropertyOptional({
    description: 'Email recipients',
    type: [String],
    example: ['admin@furnibles.com', 'analytics@furnibles.com']
  })
  @IsOptional()
  @IsArray({ message: 'recipients must be an array' })
  @IsString({ each: true, message: 'Each recipient must be a valid email' })
  recipients?: string[];

  @ApiPropertyOptional({
    description: 'Export format for scheduled reports',
    enum: ExportFormat,
    default: ExportFormat.PDF
  })
  @IsOptional()
  @IsEnum(ExportFormat, { message: 'format must be one of: csv, xlsx, pdf, json' })
  format?: ExportFormat = ExportFormat.PDF;

  @ApiPropertyOptional({
    description: 'Additional filters for the scheduled report'
  })
  @IsOptional()
  filters?: Record<string, any>;
}

export class ExportResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Export data or download information' })
  data: {
    filename: string;
    downloadUrl?: string;
    size?: number;
    recordCount?: number;
    generatedAt: string;
  };

  @ApiProperty({ description: 'Export metadata' })
  meta: {
    type: ExportType;
    format: ExportFormat;
    requestedBy: string;
    timeRange: {
      start: string;
      end: string;
    };
    filters?: Record<string, any>;
  };

  @ApiPropertyOptional({ description: 'Error message if any' })
  error?: string;
}