// src/modules/fees/fees.module.ts
import { Module } from '@nestjs/common';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService], // Exportar para usar en CartModule y OrdersModule
})
export class FeesModule {}

