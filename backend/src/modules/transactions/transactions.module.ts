// src/modules/transactions/transactions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => StripeModule),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}  