import { Module } from '@nestjs/common';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SellersController],
  providers: [SellersService, PrismaService], // 🔧 Agregar PrismaService como provider
  exports: [SellersService],
})
export class SellersModule {}
