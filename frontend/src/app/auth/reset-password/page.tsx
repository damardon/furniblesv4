'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { 
  ArrowLeft, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PasswordStrength {
  score: number
  feedback: string[]
  isValid: boolean
}

interface ResetPasswordState {
  token: string | null
  password: string
  confirmPassword: string
  isLoading: boolean
  success: boolean
  error: string | null
  showPassword: boolean
  showConfirmPassword: boolean
  passwordStrength: PasswordStrength
  tokenValid: boolean
  tokenChecked: boolean
}

export default function ResetPasswordPage() {
  const t = useTranslations('auth.reset_password')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [state, setState] = useState<ResetPasswordState>({
    token: null,
    password: '',
    confirmPassword: '',
    isLoading: false,
    success: false,
    error: null,
    showPassword: false,
    showConfirmPassword: false,
    passwordStrength: { score: 0, feedback: [], isValid: false },
    tokenValid: false,
    tokenChecked: false
  })

  // Check token validity on mount
  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setState(prev => ({ 
        ...prev, 
        error: t('errors.token_missing'),
        tokenChecked: true 
      }))
      return
    }

    validateToken(token)
  }, [searchParams])

  const validateToken = async (token: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const response = await fetch('/api/auth/validate-reset-token', {
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
          token,
          tokenValid: true,
          tokenChecked: true,
          isLoading: false 
        }))
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.message || t('errors.token_invalid'),
          tokenValid: false,
          tokenChecked: true,
          isLoading: false 
        }))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: t('errors.token_validation_failed'),
        tokenValid: false,
        tokenChecked: true,
        isLoading: false 
      }))
    }
  }

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = []
    let score = 0

    // Length check
    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push(t('password.requirements.length'))
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push(t('password.requirements.uppercase'))
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push(t('password.requirements.lowercase'))
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1
    } else {
      feedback.push(t('password.requirements.number'))
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1
    } else {
      feedback.push(t('password.requirements.special'))
    }

    return {
      score,
      feedback,
      isValid: score >= 4 && password.length >= 8
    }
  }

  const handlePasswordChange = (password: string) => {
    const strength = calculatePasswordStrength(password)
    setState(prev => ({ 
      ...prev, 
      password, 
      passwordStrength: strength,
      error: null 
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!state.tokenValid || !state.token) {
      setState(prev => ({ ...prev, error: t('errors.token_invalid') }))
      return
    }

    if (!state.passwordStrength.isValid) {
      setState(prev => ({ ...prev, error: t('errors.password_requirements') }))
      return
    }

    if (state.password !== state.confirmPassword) {
      setState(prev => ({ ...prev, error: t('errors.passwords_mismatch') }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token: state.token,
          password: state.password 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || t('errors.generic'))
      }

      setState(prev => ({ 
        ...prev, 
        success: true,
        isLoading: false 
      }))

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?message=password_reset_success')
      }, 3000)

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : t('errors.generic'),
        isLoading: false 
      }))
    }
  }

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-400'
    if (score <= 2) return 'bg-yellow-400'
    if (score <= 3) return 'bg-blue-400'
    return 'bg-green-400'
  }

  const getStrengthText = (score: number) => {
    if (score <= 1) return t('password.strength.weak')
    if (score <= 2) return t('password.strength.fair')
    if (score <= 3) return t('password.strength.good')
    return t('password.strength.strong')
  }

  // Loading state while checking token
  if (!state.tokenChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-black font-bold">{t('validating_token')}</p>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (!state.tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div 
            className="bg-white border-4 border-black p-6 text-center"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-black uppercase mb-4">
              {t('errors.invalid_token_title')}
            </h1>
            <p className="text-gray-600 font-medium mb-6">
              {state.error || t('errors.invalid_token_description')}
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/forgot-password')}
                className="w-full"
              >
                {t('request_new_link')}
              </Button>
              
              <Link
                href="/auth/login"
                className="block text-orange-500 font-black text-sm uppercase hover:text-black transition-colors"
              >
                {t('back_to_login')}
              </Link>
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
            className="bg-white border-4 border-black p-6 text-center"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-black uppercase mb-4">
              {t('success.title')}
            </h1>
            <p className="text-gray-600 font-medium mb-6">
              {t('success.description')}
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                {t('continue_to_login')}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/auth/login"
            className="inline-flex items-center gap-2 text-black font-black text-sm uppercase hover:text-orange-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('back_to_login')}
          </Link>
          
          <div className="mb-6">
            <div className="w-16 h-16 bg-orange-500 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-black uppercase">
              {t('title')}
            </h1>
            <p className="text-black font-bold mt-2">
              {t('description')}
            </p>
          </div>
        </div>

        {/* Form */}
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

            {/* New Password */}
            <div>
              <label 
                htmlFor="password"
                className="block text-black font-black text-sm uppercase mb-2"
              >
                {t('new_password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={state.showPassword ? 'text' : 'password'}
                  value={state.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder={t('password_placeholder')}
                  className="w-full pl-12 pr-12 py-3 bg-white border-3 border-black font-medium focus:outline-none focus:bg-yellow-400 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  required
                  disabled={state.isLoading}
                />
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {state.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {state.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">
                      {t('password.strength.label')}:
                    </span>
                    <span className={cn(
                      "text-xs font-black uppercase",
                      state.passwordStrength.score <= 1 ? 'text-red-600' :
                      state.passwordStrength.score <= 2 ? 'text-yellow-600' :
                      state.passwordStrength.score <= 3 ? 'text-blue-600' : 'text-green-600'
                    )}>
                      {getStrengthText(state.passwordStrength.score)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 border-2 border-black h-2">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        getStrengthColor(state.passwordStrength.score)
                      )}
                      style={{ width: `${(state.passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>

                  {/* Requirements List */}
                  <div className="space-y-1">
                    {[
                      { test: state.password.length >= 8, text: t('password.requirements.length') },
                      { test: /[A-Z]/.test(state.password), text: t('password.requirements.uppercase') },
                      { test: /[a-z]/.test(state.password), text: t('password.requirements.lowercase') },
                      { test: /\d/.test(state.password), text: t('password.requirements.number') },
                      { test: /[!@#$%^&*(),.?":{}|<>]/.test(state.password), text: t('password.requirements.special') }
                    ].map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {req.test ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <X className="w-3 h-3 text-red-600" />
                        )}
                        <span className={cn(
                          "text-xs font-medium",
                          req.test ? 'text-green-600' : 'text-red-600'
                        )}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="confirmPassword"
                className="block text-black font-black text-sm uppercase mb-2"
              >
                {t('confirm_password')}
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={state.showConfirmPassword ? 'text' : 'password'}
                  value={state.confirmPassword}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    confirmPassword: e.target.value,
                    error: null 
                  }))}
                  placeholder={t('confirm_password_placeholder')}
                  className="w-full pl-12 pr-12 py-3 bg-white border-3 border-black font-medium focus:outline-none focus:bg-yellow-400 transition-all"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  required
                  disabled={state.isLoading}
                />
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {state.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {state.confirmPassword && (
                <div className="mt-2 flex items-center gap-2">
                  {state.password === state.confirmPassword ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        {t('password.match')}
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-medium text-red-600">
                        {t('password.no_match')}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                state.isLoading || 
                !state.passwordStrength.isValid || 
                state.password !== state.confirmPassword ||
                !state.password ||
                !state.confirmPassword
              }
              className="w-full"
              size="lg"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('updating_password')}
                </>
              ) : (
                t('update_password')
              )}
            </Button>
          </form>

          {/* Security Tips */}
          <div 
            className="mt-6 p-4 bg-blue-100 border-3 border-blue-500"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <h3 className="font-black text-blue-800 text-sm uppercase mb-2 flex items-center gap-1">
              🔒 {t('security_tips.title')}
            </h3>
            <ul className="text-blue-700 text-xs font-medium space-y-1">
              <li>• {t('security_tips.unique_password')}</li>
              <li>• {t('security_tips.avoid_personal_info')}</li>
              <li>• {t('security_tips.enable_2fa')}</li>
              <li>• {t('security_tips.keep_secure')}</li>
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
          </div>
        </div>
      </div>
    </div>
  )
}