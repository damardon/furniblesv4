// src/modules/analytics/analytics.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { NotificationModule } from '../notifications/notifications.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UsersModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => ReviewsModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => TransactionsModule),
    forwardRef(() => ProductsModule),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}