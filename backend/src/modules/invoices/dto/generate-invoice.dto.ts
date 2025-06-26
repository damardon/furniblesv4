// src/modules/invoices/dto/generate-invoice.dto.ts
import { IsString, IsOptional, IsIn, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GenerateInvoiceDto {
  @ApiProperty({
    description: 'Order ID to generate invoice for',
    example: 'order_123456789',
  })
  @IsString({ message: 'orderId.invalid' })
  orderId: string;

  @ApiPropertyOptional({
    description: 'Custom invoice notes',
    example: 'Thank you for your purchase',
  })
  @IsOptional()
  @IsString({ message: 'notes.invalid' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Invoice due date (ISO format)',
    example: '2024-07-24T00:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'dueAt.invalid' })
  dueAt?: string;

  @ApiPropertyOptional({
    description: 'Tax rate to apply (as decimal, e.g., 0.08 for 8%)',
    example: 0.08,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'taxRate.invalid' })
  @Min(0, { message: 'taxRate.tooSmall' })
  @Max(1, { message: 'taxRate.tooLarge' })
  taxRate?: number;
}

export class InvoiceFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by invoice status',
    example: 'PAID',
    enum: ['PENDING', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['PENDING', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED'], {
    message: 'status.invalid',
  })
  status?: 'PENDING' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

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
    description: 'Minimum invoice amount',
    example: 10.00,
  })
  @IsOptional()
  @IsNumber({}, { message: 'minAmount.invalid' })
  @Min(0, { message: 'minAmount.tooSmall' })
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum invoice amount',
    example: 10000.00,
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
    example: 'issuedAt',
    enum: ['issuedAt', 'totalAmount', 'status', 'dueAt'],
    default: 'issuedAt',
  })
  @IsOptional()
  @IsIn(['issuedAt', 'totalAmount', 'status', 'dueAt'], {
    message: 'sortBy.invalid',
  })
  sortBy?: 'issuedAt' | 'totalAmount' | 'status' | 'dueAt';

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
    description: 'Search by invoice number or order number',
    example: 'INV-20240624',
  })
  @IsOptional()
  @IsString({ message: 'search.invalid' })
  search?: string;
}