import { IsArray, IsString, IsNotEmpty, IsNumber, IsPositive, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CartItemSyncDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 'clrk123456789'
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Cantidad del producto (siempre 1 para productos digitales)',
    example: 1
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Precio snapshot del producto en el momento de agregarlo',
    example: 29.99,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  priceSnapshot?: number;
}

export class SyncCartDto {
  @ApiProperty({
    description: 'Items del carrito a sincronizar desde el cliente',
    type: [CartItemSyncDto],
    example: [
      { productId: 'clrk123456789', quantity: 1, priceSnapshot: 29.99 },
      { productId: 'clrk987654321', quantity: 1, priceSnapshot: 15.50 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemSyncDto)
  items: CartItemSyncDto[];
}