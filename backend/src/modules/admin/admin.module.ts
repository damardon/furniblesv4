import { Module, forwardRef } from '@nestjs/common';
import { AdminAnalyticsModule } from './admin-analytics.module';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AdminAnalyticsModule,
    forwardRef(() => OrdersModule), // Para AdminOrdersController
    forwardRef(() => UsersModule),  // Para AdminService
    forwardRef(() => ProductsModule), // Para AdminService
  ],
  controllers: [
    AdminOrdersController,
    AdminController, // Nuevo controller básico
  ],
  providers: [
    AdminService, // Nuevo servicio
  ],
  exports: [
    AdminAnalyticsModule,
    AdminService, // Exportar para uso en otros módulos
  ],
})
export class AdminModule {}