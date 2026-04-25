import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  currency: 'usd',
  platformFeePercent: 10, // 10% commission
  successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success`,
  cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/cancel`,
}));
