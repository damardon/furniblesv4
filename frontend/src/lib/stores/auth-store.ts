import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, UserRole } from '@/types'
import { ApiResponse } from '@/types/additional'
import { registerStore } from './store-manager'
import { storeManager} from './store-manager'

// AUTH STATE INTERFACE
interface AuthState {
  // Estado de autenticación
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Token y sesión
  token: string | null
  refreshToken: string | null
  tokenExpiry: number | null
  
  // Estado de UI
  loginModalOpen: boolean
  registerModalOpen: boolean
  
  // Datos temporales de registro
  tempRegistrationData: Partial<User> | null
}

// AUTH ACTIONS INTERFACE
interface AuthActions {
  // Acciones de autenticación
  login: (email: string, password: string) => Promise<ApiResponse<{ user: User; token: string }>>
  logout: () => void
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: UserRole
  }) => Promise<ApiResponse<{ user: User; token: string }>>
  
  // Gestión de tokens
  setToken: (token: string, refreshToken?: string, expiresIn?: number) => void
  clearTokens: () => void
  refreshAccessToken: () => Promise<boolean>
  
  // Gestión de usuario
  setUser: (user: User) => void
  updateUser: (updates: Partial<User>) => void
  clearUser: () => void
  
  // Verificación de email
  verifyEmail: (token: string) => Promise<ApiResponse>
  resendVerification: (email: string) => Promise<ApiResponse>
  
  // Recuperación de contraseña
  forgotPassword: (email: string) => Promise<ApiResponse>
  resetPassword: (token: string, newPassword: string) => Promise<ApiResponse>
  
  // Estado de UI
  setLoginModalOpen: (open: boolean) => void
  setRegisterModalOpen: (open: boolean) => void
  
  // Utilidades
  checkAuthStatus: () => Promise<void>
  isTokenValid: () => boolean
  hasRole: (role: UserRole) => boolean
  canAccessSellerFeatures: () => boolean
  canAccessAdminFeatures: () => boolean
}

// INITIAL STATE
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

// AUTH STORE
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // ESTADO INICIAL
      ...initialState,

      // ACCIONES DE AUTENTICACIÓN
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
            
            // Calcular tiempo de expiración
            const tokenExpiry = Date.now() + (expiresIn * 1000)
            
            set({
              user,
              token,
              refreshToken,
              tokenExpiry,
              isAuthenticated: true,
              isLoading: false,
              loginModalOpen: false,
            })

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

      logout: () => {
        // Invalidar token en el servidor si es posible
        const { token } = get()
        if (token) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }).catch(console.error)
        }

        // Limpiar estado local
        set({
          ...initialState,
        })
      },

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
            
            set({
              user,
              token,
              refreshToken,
              tokenExpiry,
              isAuthenticated: true,
              isLoading: false,
              registerModalOpen: false,
              tempRegistrationData: null,
            })

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

      // GESTIÓN DE TOKENS
      setToken: (token: string, refreshToken?: string, expiresIn?: number) => {
        const tokenExpiry = expiresIn ? Date.now() + (expiresIn * 1000) : null
        set({ 
          token, 
          refreshToken: refreshToken || get().refreshToken,
          tokenExpiry,
          isAuthenticated: true 
        })
      },

      clearTokens: () => {
        set({ 
          token: null, 
          refreshToken: null, 
          tokenExpiry: null,
          isAuthenticated: false 
        })
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

      // GESTIÓN DE USUARIO
      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...updates } })
        }
      },

      clearUser: () => {
        set({ user: null, isAuthenticated: false })
      },

      // VERIFICACIÓN DE EMAIL
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
            // Actualizar usuario como verificado
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

      // RECUPERACIÓN DE CONTRASEÑA
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

      // ESTADO DE UI
      setLoginModalOpen: (open: boolean) => {
        set({ loginModalOpen: open })
      },

      setRegisterModalOpen: (open: boolean) => {
        set({ registerModalOpen: open })
      },

      // UTILIDADES
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

        // Verificar con el servidor
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
        return Date.now() < tokenExpiry - 60000 // 1 minuto de margen
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
          // Verificar si el token ha expirado al hidratar
          if (!state.isTokenValid()) {
            state.logout()
          }
        }
      },
    }
  )
)

// Registrar el store en el manager
if (typeof window !== 'undefined') {
  registerStore('auth', useAuthStore)
}