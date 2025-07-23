import { IsString, IsEmail, IsOptional, IsObject, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'
import { IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer';

export class FeeBreakdownItemDto {
  @ApiProperty({
    description: 'Tipo de comisión',
    example: 'PLATFORM_FEE',
    enum: ['PLATFORM_FEE', 'STRIPE_FEE', 'SELLER_AMOUNT', 'TAX']
  })
  @IsString()
  type: string

  @ApiProperty({
    description: 'Descripción de la comisión',
    example: 'Platform commission (10%)'
  })
  @IsString()
  description: string

  @ApiProperty({
    description: 'Monto de la comisión',
    example: 2.50
  })
  @IsNumber()
  amount: number

  @ApiProperty({
    description: 'Porcentaje aplicado (opcional)',
    example: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  percentage?: number

  @ApiProperty({
    description: 'ID del vendedor (opcional)',
    example: 'seller_123',
    required: false
  })
  @IsOptional()
  @IsString()
  sellerId?: string
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Email del comprador para envío de archivos',
    example: 'buyer@example.com'
  })
  @IsEmail()
  buyerEmail: string;

  @ApiProperty({
    description: 'Datos de facturación (opcional)',
    required: false
  })
  @IsOptional()
  @IsObject()
  billingData?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };

  @ApiProperty({
    description: 'Metadata adicional (opcional)',
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Desglose detallado de comisiones y tarifas',
    type: [FeeBreakdownItemDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeBreakdownItemDto)
  feeBreakdown?: FeeBreakdownItemDto[];
}
