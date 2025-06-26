// src/modules/payouts/payouts.module.ts - CORREGIDO
import { Module, forwardRef } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => StripeModule), // 🔧 Evitar dependencia circular
  ],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}