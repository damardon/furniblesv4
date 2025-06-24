// src/modules/webhook/stripe-webhook.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Procesar webhook de Stripe
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripeService.verifyWebhookSignature(payload, signature);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new Error(`Webhook signature verification failed`);
    }

    this.logger.log(`Received Stripe webhook: ${event.type} - ID: ${event.id}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        
        case 'checkout.session.expired':
          await this.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
          break;
        
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
          break;
        
        case 'invoice.payment_succeeded':
          // Para suscripciones futuras si las implementamos
          this.logger.log(`Invoice payment succeeded: ${event.data.object.id}`);
          break;
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          // Para suscripciones futuras
          this.logger.log(`Subscription event: ${event.type}`);
          break;
        
        default:
          this.logger.warn(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Manejar pago exitoso
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(`Processing payment succeeded: ${paymentIntent.id}`);

      // Buscar orden por Payment Intent ID
      const order = await this.prisma.order.findFirst({
        where: { paymentIntentId: paymentIntent.id },
        include: {
          items: {
            include: {
              product: true
            }
          },
          buyer: true
        }
      });

      if (!order) {
        this.logger.warn(`Order not found for payment intent: ${paymentIntent.id}`);
        return;
      }

      if (order.status !== 'PENDING') {
        this.logger.warn(`Order ${order.id} is not in PENDING status: ${order.status}`);
        return;
      }

      // Actualizar orden a PROCESSING
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PROCESSING',
          paidAt: new Date(),
          paymentStatus: 'succeeded',
          metadata: {
            ...(order.metadata as Record<string, any> || {}),
            paymentProcessed: {
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount_received,
              currency: paymentIntent.currency,
              processedAt: new Date().toISOString()
            }
          }
        }
      });

      // Procesar el pago exitoso a través del OrdersService
      await this.ordersService.processPaymentSuccess(paymentIntent.id);

      this.logger.log(`Payment processed successfully for order: ${order.orderNumber}`);

    } catch (error) {
      this.logger.error(`Error processing payment success for PI ${paymentIntent.id}:`, error);
      throw error;
    }
  }

  /**
   * Manejar pago fallido
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(`Processing payment failed: ${paymentIntent.id}`);

      const order = await this.prisma.order.findFirst({
        where: { paymentIntentId: paymentIntent.id },
        include: { buyer: true }
      });

      if (!order) {
        this.logger.warn(`Order not found for failed payment intent: ${paymentIntent.id}`);
        return;
      }

      // Actualizar orden con información del fallo
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'failed',
          metadata: {
            ...(order.metadata as Record<string, any> || {}),
            paymentFailure: {
              paymentIntentId: paymentIntent.id,
              errorCode: paymentIntent.last_payment_error?.code,
              errorMessage: paymentIntent.last_payment_error?.message,
              declineCode: paymentIntent.last_payment_error?.decline_code,
              failedAt: new Date().toISOString()
            }
          }
        }
      });

      // Notificar al usuario sobre el fallo
      await this.notificationService.createNotification({
        userId: order.buyerId,
        type: 'SYSTEM_NOTIFICATION',
        title: 'Error en el pago',
        message: `Hubo un problema procesando tu pago para la orden ${order.orderNumber}. Por favor, intenta nuevamente.`,
        data: {
          orderId: order.id,
          paymentIntentId: paymentIntent.id,
          errorType: 'payment_failed'
        }
      });

      this.logger.log(`Payment failure processed for order: ${order.orderNumber}`);

    } catch (error) {
      this.logger.error(`Error processing payment failure for PI ${paymentIntent.id}:`, error);
    }
  }

  /**
   * Manejar checkout completado
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      this.logger.log(`Processing checkout completed: ${session.id}`);

      const orderId = session.metadata?.orderId;
      
      if (!orderId) {
        this.logger.warn(`No orderId found in checkout session metadata: ${session.id}`);
        return;
      }

      const order = await this.prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        this.logger.warn(`Order not found for checkout session: ${session.id}`);
        return;
      }

      // Actualizar orden con información de la sesión completada
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentIntentId: session.payment_intent as string,
          paymentStatus: 'completed',
          metadata: {
            ...(order.metadata as Record<string, any> || {}),
            checkoutCompleted: {
              sessionId: session.id,
              paymentStatus: session.payment_status,
              completedAt: new Date().toISOString()
            }
          }
        }
      });

      this.logger.log(`Checkout completion processed for order: ${order.orderNumber}`);

    } catch (error) {
      this.logger.error(`Error processing checkout completion for session ${session.id}:`, error);
    }
  }

  /**
   * Manejar checkout expirado
   */
  private async handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
    try {
      this.logger.log(`Processing checkout expired: ${session.id}`);

      const orderId = session.metadata?.orderId;
      
      if (!orderId) {
        this.logger.warn(`No orderId found in expired checkout session: ${session.id}`);
        return;
      }

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { buyer: true }
      });

      if (!order) {
        this.logger.warn(`Order not found for expired checkout session: ${session.id}`);
        return;
      }

      // Solo cancelar si todavía está pendiente
      if (order.status === 'PENDING') {
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            metadata: {
              ...(order.metadata as Record<string, any> || {}),
              cancellation: {
                reason: 'Checkout session expired',
                sessionId: session.id,
                cancelledAt: new Date().toISOString()
              }
            }
          }
        });

        // Notificar al usuario
        await this.notificationService.createNotification({
          userId: order.buyerId,
          type: 'ORDER_CANCELLED',
          title: 'Orden cancelada por expiración',
          message: `Tu orden ${order.orderNumber} fue cancelada porque la sesión de pago expiró.`,
          data: {
            orderId: order.id,
            reason: 'checkout_expired'
          }
        });

        this.logger.log(`Order cancelled due to checkout expiration: ${order.orderNumber}`);
      }

    } catch (error) {
      this.logger.error(`Error processing checkout expiration for session ${session.id}:`, error);
    }
  }

  /**
   * Manejar pago cancelado
   */
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(`Processing payment canceled: ${paymentIntent.id}`);

      const order = await this.prisma.order.findFirst({
        where: { paymentIntentId: paymentIntent.id },
        include: { buyer: true }
      });

      if (!order) {
        this.logger.warn(`Order not found for canceled payment intent: ${paymentIntent.id}`);
        return;
      }

      // Actualizar orden como cancelada si todavía está pendiente
      if (order.status === 'PENDING') {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            paymentStatus: 'canceled',
            metadata: {
              ...(order.metadata as Record<string, any> || {}),
              cancellation: {
                reason: 'Payment intent canceled',
                paymentIntentId: paymentIntent.id,
                cancelledAt: new Date().toISOString()
              }
            }
          }
        });

        this.logger.log(`Order cancelled due to payment cancellation: ${order.orderNumber}`);
      }

    } catch (error) {
      this.logger.error(`Error processing payment cancellation for PI ${paymentIntent.id}:`, error);
    }
  }

  /**
   * Manejar disputa creada
   */
  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    try {
      this.logger.log(`Processing dispute created: ${dispute.id}`);

      const paymentIntentId = dispute.payment_intent as string;
      
      const order = await this.prisma.order.findFirst({
        where: { paymentIntentId },
        include: { buyer: true }
      });

      if (!order) {
        this.logger.warn(`Order not found for dispute PI: ${paymentIntentId}`);
        return;
      }

      // Actualizar orden como disputada
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'DISPUTED',
          metadata: {
            ...(order.metadata as Record<string, any> || {}),
            dispute: {
              disputeId: dispute.id,
              reason: dispute.reason,
              status: dispute.status,
              amount: dispute.amount,
              currency: dispute.currency,
              createdAt: new Date(dispute.created * 1000).toISOString(),
              evidenceDueBy: dispute.evidence_details?.due_by 
                ? new Date(dispute.evidence_details.due_by * 1000).toISOString() 
                : null
            }
          }
        }
      });

      // Notificar a admins sobre la disputa
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

      for (const admin of admins) {
        await this.notificationService.createNotification({
          userId: admin.id,
          type: 'SYSTEM_NOTIFICATION',
          title: 'Nueva disputa de pago',
          message: `Se ha creado una disputa para la orden ${order.orderNumber}. Motivo: ${dispute.reason}`,
          data: {
            orderId: order.id,
            disputeId: dispute.id,
            disputeReason: dispute.reason,
            disputeAmount: dispute.amount
          }
        });
      }

      this.logger.log(`Dispute processed for order: ${order.orderNumber}`);

    } catch (error) {
      this.logger.error(`Error processing dispute for dispute ${dispute.id}:`, error);
    }
  }

  /**
   * Obtener estadísticas de webhooks para debugging
   */
  async getWebhookStats(fromDate?: Date): Promise<any> {
    const startDate = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 días atrás

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentIntentId: true,
        createdAt: true,
        paidAt: true
      }
    });

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'PENDING').length,
      paidOrders: orders.filter(o => o.status === 'COMPLETED' || o.status === 'PAID').length,
      failedOrders: orders.filter(o => o.paymentStatus === 'failed').length,
      disputedOrders: orders.filter(o => o.status === 'DISPUTED').length,
      cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length,
      avgProcessingTime: this.calculateAvgProcessingTime(orders)
    };

    return stats;
  }

  /**
   * Calcular tiempo promedio de procesamiento
   */
  private calculateAvgProcessingTime(orders: any[]): number {
    const paidOrders = orders.filter(o => o.paidAt && o.createdAt);
    
    if (paidOrders.length === 0) return 0;

    const totalTime = paidOrders.reduce((sum, order) => {
      const processingTime = new Date(order.paidAt).getTime() - new Date(order.createdAt).getTime();
      return sum + processingTime;
    }, 0);

    return Math.round(totalTime / paidOrders.length / 1000 / 60); // en minutos
  }
}