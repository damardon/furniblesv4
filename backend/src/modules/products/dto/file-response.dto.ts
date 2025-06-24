// src/modules/files/dto/file-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { FileType, FileStatus } from '@prisma/client'; // 🆕 Usar de Prisma


export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ enum: FileType })
  type: FileType;

  @ApiProperty()
  size: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty({ required: false })
  width?: number;

  @ApiProperty({ required: false })
  height?: number;

  @ApiProperty()
  createdAt: Date;
}

export class FileMetadataDto extends FileResponseDto {
  @ApiProperty()
  checksum: string;

  @ApiProperty()
  metadata: any;

  @ApiProperty({ enum: FileStatus })
  status: FileStatus;

  @ApiProperty()
  uploadedById: string;
}