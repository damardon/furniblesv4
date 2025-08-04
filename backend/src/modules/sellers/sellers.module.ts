import { Module } from '@nestjs/common';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [SellersController],
  providers: [SellersService, PrismaService], // 🔧 Agregar PrismaService como provider
  exports: [SellersService],
})
export class SellersModule {
  constructor() {
    console.log('🚀 [DEBUG] SellersModule initialized successfully!');
  }
}