'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  UserIcon,
  SettingsIcon,
  ArrowLeftIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ShoppingBagIcon,
  HeartIcon,
  MessageSquareIcon,
  DownloadIcon,
  TrendingUpIcon,
  BellIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  TrashIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  BarChartIcon,
  DollarSignIcon
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getOrderStats } from '@/data/mockOrders'
import { getFavoriteStats } from '@/data/mockFavorites'
import { getReviewStats } from '@/data/mockReviews'
import { getDownloadStats } from '@/data/mockDownloads'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  country: string
  city: string
  address: string
  zipCode: string
  avatar?: string
}

interface NotificationSettings {
  emailEnabled: boolean
  orderNotifications: boolean
  paymentNotifications: boolean
  reviewNotifications: boolean
  marketingEmails: boolean
  weeklyDigest: boolean
  newProductAlerts: boolean
  priceDropAlerts: boolean
}

export default function ProfilePage() {
  const t = useTranslations('profile')
  const router = useRouter()
  
  // Stores
  const { isAuthenticated, user, setLoginModalOpen } = useAuthStore()

  // States
  const [activeTab, setActiveTab] = useState<'personal' | 'notifications' | 'security' | 'stats'>('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Profile data
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    country: 'Chile',
    city: '',
    address: '',
    zipCode: '',
    avatar: undefined
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    orderNotifications: true,
    paymentNotifications: true,
    reviewNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    newProductAlerts: false,
    priceDropAlerts: false
  })

  // Stats
  const [stats, setStats] = useState({
    orders: { totalOrders: 0, totalSpent: 0, completedOrders: 0, pendingOrders: 0 },
    favorites: { totalFavorites: 0, recentlyAdded: 0 },
    reviews: { totalReviews: 0, averageRating: 0, helpfulVotes: 0 },
    downloads: { totalProducts: 0, totalDownloads: 0, downloadsThisMonth: 0 }
  })

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoginModalOpen(true)
      router.push('/productos')
      return
    }
  }, [isAuthenticated, setLoginModalOpen, router])

  // Load user data and stats
  useEffect(() => {
    if (user?.id) {
      // Set profile data from user
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.buyerProfile?.phone || '',
        dateOfBirth: '',
        country: 'Chile',
        city: '',
        address: '',
        zipCode: '',
        avatar: user.buyerProfile?.avatar
      })

      // Load stats
      const orderStats = getOrderStats(user.id)
      const favoriteStats = getFavoriteStats(user.id)
      const reviewStats = getReviewStats(user.id)
      const downloadStats = getDownloadStats(user.id)

      setStats({
        orders: orderStats,
        favorites: favoriteStats,
        reviews: reviewStats,
        downloads: downloadStats
      })
    }
  }, [user])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // TODO: Aquí iría la llamada al API
      // await updateUserProfile(profileData)
      
      setIsEditing(false)
      // TODO: Mostrar toast de éxito
    } catch (error) {
      console.error('Error saving profile:', error)
      // TODO: Mostrar toast de error
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      // TODO: await updateNotificationSettings(notificationSettings)
      // TODO: Mostrar toast de éxito
    } catch (error) {
      console.error('Error saving notifications:', error)
      // TODO: Mostrar toast de error
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      // TODO: Mostrar error
      return
    }

    if (passwordData.newPassword.length < 8) {
      // TODO: Mostrar error
      return
    }

    setIsSaving(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      // TODO: await changePassword(passwordData)
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      // TODO: Mostrar toast de éxito
    } catch (error) {
      console.error('Error changing password:', error)
      // TODO: Mostrar toast de error
    } finally {
      setIsSaving(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-black font-black text-xl uppercase">Acceso restringido</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-yellow-400 border-b-4 border-black p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 text-black font-black text-sm uppercase">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-orange-500">Mi Perfil</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/pedidos"
            className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver
          </Link>
          
          <div>
            <h1 className="text-4xl font-black text-black uppercase flex items-center gap-3">
              <UserIcon className="w-8 h-8" />
              Mi Perfil
            </h1>
            <p className="text-gray-600 font-bold mt-2">
              Gestiona tu información personal y configuraciones
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/pedidos"
            className="bg-blue-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <ShoppingBagIcon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-xl font-black text-black mb-1">{stats.orders.totalOrders}</div>
            <div className="text-xs font-black text-black uppercase">Pedidos</div>
          </Link>
          
          <Link
            href="/favoritos"
            className="bg-red-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <HeartIcon className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <div className="text-xl font-black text-black mb-1">{stats.favorites.totalFavorites}</div>
            <div className="text-xs font-black text-black uppercase">Favoritos</div>
          </Link>
          
          <Link
            href="/reviews"
            className="bg-green-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <MessageSquareIcon className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-xl font-black text-black mb-1">{stats.reviews.totalReviews}</div>
            <div className="text-xs font-black text-black uppercase">Reviews</div>
          </Link>
          
          <Link
            href="/descargas"
            className="bg-purple-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <DownloadIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-xl font-black text-black mb-1">{stats.downloads.totalProducts}</div>
            <div className="text-xs font-black text-black uppercase">Descargas</div>
          </Link>
        </div>

        {/* Tabs */}
        <div 
          className="bg-white border-4 border-black mb-8"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <div className="flex border-b-4 border-black">
            {[
              { id: 'personal', label: 'Datos Personales', icon: UserIcon },
              { id: 'notifications', label: 'Notificaciones', icon: BellIcon },
              { id: 'security', label: 'Seguridad', icon: KeyIcon },
              { id: 'stats', label: 'Estadísticas', icon: BarChartIcon }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 p-4 font-black text-sm uppercase border-r-4 border-black last:border-r-0 transition-all ${
                    activeTab === tab.id 
                      ? 'bg-yellow-400 text-black' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-6">
            {/* Personal Data Tab */}
            {activeTab === 'personal' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-black uppercase">Información Personal</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-blue-400 border-3 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    >
                      <EditIcon className="w-4 h-4" />
                      Editar
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-gray-400 border-3 border-black px-4 py-2 font-black text-black uppercase hover:bg-gray-500 transition-all disabled:opacity-50"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      >
                        <XIcon className="w-4 h-4" />
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-green-500 border-3 border-black px-4 py-2 font-black text-white uppercase hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <SaveIcon className="w-4 h-4" />
                            Guardar
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-black font-black text-sm uppercase mb-2">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        disabled={!isEditing || isSaving}
                        className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:bg-gray-100 disabled:opacity-70"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb">
                        <PhoneIcon className="w-4 h-4" />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditing || isSaving}
                        placeholder="+56 9 1234 5678"
                        className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:bg-gray-100 disabled:opacity-70"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      />
                    </div>
                  </div>

                  {/* Address Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-black font-black text-sm uppercase mb-2">
                        País
                      </label>
                      <select
                        value={profileData.country}
                        onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                        disabled={!isEditing || isSaving}
                        className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:bg-gray-100 disabled:opacity-70"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      >
                        <option value="Chile">Chile</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Colombia">Colombia</option>
                        <option value="México">México</option>
                        <option value="Perú">Perú</option>
                        <option value="España">España</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-black font-black text-sm uppercase mb-2">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                        disabled={!isEditing || isSaving}
                        placeholder="Tu ciudad"
                        className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:bg-gray-100 disabled:opacity-70"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
                        <MapPinIcon className="w-4 h-4" />
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        disabled={!isEditing || isSaving}
                        placeholder="Calle 123, Depto 456"
                        className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:bg-gray-100 disabled:opacity-70"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      />
                    </div>

                    <div>
                      <label className="block text-black font-black text-sm uppercase mb-2">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        value={profileData.zipCode}
                        onChange={(e) => setProfileData(prev => ({ ...prev, zipCode: e.target.value }))}
                        disabled={!isEditing || isSaving}
                        placeholder="12345"
                        className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:bg-gray-100 disabled:opacity-70"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-black uppercase">Configuración de Notificaciones</h2>
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-green-500 border-3 border-black px-4 py-2 font-black text-white uppercase hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <SaveIcon className="w-4 h-4" />
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Email General */}
                  <div 
                    className="bg-blue-100 border-3 border-black p-4"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailEnabled}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                        className="w-5 h-5 border-3 border-black focus:ring-0"
                      />
                      <div>
                        <span className="text-black font-black text-lg uppercase">Notificaciones por Email</span>
                        <p className="text-blue-800 text-sm font-medium">Habilitar todas las notificaciones por correo electrónico</p>
                      </div>
                    </label>
                  </div>

                  {/* Order Notifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black cursor-pointer hover:bg-yellow-100 transition-all">
                      <input
                        type="checkbox"
                        checked={notificationSettings.orderNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, orderNotifications: e.target.checked }))}
                        disabled={!notificationSettings.emailEnabled}
                        className="w-4 h-4 border-2 border-black"
                      />
                      <div>
                        <span className="font-black text-black uppercase text-sm">Pedidos</span>
                        <p className="text-xs text-gray-600 font-medium">Confirmaciones, actualizaciones de estado</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black cursor-pointer hover:bg-yellow-100 transition-all">
                      <input
                        type="checkbox"
                        checked={notificationSettings.paymentNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, paymentNotifications: e.target.checked }))}
                        disabled={!notificationSettings.emailEnabled}
                        className="w-4 h-4 border-2 border-black"
                      />
                      <div>
                        <span className="font-black text-black uppercase text-sm">Pagos</span>
                        <p className="text-xs text-gray-600 font-medium">Confirmaciones de pago, facturas</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black cursor-pointer hover:bg-yellow-100 transition-all">
                      <input
                        type="checkbox"
                        checked={notificationSettings.reviewNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, reviewNotifications: e.target.checked }))}
                        disabled={!notificationSettings.emailEnabled}
                        className="w-4 h-4 border-2 border-black"
                      />
                      <div>
                        <span className="font-black text-black uppercase text-sm">Reviews</span>
                        <p className="text-xs text-gray-600 font-medium">Respuestas de sellers, recordatorios</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black cursor-pointer hover:bg-yellow-100 transition-all">
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyDigest}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyDigest: e.target.checked }))}
                        disabled={!notificationSettings.emailEnabled}
                        className="w-4 h-4 border-2 border-black"
                      />
                      <div>
                        <span className="font-black text-black uppercase text-sm">Resumen Semanal</span>
                        <p className="text-xs text-gray-600 font-medium">Resumen de actividad y productos nuevos</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black cursor-pointer hover:bg-yellow-100 transition-all">
                      <input
                        type="checkbox"
                        checked={notificationSettings.newProductAlerts}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, newProductAlerts: e.target.checked }))}
                        disabled={!notificationSettings.emailEnabled}
                        className="w-4 h-4 border-2 border-black"
                      />
                      <div>
                        <span className="font-black text-black uppercase text-sm">Productos Nuevos</span>
                        <p className="text-xs text-gray-600 font-medium">Alertas de productos en categorías favoritas</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-100 border-2 border-black cursor-pointer hover:bg-yellow-100 transition-all">
                      <input
                        type="checkbox"
                        checked={notificationSettings.priceDropAlerts}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, priceDropAlerts: e.target.checked }))}
                        disabled={!notificationSettings.emailEnabled}
                        className="w-4 h-4 border-2 border-black"
                      />
                      <div>
                        <span className="font-black text-black uppercase text-sm">Ofertas</span>
                        <p className="text-xs text-gray-600 font-medium">Descuentos en productos favoritos</p>
                      </div>
                    </label>
                  </div>

                  {/* Marketing */}
                  <div 
                    className="bg-orange-100 border-3 border-black p-4"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.marketingEmails}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                        disabled={!notificationSettings.emailEnabled}
                        className="w-5 h-5 border-3 border-black focus:ring-0"
                      />
                      <div>
                        <span className="text-black font-black text-lg uppercase">Emails de Marketing</span>
                        <p className="text-orange-800 text-sm font-medium">Promociones especiales, newsletters y ofertas exclusivas</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-black text-black uppercase mb-6">Configuración de Seguridad</h2>

                {/* Change Password */}
                <div 
                  className="bg-blue-100 border-4 border-black p-6 mb-6"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  <h3 className="text-xl font-black text-black uppercase mb-4">Cambiar Contraseña</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-black font-black text-sm uppercase mb-2">
                        Contraseña Actual
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                          style={{ boxShadow: '3px 3px 0 #000000' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.current ? 
                            <EyeOffIcon className="w-5 h-5 text-gray-600" /> : 
                            <EyeIcon className="w-5 h-5 text-gray-600" />
                          }
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-black font-black text-sm uppercase mb-2">
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                          style={{ boxShadow: '3px 3px 0 #000000' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.new ? 
                            <EyeOffIcon className="w-5 h-5 text-gray-600" /> : 
                            <EyeIcon className="w-5 h-5 text-gray-600" />
                          }
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-black font-black text-sm uppercase mb-2">
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                          style={{ boxShadow: '3px 3px 0 #000000' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.confirm ? 
                            <EyeOffIcon className="w-5 h-5 text-gray-600" /> : 
                            <EyeIcon className="w-5 h-5 text-gray-600" />
                          }
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handlePasswordChange}
                      disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                      className="flex items-center gap-2 bg-green-500 border-3 border-black px-6 py-3 font-black text-white uppercase hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    >
                      <KeyIcon className="w-4 h-4" />
                      {isSaving ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                  </div>
                </div>

                {/* Account Deletion */}
                <div 
                  className="bg-red-100 border-4 border-red-500 p-6"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                    <AlertTriangleIcon className="w-5 h-5 text-red-600" />
                    Zona Peligrosa
                  </h3>
                  <p className="text-red-800 font-bold mb-4">
                    Esta acción eliminará permanentemente tu cuenta y todos tus datos. Esta acción no se puede deshacer.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 bg-red-500 border-3 border-black px-6 py-3 font-black text-white uppercase hover:bg-red-600 transition-all"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <TrashIcon className="w-4 h-4" />
                    Eliminar Cuenta
                  </button>
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div>
                <h2 className="text-2xl font-black text-black uppercase mb-6">Estadísticas de Actividad</h2>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div 
                    className="bg-blue-100 border-4 border-black p-6"
                    style={{ boxShadow: '4px 4px 0 #000000' }}
                  >
                    <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                      <ShoppingBagIcon className="w-5 h-5" />
                      Actividad de Compras
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">Total Pedidos:</span>
                        <span className="font-black text-xl text-black">{stats.orders.totalOrders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">Completados:</span>
                        <span className="font-black text-lg text-green-600">{stats.orders.completedOrders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">Total Gastado:</span>
                        <span className="font-black text-lg text-blue-600">{formatPrice(stats.orders.totalSpent)}</span>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="bg-red-100 border-4 border-black p-6"
                    style={{ boxShadow: '4px 4px 0 #000000' }}
                  >
                    <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                      <HeartIcon className="w-5 h-5" />
                      Engagement
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">Favoritos:</span>
                        <span className="font-black text-xl text-black">{stats.favorites.totalFavorites}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">Reviews Escritas:</span>
                        <span className="font-black text-lg text-purple-600">{stats.reviews.totalReviews}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">Votos Útiles:</span>
                        <span className="font-black text-lg text-green-600">{stats.reviews.helpfulVotes}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Charts */}
                <div 
                  className="bg-purple-100 border-4 border-black p-6 mb-6"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                    <DownloadIcon className="w-5 h-5" />
                    Actividad de Descargas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-black text-black mb-2">{stats.downloads.totalProducts}</div>
                      <div className="text-sm font-bold text-purple-800 uppercase">Productos Comprados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-black mb-2">{stats.downloads.totalDownloads}</div>
                      <div className="text-sm font-bold text-purple-800 uppercase">Descargas Realizadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-black mb-2">{stats.downloads.downloadsThisMonth}</div>
                      <div className="text-sm font-bold text-purple-800 uppercase">Este Mes</div>
                    </div>
                  </div>
                </div>

                {/* Review Quality */}
                {stats.reviews.totalReviews > 0 && (
                  <div 
                    className="bg-green-100 border-4 border-black p-6"
                    style={{ boxShadow: '4px 4px 0 #000000' }}
                  >
                    <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                      <TrendingUpIcon className="w-5 h-5" />
                      Calidad de Reviews
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-black mb-2">{stats.reviews.averageRating.toFixed(1)}</div>
                        <div className="text-sm font-bold text-green-800 uppercase">Rating Promedio</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-black mb-2">
                          {stats.reviews.totalReviews > 0 ? Math.round((stats.reviews.helpfulVotes / stats.reviews.totalReviews) * 100) : 0}%
                        </div>
                        <div className="text-sm font-bold text-green-800 uppercase">Calificadas como Útiles</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-black mb-2">{stats.reviews.totalReviews}</div>
                        <div className="text-sm font-bold text-green-800 uppercase">Total Reviews</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white border-6 border-black max-w-md w-full"
            style={{ boxShadow: '8px 8px 0 #000000' }}
          >
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangleIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-black uppercase mb-2">
                  ¿Eliminar Cuenta?
                </h2>
                <p className="text-gray-700 font-bold">
                  Esta acción eliminará permanentemente tu cuenta, pedidos, reviews y toda tu información. 
                  Esta acción no se puede deshacer.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-400 border-3 border-black font-black text-black uppercase py-3 hover:bg-gray-500 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement account deletion
                    setShowDeleteModal(false)
                  }}
                  className="flex-1 bg-red-500 border-3 border-black font-black text-white uppercase py-3 hover:bg-red-600 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
                        