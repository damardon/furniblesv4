// frontend/src/contexts/auth-context.tsx
'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// ✅ Tipos basados en tu backend
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'BUYER' | 'SELLER' | 'ADMIN'
  isVerified: boolean
  sellerProfile?: {
    id: string
    storeName: string
    slug: string
    description?: string
    avatar?: string
    isVerified: boolean
  }
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  error: null,
  isAuthenticated: false
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      }
    default:
      return state
  }
}

interface AuthContextType {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateUser: (user: User) => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: 'BUYER' | 'SELLER'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const router = useRouter()

  // ✅ Funciones para manejar tokens
  const setTokenInStorage = (token: string) => {
    localStorage.setItem('auth_token', token)
    sessionStorage.setItem('auth_token', token)
  }

  const removeTokenFromStorage = () => {
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
  }

  const getTokenFromStorage = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    }
    return null
  }

  // ✅ Headers para las peticiones autenticadas
  const getAuthHeaders = (token?: string) => {
    const authToken = token || state.token || getTokenFromStorage()
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  }

  // ✅ Función de login
  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      console.log('🔐 [AUTH] Attempting login...')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error en el login')
      }

      const data = await response.json()
      
      // Guardar token
      setTokenInStorage(data.access_token)
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.user,
          token: data.access_token
        }
      })

      console.log('✅ [AUTH] Login successful')
      
    } catch (error: any) {
      console.error('❌ [AUTH] Login error:', error)
      dispatch({ type: 'SET_ERROR', payload: error.message })
    }
  }

  // ✅ Función de registro
  const register = async (data: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      console.log('🔐 [AUTH] Attempting registration...')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error en el registro')
      }

      const responseData = await response.json()
      
      // Guardar token
      setTokenInStorage(responseData.access_token)
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: responseData.user,
          token: responseData.access_token
        }
      })

      console.log('✅ [AUTH] Registration successful')
      
    } catch (error: any) {
      console.error('❌ [AUTH] Registration error:', error)
      dispatch({ type: 'SET_ERROR', payload: error.message })
    }
  }

  // ✅ Función de logout
  const logout = async () => {
    try {
      console.log('🔐 [AUTH] Logging out...')
      
      const token = getTokenFromStorage()
      if (token) {
        // Intentar logout en el servidor
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: getAuthHeaders(token)
        }).catch(() => {
          // Si falla el logout del servidor, continuamos con el logout local
          console.warn('Server logout failed, continuing with local logout')
        })
      }

      // Limpiar estado local
      removeTokenFromStorage()
      dispatch({ type: 'LOGOUT' })
      
      console.log('✅ [AUTH] Logout successful')
      router.push('/')
      
    } catch (error) {
      console.error('❌ [AUTH] Logout error:', error)
      // Aún así limpiar el estado local
      removeTokenFromStorage()
      dispatch({ type: 'LOGOUT' })
    }
  }

  // ✅ Verificar autenticación al cargar
  const checkAuth = async () => {
    const token = getTokenFromStorage()
    
    if (!token) {
      dispatch({ type: 'SET_LOADING', payload: false })
      return
    }

    try {
      console.log('🔐 [AUTH] Checking authentication...')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        headers: getAuthHeaders(token)
      })

      if (response.ok) {
        const userData = await response.json()
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: userData,
            token
          }
        })
        console.log('✅ [AUTH] Authentication verified')
      } else {
        // Token inválido o expirado
        removeTokenFromStorage()
        dispatch({ type: 'LOGOUT' })
        console.log('❌ [AUTH] Invalid token, logged out')
      }
    } catch (error) {
      console.error('❌ [AUTH] Auth check error:', error)
      removeTokenFromStorage()
      dispatch({ type: 'LOGOUT' })
    }
  }

  // ✅ Actualizar información del usuario
  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user })
  }

  // ✅ Verificar auth al montar
  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    state,
    login,
    register,
    logout,
    checkAuth,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ✅ EXPORTAR EL HOOK useAuth
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}