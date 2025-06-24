import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Response,
  StreamableFile
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger';
import { DownloadsService } from './downloads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DownloadResponseDto } from './dto/download-response.dto';
import { UserRole } from '@prisma/client';
import { Response as ExpressResponse } from 'express';

@ApiTags('Downloads')
@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get('orders/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.BUYER)
  @ApiOperation({ 
    summary: 'Obtener descargas de una orden',
    description: 'Retorna todos los tokens de descarga disponibles para una orden completada.'
  })
  @ApiParam({ 
    name: 'orderId', 
    description: 'ID de la orden' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Descargas obtenidas exitosamente',
    type: DownloadResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Orden no encontrada o no completada' 
  })
  async getOrderDownloads(
    @Request() req,
    @Param('orderId') orderId: string
  ): Promise<DownloadResponseDto> {
    return this.downloadsService.getOrderDownloads(orderId, req.user.id);
  }

  @Get(':token')
  @ApiOperation({ 
    summary: 'Descargar archivo por token',
    description: 'Descarga un archivo PDF usando un token de descarga válido. No requiere autenticación.'
  })
  @ApiParam({ 
    name: 'token', 
    description: 'Token de descarga único' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Archivo descargado exitosamente',
    headers: {
      'Content-Type': { description: 'Tipo MIME del archivo' },
      'Content-Disposition': { description: 'Nombre del archivo para descarga' }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Token inválido o archivo no encontrado' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Token expirado o límite de descargas excedido' 
  })
  async downloadFile(
    @Param('token') token: string,
    @Request() req,
    @Response() res: ExpressResponse
  ): Promise<StreamableFile> {
    return this.downloadsService.downloadFile(token, req, res);
  }
}