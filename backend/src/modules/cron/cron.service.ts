import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CartService } from '../cart/cart.service';
import { OrdersService } from '../orders/orders.service';
import { DownloadsService } from '../downloads/downloads.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private cartService: CartService,
    private ordersService: OrdersService,
    private downloadsService: DownloadsService,
  ) {}

  /**
   * Limpiar carritos abandonados (diario a las 2 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupAbandonedCarts() {
    this.logger.log('Starting cleanup of abandoned carts...');
    
    try {
      const deletedCount = await this.cartService.cleanupAbandonedCarts();
      this.logger.log(`Cleaned up ${deletedCount} abandoned cart items`);
    } catch (error) {
      this.logger.error('Failed to cleanup abandoned carts:', error);
    }
  }

  /**
   * Cancelar órdenes pendientes (cada hora)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cancelPendingOrders() {
    this.logger.log('Starting cleanup of pending orders...');
    
    try {
      const cancelledCount = await this.ordersService.cleanupPendingOrders();
      this.logger.log(`Cancelled ${cancelledCount} pending orders`);
    } catch (error) {
      this.logger.error('Failed to cleanup pending orders:', error);
    }
  }

  /**
   * Desactivar tokens de descarga expirados (diario a las 3 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async deactivateExpiredTokens() {
    this.logger.log('Starting cleanup of expired download tokens...');
    
    try {
      const deactivatedCount = await this.downloadsService.cleanupExpiredTokens();
      this.logger.log(`Deactivated ${deactivatedCount} expired download tokens`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
    }
  }

  /**
   * Generar reporte diario de actividad (diario a las 6 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async generateDailyReport() {
    this.logger.log('Generating daily activity report...');
    
    try {
      // TODO: Implementar generación de reportes
      // - Órdenes del día anterior
      // - Nuevos usuarios
      // - Productos más vendidos
      // - Ingresos totales
      this.logger.log('Daily report generated successfully');
    } catch (error) {
      this.logger.error('Failed to generate daily report:', error);
    }
  }
}