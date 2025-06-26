// src/modules/payouts/payouts.controller.ts - COMPLETO Y CORREGIDO
import { 
  Controller, 
  Post, 
  Get, 
  Put,
  Body, 
  Param, 
  Query,
  Logger, 
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { PayoutFilterDto } from './dto/payout-filter.dto';
import { UpdatePayoutDto, PayoutActionDto } from './dto/update-payout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('payouts')
@Controller('api/payouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PayoutsController {
  private readonly logger = new Logger(PayoutsController.name);

  constructor(private readonly payoutsService: PayoutsService) {}

  /**
   * 🆕 Solicitar payout individual (Seller)
   */
  @Post('request')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiOperation({ 
    summary: 'Request individual payout',
    description: 'Request a payout of available balance for authenticated seller'
  })
  @ApiResponse({ status: 201, description: 'Payout requested successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient balance' })
  async requestPayout(
    @Body() requestDto: RequestPayoutDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Payout request from seller ${user.id}`);

      const result = await this.payoutsService.requestPayout(user.id, requestDto);

      return {
        success: true,
        message: 'Payout requested successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to request payout: ${error.message}`);
      throw new BadRequestException(`Failed to request payout: ${error.message}`);
    }
  }

  /**
   * 🆕 Verificar elegibilidad para payout (Seller)
   */
  @Get('eligibility')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiOperation({ 
    summary: 'Check payout eligibility',
    description: 'Check if seller is eligible for payouts and available balance'
  })
  @ApiResponse({ status: 200, description: 'Eligibility checked successfully' })
  async checkEligibility(@CurrentUser() user: any) {
    try {
      this.logger.log(`Checking payout eligibility for seller ${user.id}`);

      const eligibility = await this.payoutsService.checkPayoutEligibility(user.id);

      return {
        success: true,
        data: eligibility,
      };
    } catch (error) {
      this.logger.error(`Failed to check eligibility: ${error.message}`);
      throw new BadRequestException(`Failed to check eligibility: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener mis payouts (Seller)
   */
  @Get('my-payouts')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiOperation({ 
    summary: 'Get seller payouts',
    description: 'Get paginated list of payouts for authenticated seller'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'] })
  @ApiQuery({ name: 'currency', required: false, enum: ['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'] })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Payouts retrieved successfully' })
  async getMyPayouts(
    @CurrentUser() user: any,
    @Query() filters: PayoutFilterDto,
  ) {
    try {
      this.logger.log(`Getting payouts for seller ${user.id}`);

      const result = await this.payoutsService.getSellerPayouts(user.id, filters);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      this.logger.error(`Failed to get payouts: ${error.message}`);
      throw new BadRequestException(`Failed to get payouts: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener detalles de payout específico
   */
  @Get(':payoutId')
  @ApiOperation({ 
    summary: 'Get payout details',
    description: 'Get detailed information about a specific payout'
  })
  @ApiParam({ name: 'payoutId', description: 'Payout ID' })
  @ApiResponse({ status: 200, description: 'Payout details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  async getPayoutDetails(
    @Param('payoutId') payoutId: string,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Getting payout details ${payoutId} for user ${user.id}`);

      const payout = await this.payoutsService.getPayoutById(payoutId, user.id, user.role);

      return {
        success: true,
        data: payout,
      };
    } catch (error) {
      this.logger.error(`Failed to get payout details: ${error.message}`);
      throw new BadRequestException(`Failed to get payout details: ${error.message}`);
    }
  }

  // ==========================================
  // 🔐 ADMIN ENDPOINTS
  // ==========================================

  /**
   * 🆕 Obtener todos los payouts (Admin)
   */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Get all payouts (Admin)',
    description: 'Get paginated list of all payouts across all sellers'
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'currency', required: false })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by seller ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in descriptions and seller names' })
  @ApiResponse({ status: 200, description: 'All payouts retrieved successfully' })
  async getAllPayouts(
    @CurrentUser() user: any,
    @Query() filters: PayoutFilterDto,
  ) {
    try {
      this.logger.log(`Admin ${user.id} getting all payouts`);

      const result = await this.payoutsService.getAllPayouts(filters);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: result.filters,
      };
    } catch (error) {
      this.logger.error(`Failed to get all payouts: ${error.message}`);
      throw new BadRequestException(`Failed to get all payouts: ${error.message}`);
    }
  }

  /**
   * 🆕 Actualizar payout (Admin)
   */
  @Put('admin/:payoutId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Update payout (Admin)',
    description: 'Update payout status, description, or other fields'
  })
  @ApiParam({ name: 'payoutId', description: 'Payout ID' })
  @ApiResponse({ status: 200, description: 'Payout updated successfully' })
  async updatePayout(
    @Param('payoutId') payoutId: string,
    @Body() updateDto: UpdatePayoutDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Admin ${user.id} updating payout ${payoutId}`);

      const result = await this.payoutsService.updatePayout(payoutId, updateDto, user.id);

      return {
        success: true,
        message: 'Payout updated successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to update payout: ${error.message}`);
      throw new BadRequestException(`Failed to update payout: ${error.message}`);
    }
  }

  /**
   * 🆕 Ejecutar acción en payout (Admin)
   */
  @Post('admin/:payoutId/actions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Execute payout action (Admin)',
    description: 'Execute actions like retry, cancel, approve, or reject on a payout'
  })
  @ApiParam({ name: 'payoutId', description: 'Payout ID' })
  @ApiResponse({ status: 200, description: 'Action executed successfully' })
  async executePayoutAction(
    @Param('payoutId') payoutId: string,
    @Body() actionDto: PayoutActionDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Admin ${user.id} executing action ${actionDto.action} on payout ${payoutId}`);

      const result = await this.payoutsService.executePayoutAction(payoutId, actionDto, user.id);

      return {
        success: true,
        message: `Action ${actionDto.action} executed successfully`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to execute payout action: ${error.message}`);
      throw new BadRequestException(`Failed to execute payout action: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener estadísticas de payouts (Admin)
   */
  @Get('admin/statistics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Get payout statistics (Admin)',
    description: 'Get comprehensive statistics about payouts across the platform'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for stats' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for stats' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getPayoutStatistics(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      this.logger.log(`Admin ${user.id} getting payout statistics`);

      const stats = await this.payoutsService.getPayoutStatistics({ startDate, endDate });

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get payout statistics: ${error.message}`);
      throw new BadRequestException(`Failed to get payout statistics: ${error.message}`);
    }
  }
}