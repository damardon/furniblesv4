"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
  max?: number
  variant?: "default" | "success" | "warning" | "danger"
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  animated?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value = 0, 
  max = 100, 
  variant = "default",
  size = "md",
  showValue = false,
  animated = false,
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: "h-2",
    md: "h-3", 
    lg: "h-4"
  }

  const variantClasses = {
    default: "bg-primary-600",
    success: "bg-green-600",
    warning: "bg-yellow-600", 
    danger: "bg-red-600"
  }

  return (
    <div className="w-full space-y-2">
      {showValue && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {Math.round(percentage)}%
          </span>
          <span className="text-gray-500">
            {value} / {max}
          </span>
        </div>
      )}
      
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-full bg-gray-200 w-full",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-in-out",
            variantClasses[variant],
            animated && "animate-pulse"
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }