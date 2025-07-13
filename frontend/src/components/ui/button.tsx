// src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base SABDA styles - bordes gruesos, tipografía bold, sin border-radius
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-black uppercase border-2 border-black transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[0px] active:translate-y-[0px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        // SABDA Variants con colores del sistema
        default: "bg-white text-black hover:bg-gray-100",
        primary: "bg-orange-500 text-black hover:bg-orange-400",
        secondary: "bg-blue-500 text-white hover:bg-blue-400", 
        success: "bg-green-500 text-black hover:bg-green-400",
        danger: "bg-red-500 text-white hover:bg-red-400",
        warning: "bg-yellow-500 text-black hover:bg-yellow-400",
        outline: "bg-transparent text-black hover:bg-gray-100",
        ghost: "bg-transparent text-black hover:bg-gray-100 border-transparent",
        
        // Legacy shadcn variants (mantenemos para compatibilidad)
        destructive: "bg-red-500 text-white hover:bg-red-400",
        link: "bg-transparent text-black hover:bg-gray-100 border-transparent underline hover:no-underline",
      },
      size: {
        sm: "h-8 px-3 py-1 text-xs",
        default: "h-10 px-4 py-2 text-sm", 
        lg: "h-12 px-6 py-3 text-base",
        xl: "h-14 px-8 py-4 text-lg",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Custom hook para aplicar sombra SABDA
const useSABDAStyles = (variant?: string | null, disabled?: boolean) => {
  const getShadowStyle = () => {
    if (disabled) return { boxShadow: 'none' }
    
    switch (variant) {
      case 'ghost':
      case 'link':
        return { boxShadow: 'none' }
      default:
        return { boxShadow: '4px 4px 0 #000000' }
    }
  }

  return {
    style: getShadowStyle(),
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && variant !== 'ghost' && variant !== 'link') {
        e.currentTarget.style.boxShadow = '2px 2px 0 #000000'
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && variant !== 'ghost' && variant !== 'link') {
        e.currentTarget.style.boxShadow = '4px 4px 0 #000000'
      }
    },
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && variant !== 'ghost' && variant !== 'link') {
        e.currentTarget.style.boxShadow = '1px 1px 0 #000000'
      }
    },
    onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && variant !== 'ghost' && variant !== 'link') {
        e.currentTarget.style.boxShadow = '2px 2px 0 #000000'
      }
    }
  }
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, disabled, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const sabdaStyles = useSABDAStyles(variant, disabled)
    
    // Combinar event handlers
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      sabdaStyles.onMouseEnter(e)
      onMouseEnter?.(e)
    }
    
    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      sabdaStyles.onMouseLeave(e)
      onMouseLeave?.(e)
    }
    
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      sabdaStyles.onMouseDown(e)
      onMouseDown?.(e)
    }
    
    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
      sabdaStyles.onMouseUp(e)
      onMouseUp?.(e)
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={{ ...sabdaStyles.style, ...style }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        disabled={disabled}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }