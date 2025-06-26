// src/modules/payments/dto/payment-setup.dto.ts
import { IsString, IsBoolean, IsOptional, IsIn, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentSetupDto {
  @ApiProperty({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsString({ message: 'stripeAccountId.invalid' })
  stripeAccountId: string;

  @ApiPropertyOptional({
    description: 'Enable automatic payouts',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'automaticPayouts.invalid' })
  automaticPayouts?: boolean;

  @ApiPropertyOptional({
    description: 'Payout schedule frequency',
    example: 'weekly',
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly',
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'], { message: 'payoutSchedule.invalid' })
  payoutSchedule?: 'daily' | 'weekly' | 'monthly';

  @ApiPropertyOptional({
    description: 'Minimum payout amount (in dollars)',
    example: 25.00,
    minimum: 1,
    maximum: 10000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'minimumPayoutAmount.invalid' })
  @Min(1, { message: 'minimumPayoutAmount.tooSmall' })
  @Max(10000, { message: 'minimumPayoutAmount.tooLarge' })
  minimumPayoutAmount?: number;

  @ApiPropertyOptional({
    description: 'Preferred currency for payouts',
    example: 'USD',
    enum: ['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'],
  })
  @IsOptional()
  @IsIn(['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'], {
    message: 'currency.notSupported',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Enable instant payouts (if available)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'instantPayouts.invalid' })
  instantPayouts?: boolean;

  @ApiPropertyOptional({
    description: 'Email notifications for payouts',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'emailNotifications.invalid' })
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'SMS notifications for payouts',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'smsNotifications.invalid' })
  smsNotifications?: boolean;
}