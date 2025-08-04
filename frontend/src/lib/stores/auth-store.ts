import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, UserRole } from '@/types'
import { ApiResponse } from '@/types/additional'

// ✅ SIN IMPORTACIONES DE STORE-MANAGER

// ✅ FUNCIONES DE COOKIES CORREGIDAS
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window === 'undefined') return
  
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
    console.log('✅ Cookie set:', name)
  } catch (error) {
    console.error('❌ Cookie error:', error)
  }
}

const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
  console.log('🗑️ Cookie deleted:', name)
}

// ✅ FUNCIÓN CORREGIDA - CREAR LA MISMA ESTRUCTURA QUE LOCALSTORAGE
const syncStateToCookie = (state: any) => {
  if (typeof window === 'undefined') return
  
  try {
    // ✅ ESTRUCTURA CORREGIDA: Igual que localStorage
    const cookieData = {
      state: {
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        tokenExpiry: state.tokenExpiry,
        isAuthenticated: state.isAuthenticated,
      },
      version: 0
    }
    
    setCookie('furnibles-auth-storage', JSON.stringify(cookieData))
    
    console.log('🔄 State synced to cookie with correct structure')
    console.log('🔍 Cookie data preview:', {
      hasState: !!cookieData.state,
      isAuthenticated: cookieData.state.isAuthenticated,
      hasUser: !!cookieData.state.user,
      userRole: cookieData.state.user?.role
    })
  } catch (error) {
    console.error('❌ Sync error:', error)
  }
}

// AUTH STATE INTERFACE
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  refreshToken: string | null
  tokenExpiry: number | null
  loginModalOpen: boolean
  registerModalOpen: boolean
  tempRegistrationData: Partial<User> | null
}

