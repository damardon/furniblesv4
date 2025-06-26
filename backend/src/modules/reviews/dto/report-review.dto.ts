import { IsNotEmpty, IsString, IsOptional, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportReviewDto {
  @ApiProperty({
    description: 'Reason for reporting',
    enum: ['spam', 'inappropriate', 'fake', 'harassment', 'other'],
    example: 'inappropriate'
  })
  @IsNotEmpty({ message: 'reason.required' })
  @IsIn(['spam', 'inappropriate', 'fake', 'harassment', 'other'], { 
    message: 'reason.invalid' 
  })
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional details about the report',
    maxLength: 500,
    example: 'This review contains offensive language...'
  })
  @IsOptional()
  @IsString({ message: 'details.mustBeString' })
  @MaxLength(500, { message: 'details.tooLong' })
  details?: string;
}