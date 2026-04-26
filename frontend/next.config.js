const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  // ✅ NUEVO: Configuración para export estático
  
  trailingSlash: true,
  
  // ✅ NUEVO: Desabilitar optimizaciones que no funcionan en estático
  images: {
    unoptimized: true,
    remotePatterns: [
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

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
};

module.exports = withNextIntl(nextConfig);