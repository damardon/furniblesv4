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
  const tCommon = useTranslations('common')
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
          <p className="text-black font-black text-xl uppercase">{t('access_restricted')}</p>
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
              {tCommon('navigation.home')}
            </Link>
            <span>/</span>
            <span className="text-orange-500">{t('title')}</span>
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
            {tCommon('actions.back')}
          </Link>
          
          <div>
            <h1 className="text-4xl font-black text-black uppercase flex items-center gap-3">
              <UserIcon className="w-8 h-8" />
              {t('title')}
            </h1>
            <p className="text-gray-600 font-bold mt-2">
              {t('subtitle')}
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
            <div className="text-xs font-black text-black uppercase">{t('quick_stats.orders')}</div>
          </Link>
          
          <Link
            href="/favoritos"
            className="bg-red-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <HeartIcon className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <div className="text-xl font-black text-black mb-1">{stats.favorites.totalFavorites}</div>
            <div className="text-xs font-black text-black uppercase">{t('quick_stats.favorites')}</div>
          </Link>
          
          <Link
            href="/reviews"
            className="bg-green-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <MessageSquareIcon className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-xl font-black text-black mb-1">{stats.reviews.totalReviews}</div>
            <div className="text-xs font-black text-black uppercase">{t('quick_stats.reviews')}</div>
          </Link>
          
          <Link
            href="/descargas"
            className="bg-purple-100 border-4 border-black p-4 text-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <DownloadIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-xl font-black text-black mb-1">{stats.downloads.totalProducts}</div>
            <div className="text-xs font-black text-black uppercase">{t('quick_stats.downloads')}</div>
          </Link>
        </div>

        {/* Tabs */}
        <div 
          className="bg-white border-4 border-black mb-8"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <div className="flex border-b-4 border-black">
            {[
              { id: 'personal', label: t('tabs.personal'), icon: UserIcon },
              { id: 'notifications', label: t('tabs.notifications'), icon: BellIcon },
              { id: 'security', label: t('tabs.security'), icon: KeyIcon },
              { id: 'stats', label: t('tabs.stats'), icon: BarChartIcon }
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
                  <h2 className="text-2xl font-black text-black uppercase">{t('personal.title')}</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-blue-400 border-3 border-black px-4 py-2 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    >
                      <EditIcon className="w-4 h-4" />
                      {t('personal.edit')}
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
                        {t('personal.cancel')}
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
                            {t('personal.saving')}
                          </>
                        ) : (
                          <>
                            <SaveIcon className="w-4 h-4" />
                            {t('personal.save')}
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
                        {t('personal.first_name')} *
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
                      <label className="block text-black font-black text-sm uppercase mb-2">
                        {t('personal.last_name')} *
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        disabled={!isEditing || isSaving}
                        className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:bg-gray-100 disabled:opacity-70"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
                        <PhoneIcon className="w-4 h-4" />
                        {t('personal.phone')}
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
                        {t('personal.country')}
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
                        {t('personal.city')}
                      </label>
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                        disabled={!isEditing || isSaving}
                        placeholder={t('personal.city_placeholder')}
                        className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:bg-gray-100 disabled:opacity-70"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
                        <MapPinIcon className="w-4 h-4" />
                        {t('personal.address')}
                      </label>
                      <input
                        type="text"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        disabled={!isEditing || isSaving}
                        placeholder={t('personal.address_placeholder')}
                        className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:bg-gray-100 disabled:opacity-70"
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      />
                    </div>

                    <div>
                      <label className="block text-black font-black text-sm uppercase mb-2">
                        {t('personal.zip_code')}
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
                  <h2 className="text-2xl font-black text-black uppercase">{t('notifications.title')}</h2>
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-green-500 border-3 border-black px-4 py-2 font-black text-white uppercase hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <SaveIcon className="w-4 h-4" />
                    {isSaving ? t('notifications.saving') : t('notifications.save_changes')}
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
                        <span className="text-black font-black text-lg uppercase">{t('notifications.email_enabled')}</span>
                        <p className="text-blue-800 text-sm font-medium">{t('notifications.email_enabled_desc')}</p>
                      </div>
                    </label>
                  </div>

                  {/* Notification Options */}
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
                        <span className="font-black text-black uppercase text-sm">{t('notifications.orders')}</span>
                        <p className="text-xs text-gray-600 font-medium">{t('notifications.orders_desc')}</p>
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
                        <span className="font-black text-black uppercase text-sm">{t('notifications.payments')}</span>
                        <p className="text-xs text-gray-600 font-medium">{t('notifications.payments_desc')}</p>
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
                        <span className="font-black text-black uppercase text-sm">{t('notifications.reviews')}</span>
                        <p className="text-xs text-gray-600 font-medium">{t('notifications.reviews_desc')}</p>
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
                        <span className="font-black text-black uppercase text-sm">{t('notifications.weekly_digest')}</span>
                        <p className="text-xs text-gray-600 font-medium">{t('notifications.weekly_digest_desc')}</p>
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
                        <span className="font-black text-black uppercase text-sm">{t('notifications.new_products')}</span>
                        <p className="text-xs text-gray-600 font-medium">{t('notifications.new_products_desc')}</p>
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
                        <span className="font-black text-black uppercase text-sm">{t('notifications.offers')}</span>
                        <p className="text-xs text-gray-600 font-medium">{t('notifications.offers_desc')}</p>
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
                        <span className="text-black font-black text-lg uppercase">{t('notifications.marketing_emails')}</span>
                        <p className="text-orange-800 text-sm font-medium">{t('notifications.marketing_emails_desc')}</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-black text-black uppercase mb-6">{t('security.title')}</h2>

                {/* Change Password */}
                <div 
                  className="bg-blue-100 border-4 border-black p-6 mb-6"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  <h3 className="text-xl font-black text-black uppercase mb-4">{t('security.change_password')}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-black font-black text-sm uppercase mb-2">
                        {t('security.current_password')}
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
                        {t('security.new_password')}
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
                        {t('security.confirm_password')}
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
                      {isSaving ? t('security.changing') : t('security.change_password')}
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
                    {t('security.danger_zone')}
                  </h3>
                  <p className="text-red-800 font-bold mb-4">
                    {t('security.delete_warning')}
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 bg-red-500 border-3 border-black px-6 py-3 font-black text-white uppercase hover:bg-red-600 transition-all"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <TrashIcon className="w-4 h-4" />
                    {t('security.delete_account')}
                  </button>
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div>
                <h2 className="text-2xl font-black text-black uppercase mb-6">{t('stats.title')}</h2>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div 
                    className="bg-blue-100 border-4 border-black p-6"
                    style={{ boxShadow: '4px 4px 0 #000000' }}
                  >
                    <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                      <ShoppingBagIcon className="w-5 h-5" />
                      {t('stats.shopping_activity')}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">{t('stats.total_orders')}:</span>
                        <span className="font-black text-xl text-black">{stats.orders.totalOrders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">{t('stats.completed')}:</span>
                        <span className="font-black text-lg text-green-600">{stats.orders.completedOrders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">{t('stats.total_spent')}:</span>
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
                      {t('stats.engagement')}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">{t('stats.favorites')}:</span>
                        <span className="font-black text-xl text-black">{stats.favorites.totalFavorites}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">{t('stats.reviews_written')}:</span>
                        <span className="font-black text-lg text-purple-600">{stats.reviews.totalReviews}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-black">{t('stats.helpful_votes')}:</span>
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
                    {t('stats.download_activity')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-black text-black mb-2">{stats.downloads.totalProducts}</div>
                      <div className="text-sm font-bold text-purple-800 uppercase">{t('stats.products_purchased')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-black mb-2">{stats.downloads.totalDownloads}</div>
                      <div className="text-sm font-bold text-purple-800 uppercase">{t('stats.downloads_made')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-black mb-2">{stats.downloads.downloadsThisMonth}</div>
                      <div className="text-sm font-bold text-purple-800 uppercase">{t('stats.this_month')}</div>
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
                      {t('stats.review_quality')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-black mb-2">{stats.reviews.averageRating.toFixed(1)}</div>
                        <div className="text-sm font-bold text-green-800 uppercase">{t('stats.average_rating')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-black mb-2">
                          {stats.reviews.totalReviews > 0 ? Math.round((stats.reviews.helpfulVotes / stats.reviews.totalReviews) * 100) : 0}%
                        </div>
                        <div className="text-sm font-bold text-green-800 uppercase">{t('stats.rated_helpful')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-black mb-2">{stats.reviews.totalReviews}</div>
                        <div className="text-sm font-bold text-green-800 uppercase">{t('stats.total_reviews')}</div>
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
                  {t('delete_modal.title')}
                </h2>
                <p className="text-gray-700 font-bold">
                  {t('delete_modal.warning')}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-400 border-3 border-black font-black text-black uppercase py-3 hover:bg-gray-500 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  {t('delete_modal.cancel')}
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement account deletion
                    setShowDeleteModal(false)
                  }}
                  className="flex-1 bg-red-500 border-3 border-black font-black text-white uppercase py-3 hover:bg-red-600 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  {t('delete_modal.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}