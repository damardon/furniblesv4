// backend/src/modules/payments/payments.controller.ts - COMPLEMENTADO
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
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth 
} from '@nestjs/swagger';

// ✅ Imports existentes (mantener)
import { PaymentsService } from './payments.service';
import { SellerOnboardingDto } from './dto/seller-onboarding.dto';
import { PaymentSetupDto } from './dto/payment-setup.dto';
import { BalanceRequestDto, PayoutHistoryRequestDto } from './dto/balance-request.dto';

// ✅ Imports de auth (mantener)
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

// ✅ NUEVOS imports para frontend checkout
import { StripeService } from '../stripe/stripe.service';
import { PayPalService } from '../paypal/paypal.service'; // Nuevo servicio que vamos a crear

// ✅ NUEVOS DTOs para frontend
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

@ApiTags('payments')
@Controller('api/payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService, // ✅ NUEVO
    private readonly paypalService: PayPalService, // ✅ NUEVO
  ) {}

  // ============================================
  // 🆕 ENDPOINTS PARA FRONTEND CHECKOUT
  // ============================================

  /**
   * 🆕 CRÍTICO: Crear Payment Intent de Stripe para checkout
   */
  @Post('stripe/create-intent')
  @ApiOperation({ 
    summary: 'Create Stripe Payment Intent',
    description: 'Creates a Stripe Payment Intent for frontend checkout'
  })
  @ApiResponse({ status: 201, description: 'Payment Intent created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createStripePaymentIntent(
    @Body() createIntentDto: CreatePaymentIntentDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Creating Stripe Payment Intent for user ${user.id}, amount: ${createIntentDto.amount}`);

      // Validaciones básicas
      if (!createIntentDto.amount || createIntentDto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      if (!createIntentDto.cartItems || createIntentDto.cartItems.length === 0) {
        throw new BadRequestException('Cart items are required');
      }

      // Crear Payment Intent
      const paymentIntent = await this.stripeService.createPaymentIntent(
        createIntentDto.amount,
        createIntentDto.currency,
        {
          userId: user.id,
          customerEmail: createIntentDto.customerInfo.email,
          customerName: createIntentDto.customerInfo.name,
          itemCount: createIntentDto.cartItems.length.toString(),
        }
      );

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };

    } catch (error) {
      this.logger.error(`Failed to create Payment Intent: ${error.message}`);
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * 🆕 CRÍTICO: Crear orden de PayPal
   */
  @Post('paypal/create-order')
  @ApiOperation({ 
    summary: 'Create PayPal order',
    description: 'Creates a PayPal order for frontend checkout'
  })
  @ApiResponse({ status: 201, description: 'PayPal order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createPayPalOrder(
    @Body() createOrderDto: CreatePayPalOrderDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Creating PayPal order for user ${user.id}, amount: ${createOrderDto.amount}`);

      // Validaciones básicas
      if (!createOrderDto.amount || createOrderDto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      if (!createOrderDto.cartItems || createOrderDto.cartItems.length === 0) {
        throw new BadRequestException('Cart items are required');
      }

      // Preparar items para PayPal
      const paypalItems = createOrderDto.cartItems.map(item => ({
        name: item.name || item.productTitle || 'Digital Product',
        price: item.price || item.currentPrice || 0,
        quantity: item.quantity || 1,
      }));

      // Crear orden en PayPal
      const paypalOrder = await this.paypalService.createOrder({
        amount: createOrderDto.amount,
        currency: createOrderDto.currency,
        items: paypalItems,
        metadata: {
          userId: user.id,
          customerEmail: createOrderDto.customerInfo.email,
          customerName: createOrderDto.customerInfo.name,
        }
      });

      return {
        success: true,
        orderId: paypalOrder.orderId,
        approvalUrl: paypalOrder.approvalUrl,
        status: paypalOrder.status,
      };

    } catch (error) {
      this.logger.error(`Failed to create PayPal order: ${error.message}`);
      throw new BadRequestException(`Failed to create PayPal order: ${error.message}`);
    }
  }

  /**
   * 🆕 CRÍTICO: Capturar pago de PayPal
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

      if (captureResult.status === 'COMPLETED') {
        return {
          success: true,
          status: 'COMPLETED',
          paymentId: captureResult.paymentId,
          amount: captureResult.amount,
          currency: captureResult.currency,
        };
      } else {
        throw new BadRequestException('Payment capture was not completed');
      }

    } catch (error) {
      this.logger.error(`Failed to capture PayPal order: ${error.message}`);
      throw new BadRequestException(`Failed to capture PayPal payment: ${error.message}`);
    }
  }

  /**
   * 🆕 CRÍTICO: Obtener detalles de pago para página de éxito
   */
  @Get('details')
  @ApiOperation({ 
    summary: 'Get payment details',
    description: 'Retrieves payment details for success page'
  })
  @ApiQuery({ name: 'payment_id', required: false, description: 'Stripe Payment Intent ID' })
  @ApiQuery({ name: 'order_id', required: false, description: 'PayPal Order ID' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentDetails(
    @Query('payment_id') paymentId?: string,
    @Query('order_id') orderId?: string,
    @CurrentUser() user?: any,
  ) {
    try {
      if (!paymentId && !orderId) {
        throw new BadRequestException('Either payment_id or order_id is required');
      }

      let paymentDetails;

      if (paymentId) {
        // Stripe payment
        this.logger.log(`Getting Stripe payment details for ${paymentId}`);
        paymentDetails = await this.stripeService.getPaymentDetails(paymentId);
        
        // Verificar que pertenece al usuario (si está autenticado)
        if (user && paymentDetails.metadata?.userId !== user.id) {
          throw new BadRequestException('Unauthorized access to payment details');
        }
      } else if (orderId) {
        // PayPal payment
        this.logger.log(`Getting PayPal payment details for ${orderId}`);
        const paypalDetails = await this.paypalService.getOrderDetails(orderId);
        
        // Convertir formato PayPal a formato estándar
        paymentDetails = {
          paymentId: orderId,
          amount: parseFloat(paypalDetails.purchase_units[0]?.amount?.value || '0'),
          currency: paypalDetails.purchase_units[0]?.amount?.currency_code || 'USD',
          status: paypalDetails.status?.toLowerCase() || 'unknown',
          customerEmail: paypalDetails.payer?.email_address,
          createdAt: paypalDetails.create_time,
        };
      }

      return {
        success: true,
        data: {
          id: paymentDetails.paymentId,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          status: paymentDetails.status,
          method: paymentId ? 'stripe' : 'paypal',
          createdAt: paymentDetails.createdAt,
          orderItems: [
            // Por ahora datos mock, implementar después con datos reales del carrito
            {
              productTitle: 'Productos digitales',
              seller: 'Varios vendedores',
              price: paymentDetails.amount,
            }
          ],
        },
      };

    } catch (error) {
      this.logger.error(`Failed to get payment details: ${error.message}`);
      throw new BadRequestException(`Failed to get payment details: ${error.message}`);
    }
  }

  // ============================================
  // 🔄 MÉTODOS EXISTENTES (MANTENER SIN CAMBIOS)
  // ============================================

  /**
   * 🆕 Iniciar proceso de onboarding para seller
   */
  @Post('setup-seller')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Setup seller for payments',
    description: 'Initiates the Stripe Connect onboarding process for a seller'
  })
  @ApiResponse({ status: 201, description: 'Seller setup initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or seller already setup' })
  @ApiResponse({ status: 409, description: 'Seller already has payment setup' })
  async setupSeller(
    @Body() onboardingDto: SellerOnboardingDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Setting up seller payment for user ${user.id}`);

      // Verificar si el seller ya tiene setup de pagos
      const existingSetup = await this.paymentsService.getSellerPaymentSetup(user.id);
      if (existingSetup && existingSetup.stripeConnectId) {
        throw new ConflictException('Seller already has payment setup configured');
      }

      const result = await this.paymentsService.setupSellerPayments(user.id, onboardingDto);

      return {
        success: true,
        message: 'Seller payment setup initiated',
        data: {
          accountId: result.accountId,
          onboardingUrl: result.onboardingUrl,
          expiresAt: result.expiresAt,
          setupComplete: result.setupComplete,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to setup seller: ${error.message}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to setup seller: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener estado del setup de pagos del seller
   */
  @Get('seller-setup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller payment setup status',
    description: 'Returns the current payment setup status for the authenticated seller'
  })
  @ApiResponse({ status: 200, description: 'Setup status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No payment setup found' })
  async getSellerSetupStatus(@CurrentUser() user: any) {
    try {
      this.logger.log(`Getting setup status for seller ${user.id}`);

      const setup = await this.paymentsService.getSellerPaymentSetup(user.id);
      if (!setup) {
        throw new NotFoundException('No payment setup found for this seller');
      }

      return {
        success: true,
        data: {
          hasStripeAccount: !!setup.stripeConnectId,
          onboardingComplete: setup.onboardingComplete,
          chargesEnabled: setup.chargesEnabled,
          payoutsEnabled: setup.payoutsEnabled,
          requiresAction: setup.requiresAction,
          nextAction: setup.nextAction,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get setup status: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get setup status: ${error.message}`);
    }
  }

  /**
   * 🆕 Configurar preferencias de pago del seller
   */
  @Post('configure')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Configure payment preferences',
    description: 'Configure payout settings and preferences for a seller'
  })
  @ApiResponse({ status: 200, description: 'Payment configuration updated' })
  @ApiResponse({ status: 400, description: 'Invalid configuration or seller not setup' })
  async configurePayments(
    @Body() setupDto: PaymentSetupDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Configuring payments for seller ${user.id}`);

      const result = await this.paymentsService.configureSellerPayments(user.id, setupDto);

      return {
        success: true,
        message: 'Payment configuration updated successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to configure payments: ${error.message}`);
      throw new BadRequestException(`Failed to configure payments: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener balance del seller
   */
  @Get('balance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get seller balance',
    description: 'Returns the current balance and pending amounts for a seller'
  })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getSellerBalance(@CurrentUser() user: any) {
    try {
      this.logger.log(`Getting balance for seller ${user.id}`);

      const balance = await this.paymentsService.getSellerBalance(user.id);

      return {
        success: true,
        data: balance,
      };
    } catch (error) {
      this.logger.error(`Failed to get balance: ${error.message}`);
      throw new BadRequestException(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * 🆕 Test endpoint para verificar funcionamiento
   */
  @Get('test')
  @ApiOperation({ 
    summary: 'Test payments module',
    description: 'Simple test endpoint to verify the module is working'
  })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testPaymentsModule() {
    return {
      success: true,
      message: 'Payments module is working correctly',
      timestamp: new Date().toISOString(),
      module: 'PaymentsModule',
    };
  }

  /**
   * 🧪 Test de conectividad Stripe y PayPal
   */
  @Get('test/connectivity')
  @ApiOperation({ 
    summary: 'Test payment providers connectivity',
    description: 'Tests connectivity to Stripe and PayPal'
  })
  async testConnectivity() {
    try {
      const [stripeTest, paypalTest] = await Promise.allSettled([
        this.stripeService.testConnection(),
        this.paypalService.testConnection(),
      ]);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        stripe: stripeTest.status === 'fulfilled' ? stripeTest.value : { success: false, message: 'Connection failed' },
        paypal: paypalTest.status === 'fulfilled' ? paypalTest.value : { success: false, message: 'Connection failed' },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Connectivity test failed',
        error: error.message,
      };
    }
  }
}