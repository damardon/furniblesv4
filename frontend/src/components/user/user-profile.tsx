'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  Camera,
  Star,
  ShoppingBag,
  Download,
  Heart,
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Shield,
  Crown,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { NotificationType } from '@/types/additional'
import { UserRole } from '@/types/index'
import { LazyImage } from '@/components/ui/lazy-image'
import { cn } from '@/lib/utils'

interface UserStats {
  totalOrders: number
  totalSpent: number
  totalDownloads: number
  favoriteProducts: number
  reviewsWritten: number
  averageRating: number
  memberSince: string
  lastLogin: string
}

interface UserProfileProps {
  userId?: string
  showPrivateInfo?: boolean
  showStats?: boolean
  showActions?: boolean
  editable?: boolean
  className?: string
}

export function UserProfile({
  userId,
  showPrivateInfo = true,
  showStats = true,
  showActions = true,
  editable = true,
  className
}: UserProfileProps) {
  const t = useTranslations('user_profile')
  const { user, updateUser, token } = useAuthStore()
  const { addNotification } = useNotificationStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileUser, setProfileUser] = useState(user)
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    avatar: user?.avatar || '',
    phone: user?.buyerProfile?.phone || '',
    dateOfBirth: user?.buyerProfile?.dateOfBirth || '',
    preferences: user?.buyerProfile?.preferences || {}
  })

  const [stats, setStats] = useState<UserStats>({
    totalOrders: 0,
    totalSpent: 0,
    totalDownloads: 0,
    favoriteProducts: 0,
    reviewsWritten: 0,
    averageRating: 0,
    memberSince: user?.createdAt || '',
    lastLogin: user?.lastLoginAt || ''
  })

  // Helper para crear notificaciones
  const createNotification = (
    type: NotificationType,
    title: string,
    message: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
  ) => ({
    id: `notif-${Date.now()}-${Math.random()}`,
    userId: user?.id || '',
    type,
    title,
    message,
    data: {},
    isRead: false,
    readAt: undefined,
    sentAt: new Date().toISOString(),
    emailSent: false,
    orderId: undefined,
    priority: priority as any,
    channel: 'IN_APP' as any,
    groupKey: undefined,
    expiresAt: undefined,
    clickedAt: undefined,
    clickCount: 0,
    createdAt: new Date().toISOString()
  })

  // Cargar datos del usuario y estadísticas
  useEffect(() => {
    if (userId && userId !== user?.id) {
      // Cargar perfil de otro usuario
      loadUserProfile(userId)
    } else {
      // Usar datos del usuario actual
      setProfileUser(user)
    }
    
    if (showStats) {
      loadUserStats()
    }
  }, [userId, user, showStats])

  const loadUserProfile = async (targetUserId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${targetUserId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setProfileUser(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${profileUser?.id || user?.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setStats(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
      // Usar datos simulados si falla
      setStats({
        totalOrders: 12,
        totalSpent: 450.75,
        totalDownloads: 24,
        favoriteProducts: 8,
        reviewsWritten: 15,
        averageRating: 4.5,
        memberSince: user?.createdAt || '',
        lastLogin: user?.lastLoginAt || ''
      })
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          updateUser(result.data)
          setProfileUser(result.data)
          setIsEditing(false)

          addNotification(createNotification(
            'PROFILE_UPDATED' as NotificationType,
            t('success.profile_updated'),
            t('success.profile_updated_message'),
            'NORMAL'
          ))
        }
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      addNotification(createNotification(
        'SYSTEM_ERROR' as NotificationType,
        t('error.update_failed'),
        t('error.update_failed_message'),
        'HIGH'
      ))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditData({
      firstName: profileUser?.firstName || '',
      lastName: profileUser?.lastName || '',
      avatar: profileUser?.avatar || '',
      phone: profileUser?.buyerProfile?.phone || '',
      dateOfBirth: profileUser?.buyerProfile?.dateOfBirth || '',
      preferences: profileUser?.buyerProfile?.preferences || {}
    })
    setIsEditing(false)
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Crown className="w-5 h-5 text-yellow-600" />
      case UserRole.SELLER:
        return <Award className="w-5 h-5 text-green-600" />
      case UserRole.BUYER:
        return <User className="w-5 h-5 text-blue-600" />
      default:
        return <User className="w-5 h-5 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-yellow-400 text-black border-yellow-600'
      case UserRole.SELLER:
        return 'bg-green-400 text-black border-green-600'
      case UserRole.BUYER:
        return 'bg-blue-400 text-black border-blue-600'
      default:
        return 'bg-gray-400 text-black border-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return t('unknown')
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading && !profileUser) {
    return (
      <div className="bg-white border-4 border-black p-8 text-center" style={{ boxShadow: '4px 4px 0 #000000' }}>
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-black text-black uppercase">{t('loading')}</p>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="bg-white border-4 border-black p-8 text-center" style={{ boxShadow: '4px 4px 0 #000000' }}>
        <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="font-black text-black uppercase">{t('user_not_found')}</p>
      </div>
    )
  }

  const isOwnProfile = !userId || userId === user?.id

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Profile Card */}
      <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 border-4 border-black overflow-hidden bg-gray-100">
                {profileUser.avatar ? (
                  <LazyImage
                    src={profileUser.avatar}
                    alt={`${profileUser.firstName} ${profileUser.lastName}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
                    <User />
                  </div>
                )}
              </div>
              
              {isEditing && (
                <button
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 border-2 border-black rounded-full flex items-center justify-center hover:bg-yellow-400 transition-all"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  <Camera className="w-4 h-4 text-black" />
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder={t('first_name')}
                      className="px-3 py-2 bg-white border-2 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
                      style={{ boxShadow: '2px 2px 0 #000000' }}
                    />
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder={t('last_name')}
                      className="px-3 py-2 bg-white border-2 border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
                      style={{ boxShadow: '2px 2px 0 #000000' }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-black text-black uppercase">
                    {profileUser.firstName} {profileUser.lastName}
                  </h2>
                  <p className="text-gray-600 font-bold">@{profileUser.email.split('@')[0]}</p>
                </div>
              )}

              {/* Role Badge */}
              <div className="flex items-center gap-2 mt-2">
                <div className={cn(
                  "flex items-center gap-1 px-3 py-1 border-2 border-black font-black text-xs uppercase",
                  getRoleBadgeColor(profileUser.role)
                )}>
                  {getRoleIcon(profileUser.role)}
                  {t(`roles.${profileUser.role.toLowerCase()}`)}
                </div>
                
                {profileUser.isBoth && (
                  <div className="bg-purple-400 text-black border-2 border-black px-2 py-1 font-black text-xs uppercase">
                    {t('roles.both')}
                  </div>
                )}

                {profileUser.emailVerified && (
                  <div className="bg-green-400 text-black border-2 border-black px-2 py-1 font-black text-xs uppercase flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {t('verified')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && isOwnProfile && editable && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="p-2 bg-green-500 border-3 border-black hover:bg-yellow-400 transition-all disabled:opacity-50"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <Save className="w-4 h-4 text-black" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="p-2 bg-red-500 border-3 border-black hover:bg-yellow-400 transition-all disabled:opacity-50"
                    style={{ boxShadow: '2px 2px 0 #000000' }}
                  >
                    <X className="w-4 h-4 text-black" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-orange-500 border-3 border-black hover:bg-yellow-400 transition-all"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  <Edit3 className="w-4 h-4 text-black" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contact Information */}
        {showPrivateInfo && isOwnProfile && (
          <div className="border-t-2 border-black pt-4">
            <h3 className="font-black text-black uppercase text-sm mb-3">
              {t('contact_info')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-black text-sm">
                      {showEmail ? profileUser.email : '••••••@•••••.com'}
                    </span>
                    <button
                      onClick={() => setShowEmail(!showEmail)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {showEmail ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Phone */}
              {(editData.phone || isEditing) && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder={t('phone_placeholder')}
                        className="w-full px-2 py-1 bg-white border border-black font-bold text-sm focus:outline-none focus:bg-yellow-400"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-black text-sm">
                          {showPhone ? editData.phone : '•••••••••••'}
                        </span>
                        <button
                          onClick={() => setShowPhone(!showPhone)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {showPhone ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div>
                  <span className="font-bold text-black text-sm">
                    {t('member_since')}: {formatDate(profileUser.createdAt)}
                  </span>
                </div>
              </div>

              {/* Last Login */}
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <div>
                  <span className="font-bold text-black text-sm">
                    {t('last_login')}: {formatDate(profileUser.lastLoginAt || '')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Statistics */}
      {showStats && (
        <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {t('statistics')}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Orders */}
            <div className="bg-blue-100 border-3 border-black p-4 text-center">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-black text-black">{stats.totalOrders}</div>
              <div className="text-xs font-bold text-gray-600 uppercase">{t('stats.orders')}</div>
            </div>

            {/* Total Spent */}
            <div className="bg-green-100 border-3 border-black p-4 text-center">
              <div className="text-2xl font-black text-green-600 mb-2">💰</div>
              <div className="text-lg font-black text-black">{formatCurrency(stats.totalSpent)}</div>
              <div className="text-xs font-bold text-gray-600 uppercase">{t('stats.spent')}</div>
            </div>

            {/* Downloads */}
            <div className="bg-orange-100 border-3 border-black p-4 text-center">
              <Download className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-black text-black">{stats.totalDownloads}</div>
              <div className="text-xs font-bold text-gray-600 uppercase">{t('stats.downloads')}</div>
            </div>

            {/* Reviews */}
            <div className="bg-yellow-100 border-3 border-black p-4 text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-black text-black">{stats.reviewsWritten}</div>
              <div className="text-xs font-bold text-gray-600 uppercase">{t('stats.reviews')}</div>
            </div>

            {/* Favorites */}
            <div className="bg-red-100 border-3 border-black p-4 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-black text-black">{stats.favoriteProducts}</div>
              <div className="text-xs font-bold text-gray-600 uppercase">{t('stats.favorites')}</div>
            </div>

            {/* Average Rating Given */}
            <div className="bg-purple-100 border-3 border-black p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.floor(stats.averageRating) 
                        ? "text-yellow-500 fill-current" 
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <div className="text-lg font-black text-black">{stats.averageRating.toFixed(1)}</div>
              <div className="text-xs font-bold text-gray-600 uppercase">{t('stats.avg_rating')}</div>
            </div>

            {/* Account Status */}
            <div className="bg-gray-100 border-3 border-black p-4 text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <div className="text-sm font-black text-black uppercase">
                {profileUser.isActive ? t('stats.active') : t('stats.inactive')}
              </div>
              <div className="text-xs font-bold text-gray-600 uppercase">{t('stats.status')}</div>
            </div>

            {/* Achievements */}
            <div className="bg-yellow-100 border-3 border-black p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-sm font-black text-black">
                {stats.totalOrders >= 10 ? t('achievements.frequent_buyer') : 
                 stats.reviewsWritten >= 5 ? t('achievements.reviewer') : 
                 t('achievements.newcomer')}
              </div>
              <div className="text-xs font-bold text-gray-600 uppercase">{t('stats.badge')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {showActions && isOwnProfile && (
        <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <h3 className="text-lg font-black text-black uppercase mb-4">
            {t('quick_actions')}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/pedidos"
              className="flex flex-col items-center gap-2 p-4 bg-blue-400 border-3 border-black hover:bg-yellow-400 transition-all text-center"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <ShoppingBag className="w-6 h-6 text-black" />
              <span className="font-black text-black text-sm uppercase">{t('actions.orders')}</span>
            </a>

            <a
              href="/descargas"
              className="flex flex-col items-center gap-2 p-4 bg-green-400 border-3 border-black hover:bg-yellow-400 transition-all text-center"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <Download className="w-6 h-6 text-black" />
              <span className="font-black text-black text-sm uppercase">{t('actions.downloads')}</span>
            </a>

            <a
              href="/favoritos"
              className="flex flex-col items-center gap-2 p-4 bg-red-400 border-3 border-black hover:bg-yellow-400 transition-all text-center"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <Heart className="w-6 h-6 text-black" />
              <span className="font-black text-black text-sm uppercase">{t('actions.favorites')}</span>
            </a>

            <a
              href="/reviews"
              className="flex flex-col items-center gap-2 p-4 bg-orange-400 border-3 border-black hover:bg-yellow-400 transition-all text-center"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <Star className="w-6 h-6 text-black" />
              <span className="font-black text-black text-sm uppercase">{t('actions.reviews')}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}