// AUTH ACTIONS INTERFACE
interface AuthActions {
  login: (email: string, password: string) => Promise<ApiResponse<{ user: User; token: string }>>
  logout: () => void
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: UserRole
  }) => Promise<ApiResponse<{ user: User; token: string }>>
  setToken: (token: string, refreshToken?: string, expiresIn?: number) => void
  clearTokens: () => void
  refreshAccessToken: () => Promise<boolean>
  setUser: (user: User) => void
  updateUser: (updates: Partial<User>) => void
  clearUser: () => void
  verifyEmail: (token: string) => Promise<ApiResponse>
  resendVerification: (email: string) => Promise<ApiResponse>
  forgotPassword: (email: string) => Promise<ApiResponse>
  resetPassword: (token: string, newPassword: string) => Promise<ApiResponse>
  setLoginModalOpen: (open: boolean) => void
  setRegisterModalOpen: (open: boolean) => void
  checkAuthStatus: () => Promise<void>
  isTokenValid: () => boolean
  hasRole: (role: UserRole) => boolean
  canAccessSellerFeatures: () => boolean
  canAccessAdminFeatures: () => boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  token: null,
  refreshToken: null,
  tokenExpiry: null,
  loginModalOpen: false,
  registerModalOpen: false,
  tempRegistrationData: null,
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ✅ LOGIN CON SINCRONIZACIÓN DE COOKIES
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          const result: ApiResponse<{ user: User; token: string; refreshToken: string; expiresIn: number }> = await response.json()

          if (result.success && result.data) {
            const { user, token, refreshToken, expiresIn } = result.data
            const tokenExpiry = Date.now() + (expiresIn * 1000)
            
            const newState = {
              user,
              token,
              refreshToken,
              tokenExpiry,
              isAuthenticated: true,
              isLoading: false,
              loginModalOpen: false,
            }
            
            set(newState)
            
            // ✅ SINCRONIZAR CON COOKIES
            syncStateToCookie({ ...get(), ...newState })

            return { success: true, data: { user, token } }
          } else {
            set({ isLoading: false })
            return { success: false, error: result.error || 'Error de login' }
          }
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false })
          return { success: false, error: 'Error de conexión' }
        }
      },

      // ✅ LOGOUT CON LIMPIEZA DE COOKIES
      logout: () => {
        const { token } = get()
        if (token) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }).catch(console.error)
        }

        set({ ...initialState })
        deleteCookie('furnibles-auth-storage')
      },

      // ✅ REGISTER CON SINCRONIZACIÓN DE COOKIES
      register: async (userData) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          })

          const result: ApiResponse<{ user: User; token: string; refreshToken: string; expiresIn: number }> = await response.json()

          if (result.success && result.data) {
            const { user, token, refreshToken, expiresIn } = result.data
            const tokenExpiry = Date.now() + (expiresIn * 1000)
            
            const newState = {
              user,
              token,
              refreshToken,
              tokenExpiry,
              isAuthenticated: true,
              isLoading: false,
              registerModalOpen: false,
              tempRegistrationData: null,
            }
            
            set(newState)
            syncStateToCookie({ ...get(), ...newState })

            return { success: true, data: { user, token } }
          } else {
            set({ isLoading: false })
            return { success: false, error: result.error || 'Error de registro' }
          }
        } catch (error) {
          console.error('Register error:', error)
          set({ isLoading: false })
          return { success: false, error: 'Error de conexión' }
        }
      },

      setToken: (token: string, refreshToken?: string, expiresIn?: number) => {
        const tokenExpiry = expiresIn ? Date.now() + (expiresIn * 1000) : null
        const newState = { 
          token, 
          refreshToken: refreshToken || get().refreshToken,
          tokenExpiry,
          isAuthenticated: true 
        }
        
        set(newState)
        syncStateToCookie({ ...get(), ...newState })
      },

      clearTokens: () => {
        set({ 
          token: null, 
          refreshToken: null, 
          tokenExpiry: null,
          isAuthenticated: false 
        })
        deleteCookie('furnibles-auth-storage')
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return false

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          })

          const result: ApiResponse<{ token: string; expiresIn: number }> = await response.json()

          if (result.success && result.data) {
            const { token, expiresIn } = result.data
            get().setToken(token, undefined, expiresIn)
            return true
          } else {
            get().logout()
            return false
          }
        } catch (error) {
          console.error('Token refresh error:', error)
          get().logout()
          return false
        }
      },

      setUser: (user: User) => {
        const newState = { user, isAuthenticated: true }
        set(newState)
        syncStateToCookie({ ...get(), ...newState })
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get()
        if (user) {
          const newState = { user: { ...user, ...updates } }
          set(newState)
          syncStateToCookie({ ...get(), ...newState })
        }
      },

      clearUser: () => {
        set({ user: null, isAuthenticated: false })
        deleteCookie('furnibles-auth-storage')
      },

      verifyEmail: async (token: string) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          })

          const result: ApiResponse = await response.json()
          
          if (result.success) {
            const { user } = get()
            if (user) {
              get().updateUser({ emailVerified: true })
            }
          }

          return result
        } catch (error) {
          console.error('Email verification error:', error)
          return { success: false, error: 'Error de verificación' }
        }
      },

      resendVerification: async (email: string) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          })

          return await response.json()
        } catch (error) {
          console.error('Resend verification error:', error)
          return { success: false, error: 'Error al reenviar verificación' }
        }
      },

      forgotPassword: async (email: string) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          })

          return await response.json()
        } catch (error) {
          console.error('Forgot password error:', error)
          return { success: false, error: 'Error al enviar email de recuperación' }
        }
      },

      resetPassword: async (token: string, newPassword: string) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword }),
          })

          return await response.json()
        } catch (error) {
          console.error('Reset password error:', error)
          return { success: false, error: 'Error al restablecer contraseña' }
        }
      },

      setLoginModalOpen: (open: boolean) => {
        set({ loginModalOpen: open })
      },

      setRegisterModalOpen: (open: boolean) => {
        set({ registerModalOpen: open })
      },

      checkAuthStatus: async () => {
        const { token, isTokenValid, refreshAccessToken } = get()
        
        if (!token) {
          get().logout()
          return
        }

        if (!isTokenValid()) {
          const refreshed = await refreshAccessToken()
          if (!refreshed) {
            get().logout()
            return
          }
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${get().token}`,
            },
          })

          if (response.ok) {
            const result: ApiResponse<User> = await response.json()
            if (result.success && result.data) {
              get().setUser(result.data)
            }
          } else {
            get().logout()
          }
        } catch (error) {
          console.error('Auth status check error:', error)
          get().logout()
        }
      },

      isTokenValid: () => {
        const { tokenExpiry } = get()
        if (!tokenExpiry) return false
        return Date.now() < tokenExpiry - 60000
      },

      hasRole: (role: UserRole) => {
        const { user } = get()
        if (!user) return false
        return user.role === role || user.isBoth
      },

      canAccessSellerFeatures: () => {
        const { user } = get()
        if (!user) return false
        return user.role === UserRole.SELLER || user.role === UserRole.ADMIN || user.isBoth
      },

      canAccessAdminFeatures: () => {
        const { user } = get()
        if (!user) return false
        return user.role === UserRole.ADMIN
      },
    }),
    {
      name: 'furnibles-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        tokenExpiry: state.tokenExpiry,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          syncStateToCookie(state)
          
          if (!state.isTokenValid()) {
            state.logout()
          }
        }
      },
    }
  )
)

// ✅ SIN REGISTRO EN STORE-MANAGER