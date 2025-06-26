import { IsOptional, IsIn, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';

export class FilterReviewDto {
  @ApiPropertyOptional({
    description: 'Product ID to filter reviews',
    example: 'clp0987654321'
  })
  @IsOptional()
  @IsUUID('4', { message: 'productId.invalid' })
  productId?: string;

  @ApiPropertyOptional({
    description: 'Seller ID to filter reviews',
    example: 'clp1234567890'
  })
  @IsOptional()
  @IsUUID('4', { message: 'sellerId.invalid' })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by rating',
    minimum: 1,
    maximum: 5,
    example: 5
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'rating.mustBeInteger' })
  @Min(1, { message: 'rating.tooLow' })
  @Max(5, { message: 'rating.tooHigh' })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Filter by review status',
    enum: ReviewStatus,
    example: 'PUBLISHED'
  })
  @IsOptional()
  @IsIn(['PENDING_MODERATION', 'PUBLISHED', 'FLAGGED', 'REMOVED'], {
    message: 'status.invalid'
  })
  status?: ReviewStatus;

  @ApiPropertyOptional({
    description: 'Sort by',
    enum: ['newest', 'oldest', 'highest', 'lowest', 'helpful'],
    example: 'newest'
  })
  @IsOptional()
  @IsIn(['newest', 'oldest', 'highest', 'lowest', 'helpful'], {
    message: 'sortBy.invalid'
  })
  sortBy?: string = 'newest';

  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page.mustBeInteger' })
  @Min(1, { message: 'page.tooLow' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 50,
    example: 12
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit.mustBeInteger' })
  @Min(1, { message: 'limit.tooLow' })
  @Max(50, { message: 'limit.tooHigh' })
  limit?: number = 12;
}