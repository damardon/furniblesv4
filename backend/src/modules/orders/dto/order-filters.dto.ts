import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class OrderFiltersDto {
  @ApiProperty({
    description: 'Filtrar por estado de orden',
    enum: OrderStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({
    description: 'Filtrar desde fecha (ISO string)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({
    description: 'Filtrar hasta fecha (ISO string)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({
    description: 'Buscar por número de orden o email',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  // ✅ NUEVOS CAMPOS PARA ORDENAMIENTO:
  @ApiProperty({
    description: 'Campo por el cual ordenar',
    enum: ['createdAt', 'updatedAt', 'totalAmount', 'status', 'orderNumber'],
    default: 'createdAt',
    required: false
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount' | 'status' | 'orderNumber' = 'createdAt';

  @ApiProperty({
    description: 'Dirección del ordenamiento',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: 'Página',
    default: 1,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({
    description: 'Elementos por página',
    default: 10,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}