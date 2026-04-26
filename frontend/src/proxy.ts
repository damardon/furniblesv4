import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const sellerRoutes = [
    '/vendedor-dashboard',
    '/vendedor-dashboard/dashboard',
    '/vendedor-dashboard/productos',
    '/vendedor-dashboard/ventas',
    '/vendedor-dashboard/analytics',
    '/vendedor-dashboard/reviews',
    '/vendedor-dashboard/perfil',
    '/vendedor-dashboard/configuracion',
  ]

  const adminRoutes = ['/admin/dashboard']

  const isSellerRoute = sellerRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  if (isSellerRoute || isAdminRoute) {
    const authToken = request.cookies.get('furnibles-auth-storage')?.value

    if (!authToken) {
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('auth', 'required')
      return NextResponse.redirect(redirectUrl)
    }

    try {
      const authData = JSON.parse(authToken)
      const { state } = authData

      if (!state || !state.isAuthenticated || !state.user || !state.token) {
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('auth', 'required')
        return NextResponse.redirect(redirectUrl)
      }

      const user = state.user

      if (isSellerRoute) {
        const canAccessSeller =
          user.role === 'SELLER' || user.role === 'ADMIN' || user.isBoth === true

        if (!canAccessSeller) {
          const redirectUrl = new URL('/', request.url)
          redirectUrl.searchParams.set('error', 'seller_access_denied')
          return NextResponse.redirect(redirectUrl)
        }
      }

      if (isAdminRoute && user.role !== 'ADMIN') {
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('error', 'admin_access_denied')
        return NextResponse.redirect(redirectUrl)
      }

      if (state.tokenExpiry && Date.now() >= state.tokenExpiry) {
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('auth', 'expired')
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Proxy auth error:', error)
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('auth', 'invalid')
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (pathname === '/vendedor-dashboard') {
    return NextResponse.redirect(new URL('/vendedor-dashboard/dashboard', request.url))
  }

  if (pathname === '/vendedores' || pathname.startsWith('/vendedores/')) {
    return NextResponse.next()
  }

  if (pathname === '/admin') {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
