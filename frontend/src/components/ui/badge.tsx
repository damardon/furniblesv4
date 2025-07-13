// src/components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base SABDA styles - bordes gruesos, sin border-radius, tipografía bold
  "inline-flex items-center justify-center px-2 py-1 text-xs font-black uppercase border-2 border-black transition-all duration-150",
  {
    variants: {
      variant: {
        // SABDA Variants con colores del sistema
        default: "bg-gray-200 text-black",
        primary: "bg-orange-500 text-black",
        secondary: "bg-blue-500 text-white",
        success: "bg-green-500 text-black",
        danger: "bg-red-500 text-white",
        warning: "bg-yellow-500 text-black",
        outline: "bg-transparent text-black",
        
        // Colores específicos FURNIBLES
        wood: "bg-orange-500 text-black",
        forest: "bg-green-500 text-black", 
        gold: "bg-yellow-500 text-black",
        
        // Legacy shadcn variants (mantenemos para compatibilidad)
        destructive: "bg-red-500 text-white",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, style, ...props }: BadgeProps) {
  // Aplicar sombra SABDA
  const sabdaStyle: React.CSSProperties = {
    boxShadow: variant === 'outline' ? 'none' : '2px 2px 0 #000000',
    ...style
  }

  return (
    <div 
      className={cn(badgeVariants({ variant, size }), className)} 
      style={sabdaStyle}
      {...props} 
    />
  )
}

export { Badge, badgeVariants }