// frontend/src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { Providers } from '@/components/providers'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { CartModal } from '@/components/cart/cart-modal'
import { LoginModal } from '@/components/auth/login-modal'
import { RegisterModal } from '@/components/auth/register-modal'
import { NotificationPanelWrapper } from '@/components/notifications/notification-panel-wrapper'
import { Footer } from '@/components/layout/footer'
import { CartProvider } from '@/contexts/cart-context'
import { PaymentProvider } from '@/contexts/payment-context'
import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})

export const metadata: Metadata = {
  title: {
    default: 'Furnibles - Marketplace de Planos de Muebles Artesanales',
    template: '%s | Furnibles'
  },
  description: 'Descubre, compra y vende planos digitales de muebles únicos. La comunidad de artesanos y entusiastas del DIY más grande de Latinoamérica.',
  keywords: [
    'muebles',
    'planos',
    'DIY',
    'artesanía',
    'carpintería',
    'diseño',
    'madera',
    'marketplace',
    'craftsman',
    'handmade'
  ],
  authors: [{ name: 'Equipo Furnibles' }],
  creator: 'Furnibles',
  publisher: 'Furnibles',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Furnibles',
    title: 'Furnibles - Marketplace de Planos de Muebles Artesanales',
    description: 'Descubre, compra y vende planos digitales de muebles únicos.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Furnibles - Marketplace de Planos de Muebles',
    description: 'Descubre, compra y vende planos digitales de muebles únicos.',
    creator: '@furnibles',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9750B' },
    { media: '(prefers-color-scheme: dark)', color: '#F9750B' },
  ],
  colorScheme: 'light dark',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  
  return (
    <html lang={locale} className={montserrat.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content="Furnibles" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Furnibles" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#F9750B" />
      </head>
      <body 
        className={`${montserrat.className} font-medium text-lg leading-tight text-black bg-white antialiased selection:bg-yellow-400 selection:text-black`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          {/* ✅ CORREGIDO: Solo un AuthProvider, anidando CartProvider dentro */}
          <AuthProvider>
            <CartProvider>
              <PaymentProvider>
              <div id="root" className="relative flex min-h-screen flex-col w-full">
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-orange-500 text-black rounded-none border-2 border-black font-black"
                >
                  Saltar al contenido principal
                </a>
                
                {/* Header completo con funcionalidad */}
                <Header />
                
                {/* Main Content - ANCHO COMPLETO Y RESPONSIVO */}
                <main id="main-content" className="flex-1 w-full">
                  <div className="w-full min-h-full px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                  </div>
                </main>
                
                {/* Footer i18n Component */}
                <Footer />

                {/* ✅ CORREGIDO: Modales y overlays globales con wrapper que maneja el estado */}
                <CartModal />
                <LoginModal />
                <RegisterModal />
                <NotificationPanelWrapper />
              </div>
              
              {/* Toast Notifications SABDA Style */}
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: '#ffffff',
                    color: '#000000',
                    border: '3px solid #000000',
                    borderRadius: '0',
                    padding: '16px',
                    fontSize: '16px',
                    fontFamily: 'var(--font-montserrat)',
                    fontWeight: '700',
                    boxShadow: '5px 5px 0 #000000',
                  },
                  success: {
                    style: {
                      background: '#FFBF11',
                      color: '#000000',
                      border: '3px solid #000000',
                    },
                  },
                  error: {
                    style: {
                      background: '#e8626d',
                      color: '#ffffff',
                      border: '3px solid #000000',
                    },
                  },
                }}
              />
              </PaymentProvider>
            </CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}