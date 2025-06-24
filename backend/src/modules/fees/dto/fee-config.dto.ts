import { IsString, IsBoolean, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FeeType, ProductCategory } from '@prisma/client';

export class CreatefeeConfigDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: FeeType })
  @IsEnum(FeeType)
  type: FeeType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ enum: ProductCategory, required: false })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty()
  @IsBoolean()
  isPercentage: boolean;

  @ApiProperty()
  @IsNumber()
  value: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatefeeConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPercentage?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FeeConfigResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: FeeType })
  type: FeeType;

  @ApiProperty()
  country?: string;

  @ApiProperty()
  region?: string;

  @ApiProperty({ enum: ProductCategory })
  category?: ProductCategory;

  @ApiProperty()
  paymentMethod?: string;

  @ApiProperty()
  isPercentage: boolean;

  @ApiProperty()
  value: number;

  @ApiProperty()
  minAmount?: number;

  @ApiProperty()
  maxAmount?: number;

  @ApiProperty()
  priority: number;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}