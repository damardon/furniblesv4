'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Shield, Eye, EyeOff, AlertTriangle, Database, Server, Activity } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { UserRole } from '@/types'

export default function AdminLoginPage() {
  const t = useTranslations('admin.login')
  const tCommon = useTranslations('common')
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const { login, user, isAuthenticated } = useAuthStore()

  // Si ya está logueado como admin, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === UserRole.ADMIN) {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Intentar login con el backend
      const result = await login(credentials.email, credentials.password)
      
      if (result.success && result.data?.user.role === UserRole.ADMIN) {
        // Login exitoso como admin, redirigir
        router.push('/admin/dashboard')
      } else if (result.success && result.data?.user.role !== UserRole.ADMIN) {
        setError(t('no_admin_permissions'))
      } else {
        setError(result.error || t('invalid_credentials'))
      }
    } catch (error) {
      console.error('Admin login error:', error)
      setError(t('connection_error'))
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading si ya está logueado y redirigiendo
  if (isAuthenticated && user?.role === UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-200 to-orange-200 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-bold text-gray-600">{t('redirecting')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-200 to-orange-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card principal */}
        <div 
          className="bg-white border-[5px] border-black p-8"
          style={{ boxShadow: '10px 10px 0 #000000' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="p-4 bg-red-500 border-3 border-black mx-auto w-fit mb-4">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-black uppercase text-black mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-600 font-bold">
              {t('subtitle')}
            </p>
          </div>

          {/* Sistema de estadísticas (decorativo) */}
          <div className="mb-6 p-4 bg-gray-100 border-2 border-gray-300">
            <h3 className="font-black text-sm uppercase text-black mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('system_status')}
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Database className="h-3 w-3 text-green-600" />
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="font-bold text-gray-600">{t('db_online')}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Server className="h-3 w-3 text-green-600" />
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="font-bold text-gray-600">{t('api_active')}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Shield className="h-3 w-3 text-green-600" />
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="font-bold text-gray-600">{t('secure')}</span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-2 border-red-500">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-bold text-red-600">{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-black uppercase text-black mb-2">
                {t('admin_email')}
              </label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
                placeholder={t('email_placeholder')}
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-black uppercase text-black mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  placeholder={t('password_placeholder')}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-black"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-red-500 border-3 border-black font-black text-white text-lg uppercase hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '5px 5px 0 #000000' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('verifying')}
                </div>
              ) : (
                t('access_panel')
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
            <p className="text-sm text-gray-600 font-bold">
              {t('not_admin')}{' '}
              <a 
                href="/" 
                className="text-red-600 hover:text-red-800 font-black underline"
              >
                {t('back_to_site')}
              </a>
            </p>
          </div>
        </div>

        {/* Warning notice */}
        <div className="mt-6 p-4 bg-gray-800 text-white border-3 border-black text-center">
          <p className="text-sm font-bold">
            {t('restricted_area')}
          </p>
        </div>
      </div>
    </div>
  )
}