// src/modules/payments/dto/balance-request.dto.ts
import { IsString, IsOptional, IsIn, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BalanceRequestDto {
  @ApiProperty({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsString({ message: 'stripeAccountId.invalid' })
  stripeAccountId: string;

  @ApiPropertyOptional({
    description: 'Currency to filter balance',
    example: 'USD',
    enum: ['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'],
  })
  @IsOptional()
  @IsIn(['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'], {
    message: 'currency.notSupported',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Include pending balance',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'includePending.invalid' })
  includePending?: boolean;

  @ApiPropertyOptional({
    description: 'Include connect reserved funds',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'includeReserved.invalid' })
  includeReserved?: boolean;
}

export class PayoutHistoryRequestDto {
  @ApiProperty({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsString({ message: 'stripeAccountId.invalid' })
  stripeAccountId: string;

  @ApiPropertyOptional({
    description: 'Start date for history (ISO format)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate.invalid' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for history (ISO format)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate.invalid' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by payout status',
    example: 'paid',
    enum: ['pending', 'paid', 'failed', 'canceled'],
  })
  @IsOptional()
  @IsIn(['pending', 'paid', 'failed', 'canceled'], {
    message: 'status.invalid',
  })
  status?: 'pending' | 'paid' | 'failed' | 'canceled';

  @ApiPropertyOptional({
    description: 'Maximum number of records to return',
    example: 20,
  })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Pagination cursor for next page',
    example: 'po_1234567890',
  })
  @IsOptional()
  @IsString({ message: 'startingAfter.invalid' })
  startingAfter?: string;
}