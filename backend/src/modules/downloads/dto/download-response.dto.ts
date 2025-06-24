import { ApiProperty } from '@nestjs/swagger';

export class DownloadTokenDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productTitle: string;

  @ApiProperty()
  downloadUrl: string;

  @ApiProperty()
  downloadLimit: number;

  @ApiProperty()
  downloadCount: number;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  lastDownloadAt?: Date;
}

export class DownloadResponseDto {
  @ApiProperty({ type: [DownloadTokenDto] })
  downloads: DownloadTokenDto[];

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  totalDownloads: number;
}