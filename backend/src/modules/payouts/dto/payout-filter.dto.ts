// src/modules/payouts/dto/payout-filter.dto.ts - FINAL
import { IsOptional, IsIn, IsDateString, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class PayoutFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by payout status',
    example: 'PAID',
    enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'], {
    message: 'status.invalid',
  })
  status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';

  @ApiPropertyOptional({
    description: 'Filter by currency',
    example: 'USD',
    enum: ['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'],
  })
  @IsOptional()
  @IsIn(['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'], {
    message: 'currency.invalid',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Start date for date range filter (ISO format)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate.invalid' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for date range filter (ISO format)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate.invalid' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Minimum payout amount',
    example: 10.00,
  })
  @IsOptional()
  @IsNumber({}, { message: 'minAmount.invalid' })
  @Min(0, { message: 'minAmount.tooSmall' })
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum payout amount',
    example: 1000.00,
  })
  @IsOptional()
  @IsNumber({}, { message: 'maxAmount.invalid' })
  @Min(0, { message: 'maxAmount.tooSmall' })
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter by seller ID',
    example: 'user_123456789',
  })
  @IsOptional()
  @IsString({ message: 'sellerId.invalid' })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'limit.invalid' })
  @Min(1, { message: 'limit.tooSmall' })
  @Max(100, { message: 'limit.tooLarge' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'page.invalid' })
  @Min(1, { message: 'page.tooSmall' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'amount', 'status', 'processedAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'amount', 'status', 'processedAt'], {
    message: 'sortBy.invalid',
  })
  sortBy?: 'createdAt' | 'amount' | 'status' | 'processedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sortOrder.invalid' })
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Search by description or seller name',
    example: 'weekly payout',
  })
  @IsOptional()
  @IsString({ message: 'search.invalid' })
  search?: string;
}