'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackSrc?: string
  placeholder?: 'blur' | 'empty' | 'skeleton'
  blurDataURL?: string
  priority?: boolean
  quality?: number
  fill?: boolean
  sizes?: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = '/images/placeholder.png',
  placeholder = 'skeleton',
  blurDataURL,
  priority = false,
  quality = 75,
  fill = false,
  sizes,
  style,
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!imgRef.current || priority) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  // Placeholder skeleton component
  const SkeletonPlaceholder = () => (
    <div className={cn(
      'animate-pulse bg-gray-200 rounded',
      fill ? 'absolute inset-0' : '',
      className
    )} style={{ width, height, ...style }} />
  )

  // Generate blur data URL if not provided
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
  }

  const containerClasses = cn(
    'relative overflow-hidden',
    fill ? 'w-full h-full' : '',
    className
  )

  return (
    <div ref={imgRef} className={containerClasses} style={fill ? style : { width, height, ...style }}>
      {/* Mostrar skeleton mientras no esté en vista o esté cargando */}
      {(!isInView || isLoading) && placeholder === 'skeleton' && (
        <SkeletonPlaceholder />
      )}

      {/* Mostrar imagen solo cuando esté en vista */}
      {isInView && (
        <Image
          src={hasError ? fallbackSrc : src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          quality={quality}
          sizes={sizes}
          priority={priority}
          placeholder={placeholder === 'blur' ? 'blur' : 'empty'}
          blurDataURL={placeholder === 'blur' ? getBlurDataURL() : undefined}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            hasError ? 'object-cover' : '',
            fill ? 'object-cover' : ''
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* Indicador de error */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

// Export additional utility component for common use cases
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
  ...props
}: Omit<LazyImageProps, 'width' | 'height'> & { 
  className?: string 
}) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      fill
      className={cn('rounded-lg', className)}
      placeholder="skeleton"
      quality={85}
      priority={priority}
      {...props}
    />
  )
}

export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
  ...props
}: Omit<LazyImageProps, 'width' | 'height' | 'fill'> & {
  size?: number
  className?: string
}) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      placeholder="skeleton"
      quality={85}
      {...props}
    />
  )
}

export function HeroImage({
  src,
  alt,
  className,
  priority = true,
  ...props
}: Omit<LazyImageProps, 'width' | 'height'> & {
  className?: string
}) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      fill
      className={cn('object-cover', className)}
      placeholder="blur"
      quality={95}
      priority={priority}
      sizes="100vw"
      {...props}
    />
  )
}