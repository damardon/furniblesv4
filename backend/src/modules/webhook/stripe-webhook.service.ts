// src/modules/stripe/stripe-webhook.service.ts - EXTENSIÓN para Etapa 8

import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

// 🆕 Importar servicios de pagos
import { PaymentsService } from '../payments/services/payments.service';
import { StripeConnectService } from '../payments/services/stripe-connect.service';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private readonly processedEvents = new Set<string>();

  constructor(
    private readonly stripeService: StripeService,
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    // 🆕 Inyectar nuevos servicios
    private readonly paymentsService: PaymentsService,
    private readonly stripeConnectService: StripeConnectService,
  ) {}

  /**
   * Procesar webhook de Stripe - MEJORADO para Etapa 8
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripeService.verifyWebhookSignature(payload, signature);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed`, {
        error: err.message,
        signaturePreview: signature?.substring(0, 20) + '...'
      });
      throw new Error(`Webhook signature verification failed`);
    }

    if (this.processedEvents.has(event.id)) {
      this.logger.warn(`Event ${event.id} already processed, skipping`);
      return;
    }

    this.logger.log(`Processing Stripe webhook`, {
      eventType: event.type,
      eventId: event.id,
      livemode: event.livemode
    });

    try {
      // 🆕 Persistir evento en base de datos para auditoria
      await this.saveWebhookEvent(event);

      switch (event.type) {
        // Eventos existentes
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

        // 🆕 Nuevos eventos para Split Payments
        case 'transfer.created':
          await this.handleTransferCreated(event.data.object as Stripe.Transfer);
          break;

        case 'transfer.updated':
          await this.handleTransferUpdated(event.data.object as Stripe.Transfer);
          break;

        case 'transfer.failed':
          await this.handleTransferFailed(event.data.object as Stripe.Transfer);
          break;

        case 'transfer.reversed':
          await this.handleTransferReversed(event.data.object as Stripe.Transfer);
          break;

        // 🆕 Eventos para suscripciones futuras
        case 'invoice.payment_succeeded':
          this.logger.log(`Invoice payment succeeded: ${event.data.object.id}`);
          break;
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          this.logger.log(`Subscription event: ${event.type}`);
          break;
        
        default:
          this.logger.warn(`Unhandled event type: ${event.type}`);
      }

      this.processedEvents.add(event.id);
      this.cleanupProcessedEvents();

    } catch (error) {
      this.logger.error(`Error processing webhook ${event.type}`, {
        eventId: event.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * 🆕 Procesar webhooks de Stripe Connect
   */
  async handleConnectWebhook(payload: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      // Usar un secret diferente para Connect webhooks
      event = this.stripeService.verifyConnectWebhookSignature(payload, signature);
    } catch (err) {
      this.logger.error(`Connect webhook signature verification failed`, {
        error: err.message,
        signaturePreview: signature?.substring(0, 20) + '...'
      });
      throw new Error(`Connect webhook signature verification failed`);
    }

    if (this.processedEvents.has(event.id)) {
      this.logger.warn(`Connect event ${event.id} already processed, skipping`);
      return;
    }

    this.logger.log(`Processing Stripe Connect webhook`, {
      eventType: event.type,
      eventId: event.id,
      account: event.account,
      livemode: event.livemode
    });

    try {
      await this.saveWebhookEvent(event, event.account);

      switch (event.type) {
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account, event.account);
          break;

        case 'account.external_account.created':
          await this.handleExternalAccountCreated(event.data.object as Stripe.ExternalAccount, event.account);
          break;

        case 'payout.created':
          await this.handlePayoutCreated(event.data.object as Stripe.Payout, event.account);
          break;

        case 'payout.paid':
          await this.handlePayoutPaid(event.data.object as Stripe.Payout, event.account);
          break;

        case 'payout.failed':
          await this.handlePayoutFailed(event.data.object as Stripe.Payout, event.account);
          break;

        case 'payout.canceled':
          await this.handlePayoutCanceled(event.data.object as Stripe.Payout, event.account);
          break;

        default:
          this.logger.warn(`Unhandled Connect event type: ${event.type}`);
      }

      this.processedEvents.add(event.id);
      this.cleanupProcessedEvents();

    } catch (error) {
      this.logger.error(`Error processing Connect webhook ${event.type}`, {
        eventId: event.id,
        account: event.account,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * MEJORADO: Manejar pago exitoso con split payments
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(`Processing payment succeeded`, {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount_received,
        currency: paymentIntent.currency
      });

      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { paymentIntentId: paymentIntent.id },
          include: {
            items: {
              include: {
                product: {
                  include: { seller: true }
                }
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
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'PROCESSING',
            paidAt: new Date(),
            paymentStatus: 'succeeded'
          }
        });
      });

      // 🆕 Procesar split payments después de confirmar el pago
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId) {
        try {
          await this.paymentsService.processSplitPayments(orderId, paymentIntent.id);
          this.logger.log(`Split payments processed for order: ${orderId}`);
        } catch (splitError) {
          this.logger.error(`Split payment failed for order ${orderId}:`, splitError);
          // No fallar el webhook, pero notificar al admin
          await this.notifyAdminOfSplitFailure(orderId, splitError.message);
        }
      }

      // Procesar el pago exitoso a través del OrdersService existente
      await this.ordersService.processPaymentSuccess(paymentIntent.id);

      this.logger.log(`Payment processed successfully for PI: ${paymentIntent.id}`);

    } catch (error) {
      this.logger.error(`Error processing payment success for PI ${paymentIntent.id}`, {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // 🆕 Métodos para manejar eventos de transfers

  private async handleTransferCreated(transfer: Stripe.Transfer): Promise<void> {
    const orderId = transfer.metadata?.orderId;
    
    if (!orderId) {
      this.logger.warn(`Transfer created without orderId: ${transfer.id}`);
      return;
    }

    this.logger.log(`Transfer created: ${transfer.id} for order ${orderId}`);

    await this.prisma.transaction.updateMany({
      where: {
        orderId,
        stripeTransactionId: transfer.id
      },
      data: {
        status: 'COMPLETED'
      }
    });
  }

  private async handleTransferUpdated(transfer: Stripe.Transfer): Promise<void> {
    this.logger.log(`Transfer updated: ${transfer.id}, status: ${transfer.status || 'unknown'}`);
  }

  private async handleTransferFailed(transfer: Stripe.Transfer): Promise<void> {
    const orderId = transfer.metadata?.orderId;
    
    if (!orderId) return;

    this.logger.error(`Transfer failed: ${transfer.id} for order ${orderId}`);

    await this.prisma.$transaction(async (tx) => {
      // Actualizar transacción como fallida
      await tx.transaction.updateMany({
        where: {
          orderId,
          stripeTransactionId: transfer.id
        },
        data: {
          status: 'FAILED'
        }
      });

      // Encontrar seller afectado
      const transaction = await tx.transaction.findFirst({
        where: {
          orderId,
          stripeTransactionId: transfer.id
        },
        include: { seller: true, order: true }
      });

      if (transaction?.seller) {
        await this.notificationService.createNotification({
          userId: transaction.sellerId,
          type: 'TRANSFER_FAILED',
          title: 'Fallo en transferencia de pago',
          message: `Hubo un problema transfiriendo tu pago para la orden ${transaction.order.orderNumber}. Nuestro equipo lo está investigando.`,
          data: {
            orderId,
            transferId: transfer.id,
            amount: Number(transaction.amount)
          }
        });
      }
    });

    // Notificar admin
    await this.notifyAdminOfTransferFailure(transfer.id, orderId);
  }

  private async handleTransferReversed(transfer: Stripe.Transfer): Promise<void> {
    const orderId = transfer.metadata?.orderId;
    
    if (!orderId) return;

    this.logger.warn(`Transfer reversed: ${transfer.id} for order ${orderId}`);

    // Crear transacción de reverso
    await this.prisma.transaction.create({
      data: {
        type: 'REFUND',
        status: 'COMPLETED',
        amount: -(transfer.amount / 100), // Negativo para reverso
        currency: transfer.currency.toUpperCase(),
        orderId,
        stripeTransactionId: `${transfer.id}_reversed`,
        description: `Transfer reversed for order`
      }
    });
  }

  // 🆕 Métodos para manejar eventos de Connect accounts

  private async handleAccountUpdated(account: Stripe.Account, accountId: string): Promise<void> {
    // Delegar al StripeConnectService
    await this.stripeConnectService.handleAccountWebhook({
      type: 'account.updated',
      data: { object: account },
      account: accountId
    } as Stripe.Event);
  }

  private async handleExternalAccountCreated(externalAccount: Stripe.ExternalAccount, accountId: string): Promise<void> {
    await this.stripeConnectService.handleAccountWebhook({
      type: 'account.external_account.created',
      data: { object: externalAccount },
      account: accountId
    } as Stripe.Event);
  }

  // 🆕 Métodos para manejar eventos de payouts

  private async handlePayoutCreated(payout: Stripe.Payout, accountId: string): Promise<void> {
    this.logger.log(`Payout created: ${payout.id} for account ${accountId}`);
    
    // Actualizar estado en base de datos
    await this.prisma.payout.updateMany({
      where: { stripePayoutId: payout.id },
      data: { status: 'PROCESSING' }
    });
  }

  private async handlePayoutPaid(payout: Stripe.Payout, accountId: string): Promise<void> {
    await this.stripeConnectService.handleAccountWebhook({
      type: 'payout.paid',
      data: { object: payout },
      account: accountId
    } as Stripe.Event);
  }

  private async handlePayoutFailed(payout: Stripe.Payout, accountId: string): Promise<void> {
    await this.stripeConnectService.handleAccountWebhook({
      type: 'payout.failed',
      data: { object: payout },
      account: accountId
    } as Stripe.Event);
  }

  private async handlePayoutCanceled(payout: Stripe.Payout, accountId: string): Promise<void> {
    await this.prisma.payout.updateMany({
      where: { stripePayoutId: payout.id },
      data: { 
        status: 'CANCELLED',
        failureReason: 'Payout was cancelled'
      }
    });
  }

  // 🆕 Métodos de utilidad

  private async saveWebhookEvent(event: Stripe.Event, accountId?: string): Promise<void> {
    await this.prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        stripeAccountId: accountId || null,
        eventType: event.type,
        data: event.data.object as any,
        processedAt: new Date()
      }
    });
  }

  private async notifyAdminOfSplitFailure(orderId: string, error: string): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    for (const admin of admins) {
      await this.notificationService.createNotification({
        userId: admin.id,
        type: 'SYSTEM_NOTIFICATION',
        title: 'Error en split payment',
        message: `Fallo en el split payment para la orden ${orderId}: ${error}`,
        data: { orderId, error, type: 'split_payment_failure' }
      });
    }
  }

  private async notifyAdminOfTransferFailure(transferId: string, orderId: string): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    for (const admin of admins) {
      await this.notificationService.createNotification({
        userId: admin.id,
        type: 'SYSTEM_NOTIFICATION',
        title: 'Fallo en transferencia',
        message: `Transfer ${transferId} falló para la orden ${orderId}`,
        data: { transferId, orderId, type: 'transfer_failure' }
      });
    }
  }

  // Métodos existentes permanecen igual...
  
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Implementación existente...
    try {
      this.logger.log(`Processing payment failed`, {
        paymentIntentId: paymentIntent.id,
        errorCode: paymentIntent.last_payment_error?.code,
        errorMessage: paymentIntent.last_payment_error?.message
      });

      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { paymentIntentId: paymentIntent.id },
          include: { buyer: true }
        });

        if (!order) {
          this.logger.warn(`Order not found for failed payment intent: ${paymentIntent.id}`);
          return;
        }

        await tx.order.update({
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
      });

    } catch (error) {
      this.logger.error(`Error processing payment failure for PI ${paymentIntent.id}`, {
        error: error.message,
        stack: error.stack
      });
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    // Implementación existente...
  }

  private async handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
    // Implementación existente...
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Implementación existente...
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    // Implementación existente...
  }

  private cleanupProcessedEvents(): void {
    if (this.processedEvents.size > 1000) {
      const eventsArray = Array.from(this.processedEvents);
      const toDelete = eventsArray.slice(0, 200);
      toDelete.forEach(id => this.processedEvents.delete(id));
      this.logger.log(`Cleaned up ${toDelete.length} old processed events`);
    }
  }

  async getWebhookStats(fromDate?: Date): Promise<any> {
    // Implementación existente...
    const startDate = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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
      avgProcessingTime: this.calculateAvgProcessingTime(orders),
      processedEventsCount: this.processedEvents.size
    };

    return stats;
  }

  private calculateAvgProcessingTime(orders: any[]): number {
    const paidOrders = orders.filter(o => o.paidAt && o.createdAt);
    
    if (paidOrders.length === 0) return 0;

    const totalTime = paidOrders.reduce((sum, order) => {
      const processingTime = new Date(order.paidAt).getTime() - new Date(order.createdAt).getTime();
      return sum + processingTime;
    }, 0);

    return Math.round(totalTime / paidOrders.length / 1000 / 60);
  }
}