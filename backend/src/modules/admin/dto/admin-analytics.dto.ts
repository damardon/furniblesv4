import { IsOptional, IsString, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ProductCategory } from '@prisma/client';

export class AdminAnalyticsFiltersDto {
  @ApiProperty({ 
    description: 'Filtrar por país específico',
    required: false,
    example: 'AR' 
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ 
    description: 'Fecha de inicio (ISO string)',
    required: false,
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ 
    description: 'Fecha de fin (ISO string)',
    required: false,
    example: '2025-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({ 
    description: 'Filtrar por categoría de producto',
    enum: ProductCategory,
    required: false 
  })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @ApiProperty({ 
    description: 'Período de agrupación',
    enum: ['day', 'week', 'month', 'year'],
    required: false,
    default: 'month'
  })
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month' | 'year';

  @ApiProperty({ 
    description: 'Límite de resultados',
    required: false,
    default: 100 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 100;
}