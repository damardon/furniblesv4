import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Stripe(configService.get('STRIPE_SECRET_KEY'), {
          apiVersion: '2023-10-16',
        });
      },
      inject: [ConfigService],
    },
    StripeService,
  ],
  exports: [StripeService],
})
export class StripeModule {}
