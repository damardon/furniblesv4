'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Mail,
  Calendar,
  Activity,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Users as UsersIcon,
  ShoppingCart,
  Package,
  Star
} from 'lucide-react'

// Stores y Types
import { useAdminStore } from '@/lib/stores/admin-store'
import { User, UserRole, UserStatus } from '@/types'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Checkbox } from '@/components/ui/checkbox'

// Tipos para las acciones de usuario
type UserAction = 'promote' | 'demote' | 'activate' | 'suspend' | 'reset_password' | 'view_details' | null

interface UserActionState {
  action: UserAction
  user: User | null
  reason: string
  newRole?: UserRole
}

export default function AdminUsersPage() {
  // Estados principales
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [userAction, setUserAction] = useState<UserActionState>({
    action: null,
    user: null,
    reason: '',
    newRole: undefined
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'activate' | 'suspend' | null>(null)
  const [bulkReason, setBulkReason] = useState('')

  // Traducciones
  const t = useTranslations('admin.users')
  const tCommon = useTranslations('common')
  const tRoles = useTranslations('admin.users.roles')
  const tStatus = useTranslations('admin.users.status')
  const tActions = useTranslations('admin.users.actions')

  // Store
  const { 
    users,
    userFilters,
    dashboardStats,
    selectedUser,
    fetchUsers,
    updateUserStatus,
    promoteUser,
    resetUserPassword,
    setUserFilters,
    setSelectedUser,
    isLoading: storeLoading,
    error
  } = useAdminStore()

  // Cargar usuarios al montar el componente
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true)
      try {
        await fetchUsers()
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [fetchUsers])

  // Filtrar y paginar usuarios
  const filteredUsers = useMemo(() => {
    let filtered = users || []

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      )
    }

    // Filtros del store
    if (userFilters.role !== 'ALL') {
      filtered = filtered.filter(user => user.role === userFilters.role)
    }

    if (userFilters.status !== 'ALL') {
      filtered = filtered.filter(user => user.status === userFilters.status)
    }

    return filtered
  }, [users, searchQuery, userFilters])

  // Paginación
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredUsers.slice(startIndex, endIndex)
  }, [filteredUsers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  // Manejar selección de usuarios
  const handleSelectUser = useCallback((userId: string, selected: boolean) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(userId)
      } else {
        newSet.delete(userId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedUsers(new Set(paginatedUsers.map(user => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }, [paginatedUsers])

  // Manejar acciones de usuario
  const handleUserAction = async () => {
    const { action, user, reason, newRole } = userAction
    if (!action || !user) return

    setIsLoading(true)
    try {
      let result
      
      switch (action) {
        case 'promote':
        case 'demote':
          if (!newRole) throw new Error('Role requerido')
          result = await promoteUser(user.id, newRole)
          break
          
        case 'activate':
          result = await updateUserStatus(user.id, UserStatus.ACTIVE, reason)
          break
          
        case 'suspend':
          result = await updateUserStatus(user.id, UserStatus.SUSPENDED, reason)
          break
          
        case 'reset_password':
          result = await resetUserPassword(user.id)
          break
          
        default:
          throw new Error('Acción no válida')
      }

      if (result.success) {
        // Limpiar estado de acción
        setUserAction({
          action: null,
          user: null,
          reason: '',
          newRole: undefined
        })
        setShowUserModal(false)
        
        // Recargar usuarios
        await fetchUsers()
      }
    } catch (error) {
      console.error('Error in user action:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar acciones en lote
  const handleBulkAction = async () => {
    if (selectedUsers.size === 0 || !bulkAction) return

    setIsLoading(true)
    try {
      const promises = Array.from(selectedUsers).map(userId => {
        const status = bulkAction === 'activate' ? UserStatus.ACTIVE : UserStatus.SUSPENDED
        return updateUserStatus(userId, status, bulkReason)
      })

      await Promise.all(promises)
      setSelectedUsers(new Set())
      setBulkAction(null)
      setBulkReason('')
      setShowBulkModal(false)
      await fetchUsers()
    } catch (error) {
      console.error('Error in bulk action:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener badge de estado
  const getStatusBadge = (status: UserStatus) => {
    const configs = {
      [UserStatus.ACTIVE]: {
        className: 'bg-green-500 text-white border-2 border-black',
        text: tStatus('active')
      },
      [UserStatus.INACTIVE]: {
        className: 'bg-gray-500 text-white border-2 border-black',
        text: tStatus('inactive')
      },
      [UserStatus.SUSPENDED]: {
        className: 'bg-red-500 text-white border-2 border-black',
        text: tStatus('suspended')
      }
    }

    const config = configs[status] || configs[UserStatus.INACTIVE]
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded ${config.className}`}>
        {config.text}
      </span>
    )
  }

  // Obtener badge de rol
  const getRoleBadge = (role: UserRole, isBoth: boolean) => {
    if (isBoth) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded bg-purple-500 text-white border-2 border-black">
          {tRoles('multi')}
        </span>
      )
    }

    const configs = {
      [UserRole.BUYER]: {
        className: 'bg-blue-500 text-white border-2 border-black',
        text: tRoles('buyer')
      },
      [UserRole.SELLER]: {
        className: 'bg-orange-500 text-black border-2 border-black',
        text: tRoles('seller')
      },
      [UserRole.ADMIN]: {
        className: 'bg-red-500 text-white border-2 border-black',
        text: tRoles('admin')
      }
    }

    const config = configs[role]
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded ${config.className}`}>
        {config.text}
      </span>
    )
  }

  // Obtener estadísticas de usuario
  const getUserStats = (user: User) => {
    // En una implementación real, estos datos vendrían del backend
    return {
      orders: Math.floor(Math.random() * 50),
      products: user.role === UserRole.SELLER || user.isBoth ? Math.floor(Math.random() * 20) : 0,
      reviews: Math.floor(Math.random() * 30),
      revenue: user.role === UserRole.SELLER || user.isBoth ? Math.floor(Math.random() * 5000) : 0
    }
  }

  const openUserAction = (action: UserAction, user: User, newRole?: UserRole) => {
    setUserAction({
      action,
      user,
      reason: '',
      newRole
    })
    setShowUserModal(true)
  }

  const openBulkAction = (action: 'activate' | 'suspend') => {
    setBulkAction(action)
    setBulkReason('')
    setShowBulkModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">{t('title')}</h1>
          <p className="text-gray-600 font-bold">
            {t('summary', { 
              total: filteredUsers.length, 
              selected: selectedUsers.size 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => fetchUsers()}
            disabled={isLoading}
            variant="outline"
            className="border-2 border-black"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {tCommon('refresh')}
          </Button>
          
          <Button
            onClick={() => {/* Implementar export */}}
            variant="outline"
            className="border-2 border-black"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.total_users')}</p>
                <p className="text-2xl font-black">{dashboardStats?.totalUsers || users?.length || 0}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.active_users')}</p>
                <p className="text-2xl font-black">
                  {users?.filter(u => u.status === UserStatus.ACTIVE).length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.suspended_users')}</p>
                <p className="text-2xl font-black">
                  {users?.filter(u => u.status === UserStatus.SUSPENDED).length || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">{t('stats.sellers')}</p>
                <p className="text-2xl font-black">
                  {users?.filter(u => u.role === UserRole.SELLER || u.isBoth).length || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-black">
            <Filter className="h-5 w-5" />
            {t('filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-bold mb-2">{t('filters.search_label')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('filters.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-2 border-black"
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-bold mb-2">{t('filters.role_label')}</label>
              <select 
                value={userFilters.role} 
                onChange={(e) => setUserFilters({ role: e.target.value as UserRole | 'ALL' })}
                className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">{t('filters.all_roles')}</option>
                <option value={UserRole.BUYER}>{tRoles('buyers')}</option>
                <option value={UserRole.SELLER}>{tRoles('sellers')}</option>
                <option value={UserRole.ADMIN}>{tRoles('admins')}</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-bold mb-2">{t('filters.status_label')}</label>
              <select 
                value={userFilters.status} 
                onChange={(e) => setUserFilters({ status: e.target.value as UserStatus | 'ALL' })}
                className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">{t('filters.all_statuses')}</option>
                <option value={UserStatus.ACTIVE}>{tStatus('active')}</option>
                <option value={UserStatus.INACTIVE}>{tStatus('inactive')}</option>
                <option value={UserStatus.SUSPENDED}>{tStatus('suspended')}</option>
              </select>
            </div>
          </div>

          {/* Acciones en lote */}
          {selectedUsers.size > 0 && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="font-bold text-blue-800">
                  {t('bulk.selected_count', { count: selectedUsers.size })}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => openBulkAction('activate')}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white border-2 border-black"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {tActions('activate')}
                  </Button>
                  <Button
                    onClick={() => openBulkAction('suspend')}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white border-2 border-black"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    {tActions('suspend')}
                  </Button>
                  <Button
                    onClick={() => setSelectedUsers(new Set())}
                    size="sm"
                    variant="outline"
                    className="border-2 border-black"
                  >
                    {tActions('clear')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-black">
            <UsersIcon className="h-5 w-5" />
            {t('table.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !users ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-lg font-bold text-gray-600">{t('table.loading')}</p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-gray-600 mb-2">{t('table.no_users')}</h3>
              <p className="text-gray-500">{t('table.no_users_desc')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left p-3 font-black text-black">
                        <Checkbox
                          checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left p-3 font-black text-black">{t('table.headers.user')}</th>
                      <th className="text-left p-3 font-black text-black">{t('table.headers.role')}</th>
                      <th className="text-left p-3 font-black text-black">{t('table.headers.status')}</th>
                      <th className="text-left p-3 font-black text-black">{t('table.headers.activity')}</th>
                      <th className="text-left p-3 font-black text-black">{t('table.headers.stats')}</th>
                      <th className="text-left p-3 font-black text-black">{t('table.headers.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => {
                      const stats = getUserStats(user)
                      const isSelected = selectedUsers.has(user.id)
                      
                      return (
                        <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleSelectUser(user.id, checked as boolean)
                              }
                            />
                          </td>
                          
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-500 border-2 border-black rounded-full flex items-center justify-center">
                                <span className="text-xs font-black text-white">
                                  {user.firstName[0]}{user.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-black">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-600 font-medium">
                                  {user.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t('table.user_id')}: {user.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          
                          <td className="p-3">
                            {getRoleBadge(user.role, user.isBoth)}
                          </td>
                          
                          <td className="p-3">
                            <div className="space-y-1">
                              {getStatusBadge(user.status)}
                              {user.emailVerified && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-xs text-green-600 font-bold">
                                    {t('table.email_verified')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="p-3">
                            <div className="text-sm space-y-1">
                              <p className="font-bold">
                                {t('table.last_login')}: {' '}
                                <span className="text-gray-600">
                                  {user.lastLoginAt 
                                    ? new Date(user.lastLoginAt).toLocaleDateString()
                                    : t('table.never')
                                  }
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">
                                {t('table.registered')}: {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          
                          <td className="p-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3 text-blue-500" />
                                <span>{stats.orders}</span>
                              </div>
                              {(user.role === UserRole.SELLER || user.isBoth) && (
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3 text-orange-500" />
                                  <span>{stats.products}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span>{stats.reviews}</span>
                              </div>
                              {(user.role === UserRole.SELLER || user.isBoth) && stats.revenue > 0 && (
                                <div className="flex items-center gap-1 text-green-600 font-bold">
                                  <span>${stats.revenue}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => openUserAction('view_details', user)}
                                size="sm"
                                variant="outline"
                                className="border-2 border-black"
                                title={tActions('view_details')}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              {user.status === UserStatus.SUSPENDED ? (
                                <Button
                                  onClick={() => openUserAction('activate', user)}
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600 text-white border-2 border-black"
                                  title={tActions('activate')}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => openUserAction('suspend', user)}
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600 text-white border-2 border-black"
                                  title={tActions('suspend')}
                                >
                                  <Ban className="h-3 w-3" />
                                </Button>
                              )}

                              {user.role !== UserRole.ADMIN && (
                                <Button
                                  onClick={() => openUserAction(
                                    user.role === UserRole.BUYER ? 'promote' : 'demote', 
                                    user,
                                    user.role === UserRole.BUYER ? UserRole.SELLER : UserRole.BUYER
                                  )}
                                  size="sm"
                                  variant="outline"
                                  className="border-2 border-black"
                                  title={user.role === UserRole.BUYER ? tActions('promote') : tActions('demote')}
                                >
                                  {user.role === UserRole.BUYER ? <Crown className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-black">
                  <p className="text-sm font-bold text-gray-600">
                    {t('pagination.showing', {
                      start: ((currentPage - 1) * itemsPerPage) + 1,
                      end: Math.min(currentPage * itemsPerPage, filteredUsers.length),
                      total: filteredUsers.length
                    })}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="border-2 border-black"
                    >
                      {t('pagination.previous')}
                    </Button>
                    
                    <span className="px-3 py-1 bg-orange-500 text-black border-2 border-black font-black rounded">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="border-2 border-black"
                    >
                      {t('pagination.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de acción de usuario */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={
          userAction.action === 'view_details' ? t('modals.user_details') :
          userAction.action === 'promote' ? t('modals.promote_user') :
          userAction.action === 'demote' ? t('modals.demote_user') :
          userAction.action === 'activate' ? t('modals.activate_user') :
          userAction.action === 'suspend' ? t('modals.suspend_user') :
          userAction.action === 'reset_password' ? t('modals.reset_password') : 
          t('modals.user_action')
        }
      >
        <div className="space-y-4">
          {userAction.user && (
            <>
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-500 border-2 border-black rounded-full flex items-center justify-center">
                    <span className="text-sm font-black text-white">
                      {userAction.user.firstName[0]}{userAction.user.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-lg">
                      {userAction.user.firstName} {userAction.user.lastName}
                    </h3>
                    <p className="text-gray-600 font-medium">{userAction.user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleBadge(userAction.user.role, userAction.user.isBoth)}
                      {getStatusBadge(userAction.user.status)}
                    </div>
                  </div>
                </div>
              </div>

              {userAction.action === 'view_details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.user_id')}</label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded border">{userAction.user.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.registration')}</label>
                      <p className="text-sm bg-gray-100 p-2 rounded border">
                        {new Date(userAction.user.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.last_login')}</label>
                      <p className="text-sm bg-gray-100 p-2 rounded border">
                        {userAction.user.lastLoginAt 
                          ? new Date(userAction.user.lastLoginAt).toLocaleString()
                          : t('table.never')
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('details.email_verified')}</label>
                      <p className="text-sm bg-gray-100 p-2 rounded border">
                        {userAction.user.emailVerified ? (
                          <span className="text-green-600 font-bold">✓ {t('details.verified')}</span>
                        ) : (
                          <span className="text-red-600 font-bold">✗ {t('details.not_verified')}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Estadísticas del usuario */}
                  <div className="space-y-2">
                    <h4 className="font-black text-gray-800">{t('details.statistics')}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {(() => {
                        const stats = getUserStats(userAction.user)
                        return (
                          <>
                            <div className="bg-blue-50 p-3 rounded border-2 border-blue-200">
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-blue-600" />
                                <span className="font-bold">{t('details.orders')}: {stats.orders}</span>
                              </div>
                            </div>
                            {(userAction.user.role === UserRole.SELLER || userAction.user.isBoth) && (
                              <div className="bg-orange-50 p-3 rounded border-2 border-orange-200">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-orange-600" />
                                  <span className="font-bold">{t('details.products')}: {stats.products}</span>
                                </div>
                              </div>
                            )}
                            <div className="bg-yellow-50 p-3 rounded border-2 border-yellow-200">
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-600" />
                                <span className="font-bold">{t('details.reviews')}: {stats.reviews}</span>
                              </div>
                            </div>
                            {(userAction.user.role === UserRole.SELLER || userAction.user.isBoth) && stats.revenue > 0 && (
                              <div className="bg-green-50 p-3 rounded border-2 border-green-200">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600 font-bold">{t('details.revenue')}: ${stats.revenue}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {userAction.action !== 'view_details' && userAction.action !== 'reset_password' && (
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    {t('forms.reason_label')} {userAction.action !== 'promote' && userAction.action !== 'demote' && '*'}
                  </label>
                  <textarea
                    value={userAction.reason}
                    onChange={(e) => setUserAction(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder={
                      userAction.action === 'promote' ? t('forms.promote_reason_placeholder') :
                      userAction.action === 'demote' ? t('forms.demote_reason_placeholder') :
                      userAction.action === 'activate' ? t('forms.activate_reason_placeholder') :
                      t('forms.suspend_reason_placeholder')
                    }
                    className="w-full px-3 py-2 border-2 border-black rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    required={userAction.action === 'suspend' || userAction.action === 'activate'}
                  />
                </div>
              )}

              {userAction.action === 'reset_password' && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-bold text-yellow-800">{t('forms.confirm_reset_password')}</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    {t('forms.reset_password_description')}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => setShowUserModal(false)}
                  variant="outline"
                  className="border-2 border-black"
                >
                  {tCommon('cancel')}
                </Button>
                
                {userAction.action !== 'view_details' && (
                  <Button
                    onClick={handleUserAction}
                    disabled={isLoading || ((userAction.action === 'suspend' || userAction.action === 'activate') && !userAction.reason.trim())}
                    className={
                      userAction.action === 'activate' ? 'bg-green-500 hover:bg-green-600 text-white border-2 border-black' :
                      userAction.action === 'suspend' ? 'bg-red-500 hover:bg-red-600 text-white border-2 border-black' :
                      userAction.action === 'promote' ? 'bg-blue-500 hover:bg-blue-600 text-white border-2 border-black' :
                      userAction.action === 'demote' ? 'bg-orange-500 hover:bg-orange-600 text-black border-2 border-black' :
                      'bg-gray-500 hover:bg-gray-600 text-white border-2 border-black'
                    }
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('forms.processing')}
                      </>
                    ) : (
                      <>
                        {userAction.action === 'activate' && <CheckCircle className="h-4 w-4 mr-2" />}
                        {userAction.action === 'suspend' && <Ban className="h-4 w-4 mr-2" />}
                        {userAction.action === 'promote' && <Crown className="h-4 w-4 mr-2" />}
                        {userAction.action === 'demote' && <UserX className="h-4 w-4 mr-2" />}
                        {userAction.action === 'reset_password' && <Settings className="h-4 w-4 mr-2" />}
                        
                        {userAction.action === 'activate' ? t('forms.activate_user') :
                         userAction.action === 'suspend' ? t('forms.suspend_user') :
                         userAction.action === 'promote' ? t('forms.promote_to', { role: userAction.newRole }) :
                         userAction.action === 'demote' ? t('forms.demote_to', { role: userAction.newRole }) :
                         userAction.action === 'reset_password' ? t('forms.reset_password') : 
                         tCommon('confirm')
                        }
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal de acciones en lote */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={t('bulk.modal_title', { action: bulkAction === 'activate' ? t('bulk.activate') : t('bulk.suspend') })}
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-blue-800">
                {t('bulk.selected_users', { count: selectedUsers.size })}
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {t('bulk.action_description')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">
              {t('bulk.reason_label', { action: bulkAction === 'activate' ? t('bulk.activate') : t('bulk.suspend') })} *
            </label>
            <textarea
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder={t('bulk.reason_placeholder', { action: bulkAction === 'activate' ? t('bulk.activate') : t('bulk.suspend') })}
              className="w-full px-3 py-2 border-2 border-black rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={() => setShowBulkModal(false)}
              variant="outline"
              className="border-2 border-black"
            >
              {tCommon('cancel')}
            </Button>
            
            <Button
              onClick={handleBulkAction}
              disabled={isLoading || !bulkReason.trim()}
              className={
                bulkAction === 'activate' 
                  ? 'bg-green-500 hover:bg-green-600 text-white border-2 border-black'
                  : 'bg-red-500 hover:bg-red-600 text-white border-2 border-black'
              }
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('forms.processing')}
                </>
              ) : (
                <>
                  {bulkAction === 'activate' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Ban className="h-4 w-4 mr-2" />
                  )}
                  {t('bulk.confirm_action', { 
                    action: bulkAction === 'activate' ? t('bulk.activate') : t('bulk.suspend'),
                    count: selectedUsers.size 
                  })}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}