import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { FeesService } from '../fees/fees.service';
import { NotificationService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private feesService: FeesService,
    private notificationService: NotificationService,
  ) {}

  // Agregar estos métodos al OrdersService existente

async handleSuccessfulPayment(params: {
  orderId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  webhookEventId: string;
}, tx?: any): Promise<void> {
  const prisma = tx || this.prisma;
  
  await prisma.order.update({
    where: { id: params.orderId },
    data: {
      status: 'PROCESSING',
      paidAt: new Date(),
      paymentStatus: 'succeeded',
      paymentIntentId: params.paymentIntentId,
      metadata: {
        webhookEventId: params.webhookEventId,
        amountPaid: params.amount,
        currency: params.currency
      }
    }
  });

  await this.processPaymentSuccess(params.paymentIntentId);
}

async handleFailedPayment(params: {
  orderId: string;
  paymentIntentId: string;
  errorCode?: string;
  errorMessage?: string;
  webhookEventId: string;
}, tx?: any): Promise<void> {
  const prisma = tx || this.prisma;
  
  await prisma.order.update({
    where: { id: params.orderId },
    data: {
      paymentStatus: 'failed',
      metadata: {
        webhookEventId: params.webhookEventId,
        paymentError: {
          code: params.errorCode,
          message: params.errorMessage
        }
      }
    }
  });
}

async handleCheckoutCompleted(params: {
  orderId: string;
  sessionId: string;
  paymentIntentId: string;
  paymentStatus: string;
  webhookEventId: string;
}, tx?: any): Promise<void> {
  const prisma = tx || this.prisma;
  
  await prisma.order.update({
    where: { id: params.orderId },
    data: {
      paymentIntentId: params.paymentIntentId,
      paymentStatus: 'completed',
      metadata: {
        webhookEventId: params.webhookEventId,
        sessionId: params.sessionId,
        checkoutStatus: params.paymentStatus
      }
    }
  });
}

async handleCheckoutExpired(params: {
  orderId: string;
  sessionId: string;
  webhookEventId: string;
}, tx?: any): Promise<void> {
  const prisma = tx || this.prisma;
  
  const order = await prisma.order.findUnique({
    where: { id: params.orderId }
  });

  if (order?.status === 'PENDING') {
    await prisma.order.update({
      where: { id: params.orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        metadata: {
          webhookEventId: params.webhookEventId,
          cancelReason: 'checkout_expired'
        }
      }
    });
  }
}

async handlePaymentCanceled(params: {
  orderId: string;
  paymentIntentId: string;
  webhookEventId: string;
}, tx?: any): Promise<void> {
  const prisma = tx || this.prisma;
  
  await prisma.order.update({
    where: { id: params.orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      paymentStatus: 'canceled',
      metadata: {
        webhookEventId: params.webhookEventId,
        cancelReason: 'payment_canceled'
      }
    }
  });
}

async handleDispute(params: {
  paymentIntentId: string;
  disputeId: string;
  reason: string;
  amount: number;
  currency: string;
  webhookEventId: string;
}, tx?: any): Promise<void> {
  const prisma = tx || this.prisma;
  
  const order = await prisma.order.findFirst({
    where: { paymentIntentId: params.paymentIntentId }
  });

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'DISPUTED',
        metadata: {
          webhookEventId: params.webhookEventId,
          dispute: {
            disputeId: params.disputeId,
            reason: params.reason,
            amount: params.amount,
            currency: params.currency
          }
        }
      }
    });
  }
}

