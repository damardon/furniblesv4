// src/modules/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule, // Corregido: usar PrismaModule en lugar de DatabaseModule
    NotificationModule
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService]
})
export class ReviewsModule {}