// src/modules/products/dto/product-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory, Difficulty, ProductStatus } from '@prisma/client';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: ProductCategory })
  category: ProductCategory;

  @ApiProperty({ enum: Difficulty })
  difficulty: Difficulty;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  downloadCount: number;

  @ApiProperty()
  favoriteCount: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  reviewCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  publishedAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedProductsDto {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  hasPrev: boolean;
}