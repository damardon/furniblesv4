import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      // Configuración global de Multer
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, PrismaService],
  exports: [FilesService], // Exportar para uso en otros módulos
})
export class FilesModule {}
