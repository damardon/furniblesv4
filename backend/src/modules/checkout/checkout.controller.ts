// src/modules/checkout/checkout.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
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
  ApiParam
} from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { 
  CheckoutDto, 
  CheckoutResponseDto, 
  CheckoutDetailsDto 
} from './dto/checkout.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Checkout')
@Controller('checkout')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Iniciar proceso de checkout',
    description: 'Crea una sesión de Stripe Checkout para procesar el pago de los productos en el carrito.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sesión de checkout creada exitosamente',
    type: CheckoutResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Carrito vacío o productos inválidos' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Solo compradores pueden realizar checkout' 
  })
  async createCheckoutSession(
    @Request() req,
    @Body() dto: CheckoutDto
  ): Promise<CheckoutResponseDto> {
    return this.checkoutService.createCheckoutSession(req.user.id, dto);
  }

  @Get('orders/:orderId')
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Obtener detalles de checkout',
    description: 'Retorna los detalles de una orden en proceso de checkout.'
  })
  @ApiParam({ 
    name: 'orderId', 
    description: 'ID de la orden' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detalles obtenidos exitosamente',
    type: CheckoutDetailsDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Orden no encontrada' 
  })
  async getCheckoutDetails(
    @Request() req,
    @Param('orderId') orderId: string
  ): Promise<CheckoutDetailsDto> {
    return this.checkoutService.getCheckoutDetails(orderId, req.user.id);
  }

  @Post('orders/:orderId/reactivate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Reactivar checkout',
    description: 'Reactiva una sesión de checkout para una orden pendiente.'
  })
  @ApiParam({ 
    name: 'orderId', 
    description: 'ID de la orden' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Checkout reactivado exitosamente',
    type: CheckoutResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Orden no se puede reactivar o ha expirado' 
  })
  async reactivateCheckout(
    @Request() req,
    @Param('orderId') orderId: string
  ): Promise<CheckoutResponseDto> {
    return this.checkoutService.reactivateCheckout(orderId, req.user.id);
  }

  @Delete('orders/:orderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Cancelar checkout',
    description: 'Cancela una sesión de checkout activa.'
  })
  @ApiParam({ 
    name: 'orderId', 
    description: 'ID de la orden' 
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Checkout cancelado exitosamente' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Orden no se puede cancelar' 
  })
  async cancelCheckoutSession(
    @Request() req,
    @Param('orderId') orderId: string
  ): Promise<void> {
    return this.checkoutService.cancelCheckoutSession(orderId, req.user.id);
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Analytics de checkout (Admin)',
    description: 'Estadísticas de conversión y checkout para administradores.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics obtenidos exitosamente' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Solo administradores pueden ver analytics' 
  })
  async getCheckoutAnalytics(@Request() req) {
    // TODO: Agregar filtros de fecha desde query params
    return this.checkoutService.getCheckoutAnalytics();
  }
}