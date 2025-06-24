import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';
import { DownloadsModule } from '../downloads/downloads.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CartModule,
    OrdersModule,
    DownloadsModule,
  ],
  providers: [CronService],
})
export class CronModule {}
