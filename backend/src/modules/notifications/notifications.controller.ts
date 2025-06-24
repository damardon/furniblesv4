import {
  Controller,
  Get,
  Post,
  Put,
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
import { NotificationService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationResponseDto } from './dto/notification.dto';
import { Transform } from 'class-transformer';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener notificaciones del usuario',
    description: 'Retorna las notificaciones del usuario autenticado con paginación.'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificaciones obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/NotificationResponseDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        unreadCount: { type: 'number' }
      }
    }
  })
  async getNotifications(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.notificationService.getUserNotifications(
      req.user.id, 
      parseInt(page) || 1, 
      parseInt(limit) || 20
    );
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Marcar notificación como leída',
    description: 'Marca una notificación específica como leída.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la notificación' 
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Notificación marcada como leída' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notificación no encontrada' 
  })
  async markAsRead(
    @Request() req,
    @Param('id') notificationId: string
  ): Promise<void> {
    return this.notificationService.markAsRead(notificationId, req.user.id);
  }

  @Put('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Marcar todas las notificaciones como leídas',
    description: 'Marca todas las notificaciones no leídas del usuario como leídas.'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Todas las notificaciones marcadas como leídas' 
  })
  async markAllAsRead(@Request() req): Promise<void> {
    return this.notificationService.markAllAsRead(req.user.id);
  }
}
