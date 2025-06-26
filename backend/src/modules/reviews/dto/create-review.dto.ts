// src/modules/reviews/dto/create-review.dto.ts
import { 
  IsNotEmpty, 
  IsString, 
  IsInt, 
  Min, 
  Max, 
  IsOptional, 
  MaxLength,
  MinLength,
  IsArray,
  IsUUID
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Order ID for verified purchase',
    example: 'clp1234567890'
  })
  @IsNotEmpty({ message: 'orderId.required' })
  @IsUUID('4', { message: 'orderId.invalid' })
  orderId: string;

  @ApiProperty({
    description: 'Product being reviewed',
    example: 'clp0987654321'
  })
  @IsNotEmpty({ message: 'productId.required' })
  @IsUUID('4', { message: 'productId.invalid' })
  productId: string;

  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    minimum: 1,
    maximum: 5,
    example: 5
  })
  @IsInt({ message: 'rating.mustBeInteger' })
  @Min(1, { message: 'rating.tooLow' })
  @Max(5, { message: 'rating.tooHigh' })
  rating: number;

  @ApiPropertyOptional({
    description: 'Review title',
    maxLength: 100,
    example: 'Great furniture design!'
  })
  @IsOptional()
  @IsString({ message: 'title.mustBeString' })
  @MaxLength(100, { message: 'title.tooLong' })
  title?: string;

  @ApiProperty({
    description: 'Review comment',
    minLength: 10,
    maxLength: 2000,
    example: 'This furniture design exceeded my expectations...'
  })
  @IsNotEmpty({ message: 'comment.required' })
  @IsString({ message: 'comment.mustBeString' })
  @MinLength(10, { message: 'comment.tooShort' })
  @MaxLength(2000, { message: 'comment.tooLong' })
  comment: string;

  @ApiPropertyOptional({
    description: 'Positive aspects (pros)',
    maxLength: 500,
    example: 'Easy to follow instructions, beautiful result'
  })
  @IsOptional()
  @IsString({ message: 'pros.mustBeString' })
  @MaxLength(500, { message: 'pros.tooLong' })
  pros?: string;

  @ApiPropertyOptional({
    description: 'Negative aspects (cons)',
    maxLength: 500,
    example: 'Some measurements could be clearer'
  })
  @IsOptional()
  @IsString({ message: 'cons.mustBeString' })
  @MaxLength(500, { message: 'cons.tooLong' })
  cons?: string;

  @ApiPropertyOptional({
    description: 'Review images (file IDs)',
    type: [String],
    maxItems: 5,
    example: ['clp1111111111', 'clp2222222222']
  })
  @IsOptional()
  @IsArray({ message: 'images.mustBeArray' })
  @IsUUID('4', { each: true, message: 'images.invalidId' })
  images?: string[];
}
