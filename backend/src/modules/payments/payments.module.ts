// backend/src/modules/payments/payments.module.ts - CORREGIDO
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentCheckoutController } from './payment-checkout.controller'; // ✅ NUEVO
import { PayPalService } from './paypal.service'; // ✅ UBICACIÓN CORRECTA
import { StripeModule } from '../stripe/stripe.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    StripeModule, 
    PrismaModule
  ],
  controllers: [
    PaymentsController,
    PaymentCheckoutController, // ✅ AGREGAR el nuevo controlador
  ],
  providers: [
    PaymentsService,
    PayPalService, // ✅ AGREGAR PayPal service
  ],
  exports: [
    PaymentsService, 
    PayPalService, // ✅ EXPORTAR para otros módulos
  ],
})
export class PaymentsModule {}