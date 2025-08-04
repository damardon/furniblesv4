// frontend/src/app/auth/register/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const { state, register } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'BUYER' as 'BUYER' | 'SELLER'
  })

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push('/')
    }
  }, [state.isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      return // Manejar error de contraseñas no coinciden
    }

    const { confirmPassword, ...registerData } = formData
    await register(registerData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div 
          className="bg-white border-4 border-black p-8"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black uppercase mb-2">Registro</h1>
            <p className="text-gray-600">Crea tu cuenta en Furnibles</p>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 mb-6">
              <p className="font-bold">❌ {state.error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-bold text-black mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
                  placeholder="Juan"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-bold text-black mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
                  placeholder="Pérez"
                />
              </div>
            </div>

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
                className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-bold text-black mb-2">
                Tipo de cuenta
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
              >
                <option value="BUYER">🛒 Comprador</option>
                <option value="SELLER">🏪 Vendedor</option>
              </select>
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
                className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-black mb-2">
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border-2 border-black focus:border-orange-500 focus:outline-none"
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
              {state.isLoading ? '⏳ Creando cuenta...' : '🚀 Crear Cuenta'}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-orange-500 hover:underline font-bold">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}