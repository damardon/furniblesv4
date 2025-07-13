// src/components/ui/card.tsx
import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export function Card({ className = '', style, children }: CardProps) {
  // Aplicar estilo SABDA por defecto
  const sabdaStyle: React.CSSProperties = {
    boxShadow: '5px 5px 0 #000000',
    ...style
  }

  return (
    <div 
      className={cn(
        "bg-white border-2 border-black p-0 transition-all duration-150",
        className
      )}
      style={sabdaStyle}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }: CardProps) {
  return (
    <div className={cn("p-4 border-b-2 border-black", className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children }: CardProps) {
  return (
    <h3 className={cn("text-lg font-black uppercase text-black", className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ className = '', children }: CardProps) {
  return (
    <p className={cn("text-sm font-bold text-gray-600 mt-1", className)}>
      {children}
    </p>
  )
}

export function CardContent({ className = '', children }: CardProps) {
  return (
    <div className={cn("p-4", className)}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children }: CardProps) {
  return (
    <div className={cn("p-4 border-t-2 border-black", className)}>
      {children}
    </div>
  )
}