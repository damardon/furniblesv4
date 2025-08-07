'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationButton } from '@/components/notifications/notification-button'
import {
  Search,
  ShoppingCart,
  Bell,
  User,
  Menu,
  X,
  Settings,
  LogOut,
  Plus,
  BarChart3,
  Shield,
  Heart,
  Package,
  Home,
  Grid3X3,
  Users,
  HelpCircle,
  AlertTriangle,
  MessageSquare,
  Flag,
  UserCheck,
  LayoutDashboard,
  FileCheck,
  Activity
} from 'lucide-react'

// Imports de stores
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCartStore } from '@/lib/stores/cart-store'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { useAdminStore } from '@/lib/stores/admin-store'
import { UserRole } from '@/types'

// Imports de componentes UI
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Hooks
  const router = useRouter()
  const pathname = usePathname()
  
  // ✅ Traducciones
  const t = useTranslations('header')
  const tCommon = useTranslations('common')

  // Stores
  const { user, isAuthenticated, logout, setLoginModalOpen, setRegisterModalOpen } = useAuthStore()
  const { itemCount, isCartOpen, setCartOpen } = useCartStore()
  const { unreadCount, setNotificationPanelOpen, fetchNotifications } = useNotificationStore()
  
  // Admin Store
  const { 
    pendingProducts, 
    pendingReviews, 
    flaggedContent, 
    dashboardStats,
    fetchPendingProducts,
    fetchPendingReviews,
    fetchFlaggedContent
  } = useAdminStore()

  // ✅ Cargar notificaciones cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(true)
    }
  }, [isAuthenticated, fetchNotifications])

  // Calcular total de items pendientes de moderación
  const getPendingModerationCount = () => {
    const pendingProductsCount = pendingProducts?.length || 0
    const pendingReviewsCount = pendingReviews?.length || 0
    const flaggedContentCount = (flaggedContent?.reviews?.length || 0) + (flaggedContent?.users?.length || 0)
    return pendingProductsCount + pendingReviewsCount + flaggedContentCount
  }

  // Efecto para cargar datos de admin si es necesario
  useEffect(() => {
    if (user?.role === UserRole.ADMIN && isAuthenticated) {
      // Cargar datos de moderación en background
      fetchPendingProducts().catch(console.error)
      fetchPendingReviews().catch(console.error) 
      fetchFlaggedContent().catch(console.error)
    }
  }, [user, isAuthenticated, fetchPendingProducts, fetchPendingReviews, fetchFlaggedContent])

  // Navegación principal con traducciones
  const mainNavItems = [
    { href: '/productos', label: t('products'), icon: Grid3X3 },
    { href: '/vendedores', label: t('sellers'), icon: Users },
    { href: '/ayuda', label: t('help'), icon: HelpCircle },
  ]

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  // Manejar logout
  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Obtener iniciales del usuario
  const getUserInitials = () => {
    if (!user) return 'U'
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }

  return (
    <header className="bg-white">
      {/* Contenedor principal con mismo ancho que layout */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* LOGO Y MARCA FURNIBLES - APLICANDO SOLO LOS AJUSTES SOLICITADOS */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex items-center gap-2">
                {/* Logo principal JPG - MÁS GRANDE, SIN HOVER, FIJO */}
                <div 
                  className="flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-white border-3 border-black"
                >
                  <img 
                    src="/images/logo furnibles.jpg" 
                    alt="FURNIBLES Logo" 
                    className="w-16 h-16 lg:w-20 lg:h-20 object-contain"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                
                {/* Texto de marca con Montserrat - SIN HOVER, 5% MÁS PEQUEÑO, MÁS PEGADO */}
                <div className="flex flex-col items-center">
                  <h1 className="furnibles-logo-text text-[2.28rem] lg:text-[2.85rem] xl:text-[3.42rem] text-black">
                    FURNIBLES
                  </h1>
                  <span className="furnibles-tagline text-sm lg:text-base text-black mt-1 hidden sm:block">
                    CRAFT • BUILD • SHARE
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* NAVEGACIÓN PRINCIPAL (Desktop) */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-4">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 font-black text-xl xl:text-base uppercase transition-all duration-200
                    ${isActive 
                      ? 'bg-orange-500 text-black border-2 border-black' 
                      : 'text-black hover:text-orange-500 hover:bg-yellow-400 border-2 border-transparent hover:border-black'
                    }
                  `}
                  style={{ 
                    boxShadow: isActive ? '3px 3px 0 #000000' : 'none',
                    transform: isActive ? 'translate(-1px, -1px)' : 'none'
                  }}
                >
                  <Icon className="h-3 w-3 xl:h-4 xl:w-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* BARRA DE BÚSQUEDA (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md xl:max-w-lg mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2 lg:py-3 text-sm font-bold
                  bg-white border-3 border-black 
                  focus:outline-none focus:bg-yellow-400
                  transition-all duration-200
                "
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
            </form>
          </div>

          {/* ACCIONES DEL HEADER */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Búsqueda Mobile */}
            <button
              className="md:hidden px-4 py-3 bg-white border-2 border-black hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-4 w-4 text-black" />
            </button>

            {/* Admin Alert Button - Solo para ADMIN */}
            {user?.role === UserRole.ADMIN && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative p-2 bg-red-500 border-2 border-black hover:bg-red-400 transition-all"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                    title="Moderación pendiente"
                  >
                    <Shield className="h-4 w-4 text-white" />
                    {getPendingModerationCount() > 0 && (
                      <span 
                        className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-black px-2 py-1 border-2 border-black min-w-[20px] h-[20px] flex items-center justify-center"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        {getPendingModerationCount() > 99 ? '99+' : getPendingModerationCount()}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  className="w-64 bg-white border-3 border-black p-2" 
                  align="end" 
                  style={{ boxShadow: '5px 5px 0 #000000' }}
                >
                  <DropdownMenuLabel className="font-black text-black uppercase text-xs">
                    🚨 {t('admin_moderation_pending')}
                  </DropdownMenuLabel>
                  
                  <div className="h-[2px] bg-black my-2" />
                  
                  {/* Productos pendientes */}
                  <DropdownMenuItem asChild>
                    <Link href="/admin/productos" className="cursor-pointer font-bold text-black hover:bg-yellow-400 px-2 py-1">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <FileCheck className="mr-2 h-4 w-4" />
                          <span className="text-xs">{t('admin_products')}</span>
                        </div>
                        {(pendingProducts?.length || 0) > 0 && (
                          <span className="bg-orange-500 text-black text-xs font-black px-2 py-1 border border-black">
                            {pendingProducts?.length}
                          </span>
                        )}
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  {/* Reviews pendientes */}
                  <DropdownMenuItem asChild>
                    <Link href="/admin/reviews" className="cursor-pointer font-bold text-black hover:bg-yellow-400 px-2 py-1">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span className="text-xs">{t('admin_reviews')}</span>
                        </div>
                        {(pendingReviews?.length || 0) > 0 && (
                          <span className="bg-orange-500 text-black text-xs font-black px-2 py-1 border border-black">
                            {pendingReviews?.length}
                          </span>
                        )}
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  {/* Contenido reportado */}
                  <DropdownMenuItem asChild>
                    <Link href="/admin/reportes" className="cursor-pointer font-bold text-black hover:bg-yellow-400 px-2 py-1">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <Flag className="mr-2 h-4 w-4" />
                          <span className="text-xs">{t('admin_reports')}</span>
                        </div>
                        {((flaggedContent?.reviews?.length || 0) + (flaggedContent?.users?.length || 0)) > 0 && (
                          <span className="bg-red-500 text-white text-xs font-black px-2 py-1 border border-black">
                            {(flaggedContent?.reviews?.length || 0) + (flaggedContent?.users?.length || 0)}
                          </span>
                        )}
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <div className="h-[2px] bg-black my-2" />

                  {/* Acceso rápido al dashboard */}
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer font-bold text-black hover:bg-green-400 px-2 py-1">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span className="text-xs">{t('admin_dashboard')}</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Carrito SABDA */}
            <button
              className="relative p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              onClick={() => setCartOpen(!isCartOpen)}
            >
              <ShoppingCart className="h-4 w-4 text-black" />
              {itemCount > 0 && (
                <span 
                  className="absolute -top-2 -right-2 bg-orange-500 text-black text-xs font-black px-2 py-1 border-2 border-black min-w-[20px] h-[20px] flex items-center justify-center"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* ✅ CORREGIDO: Usar NotificationButton component */}
            <NotificationButton />

            {/* Usuario Menu SABDA */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                  className="relative px-8 py-4 bg-green-500 border-2 border-black hover:bg-green-400 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center text-black text-sm font-black">
                    {getUserInitials()}
                  </div>
                </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  className="w-56 bg-white border-3 border-black p-2" 
                  align="end" 
                  style={{ boxShadow: '5px 5px 0 #000000' }}
                >
                  <DropdownMenuLabel className="font-black text-black">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-black uppercase">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-600 font-bold lowercase">
                        {user.email}
                      </p>
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="bg-orange-500 text-black text-xs font-black px-2 py-1 border border-black">
                          {user.role}
                        </span>
                        {user.isBoth && (
                          <span className="bg-yellow-400 text-black text-xs font-black px-2 py-1 border border-black">
                            MULTI
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  
                  <div className="h-[2px] bg-black my-2" />
                  
                  {/* Navegación del perfil */}
                  <DropdownMenuItem asChild>
                    <Link href="/perfil" className="cursor-pointer font-bold text-black hover:bg-yellow-400 px-2 py-1">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('my_profile')}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/pedidos" className="cursor-pointer font-bold text-black hover:bg-yellow-400 px-2 py-1">
                      <Package className="mr-2 h-4 w-4" />
                      <span>{t('my_orders')}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/favoritos" className="cursor-pointer font-bold text-black hover:bg-yellow-400 px-2 py-1">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>{t('favorites')}</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* Seller features */}
                  {(user.role === UserRole.SELLER || user.role === UserRole.ADMIN || user.isBoth) && (
                    <>
                      <div className="h-[2px] bg-black my-2" />
                      <DropdownMenuItem asChild>
                        <Link href="/vendedor-dashboard/dashboard" className="cursor-pointer font-bold text-black hover:bg-yellow-400 px-2 py-1">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          <span>{t('seller_dashboard')}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link href="/vendedor-dashboard/productos/nuevo" className="cursor-pointer font-bold text-black hover:bg-yellow-400 px-2 py-1">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>{t('upload_product')}</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Admin features mejoradas */}
                  {user.role === UserRole.ADMIN && (
                    <>
                      <div className="h-[2px] bg-black my-2" />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer font-bold text-black hover:bg-green-400 px-2 py-1">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>{t('admin_panel')}</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/admin/usuarios" className="cursor-pointer font-bold text-black hover:bg-green-400 px-2 py-1">
                          <UserCheck className="mr-2 h-4 w-4" />
                          <span>{t('admin_users')}</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/admin/analytics" className="cursor-pointer font-bold text-black hover:bg-green-400 px-2 py-1">
                          <Activity className="mr-2 h-4 w-4" />
                          <span>{t('admin_analytics')}</span>
                        </Link>
                      </DropdownMenuItem>

                      {/* Mostrar badge de moderación pendiente */}
                      {getPendingModerationCount() > 0 && (
                        <div className="px-2 py-1 mt-2">
                          <div className="bg-red-500 text-white text-xs font-black px-2 py-1 border-2 border-black text-center">
                            <AlertTriangle className="inline h-3 w-3 mr-1" />
                            {getPendingModerationCount()} {t('admin_pending')}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="h-[2px] bg-black my-2" />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/configuracion" className="cursor-pointer font-bold text-black hover:bg-yellow-400 px-2 py-1">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{tCommon('settings')}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer font-bold text-red-600 hover:bg-red-100 px-2 py-1"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Botones de Login/Register SABDA */
              <div className="hidden sm:flex items-center gap-2">
                <button
                  className="px-3 lg:px-4 py-2 bg-white border-2 border-black font-black text-black text-xs lg:text-sm uppercase hover:bg-yellow-400 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  onClick={() => setLoginModalOpen(true)}
                >
                  {t('login')}
                </button>
                <button
                  className="px-3 lg:px-4 py-2 bg-orange-500 border-2 border-black font-black text-black text-xs lg:text-sm uppercase hover:bg-yellow-400 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  onClick={() => setRegisterModalOpen(true)}
                >
                  {t('register')}
                </button>
              </div>
            )}
            {/* Selector de idioma SABDA  */}
            <LanguageSwitcher />

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4 text-black" />
              ) : (
                <Menu className="h-4 w-4 text-black" />
              )}
            </button>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA MOBILE */}
        {isSearchOpen && (
          <div className="md:hidden py-4 border-t-2 border-black mt-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-3 text-sm font-bold
                  bg-white border-3 border-black
                  focus:outline-none focus:bg-yellow-400
                "
                style={{ boxShadow: '3px 3px 0 #000000' }}
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
            </form>
          </div>
        )}

        {/* MENÚ MOBILE SABDA */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t-2 border-black mt-4 pt-4">
            <nav className="space-y-3">
              {mainNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 font-black text-sm uppercase transition-all border-2
                      ${isActive 
                        ? 'bg-orange-500 text-black border-black' 
                        : 'bg-white text-black border-black hover:bg-yellow-400'
                      }
                    `}
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              
              {/* Admin access mobile */}
              {user?.role === UserRole.ADMIN && (
                <>
                  <div className="h-[3px] bg-black my-4" />
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 font-black text-sm uppercase transition-all border-2 bg-red-500 text-white border-black hover:bg-red-400"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <Shield className="h-5 w-5" />
                    <span>{t('admin_panel')}</span>
                    {getPendingModerationCount() > 0 && (
                      <span className="bg-yellow-400 text-black text-xs font-black px-2 py-1 border border-black">
                        {getPendingModerationCount()}
                      </span>
                    )}
                  </Link>
                </>
              )}
              
              {/* Divider */}
              <div className="h-[3px] bg-black my-4" />
              
              {/* User section mobile */}
              {!isAuthenticated && (
                <div className="space-y-3">
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-black font-black text-black text-sm uppercase hover:bg-yellow-400 transition-all"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                    onClick={() => {
                      setLoginModalOpen(true)
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <User className="h-4 w-4" />
                    {t('login')}
                  </button>
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 border-2 border-black font-black text-black text-sm uppercase hover:bg-yellow-400 transition-all"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                    onClick={() => {
                      setRegisterModalOpen(true)
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {t('register')}
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}