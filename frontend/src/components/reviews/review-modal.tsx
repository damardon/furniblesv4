'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { 
  StarIcon,
  XIcon,
  ImageIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  UploadIcon,
  TrashIcon
} from 'lucide-react'
import { Product } from '@/types'
import { submitReview } from '@/data/mockReviews'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  product: Product
  onReviewSubmitted?: () => void
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
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Límite de 4 imágenes
    const remainingSlots = 4 - selectedImages.length
    const newFiles = files.slice(0, remainingSlots)
    
    if (newFiles.length > 0) {
      const newPreviews: string[] = []
      newFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          newPreviews.push(e.target?.result as string)
          if (newPreviews.length === newFiles.length) {
            setImagePreviews(prev => [...prev, ...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      })
      
      setSelectedImages(prev => [...prev, ...newFiles])
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    
    if (rating === 0) {
      setErrorMessage('Por favor selecciona una calificación')
      return
    }
    
    if (comment.trim().length < 10) {
      setErrorMessage('El comentario debe tener al menos 10 caracteres')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitReview({
        orderId,
        productId: product.id,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        pros: pros.trim() || undefined,
        cons: cons.trim() || undefined,
        imageFiles: selectedImages
      })

      if (result.success) {
        setShowSuccess(true)
        setTimeout(() => {
          onReviewSubmitted?.()
          handleClose()
        }, 2000)
      } else {
        setErrorMessage(result.message)
      }
    } catch (error) {
      setErrorMessage('Error al enviar la review. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    
    // Reset form
    setRating(0)
    setHoveredRating(0)
    setTitle('')
    setComment('')
    setPros('')
    setCons('')
    setSelectedImages([])
    setImagePreviews([])
    setErrorMessage('')
    setShowSuccess(false)
    
    onClose()
  }

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
          <StarIcon 
            className={`w-8 h-8 ${isActive ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      )
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white border-6 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '8px 8px 0 #000000' }}
      >
        {showSuccess ? (
          // Success State
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-black uppercase mb-4">
              ¡Review Enviada!
            </h2>
            <p className="text-gray-600 font-bold">
              Tu review ha sido enviada exitosamente y será publicada una vez aprobada.
            </p>
          </div>
        ) : (
          // Form State
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
                <XIcon className="w-6 h-6 text-black" />
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
                    {rating > 0 && (
                      rating === 1 ? 'Muy malo' :
                      rating === 2 ? 'Malo' :
                      rating === 3 ? 'Regular' :
                      rating === 4 ? 'Bueno' : 'Excelente'
                    )}
                  </span>
                </div>
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
                <div className="text-right text-xs text-gray-500 font-bold mt-1">
                  {comment.length}/1000 {comment.length < 10 && '(mínimo 10 caracteres)'}
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
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-black font-black text-sm uppercase mb-2">
                  📸 Fotos del Resultado (Opcional)
                </label>
                <p className="text-xs text-gray-600 font-bold mb-3">
                  Sube fotos del mueble terminado para ayudar a otros compradores
                </p>
                
                {/* Upload Area */}
                {selectedImages.length < 4 && (
                  <label className="block w-full p-6 border-3 border-dashed border-black hover:bg-yellow-100 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      disabled={isSubmitting}
                      className="hidden"
                    />
                    <div className="text-center">
                      <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-black font-bold text-sm">
                        Haz clic para subir imágenes
                      </p>
                      <p className="text-xs text-gray-500 font-bold">
                        PNG, JPG hasta 5MB c/u (máx. 4 fotos)
                      </p>
                    </div>
                  </label>
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div 
                        key={index}
                        className="relative aspect-square border-3 border-black overflow-hidden"
                      >
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={isSubmitting}
                          className="absolute top-1 right-1 p-1 bg-red-500 border-2 border-black text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                          style={{ boxShadow: '2px 2px 0 #000000' }}
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div 
                  className="bg-red-100 border-3 border-red-500 p-4 flex items-center gap-3"
                  style={{ boxShadow: '3px 3px 0 #000000' }}
                >
                  <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
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
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
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