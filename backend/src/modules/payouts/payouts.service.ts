// src/modules/payouts/payouts.service.ts - CORREGIDO
import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { PayoutFilterDto } from './dto/payout-filter.dto';
import { UpdatePayoutDto, PayoutActionDto } from './dto/update-payout.dto';
import { PayoutStatus, UserRole, Prisma } from '@prisma/client';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 🆕 Solicitar payout individual
   */
  async requestPayout(userId: string, dto: RequestPayoutDto) {
    try {
      this.logger.log(`Processing payout request for user ${userId}`);

      // Verificar que el usuario sea seller
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          stripeConnectId: true,
          payoutsEnabled: true,
        },
      });

      if (!user || user.role !== 'SELLER') {
        throw new BadRequestException('User is not a seller');
      }

      if (!user.stripeConnectId) {
        throw new BadRequestException('Seller does not have Stripe Connect account');
      }

      if (!user.payoutsEnabled) {
        throw new BadRequestException('Payouts are not enabled for this seller');
      }

      // Verificar balance disponible
      const balance = await this.stripeService.getAccountBalance(user.stripeConnectId);
      const availableBalance = balance.available.find(b => b.currency === (dto.currency || 'usd').toLowerCase());

      if (!availableBalance || availableBalance.amount < 100) { // Mínimo $1.00
        throw new BadRequestException('Insufficient balance for payout');
      }

      // Determinar amount
      let payoutAmount = dto.amount;
      if (!payoutAmount) {
        payoutAmount = availableBalance.amount / 100; // Todo el balance disponible
      }

      // Verificar mínimo
      const minimumPayout = parseFloat(this.configService.get('MINIMUM_PAYOUT_AMOUNT', '10'));
      if (payoutAmount < minimumPayout && !dto.forceMinimum) {
        throw new BadRequestException(`Minimum payout amount is $${minimumPayout}`);
      }

      // Crear payout en Stripe
      const stripePayout = await this.stripeService.createPayout({
        amount: payoutAmount,
        currency: dto.currency || 'USD',
        stripeAccountId: user.stripeConnectId,
        method: dto.method || 'standard',
      });

      // Registrar en base de datos
      const payout = await this.prisma.payout.create({
        data: {
          sellerId: userId,
          amount: payoutAmount,
          currency: dto.currency || 'USD',
          status: 'PENDING',
          stripePayoutId: stripePayout.id,
          description: dto.description || `${dto.method || 'Standard'} payout`,
          requestedAt: new Date(),
        },
      });

      this.logger.log(`Payout ${payout.id} created successfully for user ${userId}`);

      return {
        id: payout.id,
        stripePayoutId: stripePayout.id,
        amount: payoutAmount,
        currency: dto.currency || 'USD',
        status: payout.status,
        estimatedArrival: new Date(stripePayout.arrival_date * 1000),
        method: dto.method || 'standard',
      };
    } catch (error) {
      this.logger.error(`Failed to request payout: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener payouts del seller
   */
  async getSellerPayouts(userId: string, filters: PayoutFilterDto) {
    try {
      this.logger.log(`Getting payouts for seller ${userId}`);

      const where: Prisma.PayoutWhereInput = {
        sellerId: userId,
      };

      // Aplicar filtros
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.currency) {
        where.currency = filters.currency;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.amount = {};
        if (filters.minAmount !== undefined) {
          where.amount.gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          where.amount.lte = filters.maxAmount;
        }
      }

      if (filters.search) {
        where.description = {
          contains: filters.search,
        };
      }

      // Paginación
      const limit = filters.limit || 20;
      const page = filters.page || 1;
      const skip = (page - 1) * limit;

      // Ordenamiento
      const orderBy: Prisma.PayoutOrderByWithRelationInput = {};
      const sortField = filters.sortBy || 'createdAt';
      orderBy[sortField] = filters.sortOrder || 'desc';

      // Ejecutar consulta
      const [payouts, total] = await Promise.all([
        this.prisma.payout.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            seller: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                sellerProfile: {
                  select: {
                    storeName: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.payout.count({ where }),
      ]);

      return {
        data: payouts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get seller payouts: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener detalles de payout específico
   */
  async getPayoutById(payoutId: string, userId: string, userRole: string) {
    try {
      this.logger.log(`Getting payout ${payoutId} for user ${userId}`);

      const where: Prisma.PayoutWhereUniqueInput = { id: payoutId };

      const payout = await this.prisma.payout.findUnique({
        where,
        include: {
          seller: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              stripeConnectId: true,
              sellerProfile: {
                select: {
                  storeName: true,
                },
              },
            },
          },
          transactions: {
            select: {
              id: true,
              type: true,
              amount: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (!payout) {
        throw new NotFoundException('Payout not found');
      }

      // Solo sellers pueden ver sus propios payouts, admins pueden ver todos
      if (userRole !== 'ADMIN' && payout.sellerId !== userId) {
        throw new NotFoundException('Payout not found');
      }

      return payout;
    } catch (error) {
      this.logger.error(`Failed to get payout: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Actualizar payout (Admin)
   */
  async updatePayout(payoutId: string, dto: UpdatePayoutDto, adminUserId: string) {
    try {
      this.logger.log(`Updating payout ${payoutId} by admin ${adminUserId}`);

      const updateData: Prisma.PayoutUpdateInput = {};

      if (dto.status) {
        updateData.status = dto.status;
      }

      if (dto.description) {
        updateData.description = dto.description;
      }

      if (dto.failureReason) {
        updateData.failureReason = dto.failureReason;
      }

      if (dto.processedAt) {
        updateData.processedAt = new Date(dto.processedAt);
      }

      const updatedPayout = await this.prisma.payout.update({
        where: { id: payoutId },
        data: updateData,
      });

      this.logger.log(`Payout ${payoutId} updated successfully`);

      return updatedPayout;
    } catch (error) {
      this.logger.error(`Failed to update payout: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Ejecutar acción en payout (Admin)
   */
  async executePayoutAction(payoutId: string, dto: PayoutActionDto, adminUserId: string) {
    try {
      this.logger.log(`Executing action ${dto.action} on payout ${payoutId}`);

      const payout = await this.prisma.payout.findUnique({
        where: { id: payoutId },
        include: {
          seller: {
            select: {
              stripeConnectId: true,
            },
          },
        },
      });

      if (!payout) {
        throw new NotFoundException('Payout not found');
      }

      switch (dto.action) {
        case 'cancel':
          if (payout.status !== 'PENDING') {
            throw new BadRequestException('Can only cancel pending payouts');
          }

          await this.prisma.payout.update({
            where: { id: payoutId },
            data: {
              status: 'CANCELLED',
              failureReason: dto.reason || 'Cancelled by admin',
            },
          });
          break;

        case 'retry':
          if (payout.status !== 'FAILED') {
            throw new BadRequestException('Can only retry failed payouts');
          }

          // Crear nuevo payout en Stripe
          const newStripePayout = await this.stripeService.createPayout({
            amount: Number(payout.amount),
            currency: payout.currency,
            stripeAccountId: payout.seller.stripeConnectId,
            method: 'standard',
          });

          await this.prisma.payout.update({
            where: { id: payoutId },
            data: {
              status: 'PENDING',
              stripePayoutId: newStripePayout.id,
              failureReason: null,
              requestedAt: new Date(),
            },
          });
          break;

        default:
          throw new BadRequestException(`Unknown action: ${dto.action}`);
      }

      this.logger.log(`Action ${dto.action} executed successfully on payout ${payoutId}`);

      return { success: true, action: dto.action };
    } catch (error) {
      this.logger.error(`Failed to execute payout action: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Verificar elegibilidad para payout
   */
  async checkPayoutEligibility(userId: string) {
    try {
      this.logger.log(`Checking payout eligibility for user ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          stripeConnectId: true,
          payoutsEnabled: true,
          chargesEnabled: true,
          onboardingComplete: true,
        },
      });

      if (!user || user.role !== 'SELLER') {
        return {
          eligible: false,
          reasons: ['User is not a seller'],
        };
      }

      const reasons = [];

      if (!user.stripeConnectId) {
        reasons.push('No Stripe Connect account configured');
      }

      if (!user.onboardingComplete) {
        reasons.push('Stripe onboarding not completed');
      }

      if (!user.chargesEnabled) {
        reasons.push('Charges not enabled on Stripe account');
      }

      if (!user.payoutsEnabled) {
        reasons.push('Payouts not enabled on Stripe account');
      }

      // Verificar balance si todo está OK
      let availableBalance = 0;
      if (reasons.length === 0 && user.stripeConnectId) {
        try {
          const balance = await this.stripeService.getAccountBalance(user.stripeConnectId);
          const usdBalance = balance.available.find(b => b.currency === 'usd');
          availableBalance = usdBalance ? usdBalance.amount / 100 : 0;

          const minimumPayout = parseFloat(this.configService.get('MINIMUM_PAYOUT_AMOUNT', '10'));
          if (availableBalance < minimumPayout) {
            reasons.push(`Insufficient balance (minimum $${minimumPayout})`);
          }
        } catch (error) {
          reasons.push('Unable to check balance');
        }
      }

      return {
        eligible: reasons.length === 0,
        reasons,
        availableBalance,
        minimumPayout: parseFloat(this.configService.get('MINIMUM_PAYOUT_AMOUNT', '10')),
      };
    } catch (error) {
      this.logger.error(`Failed to check payout eligibility: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener estadísticas básicas de payouts (Admin)
   */
  async getPayoutStatistics(filters?: { startDate?: string; endDate?: string }) {
    try {
      this.logger.log('Getting payout statistics');

      const where: Prisma.PayoutWhereInput = {};

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Estadísticas básicas
      const totalPayouts = await this.prisma.payout.count({ where });
      
      const payoutsByStatus = await this.prisma.payout.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      });

      const totalAmount = await this.prisma.payout.aggregate({
        where,
        _sum: {
          amount: true,
        },
      });

      return {
        summary: {
          totalPayouts,
          totalAmount: Number(totalAmount._sum.amount || 0),
          averageAmount: totalPayouts > 0 ? Number(totalAmount._sum.amount || 0) / totalPayouts : 0,
        },
        byStatus: payoutsByStatus.map(stat => ({
          status: stat.status,
          count: stat._count.id,
          totalAmount: Number(stat._sum.amount || 0),
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get payout statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener todos los payouts con filtros (Admin)
   */
  async getAllPayouts(filters: PayoutFilterDto) {
    try {
      this.logger.log('Getting all payouts for admin');

      const where: Prisma.PayoutWhereInput = {};

      // Aplicar filtros
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.currency) {
        where.currency = filters.currency;
      }

      if (filters.sellerId) {
        where.sellerId = filters.sellerId;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.amount = {};
        if (filters.minAmount !== undefined) {
          where.amount.gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          where.amount.lte = filters.maxAmount;
        }
      }

      if (filters.search) {
        where.OR = [
          { description: { contains: filters.search } },
          {
            seller: {
              OR: [
                { firstName: { contains: filters.search } },
                { lastName: { contains: filters.search } },
                { email: { contains: filters.search } },
              ],
            },
          },
        ];
      }

      // Paginación
      const limit = filters.limit || 20;
      const page = filters.page || 1;
      const skip = (page - 1) * limit;

      // Ordenamiento
      const orderBy: Prisma.PayoutOrderByWithRelationInput = {};
      const sortField = filters.sortBy || 'createdAt';
      orderBy[sortField] = filters.sortOrder || 'desc';

      // Ejecutar consulta
      const [payouts, total] = await Promise.all([
        this.prisma.payout.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                sellerProfile: {
                  select: {
                    storeName: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.payout.count({ where }),
      ]);

      return {
        data: payouts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        filters: {
          applied: Object.keys(where).length > 0,
          ...filters,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get all payouts: ${error.message}`);
      throw error;
    }
  }
}