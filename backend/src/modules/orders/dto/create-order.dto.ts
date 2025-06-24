import { IsString, IsEmail, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
