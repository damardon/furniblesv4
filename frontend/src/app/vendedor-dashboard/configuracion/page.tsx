'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Settings,
  CreditCard,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Key,
  Mail,
  Lock,
} from 'lucide-react'

import { useAuthStore } from '@/lib/stores/auth-store'
import { useSellerStore } from '@/lib/stores/seller-store'

export default function SellerConfigPage() {
  const { user, updateUser } = useAuthStore()
  const { sellerProfile } = useSellerStore()
  
  // Traducciones
  const t = useTranslations('seller.settings')
  const tCommon = useTranslations('common')
  
  // Estados de configuración
  const [accountData, setAccountData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNewOrder: true,
    emailNewReview: true,
    emailPayoutCompleted: true,
    emailProductApproved: true,
    emailProductRejected: true,
    emailMarketingUpdates: false,
    webPushEnabled: true,
    digestFrequency: 'weekly',
  })

  const [privacySettings, setPrivacySettings] = useState({
    showProfilePublicly: true,
    showContactInfo: true,
    allowDirectMessages: true,
    showSalesHistory: false,
  })

  // Estados de UI
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy' | 'payments'>('account')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      setAccountData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      }))
    }
  }, [user])

  // Validación de contraseña
  const validatePasswordChange = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (accountData.newPassword) {
      if (!accountData.currentPassword) {
        newErrors.currentPassword = t('validation.current_password_required')
      }

      if (accountData.newPassword.length < 8) {
        newErrors.newPassword = t('validation.new_password_min_length')
      }

      if (accountData.newPassword !== accountData.confirmPassword) {
        newErrors.confirmPassword = t('validation.passwords_dont_match')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Actualizar información de cuenta
  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (accountData.newPassword && !validatePasswordChange()) {
      return
    }

    setIsSubmitting(true)
    setSuccessMessage('')

    try {
      // Aquí iría la llamada al API para actualizar datos
      const updateData: any = {
        firstName: accountData.firstName,
        lastName: accountData.lastName,
      }

      if (accountData.newPassword) {
        updateData.currentPassword = accountData.currentPassword
        updateData.newPassword = accountData.newPassword
      }

      // Simular llamada al API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Actualizar user en el store
      updateUser({
        firstName: accountData.firstName,
        lastName: accountData.lastName,
      })

      setSuccessMessage(t('messages.account_updated'))
      
      // Limpiar campos de contraseña
      setAccountData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      
    } catch (error) {
      setErrors({ submit: t('messages.account_update_error') })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Actualizar notificaciones
  const handleNotificationUpdate = async () => {
    setIsSubmitting(true)
    setSuccessMessage('')

    try {
      // Aquí iría la llamada al API para actualizar preferencias
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccessMessage(t('messages.notifications_updated'))
    } catch (error) {
      setErrors({ submit: t('messages.notifications_update_error') })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Actualizar privacidad
  const handlePrivacyUpdate = async () => {
    setIsSubmitting(true)
    setSuccessMessage('')

    try {
      // Aquí iría la llamada al API para actualizar privacidad
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccessMessage(t('messages.privacy_updated'))
    } catch (error) {
      setErrors({ submit: t('messages.privacy_update_error') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'account', label: t('tabs.account'), icon: Settings },
    { id: 'notifications', label: t('tabs.notifications'), icon: Bell },
    { id: 'privacy', label: t('tabs.privacy'), icon: Shield },
    { id: 'payments', label: t('tabs.payments'), icon: CreditCard },
  ]

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <h1 className="text-2xl font-black uppercase text-black mb-2">{t('title')}</h1>
        <p className="text-gray-600 font-bold">
          {t('subtitle')}
        </p>
      </div>

      {/* MENSAJES */}
      {successMessage && (
        <div className="bg-green-100 border-[3px] border-green-500 p-4" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="font-bold text-green-800">{successMessage}</span>
          </div>
        </div>
      )}

      {errors.submit && (
        <div className="bg-red-100 border-[3px] border-red-500 p-4" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <span className="font-bold text-red-800">{errors.submit}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* NAVEGACIÓN DE TABS */}
        <div className="lg:col-span-1">
          <div className="bg-white border-[3px] border-black p-4" style={{ boxShadow: '6px 6px 0 #000000' }}>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-3 font-bold text-sm border-2 transition-all duration-200 ${
                      isActive 
                        ? 'bg-orange-500 text-black border-black' 
                        : 'bg-white text-black border-transparent hover:bg-yellow-400 hover:border-black'
                    }`}
                    style={{ 
                      boxShadow: isActive ? '3px 3px 0 #000000' : 'none',
                      transform: isActive ? 'translate(-1px, -1px)' : 'none'
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-black uppercase">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* CONTENIDO DE LOS TABS */}
        <div className="lg:col-span-3">
          {/* TAB: CUENTA */}
          {activeTab === 'account' && (
            <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
              <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-2">
                <Settings className="h-6 w-6" />
                {t('account.title')}
              </h2>

              <form onSubmit={handleAccountUpdate} className="space-y-6">
                {/* Información personal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-black mb-2">{t('account.first_name')}</label>
                    <input
                      type="text"
                      value={accountData.firstName}
                      onChange={(e) => setAccountData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-black mb-2">{t('account.last_name')}</label>
                    <input
                      type="text"
                      value={accountData.lastName}
                      onChange={(e) => setAccountData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    />
                  </div>
                </div>

                {/* Email (solo lectura) */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">{t('account.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="email"
                      value={accountData.email}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-400 font-bold bg-gray-100 text-gray-600"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 font-bold mt-1">
                    {t('account.email_change_note')}
                  </p>
                </div>

                {/* Cambio de contraseña */}
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="text-lg font-black text-black mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    {t('account.change_password')}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-black text-black mb-2">{t('account.current_password')}</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={accountData.currentPassword}
                          onChange={(e) => setAccountData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className={`w-full pr-10 p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 ${
                            errors.currentPassword ? 'border-red-500 bg-red-50' : ''
                          }`}
                          style={{ boxShadow: '3px 3px 0 #000000' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.currentPassword && <span className="text-sm text-red-600 font-bold">{errors.currentPassword}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-black text-black mb-2">{t('account.new_password')}</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={accountData.newPassword}
                          onChange={(e) => setAccountData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className={`w-full pr-10 p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 ${
                            errors.newPassword ? 'border-red-500 bg-red-50' : ''
                          }`}
                          style={{ boxShadow: '3px 3px 0 #000000' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.newPassword && <span className="text-sm text-red-600 font-bold">{errors.newPassword}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-black text-black mb-2">{t('account.confirm_new_password')}</label>
                      <input
                        type="password"
                        value={accountData.confirmPassword}
                        onChange={(e) => setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 ${
                          errors.confirmPassword ? 'border-red-500 bg-red-50' : ''
                        }`}
                        style={{ boxShadow: '3px 3px 0 #000000' }}
                      />
                      {errors.confirmPassword && <span className="text-sm text-red-600 font-bold">{errors.confirmPassword}</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      {tCommon('saving')}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {t('account.save_changes')}
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB: NOTIFICACIONES */}
          {activeTab === 'notifications' && (
            <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
              <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-2">
                <Bell className="h-6 w-6" />
                {t('notifications.title')}
              </h2>

              <div className="space-y-6">
                {/* Notificaciones por email */}
                <div>
                  <h3 className="text-lg font-black text-black mb-4">{t('notifications.email_notifications')}</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailNewOrder', label: t('notifications.new_orders'), description: t('notifications.new_orders_desc') },
                      { key: 'emailNewReview', label: t('notifications.new_reviews'), description: t('notifications.new_reviews_desc') },
                      { key: 'emailPayoutCompleted', label: t('notifications.payments_completed'), description: t('notifications.payments_completed_desc') },
                      { key: 'emailProductApproved', label: t('notifications.products_approved'), description: t('notifications.products_approved_desc') },
                      { key: 'emailProductRejected', label: t('notifications.products_rejected'), description: t('notifications.products_rejected_desc') },
                      { key: 'emailMarketingUpdates', label: t('notifications.marketing_updates'), description: t('notifications.marketing_updates_desc') },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 border-2 border-gray-200">
                        <div>
                          <h4 className="font-black text-black">{item.label}</h4>
                          <p className="text-sm text-gray-600 font-bold">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                            onChange={(e) => setNotificationSettings(prev => ({
                              ...prev,
                              [item.key]: e.target.checked
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 border-2 border-black"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configuración adicional */}
                <div>
                  <h3 className="text-lg font-black text-black mb-4">{t('notifications.additional_settings')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border-2 border-gray-200">
                      <div>
                        <h4 className="font-black text-black">{t('notifications.web_notifications')}</h4>
                        <p className="text-sm text-gray-600 font-bold">{t('notifications.web_notifications_desc')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.webPushEnabled}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            webPushEnabled: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 border-2 border-black"></div>
                      </label>
                    </div>

                    <div className="p-3 border-2 border-gray-200">
                      <h4 className="font-black text-black mb-2">{t('notifications.digest_frequency')}</h4>
                      <select
                        value={notificationSettings.digestFrequency}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          digestFrequency: e.target.value
                        }))}
                        className="w-full p-2 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <option value="disabled">{t('notifications.frequency.disabled')}</option>
                        <option value="daily">{t('notifications.frequency.daily')}</option>
                        <option value="weekly">{t('notifications.frequency.weekly')}</option>
                        <option value="monthly">{t('notifications.frequency.monthly')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNotificationUpdate}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      {tCommon('saving')}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {t('notifications.save_notifications')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB: PRIVACIDAD */}
          {activeTab === 'privacy' && (
            <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
              <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-2">
                <Shield className="h-6 w-6" />
                {t('privacy.title')}
              </h2>

              <div className="space-y-6">
                <div className="space-y-3">
                  {[
                    { 
                      key: 'showProfilePublicly', 
                      label: t('privacy.show_profile_publicly'), 
                      description: t('privacy.show_profile_publicly_desc')
                    },
                    { 
                      key: 'showContactInfo', 
                      label: t('privacy.show_contact_info'), 
                      description: t('privacy.show_contact_info_desc')
                    },
                    { 
                      key: 'allowDirectMessages', 
                      label: t('privacy.allow_direct_messages'), 
                      description: t('privacy.allow_direct_messages_desc')
                    },
                    { 
                      key: 'showSalesHistory', 
                      label: t('privacy.show_sales_history'), 
                      description: t('privacy.show_sales_history_desc')
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border-2 border-gray-200">
                      <div>
                        <h4 className="font-black text-black">{item.label}</h4>
                        <p className="text-sm text-gray-600 font-bold">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings[item.key as keyof typeof privacySettings]}
                          onChange={(e) => setPrivacySettings(prev => ({
                            ...prev,
                            [item.key]: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 border-2 border-black"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-100 border-[3px] border-blue-500 p-4">
                  <h4 className="font-black text-blue-800 mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t('privacy.info_title')}
                  </h4>
                  <ul className="text-sm text-blue-700 font-bold space-y-1">
                    <li>• {t('privacy.info.personal_data')}</li>
                    <li>• {t('privacy.info.buyer_visibility')}</li>
                    <li>• {t('privacy.info.change_anytime')}</li>
                    <li>• {t('privacy.info.required_info')}</li>
                  </ul>
                </div>

                <button
                  onClick={handlePrivacyUpdate}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-500 border-2 border-black font-bold text-black hover:bg-purple-400 transition-all disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      {tCommon('saving')}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {t('privacy.save_privacy')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB: PAGOS */}
          {activeTab === 'payments' && (
            <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
              <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                {t('payments.title')}
              </h2>

              <div className="space-y-6">
                {/* Estado de Stripe Connect */}
                <div className="border-2 border-gray-200 p-6">
                  <h3 className="text-lg font-black text-black mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {t('payments.stripe_connect')}
                  </h3>

                  {user?.stripeConnectId ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-100 border-2 border-green-500">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-black text-green-800">{t('payments.account_connected')}</p>
                          <p className="text-sm text-green-700 font-bold">
                            ID: {user.stripeConnectId}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border-2 border-gray-200">
                          <h4 className="font-bold text-black">{t('payments.payments_enabled')}</h4>
                          <p className={`text-sm font-bold ${user.payoutsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                            {user.payoutsEnabled ? tCommon('yes') : tCommon('no')}
                          </p>
                        </div>
                      </div>

                      {!user.onboardingComplete && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all">
                          <ExternalLink className="h-4 w-4" />
                          {t('payments.complete_setup')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-yellow-100 border-2 border-yellow-500">
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                        <div>
                          <p className="font-black text-yellow-800">{t('payments.account_not_connected')}</p>
                          <p className="text-sm text-yellow-700 font-bold">
                            {t('payments.need_stripe_to_receive_payments')}
                          </p>
                        </div>
                      </div>

                      <button className="flex items-center gap-2 px-6 py-3 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all">
                        <CreditCard className="h-5 w-5" />
                        {t('payments.connect_stripe')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Información sobre comisiones */}
                <div className="border-2 border-gray-200 p-6">
                  <h3 className="text-lg font-black text-black mb-4">{t('payments.fee_structure')}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 border border-gray-300">
                      <span className="font-bold text-black">{t('payments.platform_fee')}</span>
                      <span className="font-black text-orange-600">10%</span>
                    </div>
                    
                    <div className="flex justify-between p-3 bg-gray-50 border border-gray-300">
                      <span className="font-bold text-black">{t('payments.stripe_fee')}</span>
                      <span className="font-black text-blue-600">2.9% + $0.30</span>
                    </div>
                    
                    <div className="flex justify-between p-3 bg-green-50 border-2 border-green-300">
                      <span className="font-bold text-black">{t('payments.your_earnings')}</span>
                      <span className="font-black text-green-600">~87%</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 font-bold mt-3">
                    {t('payments.fee_description')}
                  </p>
                </div>

                {/* Historial de pagos */}
                <div className="border-2 border-gray-200 p-6">
                  <h3 className="text-lg font-black text-black mb-4">{t('payments.payment_history')}</h3>
                  
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-bold">{t('payments.no_payments_yet')}</p>
                    <p className="text-sm text-gray-400 font-bold">
                      {t('payments.no_payments_description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}