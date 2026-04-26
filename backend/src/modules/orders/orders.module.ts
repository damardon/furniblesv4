// src/modules/orders/orders.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CartModule } from '../cart/cart.module';
import { NotificationModule } from '../notifications/notifications.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    PrismaModule,
    CartModule,
    NotificationModule,
    forwardRef(() => ReviewsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
