// backend/src/modules/products/dto/product-filters.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsNumber, IsArray, Min, Max, IsBoolean } from 'class-validator';
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
    enum: ['newest', 'oldest', 'popular', 'rating', 'price_asc', 'price_desc', 'createdAt', 'publishedAt'],
    default: 'newest',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'oldest' | 'popular' | 'rating' | 'price_asc' | 'price_desc' | 'createdAt' | 'publishedAt' = 'newest';

  // ✅ AGREGAR estas propiedades nuevas:

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Filtrar solo productos destacados',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  featured?: boolean;

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