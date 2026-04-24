// src/modules/analytics/analytics.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsQueryService } from './services/analytics-query.service';
import { AnalyticsCalculationService } from './services/analytics-calculation.service';
import { AnalyticsCacheService } from './services/analytics-cache.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { NotificationModule } from '../notifications/notifications.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => UsersModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => ReviewsModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => TransactionsModule),
    forwardRef(() => ProductsModule),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsCalculationService,
    AnalyticsCacheService,
    AnalyticsQueryService,
    AnalyticsService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
