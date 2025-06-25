import {
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Request,
  BadRequestException,
  Logger
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
  private readonly logger = new Logger(WebhookController.name);

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
  ): Promise<{ received: boolean; error?: string }> {
    
    // ✅ NUEVO: Validaciones de entrada
    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      this.logger.error('Missing request body');
      throw new BadRequestException('Missing request body');
    }

    this.logger.log('Received Stripe webhook', {
      bodySize: req.rawBody.length,
      hasSignature: !!signature
    });

    try {
      // ✅ MEJORADO: Mejor manejo de errores
      await this.stripeWebhookService.handleWebhook(req.rawBody, signature);
      
      this.logger.log('Webhook processed successfully');
      return { received: true };
      
    } catch (error) {
      this.logger.error('Webhook processing failed', {
        error: error.message,
        stack: error.stack
      });

      // ✅ NUEVO: Solo lanzar 400 para errores de firma
      if (error.message.includes('signature')) {
        throw new BadRequestException('Invalid webhook signature');
      }

      // ✅ NUEVO: Para errores internos, retornar 200 para evitar retries infinitos de Stripe
      return { 
        received: false, 
        error: error.message 
      };
    }
  }
}