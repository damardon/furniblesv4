import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';

export class ModerateReviewDto {
  @ApiProperty({
    description: 'New review status',
    enum: ReviewStatus,
    example: 'PUBLISHED'
  })
  @IsNotEmpty({ message: 'status.required' })
  @IsIn(['PENDING_MODERATION', 'PUBLISHED', 'FLAGGED', 'REMOVED'], {
    message: 'status.invalid'
  })
  status: ReviewStatus;

  @ApiPropertyOptional({
    description: 'Reason for moderation action',
    maxLength: 500,
    example: 'Review contains inappropriate language'
  })
  @IsOptional()
  @IsString({ message: 'reason.mustBeString' })
  @MaxLength(500, { message: 'reason.tooLong' })
  reason?: string;
}