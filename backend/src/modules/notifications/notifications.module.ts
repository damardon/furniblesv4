import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { I18nModule } from 'nestjs-i18n'; // ← AGREGAR

@Module({
  imports: [
    PrismaModule, 
    EmailModule, 
    WebSocketModule,
    I18nModule // ← AGREGAR
  ],
  controllers: [NotificationsController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}