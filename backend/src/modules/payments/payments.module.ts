// backend/src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PayPalService } from '../paypal/paypal.service'; // ✅ NUEVO
import { StripeModule } from '../stripe/stripe.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [StripeModule, PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PayPalService, // ✅ AGREGAR
  ],
  exports: [PaymentsService, PayPalService], // ✅ EXPORTAR
})
export class PaymentsModule {}