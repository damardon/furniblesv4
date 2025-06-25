// src/modules/stripe/dto/create-payout.dto.ts
import { IsNumber, IsString, IsOptional, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePayoutDto {
  @ApiProperty({
    description: 'Amount to payout in the smallest currency unit',
    example: 10000, // $100.00
    minimum: 100,
  })
  @IsNumber({}, { message: 'amount.invalid' })
  @Min(100, { message: 'amount.tooSmall' }) // Minimum $1.00
  @Transform(({ value }) => Math.round(value * 100)) // Convert to cents
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

  @ApiProperty({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsString({ message: 'stripeAccountId.invalid' })
  stripeAccountId: string;

  @ApiPropertyOptional({
    description: 'Payout method',
    example: 'standard',
    enum: ['instant', 'standard'],
    default: 'standard',
  })
  @IsOptional()
  @IsIn(['instant', 'standard'], { message: 'method.invalid' })
  method?: 'instant' | 'standard';

  @ApiPropertyOptional({
    description: 'Description for the payout',
    example: 'Weekly earnings payout',
  })
  @IsOptional()
  @IsString({ message: 'description.invalid' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { period: 'weekly', sellerId: 'user_123' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}