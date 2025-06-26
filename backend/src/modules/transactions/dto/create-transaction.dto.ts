// src/modules/transactions/dto/create-transaction.dto.ts
import { IsString, IsNumber, IsOptional, IsIn, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Type of transaction',
    example: 'SALE',
    enum: ['SALE', 'PLATFORM_FEE', 'STRIPE_FEE', 'PAYOUT', 'REFUND', 'CHARGEBACK'],
  })
  @IsIn(['SALE', 'PLATFORM_FEE', 'STRIPE_FEE', 'PAYOUT', 'REFUND', 'CHARGEBACK'], {
    message: 'type.invalid',
  })
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction amount',
    example: 29.99,
    minimum: 0,
  })
  @IsNumber({}, { message: 'amount.invalid' })
  @Min(0, { message: 'amount.tooSmall' })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    enum: ['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'],
  })
  @IsString({ message: 'currency.invalid' })
  @IsIn(['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'], {
    message: 'currency.notSupported',
  })
  currency: string;

  @ApiPropertyOptional({
    description: 'Transaction status',
    example: 'COMPLETED',
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
  })
  @IsOptional()
  @IsIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'], {
    message: 'status.invalid',
  })
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Associated seller ID',
    example: 'user_123456789',
  })
  @IsOptional()
  @IsString({ message: 'sellerId.invalid' })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Associated order ID',
    example: 'order_123456789',
  })
  @IsOptional()
  @IsString({ message: 'orderId.invalid' })
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Associated payout ID',
    example: 'payout_123456789',
  })
  @IsOptional()
  @IsString({ message: 'payoutId.invalid' })
  payoutId?: string;

  @ApiPropertyOptional({
    description: 'Stripe transaction ID',
    example: 'ch_1234567890abcdef',
  })
  @IsOptional()
  @IsString({ message: 'stripeTransactionId.invalid' })
  stripeTransactionId?: string;

  @ApiPropertyOptional({
    description: 'Stripe charge ID',
    example: 'ch_1234567890abcdef',
  })
  @IsOptional()
  @IsString({ message: 'stripeChargeId.invalid' })
  stripeChargeId?: string;

  @ApiPropertyOptional({
    description: 'Stripe payment intent ID',
    example: 'pi_1234567890abcdef',
  })
  @IsOptional()
  @IsString({ message: 'stripePaymentIntentId.invalid' })
  stripePaymentIntentId?: string;

  @ApiPropertyOptional({
    description: 'Transaction description',
    example: 'Sale of Modern Chair Design - Order #ORD-20240624-001',
  })
  @IsOptional()
  @IsString({ message: 'description.invalid' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { 
      productIds: ['product_123', 'product_456'],
      orderNumber: 'ORD-20240624-001',
      customerEmail: 'customer@example.com'
    },
  })
  @IsOptional()
  @IsObject({ message: 'metadata.invalid' })
  metadata?: Record<string, any>;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    description: 'Update transaction status',
    example: 'COMPLETED',
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'], {
    message: 'status.invalid',
  })
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Update description',
    example: 'Updated transaction description',
  })
  @IsOptional()
  @IsString({ message: 'description.invalid' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Update Stripe transaction ID',
    example: 'ch_1234567890abcdef',
  })
  @IsOptional()
  @IsString({ message: 'stripeTransactionId.invalid' })
  stripeTransactionId?: string;

  @ApiPropertyOptional({
    description: 'Update metadata',
    example: { updated: true, reason: 'Correction' },
  })
  @IsOptional()
  @IsObject({ message: 'metadata.invalid' })
  metadata?: Record<string, any>;
}

export class BulkCreateTransactionDto {
  @ApiProperty({
    description: 'Array of transactions to create',
    type: [CreateTransactionDto],
  })
  transactions: CreateTransactionDto[];

  @ApiPropertyOptional({
    description: 'Skip validation errors and continue with valid transactions',
    example: true,
    default: false,
  })
  @IsOptional()
  skipErrors?: boolean;
}