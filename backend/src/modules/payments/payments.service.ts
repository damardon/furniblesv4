// src/modules/payments/payments.service.ts
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { SellerOnboardingDto } from './dto/seller-onboarding.dto';
import { PaymentSetupDto } from './dto/payment-setup.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 🆕 Configurar pagos para un seller
   */
  async setupSellerPayments(userId: string, dto: SellerOnboardingDto) {
    try {
      this.logger.log(`Setting up payments for seller ${userId}`);

      // 1. Verificar que el usuario sea seller
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
      });

      if (!user || !user.sellerProfile) {
        throw new BadRequestException('User is not a seller');
      }

      // 2. Verificar si ya tiene cuenta de Stripe
      if (user.stripeConnectId) {
        throw new BadRequestException('Seller already has Stripe Connect account');
      }

      // 3. Crear cuenta de Stripe Connect
      const stripeAccount = await this.stripeService.createConnectAccount({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        country: dto.country,
        businessType: dto.businessType,
        phone: dto.phone,
      });
      

      // 4. Actualizar usuario con ID de Stripe
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          stripeConnectId: stripeAccount.id,
          onboardingComplete: false,
          payoutsEnabled: false,
          chargesEnabled: false,
        },
      });

      // 5. Generar link de onboarding
      const accountLink = await this.stripeService.createAccountLink(stripeAccount.id);

      // 6. Registrar en logs para seguimiento
      this.logger.log(`Stripe Connect account created: ${stripeAccount.id} for user ${userId}`);

      return {
        accountId: stripeAccount.id,
        onboardingUrl: accountLink.url,
        expiresAt: new Date(accountLink.expires_at * 1000),
        setupComplete: false,
      };
    } catch (error) {
      this.logger.error(`Failed to setup seller payments: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener configuración de pagos del seller
   */
  async getSellerPaymentSetup(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          stripeConnectId: true,
          onboardingComplete: true,
          chargesEnabled: true,
          payoutsEnabled: true,
        },
      });

      if (!user || !user.stripeConnectId) {
        return null;
      }

      // Obtener estado actual de la cuenta de Stripe
      const account = await this.stripeService.retrieveAccount(user.stripeConnectId);

      return {
        stripeConnectId: user.stripeConnectId,
        onboardingComplete: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requiresAction: account.requirements?.currently_due?.length > 0,
        nextAction: account.requirements?.currently_due?.[0] || null,
      };
    } catch (error) {
      this.logger.error(`Failed to get seller payment setup: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Configurar preferencias de pago
   */
  async configureSellerPayments(userId: string, dto: PaymentSetupDto) {
    try {
      this.logger.log(`Configuring payments for seller ${userId}`);

      // Verificar que el seller tenga cuenta de Stripe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { stripeConnectId: true },
      });

      if (!user?.stripeConnectId) {
        throw new BadRequestException('Seller does not have Stripe Connect account');
      }

      // TODO: Implementar configuración de preferencias
      // Por ahora solo guardamos las preferencias básicas
      
      return {
        automaticPayouts: dto.automaticPayouts ?? true,
        payoutSchedule: dto.payoutSchedule ?? 'weekly',
        minimumPayoutAmount: dto.minimumPayoutAmount ?? 25,
        currency: dto.currency ?? 'USD',
        instantPayouts: dto.instantPayouts ?? false,
        emailNotifications: dto.emailNotifications ?? true,
        smsNotifications: dto.smsNotifications ?? false,
      };
    } catch (error) {
      this.logger.error(`Failed to configure payments: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener balance del seller
   */
  async getSellerBalance(userId: string) {
    try {
      this.logger.log(`Getting balance for seller ${userId}`);

      // Obtener cuenta de Stripe del seller
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { stripeConnectId: true },
      });

      if (!user?.stripeConnectId) {
        throw new BadRequestException('Seller does not have Stripe Connect account');
      }

      // Obtener balance de Stripe
      const balance = await this.stripeService.getAccountBalance(user.stripeConnectId);

      // Formatear datos para respuesta
      const formattedBalance = {
        available: balance.available.map(b => ({
          amount: b.amount / 100, // Convertir de centavos a dólares
          currency: b.currency.toUpperCase(),
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount / 100,
          currency: b.currency.toUpperCase(),
        })),
        connectReserved: balance.connect_reserved?.map(b => ({
          amount: b.amount / 100,
          currency: b.currency.toUpperCase(),
        })) || [],
      };

      return formattedBalance;
    } catch (error) {
      this.logger.error(`Failed to get seller balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Solicitar payout para seller
   */
  async requestSellerPayout(userId: string, amount?: number, currency: string = 'USD') {
    try {
      this.logger.log(`Processing payout request for seller ${userId}`);

      // Obtener cuenta de Stripe del seller
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { stripeConnectId: true },
      });

      if (!user?.stripeConnectId) {
        throw new BadRequestException('Seller does not have Stripe Connect account');
      }

      // Verificar que la cuenta puede recibir payouts
      const canReceivePayouts = await this.stripeService.isAccountReadyForPayments(user.stripeConnectId);
      if (!canReceivePayouts) {
        throw new BadRequestException('Account is not ready to receive payouts');
      }

      // Si no se especifica amount, usar todo el balance disponible
      let payoutAmount = amount;
      if (!payoutAmount) {
        const balance = await this.stripeService.getAccountBalance(user.stripeConnectId);
        const availableInCurrency = balance.available.find(b => b.currency === currency.toLowerCase());
        if (!availableInCurrency || availableInCurrency.amount < 100) {
          throw new BadRequestException('Insufficient balance for payout');
        }
        payoutAmount = availableInCurrency.amount / 100; // Convertir a dólares
      }

      // Crear payout en Stripe
      const payout = await this.stripeService.createPayout({
        amount: payoutAmount,
        currency,
        stripeAccountId: user.stripeConnectId,
        method: 'standard',
      });

      // Registrar payout en base de datos
      const payoutRecord = await this.prisma.payout.create({
        data: {
          sellerId: userId,
          amount: payoutAmount,
          currency,
          status: 'PENDING',
          stripePayoutId: payout.id,
          description: `Manual payout request`,
          requestedAt: new Date(),
        },
      });

      return {
        payoutId: payoutRecord.id,
        stripePayoutId: payout.id,
        amount: payoutAmount,
        currency,
        status: payout.status,
        estimatedArrival: new Date(payout.arrival_date * 1000),
      };
    } catch (error) {
      this.logger.error(`Failed to request payout: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener historial de payouts del seller
   */
  async getSellerPayoutHistory(userId: string, options: { limit?: number; startingAfter?: string } = {}) {
    try {
      this.logger.log(`Getting payout history for seller ${userId}`);

      // Obtener payouts de la base de datos
      const payouts = await this.prisma.payout.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 20,
        ...(options.startingAfter && {
          cursor: { id: options.startingAfter },
          skip: 1,
        }),
      });

      // Obtener también de Stripe para datos más actualizados
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { stripeConnectId: true },
      });

      if (user?.stripeConnectId) {
        const stripePayouts = await this.stripeService.listPayouts(
          user.stripeConnectId,
          options.limit || 20
        );

        // Combinar datos de Stripe con nuestros registros
        const combinedData = payouts.map(payout => {
          const stripePayout = stripePayouts.data.find(sp => sp.id === payout.stripePayoutId);
          return {
            id: payout.id,
            amount: payout.amount,
            currency: payout.currency,
            status: payout.status,
            requestedAt: payout.requestedAt,
            processedAt: payout.processedAt,
            description: payout.description,
            stripeData: stripePayout ? {
              arrivalDate: new Date(stripePayout.arrival_date * 1000),
              method: stripePayout.method,
              type: stripePayout.type,
            } : null,
          };
        });

        return {
          data: combinedData,
          hasMore: stripePayouts.has_more,
        };
      }

      return {
        data: payouts,
        hasMore: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get payout history: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Generar link del dashboard de Stripe
   */
  async generateStripeDashboardLink(userId: string) {
    try {
      this.logger.log(`Generating dashboard link for seller ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { stripeConnectId: true },
      });

      if (!user?.stripeConnectId) {
        throw new BadRequestException('Seller does not have Stripe Connect account');
      }

      const loginLink = await this.stripeService.createLoginLink(user.stripeConnectId);

      return {
        url: loginLink.url,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      };
    } catch (error) {
      this.logger.error(`Failed to generate dashboard link: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener estado detallado de la cuenta
   */
  async getSellerAccountStatus(userId: string) {
    try {
      this.logger.log(`Getting account status for seller ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { stripeConnectId: true },
      });

      if (!user?.stripeConnectId) {
        throw new NotFoundException('Seller does not have Stripe Connect account');
      }

      const account = await this.stripeService.retrieveAccount(user.stripeConnectId);

      return {
        accountId: account.id,
        email: account.email,
        country: account.country,
        currency: account.default_currency,
        businessType: account.business_type,
        
        // Estados principales
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        
        // Capacidades
        capabilities: {
          cardPayments: account.capabilities?.card_payments,
          transfers: account.capabilities?.transfers,
        },
        
        // Requerimientos
        requirements: {
          currentlyDue: account.requirements?.currently_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
          pastDue: account.requirements?.past_due || [],
          pendingVerification: account.requirements?.pending_verification || [],
        },
        
        // Configuración de payouts
        payouts: {
          schedule: account.settings?.payouts?.schedule,
          statementDescriptor: account.settings?.payouts?.statement_descriptor,
        },
        
        // Fechas importantes
        created: new Date(account.created * 1000),
      };
    } catch (error) {
      this.logger.error(`Failed to get account status: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Estadísticas de pagos para admin
   */
  async getPaymentStatistics() {
    try {
      this.logger.log('Getting payment statistics for admin');

      // Obtener estadísticas de sellers
      const totalSellers = await this.prisma.user.count({
        where: { 
          role: 'SELLER',
          stripeConnectId: { not: null },
        },
      });

      const activeSellers = await this.prisma.user.count({
        where: { 
          role: 'SELLER',
          stripeConnectId: { not: null },
          payoutsEnabled: true,
        },
      });

      // Obtener estadísticas de payouts (últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentPayouts = await this.prisma.payout.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      const totalPayouts = recentPayouts.length;
      const totalPayoutAmount = recentPayouts.reduce((sum, payout) => sum + Number(payout.amount), 0);

      // Obtener estadísticas de transacciones
      const recentTransactions = await this.prisma.transaction.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          type: 'SALE',
        },
      });

      return {
        sellers: {
          total: totalSellers,
          active: activeSellers,
          pendingOnboarding: totalSellers - activeSellers,
        },
        payouts: {
          count: totalPayouts,
          totalAmount: totalPayoutAmount,
          averageAmount: totalPayouts > 0 ? totalPayoutAmount / totalPayouts : 0,
        },
        transactions: {
          recentSales: recentTransactions,
        },
        period: {
          from: thirtyDaysAgo,
          to: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get payment statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Procesar webhook de actualización de cuenta
   */
  async processAccountUpdated(accountId: string, accountData: any) {
    try {
      this.logger.log(`Processing account update for ${accountId}`);

      // Actualizar datos del usuario en nuestra base de datos
      await this.prisma.user.updateMany({
        where: { stripeConnectId: accountId },
        data: {
          onboardingComplete: accountData.details_submitted,
          chargesEnabled: accountData.charges_enabled,
          payoutsEnabled: accountData.payouts_enabled,
        },
      });

      this.logger.log(`Account ${accountId} updated successfully`);
    } catch (error) {
      this.logger.error(`Failed to process account update: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Procesar webhook de payout completado
   */
  async processPayoutCompleted(payoutData: any) {
    try {
      this.logger.log(`Processing payout completion for ${payoutData.id}`);

      // Actualizar estado del payout en nuestra base de datos
      await this.prisma.payout.updateMany({
        where: { stripePayoutId: payoutData.id },
        data: {
          status: 'PAID',
          processedAt: new Date(),
        },
      });

      // TODO: Enviar notificación al seller
      
      this.logger.log(`Payout ${payoutData.id} marked as completed`);
    } catch (error) {
      this.logger.error(`Failed to process payout completion: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Procesar webhook de payout fallido
   */
  async processPayoutFailed(payoutData: any) {
    try {
      this.logger.log(`Processing payout failure for ${payoutData.id}`);

      // Actualizar estado del payout en nuestra base de datos
      await this.prisma.payout.updateMany({
        where: { stripePayoutId: payoutData.id },
        data: {
          status: 'FAILED',
          failureReason: payoutData.failure_message || 'Unknown error',
        },
      });

      // TODO: Enviar notificación de error al seller
      
      this.logger.log(`Payout ${payoutData.id} marked as failed`);
    } catch (error) {
      this.logger.error(`Failed to process payout failure: ${error.message}`);
      throw error;
    }
  }
}