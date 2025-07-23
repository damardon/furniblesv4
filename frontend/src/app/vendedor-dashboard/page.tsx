'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function SellerDashboardRedirectPage() {
  const router = useRouter()
  const t = useTranslations('common')

  useEffect(() => {
    // Redirigir inmediatamente al dashboard
    router.replace('/vendedor-dashboard/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-bold">{t('loading')}</p>
      </div>
    </div>
  )
}