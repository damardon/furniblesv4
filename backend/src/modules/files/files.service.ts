// src/modules/files/files.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { FileType, FileStatus } from '@prisma/client';
import { FileResponseDto, FileMetadataDto } from '../products/dto/file-response.dto';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ProcessedFile {
  id: string;
  key: string;
  url: string;
  type: FileType;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

@Injectable()
export class FilesService {
  private readonly uploadPath: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly baseUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.uploadPath = this.config.get('UPLOAD_PATH', './uploads');
    this.maxFileSize = parseInt(this.config.get('MAX_FILE_SIZE', '10485760')); // 10MB
    this.allowedMimeTypes = this.config.get('ALLOWED_FILE_TYPES', 'pdf,jpg,jpeg,png,webp').split(',');
    this.baseUrl = this.config.get('BASE_URL', 'https://probable-barnacle-65wp9jg5qwxc5w6-3000.app.github.dev');
    
    // Crear directorio de uploads si no existe
    this.ensureUploadDirectory();
  }

  // Validar archivo antes del upload
  validateFile(file: UploadedFile, expectedType?: FileType): void {
    // Validar tamaño
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size allowed: ${this.formatFileSize(this.maxFileSize)}`
      );
    }

    // Validar tipo MIME
    const fileExtension = this.getFileExtension(file.originalname);
    if (!this.allowedMimeTypes.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    // Validaciones específicas por tipo
    if (expectedType === FileType.PDF && file.mimetype !== 'application/pdf') {
      throw new BadRequestException('File must be a PDF');
    }

    if (expectedType === FileType.IMAGE && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Validar que es realmente el tipo de archivo (verificación binaria)
    this.validateFileSignature(file.buffer, file.mimetype);
  }
  /**
 * Obtener estadísticas de almacenamiento (para admin)
 */
async getStorageStats() {
  const [
    totalFiles,
    totalSize,
    filesByType,
    recentUploads
  ] = await Promise.all([
    // Total de archivos activos
    this.prisma.file.count({
      where: { status: FileStatus.ACTIVE }
    }),
    
    // Tamaño total
    this.prisma.file.aggregate({
      where: { status: FileStatus.ACTIVE },
      _sum: { size: true }
    }),
    
    // Archivos por tipo
    this.prisma.file.groupBy({
      by: ['type'],
      where: { status: FileStatus.ACTIVE },
      _count: { type: true },
      _sum: { size: true }
    }),
    
    // Uploads recientes (últimos 30 días)
    this.prisma.file.count({
      where: {
        status: FileStatus.ACTIVE,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  return {
    total: {
      files: totalFiles,
      size: totalSize._sum.size || 0,
      sizeFormatted: this.formatFileSize(totalSize._sum.size || 0)
    },
    byType: filesByType.map(type => ({
      type: type.type,
      count: type._count.type,
      size: type._sum.size || 0,
      sizeFormatted: this.formatFileSize(type._sum.size || 0)
    })),
    recent: {
      uploadsLast30Days: recentUploads
    },
    storage: {
      maxFileSize: this.maxFileSize,
      maxFileSizeFormatted: this.formatFileSize(this.maxFileSize),
      allowedTypes: this.allowedMimeTypes,
      uploadPath: this.uploadPath
    }
  };
}

  // Subir PDF
  async uploadPdf(file: UploadedFile, userId: string): Promise<ProcessedFile> {
    this.validateFile(file, FileType.PDF);

    const fileKey = this.generateFileKey(file.originalname, 'pdf');
    const filePath = path.join(this.uploadPath, 'pdfs', fileKey);

    // Crear directorio si no existe
    await this.ensureDirectoryExists(path.dirname(filePath));

    // Guardar archivo
    await fs.writeFile(filePath, file.buffer);

    // Calcular checksum
    const checksum = this.calculateChecksum(file.buffer);

    // Extraer metadata del PDF (opcional)
    const metadata = await this.extractPdfMetadata(file.buffer);

    // Crear registro en BD
    const fileRecord = await this.prisma.file.create({
      data: {
        filename: file.originalname,
        key: fileKey,
        url: `${this.baseUrl}/api/files/pdf/${fileKey}`,
        mimeType: file.mimetype,
        size: file.size,
        type: FileType.PDF,
        status: FileStatus.ACTIVE,
        checksum,
        metadata,
        uploadedById: userId,
      },
    });

    return {
      id: fileRecord.id,
      key: fileRecord.key,
      url: fileRecord.url,
      type: fileRecord.type,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
    };
  }

  // Subir múltiples imágenes
  async uploadImages(files: UploadedFile[], userId: string): Promise<ProcessedFile[]> {
    if (files.length > 5) {
      throw new BadRequestException('Too many images. Maximum 5 images allowed');
    }

    const processedFiles: ProcessedFile[] = [];

    for (const file of files) {
      this.validateFile(file, FileType.IMAGE);
      
      const processed = await this.processImage(file, userId);
      processedFiles.push(processed);
    }

    return processedFiles;
  }

  // Procesar imagen individual
  private async processImage(file: UploadedFile, userId: string): Promise<ProcessedFile> {
    const fileKey = this.generateFileKey(file.originalname, 'image');
    const filePath = path.join(this.uploadPath, 'images', fileKey);
    const thumbnailKey = `thumb_${fileKey}`;
    const thumbnailPath = path.join(this.uploadPath, 'thumbnails', thumbnailKey);

    // Crear directorios
    await this.ensureDirectoryExists(path.dirname(filePath));
    await this.ensureDirectoryExists(path.dirname(thumbnailPath));

    // Procesar imagen original
    const processedImage = await sharp(file.buffer)
      .resize(1200, 1200, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Crear thumbnail
    const thumbnail = await sharp(file.buffer)
      .resize(300, 300, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Guardar archivos
    await fs.writeFile(filePath, processedImage);
    await fs.writeFile(thumbnailPath, thumbnail);

    // Obtener dimensiones
    const { width, height } = await sharp(processedImage).metadata();

    // Calcular checksums
    const checksum = this.calculateChecksum(processedImage);
    const thumbnailChecksum = this.calculateChecksum(thumbnail);

    // Crear registro de imagen principal
    const imageRecord = await this.prisma.file.create({
      data: {
        filename: file.originalname,
        key: fileKey,
        url: `${this.baseUrl}/api/files/image/${fileKey}`,
        mimeType: 'image/jpeg',
        size: processedImage.length,
        type: FileType.IMAGE,
        status: FileStatus.ACTIVE,
        width,
        height,
        checksum,
        uploadedById: userId,
      },
    });

    // Crear registro de thumbnail
    await this.prisma.file.create({
      data: {
        filename: `thumb_${file.originalname}`,
        key: thumbnailKey,
        url: `${this.baseUrl}/api/files/thumbnail/${thumbnailKey}`,
        mimeType: 'image/jpeg',
        size: thumbnail.length,
        type: FileType.THUMBNAIL,
        status: FileStatus.ACTIVE,
        width: 300,
        height: 300,
        checksum: thumbnailChecksum,
        uploadedById: userId,
      },
    });

    return {
      id: imageRecord.id,
      key: imageRecord.key,
      url: imageRecord.url,
      type: imageRecord.type,
      size: imageRecord.size,
      mimeType: imageRecord.mimeType,
      width,
      height,
    };
  }

  // Obtener archivo por clave
  async getFileByKey(key: string): Promise<{ file: any; filePath: string }> {
    const file = await this.prisma.file.findUnique({
      where: { key },
    });

    if (!file || file.status !== FileStatus.ACTIVE) {
      throw new NotFoundException('File not found');
    }

    let filePath: string;
    switch (file.type) {
      case FileType.PDF:
        filePath = path.join(this.uploadPath, 'pdfs', key);
        break;
      case FileType.IMAGE:
        filePath = path.join(this.uploadPath, 'images', key);
        break;
      case FileType.THUMBNAIL:
        filePath = path.join(this.uploadPath, 'thumbnails', key);
        break;
      default:
        throw new NotFoundException('Invalid file type');
    }

    // Verificar que el archivo existe físicamente
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('File not found');
    }

    return { file, filePath };
  }

  // Eliminar archivo
  async deleteFile(fileId: string, userId: string, userRole: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Solo el propietario o admin pueden eliminar
    if (file.uploadedById !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not the owner of this file');
    }

    // Marcar como eliminado en BD
    await this.prisma.file.update({
      where: { id: fileId },
      data: { status: FileStatus.DELETED },
    });

    // Eliminar archivo físico (opcional, se puede hacer en background)
    try {
      let filePath: string;
      switch (file.type) {
        case FileType.PDF:
          filePath = path.join(this.uploadPath, 'pdfs', file.key);
          break;
        case FileType.IMAGE:
          filePath = path.join(this.uploadPath, 'images', file.key);
          break;
        case FileType.THUMBNAIL:
          filePath = path.join(this.uploadPath, 'thumbnails', file.key);
          break;
      }
      
      await fs.unlink(filePath);
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Error deleting physical file:', error);
    }
  }

  // Obtener archivos del usuario
  async getUserFiles(userId: string, type?: FileType) {
    const where: any = {
      uploadedById: userId,
      status: FileStatus.ACTIVE,
    };

    if (type) {
      where.type = type;
    }

    return this.prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        key: true,
        url: true,
        type: true,
        size: true,
        mimeType: true,
        width: true,
        height: true,
        createdAt: true,
      },
    });
  }

  // Obtener metadata completa de archivo
  async getFileMetadata(fileId: string, userId: string): Promise<FileMetadataDto> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        uploadedBy: {
          select: { id: true }
        }
      }
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Solo el propietario o admin pueden ver metadata completa
    if (file.uploadedById !== userId && !this.isAdmin(userId)) {
      throw new ForbiddenException('Not authorized to access this file');
    }

    return {
      id: file.id,
      filename: file.filename,
      key: file.key,
      url: file.url,
      type: file.type,
      size: file.size,
      mimeType: file.mimeType,
      width: file.width,
      height: file.height,
      checksum: file.checksum,
      metadata: file.metadata,
      status: file.status,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt,
    };
  }

  // Limpiar archivos huérfanos - CORREGIDO
  async cleanupOrphanedFiles(): Promise<{ deletedFiles: number; freedSpace: string }> {
    // Obtener todos los IDs de archivos que están siendo usados por productos
    const usedFileIds = new Set<string>();

    // Archivos PDF usados
    const productsWithPdf = await this.prisma.product.findMany({
      where: { pdfFileId: { not: null } },
      select: { pdfFileId: true }
    });
    productsWithPdf.forEach(p => {
      if (p.pdfFileId) usedFileIds.add(p.pdfFileId);
    });

    // Archivos de imágenes usados
    const productsWithImages = await this.prisma.product.findMany({
      where: { imageFileIds: { not: null } },
      select: { imageFileIds: true }
    });
    productsWithImages.forEach(p => {
      try {
        if (p.imageFileIds) {
          const imageIds = JSON.parse(p.imageFileIds);
          if (Array.isArray(imageIds)) {
            imageIds.forEach(id => usedFileIds.add(id));
          }
        }
      } catch (error) {
        console.warn('Error parsing imageFileIds:', error);
      }
    });

    // Archivos de thumbnails usados
    const productsWithThumbnails = await this.prisma.product.findMany({
      where: { thumbnailFileIds: { not: null } },
      select: { thumbnailFileIds: true }
    });
    productsWithThumbnails.forEach(p => {
      try {
        if (p.thumbnailFileIds) {
          const thumbnailIds = JSON.parse(p.thumbnailFileIds);
          if (Array.isArray(thumbnailIds)) {
            thumbnailIds.forEach(id => usedFileIds.add(id));
          }
        }
      } catch (error) {
        console.warn('Error parsing thumbnailFileIds:', error);
      }
    });

    // Encontrar archivos huérfanos
    const orphanedFiles = await this.prisma.file.findMany({
      where: {
        status: FileStatus.ACTIVE,
        id: { notIn: Array.from(usedFileIds) },
        // Solo archivos más antiguos de 7 días
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    let totalSize = 0;
    let deletedCount = 0;

    for (const file of orphanedFiles) {
      try {
        // Marcar como eliminado
        await this.prisma.file.update({
          where: { id: file.id },
          data: { status: FileStatus.DELETED }
        });

        // Eliminar archivo físico
        let filePath: string;
        switch (file.type) {
          case FileType.PDF:
            filePath = path.join(this.uploadPath, 'pdfs', file.key);
            break;
          case FileType.IMAGE:
            filePath = path.join(this.uploadPath, 'images', file.key);
            break;
          case FileType.THUMBNAIL:
            filePath = path.join(this.uploadPath, 'thumbnails', file.key);
            break;
          default:
            continue;
        }

        try {
          await fs.unlink(filePath);
          totalSize += file.size;
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting file ${filePath}:`, error);
          // Revertir el estado si no se pudo eliminar físicamente
          await this.prisma.file.update({
            where: { id: file.id },
            data: { status: FileStatus.ACTIVE }
          });
        }
      } catch (error) {
        console.error(`Error processing orphaned file ${file.id}:`, error);
      }
    }

    return {
      deletedFiles: deletedCount,
      freedSpace: this.formatFileSize(totalSize)
    };
  }

  // Obtener archivos de un producto específico - CORREGIDO
  async getProductFiles(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        pdfFileId: true,
        imageFileIds: true,
        thumbnailFileIds: true
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const fileInfo = {
      pdf: null as any,
      images: [] as any[],
      thumbnails: [] as any[]
    };

    // Obtener archivo PDF
    if (product.pdfFileId) {
      const pdfFile = await this.prisma.file.findUnique({
        where: { 
          id: product.pdfFileId,
          status: FileStatus.ACTIVE 
        }
      });
      if (pdfFile) {
        fileInfo.pdf = this.mapFileToResponse(pdfFile);
      }
    }

    // Obtener archivos de imágenes
    if (product.imageFileIds) {
      try {
        const imageIds = JSON.parse(product.imageFileIds);
        if (Array.isArray(imageIds) && imageIds.length > 0) {
          const imageFiles = await this.prisma.file.findMany({
            where: { 
              id: { in: imageIds },
              status: FileStatus.ACTIVE,
              type: FileType.IMAGE
            }
          });
          fileInfo.images = imageFiles.map(this.mapFileToResponse);
        }
      } catch (error) {
        console.warn('Error parsing imageFileIds:', error);
      }
    }

    // Obtener archivos de thumbnails
    if (product.thumbnailFileIds) {
      try {
        const thumbnailIds = JSON.parse(product.thumbnailFileIds);
        if (Array.isArray(thumbnailIds) && thumbnailIds.length > 0) {
          const thumbnailFiles = await this.prisma.file.findMany({
            where: { 
              id: { in: thumbnailIds },
              status: FileStatus.ACTIVE,
              type: FileType.THUMBNAIL
            }
          });
          fileInfo.thumbnails = thumbnailFiles.map(this.mapFileToResponse);
        }
      } catch (error) {
        console.warn('Error parsing thumbnailFileIds:', error);
      }
    }

    return fileInfo;
  }

  // Helper function para mapear archivo a respuesta
  private mapFileToResponse = (file: any): FileResponseDto => {
    return {
      id: file.id,
      filename: file.filename,
      key: file.key,
      url: file.url,
      type: file.type,
      size: file.size,
      mimeType: file.mimeType,
      width: file.width,
      height: file.height,
      createdAt: file.createdAt,
    };
  };

  // HELPER METHODS (implementaciones faltantes)
  
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
      await fs.mkdir(path.join(this.uploadPath, 'pdfs'), { recursive: true });
      await fs.mkdir(path.join(this.uploadPath, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.uploadPath, 'thumbnails'), { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  }

  private generateFileKey(originalname: string, prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = path.extname(originalname);
    return `${prefix}_${timestamp}_${random}${extension}`;
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase().substring(1);
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private validateFileSignature(buffer: Buffer, mimeType: string): void {
    // Implementación básica de validación de firma de archivo
    const signatures: Record<string, number[]> = {
      'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/webp': [0x52, 0x49, 0x46, 0x46]
    };

    const signature = signatures[mimeType];
    if (signature) {
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          throw new BadRequestException('File signature does not match MIME type');
        }
      }
    }
  }

  private async extractPdfMetadata(buffer: Buffer): Promise<any> {
    // Implementación básica - en producción usarías una librería como pdf-parse
    return {
      extractedAt: new Date().toISOString(),
      size: buffer.length
    };
  }

  private isAdmin(userId: string): boolean {
    // Implementación básica - en producción consultarías la base de datos
    return false; // Por defecto false, implementar según necesidades
  }
}