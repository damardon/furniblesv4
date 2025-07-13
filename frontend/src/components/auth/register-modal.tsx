'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { 
  X, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  Store,
  ShoppingBag
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { UserRole } from '@/types'

interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: UserRole
  acceptTerms: boolean
  acceptMarketing: boolean
}

export function RegisterModal() {
  const t = useTranslations('auth')
  
  // Stores
  const { 
    registerModalOpen, 
    setRegisterModalOpen, 
    setLoginModalOpen, 
    register,
    isLoading 
  } = useAuthStore()

  // States
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: UserRole.BUYER,
    acceptTerms: false,
    acceptMarketing: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Clear general error
    if (error) setError(null)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'Nombre es requerido'
    } else if (formData.firstName.length < 2) {
      errors.firstName = 'Nombre debe tener al menos 2 caracteres'
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Apellido es requerido'
    } else if (formData.lastName.length < 2) {
      errors.lastName = 'Apellido debe tener al menos 2 caracteres'
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email no válido'
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^\+?[\d\s-()]{8,}$/.test(formData.phone)) {
      errors.phone = 'Teléfono no válido'
    }

    // Password validation
    if (!formData.password.trim()) {
      errors.password = 'Contraseña es requerida'
    } else if (formData.password.length < 8) {
      errors.password = 'Contraseña debe tener al menos 8 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Contraseña debe tener mayúsculas, minúsculas y números'
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Confirmar contraseña es requerido'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden'
    }

    // Terms validation
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Debes aceptar los términos y condiciones'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setError(null)
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      })
      
      // Success - modal will close automatically via store
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: UserRole.BUYER,
        acceptTerms: false,
        acceptMarketing: false
      })
      setValidationErrors({})
      
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta')
    }
  }

  const handleClose = () => {
    setRegisterModalOpen(false)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: UserRole.BUYER,
      acceptTerms: false,
      acceptMarketing: false
    })
    setValidationErrors({})
    setError(null)
  }

  const switchToLogin = () => {
    handleClose()
    setLoginModalOpen(true)
  }

  if (!registerModalOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white border-[5px] border-black p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '12px 12px 0 #000000' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 border-3 border-black flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-2xl font-black text-black uppercase">
              Crear Cuenta
            </h2>
          </div>
          
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 bg-white border-3 border-black hover:bg-red-400 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div 
            className="bg-red-100 border-3 border-red-500 p-4 mb-6 flex items-center gap-3"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-bold text-sm">{error}</p>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selection */}
          <div>
            <label className="block text-black font-black text-sm uppercase mb-3">
              Tipo de Cuenta *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('role', UserRole.BUYER)}
                className={`p-4 border-3 font-black text-sm uppercase transition-all ${
                  formData.role === UserRole.BUYER
                    ? 'bg-blue-400 text-black border-black'
                    : 'bg-white text-black border-black hover:bg-blue-100'
                }`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <ShoppingBag className="w-6 h-6 mx-auto mb-2" />
                Comprador
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('role', UserRole.SELLER)}
                className={`p-4 border-3 font-black text-sm uppercase transition-all ${
                  formData.role === UserRole.SELLER
                    ? 'bg-orange-400 text-black border-black'
                    : 'bg-white text-black border-black hover:bg-orange-100'
                }`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <Store className="w-6 h-6 mx-auto mb-2" />
                Vendedor
              </button>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
                <User className="w-4 h-4" />
                Nombre *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-3 bg-white border-3 font-bold focus:outline-none transition-all disabled:opacity-50 ${
                  validationErrors.firstName 
                    ? 'border-red-500 focus:bg-red-100' 
                    : 'border-black focus:bg-yellow-400'
                }`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
                placeholder="Tu nombre"
                autoComplete="given-name"
              />
              {validationErrors.firstName && (
                <p className="text-red-600 text-xs font-bold mt-1">{validationErrors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-black font-black text-sm uppercase mb-2">
                Apellido *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-3 bg-white border-3 font-bold focus:outline-none transition-all disabled:opacity-50 ${
                  validationErrors.lastName 
                    ? 'border-red-500 focus:bg-red-100' 
                    : 'border-black focus:bg-yellow-400'
                }`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
                placeholder="Tu apellido"
                autoComplete="family-name"
              />
              {validationErrors.lastName && (
                <p className="text-red-600 text-xs font-bold mt-1">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
              <Mail className="w-4 h-4" />
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-3 bg-white border-3 font-bold focus:outline-none transition-all disabled:opacity-50 ${
                validationErrors.email 
                  ? 'border-red-500 focus:bg-red-100' 
                  : 'border-black focus:bg-yellow-400'
              }`}
              style={{ boxShadow: '3px 3px 0 #000000' }}
              placeholder="tu@email.com"
              autoComplete="email"
            />
            {validationErrors.email && (
              <p className="text-red-600 text-xs font-bold mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
              <Phone className="w-4 h-4" />
              Teléfono (Opcional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-3 bg-white border-3 font-bold focus:outline-none transition-all disabled:opacity-50 ${
                validationErrors.phone 
                  ? 'border-red-500 focus:bg-red-100' 
                  : 'border-black focus:bg-yellow-400'
              }`}
              style={{ boxShadow: '3px 3px 0 #000000' }}
              placeholder="+56 9 1234 5678"
              autoComplete="tel"
            />
            {validationErrors.phone && (
              <p className="text-red-600 text-xs font-bold mt-1">{validationErrors.phone}</p>
            )}
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-black font-black text-sm uppercase mb-2">
                <Lock className="w-4 h-4" />
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 pr-12 bg-white border-3 font-bold focus:outline-none transition-all disabled:opacity-50 ${
                    validationErrors.password 
                      ? 'border-red-500 focus:bg-red-100' 
                      : 'border-black focus:bg-yellow-400'
                  }`}
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  placeholder="Tu contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-all disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-red-600 text-xs font-bold mt-1">{validationErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-black font-black text-sm uppercase mb-2">
                Confirmar *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 pr-12 bg-white border-3 font-bold focus:outline-none transition-all disabled:opacity-50 ${
                    validationErrors.confirmPassword 
                      ? 'border-red-500 focus:bg-red-100' 
                      : 'border-black focus:bg-yellow-400'
                  }`}
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  placeholder="Repetir contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-all disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-red-600 text-xs font-bold mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                disabled={isLoading}
                className={`w-5 h-5 border-3 border-black focus:ring-0 focus:ring-offset-0 mt-1 ${
                  validationErrors.acceptTerms ? 'border-red-500' : ''
                }`}
              />
              <span className="text-black font-bold text-sm">
                Acepto los{' '}
                <a href="/terminos" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                  términos y condiciones
                </a>
                {' '}y la{' '}
                <a href="/privacidad" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                  política de privacidad
                </a>
                {' '}*
              </span>
            </label>
            {validationErrors.acceptTerms && (
              <p className="text-red-600 text-xs font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.acceptTerms}
              </p>
            )}
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.acceptMarketing}
                onChange={(e) => handleInputChange('acceptMarketing', e.target.checked)}
                disabled={isLoading}
                className="w-5 h-5 border-3 border-black focus:ring-0 focus:ring-offset-0 mt-1"
              />
              <span className="text-black font-bold text-sm">
                Deseo recibir ofertas especiales y novedades por email
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 border-4 border-black font-black text-black text-lg uppercase py-3 hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                Creando Cuenta...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Crear Cuenta
              </>
            )}
          </button>
        </form>

        {/* Password Requirements */}
        <div 
          className="bg-gray-100 border-3 border-black p-4 mt-6"
          style={{ boxShadow: '3px 3px 0 #000000' }}
        >
          <h3 className="text-black font-black text-sm uppercase mb-2">
            Requisitos de Contraseña:
          </h3>
          <ul className="text-xs text-gray-700 space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className={`w-3 h-3 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
              Al menos 8 caracteres
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className={`w-3 h-3 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
              Una letra mayúscula
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className={`w-3 h-3 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
              Una letra minúscula
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className={`w-3 h-3 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
              Un número
            </li>
          </ul>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600 font-bold text-sm">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={switchToLogin}
              disabled={isLoading}
              className="text-orange-500 font-black hover:text-orange-700 transition-colors disabled:opacity-50"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}