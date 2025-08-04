import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// ✅ REMOVER la importación de getLocale que causa el error
// import { getLocale } from 'next-intl/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // ✅ REMOVER la línea que obtiene locale que causa el error
  // const locale = await getLocale()

  // ✅ EXCLUIR /vendedores (página pública) de la protección
  if (pathname === '/vendedores' || pathname.startsWith('/vendedores/')) {
    return NextResponse.next()
  }

  // ✅ PERMITIR acceso al login de admin (página pública)
  if (pathname === '/admin') {
    return NextResponse.next()
  }

  // ✅ Rutas protegidas del seller (ACTUALIZADAS con nuevos nombres)
  const sellerRoutes = [
    '/vendedor-dashboard',
    '/vendedor-dashboard/dashboard',
    '/vendedor-dashboard/productos',
    '/vendedor-dashboard/ventas',
    '/vendedor-dashboard/analytics', 
    '/vendedor-dashboard/reviews',
    '/vendedor-dashboard/perfil',
    '/vendedor-dashboard/configuracion'
  ]

  // ✅ Rutas protegidas del admin
  const adminRoutes = [
    '/admin/dashboard'
  ]

  // Verificar si es una ruta protegida del seller
  const isSellerRoute = sellerRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  if (isSellerRoute || isAdminRoute) {
    // Obtener token de las cookies
    const authToken = request.cookies.get('furnibles-auth-storage')?.value

    if (!authToken) {
      // Si no hay token, redirigir al home con mensaje
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('auth', 'required')
      return NextResponse.redirect(redirectUrl)
    }

    try {
      // Parsear el token del localStorage persistido
      const authData = JSON.parse(authToken)
      const { state } = authData

      if (!state || !state.isAuthenticated || !state.user || !state.token) {
        // Si no está autenticado, redirigir al home
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('auth', 'required')
        return NextResponse.redirect(redirectUrl)
      }

      const user = state.user

      // Verificar permisos de seller
      if (isSellerRoute) {
        const canAccessSeller = 
          user.role === 'SELLER' || 
          user.role === 'ADMIN' || 
          user.isBoth === true

        if (!canAccessSeller) {
          // Si no tiene permisos de seller, redirigir con mensaje
          const redirectUrl = new URL('/', request.url)
          redirectUrl.searchParams.set('error', 'seller_access_denied')
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Verificar permisos de admin
      if (isAdminRoute) {
        if (user.role !== 'ADMIN') {
          // Si no es admin, redirigir con mensaje
          const redirectUrl = new URL('/', request.url)
          redirectUrl.searchParams.set('error', 'admin_access_denied')
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Verificar si el token ha expirado
      if (state.tokenExpiry && Date.now() >= state.tokenExpiry) {
        // Token expirado, redirigir para reautenticación
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('auth', 'expired')
        return NextResponse.redirect(redirectUrl)
      }

    } catch (error) {
      // Error al parsear el token, redirigir
      console.error('Middleware auth error:', error)
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('auth', 'invalid')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // ✅ Redirigir /vendedor-dashboard exacto a /vendedor-dashboard/dashboard
  if (pathname === '/vendedor-dashboard') {
    return NextResponse.redirect(new URL('/vendedor-dashboard/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public folder files
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}