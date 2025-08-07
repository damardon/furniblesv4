import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ProductStatus, UserStatus } from '@prisma/client';

@ApiTags('Admin - Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 📊 DASHBOARD
  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Obtener overview del dashboard administrativo',
    description: 'Retorna métricas básicas de la plataforma para el dashboard admin.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard overview obtenido exitosamente' 
  })
  async getDashboardOverview() {
    return this.adminService.getDashboardOverview();
  }

  // 👥 GESTIÓN DE USUARIOS
  @Get('users')
  @ApiOperation({ 
    summary: 'Obtener todos los usuarios',
    description: 'Lista paginada de todos los usuarios del sistema.'
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuarios obtenidos exitosamente' 
  })
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('role') role?: UserRole
  ) {
    return this.adminService.getAllUsers(page, limit, role);
  }

  @Put('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Actualizar estado de usuario',
    description: 'Actualiza el estado de un usuario (activo/inactivo/suspendido).'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado de usuario actualizado exitosamente' 
  })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: { status: UserStatus }
  ) {
    return this.adminService.updateUserStatus(userId, body.status);
  }

  // 📦 MODERACIÓN DE PRODUCTOS
  @Get('products/pending')
  @ApiOperation({ 
    summary: 'Obtener productos pendientes de moderación',
    description: 'Lista paginada de productos pendientes de aprobación.'
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'Productos pendientes obtenidos exitosamente' 
  })
  async getPendingProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    return this.adminService.getPendingProducts(page, limit);
  }

  @Get('products/:id')
@ApiOperation({ 
  summary: 'Obtener producto específico para moderación',
  description: 'Retorna un producto específico con toda su información para moderación admin.'
})
@ApiParam({ name: 'id', description: 'ID del producto' })
@ApiResponse({ 
  status: 200, 
  description: 'Producto obtenido exitosamente' 
})
@ApiResponse({ 
  status: 404, 
  description: 'Producto no encontrado' 
})
async getProductById(@Param('id') productId: string) {
  return this.adminService.getProductById(productId);
}

  @Put('products/:id/moderate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Moderar producto',
    description: 'Aprueba, rechaza o suspende un producto.'
  })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto moderado exitosamente' 
  })
  async moderateProduct(
    @Param('id') productId: string,
    @Body() body: { status: ProductStatus; reason?: string }
  ) {
    return this.adminService.moderateProduct(productId, body.status, body.reason);
  }

  // 🔧 SISTEMA
  @Get('health')
  @ApiOperation({ 
    summary: 'Verificar salud del sistema',
    description: 'Retorna métricas de salud y estado del sistema.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Métricas de salud obtenidas exitosamente' 
  })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}