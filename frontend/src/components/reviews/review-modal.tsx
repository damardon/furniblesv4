'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { 
  Star,
  X,
  CheckCircle,
  AlertCircle,
  Upload,
  Trash
} from 'lucide-react'
import { FileUpload } from '../upload/file-upload'
import { useAuthStore } from '@/lib/stores/auth-store'

// ✅ Tipos coherentes con backend
interface Product {
  id: string
  title: string
  slug: string
  imageFileIds: string[]
  seller?: {
    id: string
    firstName: string
    lastName: string
    sellerProfile?: {
      storeName: string
      slug: string
    }
  }
}

interface UploadedFile {
  id: string
  filename: string
  url: string
  type: string
}

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  product: Product
  onReviewSubmitted?: () => void
}

// ✅ Helper para obtener token de autenticación
const getAuthToken = (): string | null => {
  try {
    const authData = localStorage.getItem('furnibles-auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed.state?.token || parsed.token
    }
  } catch (error) {
    console.error('Error parsing auth token:', error)
  }
  return null
}

export function ReviewModal({ 
  isOpen, 
  onClose, 
  orderId, 
  orderNumber, 
  product, 
  onReviewSubmitted 
}: ReviewModalProps) {
  const t = useTranslations('reviews')
  const { user } = useAuthStore()
  
  // Form states
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Image upload states
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([])

  // ✅ Manejar archivos subidos
  const handleFilesUploaded = (files: UploadedFile[]) => {
    console.log('🔍 [REVIEW-MODAL] Files uploaded:', files.length)
    setUploadedImages(files)
  }

  // ✅ Enviar review a API real
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    
    // Validaciones básicas
    if (rating === 0) {
      setErrorMessage('Por favor selecciona una calificación')
      return
    }
    
    if (comment.trim().length < 10) {
      setErrorMessage('El comentario debe tener al menos 10 caracteres')
      return
    }

    if (!user) {
      setErrorMessage('Debes iniciar sesión para enviar una review')
      return
    }

    setIsSubmitting(true)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No autorizado')
      }

      console.log('🔍 [REVIEW-MODAL] Submitting review:', {
        orderId,
        productId: product.id,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        pros: pros.trim() || undefined,
        cons: cons.trim() || undefined,
        imageFileIds: uploadedImages.map(img => img.id)
      })

      // ✅ API call para crear review
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          productId: product.id,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          pros: pros.trim() || undefined,
          cons: cons.trim() || undefined,
          imageFileIds: uploadedImages.map(img => img.id)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ [REVIEW-MODAL] Review submitted successfully:', result)

      setShowSuccess(true)
      setTimeout(() => {
        onReviewSubmitted?.()
        handleClose()
      }, 2500)

    } catch (error) {
      console.error('❌ [REVIEW-MODAL] Error submitting review:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Error al enviar la review. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ Cerrar modal y resetear form
  const handleClose = () => {
    if (isSubmitting) return
    
    // Reset form
    setRating(0)
    setHoveredRating(0)
    setTitle('')
    setComment('')
    setPros('')
    setCons('')
    setUploadedImages([])
    setErrorMessage('')
    setShowSuccess(false)
    
    onClose()
  }

  // ✅ Renderizar estrellas interactivas
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      const isActive = starValue <= (hoveredRating || rating)
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="transition-all duration-200 hover:scale-110"
          disabled={isSubmitting}
        >
          <Star 
            className={`w-8 h-8 ${isActive ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      )
    })
  }

  // ✅ Obtener texto descriptivo del rating
  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Muy malo'
      case 2: return 'Malo'
      case 3: return 'Regular'
      case 4: return 'Bueno'
      case 5: return 'Excelente'
      default: return ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white border-6 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '8px 8px 0 #000000' }}
      >
        {showSuccess ? (
          // ✅ Estado de éxito
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-black uppercase mb-4">
              ¡Review Enviada!
            </h2>
            <p className="text-gray-600 font-bold mb-2">
              Tu review ha sido enviada exitosamente y será publicada una vez aprobada por nuestro equipo.
            </p>
            <p className="text-sm text-gray-500 font-medium">
              Te notificaremos cuando esté disponible públicamente.
            </p>
          </div>
        ) : (
          // ✅ Estado del formulario
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-4 border-black">
              <h2 className="text-2xl font-black text-black uppercase">
                Escribir Review
              </h2>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6 text-black" />
              </button>
            </div>

            {/* Product Info */}
            <div 
              className="p-6 bg-gray-50 border-b-4 border-black flex gap-4"
              style={{ borderTop: 'none' }}
            >
              <div className="relative w-20 h-20 border-3 border-black overflow-hidden">
                {product.imageFileIds?.[0] ? (
                  <Image
                    src={product.imageFileIds[0]}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
                    <span className="text-2xl">🪵</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-black text-black uppercase line-clamp-2 mb-1">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-600 font-bold mb-2">
                  {product.seller?.sellerProfile?.storeName || 
                   `${product.seller?.firstName} ${product.seller?.lastName}`}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-blue-200 text-black px-2 py-1 border border-black font-black uppercase">
                    Pedido: {orderNumber}
                  </span>
                  <span className="bg-green-200 text-black px-2 py-1 border border-black font-black uppercase">
                    ✓ Compra Verificada
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-black font-black text-sm uppercase mb-3">
                  Calificación *
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {renderStars()}
                  <span className="ml-2 font-bold text-black">
                    {getRatingText()}
                  </span>
                </div>
                {rating === 0 && (
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Selecciona una calificación del 1 al 5
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-black font-black text-sm uppercase mb-2">
                  Título (Opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  placeholder="Resumen de tu experiencia"
                />
                <div className="text-right text-xs text-gray-500 font-bold mt-1">
                  {title.length}/100
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-black font-black text-sm uppercase mb-2">
                  Comentario *
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50 resize-none"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                  placeholder="Comparte tu experiencia construyendo este mueble. ¿Cómo fueron las instrucciones? ¿El resultado final?"
                />
                <div className="flex justify-between text-xs text-gray-500 font-bold mt-1">
                  <span>{comment.length < 10 ? 'Mínimo 10 caracteres' : ''}</span>
                  <span>{comment.length}/1000</span>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-black font-black text-sm uppercase mb-2">
                    👍 Aspectos Positivos
                  </label>
                  <textarea
                    value={pros}
                    onChange={(e) => setPros(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                    maxLength={300}
                    className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50 resize-none"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                    placeholder="¿Qué te gustó más?"
                  />
                  <div className="text-right text-xs text-gray-500 font-bold mt-1">
                    {pros.length}/300
                  </div>
                </div>
                
                <div>
                  <label className="block text-black font-black text-sm uppercase mb-2">
                    👎 Aspectos a Mejorar
                  </label>
                  <textarea
                    value={cons}
                    onChange={(e) => setCons(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                    maxLength={300}
                    className="w-full px-4 py-3 bg-white border-3 border-black font-bold focus:outline-none focus:bg-yellow-400 transition-all disabled:opacity-50 resize-none"
                    style={{ boxShadow: '3px 3px 0 #000000' }}
                    placeholder="¿Qué podría mejorarse?"
                  />
                  <div className="text-right text-xs text-gray-500 font-bold mt-1">
                    {cons.length}/300
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-black font-black text-sm uppercase mb-2">
                  📸 Fotos del Resultado (Opcional)
                </label>
                <p className="text-xs text-gray-600 font-bold mb-3">
                  Sube fotos del mueble terminado para ayudar a otros compradores (máx. 4 fotos)
                </p>
                
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  maxFiles={4}
                  maxSizePerFile={5}
                  acceptedTypes={['.jpg', '.jpeg', '.png', '.gif']}
                  allowMultiple={true}
                  showPreview={true}
                  uploadType="REVIEW_IMAGE"
                  className="border-2 border-gray-300 rounded p-4"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div 
                  className="bg-red-100 border-3 border-red-500 p-4 flex items-center gap-3"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 font-bold text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t-3 border-black">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-white border-3 border-black font-black text-black uppercase hover:bg-gray-100 transition-all disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
                  className="px-6 py-3 bg-green-500 border-3 border-black font-black text-white uppercase hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Review'
                  )}
                </button>
              </div>

              {/* Guidelines */}
              <div 
                className="bg-blue-100 border-3 border-blue-500 p-4 text-sm"
                style={{ boxShadow: '3px 3px 0 #000000' }}
              >
                <h4 className="font-black text-black uppercase mb-2">📝 Consejos para una buena review:</h4>
                <ul className="space-y-1 text-blue-800 font-medium">
                  <li>• Describe tu experiencia construyendo el mueble</li>
                  <li>• Menciona la claridad de las instrucciones</li>
                  <li>• Comenta sobre la calidad del resultado final</li>
                  <li>• Incluye fotos del producto terminado si es posible</li>
                  <li>• Se honesto y constructivo en tus comentarios</li>
                </ul>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}