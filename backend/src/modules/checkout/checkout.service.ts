// src/modules/checkout/checkout.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { OrdersService } from '../orders/orders.service';
import { StripeService } from '../stripe/stripe.service';
import { CheckoutDto, CheckoutResponseDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private ordersService: OrdersService,
    private stripeService: StripeService,
  ) {}

  async createCheckoutSession(
  userId: string, 
  dto: CheckoutDto
): Promise<CheckoutResponseDto> {
  // Obtener carrito del usuario
  const cart = await this.cartService.getCart(userId);

  if (cart.items.length === 0) {
    throw new BadRequestException('El carrito está vacío');
  }

  // Filtrar productos específicos si se especificaron
  let itemsToCheckout = cart.items;
  if (dto.productIds && dto.productIds.length > 0) {
    itemsToCheckout = cart.items.filter(item => 
      dto.productIds.includes(item.productId)
    );

    if (itemsToCheckout.length === 0) {
      throw new BadRequestException('No se encontraron productos válidos para checkout');
    }
  }

  // Recalcular totales solo para los productos seleccionados
  const subtotal = itemsToCheckout.reduce((sum, item) => sum + item.currentPrice, 0);
  const platformFee = subtotal * cart.summary.platformFeeRate;
  const totalAmount = subtotal + platformFee;

  // Crear orden
  const orderDto = await this.ordersService.createOrder(userId, {
    buyerEmail: dto.buyerEmail,
    billingData: dto.billingData
  });

  // Crear sesión de Stripe
  const stripeSession = await this.stripeService.createCheckoutSession({
    orderId: orderDto.id,
    orderNumber: orderDto.orderNumber,
    amount: totalAmount,
    currency: 'usd',
    customerEmail: dto.buyerEmail,
    successUrl: dto.successUrl || `${process.env.FRONTEND_URL}/orders/${orderDto.id}/success`,
    cancelUrl: dto.cancelUrl || `${process.env.FRONTEND_URL}/cart`,
    metadata: {
      orderId: orderDto.id,
      userId,
      itemCount: itemsToCheckout.length.toString()
    }
  });

  // ✅ Actualización simple SIN spread de metadata
  await this.prisma.order.update({
    where: { id: orderDto.id },
    data: {
      paymentIntentId: stripeSession.payment_intent as string,
      metadata: {
        stripeSessionId: stripeSession.id,
        checkoutCreatedAt: new Date().toISOString()
      }
    }
  });

  // Calcular expiración (24 horas desde ahora)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  return {
    orderId: orderDto.id,
    orderNumber: orderDto.orderNumber,
    checkoutUrl: stripeSession.url,
    paymentIntentId: stripeSession.payment_intent as string,
    totalAmount: totalAmount,
    expiresAt
  };
}

  /**
   * Validar sesión de checkout existente
   */
  async validateCheckoutSession(sessionId: string): Promise<boolean> {
    try {
      // Buscar orden por session ID en metadata
      const order = await this.prisma.order.findFirst({
        where: {
          metadata: {
            path: ['stripeSessionId'],
            equals: sessionId
          }
        }
      });

      if (!order) {
        return false;
      }

      // Verificar que la sesión no haya expirado (24 horas)
      const expirationTime = new Date(order.createdAt);
      expirationTime.setHours(expirationTime.getHours() + 24);

      return new Date() < expirationTime && order.status === 'PENDING';
    } catch (error) {
      console.error('Error validating checkout session:', error);
      return false;
    }
  }

  /**
   * Cancelar sesión de checkout
   */
  async cancelCheckoutSession(orderId: string, userId: string): Promise<void> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        buyerId: userId,
        status: 'PENDING'
      }
    });

    if (!order) {
      throw new BadRequestException('Orden no encontrada o no se puede cancelar');
    }

    // Actualizar orden como cancelada
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        metadata: {
          ...(order.metadata as Record<string, any> || {}),
          cancellationReason: 'Cancelled by user during checkout',
          cancelledAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Obtener detalles de checkout para una orden
   */
  async getCheckoutDetails(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        buyerId: userId
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                category: true,
                imageFiles: {
                  where: { type: 'IMAGE' },
                  take: 1,
                  select: { url: true }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new BadRequestException('Orden no encontrada');
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      platformFee: order.platformFee,
      subtotal: order.subtotal,
      buyerEmail: order.buyerEmail,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productTitle: item.productTitle,
        price: item.price,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          title: item.product.title,
          slug: item.product.slug,
          category: item.product.category,
          imageUrl: item.product.imageFiles[0]?.url || null
        }
      })),
      createdAt: order.createdAt,
      paymentIntentId: order.paymentIntentId
    };
  }

  /**
   * Reactivar checkout para orden pendiente
   */
  async reactivateCheckout(orderId: string, userId: string): Promise<CheckoutResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        buyerId: userId,
        status: 'PENDING'
      }
    });

    if (!order) {
      throw new BadRequestException('Orden no encontrada o no se puede reactivar');
    }

    // Verificar que no haya expirado (24 horas)
    const expirationTime = new Date(order.createdAt);
    expirationTime.setHours(expirationTime.getHours() + 24);

    if (new Date() > expirationTime) {
      // Cancelar orden expirada
      await this.cancelCheckoutSession(orderId, userId);
      throw new BadRequestException('La sesión de checkout ha expirado');
    }

    // Crear nueva sesión de Stripe
    const stripeSession = await this.stripeService.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      currency: 'usd',
      customerEmail: order.buyerEmail,
      successUrl: `${process.env.FRONTEND_URL}/orders/${order.id}/success`,
      cancelUrl: `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        orderId: order.id,
        userId,
        reactivated: 'true'
      }
    });

    // Actualizar metadata con nueva sesión
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentIntentId: stripeSession.payment_intent as string,
        metadata: {
          ...(order.metadata as Record<string, any> || {}),
          stripeSessionId: stripeSession.id,
          reactivatedAt: new Date().toISOString()
        }
      }
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl: stripeSession.url,
      paymentIntentId: stripeSession.payment_intent as string,
      totalAmount: order.totalAmount,
      expiresAt: expirationTime
    };
  }

  /**
   * Obtener estadísticas de checkout para analytics
   */
  async getCheckoutAnalytics(fromDate?: Date, toDate?: Date) {
    const where: any = {};

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const [
      totalCheckouts,
      completedCheckouts,
      cancelledCheckouts,
      avgCheckoutValue
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.order.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _avg: { totalAmount: true }
      })
    ]);

    const conversionRate = totalCheckouts > 0 
      ? (completedCheckouts / totalCheckouts) * 100 
      : 0;

    return {
      totalCheckouts,
      completedCheckouts,
      cancelledCheckouts,
      pendingCheckouts: totalCheckouts - completedCheckouts - cancelledCheckouts,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgCheckoutValue: avgCheckoutValue._avg.totalAmount || 0
    };
  }
}