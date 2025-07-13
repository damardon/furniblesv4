import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  DigestFrequency 
} from '@prisma/client';
import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  IsObject, 
  IsDateString,
  IsInt,
  Min,
  Max,
  Matches,
  IsArray
} from 'class-validator';
import { Transform } from 'class-transformer';

// DTO base existente expandido
export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  // 🆕 Nuevos campos para Etapa 10
  @ApiPropertyOptional({ enum: NotificationPriority, default: NotificationPriority.NORMAL })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;
}

// 🆕 DTO para crear notificaciones programadas
export class CreateScheduledNotificationDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsDateString()
  scheduledFor: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  maxAttempts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewId?: string;
}

// 🆕 DTO para preferencias de notificación
export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  webPushEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  orderNotifications?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  paymentNotifications?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  reviewNotifications?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  systemNotifications?: boolean;

  // Configuraciones específicas de reviews
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  reviewReceived?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  reviewResponses?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  reviewHelpfulVotes?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  reviewMilestones?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  reviewReminders?: boolean;

  // Configuraciones de digest
  @ApiPropertyOptional({ enum: DigestFrequency, default: DigestFrequency.WEEKLY })
  @IsOptional()
  @IsEnum(DigestFrequency)
  digestFrequency?: DigestFrequency;

  @ApiPropertyOptional({ minimum: 1, maximum: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  digestDay?: number;

  @ApiPropertyOptional({ pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'digestTime must be in HH:MM format'
  })
  digestTime?: string;

  // Horas de silencio
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @ApiPropertyOptional({ pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'quietHoursStart must be in HH:MM format'
  })
  quietHoursStart?: string;

  @ApiPropertyOptional({ pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'quietHoursEnd must be in HH:MM format'
  })
  quietHoursEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;
}

// 🆕 DTO para filtros de notificaciones
export class FilterNotificationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isRead?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupKey?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// 🆕 DTO para digest de reviews
export class SendReviewDigestDto {
  @ApiProperty()
  @IsString()
  sellerId: string;

  @ApiPropertyOptional({ enum: DigestFrequency, default: DigestFrequency.WEEKLY })
  @IsOptional()
  @IsEnum(DigestFrequency)
  frequency?: DigestFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  forceGenerate?: boolean;
}

// 🆕 DTO para analytics de notificaciones
export class NotificationAnalyticsDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ default: 'day' })
  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month' | 'type' | 'channel';
}

// DTOs de respuesta expandidos
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

  // 🆕 Nuevos campos de respuesta
  @ApiProperty({ enum: NotificationPriority })
  priority: NotificationPriority;

  @ApiProperty({ enum: NotificationChannel })
  channel?: NotificationChannel;

  @ApiProperty()
  groupKey?: string;

  @ApiProperty()
  expiresAt?: Date;

  @ApiProperty()
  clickedAt?: Date;

  @ApiProperty()
  clickCount: number;
}

// 🆕 DTO de respuesta para preferencias
export class NotificationPreferencesResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  emailEnabled: boolean;

  @ApiProperty()
  webPushEnabled: boolean;

  @ApiProperty()
  inAppEnabled: boolean;

  @ApiProperty()
  orderNotifications: boolean;

  @ApiProperty()
  paymentNotifications: boolean;

  @ApiProperty()
  reviewNotifications: boolean;

  @ApiProperty()
  marketingEmails: boolean;

  @ApiProperty()
  systemNotifications: boolean;

  @ApiProperty()
  reviewReceived: boolean;

  @ApiProperty()
  reviewResponses: boolean;

  @ApiProperty()
  reviewHelpfulVotes: boolean;

  @ApiProperty()
  reviewMilestones: boolean;

  @ApiProperty()
  reviewReminders: boolean;

  @ApiProperty({ enum: DigestFrequency })
  digestFrequency: DigestFrequency;

  @ApiProperty()
  digestDay?: number;

  @ApiProperty()
  digestTime?: string;

  @ApiProperty()
  quietHoursEnabled: boolean;

  @ApiProperty()
  quietHoursStart?: string;

  @ApiProperty()
  quietHoursEnd?: string;

  @ApiProperty()
  timezone?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// 🆕 DTO para tracking de engagement
export class TrackEngagementDto {
  @ApiProperty()
  @IsString()
  notificationId: string;

  @ApiProperty({ enum: ['read', 'clicked', 'dismissed'] })
  @IsEnum(['read', 'clicked', 'dismissed'])
  action: 'read' | 'clicked' | 'dismissed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;
}
