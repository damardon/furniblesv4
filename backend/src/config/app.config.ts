import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: (() => {
  const port = parseInt(process.env.PORT, 10);
  return isNaN(port) ? 3001 : port;
  })(),
  apiPrefix: process.env.API_PREFIX || 'api',
  frontendUrl: process.env.FRONTEND_URL || 'https://probable-barnacle-65wp9jg5qwxc5w6-3000.app.github.dev',
  corsOrigin: process.env.CORS_ORIGIN || 'https://probable-barnacle-65wp9jg5qwxc5w6-3000.app.github.dev',
  
  // Rate limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },

  // File uploads
  uploads: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD, 10) || 6,
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
  },

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
}));