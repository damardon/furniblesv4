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
    // I18nService removido temporalmente
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
          select: { id: true,}
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

  // Limpiar archivos huérfanos
  async cleanupOrphanedFiles(): Promise<{ deletedFiles: number; freedSpace: string }> {
    // Encontrar archivos que no están referenciados por ningún producto
    const orphanedFiles = await this.prisma.file.findMany({
      where: {
        status: FileStatus.ACTIVE,
        AND: [
          {
            productPdfs: {
              none: {}
            }
          },
          {
            productImages: {
              none: {}
            }
          },
          {
            productThumbs: {
              none: {}
            }
          }
        ],
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
        }

        await fs.unlink(filePath);
        totalSize += file.size;
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting orphaned file ${file.id}:`, error);
      }
    }

    return {
      deletedFiles: deletedCount,
      freedSpace: this.formatFileSize(totalSize)
    };
  }

  // Estadísticas de almacenamiento
  async getStorageStats(): Promise<any> {
    const stats = await this.prisma.file.groupBy({
      by: ['type', 'status'],
      _count: {
        id: true
      },
      _sum: {
        size: true
      }
    });

    const activeFiles = await this.prisma.file.findMany({
      where: { status: FileStatus.ACTIVE },
      select: { type: true, size: true }
    });

    const totalFiles = activeFiles.length;
    const totalSize = activeFiles.reduce((sum, file) => sum + file.size, 0);

    const filesByType = activeFiles.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {});

    const sizeByType = activeFiles.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + file.size;
      return acc;
    }, {});

    // Formatear tamaños
    const formattedSizeByType = Object.entries(sizeByType).reduce((acc, [type, size]) => {
      acc[type] = this.formatFileSize(size as number);
      return acc;
    }, {});

    return {
      totalFiles,
      totalSize: this.formatFileSize(totalSize),
      filesByType,
      sizeByType: formattedSizeByType,
      storageUsage: {
        used: this.formatFileSize(totalSize),
        // Calcular espacio disponible basado en configuración
        limit: this.formatFileSize(1024 * 1024 * 1024), // 1GB ejemplo
        percentage: Math.round((totalSize / (1024 * 1024 * 1024)) * 100)
      },
      rawStats: stats
    };
  }

  // Verificar si usuario es admin
  private async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    return user?.role === 'ADMIN';
  }

  // Obtener archivos por producto (para uso interno)
  async getProductFiles(productId: string): Promise<{
    pdf?: FileResponseDto;
    images: FileResponseDto[];
    thumbnails: FileResponseDto[];
  }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        pdfFile: true,
        imageFiles: true,
        thumbnailFiles: true
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      pdf: product.pdfFile ? this.mapFileToResponse(product.pdfFile) : undefined,
      images: product.imageFiles.map(this.mapFileToResponse),
      thumbnails: product.thumbnailFiles.map(this.mapFileToResponse)
    };
  }

  // Mapper helper
  private mapFileToResponse(file: any): FileResponseDto {
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
      createdAt: file.createdAt
    };
  }

  // Validar que archivos pertenecen al usuario
  async validateFileOwnership(fileIds: string[], userId: string): Promise<boolean> {
    if (!fileIds.length) return true;

    const files = await this.prisma.file.findMany({
      where: {
        id: { in: fileIds },
        uploadedById: userId,
        status: FileStatus.ACTIVE
      }
    });

    return files.length === fileIds.length;
  }

  // Utilidades privadas
  private generateFileKey(originalName: string, type: string): string {
    const timestamp = Date.now();
    const random = uuidv4().split('-')[0];
    const extension = this.getFileExtension(originalName);
    return `${type}_${timestamp}_${random}.${extension}`;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  private async ensureUploadDirectory(): Promise<void> {
    const directories = ['pdfs', 'images', 'thumbnails'];
    
    for (const dir of directories) {
      const fullPath = path.join(this.uploadPath, dir);
      await this.ensureDirectoryExists(fullPath);
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private validateFileSignature(buffer: Buffer, mimeType: string): void {
    const signatures = {
      'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
    };

    const signature = signatures[mimeType];
    if (!signature) return;

    const fileHeader = Array.from(buffer.slice(0, signature.length));
    const isValid = signature.every((byte, index) => fileHeader[index] === byte);

    if (!isValid) {
      throw new BadRequestException('Corrupted or invalid file');
    }
  }

  private async extractPdfMetadata(buffer: Buffer): Promise<any> {
    // Implementación básica - se puede mejorar con librerías como pdf-parse
    try {
      const text = buffer.toString('binary');
      const pages = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
      
      return {
        pages,
        size: buffer.length,
        extracted_at: new Date().toISOString(),
      };
    } catch {
      return { pages: 0, error: 'Could not extract metadata' };
    }
  }
}