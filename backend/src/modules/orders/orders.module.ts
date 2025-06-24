// src/modules/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CartModule } from '../cart/cart.module';
import { FeesModule } from '../fees/fees.module';
import { NotificationModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule, 
    CartModule, 
    FeesModule, 
    NotificationModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

