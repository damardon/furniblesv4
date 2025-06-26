import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

// 🔄 Interfaces existentes (mantenidas)
interface CreateCheckoutSessionDto {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

// 🆕 Nuevas interfaces para Stripe Connect
interface CreateConnectAccountDto {
  email: string;
  country: string;
  firstName: string;
  lastName: string;
  businessType?: 'individual' | 'company';
  phone?: string;
}

interface CreateCheckoutSessionWithSplitDto extends CreateCheckoutSessionDto {
  sellerId: string;
  sellerAmount: number;
  platformFeeAmount: number;
  transferGroup?: string;
}

interface CreateTransferDto {
  amount: number;
  currency: string;
  destination: string; // Stripe Connect account ID
  transferGroup?: string;
  metadata?: Record<string, string>;
}

interface CreatePayoutDto {
  amount: number;
  currency: string;
  stripeAccountId: string;
  method?: 'instant' | 'standard';
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private readonly configService: ConfigService,
  ) {}

  // ============================================
  // 🔄 MÉTODOS EXISTENTES (SIN CAMBIOS)
  // ============================================

  /**
   * Crear sesión de Stripe Checkout
   */
  async createCheckoutSession(params: CreateCheckoutSessionDto): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: `Orden ${params.orderNumber}`,
              description: 'Productos digitales de Furnibles',
            },
            unit_amount: Math.round(params.amount * 100), // Convertir a centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: params.customerEmail,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        orderId: params.orderId,
        ...params.metadata,
      },
      payment_intent_data: {
        metadata: {
          orderId: params.orderId,
        },
      },
    });
  }

  /**
   * Recuperar Payment Intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Crear reembolso
   */
  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  }

  /**
   * Verificar webhook signature
   */
  verifyWebhookSignature(payload: Buffer, signature: string): Stripe.Event {
    const endpointSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  }

  // ============================================
  // 🆕 NUEVOS MÉTODOS PARA STRIPE CONNECT
  // ============================================

  /**
   * 🆕 Crear Stripe Connect Account para seller
   */
  async createConnectAccount(params: CreateConnectAccountDto): Promise<Stripe.Account> {
    try {
      this.logger.log(`Creating Connect account for ${params.email}`);
      
      return await this.stripe.accounts.create({
        type: 'express',
        country: params.country,
        email: params.email,
        business_type: params.businessType || 'individual',
        individual: {
          first_name: params.firstName,
          last_name: params.lastName,
          email: params.email,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        settings: {
          payouts: {
            schedule: {
              interval: this.configService.get('PAYOUT_SCHEDULE', 'weekly'),
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create Connect account: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Generar onboarding link para Connect account
   */
  async createAccountLink(accountId: string): Promise<Stripe.AccountLink> {
    try {
      const refreshUrl = this.configService.get('STRIPE_CONNECT_REFRESH_URL');
      const returnUrl = this.configService.get('STRIPE_CONNECT_RETURN_URL');

      return await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
    } catch (error) {
      this.logger.error(`Failed to create account link: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Recuperar información de Connect account
   */
  async retrieveAccount(accountId: string): Promise<Stripe.Account> {
    try {
      return await this.stripe.accounts.retrieve(accountId);
    } catch (error) {
      this.logger.error(`Failed to retrieve account ${accountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Crear checkout session con split payment
   */
  async createCheckoutSessionWithSplit(params: CreateCheckoutSessionWithSplitDto): Promise<Stripe.Checkout.Session> {
    try {
      this.logger.log(`Creating split payment session for order ${params.orderNumber}`);
      
      return await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: params.currency,
              product_data: {
                name: `Orden ${params.orderNumber}`,
                description: 'Productos digitales de Furnibles',
              },
              unit_amount: Math.round(params.amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: params.customerEmail,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          orderId: params.orderId,
          sellerId: params.sellerId,
          splitPayment: 'true',
          ...params.metadata,
        },
        payment_intent_data: {
          application_fee_amount: Math.round(params.platformFeeAmount * 100),
          transfer_data: {
            destination: params.sellerId, // Stripe Connect account ID
          },
          transfer_group: params.transferGroup,
          metadata: {
            orderId: params.orderId,
            sellerId: params.sellerId,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create split payment session: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Crear transfer manual a seller
   */
  async createTransfer(params: CreateTransferDto): Promise<Stripe.Transfer> {
    try {
      this.logger.log(`Creating transfer of ${params.amount} to ${params.destination}`);
      
      return await this.stripe.transfers.create({
        amount: Math.round(params.amount * 100),
        currency: params.currency,
        destination: params.destination,
        transfer_group: params.transferGroup,
        metadata: params.metadata,
      });
    } catch (error) {
      this.logger.error(`Failed to create transfer: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Crear payout instantáneo para seller
   */
  async createPayout(params: CreatePayoutDto): Promise<Stripe.Payout> {
    try {
      this.logger.log(`Creating payout of ${params.amount} for account ${params.stripeAccountId}`);
      
      return await this.stripe.payouts.create(
        {
          amount: Math.round(params.amount * 100),
          currency: params.currency,
          method: params.method || 'standard',
        },
        {
          stripeAccount: params.stripeAccountId,
        }
      );
    } catch (error) {
      this.logger.error(`Failed to create payout: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener balance de Connect account
   */
  async getAccountBalance(accountId: string): Promise<Stripe.Balance> {
    try {
      return await this.stripe.balance.retrieve({
        stripeAccount: accountId,
      });
    } catch (error) {
      this.logger.error(`Failed to get balance for account ${accountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Listar transfers de una cuenta
   */
  async listTransfers(accountId?: string, limit: number = 20): Promise<Stripe.ApiList<Stripe.Transfer>> {
    try {
      const params: Stripe.TransferListParams = {
        limit,
      };

      if (accountId) {
        params.destination = accountId;
      }

      return await this.stripe.transfers.list(params);
    } catch (error) {
      this.logger.error(`Failed to list transfers: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Listar payouts de una cuenta
   */
  async listPayouts(accountId: string, limit: number = 20): Promise<Stripe.ApiList<Stripe.Payout>> {
    try {
      return await this.stripe.payouts.list(
        { limit },
        { stripeAccount: accountId }
      );
    } catch (error) {
      this.logger.error(`Failed to list payouts for account ${accountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Crear reembolso con split payment
   */
  async createRefundWithSplit(paymentIntentId: string, amount?: number, reverseTransfer: boolean = true): Promise<Stripe.Refund> {
    try {
      this.logger.log(`Creating refund for payment intent ${paymentIntentId}`);
      
      return await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reverse_transfer: reverseTransfer,
      });
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Verificar webhook signature para Connect
   */
  verifyConnectWebhookSignature(payload: Buffer, signature: string): Stripe.Event {
    const endpointSecret = this.configService.get('STRIPE_CONNECT_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  }

  /**
   * 🆕 Obtener capabilities de una cuenta
   */
  async getAccountCapabilities(accountId: string): Promise<Stripe.Account> {
    try {
      return await this.stripe.accounts.retrieve(accountId);
    } catch (error) {
      this.logger.error(`Failed to get capabilities for account ${accountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Verificar si cuenta puede recibir pagos
   */
  async isAccountReadyForPayments(accountId: string): Promise<boolean> {
    try {
      const account = await this.retrieveAccount(accountId);
      return (
        account.charges_enabled &&
        account.payouts_enabled &&
        account.details_submitted
      );
    } catch (error) {
      this.logger.error(`Failed to check account readiness: ${error.message}`);
      return false;
    }
  }

  /**
   * 🆕 Obtener link de dashboard para seller
   */
  async createLoginLink(accountId: string): Promise<Stripe.LoginLink> {
    try {
      return await this.stripe.accounts.createLoginLink(accountId);
    } catch (error) {
      this.logger.error(`Failed to create login link for account ${accountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Listar transacciones de una cuenta
   */
  async listAccountTransactions(
    accountId: string, 
    options: {
      limit?: number;
      starting_after?: string;
      created?: { gte?: number; lte?: number };
    } = {}
  ): Promise<Stripe.ApiList<Stripe.BalanceTransaction>> {
    try {
      return await this.stripe.balanceTransactions.list(
        {
          limit: options.limit || 20,
          starting_after: options.starting_after,
          created: options.created,
        },
        { stripeAccount: accountId }
      );
    } catch (error) {
      this.logger.error(`Failed to list transactions for account ${accountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Calcular fees de Stripe para una transacción
   */
  calculateStripeFees(amount: number, currency: string = 'USD'): {
    stripeFeePercentage: number;
    stripeFeeFixed: number;
    totalStripeFee: number;
    netAmount: number;
  } {
    const feeRate = parseFloat(this.configService.get('STRIPE_FEE_RATE', '0.029')); // 2.9%
    const feeFixed = parseFloat(this.configService.get('STRIPE_FEE_FIXED', '0.30')); // $0.30

    const stripeFeePercentage = amount * feeRate;
    const stripeFeeFixed = feeFixed;
    const totalStripeFee = stripeFeePercentage + stripeFeeFixed;
    const netAmount = amount - totalStripeFee;

    return {
      stripeFeePercentage,
      stripeFeeFixed,
      totalStripeFee,
      netAmount,
    };
  }
}
