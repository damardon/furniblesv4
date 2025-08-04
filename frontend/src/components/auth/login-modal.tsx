'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast' // ← AGREGAR IMPORT
import { 
  X, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'

export function LoginModal() {
  const t = useTranslations('auth')
  
  // Stores
  const { 
    loginModalOpen, 
    setLoginModalOpen, 
    setRegisterModalOpen, 
    login,
    isLoading 
  } = useAuthStore()

  // States
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
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

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email no válido'
    }

    // Password validation
    if (!formData.password.trim()) {
      errors.password = 'Contraseña es requerida'
    } else if (formData.password.length < 6) {
      errors.password = 'Contraseña debe tener al menos 6 caracteres'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setError(null)
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        // ✅ SUCCESS FEEDBACK
        const userName = result.data?.user?.firstName || 'Usuario'
        
        toast.success(`¡Bienvenido de vuelta, ${userName}!`, {
          duration: 4000,
          icon: '🎉',
          style: {
            background: '#22c55e',
            color: '#ffffff',
            border: '3px solid #000000',
            fontWeight: '700',
            fontSize: '16px',
          }
        })
        
        // Clear form
        setFormData({ email: '', password: '' })
        setValidationErrors({})
        
        // Modal se cierra automáticamente via store
        
      } else {
        // Handle error from store
        setError(result.error || 'Error al iniciar sesión')
        
        toast.error('Error al iniciar sesión', {
          duration: 3000,
          icon: '❌'
        })
      }
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error al iniciar sesión'
      setError(errorMessage)
      
      toast.error(errorMessage, {
        duration: 3000,
        icon: '❌'
      })
    }
  }

  const handleClose = () => {
    setLoginModalOpen(false)
    setFormData({ email: '', password: '' })
    setValidationErrors({})
    setError(null)
  }

  const switchToRegister = () => {
    handleClose()
    setRegisterModalOpen(true)
  }

  if (!loginModalOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white border-[5px] border-black p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '12px 12px 0 #000000' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 border-3 border-black flex items-center justify-center">
              <LogIn className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-2xl font-black text-black uppercase">
              Iniciar Sesión
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="text-red-600 text-xs font-bold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
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
                autoComplete="current-password"
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
              <p className="text-red-600 text-xs font-bold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <button
              type="button"
              className="text-blue-600 text-sm font-bold hover:text-blue-800 transition-colors"
              onClick={() => {
                // TODO: Implement forgot password
                alert('Funcionalidad próximamente disponible')
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
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
                Iniciando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts */}
        <div 
          className="bg-blue-100 border-3 border-black p-4 mt-6"
          style={{ boxShadow: '3px 3px 0 #000000' }}
        >
          <h3 className="text-black font-black text-sm uppercase mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Cuentas de Prueba
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">Comprador:</span>
              <button
                onClick={() => {
                  setFormData({ email: 'buyer@furnibles.com', password: 'buyer123' })
                }}
                className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
              >
                buyer@furnibles.com
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">Vendedor:</span>
              <button
                onClick={() => {
                  setFormData({ email: 'seller@furnibles.com', password: 'seller123' })
                }}
                className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
              >
                seller@furnibles.com
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">Admin:</span>
              <button
                onClick={() => {
                  setFormData({ email: 'admin@furnibles.com', password: 'admind123' })
                }}
                className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
              >
                admin@furnibles.com
              </button>
            </div>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600 font-bold text-sm">
            ¿No tienes cuenta?{' '}
            <button
              onClick={switchToRegister}
              disabled={isLoading}
              className="text-orange-500 font-black hover:text-orange-700 transition-colors disabled:opacity-50"
            >
              Regístrate aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}