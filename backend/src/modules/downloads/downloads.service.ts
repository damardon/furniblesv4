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
   * Descargar archivo por token - CORREGIDO
   */
  async downloadFile(
    token: string, 
    req: any, 
    res: Response
  ): Promise<StreamableFile> {
    // Validar token - SIN incluir pdfFile
    const downloadToken = await this.prisma.downloadToken.findUnique({
      where: { token },
      include: {
        product: true, // Solo obtener producto básico
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

    // Obtener archivo PDF desde pdfFileId - CORREGIDO
    const pdfFile = await this.getPdfFile(downloadToken.product);
    
    if (!pdfFile) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const filePath = path.join(process.env.STORAGE_PATH || './storage', pdfFile.key);

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
    console.log(`Download: ${pdfFile.filename} by token ${token} (${downloadToken.downloadCount + 1}/${downloadToken.downloadLimit})`);

    // Configurar headers de respuesta
    res.set({
      'Content-Type': pdfFile.mimeType,
      'Content-Disposition': `attachment; filename="${pdfFile.filename}"`,
      'Content-Length': pdfFile.size.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Crear stream del archivo
    const fileStream = fs.createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  /**
   * Helper function para obtener archivo PDF del producto - NUEVA
   */
  private async getPdfFile(product: any) {
    try {
      if (!product.pdfFileId) {
        return null;
      }

      const pdfFile = await this.prisma.file.findUnique({
        where: { 
          id: product.pdfFileId,
          type: 'PDF',
          status: 'ACTIVE'
        }
      });

      return pdfFile;
    } catch (error) {
      console.error('Error getting PDF file:', error);
      return null;
    }
  }

  /**
   * Obtener estadísticas de descargas para un seller
   */
  async getSellerDownloadStats(sellerId: string, fromDate?: Date, toDate?: Date) {
    // Corrector: Buscar por products del seller, no por sellerIds en order
    const where: any = {
      product: {
        sellerId: sellerId
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

  /**
   * Regenerar token de descarga (para casos especiales)
   */
  async regenerateDownloadToken(tokenId: string, sellerId: string): Promise<string> {
    // Verificar que el token pertenece al seller
    const existingToken = await this.prisma.downloadToken.findFirst({
      where: {
        id: tokenId,
        product: {
          sellerId: sellerId
        }
      }
    });

    if (!existingToken) {
      throw new NotFoundException('Token no encontrado o sin permisos');
    }

    // Generar nuevo token
    const newToken = this.generateUniqueToken();

    // Actualizar token
    await this.prisma.downloadToken.update({
      where: { id: tokenId },
      data: {
        token: newToken,
        downloadCount: 0, // Resetear contador
        isActive: true,
        lastDownloadAt: null
      }
    });

    return newToken;
  }

  /**
   * Generar token único
   */
  private generateUniqueToken(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `dl_${timestamp}_${random}`;
  }

  /**
   * Obtener detalles de un token específico
   */
  async getTokenDetails(token: string, userId: string) {
    const downloadToken = await this.prisma.downloadToken.findUnique({
      where: { token },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            sellerId: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            buyerId: true
          }
        }
      }
    });

    if (!downloadToken) {
      throw new NotFoundException('Token no encontrado');
    }

    // Verificar permisos (comprador o vendedor)
    const hasPermission = downloadToken.order.buyerId === userId || 
                         downloadToken.product.sellerId === userId;

    if (!hasPermission) {
      throw new BadRequestException('Sin permisos para acceder a este token');
    }

    return {
      id: downloadToken.id,
      token: downloadToken.token,
      productTitle: downloadToken.product.title,
      productSlug: downloadToken.product.slug,
      orderNumber: downloadToken.order.orderNumber,
      downloadLimit: downloadToken.downloadLimit,
      downloadCount: downloadToken.downloadCount,
      remainingDownloads: downloadToken.downloadLimit - downloadToken.downloadCount,
      expiresAt: downloadToken.expiresAt,
      isActive: downloadToken.isActive,
      lastDownloadAt: downloadToken.lastDownloadAt,
      createdAt: downloadToken.createdAt
    };
  }
}