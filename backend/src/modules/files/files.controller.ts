// src/modules/files/files.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs/promises';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

enum FileType {
  PDF = 'PDF',
  IMAGE = 'IMAGE', 
  THUMBNAIL = 'THUMBNAIL'
}

interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
}

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload/pdf')
  @UseInterceptors(
    FileInterceptor('pdf', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Subir archivo PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'PDF subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        key: { type: 'string' },
        url: { type: 'string' },
        type: { type: 'string' },
        size: { type: 'number' },
        mimeType: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @ApiBearerAuth()
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUser,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const uploadedFile = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    return this.filesService.uploadPdf(uploadedFile, user.id);
  }

  @Post('upload/images')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB por imagen
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Subir múltiples imágenes (máximo 5)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Imágenes subidas exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          key: { type: 'string' },
          url: { type: 'string' },
          type: { type: 'string' },
          size: { type: 'number' },
          mimeType: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivos inválidos' })
  @ApiBearerAuth()
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtUser,
  ) {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    const uploadedFiles = files.map(file => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    }));

    return this.filesService.uploadImages(uploadedFiles, user.id);
  }

  @Get('my')
  @ApiOperation({ summary: 'Obtener mis archivos subidos' })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    enum: FileType,
    description: 'Filtrar por tipo de archivo' 
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de archivos del usuario',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          key: { type: 'string' },
          url: { type: 'string' },
          type: { type: 'string' },
          size: { type: 'number' },
          mimeType: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' },
          createdAt: { type: 'string' },
        },
      },
    },
  })
  @ApiBearerAuth()
  async getMyFiles(
    @CurrentUser() user: JwtUser,
    @Query('type') type?: FileType,
  ) {
    return this.filesService.getUserFiles(user.id, type);
  }

  @Get('pdf/:key')
  @Public()
  @ApiOperation({ summary: 'Descargar archivo PDF' })
  @ApiParam({ name: 'key', description: 'Clave única del archivo' })
  @ApiResponse({ status: 200, description: 'Archivo PDF' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async downloadPdf(@Param('key') key: string, @Res() res: Response) {
    const { file, filePath } = await this.filesService.getFileByKey(key);
    
    const fileBuffer = await fs.readFile(filePath);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': file.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    res.send(fileBuffer);
  }

  @Get('image/:key')
  @Public()
  @ApiOperation({ summary: 'Ver imagen' })
  @ApiParam({ name: 'key', description: 'Clave única de la imagen' })
  @ApiResponse({ status: 200, description: 'Imagen' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  async getImage(@Param('key') key: string, @Res() res: Response) {
    const { file, filePath } = await this.filesService.getFileByKey(key);
    
    const fileBuffer = await fs.readFile(filePath);
    
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': file.size,
      'Cache-Control': 'public, max-age=86400', // Cache por 1 día
      'ETag': file.checksum,
    });

    res.send(fileBuffer);
  }

  @Get('thumbnail/:key')
  @Public()
  @ApiOperation({ summary: 'Ver thumbnail' })
  @ApiParam({ name: 'key', description: 'Clave única del thumbnail' })
  @ApiResponse({ status: 200, description: 'Thumbnail' })
  @ApiResponse({ status: 404, description: 'Thumbnail no encontrado' })
  async getThumbnail(@Param('key') key: string, @Res() res: Response) {
    const { file, filePath } = await this.filesService.getFileByKey(key);
    
    const fileBuffer = await fs.readFile(filePath);
    
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': file.size,
      'Cache-Control': 'public, max-age=86400', // Cache por 1 día
      'ETag': file.checksum,
    });

    res.send(fileBuffer);
  }

  @Get(':id/metadata')
  @ApiOperation({ summary: 'Obtener metadata de un archivo' })
  @ApiParam({ name: 'id', description: 'ID del archivo' })
  @ApiResponse({
    status: 200,
    description: 'Metadata del archivo',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        filename: { type: 'string' },
        key: { type: 'string' },
        url: { type: 'string' },
        type: { type: 'string' },
        size: { type: 'number' },
        mimeType: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
        checksum: { type: 'string' },
        metadata: { type: 'object' },
        createdAt: { type: 'string' },
      },
    },
  })
  @ApiBearerAuth()
  async getFileMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    // TODO: Implementar verificación de permisos
    return this.filesService.getFileMetadata(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar archivo' })
  @ApiParam({ name: 'id', description: 'ID del archivo' })
  @ApiResponse({ status: 204, description: 'Archivo eliminado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  @ApiBearerAuth()
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.filesService.deleteFile(id, user.id, user.role);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Limpiar archivos huérfanos (admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Limpieza completada',
    schema: {
      type: 'object',
      properties: {
        deletedFiles: { type: 'number' },
        freedSpace: { type: 'string' },
      }
    }
  })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async cleanupOrphanedFiles(@CurrentUser() user: JwtUser) {
    return this.filesService.cleanupOrphanedFiles();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de almacenamiento (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de archivos',
    schema: {
      type: 'object',
      properties: {
        totalFiles: { type: 'number' },
        totalSize: { type: 'string' },
        filesByType: { type: 'object' },
        storageUsage: { type: 'object' },
      }
    }
  })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  async getStorageStats() {
    return this.filesService.getStorageStats();
  }
}