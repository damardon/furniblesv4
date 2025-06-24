import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: Record<string, any>;

  @ApiProperty({ required: false })
  orderId?: string;
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data?: Record<string, any>;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  readAt?: Date;

  @ApiProperty()
  sentAt?: Date;

  @ApiProperty()
  emailSent: boolean;

  @ApiProperty()
  orderId?: string;

  @ApiProperty()
  createdAt: Date;
}
