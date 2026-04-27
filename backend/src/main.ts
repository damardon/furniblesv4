import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Obtener el puerto ANTES de usarlo
  const port = configService.get('PORT', 3002);

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // Get backend and frontend URLs from config
  const nodeEnv = configService.get('NODE_ENV', 'development');
  const backendUrl = configService.get(
    'BACKEND_URL',
    `http://localhost:${port}`,
  );
  const corsOrigin = configService.get('CORS_ORIGIN');

  // CORS configuration — accept localhost, any *.vercel.app deployment, and the configured production domain
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  if (corsOrigin) allowedOrigins.push(corsOrigin);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl)
      if (!origin) return callback(null, true);
      // Allow any Vercel preview/production URL during MVP phase
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Allow configured origins (production domain + localhost)
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
    ],
  });

  // Global API prefix
  const apiPrefix = configService.get('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: nodeEnv === 'production',
    }),
  );

  // Swagger documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Furnibles API')
      .setDescription('Marketplace C2C de planos digitales de muebles')
      .setVersion('1.0')
      .addServer(backendUrl, 'Development Server')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('products', 'Product management')
      .addTag('orders', 'Order management')
      .addTag('payments', 'Payment processing')
      .addTag('downloads', 'File downloads')
      .addTag('reviews', 'Product reviews')
      .addTag('admin', 'Admin functions')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'Furnibles API Documentation',
    });

    logger.log(
      `📚 Swagger documentation available at ${backendUrl}/${apiPrefix}/docs`,
    );
  }

  // Start server
  await app.listen(port, '0.0.0.0');

  // Success logs
  logger.log(`🚀 Furnibles API running on ${backendUrl}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`💚 Health check: ${backendUrl}/${apiPrefix}/health`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
