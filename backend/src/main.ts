import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

// Usar require para evitar problemas de tipos con ES modules
const compression = require('compression');
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Obtener el puerto ANTES de usarlo
  const port = configService.get('PORT', 3002);

  // Security middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Para Codespaces
  }));
  app.use(compression());
  app.use(cookieParser());

  // Función para generar URLs dinámicas de Codespaces
  const getCodespaceUrl = (portNumber: number) => {
    if (process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
      return `https://${process.env.CODESPACE_NAME}-${portNumber}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`;
    }
    return `http://localhost:${portNumber}`;
  };

  // URLs dinámicas
  const backendUrl = getCodespaceUrl(port);
  const frontendUrl = getCodespaceUrl(3000);

  // 🔍 DEBUG CORS - TEMPORAL
  const corsOrigin = configService.get('CORS_ORIGIN');
  logger.debug('🔍 CORS Debug:');
  logger.debug(`Environment CORS_ORIGIN: ${corsOrigin}`);
  logger.debug(`Calculated Frontend URL: ${frontendUrl}`);
  logger.debug(`Backend URL: ${backendUrl}`);
  logger.debug(`NODE_ENV: ${configService.get('NODE_ENV')}`);

  // CORS configuration con URLs dinámicas - MEJORADO
  const allowedOrigins = [
    frontendUrl, // URL dinámica del frontend
    'http://localhost:3000', // Desarrollo local
    'https://localhost:3000', // Desarrollo local HTTPS
    'http://localhost:3001', // Por si acaso
    'https://localhost:3001', // Por si acaso
  ];

  // Agregar CORS_ORIGIN del .env si existe
  if (corsOrigin) {
    allowedOrigins.push(corsOrigin);
  }

  logger.debug(`🌐 Allowed CORS origins: ${JSON.stringify(allowedOrigins)}`);

  // ✅ CONFIGURACIÓN CORS SIMPLIFICADA Y ROBUSTA
  // CORS configuration - ✅ VERSIÓN ACTUALIZADA
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://probable-barnacle-65pw9jg5qwxc5w6-3000.app.github.dev',
    configService.get('CORS_ORIGIN', 'https://probable-barnacle-65pw9jg5qwxc5w6-3000.app.github.dev')
  ],
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
      disableErrorMessages: configService.get('NODE_ENV') === 'production',
    }),
  );

  // ✅ REQUEST LOGGING MEJORADO para debug
  if (configService.get('NODE_ENV') === 'development') {
    app.use((req, res, next) => {
      const origin = req.get('Origin') || 'None';
      const method = req.method;
      const url = req.url;
      
      logger.debug(`📡 ${method} ${url} - Origin: ${origin}`);
      
      // Log específico para OPTIONS (preflight)
      if (method === 'OPTIONS') {
        logger.debug(`🔍 PREFLIGHT REQUEST detected for ${url}`);
        logger.debug(`🔍 Access-Control-Request-Method: ${req.get('Access-Control-Request-Method')}`);
        logger.debug(`🔍 Access-Control-Request-Headers: ${req.get('Access-Control-Request-Headers')}`);
      }
      
      next();
    });
  }

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
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

  logger.log('🧪 PRUEBA: Este es el código que se está ejecutando');
    
  // Start server - IMPORTANTE: bind a 0.0.0.0 para Codespaces
  await app.listen(port, '0.0.0.0');

  // Success logs
  logger.log(`🚀 Furnibles API running on ${backendUrl}`);
  logger.log(`📚 API documentation: ${backendUrl}/${apiPrefix}/docs`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
  logger.log(`🔗 Frontend URL: ${frontendUrl}`);
  
  // Log adicional para debugging
  if (process.env.CODESPACE_NAME) {
    logger.log(`🚀 Codespace detected: ${process.env.CODESPACE_NAME}`);
    logger.log(`🌐 Port forwarding domain: ${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`);
    logger.log(`✅ CORS configured for Codespace subdomain matching`);
  }

  // Health check endpoint info
  logger.log(`💚 Health check: ${backendUrl}/${apiPrefix}/health`);
  logger.log(`🏠 Root endpoint: ${backendUrl}/`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});