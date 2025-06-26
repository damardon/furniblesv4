// src/modules/fees/fees.controller.ts - CORREGIDO

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// DTOs temporales hasta que se creen los archivos específicos
interface CreateFeeConfigDto {
  name: string;
  type: 'PLATFORM_FEE' | 'PAYMENT_PROCESSING' | 'TAX' | 'REGIONAL_FEE';
  country?: string;
  category?: string;
  paymentMethod?: string;
  sellerTier?: string;
  isPercentage: boolean;
  value: number;
  minAmount?: number;
  maxAmount?: number;
  priority?: number;
  description?: string;
  validFrom?: Date;
  validUntil?: Date;
}

interface UpdateFeeConfigDto {
  name?: string;
  type?: 'PLATFORM_FEE' | 'PAYMENT_PROCESSING' | 'TAX' | 'REGIONAL_FEE';
  country?: string;
  category?: string;
  paymentMethod?: string;
  sellerTier?: string;
  isPercentage?: boolean;
  value?: number;
  minAmount?: number;
  maxAmount?: number;
  priority?: number;
  description?: string;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
}

@ApiTags('Fee Configuration')
@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Crear configuración de fee',
    description: 'Crea una nueva configuración de fee. Solo administradores.'
  })
  @ApiResponse({
    status: 201,
    description: 'Configuración de fee creada exitosamente'
  })
  @ApiResponse({
    status: 403,
    description: 'Solo administradores pueden crear configuraciones de fee'
  })
  async createFeeConfig(@Body() dto: CreateFeeConfigDto) {
    return this.feesService.createFeeConfig(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Obtener configuraciones de fee',
    description: 'Retorna las configuraciones de fee activas. Administradores ven todas, sellers solo las que les aplican.'
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo de fee' })
  @ApiQuery({ name: 'country', required: false, description: 'Filtrar por país' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrar por categoría' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por estado activo' })
  @ApiResponse({
    status: 200,
    description: 'Configuraciones obtenidas exitosamente'
  })
  async getFeeConfigs(
    @Query('type') type?: string,
    @Query('country') country?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string
  ) {
    const filters: any = {};
    
    if (type) filters.type = type;
    if (country) filters.country = country;
    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    return this.feesService.getFeeConfigs(filters);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Actualizar configuración de fee',
    description: 'Actualiza una configuración de fee existente. Solo administradores.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la configuración de fee'
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración no encontrada'
  })
  async updateFeeConfig(
    @Param('id') id: string,
    @Body() dto: UpdateFeeConfigDto
  ) {
    return this.feesService.updateFeeConfig(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Desactivar configuración de fee',
    description: 'Desactiva una configuración de fee. Solo administradores.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la configuración de fee'
  })
  @ApiResponse({
    status: 204,
    description: 'Configuración desactivada exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración no encontrada'
  })
  async deactivateFeeConfig(@Param('id') id: string): Promise<void> {
    await this.feesService.deactivateFeeConfig(id);
  }

  // ============================================
  // ENDPOINTS ADICIONALES PARA SELLERS
  // ============================================

  @Get('calculate')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Calcular fees para una venta',
    description: 'Calcula los fees que se aplicarían a una venta específica'
  })
  @ApiQuery({ name: 'amount', required: true, description: 'Monto de la venta' })
  @ApiQuery({ name: 'country', required: false, description: 'País del comprador' })
  @ApiQuery({ name: 'category', required: false, description: 'Categoría del producto' })
  @ApiQuery({ name: 'paymentMethod', required: false, description: 'Método de pago' })
  @ApiResponse({
    status: 200,
    description: 'Cálculo de fees realizado exitosamente'
  })
  async calculateFees(
    @Query('amount') amount: string,
    @Query('country') country?: string,
    @Query('category') category?: string,
    @Query('paymentMethod') paymentMethod?: string
  ) {
    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    return this.feesService.calculateAdvancedFees({
      amount: numericAmount,
      country,
      category,
      paymentMethod
    });
  }

  @Get('validate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Validar configuración de fee',
    description: 'Valida una configuración de fee antes de crearla'
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada'
  })
  async validateFeeConfig(@Body() dto: CreateFeeConfigDto) {
    return this.feesService.validateFeeConfig(dto);
  }
}