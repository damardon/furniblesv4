// src/modules/products/dto/create-product-with-files.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, IsUUID } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class CreateProductWithFilesDto extends CreateProductDto {
  @ApiProperty({
    description: 'ID del archivo PDF subido',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  pdfFileId?: string;

  @ApiProperty({
    description: 'IDs de archivos de imágenes subidas',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  imageFileIds?: string[];
}