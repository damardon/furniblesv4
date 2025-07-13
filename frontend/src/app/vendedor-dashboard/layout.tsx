'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Package,
  ShoppingBag,
  TrendingUp,
  MessageSquare,
  User,
  Settings,
  Home,
} from 'lucide-react'

import { useAuthStore } from '@/lib/stores/auth-store'

interface SellerLayoutProps {
  children: React.ReactNode
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('seller')
  const { user, isAuthenticated, canAccessSellerFeatures } = useAuthStore()

  // Verificar autenticación y permisos de seller
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    if (!canAccessSellerFeatures()) {
      router.push('/')
      return
    }
  }, [isAuthenticated, canAccessSellerFeatures, router])

  // Navegación lateral del seller - coherente con backend
  const sidebarNavItems = [
    {
      title: 'Dashboard',
      href: '/vendedor/dashboard',
      icon: BarChart3,
      description: 'Resumen y estadísticas'
    },
    {
      title: 'Productos',
      href: '/vendedor/productos',
      icon: Package,
      description: 'Gestión de productos'
    },
    {
      title: 'Ventas',
      href: '/vendedor/ventas',
      icon: ShoppingBag,
      description: 'Ventas y pedidos'
    },
    {
      title: 'Analytics',
      href: '/vendedor/analytics',
      icon: TrendingUp,
      description: 'Analytics detallados'
    },
    {
      title: 'Reviews',
      href: '/vendedor/reviews',
      icon: MessageSquare,
      description: 'Gestión de reseñas'
    },
    {
      title: 'Perfil',
      href: '/vendedor/perfil',
      icon: User,
      description: 'Perfil de tienda'
    },
    {
      title: 'Configuración',
      href: '/vendedor/configuracion',
      icon: Settings,
      description: 'Configuración'
    },
  ]

  // Función para generar breadcrumb dinámico
  const getBreadcrumbText = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length <= 1) return 'Panel Vendedor'
    
    const lastSegment = segments[segments.length - 1]
    const breadcrumbMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'productos': 'Productos',
      'nuevo': 'Nuevo Producto',
      'editar': 'Editar Producto',
      'ventas': 'Ventas',
      'analytics': 'Analytics',
      'reviews': 'Reviews',
      'perfil': 'Perfil',
      'configuracion': 'Configuración'
    }
    
    return breadcrumbMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  // Mostrar loading si no está autenticado
  if (!isAuthenticated || !canAccessSellerFeatures()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb SABDA */}
      <div className="bg-white border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm font-bold">
            <Link 
              href="/"
              className="text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              Inicio
            </Link>
            <span className="text-black font-black">→</span>
            <span className="text-orange-500 font-black uppercase">{getBreadcrumbText()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR NAVEGACIÓN */}
          <div className="lg:col-span-1">
            <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
              {/* Header de vendedor - usando datos del SellerProfile */}
              <div className="mb-6 pb-6 border-b-[2px] border-black">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 border-2 border-black flex items-center justify-center">
                    <span className="text-black font-black text-xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-black">
                      {user?.sellerProfile?.storeName || `${user?.firstName} ${user?.lastName}`}
                    </h3>
                    <p className="text-sm text-gray-600 font-bold">
                      {user?.sellerProfile?.isVerified ? (
                        <span className="text-green-600">✓ Verificado</span>
                      ) : (
                        <span className="text-yellow-600">Pendiente verificación</span>
                      )}
                    </p>
                    {/* Rating del seller si existe */}
                    {user?.sellerProfile?.rating && user.sellerProfile.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-xs font-bold text-gray-700">
                          {user.sellerProfile.rating.toFixed(1)} ({user.sellerProfile.totalSales} ventas)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navegación */}
              <nav className="space-y-2">
                {sidebarNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-3 font-bold text-sm border-2 transition-all duration-200
                        ${isActive 
                          ? 'bg-orange-500 text-black border-black' 
                          : 'bg-white text-black border-transparent hover:bg-yellow-400 hover:border-black'
                        }
                      `}
                      style={{ 
                        boxShadow: isActive ? '3px 3px 0 #000000' : 'none',
                        transform: isActive ? 'translate(-1px, -1px)' : 'none'
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-black uppercase">{item.title}</div>
                        <div className="text-xs text-gray-600 font-normal">{item.description}</div>
                      </div>
                    </Link>
                  )
                })}
              </nav>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t-[2px] border-black">
                <h4 className="font-black text-sm uppercase text-black mb-3">Acciones Rápidas</h4>
                <div className="space-y-2">
                  <Link
                    href="/vendedor/productos/nuevo"
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 border-2 border-black font-bold text-black text-sm hover:bg-green-400 transition-all"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <Package className="h-4 w-4" />
                    SUBIR PRODUCTO
                  </Link>
                  
                  <Link
                    href="/vendedor/analytics"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 border-2 border-black font-bold text-black text-sm hover:bg-blue-400 transition-all"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <BarChart3 className="h-4 w-4" />
                    VER ANALYTICS
                  </Link>
                </div>
              </div>

              {/* Seller Stats Quick View */}
              {user?.sellerProfile && (
                <div className="mt-6 pt-6 border-t-[2px] border-black">
                  <h4 className="font-black text-sm uppercase text-black mb-3">Stats Rápidas</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">Ventas Totales:</span>
                      <span className="font-black text-black">{user.sellerProfile.totalSales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">Rating:</span>
                      <span className="font-black text-black">
                        {user.sellerProfile.rating > 0 ? user.sellerProfile.rating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">Verificado:</span>
                      <span className={`font-black ${user.sellerProfile.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                        {user.sellerProfile.isVerified ? 'SÍ' : 'PENDIENTE'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}