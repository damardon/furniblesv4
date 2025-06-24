import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AdminAnalyticsService } from './admin-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminAnalyticsFiltersDto } from './dto/admin-analytics.dto';
import { AdminDashboardDto } from './dto/analytics-response.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Admin - Analytics')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener dashboard completo de analytics',
    description: 'Retorna todas las métricas y estadísticas del marketplace para administradores.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard de analytics obtenido exitosamente',
    type: AdminDashboardDto 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Solo administradores pueden acceder a analytics' 
  })
  async getDashboard(
    @Query() filters: AdminAnalyticsFiltersDto
  ): Promise<AdminDashboardDto> {
    return this.analyticsService.getDashboard(filters);
  }

  @Get('orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Analytics específicos de órdenes',
    description: 'Métricas detalladas sobre órdenes, ventas y conversiones.'
  })
  async getOrderAnalytics(@Query() filters: AdminAnalyticsFiltersDto) {
    return this.analyticsService.getOrderAnalytics(filters);
  }

  @Get('products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Analytics específicos de productos',
    description: 'Métricas sobre productos, descargas y ratings.'
  })
  async getProductAnalytics(@Query() filters: AdminAnalyticsFiltersDto) {
    return this.analyticsService.getProductAnalytics(filters);
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Analytics específicos de usuarios',
    description: 'Métricas sobre usuarios, sellers y buyers.'
  })
  async getUserAnalytics(@Query() filters: AdminAnalyticsFiltersDto) {
    return this.analyticsService.getUserAnalytics(filters);
  }

  @Get('financial')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Analytics financieros',
    description: 'Métricas sobre ingresos, fees y payouts.'
  })
  async getFinancialAnalytics(@Query() filters: AdminAnalyticsFiltersDto) {
    return this.analyticsService.getFinancialAnalytics(filters);
  }
}