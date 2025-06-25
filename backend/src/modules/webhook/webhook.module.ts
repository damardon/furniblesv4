import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeModule } from '../stripe/stripe.module';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notifications.module';

@Module({
  imports: [
    StripeModule, 
    OrdersModule, 
    PrismaModule,
    NotificationModule
  ],
  controllers: [WebhookController],
  providers: [StripeWebhookService],
  exports: [StripeWebhookService],
})
export class WebhookModule {}
