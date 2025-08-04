// backend/src/modules/payments/payment-checkout.controller.ts - CORREGIDO
import { 
  Controller, 
  Post, 
  Get,
  Body, 
  Param,
  Query,
  Logger, 
  UseGuards,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiBearerAuth 
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StripeService } from '../stripe/stripe.service';
import { PayPalService } from '../paypal/paypal.service';
import { PrismaService } from '../prisma/prisma.service';

// DTOs
interface CreatePaymentIntentDto {
  amount: number;
  currency: string;
  cartItems: any[];
  customerInfo: {
    email: string;
    name: string;
    address?: any;
  };
}

interface CreatePayPalOrderDto {
  amount: number;
  currency: string;
  cartItems: any[];
  customerInfo: {
    email: string;
    name: string;
  };
}

interface CapturePayPalOrderDto {
  orderId: string;
}

@ApiTags('payment-checkout')
@Controller('api/payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentCheckoutController {
  private readonly logger = new Logger(PaymentCheckoutController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paypalService: PayPalService,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================
  // 🔷 STRIPE CHECKOUT ENDPOINTS
  // ============================================

  /**
   * 🆕 CRÍTICO: Crear Payment Intent para checkout
   */
  @Post('stripe/create-intent')
  @ApiOperation({ 
    summary: 'Create Stripe Payment Intent',
    description: 'Creates a payment intent for Stripe checkout'
  })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or empty cart' })
  async createStripePaymentIntent(
    @Body() createIntentDto: CreatePaymentIntentDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Creating Stripe Payment Intent for user ${user.id}`);

      // Validaciones
      if (!createIntentDto.amount || createIntentDto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      if (!createIntentDto.cartItems || createIntentDto.cartItems.length === 0) {
        throw new BadRequestException('Cart items are required');
      }

      // Verificar carrito del usuario
      const cartItems = await this.prisma.cartItem.findMany({
        where: { userId: user.id },
        include: {
          product: {
            include: {
              seller: true
            }
          }
        }
      });

      if (!cartItems || cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Generar número de orden único
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Crear Payment Intent
      const paymentIntent = await this.stripeService.createPaymentIntent(
        createIntentDto.amount,
        createIntentDto.currency,
        {
          userId: user.id.toString(),
          customerEmail: createIntentDto.customerInfo.email,
          customerName: createIntentDto.customerInfo.name,
          orderNumber: orderNumber,
          itemCount: cartItems.length.toString(),
        }
      );

      // ✅ CORREGIDO: Crear orden pendiente usando la estructura correcta de Prisma
      const order = await this.prisma.order.create({
        data: {
          orderNumber: orderNumber,
          buyerId: user.id, // ✅ Usar buyerId directamente
          subtotal: createIntentDto.amount,
          subtotalAmount: createIntentDto.amount,
          platformFeeRate: 0.10, // 10% fee
          platformFee: createIntentDto.amount * 0.10,
          totalAmount: createIntentDto.amount,
          currency: createIntentDto.currency.toUpperCase(),
          status: 'PENDING',
          paymentMethod: 'stripe',
          paymentIntentId: paymentIntent.id,
          metadata: {
            customerInfo: createIntentDto.customerInfo,
            paymentMethod: 'stripe',
            cartItemsCount: cartItems.length,
            createdAt: new Date().toISOString(),
          },
          // ✅ Crear OrderItems relacionados
          items: {
            create: cartItems.map(item => ({
              productId: item.productId,
              sellerId: item.product.sellerId,
              priceSnapshot: item.priceSnapshot,
              currentPrice: item.product.price,
              quantity: item.quantity,
            }))
          }
        },
        include: {
          items: true,
          buyer: true
        }
      });

      this.logger.log(`Payment Intent created: ${paymentIntent.id} for order ${order.id}`);

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
      };

    } catch (error) {
      this.logger.error(`Failed to create Payment Intent: ${error.message}`);
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  // ============================================
  // 🔷 PAYPAL CHECKOUT ENDPOINTS
  // ============================================

  /**
   * 🆕 CRÍTICO: Crear orden PayPal
   */
  @Post('paypal/create-order')
  @ApiOperation({ 
    summary: 'Create PayPal order',
    description: 'Creates a PayPal order for checkout'
  })
  @ApiResponse({ status: 201, description: 'PayPal order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or empty cart' })
  async createPayPalOrder(
    @Body() createOrderDto: CreatePayPalOrderDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Creating PayPal order for user ${user.id}`);

      // Validaciones
      if (!createOrderDto.amount || createOrderDto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      // Verificar carrito del usuario
      const cartItems = await this.prisma.cartItem.findMany({
        where: { userId: user.id },
        include: {
          product: {
            include: {
              seller: true
            }
          }
        }
      });

      if (!cartItems || cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Preparar items para PayPal
      const paypalItems = cartItems.map(item => ({
        name: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
      }));

      // Generar número de orden único
      const orderNumber = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Crear orden en PayPal
      const paypalOrder = await this.paypalService.createOrder({
        amount: createOrderDto.amount,
        currency: createOrderDto.currency,
        items: paypalItems,
        metadata: {
          userId: user.id.toString(),
          orderNumber: orderNumber,
          customerEmail: createOrderDto.customerInfo.email,
        }
      });

      // ✅ CORREGIDO: Crear orden pendiente usando la estructura correcta
      const order = await this.prisma.order.create({
        data: {
          orderNumber: orderNumber,
          buyerId: user.id, // ✅ Usar buyerId directamente
          subtotal: createOrderDto.amount,
          subtotalAmount: createOrderDto.amount,
          platformFeeRate: 0.10,
          platformFee: createOrderDto.amount * 0.10,
          totalAmount: createOrderDto.amount,
          currency: createOrderDto.currency.toUpperCase(),
          status: 'PENDING',
          paymentMethod: 'paypal',
          paypalOrderId: paypalOrder.orderId,
          metadata: {
            customerInfo: createOrderDto.customerInfo,
            paymentMethod: 'paypal',
            paypalOrderId: paypalOrder.orderId,
            cartItemsCount: cartItems.length,
            createdAt: new Date().toISOString(),
          },
          // ✅ Crear OrderItems relacionados
          items: {
            create: cartItems.map(item => ({
              productId: item.productId,
              sellerId: item.product.sellerId,
              priceSnapshot: item.priceSnapshot,
              currentPrice: item.product.price,
              quantity: item.quantity,
            }))
          }
        },
        include: {
          items: true,
          buyer: true
        }
      });

      this.logger.log(`PayPal order created: ${paypalOrder.orderId} for order ${order.id}`);

      return {
        success: true,
        orderId: paypalOrder.orderId,
        approvalUrl: paypalOrder.approvalUrl,
        localOrderId: order.id,
        orderNumber: order.orderNumber,
      };

    } catch (error) {
      this.logger.error(`Failed to create PayPal order: ${error.message}`);
      throw new BadRequestException(`Failed to create PayPal order: ${error.message}`);
    }
  }

  /**
   * 🆕 CRÍTICO: Capturar pago PayPal
   */
  @Post('paypal/capture-order')
  @ApiOperation({ 
    summary: 'Capture PayPal payment',
    description: 'Captures a PayPal payment after user approval'
  })
  @ApiResponse({ status: 200, description: 'PayPal payment captured successfully' })
  @ApiResponse({ status: 400, description: 'Capture failed' })
  async capturePayPalOrder(
    @Body() captureDto: CapturePayPalOrderDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Capturing PayPal order ${captureDto.orderId} for user ${user.id}`);

      // Capturar pago en PayPal
      const captureResult = await this.paypalService.captureOrder(captureDto.orderId);

      if (captureResult.status !== 'COMPLETED') {
        throw new BadRequestException('PayPal payment was not completed');
      }

      // Buscar orden local por PayPal Order ID
      const order = await this.prisma.order.findFirst({
        where: { 
          paypalOrderId: captureDto.orderId,
          buyerId: user.id 
        },
        include: {
          items: true,
          buyer: true
        }
      });
      
      if (!order) {
        throw new BadRequestException('Order not found or unauthorized');
      }

      // Completar orden
      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentStatus: 'completed',
          paidAt: new Date(),
          metadata: {
            ...order.metadata as any,
            paymentId: captureResult.paymentId,
            capturedAt: new Date().toISOString(),
          }
        }
      });

      // Limpiar carrito
      await this.prisma.cartItem.deleteMany({
        where: { userId: user.id }
      });

      this.logger.log(`PayPal payment completed for order ${order.id}`);

      return {
        success: true,
        status: 'COMPLETED',
        paymentId: captureResult.paymentId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: captureResult.amount,
      };

    } catch (error) {
      this.logger.error(`Failed to capture PayPal payment: ${error.message}`);
      throw new BadRequestException(`Failed to capture PayPal payment: ${error.message}`);
    }
  }
   }
