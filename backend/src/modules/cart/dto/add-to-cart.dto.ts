import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'ID del producto a agregar al carrito',
    example: 'clrk123456789'
  })
  @IsString()
  @IsNotEmpty()
  productId: string;
}