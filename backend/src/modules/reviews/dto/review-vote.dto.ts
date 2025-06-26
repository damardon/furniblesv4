// src/modules/reviews/dto/review-vote.dto.ts
import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReviewHelpfulness } from '@prisma/client';

export class VoteReviewDto {
  @ApiProperty({
    description: 'Vote type',
    enum: ReviewHelpfulness,
    example: 'HELPFUL'
  })
  @IsNotEmpty({ message: 'vote.required' })
  @IsIn(['HELPFUL', 'NOT_HELPFUL'], { message: 'vote.invalid' })
  vote: ReviewHelpfulness;
}