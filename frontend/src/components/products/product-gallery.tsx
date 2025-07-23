'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  X, 
  Download,
  Share2,
  Heart,
  Eye,
  RotateCw,
  Maximize2
} from 'lucide-react'

interface ProductImage {
  id: string
  url: string
  alt: string
  title?: string
  type: 'main' | 'thumbnail' | 'detail' | 'result'
  order: number
}

interface ProductGalleryProps {
  images: ProductImage[]
  productTitle: string
  className?: string
  showThumbnails?: boolean
  showControls?: boolean
  allowZoom?: boolean
  allowFullscreen?: boolean
  showImageInfo?: boolean
  onImageChange?: (index: number) => void
  onFavorite?: () => void
  isFavorited?: boolean
}

export function ProductGallery({
  images,
  productTitle,
  className,
  showThumbnails = true,
  showControls = true,
  allowZoom = true,
  allowFullscreen = true,
  showImageInfo = true,
  onImageChange,
  onFavorite,
  isFavorited = false
}: ProductGalleryProps) {
  const t = useTranslations('product_gallery')
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(true)
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentImage = images[currentIndex]
  const hasMultipleImages = images.length > 1

  useEffect(() => {
    onImageChange?.(currentIndex)
  }, [currentIndex, onImageChange])

  const nextImage = () => {
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev + 1) % images.length)
      resetImageTransform()
    }
  }

  const prevImage = () => {
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
      resetImageTransform()
    }
  }

  const resetImageTransform = () => {
    setZoom(1)
    setRotation(0)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    if (allowZoom && zoom < 3) {
      setZoom(prev => Math.min(prev + 0.5, 3))
    }
  }

  const handleZoomOut = () => {
    if (allowZoom && zoom > 0.5) {
      setZoom(prev => Math.max(prev - 0.5, 0.5))
    }
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const toggleFullscreen = () => {
    if (allowFullscreen) {
      setIsFullscreen(!isFullscreen)
      resetImageTransform()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        prevImage()
        break
      case 'ArrowRight':
        nextImage()
        break
      case 'Escape':
        if (isFullscreen) {
          setIsFullscreen(false)
          resetImageTransform()
        }
        break
      case '+':
      case '=':
        handleZoomIn()
        break
      case '-':
        handleZoomOut()
        break
      case 'r':
        handleRotate()
        break
    }
  }

  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [isFullscreen])

  const handleShare = async () => {
    if (navigator.share && currentImage) {
      try {
        await navigator.share({
          title: productTitle,
          text: t('share_text', { title: productTitle }),
          url: currentImage.url
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard?.writeText(currentImage.url)
      }
    }
  }

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a')
      link.href = currentImage.url
      link.download = `${productTitle}-${currentIndex + 1}.jpg`
      link.click()
    }
  }

  const MainImageDisplay = () => (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-orange-200 to-yellow-200 border-4 border-black",
        isFullscreen ? "w-screen h-screen" : "aspect-square"
      )}
      style={{ boxShadow: isFullscreen ? 'none' : '6px 6px 0 #000000' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-4xl animate-pulse">🖼️</div>
        </div>
      )}

      {/* Main Image */}
      {currentImage && (
        <Image
          ref={imageRef}
          src={currentImage.url}
          alt={currentImage.alt}
          fill
          className={cn(
            "object-contain transition-transform duration-300",
            isDragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-default"
          )}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
            transformOrigin: 'center'
          }}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          priority={currentIndex === 0}
        />
      )}

      {/* Navigation Arrows */}
      {showControls && hasMultipleImages && !isFullscreen && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all z-10"
            style={{ boxShadow: '2px 2px 0 #000000' }}
            aria-label={t('previous_image')}
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all z-10"
            style={{ boxShadow: '2px 2px 0 #000000' }}
            aria-label={t('next_image')}
          >
            <ChevronRight className="w-5 h-5 text-black" />
          </button>
        </>
      )}

      {/* Image Counter */}
      {showImageInfo && hasMultipleImages && (
        <div 
          className="absolute bottom-4 left-4 bg-black text-white px-3 py-1 font-bold text-sm border-2 border-white"
          style={{ boxShadow: '2px 2px 0 #ffffff' }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          {/* Favorite Button */}
          {onFavorite && (
            <button
              onClick={onFavorite}
              className={cn(
                "p-2 border-2 border-black transition-all",
                isFavorited 
                  ? "bg-red-400 text-white" 
                  : "bg-white hover:bg-yellow-400"
              )}
              style={{ boxShadow: '2px 2px 0 #000000' }}
              aria-label={isFavorited ? t('remove_favorite') : t('add_favorite')}
            >
              <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
            </button>
          )}

          {/* Fullscreen Button */}
          {allowFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '2px 2px 0 #000000' }}
              aria-label={t('fullscreen')}
            >
              <Maximize2 className="w-4 h-4 text-black" />
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '2px 2px 0 #000000' }}
            aria-label={t('share')}
          >
            <Share2 className="w-4 h-4 text-black" />
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all"
            style={{ boxShadow: '2px 2px 0 #000000' }}
            aria-label={t('download')}
          >
            <Download className="w-4 h-4 text-black" />
          </button>
        </div>
      )}
    </div>
  )

  const FullscreenView = () => (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Fullscreen Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {allowZoom && (
          <>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '2px 2px 0 #000000' }}
              aria-label={t('zoom_out')}
            >
              <ZoomOut className="w-4 h-4 text-black" />
            </button>
            
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all disabled:opacity-50"
              style={{ boxShadow: '2px 2px 0 #000000' }}
              aria-label={t('zoom_in')}
            >
              <ZoomIn className="w-4 h-4 text-black" />
            </button>
          </>
        )}
        
        <button
          onClick={handleRotate}
          className="p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all"
          style={{ boxShadow: '2px 2px 0 #000000' }}
          aria-label={t('rotate')}
        >
          <RotateCw className="w-4 h-4 text-black" />
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white border-2 border-black hover:bg-yellow-400 transition-all"
          style={{ boxShadow: '2px 2px 0 #000000' }}
          aria-label={t('close_fullscreen')}
        >
          <X className="w-4 h-4 text-black" />
        </button>
      </div>

      {/* Fullscreen Navigation */}
      {hasMultipleImages && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white border-2 border-black hover:bg-yellow-400 transition-all z-10"
            style={{ boxShadow: '3px 3px 0 #000000' }}
            aria-label={t('previous_image')}
          >
            <ChevronLeft className="w-6 h-6 text-black" />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white border-2 border-black hover:bg-yellow-400 transition-all z-10"
            style={{ boxShadow: '3px 3px 0 #000000' }}
            aria-label={t('next_image')}
          >
            <ChevronRight className="w-6 h-6 text-black" />
          </button>
        </>
      )}

      {/* Zoom Level Indicator */}
      {allowZoom && zoom !== 1 && (
        <div 
          className="absolute bottom-4 left-4 bg-white text-black px-3 py-1 font-bold text-sm border-2 border-black"
          style={{ boxShadow: '2px 2px 0 #000000' }}
        >
          {Math.round(zoom * 100)}%
        </div>
      )}

      <MainImageDisplay />
    </div>
  )

  return (
    <>
      <div className={cn("w-full", className)}>
        {/* Main Gallery */}
        <MainImageDisplay />

        {/* Thumbnails */}
        {showThumbnails && hasMultipleImages && !isFullscreen && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => {
                  setCurrentIndex(index)
                  resetImageTransform()
                }}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 border-3 border-black overflow-hidden transition-all",
                  index === currentIndex 
                    ? "ring-2 ring-orange-500 ring-offset-2" 
                    : "hover:scale-105"
                )}
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover"
                />
                {index === currentIndex && (
                  <div className="absolute inset-0 bg-orange-500 bg-opacity-20" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Image Info */}
        {showImageInfo && currentImage?.title && (
          <div 
            className="mt-4 p-3 bg-gray-100 border-3 border-black"
            style={{ boxShadow: '2px 2px 0 #000000' }}
          >
            <p className="font-bold text-black text-sm">{currentImage.title}</p>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && <FullscreenView />}
    </>
  )
}