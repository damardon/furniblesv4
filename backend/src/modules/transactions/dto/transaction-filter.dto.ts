// src/modules/transactions/dto/transaction-filter.dto.ts
import {
  IsOptional,
  IsIn,
  IsDateString,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class TransactionFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    example: 'SALE',
    enum: [
      'SALE',
      'PLATFORM_FEE',
      'STRIPE_FEE',
      'PAYOUT',
      'REFUND',
      'CHARGEBACK',
    ],
  })
  @IsOptional()
  @IsIn(
    ['SALE', 'PLATFORM_FEE', 'STRIPE_FEE', 'PAYOUT', 'REFUND', 'CHARGEBACK'],
    {
      message: 'type.invalid',
    },
  )
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Filter by transaction status',
    example: 'COMPLETED',
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'], {
    message: 'status.invalid',
  })
  status?: TransactionStatus;

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
    description: 'Filter by seller ID',
    example: 'user_123456789',
  })
  @IsOptional()
  @IsString({ message: 'sellerId.invalid' })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by order ID',
    example: 'order_123456789',
  })
  @IsOptional()
  @IsString({ message: 'orderId.invalid' })
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by payout ID',
    example: 'payout_123456789',
  })
  @IsOptional()
  @IsString({ message: 'payoutId.invalid' })
  payoutId?: string;

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
    description: 'Minimum transaction amount',
    example: 1.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'minAmount.invalid' })
  @Min(0, { message: 'minAmount.tooSmall' })
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum transaction amount',
    example: 10000.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'maxAmount.invalid' })
  @Min(0, { message: 'maxAmount.tooSmall' })
  maxAmount?: number;

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
    enum: ['createdAt', 'amount', 'type', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'amount', 'type', 'status'], {
    message: 'sortBy.invalid',
  })
  sortBy?: 'createdAt' | 'amount' | 'type' | 'status';

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
    description: 'Search in description or Stripe transaction ID',
    example: 'ch_1234567890',
  })
  @IsOptional()
  @IsString({ message: 'search.invalid' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Include related data (order, seller, payout)',
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRelations?: boolean;
}
