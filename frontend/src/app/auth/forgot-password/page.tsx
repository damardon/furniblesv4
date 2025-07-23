'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ForgotPasswordState {
  email: string
  isLoading: boolean
  success: boolean
  error: string | null
  emailSent: boolean
}

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgot_password')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  
  const [state, setState] = useState<ForgotPasswordState>({
    email: '',
    isLoading: false,
    success: false,
    error: null,
    emailSent: false
  })

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email
    if (!state.email.trim()) {
      setState(prev => ({ ...prev, error: t('errors.email_required') }))
      return
    }

    if (!validateEmail(state.email)) {
      setState(prev => ({ ...prev, error: t('errors.email_invalid') }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // API call to request password reset
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: state.email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || t('errors.generic'))
      }

      setState(prev => ({ 
        ...prev, 
        success: true, 
        emailSent: true,
        isLoading: false 
      }))

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : t('errors.generic'),
        isLoading: false 
      }))
    }
  }

  const handleResendEmail = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: state.email })
      })

      if (response.ok) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          success: true 
        }))
      } else {
        throw new Error(t('errors.resend_failed'))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : t('errors.generic'),
        isLoading: false 
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-black font-black text-sm uppercase hover:text-orange-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon('actions.back_home')}
          </Link>
          
          <div className="mb-6">
            <div className="w-16 h-16 bg-orange-500 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-black uppercase">
              {state.emailSent ? t('success.title') : t('title')}
            </h1>
            <p className="text-black font-bold mt-2">
              {state.emailSent ? t('success.description') : t('description')}
            </p>
          </div>
        </div>

        {/* Success State */}
        {state.emailSent ? (
          <div 
            className="bg-white border-4 border-black p-6 text-center"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="font-black text-xl uppercase text-black mb-2">
                {t('success.email_sent')}
              </h2>
              <p className="text-gray-600 font-medium">
                {t('success.check_email', { email: state.email })}
              </p>
            </div>

            {state.success && (
              <Alert variant="default" className="mb-6 bg-green-100 border-green-500">
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  {t('success.instructions')}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Button
                onClick={handleResendEmail}
                disabled={state.isLoading}
                variant="outline"
                className="w-full"
              >
                {state.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  t('resend_email')
                )}
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={() => router.push('/auth/login')}
                  variant="outline"
                  className="flex-1"
                >
                  {tAuth('login')}
                </Button>
                
                <Button
                  onClick={() => setState(prev => ({ 
                    ...prev, 
                    emailSent: false, 
                    success: false,
                    email: '',
                    error: null 
                  }))}
                  variant="default"
                  className="flex-1"
                >
                  {t('try_different_email')}
                </Button>
              </div>
            </div>

            {/* Help Section */}
            <div 
              className="mt-6 p-4 bg-blue-100 border-3 border-blue-500"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <h3 className="font-black text-blue-800 text-sm uppercase mb-2">
                {t('help.title')}
              </h3>
              <ul className="text-blue-700 text-sm font-medium space-y-1">
                <li>• {t('help.check_spam')}</li>
                <li>• {t('help.wait_time')}</li>
                <li>• {t('help.correct_email')}</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Form State */
          <div 
            className="bg-white border-4 border-black p-6"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {state.error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div>
                <label 
                  htmlFor="email"
                  className="block text-black font-black text-sm uppercase mb-2"
                >
                  {tAuth('fields.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={state.email}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      email: e.target.value,
                      error: null 
                    }))}
                    placeholder={t('email_placeholder')}
                    className="w-full pl-12 pr-4 py-3 bg-white border-3 border-black font-medium focus:outline-none focus:bg-yellow-400 transition-all"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                    required
                    disabled={state.isLoading}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-600 font-medium">
                  {t('email_hint')}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={state.isLoading || !state.email.trim()}
                className="w-full"
                size="lg"
              >
                {state.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  t('send_reset_link')
                )}
              </Button>

              {/* Alternative Actions */}
              <div className="text-center pt-4 border-t-2 border-gray-200">
                <p className="text-gray-600 font-medium text-sm mb-3">
                  {t('remember_password')}
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-orange-500 font-black text-sm uppercase hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('back_to_login')}
                </Link>
              </div>
            </form>

            {/* Security Notice */}
            <div 
              className="mt-6 p-4 bg-gray-100 border-2 border-gray-300"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <h3 className="font-black text-gray-800 text-xs uppercase mb-2 flex items-center gap-1">
                🔒 {t('security.title')}
              </h3>
              <p className="text-gray-600 text-xs font-medium">
                {t('security.description')}
              </p>
            </div>
          </div>
        )}

        {/* Footer Links */}
        <div className="text-center mt-6">
          <div className="flex justify-center gap-4 text-black font-bold text-sm">
            <Link href="/ayuda" className="hover:text-orange-500 transition-colors">
              {tCommon('help')}
            </Link>
            <span>•</span>
            <Link href="/contacto" className="hover:text-orange-500 transition-colors">
              {tCommon('contact')}
            </Link>
            <span>•</span>
            <Link href="/privacidad" className="hover:text-orange-500 transition-colors">
              {tCommon('privacy')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}