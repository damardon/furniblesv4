// src/modules/payouts/dto/request-payout.dto.ts - FINAL
import { IsNumber, IsString, IsOptional, IsIn, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestPayoutDto {
  @ApiPropertyOptional({
    description: 'Amount to payout (if not specified, will payout all available balance)',
    example: 100.50,
    minimum: 1,
    maximum: 100000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'amount.invalid' })
  @Min(1, { message: 'amount.tooSmall' })
  @Max(100000, { message: 'amount.tooLarge' })
  amount?: number;

  @ApiPropertyOptional({
    description: 'Currency for the payout',
    example: 'USD',
    enum: ['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'],
    default: 'USD',
  })
  @IsOptional()
  @IsIn(['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'], {
    message: 'currency.notSupported',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Payout method (instant payouts may have additional fees)',
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
    description: 'Force payout even if below minimum threshold',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'forceMinimum.invalid' })
  forceMinimum?: boolean;
}