import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ProductCategory, Difficulty, ProductStatus } from '@prisma/client';

export class ProductFiltersDto {
  @ApiPropertyOptional({
    description: 'Búsqueda en título y descripción',
    example: 'mesa comedor',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría',
    enum: ProductCategory,
  })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @ApiPropertyOptional({
    description: 'Filtrar por dificultad',
    enum: Difficulty,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Precio mínimo',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  priceMin?: number;

  @ApiPropertyOptional({
    description: 'Precio máximo',
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Max(1000)
  @Transform(({ value }) => parseFloat(value))
  priceMax?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por tags',
    example: ['mesa', 'moderno'],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Ordenar por',
    enum: ['newest', 'oldest', 'popular', 'rating', 'price_asc', 'price_desc'],
    default: 'newest',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'oldest' | 'popular' | 'rating' | 'price_asc' | 'price_desc' = 'newest';

  @ApiPropertyOptional({
    description: 'Número de página',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página',
    minimum: 1,
    maximum: 50,
    default: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value) || 12)
  limit?: number = 12;

  @ApiPropertyOptional({
    description: 'Filtrar por estado (solo admin)',
    enum: ProductStatus,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}