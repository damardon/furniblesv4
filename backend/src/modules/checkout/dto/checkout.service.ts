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

  /**
   * Iniciar proceso de checkout
   */
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

    // Crear orden
    const order = await this.ordersService.createOrder(userId, {
      buyerEmail: dto.buyerEmail,
      billingData: dto.billingData
    });

    // Crear sesión de Stripe
    const stripeSession = await this.stripeService.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      currency: 'usd',
      customerEmail: dto.buyerEmail,
      successUrl: dto.successUrl || `${process.env.FRONTEND_URL}/orders/${order.id}/success`,
      cancelUrl: dto.cancelUrl || `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        orderId: order.id,
        userId
      }
    });

    // Actualizar orden con Payment Intent ID
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentIntentId: stripeSession.payment_intent as string
      }
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl: stripeSession.url,
      paymentIntentId: stripeSession.payment_intent as string,
      totalAmount: order.totalAmount,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    };
  }
}