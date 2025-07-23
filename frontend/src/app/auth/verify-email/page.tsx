'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  ArrowLeft,
  Home,
  LogIn,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface VerifyEmailState {
  token: string | null
  email: string | null
  isLoading: boolean
  isVerifying: boolean
  isResending: boolean
  success: boolean
  error: string | null
  tokenChecked: boolean
  canResend: boolean
  resendCooldown: number
}

export default function VerifyEmailPage() {
  const t = useTranslations('auth.verify_email')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [state, setState] = useState<VerifyEmailState>({
    token: null,
    email: null,
    isLoading: false,
    isVerifying: false,
    isResending: false,
    success: false,
    error: null,
    tokenChecked: false,
    canResend: true,
    resendCooldown: 0
  })

  // Extract token and email from URL params
  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    setState(prev => ({ ...prev, token, email }))

    if (token) {
      verifyEmail(token)
    } else {
      setState(prev => ({ ...prev, tokenChecked: true }))
    }
  }, [searchParams])

  // Cooldown timer
  useEffect(() => {
    if (state.resendCooldown > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          resendCooldown: prev.resendCooldown - 1,
          canResend: prev.resendCooldown <= 1
        }))
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [state.resendCooldown])

  const verifyEmail = async (token: string) => {
    setState(prev => ({ ...prev, isVerifying: true, error: null }))
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (response.ok) {
        setState(prev => ({ 
          ...prev, 
          success: true,
          isVerifying: false,
          tokenChecked: true
        }))
        
        // Auto redirect to login after success
        setTimeout(() => {
          router.push('/auth/login?message=email_verified')
        }, 3000)
        
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.message || t('errors.verification_failed'),
          isVerifying: false,
          tokenChecked: true
        }))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: t('errors.network_error'),
        isVerifying: false,
        tokenChecked: true
      }))
    }
  }

  const resendVerificationEmail = async () => {
    if (!state.email || !state.canResend) return
    
    setState(prev => ({ ...prev, isResending: true, error: null }))
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: state.email })
      })

      const data = await response.json()

      if (response.ok) {
        setState(prev => ({ 
          ...prev, 
          isResending: false,
          resendCooldown: 60,
          canResend: false
        }))
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.message || t('errors.resend_failed'),
          isResending: false
        }))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: t('errors.resend_network_error'),
        isResending: false
      }))
    }
  }

  // Loading state while verifying
  if (state.isVerifying || !state.tokenChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div 
            className="bg-white border-4 border-black p-8 text-center"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <div className="mb-6">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-orange-500" />
              <h1 className="text-2xl font-black text-black uppercase mb-2">
                {t('verifying.title')}
              </h1>
              <p className="text-gray-600 font-medium">
                {t('verifying.description')}
              </p>
            </div>
            
            <div 
              className="p-4 bg-blue-100 border-2 border-blue-500"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <p className="text-blue-700 text-sm font-medium">
                {t('verifying.please_wait')}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (state.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div 
            className="bg-white border-4 border-black p-8 text-center"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-black text-black uppercase mb-2">
                {t('success.title')}
              </h1>
              <p className="text-gray-600 font-medium mb-4">
                {t('success.description')}
              </p>
              
              {state.email && (
                <div 
                  className="p-3 bg-green-100 border-2 border-green-500 mb-4"
                  style={{ boxShadow: '2px 2px 0 #000000' }}
                >
                  <p className="text-green-800 font-bold text-sm">
                    ✓ {state.email}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {t('success.continue_login')}
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                {t('success.go_home')}
              </Button>
              
              <p className="text-sm text-gray-500 font-medium">
                {t('success.redirect_notice')}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state or no token
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
              {state.token ? t('error.title') : t('manual.title')}
            </h1>
            <p className="text-black font-bold mt-2">
              {state.token ? t('error.description') : t('manual.description')}
            </p>
          </div>
        </div>

        <div 
          className="bg-white border-4 border-black p-6"
          style={{ boxShadow: '6px 6px 0 #000000' }}
        >
          {/* Error Alert */}
          {state.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* No Token - Manual Verification */}
          {!state.token ? (
            <div className="text-center">
              <div className="mb-6">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h2 className="font-black text-lg uppercase text-black mb-2">
                  {t('manual.check_email')}
                </h2>
                <p className="text-gray-600 font-medium text-sm">
                  {t('manual.instructions')}
                </p>
              </div>

              <div className="space-y-4">
                {state.email ? (
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3">
                      {t('manual.sent_to')}: {state.email}
                    </p>
                    
                    <Button
                      onClick={resendVerificationEmail}
                      disabled={state.isResending || !state.canResend}
                      variant="outline"
                      className="w-full"
                    >
                      {state.isResending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('manual.sending')}
                        </>
                      ) : state.canResend ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {t('manual.resend')}
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          {t('manual.resend_in', { seconds: state.resendCooldown })}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 font-medium">
                      {t('manual.no_email_provided')}
                    </p>
                    
                    <Button
                      onClick={() => router.push('/auth/register')}
                      className="w-full"
                    >
                      {t('manual.register_again')}
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push('/auth/login')}
                    variant="outline"
                    className="flex-1"
                  >
                    {tAuth('login')}
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="flex-1"
                  >
                    {tCommon('home')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Token Error State */
            <div className="text-center">
              <div className="mb-6">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h2 className="font-black text-lg uppercase text-black mb-2">
                  {t('error.verification_failed')}
                </h2>
                <p className="text-gray-600 font-medium text-sm">
                  {state.error}
                </p>
              </div>

              <div className="space-y-4">
                {state.email && (
                  <Button
                    onClick={resendVerificationEmail}
                    disabled={state.isResending || !state.canResend}
                    className="w-full"
                  >
                    {state.isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('error.sending_new')}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('error.request_new')}
                      </>
                    )}
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push('/auth/login')}
                    variant="outline"
                    className="flex-1"
                  >
                    {tAuth('login')}
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/auth/register')}
                    variant="outline"
                    className="flex-1"
                  >
                    {tAuth('register')}
                  </Button>
                </div>
              </div>
            </div>
          )}

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
              <li>• {t('help.check_promotions')}</li>
              <li>• {t('help.wait_minutes')}</li>
              <li>• {t('help.correct_email')}</li>
            </ul>
          </div>
        </div>

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