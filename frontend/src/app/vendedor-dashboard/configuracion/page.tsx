'use client'

import { useState, useEffect } from 'react'
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
        newErrors.currentPassword = 'Ingresa tu contraseña actual'
      }

      if (accountData.newPassword.length < 8) {
        newErrors.newPassword = 'La nueva contraseña debe tener al menos 8 caracteres'
      }

      if (accountData.newPassword !== accountData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden'
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

      setSuccessMessage('Información de cuenta actualizada')
      
      // Limpiar campos de contraseña
      setAccountData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      
    } catch (error) {
      setErrors({ submit: 'Error al actualizar la información' })
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
      setSuccessMessage('Configuración de notificaciones actualizada')
    } catch (error) {
      setErrors({ submit: 'Error al actualizar notificaciones' })
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
      setSuccessMessage('Configuración de privacidad actualizada')
    } catch (error) {
      setErrors({ submit: 'Error al actualizar privacidad' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'account', label: 'Cuenta', icon: Settings },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'privacy', label: 'Privacidad', icon: Shield },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
  ]

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <h1 className="text-2xl font-black uppercase text-black mb-2">Configuración</h1>
        <p className="text-gray-600 font-bold">
          Gestiona tu cuenta, notificaciones y configuración de privacidad
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
                Información de Cuenta
              </h2>

              <form onSubmit={handleAccountUpdate} className="space-y-6">
                {/* Información personal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-black mb-2">NOMBRE</label>
                    <input
                      type="text"
                      value={accountData.firstName}
                      onChange={(e) => setAccountData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-black mb-2">APELLIDO</label>
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
                  <label className="block text-sm font-black text-black mb-2">EMAIL</label>
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
                    Para cambiar tu email, contacta al soporte
                  </p>
                </div>

                {/* Cambio de contraseña */}
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="text-lg font-black text-black mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Cambiar Contraseña
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-black text-black mb-2">CONTRASEÑA ACTUAL</label>
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
                      <label className="block text-sm font-black text-black mb-2">NUEVA CONTRASEÑA</label>
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
                      <label className="block text-sm font-black text-black mb-2">CONFIRMAR NUEVA CONTRASEÑA</label>
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
                      GUARDANDO...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      GUARDAR CAMBIOS
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
                Configuración de Notificaciones
              </h2>

              <div className="space-y-6">
                {/* Notificaciones por email */}
                <div>
                  <h3 className="text-lg font-black text-black mb-4">Notificaciones por Email</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailNewOrder', label: 'Nuevos pedidos', description: 'Te avisamos cuando alguien compra tus productos' },
                      { key: 'emailNewReview', label: 'Nuevas reseñas', description: 'Recibe notificaciones de nuevas reseñas' },
                      { key: 'emailPayoutCompleted', label: 'Pagos completados', description: 'Confirmación de pagos recibidos' },
                      { key: 'emailProductApproved', label: 'Productos aprobados', description: 'Cuando tus productos son aprobados' },
                      { key: 'emailProductRejected', label: 'Productos rechazados', description: 'Cuando tus productos necesitan revisión' },
                      { key: 'emailMarketingUpdates', label: 'Actualizaciones de marketing', description: 'Noticias y consejos para vendedores' },
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
                  <h3 className="text-lg font-black text-black mb-4">Configuración Adicional</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border-2 border-gray-200">
                      <div>
                        <h4 className="font-black text-black">Notificaciones web</h4>
                        <p className="text-sm text-gray-600 font-bold">Recibe notificaciones en el navegador</p>
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
                      <h4 className="font-black text-black mb-2">Frecuencia de resumen</h4>
                      <select
                        value={notificationSettings.digestFrequency}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          digestFrequency: e.target.value
                        }))}
                        className="w-full p-2 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <option value="disabled">Deshabilitado</option>
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
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
                      GUARDANDO...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      GUARDAR NOTIFICACIONES
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
                Configuración de Privacidad
              </h2>

              <div className="space-y-6">
                <div className="space-y-3">
                  {[
                    { 
                      key: 'showProfilePublicly', 
                      label: 'Mostrar perfil públicamente', 
                      description: 'Tu perfil de vendedor será visible para todos los usuarios' 
                    },
                    { 
                      key: 'showContactInfo', 
                      label: 'Mostrar información de contacto', 
                      description: 'Los compradores podrán ver tu teléfono y website' 
                    },
                    { 
                      key: 'allowDirectMessages', 
                      label: 'Permitir mensajes directos', 
                      description: 'Los usuarios pueden enviarte mensajes privados' 
                    },
                    { 
                      key: 'showSalesHistory', 
                      label: 'Mostrar historial de ventas', 
                      description: 'Mostrar cantidad de productos vendidos públicamente' 
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
                    Información sobre Privacidad
                  </h4>
                  <ul className="text-sm text-blue-700 font-bold space-y-1">
                    <li>• Tu información personal nunca se comparte con terceros</li>
                    <li>• Los compradores solo ven la información que permitas</li>
                    <li>• Puedes cambiar estas configuraciones en cualquier momento</li>
                    <li>• Cierta información es requerida para el funcionamiento del marketplace</li>
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
                      GUARDANDO...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      GUARDAR PRIVACIDAD
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
                Configuración de Pagos
              </h2>

              <div className="space-y-6">
                {/* Estado de Stripe Connect */}
                <div className="border-2 border-gray-200 p-6">
                  <h3 className="text-lg font-black text-black mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Stripe Connect
                  </h3>

                  {user?.stripeConnectId ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-100 border-2 border-green-500">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-black text-green-800">Cuenta conectada</p>
                          <p className="text-sm text-green-700 font-bold">
                            ID: {user.stripeConnectId}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border-2 border-gray-200">
                          <h4 className="font-bold text-black">Onboarding</h4>
                          <p className={`text-sm font-bold ${user.onboardingComplete ? 'text-green-600' : 'text-yellow-600'}`}>
                            {user.onboardingComplete ? 'Completado' : 'Pendiente'}
                          </p>
                        </div>
                        
                        <div className="p-3 border-2 border-gray-200">
                          <h4 className="font-bold text-black">Pagos Habilitados</h4>
                          <p className={`text-sm font-bold ${user.payoutsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                            {user.payoutsEnabled ? 'Sí' : 'No'}
                          </p>
                        </div>
                      </div>

                      {!user.onboardingComplete && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all">
                          <ExternalLink className="h-4 w-4" />
                          COMPLETAR CONFIGURACIÓN
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-yellow-100 border-2 border-yellow-500">
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                        <div>
                          <p className="font-black text-yellow-800">Cuenta no conectada</p>
                          <p className="text-sm text-yellow-700 font-bold">
                            Necesitas conectar Stripe para recibir pagos
                          </p>
                        </div>
                      </div>

                      <button className="flex items-center gap-2 px-6 py-3 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all">
                        <CreditCard className="h-5 w-5" />
                        CONECTAR STRIPE
                      </button>
                    </div>
                  )}
                </div>

                {/* Información sobre comisiones */}
                <div className="border-2 border-gray-200 p-6">
                  <h3 className="text-lg font-black text-black mb-4">Estructura de Comisiones</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 border border-gray-300">
                      <span className="font-bold text-black">Comisión de plataforma</span>
                      <span className="font-black text-orange-600">10%</span>
                    </div>
                    
                    <div className="flex justify-between p-3 bg-gray-50 border border-gray-300">
                      <span className="font-bold text-black">Comisión de Stripe</span>
                      <span className="font-black text-blue-600">2.9% + $0.30</span>
                    </div>
                    
                    <div className="flex justify-between p-3 bg-green-50 border-2 border-green-300">
                      <span className="font-bold text-black">Tu ganancia</span>
                      <span className="font-black text-green-600">~87%</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 font-bold mt-3">
                    Las comisiones se descuentan automáticamente. Recibes el pago neto directamente en tu cuenta.
                  </p>
                </div>

                {/* Historial de pagos */}
                <div className="border-2 border-gray-200 p-6">
                  <h3 className="text-lg font-black text-black mb-4">Historial de Pagos</h3>
                  
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-bold">No hay pagos aún</p>
                    <p className="text-sm text-gray-400 font-bold">
                      Una vez que vendas productos, aparecerán aquí
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