async handleRefund(params: {
  paymentIntentId: string;
  refundId: string;
  amount: number;
  reason: string;
  webhookEventId: string;
}, tx?: any): Promise<void> {
  const prisma = tx || this.prisma;
  
  const order = await prisma.order.findFirst({
    where: { paymentIntentId: params.paymentIntentId }
  });

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
        metadata: {
          webhookEventId: params.webhookEventId,
          refund: {
            refundId: params.refundId,
            amount: params.amount,
            reason: params.reason
          }
        }
      }
    });
  }
}

  /**
   * Crear orden desde carrito
   */
  async createOrder(userId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    // Obtener carrito del usuario
    const cart = await this.cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Generar número de orden único
    const orderNumber = await this.generateOrderNumber();

    // Obtener IDs únicos de sellers
    const sellerIds = [...new Set(cart.items.map(item => item.seller.id))];

    const order = await this.prisma.order.create({
    data: {
      orderNumber,
      buyerId: userId,
      subtotal: cart.summary.subtotal,
      subtotalAmount: cart.summary.subtotal,
      platformFeeRate: cart.summary.platformFeeRate,
      platformFee: cart.summary.platformFee,
      totalAmount: cart.summary.totalAmount,
      sellerAmount: cart.summary.subtotal - cart.summary.platformFee,
      buyerEmail: dto.buyerEmail,
      billingData: dto.billingData || null,
      metadata: dto.metadata || null,
      feeBreakdown: cart.summary.feeBreakdown || null,
      status: 'PENDING',
      items: {
        create: cart.items.map(item => ({
          productId: item.productId,
          sellerId: item.seller.id,
          productTitle: item.productTitle,
          productSlug: item.productSlug,
          price: item.currentPrice,
          quantity: item.quantity || 1,
          sellerName: item.seller.name,
          storeName: item.seller.storeName || null
        }))
      }
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailFileIds: true
            }
          },
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              sellerProfile: {
                select: {
                  storeName: true,
                  avatar: true
                }
              }
            }
          }
        }
      },
      buyer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
    // Enviar notificación de orden creada
    await this.notificationService.sendOrderCreatedNotification(order);

    return this.mapOrderToDto(order);
  }

  /**
   * Obtener orden por ID
   */
  async getOrderById(orderId: string, userId?: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
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
      throw new NotFoundException('Orden no encontrada');
    }

    // Verificar permisos
    if (userId && order.buyerId !== userId && !order.items.some(item => item.sellerId === userId)) {
      throw new NotFoundException('Orden no encontrada');
    }

    return this.mapOrderToDto(order);
  }

  /**
   * Obtener órdenes del usuario (buyer)
   */
  async getBuyerOrders(userId: string, filters: OrderFiltersDto) {
    const where: any = { buyerId: userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.createdAt.lte = new Date(filters.toDate);
      }
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { buyerEmail: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const total = await this.prisma.order.count({ where });
    const totalPages = Math.ceil(total / filters.limit);

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        buyer: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    });

    return {
      data: orders.map(order => this.mapOrderToDto(order)),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrev: filters.page > 1
    };
  }

  /**
   * Obtener órdenes del seller
   */
  async getSellerOrders(sellerId: string, filters: OrderFiltersDto) {
    const where: any = {
      sellerIds: {
        has: sellerId
      }
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.createdAt.lte = new Date(filters.toDate);
      }
    }

    const total = await this.prisma.order.count({ where });
    const totalPages = Math.ceil(total / filters.limit);

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        buyer: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    });

    return {
      data: orders.map(order => this.mapOrderToDto(order)),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrev: filters.page > 1
    };
  }

  /**
   * Procesar pago exitoso (webhook)
   */
  async processPaymentSuccess(paymentIntentId: string): Promise<void> {
    const order = await this.prisma.order.findFirst({
      where: { paymentIntentId },
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
      throw new NotFoundException('Orden no encontrada');
    }

    // Actualizar estado a PROCESSING
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PROCESSING,
        paidAt: new Date(),
        paymentStatus: 'succeeded'
      }
    });

    // Enviar notificaciones de pago exitoso
    await this.notificationService.sendOrderPaidNotification(order);

    // Generar tokens de descarga
    await this.generateDownloadTokens(order);

    // Marcar orden como completada
    await this.completeOrder(order.id);
  }

  /**
   * Completar orden (generar downloads y notificar)
   */
  async completeOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COMPLETED,
        completedAt: new Date()
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        buyer: true
      }
    });

    // Limpiar carrito del usuario
    await this.cartService.clearCart(order.buyerId);

    // Actualizar estadísticas de productos
    await this.updateProductStatistics(order.items);

    // Enviar notificación de orden completada
    await this.notificationService.sendOrderCompletedNotification(order);
  }

  /**
   * Cancelar orden
   */
  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        metadata: {
          cancellationReason: reason
        }
      }
    });
  }

  /**
   * Generar tokens de descarga para una orden
   */
  private async generateDownloadTokens(order: any): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 días de expiración

    for (const item of order.items) {
      if (item.product.pdfFileId) {
        await this.prisma.downloadToken.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            buyerId: order.buyerId,
            downloadLimit: 5, // Configurable
            expiresAt
          }
        });
      }
    }
  }

  /**
   * Actualizar estadísticas de productos vendidos
   */
  private async updateProductStatistics(orderItems: any[]): Promise<void> {
    for (const item of orderItems) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          downloadCount: {
            increment: 1
          }
        }
      });

      // Actualizar estadísticas del seller
      await this.prisma.sellerProfile.update({
        where: { userId: item.sellerId },
        data: {
          totalSales: {
            increment: 1
          }
        }
      });
    }
  }

  /**
   * Generar número de orden único
   */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Contar órdenes del día
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const ordersToday = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    const sequenceNumber = (ordersToday + 1).toString().padStart(3, '0');
    return `ORD-${dateStr}-${sequenceNumber}`;
  }

  /**
   * Mapear orden a DTO
   */
  private mapOrderToDto(order: any): OrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      platformFeeRate: order.platformFeeRate,
      platformFee: order.platformFee,
      totalAmount: order.totalAmount,
      sellerAmount: order.sellerAmount,
      buyerEmail: order.buyerEmail,
      paymentIntentId: order.paymentIntentId,
      paymentStatus: order.paymentStatus,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productTitle: item.productTitle,
        productSlug: item.productSlug,
        price: item.price,
        quantity: item.quantity,
        sellerName: item.sellerName,
        storeName: item.storeName
      })),
      buyer: {
        id: order.buyer.id,
        name: `${order.buyer.firstName} ${order.buyer.lastName}`,
        email: order.buyer.email
      },
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      completedAt: order.completedAt,
      feeBreakdown: order.feeBreakdown
    };
  }
  async getAllOrdersAdmin(filters: OrderFiltersDto) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.createdAt.lte = new Date(filters.toDate);
      }
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { buyerEmail: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const total = await this.prisma.order.count({ where });
    const totalPages = Math.ceil(total / filters.limit);

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        buyer: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    });

    return {
      data: orders.map(order => this.mapOrderToDto(order)),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrev: filters.page > 1
    };
  }

  /**
   * Analytics de órdenes para admin
   */
  async getOrderAnalytics(filters: { fromDate?: string; toDate?: string }) {
    const where: any = {};

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    // Estadísticas generales
    const totalOrders = await this.prisma.order.count({ where });
    
    const revenueStats = await this.prisma.order.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true }
    });

    // Órdenes por estado
    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    });

    // Top sellers
    const topSellers = await this.prisma.orderItem.groupBy({
      by: ['sellerId'],
      where: {
        order: where
      },
      _sum: { price: true },
      _count: { sellerId: true },
      orderBy: { _sum: { price: 'desc' } },
      take: 10
    });

    // Revenue por fecha (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByDate = await this.prisma.order.findMany({
      where: {
        ...where,
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { totalAmount: true, createdAt: true }
    });

    // Agrupar por día
    const dailyRevenue = revenueByDate.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + order.totalAmount;
      return acc;
    }, {});

    return {
      totalOrders,
      totalRevenue: revenueStats._sum.totalAmount || 0,
      avgOrderValue: revenueStats._avg.totalAmount || 0,
      ordersByStatus: Object.fromEntries(
        ordersByStatus.map(item => [item.status, item._count.status])
      ),
      topSellers: topSellers.map(seller => ({
        sellerId: seller.sellerId,
        totalSales: seller._count.sellerId,
        totalRevenue: seller._sum.price
      })),
      revenueByDate: Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue
      }))
    };
  }

  /**
   * Procesar reembolso
   */
  async processRefund(orderId: string, amount?: number, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status !== 'COMPLETED' && order.status !== 'PAID') {
      throw new BadRequestException('Solo se pueden reembolsar órdenes completadas o pagadas');
    }

    // Actualizar estado de orden - spread de metadata
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        metadata: {
          ...(order.metadata as Record<string, any> || {}),
        refund: {
          amount: amount || order.totalAmount,
          reason,
          processedAt: new Date().toISOString(),
          processedBy: 'admin'
          }
        }
      }
    });

    // TODO: Integrar con Stripe para reembolso real
    // await this.stripeService.createRefund(order.paymentIntentId, amount);

    return updatedOrder;
  }

  /**
   * Actualizar estado de orden manualmente
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        metadata: {
          ...(order.metadata as Record<string, any> || {}),
        statusUpdate: {
          previousStatus: order.status,
          newStatus: status,
          reason,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin'
          }
        }
      }
    });

    // Si se marca como completada, generar tokens de descarga
    if (status === 'COMPLETED' && order.status !== 'COMPLETED') {
      await this.generateDownloadTokens(updatedOrder);
      await this.notificationService.sendOrderCompletedNotification(updatedOrder);
    }

    return updatedOrder;
  }
  /**
   * Limpiar órdenes pendientes (Cron Job)
   */
  async cleanupPendingOrders(): Promise<number> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const result = await this.prisma.order.updateMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: {
          lt: oneHourAgo
        }
      },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date()
      }
    });

    return result.count;
  }
}
