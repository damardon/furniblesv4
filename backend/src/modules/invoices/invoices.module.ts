// src/modules/invoices/invoices.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => StripeModule),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}