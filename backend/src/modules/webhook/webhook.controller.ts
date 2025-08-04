// backend/src/modules/webhook/webhook.controller.ts - CORREGIDO
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

  /**
   * 🆕 PayPal Webhook Handler - CORREGIDO
   */
  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'PayPal webhook endpoint',
    description: 'Handles PayPal webhook events'
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook' })
  async handlePayPalWebhook(
    @Request() req: RawBodyRequest<Request>,
    @Headers() headers: any
  ): Promise<{ received: boolean; error?: string }> {
    
    if (!req.rawBody) {
      this.logger.error('Missing PayPal webhook body');
      throw new BadRequestException('Missing request body');
    }

    this.logger.log('Received PayPal webhook', {
      bodySize: req.rawBody.length,
      contentType: headers['content-type']
    });

    try {
      // ✅ CORREGIDO: Parsear el body correctamente
      let webhookBody: any;
      
      try {
        // Convertir el raw body a string y luego parsearlo
        const bodyString = req.rawBody.toString('utf8');
        webhookBody = JSON.parse(bodyString);
      } catch (parseError) {
        this.logger.error('Failed to parse PayPal webhook body', {
          error: parseError.message,
          bodyPreview: req.rawBody.toString('utf8').substring(0, 200)
        });
        throw new BadRequestException('Invalid JSON in webhook body');
      }

      // ✅ AHORA SÍ podemos acceder a las propiedades
      const eventType = webhookBody.event_type;
      
      if (eventType) {
        this.logger.log(`Processing PayPal event: ${eventType}`);
        
        // Procesar según el tipo de evento
        switch (eventType) {
          case 'CHECKOUT.ORDER.COMPLETED':
            this.logger.log(`PayPal order completed: ${webhookBody.resource?.id}`);
            // TODO: Procesar orden completada
            break;
            
          case 'PAYMENT.CAPTURE.COMPLETED':
            this.logger.log(`PayPal payment captured: ${webhookBody.resource?.id}`);
            // TODO: Procesar captura de pago
            break;
            
          case 'PAYMENT.CAPTURE.DENIED':
            this.logger.warn(`PayPal payment denied: ${webhookBody.resource?.id}`);
            // TODO: Procesar pago denegado
            break;
            
          default:
            this.logger.log(`Unhandled PayPal event: ${eventType}`);
        }
      } else {
        this.logger.warn('PayPal webhook missing event_type');
      }
      
      return { received: true };
      
    } catch (error) {
      this.logger.error('PayPal webhook processing failed', {
        error: error.message,
        stack: error.stack
      });

      // Para PayPal también retornamos 200 en errores internos
      if (error instanceof BadRequestException) {
        throw error;
      }

      return { 
        received: false, 
        error: error.message 
      };
    }
  }
}