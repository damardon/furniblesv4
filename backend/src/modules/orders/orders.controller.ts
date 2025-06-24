import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
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
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Crear orden desde carrito',
    description: 'Crea una nueva orden basada en los productos del carrito del usuario.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Orden creada exitosamente',
    type: OrderResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Carrito vacío o productos inválidos' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Solo compradores pueden crear órdenes' 
  })
  async createOrder(
    @Request() req,
    @Body() dto: CreateOrderDto
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get('my')
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Obtener mis órdenes como comprador',
    description: 'Retorna todas las órdenes del usuario autenticado como comprador.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Órdenes obtenidas exitosamente',
    type: PaginatedOrdersDto 
  })
  async getMyOrders(
    @Request() req,
    @Query() filters: OrderFiltersDto
  ): Promise<PaginatedOrdersDto> {
    return this.ordersService.getBuyerOrders(req.user.id, filters);
  }

  @Get('sales')
  @Roles(UserRole.SELLER)
  @ApiOperation({ 
    summary: 'Obtener mis ventas como seller',
    description: 'Retorna todas las órdenes donde el usuario autenticado ha vendido productos.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Ventas obtenidas exitosamente',
    type: PaginatedOrdersDto 
  })
  async getMySales(
    @Request() req,
    @Query() filters: OrderFiltersDto
  ): Promise<PaginatedOrdersDto> {
    return this.ordersService.getSellerOrders(req.user.id, filters);
  }

  @Get(':id')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @ApiOperation({ 
    summary: 'Obtener orden por ID',
    description: 'Retorna los detalles de una orden específica. Solo visible para el comprador o sellers involucrados.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la orden' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Orden obtenida exitosamente',
    type: OrderResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Orden no encontrada o sin permisos' 
  })
  async getOrderById(
    @Request() req,
    @Param('id') orderId: string
  ): Promise<OrderResponseDto> {
    return this.ordersService.getOrderById(orderId, req.user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Cancelar orden',
    description: 'Cancela una orden pendiente. Solo el comprador o admin pueden cancelar.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la orden' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Orden cancelada exitosamente' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Orden no encontrada' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Orden no se puede cancelar en su estado actual' 
  })
  async cancelOrder(
    @Request() req,
    @Param('id') orderId: string,
    @Body() body: { reason?: string }
  ): Promise<void> {
    return this.ordersService.cancelOrder(orderId, body.reason);
  }
}
