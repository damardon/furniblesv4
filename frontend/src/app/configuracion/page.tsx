'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { NotificationType } from '@/types/additional'
import { MetaTags } from '@/components/SEO/meta-tags'
import { LazyImage } from '@/components/ui/lazy-image'

// Helper para crear notificaciones completas
const createNotification = (
  type: NotificationType,
  title: string,
  message: string,
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
) => ({
  id: `notif-${Date.now()}`,
  userId: '',
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

interface NotificationSettings {
  emailEnabled: boolean
  webPushEnabled: boolean
  inAppEnabled: boolean
  orderNotifications: boolean
  paymentNotifications: boolean
  reviewNotifications: boolean
  marketingEmails: boolean
  systemNotifications: boolean
  digestFrequency: 'DISABLED' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  loginNotifications: boolean
  passwordLastChanged: string
}

interface PrivacySettings {
  profilePublic: boolean
  showEmail: boolean
  allowMessages: boolean
  dataProcessing: boolean
}

export default function ConfiguracionPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const { user, updateUser } = useAuthStore()
  const { addNotification } = useNotificationStore()

  // Estados para diferentes secciones
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  // Estados del perfil
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  })

  // Estados de notificaciones
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailEnabled: true,
    webPushEnabled: true,
    inAppEnabled: true,
    orderNotifications: true,
    paymentNotifications: true,
    reviewNotifications: true,
    marketingEmails: false,
    systemNotifications: true,
    digestFrequency: 'WEEKLY'
  })

  // Estados de seguridad
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginNotifications: true,
    passwordLastChanged: '2024-01-15'
  })

  // Estados de privacidad
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profilePublic: true,
    showEmail: false,
    allowMessages: true,
    dataProcessing: true
  })

  // Estados para cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Cargar configuraciones al montar
  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      // Simular carga de configuraciones
      // En implementación real, esto vendría del API
      console.log('Loading user settings...')
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
      // Simular actualización del perfil
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      updateUser({
        ...user!,
        ...profileData
      })

      addNotification(createNotification(
        'PROFILE_UPDATED' as NotificationType,
        t('profile_updated_title'),
        t('profile_updated_message')
      ))
    } catch (error) {

      addNotification(createNotification(
        'SYSTEM_ERROR' as NotificationType,
        t('error_title'),
        t('profile_update_error'),
        'HIGH'
      ))
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setLoading(true)
    try {
      // Simular actualización de notificaciones
      await new Promise(resolve => setTimeout(resolve, 1000))

      addNotification(createNotification(
        'SETTINGS_UPDATED' as NotificationType,
        t('notifications_updated_title'),
        t('notifications_updated_message')
      ))
    } catch (error) {
      
        addNotification(createNotification(
        'SYSTEM_ERROR' as NotificationType,
        t('error_title'),
        t('notifications_update_error'),
        'HIGH'
      ))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addNotification(createNotification(
        'PASSWORD_CHANGED' as NotificationType,
        t('password_changed_title'),
        t('password_changed_message')
      ))
      return
    }

    setLoading(true)
    try {
      // Simular cambio de contraseña
      await new Promise(resolve => setTimeout(resolve, 1000))

      addNotification(createNotification(
        'VALIDATION_ERROR' as NotificationType,
        t('error_title'),
        t('passwords_not_match'),
        'HIGH'
      ))

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      addNotification(createNotification(
        'SYSTEM_ERROR' as NotificationType,
        t('error_title'),
        t('password_change_error'),
        'HIGH'
      ))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm(t('delete_account_confirmation'))) return

    setLoading(true)
    try {
      // Simular eliminación de cuenta
      await new Promise(resolve => setTimeout(resolve, 1000))

      addNotification(createNotification(
        'ACCOUNT_DELETED' as NotificationType,
        t('account_deleted_title'),
        t('account_deleted_message')
      ))

      // Redirigir después de eliminar
      window.location.href = '/'
    } catch (error) {
      addNotification(createNotification(
        'SYSTEM_ERROR' as NotificationType,
        t('error_title'),
        t('account_delete_error'),
        'HIGH'
      ))
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: t('tabs.profile'), icon: '👤' },
    { id: 'notifications', label: t('tabs.notifications'), icon: '🔔' },
    { id: 'security', label: t('tabs.security'), icon: '🔒' },
    { id: 'privacy', label: t('tabs.privacy'), icon: '🛡️' }
  ]

  return (
    <>
      <MetaTags
        title={t('page_title')}
        description={t('page_description')}
        noIndex={true}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('page_title')}
            </h1>
            <p className="text-gray-600">
              {t('page_subtitle')}
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-sabda-primary text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    {t('profile.title')}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Avatar */}
                    <div className="md:col-span-2 flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
                        {profileData.avatar ? (
                          <LazyImage
                            src={profileData.avatar}
                            alt={`${profileData.firstName} ${profileData.lastName}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                            👤
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {profileData.firstName} {profileData.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{profileData.email}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          {t('profile.change_avatar')}
                        </Button>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('profile.first_name')}
                      </label>
                      <Input
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder={t('profile.first_name_placeholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('profile.last_name')}
                      </label>
                      <Input
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder={t('profile.last_name_placeholder')}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('profile.email')}
                      </label>
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder={t('profile.email_placeholder')}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button onClick={handleProfileUpdate} disabled={loading}>
                      {loading ? t('common.saving') : t('common.save_changes')}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    {t('notifications.title')}
                  </h2>

                  <div className="space-y-6">
                    {/* General Settings */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        {t('notifications.general')}
                      </h3>
                      <div className="space-y-3">
                        <Checkbox
                          checked={notifications.emailEnabled}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, emailEnabled: checked as boolean }))
                          }
                          label={t('notifications.email_enabled')}
                        />
                        <Checkbox
                          checked={notifications.webPushEnabled}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, webPushEnabled: checked as boolean }))
                          }
                          label={t('notifications.web_push_enabled')}
                        />
                        <Checkbox
                          checked={notifications.inAppEnabled}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, inAppEnabled: checked as boolean }))
                          }
                          label={t('notifications.in_app_enabled')}
                        />
                      </div>
                    </div>

                    {/* Specific Notifications */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        {t('notifications.specific')}
                      </h3>
                      <div className="space-y-3">
                        <Checkbox
                          checked={notifications.orderNotifications}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, orderNotifications: checked as boolean }))
                          }
                          label={t('notifications.order_notifications')}
                        />
                        <Checkbox
                          checked={notifications.paymentNotifications}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, paymentNotifications: checked as boolean }))
                          }
                          label={t('notifications.payment_notifications')}
                        />
                        <Checkbox
                          checked={notifications.reviewNotifications}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, reviewNotifications: checked as boolean }))
                          }
                          label={t('notifications.review_notifications')}
                        />
                        <Checkbox
                          checked={notifications.marketingEmails}
                          onCheckedChange={(checked) => 
                            setNotifications(prev => ({ ...prev, marketingEmails: checked as boolean }))
                          }
                          label={t('notifications.marketing_emails')}
                        />
                      </div>
                    </div>

                    {/* Digest Frequency */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        {t('notifications.digest_frequency')}
                      </h3>
                      <select
                        value={notifications.digestFrequency}
                        onChange={(e) => setNotifications(prev => ({ 
                          ...prev, 
                          digestFrequency: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sabda-primary"
                      >
                        <option value="DISABLED">{t('notifications.digest_disabled')}</option>
                        <option value="DAILY">{t('notifications.digest_daily')}</option>
                        <option value="WEEKLY">{t('notifications.digest_weekly')}</option>
                        <option value="MONTHLY">{t('notifications.digest_monthly')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button onClick={handleNotificationUpdate} disabled={loading}>
                      {loading ? t('common.saving') : t('common.save_changes')}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Change Password */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      {t('security.change_password')}
                    </h2>

                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('security.current_password')}
                        </label>
                        <Input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ 
                            ...prev, 
                            currentPassword: e.target.value 
                          }))}
                          placeholder={t('security.current_password_placeholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('security.new_password')}
                        </label>
                        <Input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ 
                            ...prev, 
                            newPassword: e.target.value 
                          }))}
                          placeholder={t('security.new_password_placeholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('security.confirm_password')}
                        </label>
                        <Input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ 
                            ...prev, 
                            confirmPassword: e.target.value 
                          }))}
                          placeholder={t('security.confirm_password_placeholder')}
                        />
                      </div>

                      <Button onClick={handlePasswordChange} disabled={loading}>
                        {loading ? t('common.saving') : t('security.change_password')}
                      </Button>
                    </div>
                  </Card>

                  {/* Security Settings */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      {t('security.settings')}
                    </h2>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {t('security.two_factor')}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {t('security.two_factor_description')}
                          </p>
                        </div>
                        <Badge variant={security.twoFactorEnabled ? 'success' : 'secondary'}>
                          {security.twoFactorEnabled ? t('common.enabled') : t('common.disabled')}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {t('security.login_notifications')}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {t('security.login_notifications_description')}
                          </p>
                        </div>
                        <Checkbox
                          checked={security.loginNotifications}
                          onCheckedChange={(checked) => 
                            setSecurity(prev => ({ ...prev, loginNotifications: checked as boolean }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {t('security.password_last_changed')}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {t('security.password_last_changed_date', { date: security.passwordLastChanged })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  {/* Privacy Settings */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      {t('privacy.settings')}
                    </h2>

                    <div className="space-y-4">
                      <Checkbox
                        checked={privacy.profilePublic}
                        onCheckedChange={(checked) => 
                          setPrivacy(prev => ({ ...prev, profilePublic: checked as boolean }))
                        }
                        label={t('privacy.profile_public')}
                        description={t('privacy.profile_public_description')}
                      />

                      <Checkbox
                        checked={privacy.showEmail}
                        onCheckedChange={(checked) => 
                          setPrivacy(prev => ({ ...prev, showEmail: checked as boolean }))
                        }
                        label={t('privacy.show_email')}
                        description={t('privacy.show_email_description')}
                      />

                      <Checkbox
                        checked={privacy.allowMessages}
                        onCheckedChange={(checked) => 
                          setPrivacy(prev => ({ ...prev, allowMessages: checked as boolean }))
                        }
                        label={t('privacy.allow_messages')}
                        description={t('privacy.allow_messages_description')}
                      />

                      <Checkbox
                        checked={privacy.dataProcessing}
                        onCheckedChange={(checked) => 
                          setPrivacy(prev => ({ ...prev, dataProcessing: checked as boolean }))
                        }
                        label={t('privacy.data_processing')}
                        description={t('privacy.data_processing_description')}
                      />
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button onClick={() => handleNotificationUpdate()} disabled={loading}>
                        {loading ? t('common.saving') : t('common.save_changes')}
                      </Button>
                    </div>
                  </Card>

                  {/* Data Export */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      {t('privacy.data_export')}
                    </h2>
                    
                    <p className="text-gray-600 mb-4">
                      {t('privacy.data_export_description')}
                    </p>

                    <Button variant="outline">
                      {t('privacy.download_data')}
                    </Button>
                  </Card>

                  {/* Delete Account */}
                  <Card className="p-6 border-red-200 bg-red-50">
                    <h2 className="text-lg font-semibold mb-4 text-red-900">
                      {t('privacy.delete_account')}
                    </h2>
                    
                    <p className="text-red-700 mb-4">
                      {t('privacy.delete_account_description')}
                    </p>

                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={loading}
                    >
                      {loading ? t('common.processing') : t('privacy.delete_account_button')}
                    </Button>
                  </Card>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </>
  )
}