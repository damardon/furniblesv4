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
import { 
  CreatefeeConfigDto, 
  UpdatefeeConfigDto, 
  FeeConfigResponseDto 
} from './dto/fee-config.dto';
import { UserRole } from '@prisma/client';

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
    description: 'Configuración de fee creada exitosamente',
    type: FeeConfigResponseDto 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Solo administradores pueden crear configuraciones de fee' 
  })
  async createFeeConfig(@Body() dto: CreatefeeConfigDto): Promise<FeeConfigResponseDto> {
    return this.feesService.createfeeConfig(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ 
    summary: 'Obtener configuraciones de fee',
    description: 'Retorna las configuraciones de fee activas. Administradores ven todas, sellers solo las que les aplican.'
  })
  @ApiQuery({ name: 'country', required: false, description: 'Filtrar por país' })
  @ApiQuery({ name: 'active', required: false, description: 'Filtrar por estado activo' })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuraciones obtenidas exitosamente',
    type: [FeeConfigResponseDto] 
  })
  async getFeeConfigs(
    @Query('country') country?: string,
    @Query('active') active?: string
  ): Promise<FeeConfigResponseDto[]> {
    const isActive = active !== undefined ? active === 'true' : undefined;
    return this.feesService.getfeeConfigs(country, isActive);
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
    description: 'Configuración actualizada exitosamente',
    type: FeeConfigResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Configuración no encontrada' 
  })
  async updateFeeConfig(
    @Param('id') id: string,
    @Body() dto: UpdatefeeConfigDto
  ): Promise<FeeConfigResponseDto> {
    return this.feesService.updatefeeConfig(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Eliminar configuración de fee',
    description: 'Elimina una configuración de fee. Solo administradores.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la configuración de fee' 
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Configuración eliminada exitosamente' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Configuración no encontrada' 
  })
  async deletefeeConfig(@Param('id') id: string): Promise<FeeConfigResponseDto> {
    return this.feesService.deletefeeConfig(id);
  }
}