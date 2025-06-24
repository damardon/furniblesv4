import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  StreamableFile 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DownloadsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener downloads de una orden
   */
  async getOrderDownloads(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        buyerId: userId,
        status: 'COMPLETED'
      },
      include: {
        downloadTokens: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada o no completada');
    }

    const downloads = order.downloadTokens.map(token => ({
      id: token.id,
      token: token.token,
      productId: token.productId,
      productTitle: token.product.title,
      downloadUrl: `${process.env.API_URL}/api/downloads/${token.token}`,
      downloadLimit: token.downloadLimit,
      downloadCount: token.downloadCount,
      expiresAt: token.expiresAt,
      isActive: token.isActive && token.downloadCount < token.downloadLimit && token.expiresAt > new Date(),
      lastDownloadAt: token.lastDownloadAt
    }));

    return {
      downloads,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalDownloads: downloads.length
    };
  }

  /**
   * Descargar archivo por token
   */
  async downloadFile(
    token: string, 
    req: any, 
    res: Response
  ): Promise<StreamableFile> {
    // Validar token
    const downloadToken = await this.prisma.downloadToken.findUnique({
      where: { token },
      include: {
        product: {
          include: {
            pdfFile: true
          }
        },
        order: true
      }
    });

    if (!downloadToken) {
      throw new NotFoundException('Token de descarga inválido');
    }

    // Verificar si el token está activo
    if (!downloadToken.isActive) {
      throw new BadRequestException('Token de descarga desactivado');
    }

    // Verificar si no ha expirado
    if (downloadToken.expiresAt < new Date()) {
      throw new BadRequestException('Token de descarga expirado');
    }

    // Verificar límite de descargas
    if (downloadToken.downloadCount >= downloadToken.downloadLimit) {
      throw new BadRequestException('Límite de descargas excedido');
    }

    // Verificar que el producto tiene archivo PDF
    if (!downloadToken.product.pdfFile) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const file = downloadToken.product.pdfFile;
    const filePath = path.join(process.env.STORAGE_PATH || './storage', file.key);

    // Verificar que el archivo existe físicamente
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado en el servidor');
    }

    // Incrementar contador de descargas
    await this.prisma.downloadToken.update({
      where: { id: downloadToken.id },
      data: {
        downloadCount: downloadToken.downloadCount + 1,
        lastDownloadAt: new Date(),
        lastIpAddress: req.ip,
        lastUserAgent: req.get('User-Agent')
      }
    });

    // Log de descarga
    console.log(`Download: ${file.filename} by token ${token} (${downloadToken.downloadCount + 1}/${downloadToken.downloadLimit})`);

    // Configurar headers de respuesta
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': file.size.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Crear stream del archivo
    const fileStream = fs.createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  /**
   * Obtener estadísticas de descargas para un seller
   */
  async getSellerDownloadStats(sellerId: string, fromDate?: Date, toDate?: Date) {
    const where: any = {
      order: {
        sellerIds: {
          has: sellerId
        }
      }
    };

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const totalTokens = await this.prisma.downloadToken.count({ where });
    const totalDownloads = await this.prisma.downloadToken.aggregate({
      where,
      _sum: {
        downloadCount: true
      }
    });

    const activeTokens = await this.prisma.downloadToken.count({
      where: {
        ...where,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    return {
      totalTokens,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      activeTokens,
      expiredTokens: totalTokens - activeTokens
    };
  }

  /**
   * Limpiar tokens expirados (Cron Job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.downloadToken.updateMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    return result.count;
  }
}
