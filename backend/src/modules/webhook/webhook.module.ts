// src/modules/webhook/webhook.module.ts - REEMPLAZAR COMPLETO
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

// src/modules/webhook/webhook.controller.ts - VERIFICAR que esté así
import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Request
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader
} from '@nestjs/swagger';
import { StripeWebhookService } from './stripe-webhook.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Webhook de Stripe',
    description: 'Endpoint para recibir eventos de Stripe (pagos, reembolsos, etc.)'
  })
  @ApiHeader({ 
    name: 'stripe-signature', 
    description: 'Firma de Stripe para validar el webhook' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook procesado exitosamente' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Firma inválida o evento no válido' 
  })
  async handleStripeWebhook(
    @Request() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ): Promise<{ received: boolean }> {
    await this.stripeWebhookService.handleWebhook(req.rawBody, signature);
    return { received: true };
  }
}