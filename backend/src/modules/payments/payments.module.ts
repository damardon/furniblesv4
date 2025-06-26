// src/modules/payments/payments.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => StripeModule), // 🆕 Usar forwardRef para evitar dependencia circular
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService], // Exportamos para uso en otros módulos
})
export class PaymentsModule {}