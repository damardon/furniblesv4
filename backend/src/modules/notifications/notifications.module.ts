import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule'; // 🆕 Para cron jobs
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    PrismaModule, 
    EmailModule, 
    WebSocketModule,
    // I18nModule removido temporalmente
    ScheduleModule.forRoot() // 🆕 Habilitar cron jobs
  ],
  controllers: [NotificationsController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}