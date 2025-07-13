'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  User,
  Store,
  Globe,
  Phone,
  Mail,
  MapPin,
  Camera,
  Save,
  Eye,
  CheckCircle,
  AlertCircle,
  Star,
  Package,
  TrendingUp,
  Edit,
  X,
  Image as ImageIcon,
} from 'lucide-react'

import { useAuthStore } from '@/lib/stores/auth-store'
import { useSellerStore } from '@/lib/stores/seller-store'
import type { SellerProfile } from '@/types'

// Función para generar slug desde el nombre de tienda
const generateSlug = (storeName: string): string => {
  return storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function SellerProfilePage() {
  const { user, updateUser } = useAuthStore()
  const { 
    sellerProfile, 
    isProfileLoading, 
    loadSellerProfile, 
    updateSellerProfile 
  } = useSellerStore()

  // Estado del formulario
  const [formData, setFormData] = useState({
    id: '',
    storeName: '',
    slug: '',
    description: '',
    website: '',
    phone: '',
    avatar: '',
    banner: '',
    rating: 0,
    totalSales: 0,
    totalReviews: 0,
    isVerified: false,
    createdAt: '',
    updatedAt: ''
  })

  // Estado de UI
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [bannerPreview, setBannerPreview] = useState<string>('')

  // Cargar datos del perfil
  useEffect(() => {
    loadSellerProfile()
  }, [loadSellerProfile])

  // Actualizar formulario cuando cambie el perfil
  useEffect(() => {
    if (sellerProfile) {
      setFormData({
        id: sellerProfile.id,
        storeName: sellerProfile.storeName || '',
        slug: sellerProfile.slug || '',
        description: sellerProfile.description || '',
        website: sellerProfile.website || '',
        phone: sellerProfile.phone || '',
        avatar: sellerProfile.avatar || '',
        banner: sellerProfile.banner || '',
        rating: sellerProfile.rating || 0,
        totalSales: sellerProfile.totalSales || 0,
        totalReviews: sellerProfile.totalReviews || 0,
        isVerified: sellerProfile.isVerified || false,
        createdAt: sellerProfile.createdAt || '',
        updatedAt: sellerProfile.updatedAt || ''
      })
      setAvatarPreview(sellerProfile.avatar || '')
      setBannerPreview(sellerProfile.banner || '')
    }
  }, [sellerProfile])

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'El nombre de la tienda es requerido'
    } else if (formData.storeName.length < 3) {
      newErrors.storeName = 'El nombre debe tener al menos 3 caracteres'
    } else if (formData.storeName.length > 50) {
      newErrors.storeName = 'El nombre no puede exceder 50 caracteres'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido'
    } else if (formData.slug.length < 3) {
      newErrors.slug = 'El slug debe tener al menos 3 caracteres'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'El slug solo puede contener letras minúsculas, números y guiones'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres'
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'La URL debe comenzar con http:// o https://'
    }

    if (formData.phone && !formData.phone.match(/^[\+]?[0-9\s\-\(\)]{8,20}$/)) {
      newErrors.phone = 'El teléfono debe ser válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejadores de cambio
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generar slug cuando cambie el nombre de tienda
    if (field === 'storeName') {
      const newSlug = generateSlug(value)
      setFormData(prev => ({ ...prev, slug: newSlug }))
    }
    
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Manejo de imágenes (simulado - en producción sería upload real)
  const handleImageChange = (type: 'avatar' | 'banner', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          [type]: 'La imagen no puede exceder 5MB' 
        }))
        return
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ 
          ...prev, 
          [type]: 'Solo se permiten archivos de imagen' 
        }))
        return
      }

      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (type === 'avatar') {
          setAvatarPreview(result)
          setFormData(prev => ({ ...prev, avatar: result }))
        } else {
          setBannerPreview(result)
          setFormData(prev => ({ ...prev, banner: result }))
        }
        setErrors(prev => ({ ...prev, [type]: '' }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateSellerProfile(formData)
      
      if (result.success) {
        setIsEditing(false)
        // Actualizar también el user en auth store si es necesario
        if (user) {
          updateUser({
            ...user,
            sellerProfile: formData as SellerProfile
          })
        }
      } else {
        setErrors(prev => ({ 
          ...prev, 
          submit: result.error || 'Error al actualizar el perfil' 
        }))
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setErrors(prev => ({ 
        ...prev, 
        submit: 'Error de conexión' 
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancelar edición
  const handleCancel = () => {
    if (sellerProfile) {
      setFormData({
        id: sellerProfile.id,
        storeName: sellerProfile.storeName || '',
        slug: sellerProfile.slug || '',
        description: sellerProfile.description || '',
        website: sellerProfile.website || '',
        phone: sellerProfile.phone || '',
        avatar: sellerProfile.avatar || '',
        banner: sellerProfile.banner || '',
        rating: sellerProfile.rating || 0,
        totalSales: sellerProfile.totalSales || 0,
        totalReviews: sellerProfile.totalReviews || 0,
        isVerified: sellerProfile.isVerified || false,
        createdAt: sellerProfile.createdAt || '',
        updatedAt: sellerProfile.updatedAt || ''
      })
      setAvatarPreview(sellerProfile.avatar || '')
      setBannerPreview(sellerProfile.banner || '')
    }
    setIsEditing(false)
    setErrors({})
  }

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase text-black">Perfil de Tienda</h1>
            <p className="text-gray-600 font-bold">
              Gestiona la información pública de tu tienda
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-3 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <Edit className="h-5 w-5" />
              EDITAR PERFIL
            </button>
          )}
        </div>
      </div>

      {/* ERROR GENERAL */}
      {errors.submit && (
        <div className="bg-red-100 border-[3px] border-red-500 p-4" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <span className="font-bold text-red-800">{errors.submit}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INFORMACIÓN DEL PERFIL */}
        <div className="lg:col-span-2 space-y-6">
          {/* INFORMACIÓN BÁSICA */}
          <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
            <div className="flex items-center gap-3 mb-6">
              <Store className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black uppercase text-black">Información Básica</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre de la tienda */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  NOMBRE DE LA TIENDA *
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => handleInputChange('storeName', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 ${
                    !isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${errors.storeName ? 'border-red-500 bg-red-50' : ''}`}
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  maxLength={50}
                />
                <div className="flex justify-between mt-1">
                  {errors.storeName && <span className="text-sm text-red-600 font-bold">{errors.storeName}</span>}
                  <span className="text-sm text-gray-500 font-bold">{formData.storeName.length}/50</span>
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  URL DE LA TIENDA *
                </label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border-2 border-black border-r-0 px-3 py-3 font-bold text-sm text-gray-600">
                    furnibles.com/tienda/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
                    disabled={!isEditing}
                    className={`flex-1 p-3 border-2 border-black border-l-0 font-bold focus:outline-none focus:bg-yellow-400 ${
                      !isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                    } ${errors.slug ? 'border-red-500 bg-red-50' : ''}`}
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                    placeholder="mi-tienda"
                  />
                </div>
                {errors.slug && <span className="text-sm text-red-600 font-bold">{errors.slug}</span>}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  DESCRIPCIÓN DE LA TIENDA
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className={`w-full p-3 border-2 border-black font-bold resize-none focus:outline-none focus:bg-yellow-400 ${
                    !isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${errors.description ? 'border-red-500 bg-red-50' : ''}`}
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  placeholder="Describe tu tienda, especialidades, experiencia..."
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  {errors.description && <span className="text-sm text-red-600 font-bold">{errors.description}</span>}
                  <span className="text-sm text-gray-500 font-bold">{formData.description.length}/500</span>
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  SITIO WEB
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 ${
                    !isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${errors.website ? 'border-red-500 bg-red-50' : ''}`}
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  placeholder="https://mi-sitio-web.com"
                />
                {errors.website && <span className="text-sm text-red-600 font-bold">{errors.website}</span>}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  TELÉFONO DE CONTACTO
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 ${
                    !isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${errors.phone ? 'border-red-500 bg-red-50' : ''}`}
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && <span className="text-sm text-red-600 font-bold">{errors.phone}</span>}
              </div>

              {/* Botones de acción */}
              {isEditing && (
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all disabled:opacity-50"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                        GUARDANDO...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        GUARDAR CAMBIOS
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-500 border-2 border-black font-bold text-white hover:bg-gray-400 transition-all"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                  >
                    <X className="h-5 w-5" />
                    CANCELAR
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* IMÁGENES DE LA TIENDA */}
          <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
            <div className="flex items-center gap-3 mb-6">
              <Camera className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black uppercase text-black">Imágenes de la Tienda</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  LOGO/AVATAR DE LA TIENDA
                </label>
                <div className="border-2 border-dashed border-black p-6 text-center hover:bg-gray-50 transition-colors">
                  {avatarPreview ? (
                    <div className="relative">
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        width={120}
                        height={120}
                        className="w-30 h-30 object-cover mx-auto border-2 border-black"
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarPreview('')
                            setFormData(prev => ({ ...prev, avatar: '' }))
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-2 border-black text-white font-bold flex items-center justify-center hover:bg-red-400"
                          style={{ boxShadow: '2px 2px 0 #000000' }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="font-bold text-black">Sin logo</p>
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="mt-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('avatar', e)}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label 
                        htmlFor="avatar-upload" 
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <Camera className="h-4 w-4" />
                        CAMBIAR LOGO
                      </label>
                    </div>
                  )}
                </div>
                {errors.avatar && <span className="text-sm text-red-600 font-bold">{errors.avatar}</span>}
              </div>

              {/* Banner */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  BANNER DE LA TIENDA
                </label>
                <div className="border-2 border-dashed border-black p-6 text-center hover:bg-gray-50 transition-colors">
                  {bannerPreview ? (
                    <div className="relative">
                      <Image
                        src={bannerPreview}
                        alt="Banner preview"
                        width={240}
                        height={120}
                        className="w-full h-30 object-cover border-2 border-black"
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setBannerPreview('')
                            setFormData(prev => ({ ...prev, banner: '' }))
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-2 border-black text-white font-bold flex items-center justify-center hover:bg-red-400"
                          style={{ boxShadow: '2px 2px 0 #000000' }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="font-bold text-black">Sin banner</p>
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="mt-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('banner', e)}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label 
                        htmlFor="banner-upload" 
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <Camera className="h-4 w-4" />
                        CAMBIAR BANNER
                      </label>
                    </div>
                  )}
                </div>
                {errors.banner && <span className="text-sm text-red-600 font-bold">{errors.banner}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR - ESTADÍSTICAS Y ESTADO */}
        <div className="space-y-6">
          {/* ESTADO DE VERIFICACIÓN */}
          <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
            <div className="flex items-center gap-3 mb-4">
              {sellerProfile?.isVerified ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              )}
              <h3 className="text-lg font-black uppercase text-black">Estado</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-600 text-sm">Verificación:</span>
                <span className={`px-2 py-1 border-2 border-black text-xs font-black ${
                  sellerProfile?.isVerified 
                    ? 'bg-green-500 text-white' 
                    : 'bg-yellow-500 text-black'
                }`}>
                  {sellerProfile?.isVerified ? 'VERIFICADO' : 'PENDIENTE'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-600 text-sm">Email:</span>
                <span className={`px-2 py-1 border-2 border-black text-xs font-black ${
                  user?.emailVerified 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {user?.emailVerified ? 'VERIFICADO' : 'NO VERIFICADO'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-600 text-sm">Cuenta:</span>
                <span className={`px-2 py-1 border-2 border-black text-xs font-black ${
                  user?.isActive 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {user?.isActive ? 'ACTIVA' : 'INACTIVA'}
                </span>
              </div>
            </div>

            {!sellerProfile?.isVerified && (
              <div className="mt-4 p-3 bg-yellow-50 border-2 border-yellow-300">
                <p className="text-yellow-800 font-bold text-xs">
                  Para verificar tu tienda, completa toda la información del perfil 
                  y sube al menos 3 productos de calidad.
                </p>
              </div>
            )}
          </div>

          {/* ESTADÍSTICAS DE LA TIENDA */}
          <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-black uppercase text-black">Estadísticas</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold text-gray-600 text-sm">Rating:</span>
                </div>
                <span className="font-black text-black">
                  {sellerProfile?.rating ? sellerProfile.rating.toFixed(1) : '0.0'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="font-bold text-gray-600 text-sm">Ventas:</span>
                </div>
                <span className="font-black text-black">
                  {sellerProfile?.totalSales || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-500" />
                  <span className="font-bold text-gray-600 text-sm">Miembro desde:</span>
                </div>
                <span className="font-black text-black text-xs">
                  {user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* VISTA PREVIA PÚBLICA */}
          <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-black uppercase text-black">Vista Previa</h3>
            </div>
            
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all">
              <Globe className="h-5 w-5" />
              VER TIENDA PÚBLICA
            </button>
            
            <p className="text-xs text-gray-600 font-bold mt-2 text-center">
              Así verán tu tienda los compradores
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}