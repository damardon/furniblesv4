import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { ProductCategory, Difficulty } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({
    description: 'Título del producto',
    example: 'Mesa de Comedor Moderna',
    minLength: 10,
    maxLength: 100,
  })
  @IsString()
  @MinLength(10, { message: 'auth.validation.title_min_length' })
  @MaxLength(100, { message: 'auth.validation.title_max_length' })
  title: string;

  @ApiProperty({
    description: 'Descripción detallada del producto',
    example: 'Plano detallado para construir una elegante mesa de comedor...',
    minLength: 50,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(50, { message: 'auth.validation.description_min_length' })
  @MaxLength(2000, { message: 'auth.validation.description_max_length' })
  description: string;

  @ApiProperty({
    description: 'Precio del producto en USD',
    example: 5.00,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber({}, { message: 'auth.validation.price_number' })
  @Min(1, { message: 'auth.validation.price_min' })
  @Max(100, { message: 'auth.validation.price_max' })
  price: number = 5.00;

  @ApiProperty({
    description: 'Categoría del producto',
    enum: ProductCategory,
    example: ProductCategory.LIVING_DINING,
  })
  @IsEnum(ProductCategory, { message: 'auth.validation.invalid_category' })
  category: ProductCategory;

  @ApiProperty({
    description: 'Nivel de dificultad',
    enum: Difficulty,
    example: Difficulty.INTERMEDIATE,
  })
  @IsEnum(Difficulty, { message: 'auth.validation.invalid_difficulty' })
  difficulty: Difficulty;

  @ApiProperty({
    description: 'Tags del producto',
    example: ['mesa', 'comedor', 'madera', 'moderno'],
    maxItems: 10,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'auth.validation.tags_max_size' })
  @Transform(({ value }) => value?.map((tag: string) => tag.toLowerCase().trim()))
  tags?: string[];

  @ApiProperty({
    description: 'Tiempo estimado de construcción',
    example: '4-6 horas',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  estimatedTime?: string;

  @ApiProperty({
    description: 'Herramientas requeridas',
    example: ['sierra', 'taladro', 'lijadora'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  toolsRequired?: string[];

  @ApiProperty({
    description: 'Materiales necesarios',
    example: ['madera de roble', 'tornillos', 'barniz'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  materials?: string[];

  @ApiProperty({
    description: 'Dimensiones del mueble',
    example: '120cm x 80cm x 75cm',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dimensions?: string;

  @ApiProperty({
    description: 'Especificaciones adicionales en JSON',
    required: false,
  })
  @IsOptional()
  specifications?: any;
}