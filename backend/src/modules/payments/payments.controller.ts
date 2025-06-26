// src/modules/payments/payments.controller.ts - VERSIÓN LIMPIA FINAL
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

// ✅ Imports relativos correctos (funcionan después de limpiar cache)
import { PaymentsService } from './payments.service';
import { SellerOnboardingDto } from './dto/seller-onboarding.dto';
import { PaymentSetupDto } from './dto/payment-setup.dto';
import { BalanceRequestDto, PayoutHistoryRequestDto } from './dto/balance-request.dto';

// ✅ Imports de auth (verificar que existan)
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('payments')
@Controller('api/payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

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
}