// src/modules/payouts/dto/update-payout.dto.ts - FINAL
import { IsOptional, IsIn, IsString, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePayoutDto {
  @ApiPropertyOptional({
    description: 'Update payout status (Admin only)',
    example: 'CANCELLED',
    enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'], {
    message: 'status.invalid',
  })
  status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';

  @ApiPropertyOptional({
    description: 'Update description',
    example: 'Updated payout description',
  })
  @IsOptional()
  @IsString({ message: 'description.invalid' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Failure reason (for failed payouts)',
    example: 'Insufficient funds in Stripe account',
  })
  @IsOptional()
  @IsString({ message: 'failureReason.invalid' })
  failureReason?: string;

  @ApiPropertyOptional({
    description: 'Processing date (Admin only)',
    example: '2024-06-24T10:30:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'processedAt.invalid' })
  processedAt?: string;
}

export class PayoutActionDto {
  @ApiPropertyOptional({
    description: 'Action to perform on the payout',
    example: 'retry',
    enum: ['retry', 'cancel', 'approve', 'reject'],
  })
  @IsIn(['retry', 'cancel', 'approve', 'reject'], {
    message: 'action.invalid',
  })
  action: 'retry' | 'cancel' | 'approve' | 'reject';

  @ApiPropertyOptional({
    description: 'Reason for the action',
    example: 'Retry payout after fixing bank account information',
  })
  @IsOptional()
  @IsString({ message: 'reason.invalid' })
  reason?: string;

  @ApiPropertyOptional({
    description: 'Force action even if conditions are not met',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'force.invalid' })
  force?: boolean;
}