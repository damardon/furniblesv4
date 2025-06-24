// src/modules/admin/admin-orders.controller.ts - CORREGIDO
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
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
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderFiltersDto } from '../orders/dto/order-filters.dto';
import { PaginatedOrdersDto } from '../orders/dto/paginated-orders.dto';
import { UserRole, OrderStatus } from '@prisma/client';

@ApiTags('Admin - Orders')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todas las órdenes (Admin)',
    description: 'Retorna todas las órdenes del sistema con filtros avanzados. Solo administradores.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Órdenes obtenidas exitosamente',
    type: PaginatedOrdersDto 
  })
  async getAllOrders(
    @Query() filters: OrderFiltersDto
  ): Promise<PaginatedOrdersDto> {
    // Implementación real usando método existente pero sin filtro de usuario
    return this.ordersService.getAllOrdersAdmin(filters);
  }

  @Get('analytics')
  @ApiOperation({ 
    summary: 'Obtener analytics de órdenes',
    description: 'Retorna estadísticas y métricas de las órdenes del sistema.'
  })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics obtenidos exitosamente'
  })
  async getOrderAnalytics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    return this.ordersService.getOrderAnalytics({
      fromDate,
      toDate
    });
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Procesar reembolso',
    description: 'Procesa un reembolso para una orden específica.'
  })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reembolso procesado exitosamente' 
  })
  async processRefund(
    @Param('id') orderId: string,
    @Body() body: { amount?: number; reason?: string }
  ) {
    return this.ordersService.processRefund(orderId, body.amount, body.reason);
  }

  @Put(':id/status')
  @ApiOperation({ 
    summary: 'Actualizar estado de orden',
    description: 'Actualiza manualmente el estado de una orden.'
  })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado actualizado exitosamente' 
  })
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() body: { status: OrderStatus; reason?: string }
  ) {
    return this.ordersService.updateOrderStatus(orderId, body.status, body.reason);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener orden específica (Admin)',
    description: 'Obtiene detalles completos de cualquier orden. Solo administradores.'
  })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({ 
    status: 200, 
    description: 'Orden obtenida exitosamente' 
  })
  async getOrderById(@Param('id') orderId: string) {
    return this.ordersService.getOrderById(orderId); // Sin filtro de usuario para admin
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cancelar orden (Admin)',
    description: 'Cancela una orden específica. Solo administradores.'
  })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({ 
    status: 200, 
    description: 'Orden cancelada exitosamente' 
  })
  async cancelOrder(
    @Param('id') orderId: string,
    @Body() body: { reason?: string }
  ) {
    return this.ordersService.cancelOrder(orderId, body.reason);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Completar orden manualmente (Admin)',
    description: 'Marca una orden como completada manualmente. Solo administradores.'
  })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({ 
    status: 200, 
    description: 'Orden completada exitosamente' 
  })
  async completeOrder(@Param('id') orderId: string) {
    return this.ordersService.completeOrder(orderId);
  }
}