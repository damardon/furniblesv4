import { Module } from '@nestjs/common';
import { AdminAnalyticsModule } from './admin-analytics.module';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    AdminAnalyticsModule,
    OrdersModule, // Para AdminOrdersController
  ],
  controllers: [
    AdminOrdersController, // Mover el controller aquí
  ],
  exports: [
    AdminAnalyticsModule,
  ],
})
export class AdminModule {}