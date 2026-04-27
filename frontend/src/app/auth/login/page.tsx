'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { state } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (state.isAuthenticated) {
      router.push('/')
    }
  }, [state.isAuthenticated, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div
          className="bg-white border-4 border-black p-8"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          {/* Logo / Header */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-black uppercase mb-1 tracking-tight">
              Furnibles
            </h1>
            <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">
              Marketplace de diseño
            </p>
          </div>

          {/* Error */}
          {state.error && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 mb-6">
              <p className="font-bold text-sm">{state.error}</p>
            </div>
          )}

          {/* Google SSO — único método */}
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
            className="w-full flex items-center justify-center gap-3 bg-white border-4 border-black px-6 py-4 font-black uppercase text-sm hover:bg-yellow-400 transition-all duration-200"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </a>

          <p className="text-center text-xs text-gray-400 mt-6">
            Al continuar aceptas nuestros términos de uso
          </p>
        </div>
      </div>
    </div>
  )
}
