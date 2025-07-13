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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

  const t = useTranslations('admin')

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
  const handleBulkAction = async (action: 'activate' | 'suspend', reason: string) => {
    if (selectedUsers.size === 0) return

    setIsLoading(true)
    try {
      const promises = Array.from(selectedUsers).map(userId => {
        const status = action === 'activate' ? UserStatus.ACTIVE : UserStatus.SUSPENDED
        return updateUserStatus(userId, status, reason)
      })

      await Promise.all(promises)
      setSelectedUsers(new Set())
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
        variant: 'secondary' as const,
        className: 'bg-green-500 text-white border-2 border-black',
        text: 'ACTIVO'
      },
      [UserStatus.INACTIVE]: {
        variant: 'outline' as const,
        className: 'border-2 border-black',
        text: 'INACTIVO'
      },
      [UserStatus.SUSPENDED]: {
        variant: 'destructive' as const,
        className: 'bg-red-500 text-white border-2 border-black',
        text: 'SUSPENDIDO'
      }
    }

    const config = configs[status] || configs[UserStatus.INACTIVE]
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    )
  }

  // Obtener badge de rol
  const getRoleBadge = (role: UserRole, isBoth: boolean) => {
    if (isBoth) {
      return (
        <div className="flex gap-1">
          <Badge className="bg-purple-500 text-white border-2 border-black text-xs">
            MULTI
          </Badge>
        </div>
      )
    }

    const configs = {
      [UserRole.BUYER]: {
        className: 'bg-blue-500 text-white border-2 border-black',
        text: 'BUYER'
      },
      [UserRole.SELLER]: {
        className: 'bg-orange-500 text-black border-2 border-black',
        text: 'SELLER'
      },
      [UserRole.ADMIN]: {
        className: 'bg-red-500 text-white border-2 border-black',
        text: 'ADMIN'
      }
    }

    const config = configs[role]
    
    return (
      <Badge className={config.className}>
        {config.text}
      </Badge>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">Gestión de Usuarios</h1>
          <p className="text-gray-600 font-bold">
            {filteredUsers.length} usuarios • {selectedUsers.size} seleccionados
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
            ACTUALIZAR
          </Button>
          
          <Button
            onClick={() => {/* Implementar export */}}
            variant="outline"
            className="border-2 border-black"
          >
            <Download className="h-4 w-4 mr-2" />
            EXPORTAR
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">Total Usuarios</p>
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
                <p className="text-sm font-bold text-gray-600 uppercase">Usuarios Activos</p>
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
                <p className="text-sm font-bold text-gray-600 uppercase">Suspendidos</p>
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
                <p className="text-sm font-bold text-gray-600 uppercase">Vendedores</p>
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
            FILTROS Y BÚSQUEDA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-bold mb-2">Buscar usuarios</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-2 border-black"
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-bold mb-2">Rol</label>
              <Select 
                value={userFilters.role} 
                onValueChange={(value) => setUserFilters({ role: value as UserRole | 'ALL' })}
              >
                <SelectTrigger className="border-2 border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los roles</SelectItem>
                  <SelectItem value={UserRole.BUYER}>Compradores</SelectItem>
                  <SelectItem value={UserRole.SELLER}>Vendedores</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Administradores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-bold mb-2">Estado</label>
              <Select 
                value={userFilters.status} 
                onValueChange={(value) => setUserFilters({ status: value as UserStatus | 'ALL' })}
              >
                <SelectTrigger className="border-2 border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  <SelectItem value={UserStatus.ACTIVE}>Activos</SelectItem>
                  <SelectItem value={UserStatus.INACTIVE}>Inactivos</SelectItem>
                  <SelectItem value={UserStatus.SUSPENDED}>Suspendidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Acciones en lote */}
          {selectedUsers.size > 0 && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="font-bold text-blue-800">
                  {selectedUsers.size} usuario(s) seleccionado(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBulkAction('activate', 'Activación en lote desde panel admin')}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white border-2 border-black"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Activar
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('suspend', 'Suspensión en lote desde panel admin')}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white border-2 border-black"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Suspender
                  </Button>
                  <Button
                    onClick={() => setSelectedUsers(new Set())}
                    size="sm"
                    variant="outline"
                    className="border-2 border-black"
                  >
                    Limpiar
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
            LISTA DE USUARIOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !users ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-lg font-bold text-gray-600">Cargando usuarios...</p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-gray-600 mb-2">No se encontraron usuarios</h3>
              <p className="text-gray-500">Ajusta los filtros para ver más resultados</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-black">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-black text-black">USUARIO</TableHead>
                    <TableHead className="font-black text-black">ROL</TableHead>
                    <TableHead className="font-black text-black">ESTADO</TableHead>
                    <TableHead className="font-black text-black">ACTIVIDAD</TableHead>
                    <TableHead className="font-black text-black">ESTADÍSTICAS</TableHead>
                    <TableHead className="font-black text-black w-16">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const stats = getUserStats(user)
                    const isSelected = selectedUsers.has(user.id)
                    
                    return (
                      <TableRow key={user.id} className="border-b border-gray-200">
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleSelectUser(user.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        
                        <TableCell>
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
                                ID: {user.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getRoleBadge(user.role, user.isBoth)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(user.status)}
                            {user.emailVerified && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-green-600 font-bold">
                                  Email verificado
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <p className="font-bold">
                              Último acceso: {' '}
                              <span className="text-gray-600">
                                {user.lastLoginAt 
                                  ? new Date(user.lastLoginAt).toLocaleDateString()
                                  : 'Nunca'
                                }
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Registrado: {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        
                        <TableCell>
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
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="border-2 border-black">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-2 border-black">
                              <DropdownMenuLabel className="font-black">
                                ACCIONES DE USUARIO
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => setUserAction({
                                  action: 'view_details',
                                  user,
                                  reason: ''
                                })}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              
                              {/* Cambios de estado */}
                              {user.status === UserStatus.SUSPENDED && (
                                <DropdownMenuItem
                                  onClick={() => setUserAction({
                                    action: 'activate',
                                    user,
                                    reason: ''
                                  })}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activar usuario
                                </DropdownMenuItem>
                              )}
                              
                              {user.status === UserStatus.ACTIVE && (
                                <DropdownMenuItem
                                  onClick={() => setUserAction({
                                    action: 'suspend',
                                    user,
                                    reason: ''
                                  })}
                                  className="text-red-600"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspender usuario
                                </DropdownMenuItem>
                              )}
                              
                              {/* Cambios de rol */}
                              {user.role !== UserRole.ADMIN && (
                                <>
                                  <DropdownMenuSeparator />
                                  {user.role === UserRole.BUYER && (
                                    <DropdownMenuItem
                                      onClick={() => setUserAction({
                                        action: 'promote',
                                        user,
                                        reason: '',
                                        newRole: UserRole.SELLER
                                      })}
                                    >
                                      <Crown className="h-4 w-4 mr-2" />
                                      Promover a Seller
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {user.role === UserRole.SELLER && (
                                    <DropdownMenuItem
                                      onClick={() => setUserAction({
                                        action: 'demote',
                                        user,
                                        reason: '',
                                        newRole: UserRole.BUYER
                                      })}
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Degradar a Buyer
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setUserAction({
                                  action: 'reset_password',
                                  user,
                                  reason: ''
                                })}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Reset password
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-black">
                  <p className="text-sm font-bold text-gray-600">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                    {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de{' '}
                    {filteredUsers.length} usuarios
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="border-2 border-black"
                    >
                      Anterior
                    </Button>
                    
                    <span className="px-3 py-1 bg-orange-500 text-black border-2 border-black font-black">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="border-2 border-black"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de acción de usuario */</div>