/// src/app.module.ts - Actualizado con PayoutsModule
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';

// 🔧 Core modules (existentes)
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { FilesModule } from './modules/files/files.module';

// 🔄 Stage 7 modules (existentes)
import { CartModule } from './modules/cart/cart.module';
import { FeesModule } from './modules/fees/fees.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { DownloadsModule } from './modules/downloads/downloads.module';
import { NotificationModule } from './modules/notifications/notifications.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { EmailModule } from './modules/email/email.module';
import { CronModule } from './modules/cron/cron.module';
import { AdminModule } from './modules/admin/admin.module';

// 🆕 Stage 8 modules
import { PaymentsModule } from './modules/payments/payments.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { InvoicesModule } from './modules/invoices/invoices.module';

@Module({
  imports: [
    // 🌍 Configuración I18n
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),

    // 🔧 Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 🔧 Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // 🔧 Scheduled tasks
    ScheduleModule.forRoot(),

    // 🔧 Core modules (existentes desde etapas anteriores)
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    FilesModule,

    // 🔄 Stage 7: Orders System modules (existentes)
    CartModule,
    FeesModule,
    OrdersModule,
    CheckoutModule,
    DownloadsModule,
    NotificationModule,
    WebhookModule,
    StripeModule,
    WebSocketModule,
    EmailModule,
    CronModule,
    AdminModule,

    // 🆕 Stage 8: Advanced Payments System modules
    PaymentsModule,
    PayoutsModule, // 🆕 AGREGADO
    TransactionsModule,
    InvoicesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}