// src/modules/transactions/transactions.service.ts
import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
  ) {}

  /**
   * 🆕 Crear registro de transacción
   */
  async createTransaction(data: {
    type: 'SALE' | 'PLATFORM_FEE' | 'STRIPE_FEE' | 'PAYOUT' | 'REFUND' | 'CHARGEBACK';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    amount: number;
    currency: string;
    sellerId?: string;
    orderId?: string;
    payoutId?: string;
    stripeTransactionId?: string;
    stripeChargeId?: string;
    stripePaymentIntentId?: string;
    description?: string;
    metadata?: any;
  }) {
    try {
      this.logger.log(`Creating transaction: ${data.type} for ${data.amount} ${data.currency}`);

      const transaction = await this.prisma.transaction.create({
        data: {
          type: data.type,
          status: data.status,
          amount: new Prisma.Decimal(data.amount),
          currency: data.currency,
          sellerId: data.sellerId,
          orderId: data.orderId,
          payoutId: data.payoutId,
          stripeTransactionId: data.stripeTransactionId,
          stripeChargeId: data.stripeChargeId,
          stripePaymentIntentId: data.stripePaymentIntentId,
          description: data.description,
          metadata: data.metadata,
        },
      });

      this.logger.log(`Transaction ${transaction.id} created successfully`);
      return transaction;
    } catch (error) {
      this.logger.error(`Failed to create transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener transacciones del seller
   */
  async getSellerTransactions(sellerId: string, filters: TransactionFilterDto) {
    try {
      this.logger.log(`Getting transactions for seller ${sellerId}`);

      const where: Prisma.TransactionWhereInput = {
        sellerId,
      };

      // Aplicar filtros
      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.currency) {
        where.currency = filters.currency;
      }

      if (filters.orderId) {
        where.orderId = filters.orderId;
      }

      if (filters.payoutId) {
        where.payoutId = filters.payoutId;
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
          where.amount.gte = new Prisma.Decimal(filters.minAmount);
        }
        if (filters.maxAmount !== undefined) {
          where.amount.lte = new Prisma.Decimal(filters.maxAmount);
        }
      }

      if (filters.search) {
        where.OR = [
          { description: { contains: filters.search, mode: 'insensitive' } },
          { stripeTransactionId: { contains: filters.search, mode: 'insensitive' } },
          { stripeChargeId: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Paginación
      const limit = filters.limit || 20;
      const page = filters.page || 1;
      const skip = (page - 1) * limit;

      // Ordenamiento
      const orderBy: Prisma.TransactionOrderByWithRelationInput = {};
      const sortField = filters.sortBy || 'createdAt';
      orderBy[sortField] = filters.sortOrder || 'desc';

      // Ejecutar consulta
      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
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
            order: {
              select: {
                orderNumber: true,
                totalAmount: true,
                status: true,
              },
            },
            payout: {
              select: {
                id: true,
                amount: true,
                status: true,
                requestedAt: true,
              },
            },
          },
        }),
        this.prisma.transaction.count({ where }),
      ]);

      return {
        data: transactions,
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
      this.logger.error(`Failed to get seller transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener todas las transacciones (Admin)
   */
  async getAllTransactions(filters: TransactionFilterDto) {
    try {
      this.logger.log('Getting all transactions for admin');

      const where: Prisma.TransactionWhereInput = {};

      // Aplicar filtros
      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.currency) {
        where.currency = filters.currency;
      }

      if (filters.sellerId) {
        where.sellerId = filters.sellerId;
      }

      if (filters.orderId) {
        where.orderId = filters.orderId;
      }

      if (filters.payoutId) {
        where.payoutId = filters.payoutId;
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
          where.amount.gte = new Prisma.Decimal(filters.minAmount);
        }
        if (filters.maxAmount !== undefined) {
          where.amount.lte = new Prisma.Decimal(filters.maxAmount);
        }
      }

      if (filters.search) {
        where.OR = [
          { description: { contains: filters.search, mode: 'insensitive' } },
          { stripeTransactionId: { contains: filters.search, mode: 'insensitive' } },
          {
            seller: {
              OR: [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
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
      const orderBy: Prisma.TransactionOrderByWithRelationInput = {};
      const sortField = filters.sortBy || 'createdAt';
      orderBy[sortField] = filters.sortOrder || 'desc';

      // Ejecutar consulta
      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
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
            order: {
              select: {
                orderNumber: true,
                totalAmount: true,
                status: true,
                buyerId: true,
              },
            },
            payout: {
              select: {
                id: true,
                amount: true,
                status: true,
                requestedAt: true,
              },
            },
          },
        }),
        this.prisma.transaction.count({ where }),
      ]);

      return {
        data: transactions,
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
      this.logger.error(`Failed to get all transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener detalles de transacción específica
   */
  async getTransactionById(transactionId: string, userId: string, userRole: string) {
    try {
      this.logger.log(`Getting transaction ${transactionId} for user ${userId}`);

      const where: Prisma.TransactionWhereUniqueInput = { id: transactionId };

      const transaction = await this.prisma.transaction.findUnique({
        where,
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
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
              status: true,
              buyerId: true,
              buyer: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          payout: {
            select: {
              id: true,
              amount: true,
              status: true,
              requestedAt: true,
              processedAt: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      // Solo sellers pueden ver sus propias transacciones, admins pueden ver todas
      if (userRole !== 'ADMIN' && transaction.sellerId !== userId) {
        throw new NotFoundException('Transaction not found');
      }

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to get transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Obtener estadísticas de transacciones
   */
  async getTransactionStatistics(filters?: { startDate?: string; endDate?: string; sellerId?: string }) {
    try {
      this.logger.log('Getting transaction statistics');

      const where: Prisma.TransactionWhereInput = {};

      if (filters?.sellerId) {
        where.sellerId = filters.sellerId;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Estadísticas por tipo
      const typeStats = await this.prisma.transaction.groupBy({
        by: ['type'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      });

      // Estadísticas por estado
      const statusStats = await this.prisma.transaction.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      });

      // Estadísticas por moneda
      const currencyStats = await this.prisma.transaction.groupBy({
        by: ['currency'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      });

      // Estadísticas generales
      const totalTransactions = await this.prisma.transaction.count({ where });
      const totalAmount = await this.prisma.transaction.aggregate({
        where,
        _sum: {
          amount: true,
        },
      });

      return {
        summary: {
          totalTransactions,
          totalAmount: Number(totalAmount._sum.amount || 0),
          averageAmount: totalTransactions > 0 ? Number(totalAmount._sum.amount || 0) / totalTransactions : 0,
        },
        byType: typeStats.map(stat => ({
          type: stat.type,
          count: stat._count.id,
          totalAmount: Number(stat._sum.amount || 0),
        })),
        byStatus: statusStats.map(stat => ({
          status: stat.status,
          count: stat._count.id,
          totalAmount: Number(stat._sum.amount || 0),
        })),
        byCurrency: currencyStats.map(stat => ({
          currency: stat.currency,
          count: stat._count.id,
          totalAmount: Number(stat._sum.amount || 0),
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Actualizar estado de transacción
   */
  async updateTransactionStatus(
    transactionId: string, 
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
    metadata?: any
  ) {
    try {
      this.logger.log(`Updating transaction ${transactionId} status to ${status}`);

      const updateData: Prisma.TransactionUpdateInput = {
        status,
        updatedAt: new Date(),
      };

      if (metadata) {
        updateData.metadata = metadata;
      }

      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: updateData,
      });

      this.logger.log(`Transaction ${transactionId} status updated to ${status}`);
      return updatedTransaction;
    } catch (error) {
      this.logger.error(`Failed to update transaction status: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 Registrar transacciones desde órdenes (helper)
   */
  async recordOrderTransactions(orderId: string, orderData: {
    buyerId: string;
    sellerId: string;
    totalAmount: number;
    platformFeeAmount: number;
    sellerAmount: number;
    stripeFeeAmount?: number;
    currency: string;
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
  }) {
    try {
      this.logger.log(`Recording transactions for order ${orderId}`);

      const transactions = [];

      // 1. Transacción de venta principal
      const saleTransaction = await this.createTransaction({
        type: 'SALE',
        status: 'COMPLETED',
        amount: orderData.totalAmount,
        currency: orderData.currency,
        sellerId: orderData.sellerId,
        orderId,
        stripePaymentIntentId: orderData.stripePaymentIntentId,
        stripeChargeId: orderData.stripeChargeId,
        description: `Sale for order ${orderId}`,
        metadata: {
          buyerId: orderData.buyerId,
        },
      });
      transactions.push(saleTransaction);

      // 2. Transacción de fee de plataforma
      const platformFeeTransaction = await this.createTransaction({
        type: 'PLATFORM_FEE',
        status: 'COMPLETED',
        amount: orderData.platformFeeAmount,
        currency: orderData.currency,
        orderId,
        description: `Platform fee for order ${orderId}`,
        metadata: {
          sellerId: orderData.sellerId,
          buyerId: orderData.buyerId,
        },
      });
      transactions.push(platformFeeTransaction);

      // 3. Transacción de fee de Stripe (si se proporciona)
      if (orderData.stripeFeeAmount) {
        const stripeFeeTransaction = await this.createTransaction({
          type: 'STRIPE_FEE',
          status: 'COMPLETED',
          amount: orderData.stripeFeeAmount,
          currency: orderData.currency,
          orderId,
          description: `Stripe processing fee for order ${orderId}`,
          metadata: {
            sellerId: orderData.sellerId,
          },
        });
        transactions.push(stripeFeeTransaction);
      }

      this.logger.log(`Recorded ${transactions.length} transactions for order ${orderId}`);
      return transactions;
    } catch (error) {
      this.logger.error(`Failed to record order transactions: ${error.message}`);
      throw error;
    }
  }
}