// src/modules/transactions/transactions.controller.ts
import { 
  Controller, 
  Get, 
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
import { TransactionsService } from './transactions.service';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('transactions')
@Controller('api/transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * 🆕 Obtener mis transacciones (Seller)
   */
  @Get('my-transactions')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiOperation({ 
    summary: 'Get seller transactions',
    description: 'Get paginated list of transactions for authenticated seller'
  })
  @ApiQuery({ name: 'type', required: false, enum: ['SALE', 'PLATFORM_FEE', 'STRIPE_FEE', 'PAYOUT', 'REFUND', 'CHARGEBACK'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] })
  @ApiQuery({ name: 'currency', required: false, enum: ['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'] })
  @ApiQuery({ name: 'orderId', required: false, description: 'Filter by order ID' })
  @ApiQuery({ name: 'payoutId', required: false, description: 'Filter by payout ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getMyTransactions(
    @CurrentUser() user: any,
    @Query() filters: TransactionFilterDto,
  ) {
    try {
      this.logger.log(`Getting transactions for seller ${user.id}`);

      const result = await this.transactionsService.getSellerTransactions(user.id, filters);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      this.logger.error(`Failed to get transactions: ${error.message}`);
      throw new BadRequestException(`Failed to get transactions: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener detalles de transacción específica
   */
  @Get(':transactionId')
  @ApiOperation({ 
    summary: 'Get transaction details',
    description: 'Get detailed information about a specific transaction'
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionDetails(
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Getting transaction details ${transactionId} for user ${user.id}`);

      const transaction = await this.transactionsService.getTransactionById(transactionId, user.id, user.role);

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction details: ${error.message}`);
      throw new BadRequestException(`Failed to get transaction details: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener estadísticas de mis transacciones (Seller)
   */
  @Get('my-transactions/statistics')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiOperation({ 
    summary: 'Get seller transaction statistics',
    description: 'Get transaction statistics for authenticated seller'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for stats' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for stats' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getMyTransactionStatistics(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      this.logger.log(`Getting transaction statistics for seller ${user.id}`);

      const stats = await this.transactionsService.getTransactionStatistics({ 
        startDate, 
        endDate, 
        sellerId: user.id 
      });

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction statistics: ${error.message}`);
      throw new BadRequestException(`Failed to get transaction statistics: ${error.message}`);
    }
  }

  // ==========================================
  // 🔐 ADMIN ENDPOINTS
  // ==========================================

  /**
   * 🆕 Obtener todas las transacciones (Admin)
   */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Get all transactions (Admin)',
    description: 'Get paginated list of all transactions across all sellers'
  })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'currency', required: false })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by seller ID' })
  @ApiQuery({ name: 'orderId', required: false, description: 'Filter by order ID' })
  @ApiQuery({ name: 'payoutId', required: false, description: 'Filter by payout ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in descriptions and IDs' })
  @ApiResponse({ status: 200, description: 'All transactions retrieved successfully' })
  async getAllTransactions(
    @CurrentUser() user: any,
    @Query() filters: TransactionFilterDto,
  ) {
    try {
      this.logger.log(`Admin ${user.id} getting all transactions`);

      const result = await this.transactionsService.getAllTransactions(filters);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: result.filters,
      };
    } catch (error) {
      this.logger.error(`Failed to get all transactions: ${error.message}`);
      throw new BadRequestException(`Failed to get all transactions: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener estadísticas de transacciones (Admin)
   */
  @Get('admin/statistics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Get transaction statistics (Admin)',
    description: 'Get comprehensive statistics about transactions across the platform'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for stats' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for stats' })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by specific seller' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getTransactionStatistics(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    try {
      this.logger.log(`Admin ${user.id} getting transaction statistics`);

      const stats = await this.transactionsService.getTransactionStatistics({ 
        startDate, 
        endDate, 
        sellerId 
      });

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction statistics: ${error.message}`);
      throw new BadRequestException(`Failed to get transaction statistics: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener transacciones por seller específico (Admin)
   */
  @Get('admin/seller/:sellerId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Get transactions by seller (Admin)',
    description: 'Get all transactions for a specific seller'
  })
  @ApiParam({ name: 'sellerId', description: 'Seller user ID' })
  @ApiResponse({ status: 200, description: 'Seller transactions retrieved successfully' })
  async getSellerTransactionsAdmin(
    @Param('sellerId') sellerId: string,
    @CurrentUser() user: any,
    @Query() filters: TransactionFilterDto,
  ) {
    try {
      this.logger.log(`Admin ${user.id} getting transactions for seller ${sellerId}`);

      const result = await this.transactionsService.getSellerTransactions(sellerId, filters);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        sellerId,
      };
    } catch (error) {
      this.logger.error(`Failed to get seller transactions: ${error.message}`);
      throw new BadRequestException(`Failed to get seller transactions: ${error.message}`);
    }
  }
}