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