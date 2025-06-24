import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FeesModule } from '../fees/fees.module';

@Module({
  imports: [PrismaModule, FeesModule], // ← Sin NotificationModule
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}