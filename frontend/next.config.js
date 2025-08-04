const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  experimental: {
    // Mejorar el rendimiento de WebVitals
    webVitalsAttribution: ['CLS', 'LCP']
  },
  
  // Configuración específica para GitHub Codespaces
  ...(process.env.CODESPACE_NAME && {
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Configurar WebSocket para HMR en Codespaces
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        };
        
        // Configuración adicional para Hot Module Replacement
        config.infrastructureLogging = {
          level: 'error',
        };
      }
      return config;
    },
    
    // Configuración para hot reload en Codespaces
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'probable-barnacle-65pw9jg5qwxc5w6-3002.app.github.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      // ✅ AGREGADO: Unsplash para imágenes reales de muebles
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
      // ❌ ELIMINADO: picsum.photos (ya no lo usamos)
    ],
  },
  
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
};

module.exports = withNextIntl(nextConfig);