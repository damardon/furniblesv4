const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  // ✅ NUEVO: Configuración para export estático
  output: 'export',
  trailingSlash: true,
  
  // ✅ NUEVO: Desabilitar optimizaciones que no funcionan en estático
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'probable-barnacle-65pw9jg5qwxc5w6-3002.app.github.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'furnibles-backend.up.railway.app',
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  
  experimental: {
    // Mejorar el rendimiento de WebVitals
    webVitalsAttribution: ['CLS', 'LCP']
  },
  
  // ✅ MODIFICADO: Webpack config compatible con export
  webpack: (config, { dev, isServer }) => {
    // Configuración para Codespaces (solo en desarrollo)
    if (dev && !isServer && process.env.CODESPACE_NAME) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
      
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    
    // ✅ NUEVO: Fallbacks para export estático
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // ✅ MODIFICADO: Solo para desarrollo en Codespaces
  ...(process.env.CODESPACE_NAME && process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),

  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
};

module.exports = withNextIntl(nextConfig);