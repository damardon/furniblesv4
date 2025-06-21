import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  service: process.env.EMAIL_SERVICE || 'sendgrid',
  apiKey: process.env.EMAIL_API_KEY,
  from: process.env.EMAIL_FROM || 'noreply@furnibles.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Furnibles',
  
  // SendGrid specific
  sendgrid: {
    apiKey: process.env.EMAIL_API_KEY,
  },

  // SMTP fallback
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
}));