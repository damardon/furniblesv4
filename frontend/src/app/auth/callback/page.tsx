'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refreshToken')
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const firstName = searchParams.get('firstName')
    const lastName = searchParams.get('lastName')
    const role = searchParams.get('role')
    const avatar = searchParams.get('avatar')

    if (!token || !userId || !email) {
      router.replace('/auth/login?error=oauth_failed')
      return
    }

    loginWithToken({
      token,
      refreshToken: refreshToken ?? token,
      user: { id: userId, email, firstName: firstName ?? '', lastName: lastName ?? '', role: role as any, avatar: avatar || undefined },
    })

    const dest = role === 'ADMIN' ? '/admin/dashboard' : role === 'SELLER' ? '/vendedor-dashboard' : '/'
    router.replace(dest)
  }, [searchParams, router, loginWithToken])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-black border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="font-black text-black uppercase">Iniciando sesión...</p>
      </div>
    </div>
  )
}
