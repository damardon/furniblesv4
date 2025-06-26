// src/modules/reviews/dto/review-response.dto.ts
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewResponseDto {
  @ApiProperty({
    description: 'Seller response to the review',
    minLength: 10,
    maxLength: 1000,
    example: 'Thank you for your feedback! We really appreciate...'
  })
  @IsNotEmpty({ message: 'comment.required' })
  @IsString({ message: 'comment.mustBeString' })
  @MinLength(10, { message: 'comment.tooShort' })
  @MaxLength(1000, { message: 'comment.tooLong' })
  comment: string;
}