// src/modules/invoices/invoices.controller.ts
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
  BadRequestException,
  Res
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { GenerateInvoiceDto, InvoiceFilterDto } from './dto/generate-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('invoices')
@Controller('api/invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);

  constructor(private readonly invoicesService: InvoicesService) {}

  /**
   * 🆕 Generar invoice desde orden (Seller/Admin)
   */
  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @ApiOperation({ 
    summary: 'Generate invoice from order',
    description: 'Generate an invoice for a completed order'
  })
  @ApiResponse({ status: 201, description: 'Invoice generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order or invoice already exists' })
  async generateInvoice(
    @Body() generateDto: GenerateInvoiceDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Generating invoice for order ${generateDto.orderId} by user ${user.id}`);

      const invoices = await this.invoicesService.generateInvoiceFromOrder(generateDto.orderId, generateDto);

      return {
        success: true,
        message: 'Invoice(s) generated successfully',
        data: invoices,
      };
    } catch (error) {
      this.logger.error(`Failed to generate invoice: ${error.message}`);
      throw new BadRequestException(`Failed to generate invoice: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener mis invoices (Seller)
   */
  @Get('my-invoices')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiOperation({ 
    summary: 'Get seller invoices',
    description: 'Get paginated list of invoices for authenticated seller'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED'] })
  @ApiQuery({ name: 'currency', required: false, enum: ['USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS'] })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async getMyInvoices(
    @CurrentUser() user: any,
    @Query() filters: InvoiceFilterDto,
  ) {
    try {
      this.logger.log(`Getting invoices for seller ${user.id}`);

      const result = await this.invoicesService.getSellerInvoices(user.id, filters);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      this.logger.error(`Failed to get invoices: ${error.message}`);
      throw new BadRequestException(`Failed to get invoices: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener detalles de invoice específica
   */
  @Get(':invoiceId')
  @ApiOperation({ 
    summary: 'Get invoice details',
    description: 'Get detailed information about a specific invoice'
  })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceDetails(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Getting invoice details ${invoiceId} for user ${user.id}`);

      const invoice = await this.invoicesService.getInvoiceById(invoiceId, user.id, user.role);

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      this.logger.error(`Failed to get invoice details: ${error.message}`);
      throw new BadRequestException(`Failed to get invoice details: ${error.message}`);
    }
  }

  /**
   * 🆕 Descargar PDF de invoice
   */
  @Get(':invoiceId/pdf')
  @ApiOperation({ 
    summary: 'Download invoice PDF',
    description: 'Download PDF version of the invoice'
  })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'PDF downloaded successfully' })
  async downloadInvoicePDF(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`Downloading PDF for invoice ${invoiceId} by user ${user.id}`);

      // Verificar permisos
      await this.invoicesService.getInvoiceById(invoiceId, user.id, user.role);

      // Generar PDF
      const pdfUrl = await this.invoicesService.generateInvoicePDF(invoiceId);

      // TODO: En implementación real, retornar el archivo PDF
      // Por ahora retornamos la URL
      return res.json({
        success: true,
        data: {
          pdfUrl,
          downloadUrl: `${process.env.API_URL}${pdfUrl}`,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to download invoice PDF: ${error.message}`);
      throw new BadRequestException(`Failed to download invoice PDF: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener estadísticas de mis invoices (Seller)
   */
  @Get('my-invoices/statistics')
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  @ApiOperation({ 
    summary: 'Get seller invoice statistics',
    description: 'Get invoice statistics for authenticated seller'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for stats' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for stats' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getMyInvoiceStatistics(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      this.logger.log(`Getting invoice statistics for seller ${user.id}`);

      const stats = await this.invoicesService.getInvoiceStatistics({ 
        startDate, 
        endDate, 
        sellerId: user.id 
      });

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get invoice statistics: ${error.message}`);
      throw new BadRequestException(`Failed to get invoice statistics: ${error.message}`);
    }
  }

  // ==========================================
  // 🔐 ADMIN ENDPOINTS
  // ==========================================

  /**
   * 🆕 Obtener todas las invoices (Admin)
   */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Get all invoices (Admin)',
    description: 'Get paginated list of all invoices across all sellers'
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'currency', required: false })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by seller ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in invoice numbers and order numbers' })
  @ApiResponse({ status: 200, description: 'All invoices retrieved successfully' })
  async getAllInvoices(
    @CurrentUser() user: any,
    @Query() filters: InvoiceFilterDto,
  ) {
    try {
      this.logger.log(`Admin ${user.id} getting all invoices`);

      const result = await this.invoicesService.getAllInvoices(filters);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: result.filters,
      };
    } catch (error) {
      this.logger.error(`Failed to get all invoices: ${error.message}`);
      throw new BadRequestException(`Failed to get all invoices: ${error.message}`);
    }
  }

  /**
   * 🆕 Actualizar estado de invoice (Admin)
   */
  @Put('admin/:invoiceId/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Update invoice status (Admin)',
    description: 'Update the status of an invoice'
  })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice status updated successfully' })
  async updateInvoiceStatus(
    @Param('invoiceId') invoiceId: string,
    @Body() body: { status: 'PENDING' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED' },
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`Admin ${user.id} updating invoice ${invoiceId} status to ${body.status}`);

      const result = await this.invoicesService.updateInvoiceStatus(invoiceId, body.status);

      return {
        success: true,
        message: 'Invoice status updated successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to update invoice status: ${error.message}`);
      throw new BadRequestException(`Failed to update invoice status: ${error.message}`);
    }
  }

  /**
   * 🆕 Procesar invoices vencidas (Admin)
   */
  @Post('admin/process-overdue')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Process overdue invoices (Admin)',
    description: 'Mark overdue invoices and send notifications'
  })
  @ApiResponse({ status: 200, description: 'Overdue invoices processed successfully' })
  async processOverdueInvoices(@CurrentUser() user: any) {
    try {
      this.logger.log(`Admin ${user.id} processing overdue invoices`);

      const result = await this.invoicesService.processOverdueInvoices();

      return {
        success: true,
        message: `Processed ${result.processed} overdue invoices`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to process overdue invoices: ${error.message}`);
      throw new BadRequestException(`Failed to process overdue invoices: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener estadísticas de invoices (Admin)
   */
  @Get('admin/statistics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Get invoice statistics (Admin)',
    description: 'Get comprehensive statistics about invoices across the platform'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for stats' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for stats' })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by specific seller' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getInvoiceStatistics(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    try {
      this.logger.log(`Admin ${user.id} getting invoice statistics`);

      const stats = await this.invoicesService.getInvoiceStatistics({ 
        startDate, 
        endDate, 
        sellerId 
      });

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get invoice statistics: ${error.message}`);
      throw new BadRequestException(`Failed to get invoice statistics: ${error.message}`);
    }
  }

  /**
   * 🆕 Obtener invoices por seller específico (Admin)
   */
  @Get('admin/seller/:sellerId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Get invoices by seller (Admin)',
    description: 'Get all invoices for a specific seller'
  })
  @ApiParam({ name: 'sellerId', description: 'Seller user ID' })
  @ApiResponse({ status: 200, description: 'Seller invoices retrieved successfully' })
  async getSellerInvoicesAdmin(
    @Param('sellerId') sellerId: string,
    @CurrentUser() user: any,
    @Query() filters: InvoiceFilterDto,
  ) {
    try {
      this.logger.log(`Admin ${user.id} getting invoices for seller ${sellerId}`);

      const result = await this.invoicesService.getSellerInvoices(sellerId, filters);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        sellerId,
      };
    } catch (error) {
      this.logger.error(`Failed to get seller invoices: ${error.message}`);
      throw new BadRequestException(`Failed to get seller invoices: ${error.message}`);
    }
  }
}