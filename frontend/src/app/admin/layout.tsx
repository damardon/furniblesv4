'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Users,
  FileCheck,
  MessageSquare,
  Flag,
  Settings,
  Activity,
  Shield,
  AlertTriangle,
  Database,
  TrendingUp,
  UserCheck,
  Package,
  BarChart3,
  Download,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  Home
} from 'lucide-react'

// Stores
import { useAuthStore } from '@/lib/stores/auth-store'
import { useAdminStore } from '@/lib/stores/admin-store'
import { UserRole } from '@/types'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('admin')

  // Stores
  const { user, isAuthenticated } = useAuthStore()
  const { 
    pendingProducts, 
    pendingReviews, 
    flaggedContent,
    dashboardStats,
    fetchDashboardStats,
    fetchPendingProducts,
    fetchPendingReviews,
    fetchFlaggedContent
  } = useAdminStore()

  // 🔐 Protección de rutas - Solo ADMIN
  useEffect(() => {
    if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
      router.push('/')
      return
    }

    // Cargar datos iniciales del admin
    const loadAdminData = async () => {
      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchPendingProducts(), 
          fetchPendingReviews(),
          fetchFlaggedContent()
        ])
      } catch (error) {
        console.error('Error loading admin data:', error)
      }
    }

    loadAdminData()
  }, [isAuthenticated, user, router, fetchDashboardStats, fetchPendingProducts, fetchPendingReviews, fetchFlaggedContent])

  // Si no es admin, mostrar loading mientras redirige
  if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Calcular contadores de moderación
  const getPendingCount = () => {
    const products = pendingProducts?.length || 0
    const reviews = pendingReviews?.length || 0
    const flagged = (flaggedContent?.reviews?.length || 0) + (flaggedContent?.users?.length || 0)
    return products + reviews + flagged
  }

  // Navegación del sidebar
  const sidebarNavigation = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      description: 'Vista general'
    },
    {
      label: 'Usuarios',
      href: '/admin/usuarios',
      icon: Users,
      description: 'Gestión de usuarios',
      badge: dashboardStats?.totalUsers
    },
    {
      label: 'Productos',
      href: '/admin/productos',
      icon: FileCheck,
      description: 'Moderación de productos',
      badge: pendingProducts?.length || 0,
      badgeColor: 'orange'
    },
    {
      label: 'Reviews',
      href: '/admin/reviews',
      icon: MessageSquare,
      description: 'Moderación de reviews',
      badge: pendingReviews?.length || 0,
      badgeColor: 'orange'
    },
    {
      label: 'Reportes',
      href: '/admin/reportes',
      icon: Flag,
      description: 'Contenido reportado',
      badge: (flaggedContent?.reviews?.length || 0) + (flaggedContent?.users?.length || 0),
      badgeColor: 'red'
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: Activity,
      description: 'Métricas de plataforma'
    },
    {
      label: 'Configuración',
      href: '/admin/configuracion',
      icon: Settings,
      description: 'Configuración del sistema'
    }
  ]

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: Array<{ label: string; href: string; icon?: any }> = [
      { label: 'Inicio', href: '/', icon: Home }
    ]

    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      let label = segment

      // Traducir segmentos conocidos
      switch (segment) {
        case 'admin':
          label = 'Admin'
          break
        case 'usuarios':
          label = 'Usuarios'
          break
        case 'productos':
          label = 'Productos'
          break
        case 'reviews':
          label = 'Reviews'
          break
        case 'reportes':
          label = 'Reportes'
          break
        case 'analytics':
          label = 'Analytics'
          break
        case 'configuracion':
          label = 'Configuración'
          break
        default:
          label = segment.charAt(0).toUpperCase() + segment.slice(1)
      }

      breadcrumbs.push({ label, href })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SIDEBAR OVERLAY (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r-[5px] border-black transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-30
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b-[3px] border-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 border-2 border-black">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-black text-lg uppercase text-black">
                  Admin Panel
                </h2>
                <p className="text-xs font-bold text-gray-600">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>
            
            {/* Close button mobile */}
            <button
              className="lg:hidden p-1 hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Status Overview */}
          {getPendingCount() > 0 && (
            <div className="mt-4 p-3 bg-red-50 border-2 border-red-500">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-black text-red-600 uppercase">
                  {getPendingCount()} Pendientes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-4 space-y-2">
          {sidebarNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const hasBadge = item.badge && item.badge > 0

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  group flex items-center justify-between p-3 font-bold text-sm transition-all border-2
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
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <div>
                    <div className="uppercase">{item.label}</div>
                    <div className="text-xs font-medium text-gray-600 group-hover:text-black">
                      {item.description}
                    </div>
                  </div>
                </div>

                {hasBadge && (
                  <span 
                    className={`
                      px-2 py-1 text-xs font-black border-2 border-black
                      ${item.badgeColor === 'red' ? 'bg-red-500 text-white' : 
                        item.badgeColor === 'orange' ? 'bg-orange-500 text-black' : 
                        'bg-gray-200 text-black'}
                    `}
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    {(item.badge || 0) > 99 ? '99+' : (item.badge || 0)}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* System Status Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-[3px] border-black bg-gray-100">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-600">Sistema:</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-bold text-green-600">ACTIVO</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-600">Usuarios:</span>
              <span className="font-black text-black">{dashboardStats?.totalUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-600">Productos:</span>
              <span className="font-black text-black">{dashboardStats?.totalProducts || 0}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b-[3px] border-black p-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button + Breadcrumbs */}
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 bg-white border-2 border-black hover:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-black" />
              </button>

              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center space-x-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center">
                    {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />}
                    {index === 0 ? (
                      <Link
                        href={crumb.href}
                        className="flex items-center gap-1 text-gray-600 hover:text-black font-bold"
                      >
                        {crumb.icon && <crumb.icon className="h-4 w-4" />}
                        {crumb.label}
                      </Link>
                    ) : index === breadcrumbs.length - 1 ? (
                      <span className="font-black text-black uppercase">{crumb.label}</span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-gray-600 hover:text-black font-bold"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {/* Quick stats */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                {getPendingCount() > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white border-2 border-black">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-black">{getPendingCount()} PENDIENTES</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500 text-black border-2 border-black">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-black">${dashboardStats?.totalRevenue || 0}</span>
                </div>
              </div>

              {/* Back to site */}
              <Link
                href="/"
                className="px-4 py-2 bg-white border-2 border-black font-black text-black text-sm uppercase hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                ← SITIO
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}