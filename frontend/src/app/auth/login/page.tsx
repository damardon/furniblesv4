// frontend/src/app/auth/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const { state, login } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push('/')
    }
  }, [state.isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(formData.email, formData.password)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div 
          className="bg-white border-4 border-black p-8"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black uppercase mb-2">Iniciar Sesión</h1>
            <p className="text-gray-600">Accede a tu cuenta de Furnibles</p>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 mb-6">
              <p className="font-bold">❌ {state.error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-black focus:border-orange-500 focus:outline-none"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-black mb-2">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-black focus:border-orange-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={state.isLoading}
            >
              {state.isLoading ? '⏳ Iniciando sesión...' : '🔐 Iniciar Sesión'}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-orange-500 hover:underline font-bold">
                Regístrate aquí
              </Link>
            </p>
            <Link href="/auth/forgot-password" className="text-sm text-gray-500 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}