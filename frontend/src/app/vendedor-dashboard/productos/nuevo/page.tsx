'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Upload,
  X,
  Plus,
  Minus,
  Save,
  Eye,
  ArrowLeft,
  FileText,
  ImageIcon,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react'

import { useSellerStore } from '@/lib/stores/seller-store'
import { ProductCategory, Difficulty } from '@/types'
import type { ProductFormData } from '@/lib/stores/seller-store'

export default function NewProductPage() {
  const router = useRouter()
  const { createProduct } = useSellerStore()
  
  // Estado del formulario
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: 5.00,
    category: ProductCategory.TABLES,
    difficulty: Difficulty.INTERMEDIATE,
    tags: [],
    estimatedTime: '',
    toolsRequired: [],
    materials: [],
    dimensions: '',
    pdfFile: undefined,
    images: []
  })

  // Estado de UI
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentTag, setCurrentTag] = useState('')
  const [currentTool, setCurrentTool] = useState('')
  const [currentMaterial, setCurrentMaterial] = useState('')
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [pdfPreview, setPdfPreview] = useState<string>('')

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido'
    } else if (formData.title.length > 100) {
      newErrors.title = 'El título no puede exceder 100 caracteres'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    } else if (formData.description.length > 2000) {
      newErrors.description = 'La descripción no puede exceder 2000 caracteres'
    }

    if (formData.price < 1) {
      newErrors.price = 'El precio debe ser mayor a $1'
    } else if (formData.price > 1000) {
      newErrors.price = 'El precio no puede exceder $1000'
    }

    if (!formData.pdfFile) {
      newErrors.pdfFile = 'El archivo PDF es requerido'
    }

    if (!formData.images || formData.images.length === 0) {
      newErrors.images = 'Al menos una imagen es requerida'
    } else if (formData.images.length > 6) {
      newErrors.images = 'Máximo 6 imágenes permitidas'
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'Al menos un tag es requerido'
    }

    if (formData.toolsRequired.length === 0) {
      newErrors.toolsRequired = 'Al menos una herramienta es requerida'
    }

    if (formData.materials.length === 0) {
      newErrors.materials = 'Al menos un material es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejadores de cambio
  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Manejo de archivos PDF
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, pdfFile: 'Solo se permiten archivos PDF' }))
        return
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setErrors(prev => ({ ...prev, pdfFile: 'El archivo PDF no puede exceder 10MB' }))
        return
      }

      handleInputChange('pdfFile', file)
      setPdfPreview(file.name)
      setErrors(prev => ({ ...prev, pdfFile: '' }))
    }
  }

  // Manejo de imágenes
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validar cantidad
    if (files.length > 6) {
      setErrors(prev => ({ ...prev, images: 'Máximo 6 imágenes permitidas' }))
      return
    }

    // Validar tipos y tamaños
    const validFiles: File[] = []
    const previews: string[] = []

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, images: 'Solo se permiten archivos de imagen' }))
        return
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setErrors(prev => ({ ...prev, images: 'Cada imagen no puede exceder 5MB' }))
        return
      }

      validFiles.push(file)
      previews.push(URL.createObjectURL(file))
    })

    handleInputChange('images', validFiles)
    setPreviewImages(previews)
    setErrors(prev => ({ ...prev, images: '' }))
  }

  // Eliminar imagen
  const removeImage = (index: number) => {
    const newImages = formData.images?.filter((_, i) => i !== index) || []
    const newPreviews = previewImages.filter((_, i) => i !== index)
    
    handleInputChange('images', newImages)
    setPreviewImages(newPreviews)
  }

  // Manejo de arrays (tags, tools, materials)
  const addArrayItem = (field: 'tags' | 'toolsRequired' | 'materials', value: string) => {
    if (!value.trim()) return
    
    const currentArray = formData[field] || []
    if (!currentArray.includes(value.trim())) {
      handleInputChange(field, [...currentArray, value.trim()])
    }
  }

  const removeArrayItem = (field: 'tags' | 'toolsRequired' | 'materials', index: number) => {
    const currentArray = formData[field] || []
    handleInputChange(field, currentArray.filter((_, i) => i !== index))
  }

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault()
    
    if (!validateForm() && !saveAsDraft) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createProduct(formData)
      
      if (result.success) {
        router.push('/vendedor/productos')
      } else {
        setErrors(prev => ({ ...prev, submit: result.error || 'Error al crear el producto' }))
      }
    } catch (error) {
      console.error('Error creating product:', error)
      setErrors(prev => ({ ...prev, submit: 'Error de conexión' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/vendedor/productos"
              className="flex items-center gap-2 px-3 py-2 bg-gray-500 border-2 border-black font-bold text-white hover:bg-gray-400 transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              <ArrowLeft className="h-4 w-4" />
              VOLVER
            </Link>
            <div>
              <h1 className="text-2xl font-black uppercase text-black">Subir Nuevo Producto</h1>
              <p className="text-gray-600 font-bold">Completa la información de tu producto</p>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* ERROR GENERAL */}
        {errors.submit && (
          <div className="bg-red-100 border-[3px] border-red-500 p-4" style={{ boxShadow: '6px 6px 0 #000000' }}>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <span className="font-bold text-red-800">{errors.submit}</span>
            </div>
          </div>
        )}

        {/* INFORMACIÓN BÁSICA */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-2">
            <Info className="h-6 w-6" />
            Información Básica
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Título */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-black text-black mb-2">
                TÍTULO DEL PRODUCTO *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ej: Mesa de comedor moderna en roble"
                className={`w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 ${
                  errors.title ? 'border-red-500 bg-red-50' : ''
                }`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
                maxLength={100}
              />
              <div className="flex justify-between mt-1">
                {errors.title && <span className="text-sm text-red-600 font-bold">{errors.title}</span>}
                <span className="text-sm text-gray-500 font-bold">{formData.title.length}/100</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-black text-black mb-2">
                DESCRIPCIÓN *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe tu producto, sus características, qué incluye el plan, nivel de dificultad, etc."
                rows={6}
                className={`w-full p-3 border-2 border-black font-bold resize-none focus:outline-none focus:bg-yellow-400 ${
                  errors.description ? 'border-red-500 bg-red-50' : ''
                }`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
                maxLength={2000}
              />
              <div className="flex justify-between mt-1">
                {errors.description && <span className="text-sm text-red-600 font-bold">{errors.description}</span>}
                <span className="text-sm text-gray-500 font-bold">{formData.description.length}/2000</span>
              </div>
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                PRECIO (USD) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                min="1"
                max="1000"
                step="0.01"
                className={`w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400 ${
                  errors.price ? 'border-red-500 bg-red-50' : ''
                }`}
                style={{ boxShadow: '3px 3px 0 #000000' }}
              />
              {errors.price && <span className="text-sm text-red-600 font-bold">{errors.price}</span>}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                CATEGORÍA *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value as ProductCategory)}
                className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <option value={ProductCategory.TABLES}>Mesas</option>
                <option value={ProductCategory.CHAIRS}>Sillas</option>
                <option value={ProductCategory.BEDS}>Camas</option>
                <option value={ProductCategory.STORAGE}>Almacenamiento</option>
                <option value={ProductCategory.OUTDOOR}>Exterior</option>
                <option value={ProductCategory.DECORATIVE}>Decorativo</option>
              </select>
            </div>

            {/* Dificultad */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                DIFICULTAD *
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value as Difficulty)}
                className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <option value={Difficulty.BEGINNER}>Fácil - Principiante</option>
                <option value={Difficulty.INTERMEDIATE}>Intermedio - Algo de experiencia</option>
                <option value={Difficulty.ADVANCED}>Avanzado - Muy experimentado</option>
              </select>
            </div>

            {/* Tiempo estimado */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                TIEMPO ESTIMADO
              </label>
              <input
                type="text"
                value={formData.estimatedTime || ''}
                onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                placeholder="Ej: 2-3 días, 8 horas"
                className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
                maxLength={50}
              />
            </div>

            {/* Dimensiones */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                DIMENSIONES
              </label>
              <input
                type="text"
                value={formData.dimensions || ''}
                onChange={(e) => handleInputChange('dimensions', e.target.value)}
                placeholder="Ej: 120cm x 80cm x 75cm"
                className="w-full p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
                maxLength={100}
              />
            </div>
          </div>
        </div>

        {/* ARCHIVOS */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Archivos
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PDF */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                ARCHIVO PDF (PLANOS) *
              </label>
              <div className="border-2 border-dashed border-black p-6 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  {pdfPreview ? (
                    <div>
                      <p className="font-bold text-green-600">{pdfPreview}</p>
                      <p className="text-sm text-gray-500 font-bold">Click para cambiar</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-black">Subir archivo PDF</p>
                      <p className="text-sm text-gray-500 font-bold">Máximo 10MB</p>
                    </div>
                  )}
                </label>
              </div>
              {errors.pdfFile && <span className="text-sm text-red-600 font-bold">{errors.pdfFile}</span>}
            </div>

            {/* Imágenes */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                IMÁGENES DEL PRODUCTO *
              </label>
              <div className="border-2 border-dashed border-black p-6 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="hidden"
                  id="images-upload"
                />
                <label htmlFor="images-upload" className="cursor-pointer">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-black">Subir imágenes</p>
                  <p className="text-sm text-gray-500 font-bold">Máximo 6 imágenes, 5MB c/u</p>
                </label>
              </div>
              {errors.images && <span className="text-sm text-red-600 font-bold">{errors.images}</span>}

              {/* Preview de imágenes */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {previewImages.map((src, index) => (
                    <div key={index} className="relative border-2 border-black">
                      <Image
                        src={src}
                        alt={`Preview ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-24 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-2 border-black text-white font-bold flex items-center justify-center hover:bg-red-400"
                        style={{ boxShadow: '2px 2px 0 #000000' }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DETALLES TÉCNICOS */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <h2 className="text-xl font-black uppercase text-black mb-6 flex items-center gap-2">
            <CheckCircle className="h-6 w-6" />
            Detalles Técnicos
          </h2>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-black text-black mb-2">
              TAGS (PALABRAS CLAVE) *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Ej: moderno, roble, comedor"
                className="flex-1 p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addArrayItem('tags', currentTag)
                    setCurrentTag('')
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  addArrayItem('tags', currentTag)
                  setCurrentTag('')
                }}
                className="px-4 py-3 bg-blue-500 border-2 border-black font-bold text-black hover:bg-blue-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {/* Tags añadidos */}
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 border-2 border-blue-300 font-bold"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('tags', index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            {errors.tags && <span className="text-sm text-red-600 font-bold">{errors.tags}</span>}
          </div>

          {/* Herramientas */}
          <div className="mb-6">
            <label className="block text-sm font-black text-black mb-2">
              HERRAMIENTAS REQUERIDAS *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentTool}
                onChange={(e) => setCurrentTool(e.target.value)}
                placeholder="Ej: Sierra circular, taladro, lijadora"
                className="flex-1 p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addArrayItem('toolsRequired', currentTool)
                    setCurrentTool('')
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  addArrayItem('toolsRequired', currentTool)
                  setCurrentTool('')
                }}
                className="px-4 py-3 bg-purple-500 border-2 border-black font-bold text-black hover:bg-purple-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {/* Herramientas añadidas */}
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.toolsRequired.map((tool, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 border-2 border-purple-300 font-bold"
                >
                  {tool}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('toolsRequired', index)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            {errors.toolsRequired && <span className="text-sm text-red-600 font-bold">{errors.toolsRequired}</span>}
          </div>

          {/* Materiales */}
          <div>
            <label className="block text-sm font-black text-black mb-2">
              MATERIALES REQUERIDOS *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentMaterial}
                onChange={(e) => setCurrentMaterial(e.target.value)}
                placeholder="Ej: Madera de roble, tornillos, cola"
                className="flex-1 p-3 border-2 border-black font-bold focus:outline-none focus:bg-yellow-400"
                style={{ boxShadow: '3px 3px 0 #000000' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addArrayItem('materials', currentMaterial)
                    setCurrentMaterial('')
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  addArrayItem('materials', currentMaterial)
                  setCurrentMaterial('')
                }}
                className="px-4 py-3 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {/* Materiales añadidos */}
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.materials.map((material, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 border-2 border-green-300 font-bold"
                >
                  {material}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('materials', index)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            {errors.materials && <span className="text-sm text-red-600 font-bold">{errors.materials}</span>}
          </div>
        </div>

        {/* ACCIONES */}
        <div className="bg-white border-[3px] border-black p-6" style={{ boxShadow: '6px 6px 0 #000000' }}>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-gray-500 border-2 border-black font-bold text-white hover:bg-gray-400 transition-all disabled:opacity-50"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <Save className="h-5 w-5" />
                GUARDAR BORRADOR
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 border-2 border-black font-bold text-black hover:bg-green-400 transition-all disabled:opacity-50"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    ENVIANDO...
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    ENVIAR A REVISIÓN
                  </>
                )}
              </button>
                    </div>
        
                    <Link
                      href="/vendedor/productos"
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-black font-bold text-black hover:bg-yellow-400 transition-all"
                      style={{ boxShadow: '3px 3px 0 #000000' }}
                    >
                      CANCELAR
                    </Link>
                  </div>
                </div>
              </form>
            </div>);}